"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowRightLeft, 
  Target, 
  ShieldAlert, 
  Sparkles, 
  LogOut,
  Plus,
  TrendingUp,
  CreditCard
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

const MENU_ITEMS = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/investimentos", label: "Investimentos", icon: Wallet },
  { href: "/gastos", label: "Gastos", icon: CreditCard },
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
    <aside className="hidden md:flex w-64 h-screen bg-[#0a0a0a]/40 backdrop-blur-3xl border-r border-white/[0.03] flex-col fixed left-0 top-0 z-50">
      
      {/* Subtle Bottom Glow for Brand */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-orange-500/[0.03] to-transparent pointer-events-none" />

      {/* Logo Branding */}
      <div className="p-10 flex items-center gap-4 relative z-10">
        <div className="w-10 h-10 rounded-[1.25rem] bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center font-bold text-black shadow-xl transition-transform hover:scale-105 active:scale-95 duration-500">
          <TrendingUp size={22} />
        </div>
        <span className="text-2xl font-bold tracking-tighter text-white/95">KiNance</span>
      </div>

      {/* Primary Action Button */}
      <div className="px-6 mb-10 relative z-10">
        <Link 
          href="/lancamento" 
          className="group relative w-full flex items-center justify-center gap-3 bg-white text-black py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all duration-500 hover:shadow-[0_12px_24px_rgba(255,255,255,0.1)] hover:-translate-y-1 active:scale-95 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-400 opacity-0 group-hover:opacity-10 transition-opacity" />
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-500" /> 
          Novo Lançamento
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar relative z-10">
        <div className="text-[10px] font-bold text-white/10 uppercase tracking-[0.3em] mb-4 px-4">
          Navegação
        </div>
        
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[13px] font-bold transition-all duration-500 relative ${
                isActive
                  ? "bg-white/[0.03] text-white shadow-xl border border-white/[0.05]"
                  : "text-white/30 hover:text-white/60 hover:bg-white/[0.01]"
              }`}
            >
              {/* Active Indicator Glow */}
              {isActive && (
                <div className="absolute -left-1 top-1/4 bottom-1/4 w-[3px] bg-orange-500 rounded-full shadow-[0_0_15px_rgba(249,115,22,1)]" />
              )}
              
              <Icon 
                size={20} 
                className={`transition-all duration-500 ${isActive ? "text-orange-500 scale-110" : "group-hover:text-white/60"}`} 
              />
              <span className="tracking-tight">{item.label}</span>

              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      {userProfile && (
        <div className="p-8 border-t border-white/[0.03] mt-auto relative z-10">
          <div className="flex items-center gap-4 mb-8 group">
            <div className="w-11 h-11 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-orange-400 font-bold text-lg shadow-inner group-hover:bg-white/[0.04] transition-all duration-500">
              {(userProfile.nome || "K")[0].toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-bold text-white/80 truncate group-hover:text-white transition-colors duration-500">
                {userProfile.nome || "Investidor"}
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center gap-3 text-[11px] font-bold text-white/20 hover:text-red-400 hover:bg-red-500/5 transition-all py-3.5 rounded-xl uppercase tracking-[0.2em] border border-transparent hover:border-red-500/10 active:scale-95 duration-500"
          >
            <LogOut size={16} />
            Desconectar
          </button>
        </div>
      )}
    </aside>
  );
}