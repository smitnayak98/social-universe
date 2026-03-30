"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { User, Users, Bell, Shield, Trash2, Plus, Loader2, CheckCircle2, Crown, Edit3, Eye } from "lucide-react";
const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const ROLE_STYLES: Record<string,string> = { admin: "text-amber-400 bg-amber-500/10 border-amber-500/20", editor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20", viewer: "text-white/40 bg-white/5 border-white/10" };
const ROLE_ICONS: Record<string,any> = { admin: <Crown size={11}/>, editor: <Edit3 size={11}/>, viewer: <Eye size={11}/> };
type Tab = "profile" | "team" | "notifications";
export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [inviteName, setInviteName] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [deletingId, setDeletingId] = useState<string|null>(null);
  const [notifPrefs, setNotifPrefs] = useState({ post_published: true, post_failed: true, approval_requested: true, new_member: false });
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setProfile({ name: user?.user_metadata?.name ?? "", email: user?.email ?? "" });
    });
  }, []);
  async function fetchMembers() {
    setLoadingMembers(true);
    const { data } = await supabase.from("team_members").select("*").order("created_at", { ascending: false });
    setMembers(data ?? []);
    setLoadingMembers(false);
  }
  useEffect(() => { if (tab === "team") fetchMembers(); }, [tab]);
  async function saveProfile() {
    setSavingProfile(true);
    await supabase.auth.updateUser({ data: { name: profile.name } });
    setSavingProfile(false); setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  }
  async function inviteMember() {
    if (!inviteEmail.trim()) { setInviteError("Email is required."); return; }
    setInviting(true); setInviteError("");
    const { error } = await supabase.from("team_members").insert({ email: inviteEmail.trim(), name: inviteName.trim() || null, role: inviteRole, invited_by: user?.id });
    setInviting(false);
    if (error) { setInviteError(error.message); return; }
    setInviteEmail(""); setInviteName(""); setInviteRole("editor");
    fetchMembers();
  }
  async function deleteMember(id: string) {
    if (!confirm("Remove this team member?")) return;
    setDeletingId(id);
    await supabase.from("team_members").delete().eq("id", id);
    setMembers(prev => prev.filter(m => m.id !== id));
    setDeletingId(null);
  }
  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: "profile", label: "Profile", icon: <User size={14}/> },
    { id: "team", label: "Team", icon: <Users size={14}/> },
    { id: "notifications", label: "Notifications", icon: <Bell size={14}/> },
  ];
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6"><h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1><p className="text-sm text-white/40 mt-1">Manage your workspace and preferences</p></div>
      <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 mb-6 w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>
      {tab === "profile" && (
        <div className="space-y-5">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="text-sm font-semibold text-white/80 mb-5 flex items-center gap-2"><User size={14} className="text-white/40"/>Profile Information</h2>
            <div className="space-y-4">
              <div><label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5 block">Display Name</label>
                <input value={profile.name} onChange={e => setProfile(p => ({...p, name: e.target.value}))} placeholder="Your name" className="w-full px-3 py-2.5 rounded-lg text-sm text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none placeholder:text-white/20"/>
              </div>
              <div><label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5 block">Email</label>
                <input value={profile.email} disabled className="w-full px-3 py-2.5 rounded-lg text-sm text-white/40 bg-white/[0.02] border border-white/5 cursor-not-allowed"/>
                <p className="text-xs text-white/25 mt-1">Email cannot be changed here</p>
              </div>
              <button onClick={saveProfile} disabled={savingProfile} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-all">
                {savingProfile ? <Loader2 size={13} className="animate-spin"/> : profileSaved ? <CheckCircle2 size={13}/> : null}
                {profileSaved ? "Saved!" : savingProfile ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
          <h2 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2"><Shield size={14}/>Danger Zone</h2><p className="text-xs text-white/40 mb-4">Once you delete your account, there is no going back. All your data will be permanently removed.</p>            <button className="px-4 py-2 rounded-lg text-sm font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all">Delete Account</button>
          </div>
        </div>
      )}
      {tab === "team" && (
        <div className="space-y-5">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="text-sm font-semibold text-white/80 mb-5 flex items-center gap-2"><Plus size={14} className="text-white/40"/>Add Team Member</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Name (optional)" className="px-3 py-2 rounded-lg text-sm text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none placeholder:text-white/20"/>
              <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Email address *" className="px-3 py-2 rounded-lg text-sm text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none placeholder:text-white/20"/>
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="px-3 py-2 rounded-lg text-sm text-white bg-white/5 border border-white/10 focus:outline-none">
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            {inviteError && <p className="text-xs text-red-400 mb-3">{inviteError}</p>}
            <button onClick={inviteMember} disabled={inviting} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-all">
              {inviting ? <Loader2 size={13} className="animate-spin"/> : <Plus size={13}/>}
              {inviting ? "Adding…" : "Add Member"}
            </button>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2"><Users size={14} className="text-white/40"/><h2 className="text-sm font-semibold text-white/80">Team Members</h2><span className="text-xs text-white/30 font-mono ml-auto">{members.length}</span></div>
            {loadingMembers ? (
              <div className="flex items-center justify-center py-10 text-white/30 text-sm">Loading…</div>
            ) : members.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center"><Users size={28} className="text-white/10 mb-2"/><p className="text-white/30 text-sm">No team members yet</p><p className="text-white/20 text-xs mt-1">Add your first team member above</p></div>
            ) : (
              <div clame="divide-y divide-white/5">
                {members.map(m => (
                  <div key={m.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-all">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400 flex-shrink-0">{(m.name || m.email).charAt(0).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/80 truncate">{m.name || "—"}</p>
                      <p className="text-xs text-white/40 truncate">{m.email}</p>
                    </div>
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border capitalize ${ROLE_STYLES[m.role]}`}>{ROLE_ICONS[m.role]}{m.role}</span>
                    <button onClick={() => deleteMember(m.id)} disabled={deletingId === m.id} className="w-7 h-7 rounded-md flex items-center justify-center text-white/20 hover:text-red-400 hor:bg-red-500/10 transition-all disabled:opacity-30">
                      {deletingId === m.id ? <Loader2 size={12} className="animate-spin"/> : <Trash2 size={12}/>}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {tab === "notifications" && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-sm font-semibold text-white/80 mb-5 flex items-center gap-2"><Bell size={14} className="text-white/40"/>Notification Preferences</h2>
          <div className="space-y-4">
            {[
              { key: "post_published", label: "Post Published", desc: "When a post is successfully published" },
              { key: "post_failed", label: "Post Failed", desc: "When a post fails to publish" },
              { key: "approval_requested", label: "Approval Requested", desc: "When a post is submitted for approval" },
              { key: "new_member", label: "New Team Member", desc: "When someone joins your team" },
            ].map(n => (
              <div key={n.key} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div><p className="text-sm text-white/80">{n.label}</p><p className="text-xs text-white/35 mt-0.5">{n.desc}</p></div>
                <button onClick={() => setNotifPrefs(p => ({...p, [n.key]: !p[n.key as keyof typeof p]}))} className={`relative w-10 h-5 rounded-full transition-all ${notifPrefs[n.key as keyof typeof notifPrefs] ? "bg-indigo-600" : "bg-white/10"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${notifPrefs[n.key as keyof typeof notifPrefs] ? "left-5" : "left-0.5"}`}/>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
