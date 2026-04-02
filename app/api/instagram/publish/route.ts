import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(req: NextRequest) {
  try {
    const { post_id } = await req.json()
    if (!post_id) return NextResponse.json({ error: 'post_id required' }, { status: 400 })

    const supabase = createClient()

    // Get the post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*, clients(name)')
      .eq('id', post_id)
      .single()

    if (postError || !post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    // Get instagram social account with access token
    const { data: account } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('platform', 'instagram')
      .eq('is_connected', true)
      .single()

    if (!account?.access_token) {
      return NextResponse.json({ error: 'No connected Instagram account found' }, { status: 400 })
    }

    const token = account.access_token
    const igUserId = account.account_id

    // Get media files for this post
    const { data: mediaFiles } = await supabase
      .from('post_media')
      .select('*')
      .eq('post_id', post_id)
      .order('position')

    let mediaId: string

    if (mediaFiles && mediaFiles.length > 0) {
      // Post with image
      const imageUrl = mediaFiles[0].media_url
      const isVideo = mediaFiles[0].media_type === 'video'

      // Step 1: Create media container
      const containerRes = await fetch(
        `https://graph.instagram.com/v18.0/${igUserId}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...(isVideo
              ? { video_url: imageUrl, media_type: 'REELS' }
              : { image_url: imageUrl }),
            caption: post.caption || post.content || '',
            access_token: token,
          }),
        }
      )
      const containerData = await containerRes.json()
      if (containerData.error) return NextResponse.json({ error: containerData.error.message }, { status: 400 })
      mediaId = containerData.id

      // For videos, wait for processing
      if (isVideo) {
        await new Promise(r => setTimeout(r, 5000))
      }
    } else {
      // Text only - Instagram doesn't support text-only posts via API
      // Use a placeholder or return error
      return NextResponse.json({
        error: 'Instagram requires at least one image or video. Please add media to this post.'
      }, { status: 400 })
    }

    // Step 2: Publish the container
    const publishRes = await fetch(
      `https://graph.instagram.com/v18.0/${igUserId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: mediaId,
          access_token: token,
        }),
      }
    )
    const publishData = await publishRes.json()
    if (publishData.error) return NextResponse.json({ error: publishData.error.message }, { status: 400 })

    // Step 3: Update post status in DB
    await supabase
      .from('posts')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
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
