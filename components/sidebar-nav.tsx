"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileText, PlusSquare, Calendar, BarChart3, Settings, Link2, Zap, Search } from "lucide-react";
import LogoutButton from "./LogoutButton";
import ActivityFeed from "./ActivityFeed";
import GlobalSearch from "./GlobalSearch";
const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/clients", icon: Users, label: "Clients" },
  { href: "/posts", icon: FileText, label: "Posts" },
  { href: "/create-post", icon: PlusSquare, label: "Create Post" },
  { href: "/calendar", icon: Calendar, label: "Calendar" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/social-accounts", icon: Link2, label: "Social Accounts" },
  { href: "/settings", icon: Settings, label: "Settings" },
];
export default function SidebarNav() {
  const pathname = usePathname();
  return (
    <>
      <GlobalSearch/>
      <aside className="w-60 flex-shrink-0 flex flex-col h-screen sticky top-0 border-r border-[#e0e0e0] bg-white">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#e0e0e0]">
          <div className="w-7 h-7 rounded-lg bg-[#f5c800] flex items-center justify-center flex-shrink-0"><Zap size={14} className="text-[#1a1a1a]"/></div>
          <span className="text-sm font-bold text-[#1a1a1a] tracking-tight">Social Universe</span>
        </div>
        <div className="px-3 pt-3 pb-1">
          <button onClick={() => { const e = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }); window.dispatchEvent(e); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#bbb] bg-[#f5f5f5] border border-[#e0e0e0] hover:border-[#ccc] hover:text-[#1a1a1a]/50 transition-all">
            <Search size={13}/><span className="flex-1 text-left text-xs">Search…</span><kbd className="text-[10px] border borr-white/10 rounded px-1">⌘K</kbd>
          </button>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href+"/");
            return (
              <Link key={href} href={href} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group ${active ? "bg-[#f5c800] text-[#1a1a1a] font-semibold" : "text-[#666] hover:text-[#1a1a1a] hover:bg-[#f5f5f5]"}`}>
                <Icon size={16} className={`flex-shrink-0 ${active ? "text-[#1a1a1a]" : "text-[#999] group-hover:text-[#444]"}`}/>
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 pb-2 border-t border-[#e0e0e0] pt-3"><ActivityFeed/></div>
        <div className="px-3 py-3"><LogoutButton/></div>
      </aside>
    </>
  );
}
