import type { JSX } from "react";

export function SocialLogo({ compact = false }: { compact?: boolean }): JSX.Element {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#f5c800]/20 text-[#b8930a]">
        <span className="h-3 w-3 rounded-full bg-violet-300" />
        <span className="absolute h-8 w-8 rounded-full border border-violet-300/60" />
        <span className="absolute h-11 w-11 rounded-full border border-violet-300/25" />
      </div>
      {!compact && (
        <div>
          <p className="text-xl font-semibold tracking-tight text-[#1a1a1a]">Social Universe</p>
          <p className="text-xs text-violet-200/70">Agency Control Center</p>
        </div>
      )}
    </div>
  );
}
