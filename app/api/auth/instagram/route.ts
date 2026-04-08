import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('client_id')
  if (!clientId) return NextResponse.json({ error: 'client_id required' }, { status: 400 })

  const appId = '918340494293733'
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/instagram`

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: 'instagram_business_basic,instagram_content_publish,instagram_manage_comments',
    response_type: 'code',
    state: clientId,
  })

  return NextResponse.redirect(
    `https://www.instagram.com/oauth/authorize?${params.toString()}`
  )
}
