import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  if (error) {
    return NextResponse.redirect(`${appUrl}/social-accounts?error=facebook_denied`)
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/social-accounts?error=missing_code`)
  }

  const clientId = req.nextUrl.searchParams.get('state')
    || req.cookies.get('oauth_client_id')?.value

  if (!clientId) {
    return NextResponse.redirect(`${appUrl}/social-accounts?error=missing_client_id`)
  }

  try {
    const appId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID!
    const appSecret = process.env.INSTAGRAM_APP_SECRET!
    const redirectUri = `${appUrl}/api/auth/callback/facebook`

    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
    )
    const tokenData = await tokenRes.json()

    if (tokenData.error) {
      console.error('FB token error:', tokenData)
      return NextResponse.redirect(`${appUrl}/social-accounts?error=token_failed`)
    }

    const userToken = tokenData.access_token

    const pagesRes = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${userToken}`
    )
    const pagesData = await pagesRes.json()
    const pages = pagesData.data || []

    if (pages.length === 0) {
      return NextResponse.redirect(`${appUrl}/social-accounts?error=no_pages`)
    }

    const page = pages[0]
    const pageToken = page.access_token
    const pageId = page.id
    const pageName = page.name

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: dbError } = await supabase
      .from('social_accounts')
      .upsert({
        client_id: clientId,
        platform: 'facebook',
        account_id: pageId,
        account_name: pageName,
        access_token: pageToken,
        token_expires_at: null,
        is_connected: true,
      }, { onConflict: 'client_id,platform' })

    if (dbError) {
      console.error('DB error:', dbError)
      return NextResponse.redirect(`${appUrl}/social-accounts?error=db_error`)
    }

    const redirectRes = NextResponse.redirect(`${appUrl}/social-accounts?success=facebook_connected`)
    redirectRes.cookies.delete('oauth_client_id')
    return redirectRes

  } catch (err: any) {
    console.error('Facebook OAuth error:', err)
    return NextResponse.redirect(`${appUrl}/social-accounts?error=oauth_failed`)
  }
}