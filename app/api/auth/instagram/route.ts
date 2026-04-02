import { NextResponse } from "next/server"

export async function GET() {
  const appId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID
  const redirectUri = "http://localhost:3000/api/auth/instagram/callback"
  const scope = "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement"
  const url = "https://www.facebook.com/v18.0/dialog/oauth?" +
    "client_id=" + appId +
    "&redirect_uri=" + encodeURIComponent(redirectUri) +
    "&scope=" + scope +
    "&response_type=code"
  return NextResponse.redirect(url)
}
