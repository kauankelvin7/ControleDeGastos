"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, Plus, CreditCard, Sparkles } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Início" },
    { href: "/investimentos", icon: Wallet, label: "Aportes" },
    { href: "/lancamento", icon: Plus, label: "Novo", isFab: true },
    { href: "/gastos", icon: CreditCard, label: "Gastos" },
    { href: "/relatorio", icon: Sparkles, label: "IA" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/60 backdrop-blur-3xl border-t border-white/[0.03] pb-safe pt-4 px-8 flex items-center justify-between z-50">
      
      {/* Dynamic line decoration on top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />

      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href) && !item.isFab);
        const Icon = item.icon;

        if (item.isFab) {
          return (
            <Link
              key="fab"
              href={item.href}
              className="relative -mt-12 group"
            >
              <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full scale-125 opacity-0 group-active:opacity-100 transition-opacity" />
              <div className="relative w-15 h-15 rounded-full bg-white text-black flex items-center justify-center shadow-2xl border-4 border-[#0a0a0a] active:scale-90 transition-all duration-300">
                <Icon size={30} strokeWidth={2.5} />
              </div>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1.5 transition-all duration-500 relative py-1 ${
              isActive ? "text-orange-500" : "text-white/20 hover:text-white/40"
            }`}
          >
            {/* Active Glow Dot */}
            {isActive && (
              <div className="absolute -top-1 w-1 h-1 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,1)]" />
            )}
            
            <Icon 
              size={22} 
              strokeWidth={isActive ? 2.5 : 2} 
              className={`transition-transform duration-500 ${isActive ? "scale-110" : ""}`}
            />
            <span className={`text-[9px] font-bold uppercase tracking-[0.2em] transition-all duration-500 ${
              isActive ? "opacity-100 translate-y-0" : "opacity-40"
            }`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}