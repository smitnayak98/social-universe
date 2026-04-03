'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Instagram, Facebook, CheckCircle, XCircle, RefreshCw, Link2 } from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Client {
  id: string
  name: string
}

interface SocialAccount {
  id: string
  client_id: string
  platform: string
  account_name: string
  account_id: string
  is_connected: boolean
  token_expires_at: string | null
}

export default function SocialAccountsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    // Check for success/error from OAuth callback
    const params = new URLSearchParams(window.location.search)
    const success = params.get('success')
    const error = params.get('error')
    if (success === 'instagram_connected') showToast('Instagram connected successfully!')
    if (success === 'facebook_connected') showToast('Facebook Page connected successfully!')
    if (error === 'instagram_denied') showToast('Instagram connection was denied', 'error')
    if (error === 'facebook_denied') showToast('Facebook connection was denied', 'error')
    if (error === 'no_pages') showToast('No Facebook Pages found on this account', 'error')
    if (error) showToast('Connection failed: ' + error, 'error')

    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: clientData } = await supabase
      .from('clients')
      .select('id, name')
      .order('name')

    const { data: accountData } = await supabase
      .from('social_accounts')
      .select('*')

    setClients(clientData || [])
    setAccounts(accountData || [])
    setLoading(false)
  }

  const getAccount = (clientId: string, platform: string) =>
    accounts.find(a => a.client_id === clientId && a.platform === platform)

  const connectInstagram = (clientId: string) => {
    window.location.href = `/api/auth/instagram?client_id=${clientId}`
  }

  const connectFacebook = (clientId: string) => {
    window.location.href = `/api/auth/facebook?client_id=${clientId}`
  }

  const disconnect = async (clientId: string, platform: string) => {
    await supabase
      .from('social_accounts')
      .update({ is_connected: false, access_token: null })
      .eq('client_id', clientId)
      .eq('platform', platform)
    fetchData()
    showToast(`${platform} disconnected`)
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl text-white
          ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1a1a1a]">Social Accounts</h1>
          <p className="mt-1 text-sm text-[#666]">Connect Instagram and Facebook for each client</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f5f5f5] hover:bg-[#eee] text-[#666] text-sm transition-all">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="rounded-2xl bg-[#f5f5f5] border border-[#e0e0e0] h-32 animate-pulse" />)}
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-20 rounded-2xl bg-[#f5f5f5] border border-[#e0e0e0]">
          <Link2 size={40} className="text-[#ccc] mx-auto mb-3" />
          <p className="text-[#666]">No clients found. Add clients first.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {clients.map(client => {
            const igAccount = getAccount(client.id, 'instagram')
            const fbAccount = getAccount(client.id, 'facebook')

            return (
              <div key={client.id} className="rounded-2xl bg-white border border-[#e0e0e0] p-5">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#f0f0f0]">
                  <div className="w-9 h-9 rounded-full bg-[#f5c800]/30 flex items-center justify-center text-sm font-semibold text-[#7a6400]">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <h2 className="font-semibold text-[#1a1a1a]">{client.name}</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Instagram */}
                  <div className="rounded-xl border border-[#e0e0e0] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Instagram size={16} className="text-white" />
                      </div>
                      <span className="font-medium text-sm text-[#1a1a1a]">Instagram</span>
                    </div>

                    {igAccount?.is_connected && igAccount?.account_name ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium">
                          <CheckCircle size={13} /> Connected
                        </div>
                        <p className="text-xs text-[#666]">@{igAccount.account_name}</p>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => connectInstagram(client.id)}
                            className="flex-1 text-xs py-1.5 rounded-lg bg-[#f5f5f5] hover:bg-[#eee] text-[#666] transition-all">
                            Reconnect
                          </button>
                          <button onClick={() => disconnect(client.id, 'instagram')}
                            className="flex-1 text-xs py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-all">
                            Disconnect
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-[#999] text-xs">
                          <XCircle size={13} /> Not connected
                        </div>
                        <button onClick={() => connectInstagram(client.id)}
                          className="w-full mt-2 text-xs py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-medium transition-all">
                          Connect Instagram
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Facebook */}
                  <div className="rounded-xl border border-[#e0e0e0] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#1877F2] flex items-center justify-center">
                        <Facebook size={16} className="text-white" />
                      </div>
                      <span className="font-medium text-sm text-[#1a1a1a]">Facebook Page</span>
                    </div>

                    {fbAccount?.is_connected && fbAccount?.account_name ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium">
                          <CheckCircle size={13} /> Connected
                        </div>
                        <p className="text-xs text-[#666]">{fbAccount.account_name}</p>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => connectFacebook(client.id)}
                            className="flex-1 text-xs py-1.5 rounded-lg bg-[#f5f5f5] hover:bg-[#eee] text-[#666] transition-all">
                            Reconnect
                          </button>
                          <button onClick={() => disconnect(client.id, 'facebook')}
                            className="flex-1 text-xs py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-all">
                            Disconnect
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-[#999] text-xs">
                          <XCircle size={13} /> Not connected
                        </div>
                        <button onClick={() => connectFacebook(client.id)}
                          className="w-full mt-2 text-xs py-2 rounded-lg bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium transition-all">
                          Connect Facebook
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
