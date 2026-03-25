import type { ReactNode } from "react";
import { SidebarNav } from "@/components/sidebar-nav";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#08051f] text-white">
      <div className="mx-auto flex max-w-[1600px]">
        <SidebarNav />
        <main className="w-full p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
