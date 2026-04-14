import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  if (error) {
    return NextResponse.redirect(`${appUrl}/social-accounts?error=instagram_denied`)
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/social-accounts?error=missing_code`)
  }

  // Get clientId from state param OR cookie fallback
  const clientId = req.nextUrl.searchParams.get('state') 
    || req.cookies.get('oauth_client_id')?.value

  if (!clientId) {
    return NextResponse.redirect(`${appUrl}/social-accounts?error=missing_client_id`)
  }

  try {
    const appId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID!
    const appSecret = process.env.INSTAGRAM_APP_SECRET!
    const redirectUri = `${appUrl}/api/auth/callback/instagram`

    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
    )
    const tokenData = await tokenRes.json()

    if (tokenData.error) {
      console.error('Token error:', JSON.stringify(tokenData))
      return NextResponse.redirect(`${appUrl}/social-accounts?error=token_exchange_failed`)
    }

    const userToken = tokenData.access_token

    const profileRes = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${userToken}`
    )
    const profile = await profileRes.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: dbError } = await supabase
      .from('social_accounts')
      .upsert({
        client_id: clientId,
        platform: 'instagram',
        account_id: String(profile.id),
        account_name: profile.name || String(profile.id),
        access_token: userToken,
        token_expires_at: null,
        is_connected: true,
      }, { onConflict: 'client_id,platform' })

    if (dbError) {
      console.error('DB error:', dbError)
      return NextResponse.redirect(`${appUrl}/social-accounts?error=db_error`)
    }

    const redirectRes = NextResponse.redirect(`${appUrl}/social-accounts?success=instagram_connected`)
    redirectRes.cookies.delete('oauth_client_id')
    return redirectRes

  } catch (err: any) {
    console.error('OAuth error:', err)
    return NextResponse.redirect(`${appUrl}/social-accounts?error=oauth_failed`)
  }
}
