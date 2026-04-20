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

    const { data: post } = await supabase
      .from('posts').select('*, clients(name)').eq('id', post_id).single()
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

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

    // Use stored Instagram Business Account ID directly
    const igUserId = account.account_id
    const token = account.access_token

    if (!igUserId) {
      return NextResponse.json({ error: 'No Instagram Business account ID found. Please reconnect Instagram.' }, { status: 400 })
    }

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
    if (containerData.error) {
      return NextResponse.json({ error: containerData.error.message }, { status: 400 })
    }

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
    if (publishData.error) {
      return NextResponse.json({ error: publishData.error.message }, { status: 400 })
    }

    await supabase.from('posts')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', post_id)

    return NextResponse.json({ success: true, instagram_post_id: publishData.id })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}