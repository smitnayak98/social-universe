'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Mail, Shield, LogOut, CheckCircle2, AlertCircle } from 'lucide-react'

export default function SettingsPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<any>(null)

  useEffect(()=>{ supabase.auth.getUser().then(({data:{user}})=>{ setUser(user); setName(user?.user_metadata?.full_name||'') }) },[])

  function showToast(msg:string,type:'success'|'error'){ setToast({msg,type}); setTimeout(()=>setToast(null),3000) }

  async function save(){ setSaving(true); const {error}=await supabase.auth.updateUser({data:{full_name:name}}); error?showToast('Failed','error'):showToast('Saved!','success'); setSaving(false) }
  async function signOut(){ await supabase.auth.signOut(); window.location.href='/login' }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-xl ${toast.type==='success'?'bg-emerald-500/10 border-emerald-500/20 text-emerald-300':'bg-red-500/10 border-red-500/20 text-red-300'}`}>
          {toast.type==='success'?<CheckCircle2 size={15}/>:<AlertCircle size={15}/>}{toast.msg}
        </div>
      )}
      <div><h1 className="text-2xl font-bold text-[#1a1a1a]">Settings</h1><p className="text-[#1a1a1a]/40 text-sm mt-0.5">Manage your account</p></div>

      <div className="bg-white border border-[#e0e0e0] rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3 mb-1"><div className="p-2 rounded-xl bg-purple-600/20"><User size={16} className="text-purple-400"/></div><h2 className="text-[#1a1a1a] font-semibold">Profile</h2></div>
        <div><label className="text-[#1a1a1a]/50 text-xs font-medium mb-1.5 block">Display name</label>
          <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" className="w-full bg-[#f5f5f5] border border-[#e0e0e0] rounded-xl px-4 py-3 text-[#1a1a1a] text-sm placeholder-white/20 focus:outline-none focus:border-purple-500/50"/></div>
        <div><label className="text-[#1a1a1a]/50 text-xs font-medium mb-1.5 block">Email</label>
          <div className="flex items-center gap-3 bg-[#f5f5f5] border border-[#e0e0e0] rounded-xl px-4 py-3"><Mail size={14} className="text-[#1a1a1a]/30"/><span className="text-[#1a1a1a]/50 text-sm">{user?.email||'—'}</span></div></div>
        <button onClick={save} disabled={saving} className="bg-purple-600 hover:bg-purple-500 text-[#1a1a1a] px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50">{saving?'Saving...':'Save changes'}</button>
      </div>

      <div className="bg-white border border-[#e0e0e0] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-1"><div className="p-2 rounded-xl bg-[#f5f5f5]"><Shield size={16} className="text-[#1a1a1a]/40"/></div><h2 className="text-[#1a1a1a] font-semibold">Account</h2></div>
        <div className="py-3 border-b border-[#eee]"><p className="text-[#1a1a1a] text-sm font-medium">Account ID</p><p className="text-[#1a1a1a]/30 text-xs mt-0.5">{user?.id?.substring(0,20)}...</p></div>
        <div className="py-3"><p className="text-[#1a1a1a] text-sm font-medium">Member since</p><p className="text-[#1a1a1a]/30 text-xs mt-0.5">{user?.created_at?new Date(user.created_at).toLocaleDateString('en-US',{month:'long',year:'numeric'}):'—'}</p></div>
      </div>

      <div className="bg-white border border-red-500/20 rounded-2xl p-6 flex items-center justify-between">
        <div><p className="text-[#1a1a1a] font-medium">Sign out</p><p className="text-[#1a1a1a]/40 text-sm mt-0.5">Sign out of your account</p></div>
        <button onClick={signOut} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-all"><LogOut size={14}/>Sign out</button>
      </div>
    </div>
  )
}
