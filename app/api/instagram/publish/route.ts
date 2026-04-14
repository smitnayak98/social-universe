import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { post_id } = await req.json()
    if (!post_id) return NextResponse.json({ error: 'post_id required' }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: post, error: postError } = await supabase
      .from('posts').select('*, clients(name)').eq('id', post_id).single()

    if (postError || !post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    // Get client-specific account
    let { data: account } = await supabase
      .from('social_accounts').select('*')
      .eq('platform', 'instagram').eq('is_connected', true)
      .not('access_token', 'is', null).eq('client_id', post.client_id).maybeSingle()

    if (!account) {
      const { data: fallback } = await supabase
        .from('social_accounts').select('*')
        .eq('platform', 'instagram').eq('is_connected', true)
        .not('access_token', 'is', null).limit(1).single()
      account = fallback
    }

    if (!account?.access_token) {
      return NextResponse.json({ error: 'No connected Instagram account found' }, { status: 400 })
    }

    const token = account.access_token

    // Get Instagram Business Account ID via Facebook Graph API
    const pagesRes = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=instagram_business_account{id,username}&access_token=${token}`
    )
    const pagesData = await pagesRes.json()
    const pages = pagesData.data || []

    let igUserId = null
    for (const page of pages) {
      if (page.instagram_business_account) {
        igUserId = page.instagram_business_account.id
        break
      }
    }

    if (!igUserId) {
      return NextResponse.json({ 
        error: 'No Instagram Business account found. Please connect a Facebook Page that has an Instagram Business account linked.' 
      }, { status: 400 })
    }

    // Get media files
    const { data: mediaFiles } = await supabase
      .from('post_media').select('*').eq('post_id', post_id).order('sort_order')

    if (!mediaFiles || mediaFiles.length === 0) {
      return NextResponse.json({ error: 'Instagram requires at least one image or video.' }, { status: 400 })
    }

    const imageUrl = mediaFiles[0].storage_path
    const isVideo = mediaFiles[0].media_type === 'video'
    const caption = post.caption || post.content || ''

    // Step 1: Create media container
    const containerRes = await fetch(
      `https://graph.facebook.com/v18.0/${igUserId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isVideo ? { video_url: imageUrl, media_type: 'REELS' } : { image_url: imageUrl }),
          caption,
          access_token: token,
        }),
      }
    )
    const containerData = await containerRes.json()
    if (containerData.error) return NextResponse.json({ error: containerData.error.message }, { status: 400 })

    if (isVideo) await new Promise(r => setTimeout(r, 5000))

    // Step 2: Publish
    const publishRes = await fetch(
      `https://graph.facebook.com/v18.0/${igUserId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: containerData.id, access_token: token }),
      }
    )
    const publishData = await publishRes.json()
    if (publishData.error) return NextResponse.json({ error: publishData.error.message }, { status: 400 })

    await supabase.from('posts')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', post_id)

    return NextResponse.json({
      success: true,
      instagram_post_id: publishData.id,
      message: 'Post published to Instagram successfully!'
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
