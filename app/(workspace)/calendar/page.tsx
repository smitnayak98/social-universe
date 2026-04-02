"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { ChevronLeft, ChevronRight, Plus, Clock, CheckCircle2, FileText, AlertCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const PLATFORM_COLORS: Record<string,string> = { instagram:"#e1306c", twitter:"#1da1f2", facebook:"#1877f2", linkedin:"#0a66c2", youtube:"#ff0000" };
const STATUS_ICON: Record<string,any> = { draft:<FileText size={11}/>, scheduled:<Clock size={11}/>, published:<CheckCircle2 size={11}/>, failed:<AlertCircle size={11}/> };
const STATUS_COLOR: Record<string,string> = { draft:"text-[#1a1a1a]/40 bg-[#f5f5f5]", scheduled:"text-blue-400 bg-blue-500/10", published:"text-emerald-400 bg-emerald-500/10", failed:"text-red-400 bg-red-500/10" };
export default function CalendarPage() {
  const router = useRouter();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<number|null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const year = currentDate.getFullYear(); const month = currentDate.getMonth();
    const start = new Date(year, month, 1).toISOString(); const end = new Date(year, month+1, 0, 23, 59, 59).toISOString();
    setLoading(true);
    supabase.from("posts").select("*, clients(name)").gte("scheduled_at", start).lte("scheduled_at", end).order("scheduled_at").then(({ data }) => { setPosts(data ?? []); setLoading(false); });
  }, [currentDate]);
  const year = currentDate.getFullYear(); const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const prevMonth = () => setCurrentDate(new Date(year, month-1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month+1, 1));
  const getPostsForDay = (day: number) => posts.filter(p => { if (!p.scheduled_at) return false; const d = new Date(p.scheduled_at); return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year; });
  const selectedPosts = selectedDay ? getPostsForDay(selectedDay) : [];
  const isToday = (day: number) => today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-[#1a1a1a]">Calendar</h1><p className="text-sm text-[#1a1a1a]/40 mt-1">Scheduled posts for {currentDate.toLocaleDateString("en-IN",{month:"long",year:"numeric"})}</p></div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#f5f5f5] border border-[#e0e0e0] rounded-lg p-1">
            <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#eeeeee] text-[#1a1a1a]/50 hover:text-[#1a1a1a] transition-all"><ChevronLeft size={15}/></button>
            <span className="text-sm font-medium text-[#1a1a1a]/70 px-2 min-w-[130px] text-center">{currentDate.toLocaleDateString("en-IN",{month:"long",year:"numeric"})}</span>
            <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#eeeeee] text-[#1a1a1a]/50 hover:text-[#1a1a1a] transition-all"><ChevronRight size={15}/></button>
          </div>
          <button onClick={() => router.push("/create-post")} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#f5c800] hover:bg-[#f5c800] text-[#1a1a1a] transition-all"><Plus size={15}/>New Post</button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-[#e0e0e0] bg-[#fafafa] overflow-hidden">
            <div className="grid grid-cols-7 border-b border-[#e0e0e0]">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                <div key={d} className="py-2.5 text-center text-xs font-semibold text-[#1a1a1a]/30 uppercase tracking-wider">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="border-b border-r border-[#eee] min-h-[80px]"/>)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i+1;
                const dayPosts = getPostsForDay(day);
                const isSelected = selectedDay === day;
                const isTodayDay = isToday(day);
                return (
                  <div key={day} onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`border-b border-r border-[#eee] min-h-[80px] p-1.5 cursor-pointer transition-all ${isSelected ? "bg-[#f5c800]/10" : "hover:bg-[#fafafa]"}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mb-1 ${isTodayDay ? "bg-[#f5c800] text-[#1a1a1a]" : isSelected ? "text-[#b8930a]" : "text-[#1a1a1a]/50"}`}>{day}</div>
                    <div className="space-y-0.5">
                      {dayPosts.slice(0,3).map(post => (
                        <div key={post.id} className="flex items-center gap-1 px-1 py-0.5 rounded text-[10px] truncate"
                          style={{ background: `${PLATFORM_COLORS[post.platform] ?? "#6366f1"}20`, color: PLATFORM_COLORS[post.platform] ?? "#6366f1" }}>
                          <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: PLATFORM_COLORS[post.platform] ?? "#6366f1" }}/>
                          <span className="truncate">{post.caption?.substring(0,20)}</span>
                        </div>
                      ))}
                      {dayPosts.length > 3 && <div className="text-[10px] text-[#1a1a1a]/30 px-1">+{dayPosts.length-3} more</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {selectedDay ? (
            <div className="rounded-xl border border-[#e0e0e0] bg-[#fafafa] p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#1a1a1a]">{currentDate.toLocaleDateString("en-IN",{month:"long"})} {selectedDay}</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => router.push(`/create-post?date=${year}-${String(month+1).padStart(2,"0")}-${String(selectedDay).padStart(2,"0")}`)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#f5c800] hover:bg-[#f5c800] text-[#1a1a1a]"><Plus size={11}/>Post</button>
                  <button onClick={() => setSelectedDay(null)} className="w-6 h-6 flex items-center justify-center rounded-md text-[#1a1a1a]/30 hover:text-[#1a1a1a] hover:bg-[#eeeeee]"><X size={12}/></button>
                </div>
              </div>
              {selectedPosts.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-[#1a1a1a]/30">No posts scheduled</p>
                  <button onClick={() => router.push(`/create-post?date=${year}-${String(month+1).padStart(2,"0")}-${String(selectedDay).padStart(2,"0")}`)} className="mt-2 text-xs text-[#b8930a] hover:text-[#b8930a]">Schedule a post →</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedPosts.map(post => (
                    <div key={post.id} className="rounded-lg border border-[#e0e0e0] bg-[#fafafa] p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PLATFORM_COLORS[post.platform] ?? "#6366f1" }}/>
                        <span className="text-xs font-medium capitalize" style={{ color: PLATFORM_COLORS[post.platform] ?? "#6366f1" }}>{post.platform}</span>
                        <span className={`ml-auto flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_COLOR[post.status] ?? STATUS_COLOR.draft}`}>{STATUS_ICON[post.status]}{post.status}</span>
                      </div>
                      <p className="text-xs text-[#1a1a1a]/60 line-clamp-2 leading-relaxed">{post.caption}</p>
                      {post.clients?.name && <p className="text-[10px] text-[#1a1a1a]/25 mt-1.5">{post.clients.name}</p>}
                      {post.scheduled_at && <p className="text-[10px] text-[#1a1a1a]/25 mt-0.5">{new Date(post.scheduled_at).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-[#e0e0e0] bg-[#fafafa] p-4 text-center">
              <p className="text-sm text-[#1a1a1a]/30">Click a date to see posts</p>
              <p className="text-xs text-[#1a1a1a]/20 mt-1">Or click + Post to schedule one</p>
            </div>
          )}
          <div className="rounded-xl border border-[#e0e0e0] bg-[#fafafa] p-4">
            <h3 className="text-xs font-semibold text-[#1a1a1a]/40 uppercase tracking-wider mb-3">This Month</h3>
            <div className="space-y-2">
              {[{label:"Total scheduled",val:posts.length,color:"text-[#1a1a1a]/70"},{label:"Published",val:posts.filter(p=>p.status==="published").length,color:"text-emerald-400"},{label:"Pending",val:posts.filter(p=>p.status==="scheduled").length,color:"text-blue-400"},{label:"Drafts",val:posts.filter(p=>p.status==="draft").length,color:"text-[#1a1a1a]/40"}].map(s=>(
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-xs text-[#1a1a1a]/40">{s.label}</span>
                  <span className={`text-sm font-semibold tabular-nums ${s.color}`}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
