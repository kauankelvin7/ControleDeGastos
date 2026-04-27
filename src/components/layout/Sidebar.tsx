"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, ArrowRightLeft, Target, ShieldAlert, Sparkles, LogOut } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

const MENU_ITEMS = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/investimentos", label: "Investimentos", icon: Wallet },
  { href: "/gastos", label: "Gastos", icon: ArrowRightLeft },
  { href: "/metas", label: "Metas", icon: Target },
  { href: "/reserva", label: "Reserva", icon: ShieldAlert },
  { href: "/relatorio", label: "Relatório AI", icon: Sparkles },
];

export default function Sidebar({ userProfile }: { userProfile?: any }) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  return (
    <aside className="hidden md:flex w-64 h-screen bg-black/40 backdrop-blur-2xl border-r border-white/5 flex-col fixed left-0 top-0 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.3)]">
      
      {/* Logo Branding */}
      <div className="p-8 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[linear-gradient(135deg,var(--orange),var(--amber))] flex items-center justify-center font-bold text-white shadow-[0_8px_20px_rgba(229,89,29,0.3),inset_0_2px_4px_rgba(255,255,255,0.3)] transition-transform hover:rotate-3">
          K₿
        </div>
        <span className="font-display font-bold text-xl tracking-tight text-white drop-shadow-sm">KiNance</span>
      </div>

      {/* Primary Action Button */}
      <div className="px-5 mb-8">
        <Link 
          href="/lancamento" 
          className="w-full flex items-center justify-center gap-2 bg-[linear-gradient(135deg,var(--orange),var(--amber))] shadow-[0_4px_16px_rgba(229,89,29,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] text-white py-3.5 rounded-2xl font-bold text-sm hover:shadow-[0_6px_24px_rgba(229,89,29,0.4),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-0.5 transition-all duration-300"
        >
          + Novo Lançamento
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="text-[10px] font-display font-bold text-text-disabled uppercase tracking-[0.2em] mb-4 px-3 opacity-60">
          Navegação
        </div>
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-4 py-3 rounded-xl font-display text-sm font-medium transition-all duration-300 relative ${
                isActive
                  ? "bg-brand-orange/10 text-brand-orange shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  : "text-text-muted hover:text-text-secondary hover:bg-white/5"
              }`}
            >
              {/* Vertical Active Indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-[2px] bg-brand-orange shadow-[0_0_10px_var(--orange)] rounded-full" />
              )}
              
              <Icon 
                size={18} 
                className={`transition-colors duration-300 ${isActive ? "text-brand-orange drop-shadow-[0_0_8px_rgba(229,89,29,0.4)]" : "group-hover:text-text-primary"}`} 
              />
              <span className={isActive ? "font-bold" : ""}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      {userProfile && (
        <div className="p-6 border-t border-white/5 bg-black/20 mt-auto">
          <div className="flex items-center gap-3 mb-5 group cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-display font-bold text-brand-amber shadow-inner group-hover:border-brand-orange/40 transition-colors">
              {(userProfile.nome || "K")[0].toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-bold text-text-primary truncate group-hover:text-white transition-colors">
                {userProfile.nome || "Investidor"}
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center gap-2 text-xs font-bold text-text-disabled hover:text-danger hover:bg-danger/10 transition-all py-2.5 rounded-lg uppercase tracking-widest border border-transparent hover:border-danger/20"
          >
            <LogOut size={14} />
            Sair da conta
          </button>
        </div>
      )}
    </aside>
  );
}