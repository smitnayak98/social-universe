import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET() {
  try {
    const supabase = createClient()

    const { data: accounts } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('platform', 'instagram')
      .eq('is_connected', true)

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ message: 'No Instagram accounts to refresh' })
    }

    const results = []

    for (const account of accounts) {
      if (!account.access_token) continue

      const res = await fetch(
        `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${account.access_token}`
      )
      const data = await res.json()

      if (data.access_token) {
        await supabase
          .from('social_accounts')
          .update({
            access_token: data.access_token,
            token_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
          })
          .eq('id', account.id)
        results.push({ account: account.account_name, status: 'refreshed' })
      } else {
        results.push({ account: account.account_name, status: 'failed', error: data.error?.message })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
