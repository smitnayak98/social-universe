"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { FileText, CheckCircle2, Clock, Edit3, Instagram, Facebook, Users, Share2 } from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const COLORS = ["#f5c800", "#1877f2", "#e1306c", "#0a66c2", "#ff0000", "#6366f1"];
const STATUS_COLORS: Record<string, string> = {
  published: "#22c55e", scheduled: "#3b82f6", draft: "#d1d5db", failed: "#ef4444",
};

export default function AnalyticsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: p }, { data: c }, { data: a }] = await Promise.all([
        supabase.from("posts").select("*, clients(name)"),
        supabase.from("clients").select("id, name"),
        supabase.from("social_accounts").select("*").eq("is_connected", true),
      ]);
      setPosts(p ?? []); setClients(c ?? []); setAccounts(a ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const byStatus = [
    { name: "Published", value: posts.filter(p => p.status === "published").length, color: STATUS_COLORS.published },
    { name: "Scheduled", value: posts.filter(p => p.status === "scheduled").length, color: STATUS_COLORS.scheduled },
    { name: "Draft", value: posts.filter(p => p.status === "draft").length, color: STATUS_COLORS.draft },
    { name: "Failed", value: posts.filter(p => p.status === "failed").length, color: STATUS_COLORS.failed },
  ].filter(d => d.value > 0);

  const platformCounts: Record<string, number> = {};
  posts.forEach(p => { const pl: string[] = p.platforms ?? []; pl.forEach(x => { platformCounts[x] = (platformCounts[x] || 0) + 1; }); });
  const byPlatform = Object.entries(platformCounts).map(([name, value], i) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value, color: COLORS[i % COLORS.length] }));

  const clientCounts: Record<string, number> = {};
  posts.forEach(p => { const name = p.clients?.name ?? "Unknown"; clientCounts[name] = (clientCounts[name] || 0) + 1; });
  const byClient = Object.entries(clientCounts).map(([name, posts]) => ({ name, posts })).sort((a, b) => b.posts - a.posts);

  const monthCounts: Record<string, number> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthCounts[d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })] = 0;
  }
  posts.forEach(p => {
    const key = new Date(p.created_at).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    if (key in monthCounts) monthCounts[key]++;
  });
  const byMonth = Object.entries(monthCounts).map(([month, posts]) => ({ month, posts }));

  const STAT_CARDS = [
    { label: "Total Posts", value: posts.length, icon: <FileText size={16} />, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Published", value: posts.filter(p => p.status === "published").length, icon: <CheckCircle2 size={16} />, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Scheduled", value: posts.filter(p => p.status === "scheduled").length, icon: <Clock size={16} />, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Drafts", value: posts.filter(p => p.status === "draft").length, icon: <Edit3 size={16} />, color: "text-gray-400", bg: "bg-gray-100" },
    { label: "Total Clients", value: clients.length, icon: <Users size={16} />, color: "text-[#b8930a]", bg: "bg-[#f5c800]/10" },
    { label: "Connected Accounts", value: accounts.length, icon: <Share2 size={16} />, color: "text-pink-500", bg: "bg-pink-500/10" },
  ];

  if (loading) return <div className="flex min-h-[420px] items-center justify-center text-sm text-[#999]">Loading analytics...</div>;

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <header>
        <h1 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">Analytics</h1>
        <p className="text-sm text-[#999] mt-1">Overview of your content and social accounts</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAT_CARDS.map(card => (
          <div key={card.label} className="rounded-xl p-4 border border-[#e0e0e0] bg-white">
            <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center mb-3 ${card.color}`}>{card.icon}</div>
            <div className="text-2xl font-bold text-[#1a1a1a] tabular-nums">{card.value}</div>
            <div className="text-xs text-[#999] mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-[#e0e0e0] bg-white p-5">
          <h2 className="text-sm font-semibold text-[#1a1a1a]/80 mb-4">Posts Per Month</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byMonth} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,26,26,0.06)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "rgba(26,26,26,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: "rgba(26,26,26,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} width={20} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 8, fontSize: 12 }} cursor={{ fill: "rgba(26,26,26,0.03)" }} />
              <Bar dataKey="posts" fill="#f5c800" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-[#e0e0e0] bg-white p-5">
          <h2 className="text-sm font-semibold text-[#1a1a1a]/80 mb-4">Posts by Status</h2>
          {byStatus.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={byStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {byStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {byStatus.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: s.color }} /><span className="text-[#555]">{s.name}</span></div>
                    <span className="font-semibold text-[#1a1a1a]">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="flex items-center justify-center h-[160px] text-sm text-[#999]">No posts yet</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[#e0e0e0] bg-white p-5">
          <h2 className="text-sm font-semibold text-[#1a1a1a]/80 mb-4">Posts by Client</h2>
          {byClient.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byClient} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,26,26,0.06)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: "rgba(26,26,26,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "rgba(26,26,26,0.6)", fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="posts" fill="#f5c800" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-[200px] text-sm text-[#999]">No data</div>}
        </div>

        <div className="rounded-xl border border-[#e0e0e0] bg-white p-5">
          <h2 className="text-sm font-semibold text-[#1a1a1a]/80 mb-4">Posts by Platform</h2>
          {byPlatform.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={byPlatform} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {byPlatform.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {byPlatform.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: p.color }} /><span className="text-[#555]">{p.name}</span></div>
                    <span className="font-semibold text-[#1a1a1a]">{p.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="flex items-center justify-center h-[160px] text-sm text-[#999]">No platform data yet</div>}
        </div>
      </div>

      <div className="rounded-xl border border-[#e0e0e0] bg-white p-5">
        <h2 className="text-sm font-semibold text-[#1a1a1a]/80 mb-4">Connected Social Accounts</h2>
        {accounts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {accounts.map((acc, i) => (
              <div key={i} className="rounded-xl border border-[#e0e0e0] p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${acc.platform === "instagram" ? "bg-pink-500/10" : "bg-blue-500/10"}`}>
                  {acc.platform === "instagram" ? <Instagram size={16} className="text-pink-500" /> : <Facebook size={16} className="text-blue-500" />}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#1a1a1a] truncate">@{acc.account_name}</div>
                  <div className="text-xs text-[#999] capitalize">{acc.platform}</div>
                </div>
              </div>
            ))}
          </div>
        ) : <div className="text-sm text-[#999] text-center py-6">No connected accounts yet</div>}
      </div>
    </div>
  );
}