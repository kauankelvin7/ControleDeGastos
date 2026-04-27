"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, Plus, ArrowRightLeft, Sparkles } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Início" },
    { href: "/investimentos", icon: Wallet, label: "Aportes" },
    { href: "/lancamento", icon: Plus, label: "Novo", isFab: true },
    { href: "/gastos", icon: ArrowRightLeft, label: "Gastos" },
    { href: "/relatorio", icon: Sparkles, label: "IA" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-2xl border-t border-white/5 pb-safe pt-3 px-6 flex items-center justify-between z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.4)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href) && !item.isFab);
        const Icon = item.icon;

        if (item.isFab) {
          return (
            <Link
              key="fab"
              href={item.href}
              className="w-14 h-14 rounded-full bg-[linear-gradient(135deg,var(--orange),var(--amber))] text-white flex items-center justify-center shadow-[0_8px_24px_rgba(229,89,29,0.4),inset_0_2px_4px_rgba(255,255,255,0.4)] -mt-10 hover:scale-110 active:scale-95 transition-all duration-300 border border-white/10"
            >
              <Icon size={28} strokeWidth={2.5} />
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative ${
              isActive ? "text-brand-orange" : "text-text-disabled hover:text-text-muted"
            }`}
          >
            {/* Indicador de Item Ativo (Glow Dot) */}
            {isActive && (
              <span className="absolute -top-1 w-1 h-1 bg-brand-orange rounded-full shadow-[0_0_8px_var(--orange)] animate-pulse" />
            )}
            
            <Icon 
              size={20} 
              strokeWidth={isActive ? 2.5 : 2} 
              className={isActive ? "drop-shadow-[0_0_8px_rgba(229,89,29,0.4)]" : ""}
            />
            <span className={`text-[10px] font-display font-bold uppercase tracking-widest ${
              isActive ? "opacity-100" : "opacity-60"
            }`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}