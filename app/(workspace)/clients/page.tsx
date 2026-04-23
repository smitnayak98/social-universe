"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Loader2, Plus, Users, Trash2, X } from "lucide-react";

type ClientRow = {
  id: string;
  name: string | null;
  email: string | null;
  status: string | null;
  package_reels: number | null;
  package_posts: number | null;
  package_stories: number | null;
  created_at: string | null;
};

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

function getInitial(name: string | null): string {
  if (!name?.trim()) return "?";
  return name.trim().charAt(0).toUpperCase();
}

function getStatusPill(status: string | null): { label: string; className: string } {
  if (status?.toLowerCase() === "inactive") {
    return { label: "Inactive", className: "border-white/15 bg-[#f5f5f5] text-[#444]" };
  }
  return { label: "Active", className: "border-green-300 bg-green-50 text-[#1a7a4a]" };
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ClientsPage() {
  const [clients,        setClients]        = useState<ClientRow[]>([]);
  const [editingPkg,     setEditingPkg]     = useState<string | null>(null);
  const [pkgValues,      setPkgValues]      = useState({ reels: 0, posts: 0, stories: 0 });
  const [savingPkg,      setSavingPkg]      = useState(false);
  const [loading,        setLoading]        = useState(true);
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);
  const [deleting,       setDeleting]       = useState(false);

  useEffect(() => {
    let active = true;
    const loadClients = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) { setClients([]); setLoading(false); return; }
      const { data } = await supabase
        .from("clients")
        .select("id, name, email, status, created_at, package_reels, package_posts, package_stories")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!active) return;
      setClients((data as ClientRow[]) ?? []);
      setLoading(false);
    };
    loadClients();
    return () => { active = false; };
  }, []);

  const savePackage = async (clientId: string) => {
    setSavingPkg(true);
    await supabase.from("clients").update({
      package_reels:   pkgValues.reels,
      package_posts:   pkgValues.posts,
      package_stories: pkgValues.stories,
    }).eq("id", clientId);
    setClients(prev => prev.map(c => c.id === clientId
      ? { ...c, package_reels: pkgValues.reels, package_posts: pkgValues.posts, package_stories: pkgValues.stories }
      : c
    ));
    setSavingPkg(false);
    setEditingPkg(null);
  };

  const startEdit = (client: ClientRow) => {
    setPkgValues({
      reels:   client.package_reels   ?? 0,
      posts:   client.package_posts   ?? 0,
      stories: client.package_stories ?? 0,
    });
    setEditingPkg(client.id);
  };

  const deleteClient = async (clientId: string) => {
    setDeleting(true);
    await supabase.from("posts").delete().eq("client_id", clientId);
    await supabase.from("social_accounts").delete().eq("client_id", clientId);
    await supabase.from("clients").delete().eq("id", clientId);
    setClients(prev => prev.filter(c => c.id !== clientId));
    setDeleteClientId(null);
    setDeleting(false);
  };

  return (
    <div className="space-y-6 rounded-2xl bg-white p-2">

      {/* Delete Confirmation Modal */}
      {deleteClientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#1a1a1a]">Remove Client</h3>
              <button onClick={() => setDeleteClientId(null)} className="p-1.5 rounded-lg hover:bg-[#f5f5f5] text-[#999]">
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-[#666] mb-2">
              Are you sure you want to remove <strong className="text-[#1a1a1a]">
                {clients.find(c => c.id === deleteClientId)?.name}
              </strong>?
            </p>
            <p className="text-xs text-red-400 mb-5">
              This will permanently delete the client and all their posts and social accounts.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteClientId(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#e0e0e0] text-sm text-[#555] hover:bg-[#f5f5f5] transition-all">
                Cancel
              </button>
              <button onClick={() => deleteClient(deleteClientId)} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-all">
                {deleting ? "Removing..." : "Remove Client"}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1a1a1a]">Clients</h1>
          <p className="mt-1 text-sm text-[#666]">
            {loading ? "Loading clients..." : `${clients.length} client${clients.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Link href="/clients/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[#f5c800] px-4 py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#e0b800] transition-all">
          <Plus className="h-4 w-4" /> Add client
        </Link>
      </header>

      {loading ? (
        <div className="flex h-44 items-center justify-center rounded-2xl border border-[#e0e0e0] bg-[#fafafa]">
          <Loader2 className="h-5 w-5 animate-spin text-[#b8930a]" />
        </div>
      ) : clients.length === 0 ? (
        <div className="rounded-2xl border border-[#e0e0e0] bg-[#fafafa] p-12 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-zinc-500" />
          <p className="text-sm text-[#444]">No clients yet.</p>
          <p className="mt-1 text-xs text-zinc-500">Add your first client to start managing social accounts.</p>
          <Link href="/clients/new"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#f5c800] px-4 py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#e0b800] transition-all">
            <Plus className="h-3.5 w-3.5" /> Add client
          </Link>
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {clients.map((client) => {
            const status = getStatusPill(client.status);
            return (
              <article key={client.id} className="rounded-2xl border border-[#e0e0e0] bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f5c800]/25 text-sm font-semibold text-[#7a6400]">
                      {getInitial(client.name)}
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-[#1a1a1a]">
                        {client.name?.trim() || "Unnamed Client"}
                      </h2>
                      <p className="text-xs text-[#666]">{client.email?.trim() || "No email provided"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${status.className}`}>
                      {status.label}
                    </span>
                    <button onClick={() => setDeleteClientId(client.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-[#ccc] hover:text-red-500 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {[
                    { label: "Posts",   used: 0, total: client.package_posts   ?? 0 },
                    { label: "Reels",   used: 0, total: client.package_reels   ?? 0 },
                    { label: "Stories", used: 0, total: client.package_stories ?? 0 },
                  ].map(({ label, used, total }) => {
                    const pct = total === 0 ? 0 : Math.min((used / total) * 100, 100);
                    const color = used > total ? "bg-red-500" : pct >= 80 ? "bg-yellow-500" : "bg-[#f5c800]";
                    return (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#666]">{label}</span>
                          <span className={used > total ? "text-red-400 font-semibold" : "text-[#666]"}>
                            {used} / {total === 0 ? "Not set" : total}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-[#eeeeee] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {editingPkg === client.id ? (
                  <div className="mt-4 border-t border-[#e0e0e0] pt-4 space-y-3">
                    <p className="text-xs font-medium text-[#444]">Set Monthly Package</p>
                    {[
                      { key: "posts",   label: "Posts" },
                      { key: "reels",   label: "Reels" },
                      { key: "stories", label: "Stories" },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-xs text-[#666] w-16">{label}</span>
                        <input type="number" min={0}
                          value={pkgValues[key as keyof typeof pkgValues]}
                          onChange={e => setPkgValues(prev => ({ ...prev, [key]: parseInt(e.target.value) || 0 }))}
                          className="flex-1 bg-[#f5f5f5] border border-[#e0e0e0] rounded-lg px-3 py-1.5 text-sm text-[#1a1a1a] outline-none focus:ring-1 focus:ring-[#f5c800]" />
                      </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setEditingPkg(null)}
                        className="flex-1 py-1.5 rounded-lg text-xs text-[#666] bg-[#f5f5f5] hover:bg-[#eeeeee] transition-all">
                        Cancel
                      </button>
                      <button onClick={() => savePackage(client.id)} disabled={savingPkg}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-[#1a1a1a] bg-[#f5c800] hover:bg-[#e0b800] transition-all disabled:opacity-50">
                        {savingPkg ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 border-t border-[#e0e0e0] pt-3 flex items-center justify-between">
                    <span className="text-xs text-[#666]">Created {formatDate(client.created_at)}</span>
                    <button onClick={() => startEdit(client)}
                      className="text-xs text-[#b8930a] hover:text-[#b8930a] transition-colors">
                      Set Package
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}