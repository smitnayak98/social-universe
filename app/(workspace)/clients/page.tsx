"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Loader2, Plus, Users } from "lucide-react";

type ClientRow = {
  id: string;
  name: string | null;
  email: string | null;
  status: string | null;
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
        .select("id, name, email, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!active) return;
      setClients((data as ClientRow[]) ?? []);
      setLoading(false);
    };

    loadClients();

    return () => {
      active = false;
    };
  }, []);

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

                <div className="mt-5 border-t border-white/10 pt-3 text-xs text-zinc-400">
                  Created {formatDate(client.created_at)}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}