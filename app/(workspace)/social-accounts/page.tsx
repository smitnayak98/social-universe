"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Plus, Trash2, Link2, CheckCircle2, XCircle, Loader2, X, Globe } from "lucide-react";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PLATFORMS = [
  { id: "instagram", label: "Instagram", color: "#e1306c", bg: "#e1306c15" },
  { id: "twitter", label: "Twitter/X", color: "#1da1f2", bg: "#1da1f215" },
  { id: "facebook", label: "Facebook", color: "#1877f2", bg: "#1877f215" },
  { id: "linkedin", label: "LinkedIn", color: "#0a66c2", bg: "#0a66c215" },
  { id: "youtube", label: "YouTube", color: "#ff0000", bg: "#ff000015" },
];

export default function SocialAccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [form, setForm] = useState({ platform: "instagram", account_name: "", account_name: "", client_id: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchAccounts() {
    setLoading(true);
    const { data } = await supabase.from("social_accounts").select("*, clients(name)").order("created_at", { ascending: false });
    setAccounts(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchAccounts();
    supabase.from("clients").select("id, name").order("name").then(({ data }) => { if (data) setClients(data); });
  }, []);

  async function handleAdd() {
    if (!form.account_name.trim()) { setError("Account name is required."); return; }
    setSaving(true); setError("");
    const { data: { user } } = await supabase.auth.getUser();
    const { error: e } = await supabase.from("social_accounts").insert({
      platform: form.platform,
      account_name: form.account_name.trim(),
      account_name: form.account_name.trim() || null,
      client_id: form.client_id || null,
      is_connected: true,
      user_id: user?.id,
    });
    setSaving(false);
    if (e) { setError(e.message); return; }
    setShowAdd(false);
    setForm({ platform: "instagram", account_name: "", account_name: "", client_id: "" });
    fetchAccounts();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this account?")) return;
    setDeletingId(id);
    await supabase.from("social_accounts").delete().eq("id", id);
    setAccounts(prev => prev.filter(a => a.id !== id));
    setDeletingId(null);
  }

  async function handleToggle(acc: any) {
    setTogglingId(acc.id);
    await supabase.from("social_accounts").update({ is_connected: !acc.is_connected }).eq("id", acc.id);
    setAccounts(prev => prev.map(a => a.id === acc.id ? { ...a, is_connected: !a.is_connected } : a));
    setTogglingId(null);
  }

  const grouped: Record<string, any[]> = {};
  for (const acc of accounts) {
    if (!grouped[acc.platform]) grouped[acc.platform] = [];
    grouped[acc.platform].push(acc);
  }

  return (
    <>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Social Accounts</h1>
            <p className="text-sm text-white/40 mt-1">{accounts.length} account{accounts.length !== 1 ? "s" : ""} connected</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all">
            <Plus size={15} /> Connect Account
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {PLATFORMS.map(pf => (
            <div key={pf.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${(grouped[pf.id]?.length ?? 0) > 0 ? "border-white/20 bg-white/5" : "border-white/5 bg-white/[0.02] opacity-40"}`}>
              <Globe size={13} style={{ color: pf.color }} />
              <span className="text-white/70">{pf.label}</span>
              <span className="text-white/30 font-mono">{grouped[pf.id]?.length ?? 0}</span>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-white/30 text-sm">Loading…</div>
        ) : accounts.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-12 flex flex-col items-center text-center">
            <Link2 size={36} className="text-white/10 mb-3" />
            <p className="text-white/40 text-sm font-medium">No accounts connected yet</p>
            <button onClick={() => setShowAdd(true)} className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2">
              <Plus size={14} /> Connect Account
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {PLATFORMS.filter(pf => grouped[pf.id]?.length > 0).map(pf => (
              <div key={pf.id}>
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={15} style={{ color: pf.color }} />
                  <h3 className="text-sm font-semibold text-white/70">{pf.label}</h3>
                  <span className="text-xs text-white/20 font-mono">{grouped[pf.id].length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {grouped[pf.id].map((acc: any) => (
                    <div key={acc.id} className={`rounded-xl p-4 border flex items-center gap-3 ${acc.is_connected ? "bg-white/[0.03] border-white/10" : "bg-white/[0.01] border-white/5 opacity-60"}`}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: pf.bg, color: pf.color }}>
                        <Globe size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/90 truncate">{acc.account_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {acc.account_name && <span className="text-xs text-white/40">@{acc.account_name}</span>}
                          {acc.clients?.name && <span className="text-xs text-white/25">· {acc.clients.name}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => handleToggle(acc)} disabled={togglingId === acc.id} className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:bg-white/10 disabled:opacity-30">
                          {togglingId === acc.id ? <Loader2 size={13} className="animate-spin text-white/30" /> : acc.is_connected ? <CheckCircle2 size={15} className="text-emerald-400" /> : <XCircle size={15} className="text-white/20" />}
                        </button>
                        <button onClick={() => handleDelete(acc.id)} disabled={deletingId === acc.id} className="w-7 h-7 rounded-md flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-30">
                          {deletingId === acc.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">Connect Account</h2>
              <button onClick={() => setShowAdd(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">Platform</label>
                <div className="grid grid-cols-5 gap-2">
                  {PLATFORMS.map(p => (
                    <button key={p.id} onClick={() => setForm(f => ({ ...f, platform: p.id }))} className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all ${form.platform === p.id ? "border-white/20 bg-white/10" : "border-white/5 bg-white/[0.02]"}`}>
                      <Globe size={18} style={{ color: form.platform === p.id ? p.color : "rgba(255,255,255,0.3)" }} />
                      <span className="text-[9px] text-white/30">{p.id === "twitter" ? "X" : p.label.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5 block">Display Name *</label>
                <input value={form.account_name} onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))} placeholder="e.g. Acme Corp Instagram" className="w-full px-3 py-2 rounded-lg text-sm text-white bg-white/5 border border-white/10 focus:border-indigo-500/60 focus:outline-none placeholder:text-white/20" />
              </div>
              <div>
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5 block">Handle</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">@</span>
                  <input value={form.account_name} onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))} placeholder="username" className="w-full pl-7 pr-3 py-2 rounded-lg text-sm text-white bg-white/5 border border-white/10 focus:border-indigo-500/60 focus:outline-none placeholder:text-white/20" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5 block">Client</label>
                <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm text-white bg-white/5 border border-white/10 focus:outline-none">
                  <option value="">No client</option>
                  {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">{error}</p>}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5">Cancel</button>
              <button onClick={handleAdd} disabled={saving} className="px-5 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 disabled:opacity-40">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
                {saving ? "Connecting…" : "Connect"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}