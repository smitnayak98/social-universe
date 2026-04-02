'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Mail, Globe, Phone, Building2, FileText, CheckCircle2, Clock, XCircle, FileEdit } from 'lucide-react'
import Link from 'next/link'

interface Post { id: string; caption: string; status: string; created_at: string }

const S: Record<string,any> = {
  draft:            { c: 'bg-white/10 text-white/50',          i: FileEdit },
  pending_approval: { c: 'bg-amber-500/20 text-amber-300',     i: Clock },
  scheduled:        { c: 'bg-blue-500/20 text-blue-300',       i: Clock },
  published:        { c: 'bg-emerald-500/20 text-emerald-300', i: CheckCircle2 },
  rejected:         { c: 'bg-red-500/20 text-red-300',         i: XCircle },
}

export default function ClientDetailPage() {
  const supabase = createClient()
  const { id } = useParams()
  const router = useRouter()
  const [client, setClient] = useState<any>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('posts').select('id,caption,status,created_at').eq('client_id', id).order('created_at', { ascending: false }),
    ])
    setClient(c); setPosts(p || []); setLoading(false)
  }

  if (loading) return <div className="p-6"><div className="h-32 rounded-2xl bg-white/5 animate-pulse" /></div>
  if (!client) return <div className="p-6 text-center text-white/40 mt-20">Client not found. <Link href="/clients" className="text-purple-400">← Back</Link></div>

  const counts = posts.reduce((a:any,p) => { a[p.status]=(a[p.status]||0)+1; return a }, {})

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/clients')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 transition-colors"><ArrowLeft size={16}/></button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{client.name}</h1>
          <p className="text-white/40 text-sm">Client detail</p>
        </div>
        <Link href="/create-post" className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <FileText size={14}/> New post
        </Link>
      </div>

      <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/20 flex items-center justify-center flex-shrink-0">
            <span className="text-purple-300 font-bold text-xl">{client.name[0].toUpperCase()}</span>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-white text-lg font-semibold">{client.name}</h2>
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 capitalize">{client.status||'active'}</span>
            </div>
            <div className="flex flex-wrap gap-4">
              {client.email && <span className="flex items-center gap-1.5 text-white/40 text-sm"><Mail size={12}/>{client.email}</span>}
              {client.phone && <span className="flex items-center gap-1.5 text-white/40 text-sm"><Phone size={12}/>{client.phone}</span>}
              {client.website && <span className="flex items-center gap-1.5 text-white/40 text-sm"><Globe size={12}/>{client.website}</span>}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5">
          {[['Total posts',posts.length],['Pending',(counts.pending_approval||0)],['Scheduled',(counts.scheduled||0)],['Published',(counts.published||0)]].map(([l,v]:any) => (
            <div key={l}><p className="text-white/40 text-xs mb-1">{l}</p><p className="text-white text-xl font-bold">{v}</p></div>
          ))}
        </div>
      </div>

      <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-4">Posts ({posts.length})</h2>
        {posts.length === 0 ? (
          <div className="text-center py-10 text-white/30 text-sm">No posts yet. <Link href="/create-post" className="text-purple-400">Create one →</Link></div>
        ) : (
          <div className="space-y-2">
            {posts.map(post => {
              const cfg = S[post.status] || S.draft
              const Icon = cfg.i
              return (
                <div key={post.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                  <div className={`p-1.5 rounded-lg ${cfg.c}`}><Icon size={12}/></div>
                  <p className="text-white text-sm flex-1 truncate">{post.caption||'Untitled'}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.c}`}>{post.status.replace('_',' ')}</span>
                  <span className="text-white/30 text-xs">{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
