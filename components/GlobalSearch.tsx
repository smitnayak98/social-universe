"use client";
import { useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Search, FileText, Users, Link2, X, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const PLATFORM_COLORS: Record<string,string> = { instagram:"#e1306c", twitter:"#1da1f2", facebook:"#1877f2", linkedin:"#0a66c2", youtube:"#ff0000" };
export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ posts: any[]; clients: any[]; accounts: any[] }>({ posts: [], clients: [], accounts: [] });
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen(o => !o); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => { if (open) { setTimeout(() => inputRef.current?.focus(), 50); setQuery(""); setResults({ posts: [], clients: [], accounts: [] }); setSelected(0); } }, [open]);
  useEffect(() => {
    if (!query.trim()) { setResults({ posts: [], clients: [], accounts: [] }); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      const [{ data: posts }, { data: clients }, { data: accounts }] = await Promise.all([
        supabase.from("posts").select("id, caption, platform, status").ilike("caption", `%${query}%`).limit(5),
        supabase.from("clients").select("id, name, industry").ilike("name", `%${query}%`).limit(5),
        supabase.from("social_accounts").select("id, account_name, platform, account_handle").ilike("account_name", `%${query}%`).limit(5),
      ]);
      setResults({ posts: posts ?? [], clients: clients ?? [], accounts: accounts ?? [] });
      setLoading(false);
      setSelected(0);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);
  const allResults = [
    ...results.clients.map(c => ({ type: "client", label: c.name, sub: c.industry ?? "Client", href: "/clients", icon: <Users size={13}/>, color: "#a78bfa" })),
    ...results.posts.map(p => ({ type: "post", label: p.caption?.substring(0,60) ?? "Post", sub: `${p.platform} · ${p.status}`, href: "/posts", icon: <FileText size={13}/>, color: PLATFORM_COLORS[p.platform] ?? "#6366f1" })),
    ...results.accounts.map(a => ({ type: "account", label: a.account_name, sub: `${a.platform}${a.account_handle ? ` · @${a.account_handle}` : ""}`, href: "/social-accounts", icon: <Link2 size={13}/>, color: PLATFORM_COLORS[a.platform] ?? "#6366f1" })),
  ];
  const QUICK_LINKS = [
    { label: "Create Post", href: "/create-post", icon: <FileText size={13}/>, color: "#6366f1" },
    { label: "View Clients", href: "/clients", icon: <Users size={13}/>, color: "#a78bfa" },
    { label: "Social Accounts", href: "/social-accounts", icon: <Link2 size={13}/>, color: "#e1306c" },
  ];
  function navigate(href: string) { router.push(href); setOpen(false); }
  function handleKey(e: React.KeyboardEvent) {
    const items = query ? allResults : QUICK_LINKS;
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s+1, items.length-1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelected(s => Math.max(s-1, 0)); }
    if (e.key === "Enter") { const item = items[selected]; if (item) navigate(item.href); }
  }
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }} onClick={() => setOpen(false)}>
      <div className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl" style={{ background: "#12122a", border: "1px solid rgba(255,255,255,0.1)" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Search size={16} className="text-white/40 flex-shrink-0"/>
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKey} placeholder="Search posts, clients, accounts…" className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"/>
          <div className="flex items-center gap-2">
            {loading && <div className="w-3 h-3 rounded-full border border-white/20 border-t-white/60 animate-spin"/>}
            <kbd className="text-[10px] text-white/20 border border-white/10 rounded px-1.5 py-0.5">ESC</kbd>
            <button onClick={() => setOpen(false)} className="w-6 h-6 flex items-center justify-center rounded-md text-white/30 hover:text-white hover:bg-white/10"><X ze={13}/></button>
          </div>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {!query && (
            <div className="p-3">
              <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider px-2 mb-2">Quick Links</p>
              {QUICK_LINKS.map((item, i) => (
                <button key={item.href} onClick={() => navigate(item.href)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${selected === i ? "bg-white/10" : "hover:bg-white/5"}`}>
                  <span style={{ color: item.color }}>{item.icon}</span>
                  <span className="text-sm text-white/70">{item.label}</span>
                  <ArrowRight size={12} className="ml-auto text-white/20"/>
                </button>
              ))}
            </div>
          )}
          {query && allResults.length === 0 && !loading && (
            <div className="flex flex-col items-center py-10 text-white/30 text-sm"><Search size={24} className="mb-2 text-white/10"/>No results for "{query}"</div>
          )}
          {query && allResults.length > 0 && (
            <div className="p-3 space-y-0.5">
              {allResults.map((item, i) => (
                <button key={i} onClick={() => navigate(item.href)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${selected === i ? "bg-white/10" : "hover:bg-white/5"}`}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}20`, color: item.color }}>{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 truncate">{item.label}</p>
                    <p className="text-xs text-white/30 truncate capitalize">{item.sub}</p>
                  </div>
                  <ArrowRight size={12} className="text-white/20 flex-shrink-0"/>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="px-4 py-2 border-t border-white/10 flex items-center gap-4">
          <span className="text-[10px] text-white/20">↑↓ navigate</span>
          <span className="text-[10px] text-white/20">↵ open</span>
          <span className="text-[10px] text-white/20">esc close</span>
          <span className="text-[10px] text-white/20 ml-auto">⌘K to toggle</span>
        </div>
      </div>
    </div>
  );
}
