import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const clientId = req.nextUrl.searchParams.get('state')
  const error = req.nextUrl.searchParams.get('error')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  if (error) {
    return NextResponse.redirect(`${appUrl}/social-accounts?error=instagram_denied`)
  }

  if (!code || !clientId) {
    return NextResponse.redirect(`${appUrl}/social-accounts?error=missing_params`)
  }

  try {
    const appId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID!
    const appSecret = process.env.INSTAGRAM_APP_SECRET!
    const redirectUri = `${appUrl}/api/auth/callback/instagram`

    // Exchange code for short-lived token
    const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
      }),
    })
    const tokenData = await tokenRes.json()
    if (tokenData.error_type) {
      return NextResponse.redirect(`${appUrl}/social-accounts?error=token_exchange_failed`)
    }

    const shortToken = tokenData.access_token
    const igUserId = tokenData.user_id

    // Exchange for long-lived token
    const longRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${shortToken}`
    )
    const longData = await longRes.json()
    const longToken = longData.access_token || shortToken
    const expiresIn = longData.expires_in || 5184000

    // Get Instagram username
    const profileRes = await fetch(
      `https://graph.instagram.com/v18.0/${igUserId}?fields=id,username&access_token=${longToken}`
    )
    const profile = await profileRes.json()

    // Save to Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: dbError } = await supabase
      .from('social_accounts')
      .upsert({
        client_id: clientId,
        platform: 'instagram',
        account_id: String(igUserId),
        account_name: profile.username || String(igUserId),
        access_token: longToken,
        token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
        is_connected: true,
      }, {
        onConflict: 'client_id,platform'
      })

    if (dbError) {
      console.error('DB error:', dbError)
      return NextResponse.redirect(`${appUrl}/social-accounts?error=db_error`)
    }

    return NextResponse.redirect(`${appUrl}/social-accounts?success=instagram_connected`)
  } catch (err: any) {
    console.error('OAuth error:', err)
    return NextResponse.redirect(`${appUrl}/social-accounts?error=oauth_failed`)
  }
}
