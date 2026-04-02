"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  Instagram, Twitter, Facebook, Linkedin, Youtube, Globe,
  Plus, Trash2, Link2, CheckCircle2, XCircle, Loader2, X
} from "lucide-react";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram, color: "#e1306c", bg: "#e1306c15" },
  { id: "twitter", label: "Twitter / X", icon: Twitter, color: "#1da1f2", bg: "#1da1f215" },
  { id: "facebook", label: "Facebook", icon: Facebook, color: "#1877f2", bg: "#1877f215" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "#0a66c2", bg: "#0a66c215" },
  { id: "youtube", label: "YouTube", icon: Youtube, color: "#ff0000", bg: "#ff000015" },
];

interface SocialAccount {
  id: string;
  client_id: string | null;
  platform: string;
  account_name: string;
  account_handle: string | null;
  access_token: string | null;
  is_active: boolean;
  created_at: string;
  clients?: { name: string } | null;
}

interface AddAccountFormProps {
  clients: { id: string; name: string }[];
  onClose: () => void;
  onAdded: () => void;
}

function AddAccountModal({ clients, onClose, onAdded }: AddAccountFormProps) {
  const [platform, setPlatform] = useState("instagram");
  const [accountName, setAccountName] = useState("");
  const [accountHandle, setAccountHandle] = useState("");
  const [clientId, setClientId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!accountName.trim()) { setError("Account name is required."); return; }
    setSaving(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not authenticated."); setSaving(false); return; }

    const { error: dbErr } = await supabase.from("social_accounts").insert({
      platform,
      account_name: accountName.trim(),
      account_handle: accountHandle.trim() || null,
      client_id: clientId || null,
      is_active: true,
      user_id: user.id,
    });

    setSaving(false);
    if (dbErr) { setError(dbErr.message); return; }
    onAdded();
  }

  const pf = PLATFORMS.find((p) => p.id === platform)!;
  const PfIcon = pf.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--card, #1a1a2e)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e0e0e0]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: pf.bg, color: pf.color }}>
              <PfIcon size={16} />
            </div>
            <h2 className="text-base font-semibold text-[#1a1a1a]">Connect Account</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#1a1a1a]/40 hover:text-[#1a1a1a] hover:bg-[#eeeeee] transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Platform selector */}
          <div>
            <label className="text-xs font-medium text-[#1a1a1a]/50 uppercase tracking-wider mb-2 block">Platform</label>
            <div className="grid grid-cols-5 gap-2">
              {PLATFORMS.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all ${
                      platform === p.id
                        ? "border-[#ccc] bg-[#eeeeee]"
                        : "border-[#eee] bg-[#fafafa] hover:bg-[#f5f5f5]"
                    }`}
                    title={p.label}
                  >
                    <Icon size={18} style={{ color: platform === p.id ? p.color : "rgba(255,255,255,0.3)" }} />
                    <span className="text-[9px] text-[#1a1a1a]/30 font-medium leading-none">{p.id === "twitter" ? "X" : p.label.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account name */}
          <div>
            <label className="text-xs font-medium text-[#1a1a1a]/50 uppercase tracking-wider mb-1.5 block">Display Name *</label>
            <input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder={`e.g. Acme Corp ${pf.label}`}
              className="w-full px-3 py-2 rounded-lg text-sm text-[#1a1a1a] bg-[#f5f5f5] border border-[#e0e0e0] focus:border-[#f5c800]/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 placeholder:text-[#1a1a1a]/20 transition-all"
            />
          </div>

          {/* Handle */}
          <div>
            <label className="text-xs font-medium text-[#1a1a1a]/50 uppercase tracking-wider mb-1.5 block">Handle / Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1a1a1a]/30 text-sm">@</span>
              <input
                value={accountHandle}
                onChange={(e) => setAccountHandle(e.target.value)}
                placeholder="username"
                className="w-full pl-7 pr-3 py-2 rounded-lg text-sm text-[#1a1a1a] bg-[#f5f5f5] border border-[#e0e0e0] focus:border-[#f5c800]/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 placeholder:text-[#1a1a1a]/20 transition-all"
              />
            </div>
          </div>

          {/* Client */}
          <div>
            <label className="text-xs font-medium text-[#1a1a1a]/50 uppercase tracking-wider mb-1.5 block">Client (optional)</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-[#1a1a1a] bg-[#f5f5f5] border border-[#e0e0e0] focus:border-[#f5c800]/60 focus:outline-none transition-all"
            >
              <option value="">No client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">{error}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e0e0e0]">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-[#1a1a1a]/60 hover:text-[#1a1a1a] hover:bg-[#f5f5f5] transition-all">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-[#f5c800] hover:bg-[#f5c800] disabled:opacity-40 text-[#1a1a1a] transition-all flex items-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
            {saving ? "Connecting…" : "Connect Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SocialAccountsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function fetchAccounts() {
    setLoading(true);
    const { data } = await supabase
      .from("social_accounts")
      .select("*, clients(name)")
      .order("created_at", { ascending: false });
    setAccounts(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchAccounts();
    supabase.from("clients").select("id, name").order("name").then(({ data }) => {
      if (data) setClients(data);
    });
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Remove this account?")) return;
    setDeletingId(id);
    await supabase.from("social_accounts").delete().eq("id", id);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    setDeletingId(null);
  }

  async function handleToggle(account: SocialAccount) {
    setTogglingId(account.id);
    await supabase
      .from("social_accounts")
      .update({ is_active: !account.is_active })
      .eq("id", account.id);
    setAccounts((prev) =>
      prev.map((a) => a.id === account.id ? { ...a, is_active: !a.is_active } : a)
    );
    setTogglingId(null);
  }

  // Group by platform
  const grouped: Record<string, SocialAccount[]> = {};
  for (const acc of accounts) {
    if (!grouped[acc.platform]) grouped[acc.platform] = [];
    grouped[acc.platform].push(acc);
  }

  return (
    <>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">Social Accounts</h1>
            <p className="text-sm text-[#1a1a1a]/40 mt-1">
              {accounts.length} account{accounts.length !== 1 ? "s" : ""} connected
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#f5c800] hover:bg-[#f5c800] text-[#1a1a1a] transition-all"
          >
            <Plus size={15} />
            Connect Account
          </button>
        </div>

        {/* Platform quick-stat chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {PLATFORMS.map((pf) => {
            const count = grouped[pf.id]?.length ?? 0;
            const Icon = pf.icon;
            return (
              <div
                key={pf.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  count > 0 ? "border-[#ccc] bg-[#f5f5f5]" : "border-[#eee] bg-[#fafafa] opacity-40"
                }`}
              >
                <Icon size={13} style={{ color: pf.color }} />
                <span className="text-[#1a1a1a]/70">{pf.label}</span>
                <span className="text-[#1a1a1a]/30 font-mono">{count}</span>
              </div>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#1a1a1a]/30 text-sm">
            Loading accounts…
          </div>
        ) : accounts.length === 0 ? (
          <div className="rounded-xl border border-[#e0e0e0] bg-[#fafafa] p-12 flex flex-col items-center text-center">
            <Link2 size={36} className="text-[#1a1a1a]/10 mb-3" />
            <p className="text-[#1a1a1a]/40 text-sm font-medium">No accounts connected yet</p>
            <p className="text-[#1a1a1a]/20 text-xs mt-1">Connect your first social account to start managing posts.</p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold bg-[#f5c800] hover:bg-[#f5c800] text-[#1a1a1a] transition-all flex items-center gap-2"
            >
              <Plus size={14} />
              Connect Account
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {PLATFORMS.filter((pf) => grouped[pf.id]?.length > 0).map((pf) => {
              const Icon = pf.icon;
              return (
                <div key={pf.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={15} style={{ color: pf.color }} />
                    <h3 className="text-sm font-semibold text-[#1a1a1a]/70">{pf.label}</h3>
                    <span className="text-xs text-[#1a1a1a]/20 font-mono">{grouped[pf.id].length}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {grouped[pf.id].map((acc) => (
                      <div
                        key={acc.id}
                        className={`rounded-xl p-4 border transition-all flex items-center gap-3 ${
                          acc.is_active
                            ? "bg-white border-[#e0e0e0]"
                            : "bg-white/[0.01] border-[#eee] opacity-60"
                        }`}
                      >
                        {/* Platform icon */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: pf.bg, color: pf.color }}
                        >
                          <Icon size={18} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1a1a1a]/90 truncate">{acc.account_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {acc.account_handle && (
                              <span className="text-xs text-[#1a1a1a]/40">@{acc.account_handle}</span>
                            )}
                            {(acc.clients as any)?.name && (
                              <span className="text-xs text-[#1a1a1a]/25">· {(acc.clients as any).name}</span>
                            )}
                          </div>
                        </div>

                        {/* Status + actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Active toggle */}
                          <button
                            onClick={() => handleToggle(acc)}
                            disabled={togglingId === acc.id}
                            className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:bg-[#eeeeee] disabled:opacity-30"
                            title={acc.is_active ? "Deactivate" : "Activate"}
                          >
                            {togglingId === acc.id ? (
                              <Loader2 size={13} className="animate-spin text-[#1a1a1a]/30" />
                            ) : acc.is_active ? (
                              <CheckCircle2 size={15} className="text-emerald-400" />
                            ) : (
                              <XCircle size={15} className="text-[#1a1a1a]/20" />
                            )}
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(acc.id)}
                            disabled={deletingId === acc.id}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-[#1a1a1a]/20 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-30"
                          >
                            {deletingId === acc.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAdd && (
        <AddAccountModal
          clients={clients}
          onClose={() => setShowAdd(false)}
          onAdded={() => { setShowAdd(false); fetchAccounts(); }}
        />
      )}
    </>
  );
}
