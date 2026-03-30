"use client";
import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Bell, X, FileText, Clock, CheckCircle2, Edit3, AlertCircle, RefreshCw } from "lucide-react";
const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const PLATFORM_COLORS: Record<string,string> = { instagram:"#e1306c", twitter:"#1da1f2", facebook:"#1877f2", linkedin:"#0a66c2", youtube:"#ff0000" };
const STATUS_ICON: Record<string,any> = { draft:<FileText size={12}/>, scheduled:<Clock size={12}/>, published:<CheckCircle2 size={12}/>, failed:<AlertCircle size={12}/> };
const STATUS_COLOR: Record<string,string> = { draft:"text-white/40", scheduled:"text-blue-400", published:"text-emerald-400", failed:"text-red-400" };
function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff/60000); const hrs = Math.floor(diff/3600000); const days = Math.floor(diff/86400000);
  if (mins < 1) return "just now"; if (mins < 60) return `${mins}m ago`; if (hrs < 24) return `${hrs}h ago`; return `${days}d ago`;
}
export default function ActivityFeed() {
  const [open, setOpen] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("posts").select("*, clients(name)").order("updated_at", { ascending: false }).limit(20);
    setActivities(data ?? []);
    setUnread(data?.filter(p => { const d = new Date(p.updated_at ?? p.created_at); return Date.now()-d.getTime() < 3600000*24; }).length ?? 0);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);
  return (
    <>
      <button onClick={() => setOpen(true)} className="relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/40 hover:text-white/80 hover:bg-white/5 border border-transparent transition-all">
        <Bell size={16} className="flex-shrink-0 text-white/30"/>
        Activity
        {unread > 0 && <span className="ml-auto w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}/>
          <div className="fixed right-0 top-0 h-full w-80 z-50 flex flex-col shadow-2xl" style={{ background: "#0f0f1a", borderLeft: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2"><Bell size={15} className="text-indigo-400"/><h2 className="text-sm font-semibold text-white">Activity Feed</h2></div>
              <div className="flex items-center gap-2">
                <button onClick={load} className="w-7 h-7 rounded-md flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all"><RefreshCw size={13} className={loading ? "animate-spin" : ""}/></button>
                <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-md flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all"><X size={14}/></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading && activities.length === 0 ? (
                <div className="flex items-center justify-center py-20 text-white/30 text-sm">Loading…</div>
              ) : activities.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-center px-6">
                  <Bell size={32} className="text-white/10 mb-3"/>
                  <p className="text-white/30 text-sm">No actity yet</p>
                  <p className="text-white/20 text-xs mt-1">Posts you create and update will appear here</p>
                </div>
              ) : (
                <div className="p-4 space-y-1">
                  {activities.map((post, i) => {
                    const isNew = Date.now() - new Date(post.updated_at ?? post.created_at).getTime() < 3600000*24;
                    return (
                      <div key={post.id} className={`flex items-start gap-3 px-3 py-3 rounded-lg transition-all ${isNew ? "bg-white/[0.03]" : ""} hover:bg-white/[0.04]`}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${PLATFORM_COLORS[post.platform]??'#6366f1'}20`, color: PLATFORM_COLORS[post.platform]??'#6366f1' }}>
                          <span className={STATUS_COLOR[post.status]}>{STATUS_ICON[post.status]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">{post.content || "Untitled post"}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] capitalize font-medium" style={{ color: PLATFORM_COLORS[post.platform]??'#6366f1' }}>{post.platform}</span>
                            <span className={`text-[10px] capitalize ${STATUS_COLOR[post.status]}`}>{post.status}</span>
                            {post.clients?.name && <span className="text-[10px] text-white/25">{post.clients.name}</span>}
                          </div>
                          <p className="text-[10px] text-white/25 mt-1">{timeAgo(post.updated_at ?? post.created_at)}</p>
                        </div>
                        {isNew && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5"/>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-white/10">
              <p className="text-[10px] text-white/20 text-center">Showing last 20 post activities</p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
