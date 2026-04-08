import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('client_id')
  if (!clientId) return NextResponse.json({ error: 'client_id required' }, { status: 400 })

  const appId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID!
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/instagram`

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: 'pages_show_list,instagram_basic,instagram_content_publish,instagram_manage_comments',
    response_type: 'code',
    state: clientId,
  })

  return NextResponse.redirect(
    `https://www.facebook.com/dialog/oauth?${params.toString()}`
  )
}
