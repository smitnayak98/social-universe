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
      .from('posts').select('*').eq('status', 'scheduled').lte('scheduled_at', now)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!posts || posts.length === 0) {
      return NextResponse.json({ message: 'No posts to publish', count: 0 })
    }

    const results = []

    for (const post of posts) {
      const platforms: string[] = Array.isArray(post.platforms) && post.platforms.length > 0
        ? post.platforms
        : post.platform ? [post.platform] : ['instagram']

      const postResults: Record<string, string> = {}

      if (platforms.includes('instagram')) {
        try {
          let { data: igAccount } = await supabase
            .from('social_accounts').select('*')
            .eq('platform', 'instagram').eq('is_connected', true)
            .not('access_token', 'is', null).eq('client_id', post.client_id).maybeSingle()

          if (!igAccount) {
            const { data: fallback } = await supabase
              .from('social_accounts').select('*')
              .eq('platform', 'instagram').eq('is_connected', true)
              .not('access_token', 'is', null).limit(1).single()
            igAccount = fallback
          }

          if (!igAccount?.access_token) {
            postResults.instagram = 'failed:no_account'
          } else {
            const { data: mediaFiles } = await supabase
              .from('post_media').select('*').eq('post_id', post.id).order('sort_order')

            if (!mediaFiles || mediaFiles.length === 0) {
              postResults.instagram = 'failed:no_media'
            } else {
              const imageUrl = mediaFiles[0].storage_path
              const isVideo = mediaFiles[0].media_type === 'video'
              const containerRes = await fetch(
                `https://graph.instagram.com/v18.0/${igAccount.account_id}/media`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ...(isVideo ? { video_url: imageUrl, media_type: 'REELS' } : { image_url: imageUrl }),
                    caption: post.caption || post.content || '',
                    access_token: igAccount.access_token,
                  }),
                }
              )
              const containerData = await containerRes.json()
              if (containerData.error) {
                postResults.instagram = `failed:${containerData.error.message}`
              } else {
                if (isVideo) await new Promise(r => setTimeout(r, 5000))
                const publishRes = await fetch(
                  `https://graph.instagram.com/v18.0/${igAccount.account_id}/media_publish`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ creation_id: containerData.id, access_token: igAccount.access_token }),
                  }
                )
                const publishData = await publishRes.json()
                postResults.instagram = publishData.error
                  ? `failed:${publishData.error.message}`
                  : `published:${publishData.id}`
              }
            }
          }
        } catch (err: any) {
          postResults.instagram = `error:${err.message}`
        }
      }

      if (platforms.includes('facebook')) {
        try {
          let { data: fbAccount } = await supabase
            .from('social_accounts').select('*')
            .eq('platform', 'facebook').eq('is_connected', true)
            .not('access_token', 'is', null).eq('client_id', post.client_id).maybeSingle()

          if (!fbAccount) {
            const { data: fallback } = await supabase
              .from('social_accounts').select('*')
              .eq('platform', 'facebook').eq('is_connected', true)
              .not('access_token', 'is', null).limit(1).single()
            fbAccount = fallback
          }

          if (!fbAccount?.access_token) {
            postResults.facebook = 'failed:no_account'
          } else {
            const { data: mediaFiles } = await supabase
              .from('post_media').select('*').eq('post_id', post.id).order('sort_order')

            const message = post.caption || post.content || ''
            let fbRes

            if (mediaFiles && mediaFiles.length > 0) {
              const imageUrl = mediaFiles[0].storage_path
              const isVideo = mediaFiles[0].media_type === 'video'
              fbRes = await fetch(
                `https://graph.facebook.com/v18.0/${fbAccount.account_id}/${isVideo ? 'videos' : 'photos'}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ...(isVideo ? { file_url: imageUrl, description: message } : { url: imageUrl, caption: message }),
                    access_token: fbAccount.access_token,
                  }),
                }
              )
            } else {
              fbRes = await fetch(`https://graph.facebook.com/v18.0/${fbAccount.account_id}/feed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, access_token: fbAccount.access_token }),
              })
            }

            const fbData = await fbRes.json()
            postResults.facebook = fbData.error
              ? `failed:${fbData.error.message}`
              : `published:${fbData.id || fbData.post_id}`
          }
        } catch (err: any) {
          postResults.facebook = `error:${err.message}`
        }
      }

      const anyPublished = Object.values(postResults).some(r => r.startsWith('published'))
      await supabase.from('posts').update({
        status: anyPublished ? 'published' : 'failed',
        ...(anyPublished ? { published_at: new Date().toISOString() } : {}),
      }).eq('id', post.id)

      results.push({ post_id: post.id, status: anyPublished ? 'published' : 'failed', platforms: postResults })
    }

    return NextResponse.json({ success: true, processed: results.length, results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
