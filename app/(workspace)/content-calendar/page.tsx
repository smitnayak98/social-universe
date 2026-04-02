"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { ChevronLeft, ChevronRight, Plus, Globe, Loader2 } from "lucide-react";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const platformDotColors: Record<string, string> = {
  instagram: "bg-pink-500", twitter: "bg-sky-500", facebook: "bg-blue-500",
  linkedin: "bg-indigo-500", youtube: "bg-red-500",
};
const statusBadge: Record<string, string> = {
  draft: "border-zinc-600/40 bg-zinc-700/30 text-zinc-400",
  scheduled: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  published: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  failed: "border-red-500/30 bg-red-500/10 text-red-400",
};
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const startOfMonth = new Date(year, month, 1).toISOString();
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    const { data } = await supabase.from("posts")
      .select("id, caption, platform, status, scheduled_at, clients(name)")
      .eq("user_id", user.id)
      .not("scheduled_at", "is", null)
      .gte("scheduled_at", startOfMonth)
      .lte("scheduled_at", endOfMonth);
    setPosts(data ?? []);
    setLoading(false);
  }, [year, month]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  function getPostsForDay(day: number) {
    return posts.filter((p) => {
      if (!p.scheduled_at) return false;
      const d = new Date(p.scheduled_at);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });
  }

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const isToday = (day: number) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const selectedDayPosts = selectedDay ? getPostsForDay(selectedDay) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Content Calendar</h1>
          <p className="text-sm text-zinc-400 mt-1">Scheduled posts for {MONTHS[month]} {year}</p>
        </div>
        <a href="/create-post" className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
          <Plus className="w-4 h-4" />New Post
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <button onClick={() => { setCurrentDate(new Date(year, month - 1, 1)); setSelectedDay(null); }} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-semibold text-white">{MONTHS[month]} {year}</h2>
            <button onClick={() => { setCurrentDate(new Date(year, month + 1, 1)); setSelectedDay(null); }} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 border-b border-zinc-800">
            {DAYS.map((d) => <div key={d} className="py-2 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">{d}</div>)}
          </div>
          {loading ? (
            <div className="h-64 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-violet-400" /></div>
          ) : (
            <div className="grid grid-cols-7">
              {calendarCells.map((day, idx) => {
                const dayPosts = day ? getPostsForDay(day) : [];
                const isSelected = day === selectedDay;
                const isTodayCell = day ? isToday(day) : false;
                return (
                  <div key={idx} onClick={() => day && setSelectedDay(isSelected ? null : day)}
                    className={`min-h-[80px] p-2 border-b border-r border-zinc-800 ${idx % 7 === 6 ? "border-r-0" : ""} ${day ? "cursor-pointer hover:bg-zinc-800/40 transition-colors" : "bg-zinc-900/20"} ${isSelected ? "bg-violet-500/10" : ""}`}>
                    {day && (
                      <>
                        <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium mb-1.5 ${isTodayCell ? "bg-violet-600 text-white" : isSelected ? "bg-violet-500/20 text-violet-300" : "text-zinc-400"}`}>{day}</div>
                        <div className="flex flex-wrap gap-1">
                          {dayPosts.slice(0, 3).map((p) => <div key={p.id} className={`w-2 h-2 rounded-full ${platformDotColors[p.platform] ?? "bg-zinc-500"}`} />)}
                          {dayPosts.length > 3 && <span className="text-[10px] text-zinc-500">+{dayPosts.length - 3}</span>}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-white">{selectedDay ? `${MONTHS[month]} ${selectedDay}, ${year}` : "Select a day"}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{selectedDay ? `${selectedDayPosts.length} posts scheduled` : "Click a date to see posts"}</p>
          </div>
          <div className="p-4">
            {!selectedDay ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mx-auto mb-3"><Globe className="w-5 h-5 text-zinc-600" /></div>
                <p className="text-xs text-zinc-500">Click any date to preview scheduled posts</p>
              </div>
            ) : selectedDayPosts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-zinc-500 mb-3">No posts scheduled for this day</p>
                <a href="/create-post" className="text-xs text-violet-400 hover:text-violet-300">+ Schedule a post</a>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayPosts.map((post) => {
                  const dot = platformDotColors[post.platform] ?? "bg-zinc-500";
                  const badge = statusBadge[post.status] ?? statusBadge.draft;
                  const time = post.scheduled_at ? new Date(post.scheduled_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";
                  return (
                    <div key={post.id} className="p-3 rounded-xl border border-zinc-800 bg-zinc-800/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${dot}`} />
                          <span className="text-xs font-medium text-zinc-300 capitalize">{post.platform}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-600">{time}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border capitalize ${badge}`}>{post.status}</span>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-3">{post.caption}</p>
                      {post.clients?.name && <p className="text-[10px] text-zinc-600">{post.clients.name}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
        <span className="font-medium text-zinc-400">Platforms:</span>
        {Object.entries(platformDotColors).map(([p, color]) => (
          <span key={p} className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${color}`} />{p.charAt(0).toUpperCase() + p.slice(1)}</span>
        ))}
      </div>
    </div>
  );
}