"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, FileText, PlusSquare,
  Calendar, BarChart3, Settings, Link2, Menu, X
} from "lucide-react";
import { useState } from "react";
import LogoutButton from "./LogoutButton";
import ActivityFeed from "./ActivityFeed";
import GlobalSearch from "./GlobalSearch";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/posts", icon: FileText, label: "Posts" },
  { href: "/create-post", icon: PlusSquare, label: "Create" },
  { href: "/calendar", icon: Calendar, label: "Calendar" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
];

const MORE_ITEMS = [
  { href: "/clients", icon: Users, label: "Clients" },
  { href: "/social-accounts", icon: Link2, label: "Accounts" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <GlobalSearch />

      {/* Slide-up menu */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div
            className="fixed bottom-16 left-0 right-0 z-50 rounded-t-2xl border-t border-white/10 p-4 space-y-1"
            style={{ background: "#0f0f1a" }}
          >
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">More</span>
              <button onClick={() => setMenuOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10">
                <X size={14} />
              </button>
            </div>
            {MORE_ITEMS.map(({ href, icon: Icon, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    active ? "bg-indigo-600/20 text-indigo-300" : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={18} className={active ? "text-indigo-400" : "text-white/40"} />
                  {label}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-white/10">
              <ActivityFeed />
            </div>
            <div className="pt-1">
              <LogoutButton />
            </div>
          </div>
        </>
      )}

      {/* Bottom tab bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 flex items-center justify-around px-2 py-2"
        style={{ background: "#0f0f1a" }}
      >
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                active ? "text-indigo-400" : "text-white/30 hover:text-white/60"
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
        {/* More button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
            menuOpen ? "text-indigo-400" : "text-white/30 hover:text-white/60"
          }`}
        >
          <Menu size={20} />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
    </>
  );
}