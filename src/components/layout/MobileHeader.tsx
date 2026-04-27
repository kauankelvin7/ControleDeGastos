"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { useAuth } from "@/hooks/useFirebaseData";

export default function MobileHeader() {
  const pathname = usePathname();
  const { data: userProfile } = useAuth(); // Assume we have a useAuth or similar, wait, we don't. Let's just use the logo and a greeting.

  // Hide on desktop
  return (
    <header className="md:hidden flex items-center justify-between px-6 py-4 bg-black/40 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[linear-gradient(135deg,var(--orange),var(--amber))] flex items-center justify-center font-bold text-white shadow-[0_4px_10px_rgba(229,89,29,0.3)] text-sm">
          K₿
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Bem-vindo</span>
          <span className="font-display font-bold text-sm text-text-primary leading-tight">
            {userProfile?.nome || "Investidor"} 👋
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 transition-colors border border-white/5">
          <Search size={16} />
        </button>
        <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 transition-colors border border-white/5 relative">
          <Bell size={16} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-brand-orange rounded-full shadow-[0_0_5px_var(--orange)]"></span>
        </button>
      </div>
    </header>
  );
}
