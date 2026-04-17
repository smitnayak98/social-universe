import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('client_id')
  if (!clientId) return NextResponse.json({ error: 'client_id required' }, { status: 400 })

  const appId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID!
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/facebook`

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: 'public_profile,pages_show_list,pages_read_engagement,pages_manage_posts',
    response_type: 'code',
    state: clientId,
  })

  const response = NextResponse.redirect(
    `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`
  )

  response.cookies.set('oauth_client_id', clientId, {
    httpOnly: true,
    secure: true,
    maxAge: 600,
    path: '/',
  })

  return response
}