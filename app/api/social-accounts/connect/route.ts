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
      // Get pages list first
      const pagesRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${access_token}`)
      const pagesData = await pagesRes.json()
      const pages = pagesData.data || []

      let igFound = false
      for (const page of pages) {
        // Use each page's own token to query its linked Instagram account
        const pageToken = page.access_token
        const igRes = await fetch(
          `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account{id,username,name}&access_token=${pageToken}`
        )
        const igData = await igRes.json()
        if (igData.instagram_business_account) {
          accountId = igData.instagram_business_account.id
          accountName = igData.instagram_business_account.username || igData.instagram_business_account.name
          finalToken = access_token
          igFound = true
          break
        }
      }

      if (!igFound) {
        return NextResponse.json({
          error: 'No Instagram Business account found linked to your Facebook Page. Go to Meta Business Suite and link your Instagram account to your Facebook Page first.'
        }, { status: 400 })
      }
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: dbError } = await supabase
      .from('social_accounts')
      .upsert({
        client_id,
        platform,
        account_id: String(accountId),
        account_name: accountName || String(accountId),
        access_token: finalToken,
        token_expires_at: null,
        is_connected: true,
      }, { onConflict: 'client_id,platform' })

    if (dbError) return NextResponse.json({ error: 'Database error: ' + dbError.message }, { status: 500 })

    return NextResponse.json({ success: true, account_name: accountName, account_id: accountId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}