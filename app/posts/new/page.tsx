'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
export default function NewPostPage() {
  const router = useRouter()
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({ client_id: '', content: '', platform: 'instagram', scheduled_at: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { supabase.from('clients').select('id, name').order('name').then(({ data }) => { if (data) setClients(data) }) }, [])
  async function handleSubmit(status: 'draft' | 'scheduled') {
    if (!form.content.trim()) { setError('Content is required'); return }
    if (!form.client_id) { setError('Please select a client'); return }
    if (status === 'scheduled' && !form.scheduled_at) { setError('Please set a schedule time'); return }
    setSaving(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setSaving(false); return }
    const { error } = await supabase.from('posts').insert({ user_id: user.id, client_id: form.client_id, content: form.content, platform: form.platform, status, scheduled_at: status === 'scheduled' && form.scheduled_at ? form.scheduled_at : null })
    if (error) { setError(error.message); setSaving(false); return }
    router.push('/posts')
  }
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create Post</h1>
      <div className="bg-white border rounded-xl p-6 space-y-4 shadow-sm">
        <div><label className="text-sm font-medium text-gray-700">Client *</label>
          <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
            <option value="">Select a client...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div><label className="text-sm font-medium text-gray-700">Platform</label>
          <div className="mt-1 flex gap-2 flex-wrap">
            {['instagram','twitter','linkedin','facebook','tiktok'].map(p => (
              <button key={p} type="button" onClick={() => setForm(f => ({ ...f, platform: p }))} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${form.platform === p ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>{p.charAt(0).toUpperCase() + p.slice(1)}</button>
            ))}
          </div>
        </div>
        <div><label className="text-sm font-medium text-gray-700">Content *</label>
          <textarea className="mt-1 w-full border rounded-lg px-3 py-2 text-sm min-h-[160px] resize-none" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your post content here..." />
          <p className="text-xs text-gray-400 mt-1">{form.content.length} characters</p>
        </div>
        <div><label className="text-sm font-medium text-gray-700">Schedule Date & Time</label>
          <input type="datetime-local" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />
          <p className="text-xs text-gray-400 mt-1">Leave empty to save as draft</p>
        </div>
        {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-600 text-sm">{error}</div>}
        <div className="flex gap-3 pt-2">
          <button onClick={() => handleSubmit('draft')} disabled={saving} className="flex-1 border rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50">Save as Draft</button>
          <button onClick={() => handleSubmit('scheduled')} disabled={saving || !form.scheduled_at} className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : '📅 Schedule Post'}</button>
        </div>
      </div>
    </div>
  )
}
