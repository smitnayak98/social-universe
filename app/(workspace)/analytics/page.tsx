"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Activity, Eye, TrendingUp, Users } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SnapshotRow = {
  snapshot_date: string;
  social_account_id: string;
  followers: number | null;
  following: number | null;
  posts_count: number | null;
  reach: number | null;
  impressions: number | null;
  profile_views: number | null;
  website_clicks: number | null;
  social_accounts?: {
    platform?: string | null;
    account_name?: string | null;
    account_name?: string | null;
  } | null;
};

type DailyPoint = {
  date: string;
  followers: number;
  reach: number;
  impressions: number;
  profile_views: number;
};

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const TOOLTIP_STYLE = {
  background: "#100c31",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10,
  color: "white",
  fontSize: 12,
};

function formatKpi(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function formatDelta(current: number, previous: number): string {
  const delta = current - previous;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${formatKpi(delta)} (7d)`;
}

function sumMetric(points: DailyPoint[], key: keyof Omit<DailyPoint, "date">): number {
  return points.reduce((acc, row) => acc + row[key], 0);
}

export default function AnalyticsPage() {
  const [rows, setRows] = useState<SnapshotRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("analytics_snapshots")
        .select(
          "snapshot_date, social_account_id, followers, following, posts_count, reach, impressions, profile_views, website_clicks, social_accounts(platform, account_name, account_name)",
        )
        .order("snapshot_date", { ascending: true });

      if (error) {
        setRows([]);
      } else {
        setRows((data as SnapshotRow[]) ?? []);
      }
      setLoading(false);
    };

    load();
  }, []);

  const dailySeries = useMemo<DailyPoint[]>(() => {
    const grouped = new Map<string, DailyPoint>();

    for (const row of rows) {
      const key = row.snapshot_date;
      const current = grouped.get(key) ?? {
        date: key,
        followers: 0,
        reach: 0,
        impressions: 0,
        profile_views: 0,
      };

      current.followers += row.followers ?? 0;
      current.reach += row.reach ?? 0;
      current.impressions += row.impressions ?? 0;
      current.profile_views += row.profile_views ?? 0;
      grouped.set(key, current);
    }

    return Array.from(grouped.values());
  }, [rows]);

  const last14Days = useMemo(() => dailySeries.slice(-14), [dailySeries]);
  const latest = last14Days[last14Days.length - 1] ?? {
    date: "",
    followers: 0,
    reach: 0,
    impressions: 0,
    profile_views: 0,
  };

  const currentWindow = last14Days.slice(-7);
  const previousWindow = last14Days.slice(-14, -7);

  const kpis = [
    {
      key: "followers",
      label: "Followers",
      value: latest.followers,
      delta: formatDelta(
        sumMetric(currentWindow, "followers"),
        sumMetric(previousWindow, "followers"),
      ),
      icon: <Users size={15} />,
      tone: "text-[#b8930a]",
    },
    {
      key: "reach",
      label: "Reach",
      value: latest.reach,
      delta: formatDelta(sumMetric(currentWindow, "reach"), sumMetric(previousWindow, "reach")),
      icon: <Activity size={15} />,
      tone: "text-[#b8930a]",
    },
    {
      key: "impressions",
      label: "Impressions",
      value: latest.impressions,
      delta: formatDelta(
        sumMetric(currentWindow, "impressions"),
        sumMetric(previousWindow, "impressions"),
      ),
      icon: <TrendingUp size={15} />,
      tone: "text-cyan-300",
    },
    {
      key: "profile_views",
      label: "Profile Views",
      value: latest.profile_views,
      delta: formatDelta(
        sumMetric(currentWindow, "profile_views"),
        sumMetric(previousWindow, "profile_views"),
      ),
      icon: <Eye size={15} />,
      tone: "text-emerald-300",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center text-sm text-violet-100/60">
        Loading analytics snapshots...
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="mx-auto max-w-7xl space-y-5 p-6">
        <h1 className="text-3xl font-semibold tracking-tight text-[#1a1a1a]">Analytics</h1>
        <div className="rounded-2xl border border-[#e0e0e0] bg-white p-12 text-center">
          <p className="text-sm text-violet-100/70">
            No data in analytics snapshots yet. Connect social accounts and sync snapshots.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1a1a1a]">Analytics</h1>
          <p className="mt-1 text-sm text-violet-100/70">
            Snapshot trends from connected social accounts.
          </p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((card) => (
          <article
            key={card.key}
            className="rounded-2xl border border-[#e0e0e0] bg-white p-5 shadow-lg shadow-black/15"
          >
            <div className={`mb-3 inline-flex rounded-lg bg-[#f5f5f5] p-2 ${card.tone}`}>
              {card.icon}
            </div>
            <p className="text-xs uppercase tracking-wide text-[#666]">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold text-[#1a1a1a] tabular-nums">
              {formatKpi(card.value)}
            </p>
            <p className="mt-2 text-xs text-violet-200/70">{card.delta}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-[#e0e0e0] bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-[#1a1a1a]/90">Followers Trend</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={dailySeries}>
            <defs>
              <linearGradient id="followersFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7F77DD" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#7F77DD" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Area
              type="monotone"
              dataKey="followers"
              stroke="#A78BFA"
              fill="url(#followersFill)"
              strokeWidth={2.2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      <section className="rounded-2xl border border-[#e0e0e0] bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-[#1a1a1a]/90">Reach vs Impressions</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={dailySeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line
              type="monotone"
              dataKey="reach"
              name="Reach"
              stroke="#7F77DD"
              strokeWidth={2.2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="impressions"
              name="Impressions"
              stroke="#22D3EE"
              strokeWidth={2.2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
