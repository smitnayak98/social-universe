import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const now = new Date().toISOString()

    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!posts || posts.length === 0) {
      return NextResponse.json({ message: 'No posts to publish', count: 0 })
    }

    const results = []

    for (const post of posts) {
      try {
        const { data: account } = await supabase
          .from('social_accounts')
          .select('*')
          .eq('platform', 'instagram')
          .eq('is_connected', true)
          .not('access_token', 'is', null)
          .single()

        if (!account?.access_token) {
          results.push({ post_id: post.id, status: 'failed', reason: 'No Instagram account' })
          continue
        }

        const { data: mediaFiles } = await supabase
          .from('post_media')
          .select('*')
          .eq('post_id', post.id)
          .order('sort_order')

        if (!mediaFiles || mediaFiles.length === 0) {
          await supabase.from('posts').update({ status: 'failed' }).eq('id', post.id)
          results.push({ post_id: post.id, status: 'failed', reason: 'No media' })
          continue
        }

        const imageUrl = mediaFiles[0].storage_path
        const isVideo = mediaFiles[0].media_type === 'video'
        const igUserId = account.account_id
        const token = account.access_token

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
        if (containerData.error) {
          await supabase.from('posts').update({ status: 'failed' }).eq('id', post.id)
          results.push({ post_id: post.id, status: 'failed', reason: containerData.error.message })
          continue
        }

        if (isVideo) await new Promise(r => setTimeout(r, 5000))

        const publishRes = await fetch(
          `https://graph.instagram.com/v18.0/${igUserId}/media_publish`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              creation_id: containerData.id,
              access_token: token,
            }),
          }
        )

        const publishData = await publishRes.json()
        if (publishData.error) {
          await supabase.from('posts').update({ status: 'failed' }).eq('id', post.id)
          results.push({ post_id: post.id, status: 'failed', reason: publishData.error.message })
          continue
        }

        await supabase.from('posts').update({
          status: 'published',
          published_at: new Date().toISOString(),
        }).eq('id', post.id)

        results.push({ post_id: post.id, status: 'published', instagram_id: publishData.id })

      } catch (err: any) {
        results.push({ post_id: post.id, status: 'error', reason: err.message })
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
