"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Users, FileText, Clock, CheckCircle2, Edit3, Share2, BarChart3, Plus, ArrowRight, TrendingUp, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import Link from "next/link";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PLATFORM_COLORS: Record<string,string> = { instagram:"#e1306c", twitter:"#1da1f2", facebook:"#1877f2", linkedin:"#0a66c2", youtube:"#ff0000" };
const STATUS_COLORS: Record<string,string> = { draft:"bg-white/10 text-white/40", scheduled:"bg-blue-500/10 text-blue-400", published:"bg-emerald-500/10 text-emerald-400", failed:"bg-red-500/10 text-red-400" };

export default function DashboardPage() {
  const [stats, setStats] = useState({ clients:0, total:0, scheduled:0, published:0, drafts:0, accounts:0 });
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [
        { count: clients }, { count: total }, { count: scheduled },
        { count: published }, { count: drafts }, { count: accounts },
        { data: posts }
      ] = await Promise.all([
        supabase.from("clients").select("*", { count:"exact", head:true }),
        supabase.from("posts").select("*", { count:"exact", head:true }),
        supabase.from("posts").select("*", { count:"exact", head:true }).eq("status","scheduled"),
        supabase.from("posts").select("*", { count:"exact", head:true }).eq("status","published"),
        supabase.from("posts").select("*", { count:"exact", head:true }).eq("status","draft"),
        supabase.from("social_accounts").select("*", { count:"exact", head:true }),
        supabase.from("posts").select("*, clients(name)").order("created_at", { ascending:false }).limit(5),
      ]);
      setStats({ clients:clients??0, total:total??0, scheduled:scheduled??0, published:published??0, drafts:drafts??0, accounts:accounts??0 });
      setRecentPosts(posts ?? []);
      const last7: any[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString("en-IN", { weekday:"short" });
        const dayStart = new Date(d); dayStart.setHours(0,0,0,0);
        const dayEnd = new Date(d); dayEnd.setHours(23,59,59,999);
        const count = (posts ?? []).filter(p => {
          const pd = new Date(p.created_at);
          return pd >= dayStart && pd <= dayEnd;
        }).length;
        last7.push({ day: label, posts: count });
      }
      setChartData(last7);
      setLoading(false);
    }
    load();
  }, []);

  const STAT_CARDS = [
    { label:"Total Clients", value:stats.clients, icon:<Users size={16}/>, color:"text-violet-400", bg:"bg-violet-500/10", href:"/clients" },
    { label:"Total Posts", value:stats.total, icon:<FileText size={16}/>, color:"text-blue-400", bg:"bg-blue-500/10", href:"/posts" },
    { label:"Scheduled", value:stats.scheduled, icon:<Clock size={16}/>, color:"text-amber-400", bg:"bg-amber-500/10", href:"/calendar" },
    { label:"Published", value:stats.published, icon:<CheckCircle2 size={16}/>, color:"text-emerald-400", bg:"bg-emerald-500/10", href:"/posts" },
    { label:"Drafts", value:stats.drafts, icon:<Edit3 size={16}/>, color:"text-white/50", bg:"bg-white/5", href:"/posts" },
    { label:"Social Accounts", value:stats.accounts, icon:<Share2 size={16}/>, color:"text-pink-400", bg:"bg-pink-500/10", href:"/social-accounts" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-white/40 mt-1">{new Date().toLocaleDateString("en-IN", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}</p>
        </div>
        <Link href="/create-post" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all">
          <Plus size={15}/>New Post
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAT_CARDS.map(card => (
          <Link key={card.label} href={card.href} className="rounded-xl p-4 border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
            <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center mb-3 ${card.color}`}>{card.icon}</div>
            <div className="text-2xl font-bold text-white tabular-nums">{loading ? "—" : card.value}</div>
            <div className="text-xs text-white/40 mt-0.5">{card.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2"><BarChart3 size={15} className="text-white/40"/><h2 className="text-sm font-semibold text-white/80">Posts This Week</h2></div>
            <Link href="/posts" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">View all<ArrowRight size={11}/></Link>
          </div>
          {chartData.some(d => d.posts > 0) ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="day" tick={{ fill:"rgba(255,255,255,0.3)", fontSize:11 }} axisLine={false} tickLine={false}/>
                <YAxis allowDecimals={false} tick={{ fill:"rgba(255,255,255,0.3)", fontSize:11 }} axisLine={false} tickLine={false} width={20}/>
                <Tooltip contentStyle={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"white", fontSize:12 }} cursor={{ fill:"rgba(255,255,255,0.03)" }}/>
                <Bar dataKey="posts" fill="#6366f1" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[180px] text-white/20 text-sm">No posts this week</div>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-4"><TrendingUp size={15} className="text-white/40"/><h2 className="text-sm font-semibold text-white/80">Quick Actions</h2></div>
          <div className="space-y-2">
            {[
              { label:"Create new post", href:"/create-post", icon:<Plus size={14}/>, color:"text-indigo-400" },
              { label:"View calendar", href:"/calendar", icon:<Calendar size={14}/>, color:"text-blue-400" },
              { label:"Add social account", href:"/social-accounts", icon:<Share2 size={14}/>, color:"text-pink-400" },
              { label:"View analytics", href:"/analytics", icon:<BarChart3 size={14}/>, color:"text-emerald-400" },
            ].map(a => (
              <Link key={a.href} href={a.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all group border border-transparent hover:border-white/10">
                <span className={a.color}>{a.icon}</span>
                <span className="text-sm text-white/60 group-hover:text-white/80">{a.label}</span>
                <ArrowRight size={12} className="ml-auto text-white/20 group-hover:text-white/40"/>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><FileText size={15} className="text-white/40"/><h2 className="text-sm font-semibold text-white/80">Recent Posts</h2></div>
          <Link href="/posts" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">View all<ArrowRight size={11}/></Link>
        </div>
        {recentPosts.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <FileText size={28} className="text-white/10 mb-2"/>
            <p className="text-white/30 text-sm">No posts yet</p>
            <Link href="/create-post" className="mt-3 text-xs text-indigo-400 hover:text-indigo-300">Create your first post →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentPosts.map(post => (
              <div key={post.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-all">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: PLATFORM_COLORS[post.platform] ?? "#6366f1" }}/>
                <p className="text-sm text-white/70 truncate flex-1">{post.caption}</p>
                <span className="text-xs text-white/30 capitalize hidden sm:block">{post.clients?.name ?? "—"}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${STATUS_COLORS[post.status] ?? STATUS_COLORS.draft}`}>{post.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}