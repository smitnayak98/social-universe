'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'

export default function NewClientPage() {
  const supabase = createClient()
  const router = useRouter()
  const [form, setForm] = useState({ name:'', email:'', phone:'', website:'', status:'active' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<any>(null)

  function set(k:string,v:string){ setForm(f=>({...f,[k]:v})) }
  function showToast(msg:string, type:'success'|'error'){ setToast({msg,type}); setTimeout(()=>setToast(null),3000) }

  async function save() {
    if (!form.name.trim()){ showToast('Name is required','error'); return }
    setSaving(true)
    const { data:{user} } = await supabase.auth.getUser()
    const { error } = await supabase.from('clients').insert({ user_id:user!.id, ...form, name:form.name.trim(), email:form.email||null, phone:form.phone||null, website:form.website||null })
    if (error) showToast(error.message,'error')
    else { showToast('Client created!','success'); setTimeout(()=>router.push('/clients'),1200) }
    setSaving(false)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-xl ${toast.type==='success'?'bg-emerald-500/10 border-emerald-500/20 text-emerald-300':'bg-red-500/10 border-red-500/20 text-red-300'}`}>
          {toast.type==='success'?<CheckCircle2 size={15}/>:<AlertCircle size={15}/>}{toast.msg}
        </div>
      )}
      <div className="flex items-center gap-4">
        <button onClick={()=>router.push('/clients')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 transition-colors"><ArrowLeft size={16}/></button>
        <div><h1 className="text-2xl font-bold text-white">Add Client</h1><p className="text-white/40 text-sm">Create a new client profile</p></div>
      </div>
      <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-6 space-y-5">
        {[['name','Client name *','text','e.g. Acme Corp'],['email','Email','email','client@example.com'],['phone','Phone','tel','+91 98765 43210'],['website','Website','url','https://example.com']].map(([k,label,type,ph]:any)=>(
          <div key={k}>
            <label className="text-white/50 text-xs font-medium mb-1.5 block">{label}</label>
            <input type={type} value={(form as any)[k]} onChange={e=>set(k,e.target.value)} placeholder={ph}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-purple-500/50"/>
          </div>
        ))}
        <div>
          <label className="text-white/50 text-xs font-medium mb-1.5 block">Status</label>
          <select value={form.status} onChange={e=>set('status',e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500/50">
            <option value="active">Active</option><option value="inactive">Inactive</option><option value="paused">Paused</option>
          </select>
        </div>
        <div className="flex gap-3 pt-2 border-t border-white/5">
          <button onClick={()=>router.push('/clients')} className="px-4 py-2.5 rounded-xl border border-white/15 text-white/60 hover:text-white text-sm transition-all">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50">
            {saving?'Creating...':'Create client'}
          </button>
        </div>
      </div>
    </div>
  )
}
