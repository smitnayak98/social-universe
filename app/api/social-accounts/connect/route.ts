import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { client_id, platform, access_token } = await req.json()
    if (!client_id || !platform || !access_token) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let accountName = ''
    let accountId = ''
    let finalToken = access_token

    if (platform === 'facebook') {
      const pagesRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${access_token}`)
      const pagesData = await pagesRes.json()
      if (!pagesData.error && pagesData.data?.length > 0) {
        const page = pagesData.data[0]
        accountId = page.id
        accountName = page.name
        finalToken = page.access_token
      } else {
        const pageRes = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${access_token}`)
        const pageData = await pageRes.json()
        if (pageData.error) return NextResponse.json({ error: 'Invalid token: ' + pageData.error.message }, { status: 400 })
        accountId = pageData.id
        accountName = pageData.name
      }
    } else if (platform === 'instagram') {
      const pagesRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?fields=instagram_business_account{id,username,name}&access_token=${access_token}`)
      const pagesData = await pagesRes.json()
      const pages = pagesData.data || []
      let igFound = false
      for (const page of pages) {
        if (page.instagram_business_account) {
          accountId = page.instagram_business_account.id
          accountName = page.instagram_business_account.username || page.instagram_business_account.name
          igFound = true
          break
        }
      }
      if (!igFound) {
        const profileRes = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${access_token}`)
        const profile = await profileRes.json()
        if (profile.error) return NextResponse.json({ error: 'Invalid token: ' + profile.error.message }, { status: 400 })
        accountId = profile.id
        accountName = profile.name
      }
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { error: dbError } = await supabase.from('social_accounts').upsert({
      client_id, platform, account_id: String(accountId),
      account_name: accountName || String(accountId),
      access_token: finalToken, token_expires_at: null, is_connected: true,
    }, { onConflict: 'client_id,platform' })

    if (dbError) return NextResponse.json({ error: 'Database error: ' + dbError.message }, { status: 500 })
    return NextResponse.json({ success: true, account_name: accountName, account_id: accountId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}