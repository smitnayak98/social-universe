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

    let { data: account } = await supabase
      .from('social_accounts').select('*')
      .eq('platform', 'facebook').eq('is_connected', true)
      .not('access_token', 'is', null).eq('client_id', post.client_id).maybeSingle()

    if (!account) {
      const { data: fallback } = await supabase
        .from('social_accounts').select('*')
        .eq('platform', 'facebook').eq('is_connected', true)
        .not('access_token', 'is', null).limit(1).single()
      account = fallback
    }

    if (!account?.access_token) {
      return NextResponse.json({ error: 'No connected Facebook Page found for this client' }, { status: 400 })
    }

    const pageId = account.account_id
    const pageToken = account.access_token
    const message = post.caption || post.content || ''

    const { data: mediaFiles } = await supabase
      .from('post_media').select('*').eq('post_id', post_id).order('sort_order')

    let result
    if (mediaFiles && mediaFiles.length > 0) {
      const imageUrl = mediaFiles[0].storage_path
      const isVideo = mediaFiles[0].media_type === 'video'
      const res = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/${isVideo ? 'videos' : 'photos'}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...(isVideo ? { file_url: imageUrl, description: message } : { url: imageUrl, caption: message }),
            access_token: pageToken,
          }),
        }
      )
      result = await res.json()
    } else {
      const res = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, access_token: pageToken }),
      })
      result = await res.json()
    }

    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 })

    await supabase.from('posts')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', post_id)

    return NextResponse.json({
      success: true,
      facebook_post_id: result.id || result.post_id,
      page_name: account.account_name,
      message: `Post published to "${account.account_name}" successfully!`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
