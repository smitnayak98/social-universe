"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  FileText, Plus, Search, Filter, Loader2, Clock,
  CheckCircle2, AlertCircle, Edit3, Trash2,
  Instagram, Twitter, Facebook, Linkedin, Youtube, Globe,
} from "lucide-react";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Client { id: string; name: string; }
interface Post {
  id: string; content: string; platform: string; status: string;
  scheduled_at: string | null; created_at: string; client_id: string | null;
  clients: { id: string; name: string } | null;
}

const platformIcons: Record<string, React.ElementType> = {
  instagram: Instagram, twitter: Twitter, facebook: Facebook,
  linkedin: Linkedin, youtube: Youtube,
};
const platformStyles: Record<string, string> = {
  instagram: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  twitter: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  facebook: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  linkedin: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  youtube: "text-red-400 bg-red-500/10 border-red-500/20",
};
const statusConfig: Record<string, { label: string; icon: React.ElementType; style: string }> = {
  draft: { label: "Draft", icon: Edit3, style: "text-zinc-400 bg-zinc-700/40 border-zinc-600/30" },
  scheduled: { label: "Scheduled", icon: Clock, style: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  published: { label: "Published", icon: CheckCircle2, style: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  failed: { label: "Failed", icon: AlertCircle, style: "text-red-400 bg-red-500/10 border-red-500/20" },
};
const PLATFORMS = ["all", "instagram", "twitter", "facebook", "linkedin", "youtube"];
const STATUSES = ["all", "draft", "scheduled", "published", "failed"];

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    let query = supabase
      .from("posts")
      .select("id, content, platform, status, scheduled_at, created_at, client_id, clients(id, name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (platformFilter !== "all") query = query.eq("platform", platformFilter);
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (clientFilter !== "all") query = query.eq("client_id", clientFilter);
    const { data } = await query;
    setPosts((data as Post[]) ?? []);
    setLoading(false);
  }, [platformFilter, statusFilter, clientFilter]);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("clients").select("id, name").eq("user_id", user.id).order("name");
      setClients((data as Client[]) ?? []);
    }
    init();
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  async function deletePost(id: string) {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setDeletingId(id);
    await supabase.from("posts").delete().eq("id", id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setDeletingId(null);
  }

  const filteredPosts = posts.filter((p) =>
    searchQuery ? p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.clients?.name?.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );
  const activeFilters = (platformFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0) + (clientFilter !== "all" ? 1 : 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Posts</h1>
          <p className="text-sm text-zinc-400 mt-1">{loading ? "Loading…" : `${filteredPosts.length} post${filteredPosts.length !== 1 ? "s" : ""}`}</p>
        </div>
        <a href="/create-post" className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
          <Plus className="w-4 h-4" />New Post
        </a>
      </div>

      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input type="text" placeholder="Search posts…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/60 transition-colors" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${showFilters || activeFilters > 0 ? "bg-violet-600/20 border-violet-500/40 text-violet-300" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"}`}>
            <Filter className="w-4 h-4" />Filters
            {activeFilters > 0 && <span className="bg-violet-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{activeFilters}</span>}
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500 uppercase tracking-wider">Platform</label>
              <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2 focus:outline-none">
                {PLATFORMS.map((p) => <option key={p} value={p}>{p === "all" ? "All Platforms" : p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500 uppercase tracking-wider">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2 focus:outline-none">
                {STATUSES.map((s) => <option key={s} value={s}>{s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500 uppercase tracking-wider">Client</label>
              <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2 focus:outline-none">
                <option value="all">All Clients</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {activeFilters > 0 && (
              <div className="flex items-end">
                <button onClick={() => { setPlatformFilter("all"); setStatusFilter("all"); setClientFilter("all"); }}
                  className="text-xs text-zinc-500 hover:text-zinc-300 px-3 py-2 transition-colors">Clear all</button>
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-5 h-5 animate-spin text-violet-400" /></div>
      ) : filteredPosts.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-12 text-center">
          <FileText className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-400">{searchQuery || activeFilters > 0 ? "No posts match your filters." : "No posts yet. Create your first post!"}</p>
          {!searchQuery && activeFilters === 0 && (
            <a href="/create-post" className="mt-4 inline-flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors">
              <Plus className="w-4 h-4" />Create post
            </a>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
          <div className="divide-y divide-zinc-800">
            {filteredPosts.map((post) => {
              const PlatformIcon = platformIcons[post.platform] ?? Globe;
              const platformStyle = platformStyles[post.platform] ?? "text-zinc-400 bg-zinc-700/40 border-zinc-600/30";
              const status = statusConfig[post.status] ?? statusConfig.draft;
              const StatusIcon = status.icon;
              return (
                <div key={post.id} className="px-6 py-4 flex items-start gap-4 hover:bg-zinc-800/30 transition-colors group">
                  <div className={`mt-0.5 p-2 rounded-lg border flex-shrink-0 ${platformStyle}`}><PlatformIcon className="w-4 h-4" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 line-clamp-2 leading-relaxed">{post.content}</p>
                    <div className="flex items-center gap-3 mt-2">
                      {post.clients?.name && <span className="text-xs text-zinc-500 font-medium">{post.clients.name}</span>}
                      <span className="text-xs text-zinc-600">
                        {post.scheduled_at
                          ? `Scheduled: ${new Date(post.scheduled_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
                          : `Created: ${new Date(post.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${status.style}`}>
                      <StatusIcon className="w-3 h-3" />{status.label}
                    </span>
                    <button onClick={() => deletePost(post.id)} disabled={deletingId === post.id}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Delete post">
                      {deletingId === post.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}