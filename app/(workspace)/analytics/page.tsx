"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Heart, MessageCircle, Eye, TrendingUp, Globe, BarChart3, Activity } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const PLATFORM_COLORS: Record<string, string> = { instagram: "#e1306c", twitter: "#1da1f2", facebook: "#1877f2", linkedin: "#0a66c2", youtube: "#ff0000" };
const TOOLTIP_STYLE = { background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "white", fontSize: 12 };
export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState<"likes"|"comments"|"reach"|"impressions">("likes");
  useEffect(() => {
    supabase.from("post_analytics").select("*, posts(platform, content, client_id, clients(name))").order("recorded_at", { ascending: false }).limit(200).then(({ data }) => { setAnalytics(data ?? []); setLoading(false); });
  }, []);
  const byPlatform: Record<string, any> = {};
  for (const row of analytics) {
    const p = row.posts?.platform ?? "unknown";
    if (!byPlatform[p]) byPlatform[p] = { platform: p, likes: 0, comments: 0, reach: 0, impressions: 0, posts: 0 };
    byPlatform[p].likes += row.likes ?? 0; byPlatform[p].comments += row.comments ?? 0;
    byPlatform[p].reach += row.reach ?? 0; byPlatform[p].impressions += row.impressions ?? 0; byPlatform[p].posts += 1;
  }
  const platformSummaries = Object.values(byPlatform).sort((a: any, b: any) => b[activeMetric] - a[activeMetric]);
  const totals = analytics.reduce((acc, row) => ({ likes: acc.likes+(row.likes??0), comments: acc.comments+(row.comments??0), reach: acc.reach+(row.reach??0), impressions: acc.impressions+(row.impressions??0) }), { likes:0, comments:0, reach:0, impressions:0 });
  const timelineData = analytics.slice(0, 30).reverse().map((row, i) => ({
    name: `#${i+1}`,
    likes: row.likes ?? 0,
    comments: row.comments ?? 0,
    reach: row.reach ?? 0,
    impressions: row.impressions ?? 0,
    platform: row.posts?.platform ?? "unknown",
  }));
  const METRICS = [
    { key: "likes" as const, label: "Likes", icon: <Heart size={15}/>, color: "text-pink-400", hex: "#ec4899", val: totals.likes },
    { key: "comments" as const, label: "Comments", icon: <MessageCircle size={15}/>, color: "text-blue-400", hex: "#60a5fa", val: totals.comments },
    { key: "reach" as const, label: "Reach", icon: <Eye size={15}/>, color: "text-violet-400", hex: "#a78bfa", val: totals.reach },
    { key: "impressions" as const, label: "Impressions", icon: <TrendingUp size={15}/>, color: "text-emerald-400", hex: "#34d399", val: totals.impressions },
  ];
  if (loading) return <div className="flex items-center justify-center min-h-[400px] text-white/30 text-sm">Loading analytics…</div>;
  if (analytics.length === 0) return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Analytics</h1>
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-12 flex flex-col items-center text-center">
        <BarChart3 size={40} className="text-white/10 mb-3"/>
        <p className="text-white/40 text-sm font-medium">No analytics data yet</p>
        <p className="text-white/20 text-xs mt-1">Data will appear here once posts start collecting analytics.</p>
      </div>
    </div>
  );
  const activeM = METRICS.find(m => m.key === activeMetric);
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Analytics</h1><p className="text-sm text-white/40 mt-1">{analytics.length} data points across {platformSummaries.length} platforms</p></div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
          {METRICS.map(m => (
            <button key={m.key} onClick={() => setActiveMetric(m.key)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${activeMetric === m.key ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}>
              <span className={activeMetric === m.key ? m.color : ""}>{m.icon}</span>{m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {METRICS.map(m => (
          <div key={m.key} onClick={() => setActiveMetric(m.key)} className={`rounded-xl p-4 border transition-all cursor-pointer ${activeMetric === m.key ? "bg-white/[0.06] border-white/20" : "bg-white/[0.02] border-white/10 hover:bg-white/[0.04]"}`}>
            <div className={`${m.color} mb-2`}>{m.icon}</div>
            <div className="text-2xl font-bold text-white tabular-nums">{m.val >= 1000 ? `${(m.val/1000).toFixed(1)}k` : m.val.toLocaleString()}</div>
            <div className="text-xs text-white/40 mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>
      {timelineData.length > 1 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-5"><Activity size={15} className="text-white/40"/><h2 className="text-sm font-semibold text-white/80">{activeM?.label} Over Time</h2></div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} width={35}/>
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "rgba(255,255,255,0.1)" }}/>
              <Line type="monotone" dataKey={activeMetric} stroke={activeM?.hex ?? "#6366f1"} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: activeM?.hex }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-5"><BarChart3 size={15} className="text-white/40"/><h2 className="text-sm font-semibold text-white/80">{activeM?.label} by Platform</h2></div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={platformSummaries} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="platform" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} width={35}/>
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.03)" }}/>
              <Bar dataKey={activeMetric} radius={[4,4,0,0]} fill={activeM?.hex ?? "#6366f1"}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-4"><TrendingUp size={15} className="text-white/40"/><h2 className="text-sm font-semibold text-white/80">Platform Summary</h2></div>
          <table className="w-full">
            <thead><tr className="border-b border-white/10">{["Platform","Likes","Comments","Reach"].map(h => <th key={h} className="text-left text-xs font-medium text-white/30 pb-2 pr-2 uppercase tracking-wide">{h}</th>)}</tr></thead>
            <tbody>{platformSummaries.map((s: any) => (
              <tr key={s.platform} className="border-b border-white/5 last:border-0">
                <td className="py-2.5 pr-2"><div className="flex items-center gap-1.5"><Globe size={12} style={{ color: PLATFORM_COLORS[s.platform] ?? "#6366f1" }}/><span className="text-xs text-white/70 capitalize">{s.platform}</span></div></td>
                <td className="py-2.5 pr-2 text-xs text-white/50 tabular-nums">{s.likes.toLocaleString()}</td>
                <td className="py-2.5 pr-2 text-xs text-white/50 tabular-nums">{s.comments.toLocaleString()}</td>
                <td className="py-2.5 text-xs text-white/50 tabular-nums">{s.reach.toLocaleString()}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
