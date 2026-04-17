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
      .from('posts').select('*').eq('id', post_id).single()
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    let { data: account } = await supabase
      .from('social_accounts').select('*')
      .eq('platform', 'facebook').eq('is_connected', true)
      .eq('client_id', post.client_id).maybeSingle()

    if (!account) {
      const { data: fallback } = await supabase
        .from('social_accounts').select('*')
        .eq('platform', 'facebook').eq('is_connected', true)
        .limit(1).single()
      account = fallback
    }

    if (!account?.access_token) {
      return NextResponse.json({ error: 'No connected Facebook Page found' }, { status: 400 })
    }

    const pageToken = account.access_token
    const pageId = account.account_id
    const caption = post.caption || post.content || ''

    // Get media if any
    const { data: mediaFiles } = await supabase
      .from('post_media').select('*').eq('post_id', post_id).order('sort_order')

    const imageUrl = mediaFiles?.[0]?.storage_path || null

    // Post to Facebook Page feed
    const body: any = { message: caption, access_token: pageToken }
    if (imageUrl) body.link = imageUrl

    const endpoint = imageUrl
      ? `https://graph.facebook.com/v18.0/${pageId}/photos`
      : `https://graph.facebook.com/v18.0/${pageId}/feed`

    const publishBody: any = imageUrl
      ? { caption, url: imageUrl, access_token: pageToken }
      : { message: caption, access_token: pageToken }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(publishBody),
    })
    const data = await res.json()

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 })
    }

    await supabase.from('posts')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', post_id)

    return NextResponse.json({ success: true, facebook_post_id: data.id })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}