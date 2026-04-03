import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const clientId = req.nextUrl.searchParams.get('state')
  const error = req.nextUrl.searchParams.get('error')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  if (error) {
    return NextResponse.redirect(`${appUrl}/social-accounts?error=facebook_denied`)
  }

  if (!code || !clientId) {
    return NextResponse.redirect(`${appUrl}/social-accounts?error=missing_params`)
  }

  try {
    const appId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID!
    const appSecret = process.env.INSTAGRAM_APP_SECRET!
    const redirectUri = `${appUrl}/api/auth/callback/facebook`

    // Exchange code for user token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
    )
    const tokenData = await tokenRes.json()
    if (tokenData.error) {
      return NextResponse.redirect(`${appUrl}/social-accounts?error=token_failed`)
    }

    const userToken = tokenData.access_token

    // Get Facebook Pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${userToken}`
    )
    const pagesData = await pagesRes.json()
    const pages = pagesData.data || []

    if (pages.length === 0) {
      return NextResponse.redirect(`${appUrl}/social-accounts?error=no_pages`)
    }

    // Use the first page
    const page = pages[0]
    const pageToken = page.access_token
    const pageId = page.id
    const pageName = page.name

    // Save to Supabase
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
      }, {
        onConflict: 'client_id,platform'
      })

    if (dbError) {
      return NextResponse.redirect(`${appUrl}/social-accounts?error=db_error`)
    }

    return NextResponse.redirect(`${appUrl}/social-accounts?success=facebook_connected`)
  } catch (err: any) {
    console.error('Facebook OAuth error:', err)
    return NextResponse.redirect(`${appUrl}/social-accounts?error=oauth_failed`)
  }
}
