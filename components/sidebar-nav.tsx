"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { JSX } from "react";
import {
  AnalyticsIcon,
  CalendarIcon,
  ClientsIcon,
  CreatePostIcon,
  DashboardIcon,
  QueueIcon,
  SettingsIcon,
} from "@/components/icons";
import { SocialLogo } from "@/components/social-logo";

type NavItem = {
  href: string;
  label: string;
  icon: () => JSX.Element;
};

const items: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/create-post", label: "Create Post", icon: CreatePostIcon },
  { href: "/content-calendar", label: "Content Calendar", icon: CalendarIcon },
  { href: "/post-queue", label: "Post Queue", icon: QueueIcon },
  { href: "/clients", label: "Clients", icon: ClientsIcon },
  { href: "/analytics", label: "Analytics", icon: AnalyticsIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export function SidebarNav(): JSX.Element {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-76 shrink-0 border-r border-white/10 bg-[#0f0a2e] p-6 lg:block">
      <SocialLogo />
      <nav className="mt-10 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              href={item.href}
              key={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-violet-500/25 text-white"
                  : "text-violet-100/80 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
