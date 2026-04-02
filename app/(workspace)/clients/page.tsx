"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Loader2, Plus, Users } from "lucide-react";

type ClientRow = {
  id: string;
  name: string | null;
  email: string | null;
  status: string | null
  package_reels: number | null
  package_posts: number | null
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
  const normalized = status?.toLowerCase();
  if (normalized === "inactive") {
    return {
      label: "Inactive",
      className: "border-white/15 bg-white/5 text-zinc-300",
    };
  }

  return {
    label: "Active",
    className: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
  };
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [editingPkg, setEditingPkg] = useState<string | null>(null);
  const [pkgValues, setPkgValues] = useState({ reels: 0, posts: 0, stories: 0 });
  const [savingPkg, setSavingPkg] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadClients = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;
      if (!user) {
        setClients([]);
        setLoading(false);
        return;
      }

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

  return () => {
      active = false;
    };
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

  return (
    <div className="space-y-6 rounded-2xl bg-[#0f0f1a] p-2">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Clients</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {loading
              ? "Loading clients..."
              : `${clients.length} client${clients.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <Link
          href="/clients/new"
          className="inline-flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/20 px-4 py-2 text-sm font-medium text-violet-200 transition hover:bg-violet-500/30"
        >
          <Plus className="h-4 w-4" />
          Add client
        </Link>
      </header>

      {loading ? (
        <div className="flex h-44 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]">
          <Loader2 className="h-5 w-5 animate-spin text-violet-300" />
        </div>
      ) : clients.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-zinc-500" />
          <p className="text-sm text-zinc-300">No clients yet.</p>
          <p className="mt-1 text-xs text-zinc-500">
            Add your first client to start managing social accounts and campaigns.
          </p>
          <Link
            href="/clients/new"
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-violet-400/30 bg-violet-500/20 px-3 py-2 text-xs font-medium text-violet-200 transition hover:bg-violet-500/30"
          >
            <Plus className="h-3.5 w-3.5" />
            Add client
          </Link>
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {clients.map((client) => {
            const status = getStatusPill(client.status);
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

  return (
              <article
                key={client.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-500/25 text-sm font-semibold text-violet-100">
                      {getInitial(client.name)}
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-white">
                        {client.name?.trim() || "Unnamed Client"}
                      </h2>
                      <p className="text-xs text-zinc-400">
                        {client.email?.trim() || "No email provided"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${status.className}`}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  {[
                    { label: "Posts",   used: 0, total: client.package_posts   ?? 0 },
                    { label: "Reels",   used: 0, total: client.package_reels   ?? 0 },
                    { label: "Stories", used: 0, total: client.package_stories ?? 0 },
                  ].map(({ label, used, total }) => {
                    const pct = total === 0 ? 0 : Math.min((used / total) * 100, 100);
                    const color = used > total ? "bg-red-500" : pct >= 80 ? "bg-yellow-500" : "bg-violet-500";
                    return (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-zinc-400">{label}</span>
                          <span className={used > total ? "text-red-400 font-semibold" : "text-zinc-400"}>
                            {used} / {total === 0 ? "Not set" : total}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {editingPkg === client.id ? (
                  <div className="mt-4 border-t border-white/10 pt-4 space-y-3">
                    <p className="text-xs font-medium text-zinc-300">Set Monthly Package</p>
                    {[
                      { key: "posts",   label: "Posts" },
                      { key: "reels",   label: "Reels" },
                      { key: "stories", label: "Stories" },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-xs text-zinc-400 w-16">{label}</span>
                        <input
                          type="number"
                          min={0}
                          value={pkgValues[key as keyof typeof pkgValues]}
                          onChange={e => setPkgValues(prev => ({ ...prev, [key]: parseInt(e.target.value) || 0 }))}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:ring-1 focus:ring-violet-400"
                        />
                      </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setEditingPkg(null)}
                        className="flex-1 py-1.5 rounded-lg text-xs text-zinc-400 bg-white/5 hover:bg-white/10 transition-all">
                        Cancel
                      </button>
                      <button onClick={() => savePackage(client.id)} disabled={savingPkg}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white bg-violet-500 hover:bg-violet-600 transition-all disabled:opacity-50">
                        {savingPkg ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 border-t border-white/10 pt-3 flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Created {formatDate(client.created_at)}</span>
                    <button onClick={() => startEdit(client)}
                      className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
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