"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  Search, Trash2, Pencil, Globe, AlertCircle, CheckCircle, Clock,
  FileText, ChevronDown, CheckSquare, Square, XCircle, Send,
  Instagram, Facebook, Loader2, Zap,
} from "lucide-react";
import EditPostModal from "@/components/EditPostModal";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#e1306c", twitter: "#1da1f2", facebook: "#1877f2",
  linkedin: "#0a66c2", youtube: "#ff0000",
};
const STATUS_STYLES: Record<string, string> = {
  draft: "bg-[#f5f5f5] text-[#1a1a1a]/50 border-[#e0e0e0]",
  scheduled: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  published: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  failed: "bg-red-500/10 text-red-500 border-red-500/20",
};
const STATUS_ICONS: Record<string, any> = {
  draft: <FileText size={11} />,
  scheduled: <Clock size={11} />,
  published: <CheckCircle size={11} />,
  failed: <AlertCircle size={11} />,
};
const APPROVAL_STYLES: Record<string, string> = {
  none: "", pending: "text-amber-500", approved: "text-emerald-600", rejected: "text-red-500",
};
const APPROVAL_LABELS: Record<string, string> = {
  none: "", pending: "Pending", approved: "Approved", rejected: "Rejected",
};

function PlatformChip({ platform }: { platform: string }) {
  const color = PLATFORM_COLORS[platform] ?? "#999";
  const icons: Record<string, any> = {
    instagram: <Instagram size={10} />,
    facebook: <Facebook size={10} />,
  };
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize"
      style={{ color, borderColor: `${color}30`, background: `${color}10` }}
    >
      {icons[platform] ?? <Globe size={10} />}
      {platform}
    </span>
  );
}

function PublishDropdown({ post, onPublished }: { post: any; onPublished: () => void }) {
  const [open, setOpen] = useState(false);
  const [publishingIg, setPublishingIg] = useState(false);
  const [publishingFb, setPublishingFb] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ msg: string; ok: boolean } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const showToast = (msg: string, ok: boolean) => {
    setToastMsg({ msg, ok });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const publishInstagram = async () => {
    setPublishingIg(true); setOpen(false);
    try {
      const res = await fetch("/api/instagram/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: post.id }),
      });
      const data = await res.json();
      if (data.error) showToast("Instagram: " + data.error, false);
      else { showToast("Published to Instagram!", true); onPublished(); }
    } catch { showToast("Instagram publish failed", false); }
    setPublishingIg(false);
  };

  const publishFacebook = async () => {
    setPublishingFb(true); setOpen(false);
    try {
      const res = await fetch("/api/facebook/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: post.id }),
      });
      const data = await res.json();
      if (data.error) showToast("Facebook: " + data.error, false);
      else { showToast(data.message, true); onPublished(); }
    } catch { showToast("Facebook publish failed", false); }
    setPublishingFb(false);
  };

  const isPublishing = publishingIg || publishingFb;

  return (
    <div ref={ref} className="relative">
      {toastMsg && (
        <div className={"fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl text-sm font-medium shadow-xl text-white max-w-xs " + (toastMsg.ok ? "bg-emerald-500" : "bg-red-500")}>
          {toastMsg.msg}
        </div>
      )}
      {isPublishing ? (
        <div className="w-7 h-7 flex items-center justify-center">
          <Loader2 size={13} className="animate-spin text-[#b8930a]" />
        </div>
      ) : (
        <button
          onClick={() => setOpen(o => !o)}
          title="Publish now"
          className="w-7 h-7 rounded-md flex items-center justify-center transition-all text-[#1a1a1a]/30 hover:text-[#f5c800] hover:bg-[#f5c800]/10"
        >
          <Zap size={13} />
        </button>
      )}
      {open && (
        <div className="absolute right-0 top-8 z-50 w-52 bg-white border border-[#e0e0e0] rounded-xl shadow-xl overflow-hidden">
          <p className="px-3 py-2 text-[10px] font-semibold text-[#1a1a1a]/30 uppercase tracking-wider border-b border-[#f0f0f0]">
            Publish Now
          </p>
          <button
            onClick={publishInstagram}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#1a1a1a]/70 hover:bg-[#f9f0f4] hover:text-[#e1306c] transition-colors"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Instagram size={12} className="text-white" />
            </div>
            Post to Instagram
          </button>
          <button
            onClick={publishFacebook}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#1a1a1a]/70 hover:bg-[#f0f4fb] hover:text-[#1877f2] transition-colors"
          >
            <div className="w-6 h-6 rounded-lg bg-[#1877f2] flex items-center justify-center flex-shrink-0">
              <Facebook size={12} className="text-white" />
            </div>
            Post to Facebook Page
          </button>
        </div>
      )}
    </div>
  );
}

export default function PostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [clients, setClients] = useState<any[]>([]);
  const [editPost, setEditPost] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("posts").select("*, clients(name)").order("created_at", { ascending: false });
    if (filterStatus) query = query.eq("status", filterStatus);
    if (filterClient) query = query.eq("client_id", filterClient);
    if (search) query = query.ilike("caption", `%${search}%`);
    const { data } = await query;
    setPosts(data ?? []);
    setLoading(false);
    setSelected(new Set());
  }, [filterStatus, filterClient, search]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  useEffect(() => {
    supabase.from("clients").select("id, name").order("name")
      .then(({ data }) => { if (data) setClients(data); });
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this post?")) return;
    setDeletingId(id);
    await supabase.from("posts").delete().eq("id", id);
    setPosts(prev => prev.filter(p => p.id !== id));
    setDeletingId(null);
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(selected.size === posts.length ? new Set() : new Set(posts.map(p => p.id)));
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selected.size} posts?`)) return;
    setBulkLoading(true);
    await supabase.from("posts").delete().in("id", Array.from(selected));
    await fetchPosts();
    setBulkLoading(false);
  }

  async function bulkStatus(status: string) {
    setBulkLoading(true);
    await supabase.from("posts").update({ status }).in("id", Array.from(selected));
    await fetchPosts();
    setBulkLoading(false);
  }

  async function submitForApproval(id: string) {
    await supabase.from("posts").update({ approval_status: "pending" }).eq("id", id);
    setPosts(prev => prev.map(p => p.id === id ? { ...p, approval_status: "pending" } : p));
  }

  function getPostPlatforms(post: any): string[] {
    if (Array.isArray(post.platforms) && post.platforms.length > 0) return post.platforms;
    if (post.platform) return [post.platform];
    return [];
  }

  const hasFilters = filterStatus || filterClient || search;

  return (
    <>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">Posts</h1>
            <p className="text-sm text-[#1a1a1a]/40 mt-1">{posts.length} post{posts.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1a1a1a]/30" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts..."
              className="w-full pl-9 pr-4 py-2 rounded-lg text-sm bg-[#f5f5f5] border border-[#e0e0e0] text-[#1a1a1a] placeholder:text-[#1a1a1a]/20 focus:outline-none focus:border-[#f5c800]/50" />
          </div>
          <div className="relative">
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1a1a1a]/30 pointer-events-none" />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="pl-3 pr-8 py-2 rounded-lg text-sm bg-[#f5f5f5] border border-[#e0e0e0] text-[#1a1a1a] appearance-none focus:outline-none">
              <option value="">All Statuses</option>
              {["draft","scheduled","published","failed"].map(s =>
                <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
            </select>
          </div>
          <div className="relative">
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1a1a1a]/30 pointer-events-none" />
            <select value={filterClient} onChange={e => setFilterClient(e.target.value)}
              className="pl-3 pr-8 py-2 rounded-lg text-sm bg-[#f5f5f5] border border-[#e0e0e0] text-[#1a1a1a] appearance-none focus:outline-none">
              <option value="">All Clients</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {hasFilters && (
            <button onClick={() => { setFilterStatus(""); setFilterClient(""); setSearch(""); }}
              className="px-3 py-2 rounded-lg text-sm text-[#1a1a1a]/40 hover:text-[#1a1a1a] hover:bg-[#f5f5f5] border border-[#e0e0e0]">
              Clear
            </button>
          )}
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl bg-[#f5c800]/10 border border-[#f5c800]/20">
            <span className="text-sm font-medium text-[#b8930a]">{selected.size} selected</span>
            <div className="flex items-center gap-2 ml-auto">
              {[
                { label: "Draft", val: "draft", icon: <FileText size={12} /> },
                { label: "Schedule", val: "scheduled", icon: <Clock size={12} /> },
              ].map(s => (
                <button key={s.val} onClick={() => bulkStatus(s.val)} disabled={bulkLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#eeeeee] hover:bg-[#e4e4e4] text-[#1a1a1a]/70 transition-all disabled:opacity-40">
                  {s.icon}{s.label}
                </button>
              ))}
              <button onClick={bulkDelete} disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all disabled:opacity-40">
                <Trash2 size={12} />Delete
              </button>
              <button onClick={() => setSelected(new Set())}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[#1a1a1a]/30 hover:text-[#1a1a1a] hover:bg-[#eeeeee]">
                <XCircle size={13} />
              </button>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-[#e0e0e0] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-[#1a1a1a]/30 text-sm gap-2">
              <Loader2 size={16} className="animate-spin" />Loading...
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center py-20">
              <FileText size={32} className="text-[#1a1a1a]/10 mb-3" />
              <p className="text-[#1a1a1a]/30 text-sm">No posts found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                  <th className="px-4 py-3 w-10">
                    <button onClick={toggleAll} className="text-[#1a1a1a]/30 hover:text-[#1a1a1a]/60">
                      {selected.size === posts.length && posts.length > 0 ? <CheckSquare size={14} /> : <Square size={14} />}
                    </button>
                  </th>
                  {["Content", "Platforms", "Status", "Approval", "Client", "Scheduled", ""].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-[#1a1a1a]/30 uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {posts.map(post => {
                  const postPlatforms = getPostPlatforms(post);
                  return (
                    <tr key={post.id} className={"border-b border-[#eee] last:border-0 transition-colors " + (selected.has(post.id) ? "bg-[#f5c800]/5" : "hover:bg-[#fafafa]")}>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleSelect(post.id)} className="text-[#1a1a1a]/30 hover:text-[#b8930a]">
                          {selected.has(post.id) ? <CheckSquare size={14} className="text-[#b8930a]" /> : <Square size={14} />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-[#1a1a1a]/80 line-clamp-2 max-w-xs">{post.caption}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {postPlatforms.length > 0
                            ? postPlatforms.map(p => <PlatformChip key={p} platform={p} />)
                            : <span className="text-xs text-[#1a1a1a]/20">-</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={"inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border capitalize " + (STATUS_STYLES[post.status] ?? STATUS_STYLES.draft)}>
                          {STATUS_ICONS[post.status]}{post.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {post.approval_status && post.approval_status !== "none" ? (
                          <span className={"text-xs font-medium " + APPROVAL_STYLES[post.approval_status]}>
                            {APPROVAL_LABELS[post.approval_status]}
                          </span>
                        ) : (
                          <button onClick={() => submitForApproval(post.id)}
                            className="text-xs text-[#1a1a1a]/25 hover:text-[#b8930a] flex items-center gap-1">
                            <Send size={10} />Submit
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#1a1a1a]/50">{post.clients?.name ?? "-"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[#1a1a1a]/40 font-mono">
                          {post.scheduled_at
                            ? new Date(post.scheduled_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                            : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <PublishDropdown post={post} onPublished={fetchPosts} />
                          <button onClick={() => setEditPost(post)}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-[#1a1a1a]/30 hover:text-[#b8930a] hover:bg-[#f5c800]/10 transition-all">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDelete(post.id)} disabled={deletingId === post.id}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-[#1a1a1a]/30 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-30">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editPost && (
        <EditPostModal
          post={editPost}
          onClose={() => setEditPost(null)}
          onSaved={() => { setEditPost(null); fetchPosts(); }}
        />
      )}
    </>
  );
}
