'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { CheckCircle, XCircle, Clock, MessageSquare, ChevronDown, RefreshCw, Eye, AlertCircle, Calendar, Filter, Send } from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const STATUS_CONFIG = {
  pending_approval: { label: 'Pending',   color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  approved:         { label: 'Approved',  color: 'bg-green-500/20 text-green-400 border-green-500/30'   },
  rejected:         { label: 'Rejected',  color: 'bg-red-500/20 text-red-400 border-red-500/30'         },
  published:        { label: 'Published', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30'      },
  draft:            { label: 'Draft',     color: 'bg-slate-500/20 text-[#666] border-slate-500/30'   },
  scheduled:        { label: 'Scheduled', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30'},
}

export default function ApprovalsPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('pending_approval')
  const [selectedPost, setSelectedPost] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [publishLoading, setPublishLoading] = useState(null)
  const [toast, setToast] = useState(null)
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, published: 0 })

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('posts').select('*, clients(name)').order('created_at', { ascending: false })
    if (filterStatus !== 'all') query = query.eq('status', filterStatus)
    const { data, error } = await query
    if (!error && data) setPosts(data)

    const [p, a, r, pub] = await Promise.all([
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'pending_approval'),
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    ])
    setStats({ pending: p.count ?? 0, approved: a.count ?? 0, rejected: r.count ?? 0, published: pub.count ?? 0 })
    setLoading(false)
  }, [filterStatus])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const handleAction = async (postId, status, note) => {
    setActionLoading(postId)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('posts').update({
      status,
      approval_note: note || null,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', postId)
    if (error) { showToast('Failed to update post', 'error') }
    else {
      showToast(status === 'approved' ? 'Post approved!' : 'Post rejected')
      setSelectedPost(null)
      setNoteText('')
      fetchPosts()
    }
    setActionLoading(null)
  }

  const handlePublish = async (postId) => {
    setPublishLoading(postId)
    try {
      const res = await fetch('/api/instagram/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId }),
      })
      const data = await res.json()
      if (data.success) {
        showToast('Post published to Instagram!', 'success')
        fetchPosts()
      } else {
        showToast(data.error || 'Failed to publish', 'error')
      }
    } catch (err) {
      showToast('Network error. Please try again.', 'error')
    }
    setPublishLoading(null)
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : '--'

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl text-[#1a1a1a] transition-all
          ${toast.type === 'success' ? 'bg-green-500/90' : 'bg-red-500/90'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Approvals</h1>
          <p className="mt-1 text-sm text-[#555]">Review, approve and publish content</p>
        </div>
        <button onClick={fetchPosts} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f5f5f5] hover:bg-[#eeeeee] text-[#666] hover:text-[#1a1a1a] transition-all text-sm">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { key: 'pending_approval', label: 'Pending',   count: stats.pending,   border: 'border-yellow-500/30 bg-yellow-500/10', text: 'text-yellow-400' },
          { key: 'approved',         label: 'Approved',  count: stats.approved,  border: 'border-green-500/30 bg-green-500/10',   text: 'text-green-400'  },
          { key: 'rejected',         label: 'Rejected',  count: stats.rejected,  border: 'border-red-500/30 bg-red-500/10',       text: 'text-red-400'    },
          { key: 'published',        label: 'Published', count: stats.published, border: 'border-blue-500/30 bg-blue-500/10',     text: 'text-blue-400'   },
        ].map(s => (
          <button key={s.key} onClick={() => setFilterStatus(s.key)}
            className={`rounded-2xl border p-4 text-left transition-all ${s.border} ${filterStatus === s.key ? 'ring-2 ring-white/20' : 'hover:opacity-80'}`}>
            <div className="text-xs font-medium uppercase tracking-wider text-[#1a1a1a]/60 mb-1">{s.label}</div>
            <div className={`text-3xl font-bold ${s.text}`}>{s.count}</div>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Filter size={14} className="text-[#777]" />
        {['pending_approval', 'approved', 'rejected', 'published', 'all'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all
              ${filterStatus === s ? 'bg-[#f5c800] text-[#1a1a1a]' : 'bg-[#f5f5f5] text-[#666] hover:bg-[#eeeeee]'}`}>
            {s === 'all' ? 'All Posts' : s === 'pending_approval' ? 'Pending' : s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="rounded-2xl bg-[#f5f5f5] border border-[#e0e0e0] p-5 animate-pulse h-24" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 rounded-2xl bg-[#f5f5f5] border border-[#e0e0e0]">
          <AlertCircle size={40} className="text-[#888] mx-auto mb-3" />
          <p className="text-[#666] font-medium">No {filterStatus !== 'all' ? filterStatus.replace('_', ' ') : ''} posts found</p>
          <p className="text-[#888] text-sm mt-1">Posts submitted for approval will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => {
            const cfg = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft
            return (
              <div key={post.id} className="rounded-2xl bg-white border border-[#e0e0e0] hover:border-[#ccc] transition-all overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    {post.clients?.name && <span className="text-xs text-[#777]">{post.clients.name}</span>}
                    {(post.platforms || []).map(p => (
                      <span key={p} className="px-2 py-0.5 rounded-md text-xs bg-[#f5f5f5] border border-[#e0e0e0] text-[#666] capitalize">{p}</span>
                    ))}
                    <span className="text-xs text-[#888] ml-auto flex items-center gap-1">
                      <Calendar size={11} /> {formatDate(post.scheduled_at || post.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-[#444] leading-relaxed line-clamp-3">{post.caption || post.content}</p>
                  {post.approval_note && (
                    <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-[#f5f5f5] border border-[#e0e0e0]">
                      <MessageSquare size={13} className="text-[#777] mt-0.5 shrink-0" />
                      <p className="text-xs text-[#666] italic">{post.approval_note}</p>
                    </div>
                  )}
                </div>

                {post.status === 'pending_approval' && (
                  <div className="border-t border-[#eee] bg-[#fafafa] px-5 py-3 flex items-center justify-between gap-3">
                    <button onClick={() => setSelectedPost(selectedPost?.id === post.id ? null : post)}
                      className="flex items-center gap-1.5 text-xs text-[#777] hover:text-[#444] transition-colors">
                      <Eye size={13} /> Add note
                      <ChevronDown size={13} className={`transition-transform ${selectedPost?.id === post.id ? 'rotate-180' : ''}`} />
                    </button>
                    <div className="flex items-center gap-2">
                      <button disabled={actionLoading === post.id} onClick={() => handleAction(post.id, 'rejected')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium border border-red-500/20 transition-all disabled:opacity-50">
                        <XCircle size={13} /> Reject
                      </button>
                      <button disabled={actionLoading === post.id} onClick={() => handleAction(post.id, 'approved')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-medium border border-green-500/20 transition-all disabled:opacity-50">
                        <CheckCircle size={13} /> Approve
                      </button>
                    </div>
                  </div>
                )}

                {post.status === 'approved' && (
                  <div className="border-t border-[#eee] bg-[#fafafa] px-5 py-3 flex items-center justify-between gap-3">
                    <span className="text-xs text-[#777]">Post approved — ready to publish</span>
                    <button
                      disabled={publishLoading === post.id}
                      onClick={() => handlePublh(post.id)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-pink-500/80 to-violet-500/80 hover:from-pink-500 hover:to-violet-500 text-[#1a1a1a] text-xs font-semibold transition-all disabled:opacity-50 shadow-lg">
                      {publishLoading === post.id
                        ? <><RefreshCw size={13} className="animate-spin" /> Publishing...</>
                        : <><Send size={13} /> Publish to Instagram</>}
                    </button>
                  </div>
                )}

                {post.status === 'published' && (
                  <div className="border-t border-[#eee] bg-blue-500/5 px-5 py-3">
                    <span className="text-xs text-blue-400 flex items-center gap-1.5">
                      <CheckCircle size={13} /> Published to Instagram successfully
                    </span>
                  </div>
                )}

                {selectedPost?.id === post.id && post.status === 'pending_approval' && (
                  <div className="border-t border-[#e0e0e0] bg-black/20 p-5">
                    <label className="block text-xs text-[#666] font-medium mb-2">Review Note <span className="text-[#888]">(optional)</span></label>
                    <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                      placeholder="Add feedback for the content creator..."
                      rows={3} className="w-full bg-[#f5f5f5] border border-[#e0e0e0] rounded-xl px-4 py-3 text-sm text-[#1a1a1a] placeholder-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-[#f5c800]/50 transition-all" />
                    <div className="flex items-center justify-end gap-2 mt-3">
                      <button onClick={() => { setSelectedPost(null); setNoteText('') }}
                        className="px-3 py-1.5 rounded-lg text-xs text-[#777] hover:text-[#1a1a1a] bg-[#f5f5f5] hover:bg-[#eeeeee] transition-all">
                        Cancel
                      </button>
                      <button disabled={actionLoading === post.id} onClick={() => handleAction(post.id, 'rejected', noteText)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium border border-red-500/20 transition-all disabled:opacity-50">
                        <XCircle size={13} /> Reject with Note
                      </button>
                      <button disabled={actionLoading === post.id} onClick={() => handleAction(post.id, 'approved', noteText)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-medium border border-green-500/20 transition-all disabled:opacity-50">
                        <CheckCircle size={13} /> Approve with Note
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
