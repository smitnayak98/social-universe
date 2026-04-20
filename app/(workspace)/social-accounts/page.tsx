'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Instagram, Facebook, CheckCircle, XCircle, RefreshCw, Link2, Key, X, ExternalLink } from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Client { id: string; name: string }
interface SocialAccount {
  id: string; client_id: string; platform: string
  account_name: string; account_id: string; is_connected: boolean
}

export default function SocialAccountsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [modal, setModal] = useState<{ clientId: string; clientName: string; platform: 'instagram' | 'facebook' } | null>(null)
  const [token, setToken] = useState('')
  const [saving, setSaving] = useState(false)

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')
    if (error) showToast('Connection failed: ' + error, 'error')
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: clientData } = await supabase.from('clients').select('id, name').order('name')
    const { data: accountData } = await supabase.from('social_accounts').select('*')
    setClients(clientData || [])
    setAccounts(accountData || [])
    setLoading(false)
  }

  const getAccount = (clientId: string, platform: string) =>
    accounts.find(a => a.client_id === clientId && a.platform === platform)

  const disconnect = async (clientId: string, platform: string) => {
    await supabase.from('social_accounts')
      .update({ is_connected: false, access_token: null })
      .eq('client_id', clientId).eq('platform', platform)
    fetchData()
    showToast(`${platform} disconnected`)
  }

  const openModal = (clientId: string, clientName: string, platform: 'instagram' | 'facebook') => {
    setToken('')
    setModal({ clientId, clientName, platform })
  }

  const saveToken = async () => {
    if (!token.trim() || !modal) return
    setSaving(true)
    try {
      const res = await fetch('/api/social-accounts/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: modal.clientId, platform: modal.platform, access_token: token.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        showToast(`${modal.platform} connected as ${data.account_name}!`)
        setModal(null)
        setToken('')
        fetchData()
      } else {
        showToast(data.error || 'Failed to connect', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl text-white
          ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {modal.platform === 'instagram'
                  ? <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"><Instagram size={16} className="text-white" /></div>
                  : <div className="w-8 h-8 rounded-lg bg-[#1877F2] flex items-center justify-center"><Facebook size={16} className="text-white" /></div>
                }
                <div>
                  <h3 className="font-semibold text-[#1a1a1a] text-sm">Connect {modal.platform === 'instagram' ? 'Instagram' : 'Facebook'}</h3>
                  <p className="text-xs text-[#999]">{modal.clientName}</p>
                </div>
              </div>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-[#f5f5f5] text-[#999]"><X size={16} /></button>
            </div>

            <div className="bg-[#fffbeb] border border-[#f5c800]/30 rounded-xl p-4 mb-4 text-xs text-[#7a6400] space-y-2">
              <p className="font-semibold">How to get your access token:</p>
              <ol className="space-y-1 list-decimal list-inside">
                <li>Go to Graph API Explorer</li>
                <li>Select <strong>Social Universe</strong> app</li>
                <li>Click "Generate Access Token"</li>
                <li>Add <strong>{modal.platform === 'facebook' ? 'pages_show_list, pages_manage_posts' : 'pages_show_list, instagram_basic'}</strong></li>
                <li>Authorize and copy the token</li>
                <li>Run <strong>me/accounts?fields=instagram_business_account&#123;id,username&#125;</strong> to verify</li>
              </ol>
              <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#b8930a] font-medium mt-2 hover:underline">
                Open Graph API Explorer <ExternalLink size={11} />
              </a>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-medium text-[#555]">Paste Access Token</label>
              <textarea value={token} onChange={e => setToken(e.target.value)}
                placeholder="EAAf3oUJtW8w..." rows={4}
                className="w-full rounded-xl border border-[#e0e0e0] bg-[#f9f9f9] px-3 py-2.5 text-xs font-mono outline-none ring-[#f5c800] focus:ring resize-none" />
              <div className="flex gap-2">
                <button onClick={() => setModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#e0e0e0] text-sm text-[#555] hover:bg-[#f5f5f5] transition-all">
                  Cancel
                </button>
                <button onClick={saveToken} disabled={!token.trim() || saving}
                  className="flex-1 py-2.5 rounded-xl bg-[#f5c800] text-sm font-semibold text-[#1a1a1a] hover:bg-[#e0b800] disabled:opacity-50 transition-all">
                  {saving ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </div>
          </div>
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
                  <div className="rounded-xl border border-[#e0e0e0] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Instagram size={16} className="text-white" />
                      </div>
                      <span className="font-medium text-sm text-[#1a1a1a]">Instagram</span>
                    </div>
                    {igAccount?.is_connected && igAccount?.account_name ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium"><CheckCircle size={13} /> Connected</div>
                        <p className="text-xs text-[#666]">@{igAccount.account_name}</p>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => openModal(client.id, client.name, 'instagram')}
                            className="flex-1 text-xs py-1.5 rounded-lg bg-[#f5f5f5] hover:bg-[#eee] text-[#666] transition-all">Reconnect</button>
                          <button onClick={() => disconnect(client.id, 'instagram')}
                            className="flex-1 text-xs py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-all">Disconnect</button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-[#999] text-xs"><XCircle size={13} /> Not connected</div>
                        <button onClick={() => openModal(client.id, client.name, 'instagram')}
                          className="w-full mt-2 text-xs py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-medium transition-all flex items-center justify-center gap-1.5">
                          <Key size={11} /> Connect Instagram
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-[#e0e0e0] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#1877F2] flex items-center justify-center">
                        <Facebook size={16} className="text-white" />
                      </div>
                      <span className="font-medium text-sm text-[#1a1a1a]">Facebook Page</span>
                    </div>
                    {fbAccount?.is_connected && fbAccount?.account_name ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium"><CheckCircle size={13} /> Connected</div>
                        <p className="text-xs text-[#666]">{fbAccount.account_name}</p>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => openModal(client.id, client.name, 'facebook')}
                            className="flex-1 text-xs py-1.5 rounded-lg bg-[#f5f5f5] hover:bg-[#eee] text-[#666] transition-all">Reconnect</button>
                          <button onClick={() => disconnect(client.id, 'facebook')}
                            className="flex-1 text-xs py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-all">Disconnect</button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-[#999] text-xs"><XCircle size={13} /> Not connected</div>
                        <button onClick={() => openModal(client.id, client.name, 'facebook')}
                          className="w-full mt-2 text-xs py-2 rounded-lg bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium transition-all flex items-center justify-center gap-1.5">
                          <Key size={11} /> Connect Facebook
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