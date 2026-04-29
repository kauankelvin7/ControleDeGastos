import Link from "next/link";
import {
  ArrowRightLeft,
  Wallet,
  ShieldAlert,
  Target,
  ArrowLeft,
  HandCoins,
  TrendingUp,
  LucideIcon,
  ChevronRight
} from "lucide-react";

// ─── types ────────────────────────────────────────────────────────────────────

interface LancamentoOption {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  colorClass: string;
  iconBgClass: string;
}

// ─── static data (fora do componente — não recria a cada render) ──────────────

const OPTIONS: LancamentoOption[] = [
  {
    title: "Gasto",
    description: "Registre uma nova saída no seu fluxo de caixa.",
    icon: ArrowRightLeft,
    href: "/gastos/novo",
    colorClass: "text-red-400",
    iconBgClass: "bg-red-500/10 border-red-500/20",
  },
  {
    title: "Receita",
    description: "Sincronize uma nova entrada ou salário.",
    icon: TrendingUp,
    href: "/receitas/novo",
    colorClass: "text-emerald-400",
    iconBgClass: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    title: "Dividendo",
    description: "Lance proventos e renda passiva recebida.",
    icon: HandCoins,
    href: "/dividendos/novo",
    colorClass: "text-sky-400",
    iconBgClass: "bg-sky-500/10 border-sky-500/20",
  },
  {
    title: "Investimento",
    description: "Atualize sua carteira com novos aportes.",
    icon: Wallet,
    href: "/investimentos/novo",
    colorClass: "text-amber-400",
    iconBgClass: "bg-amber-500/10 border-amber-500/20",
  },
  {
    title: "Reserva",
    description: "Fortaleça sua segurança financeira.",
    icon: ShieldAlert,
    href: "/reserva",
    colorClass: "text-orange-400",
    iconBgClass: "bg-orange-500/10 border-orange-500/20",
  },
  {
    title: "Meta",
    description: "Aporte dinheiro em um dos seus sonhos.",
    icon: Target,
    href: "/metas",
    colorClass: "text-purple-400",
    iconBgClass: "bg-purple-500/10 border-purple-500/20",
  },
];

// ─── card ─────────────────────────────────────────────────────────────────────

function OptionCard({ opt, index }: { opt: LancamentoOption, index: number }) {
  const Icon = opt.icon;
  return (
    <Link
      href={opt.href}
      aria-label={opt.title}
      style={{ animationDelay: `${index * 100}ms` }}
      className="group relative flex items-center gap-6 p-6 sm:p-8 rounded-[2.5rem] bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] hover:border-white/10 transition-all duration-500 hover:-translate-y-1.5 shadow-xl animate-in fade-in slide-in-from-bottom-4"
    >
      {/* Decorative Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2.5rem]`} />
      
      {/* Icon Container */}
      <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 shadow-inner relative z-10 ${opt.iconBgClass} ${opt.colorClass}`}>
        <Icon size={32} className="sm:size-40" strokeWidth={1.5} />
      </div>

      {/* Text Info */}
      <div className="flex-1 min-w-0 relative z-10">
        <h3 className="text-xl font-bold text-white/90 tracking-tight mb-1 group-hover:text-white transition-colors">
          {opt.title}
        </h3>
        <p className="text-sm font-medium text-white/30 leading-relaxed max-w-[200px] sm:max-w-none line-clamp-2">
          {opt.description}
        </p>
      </div>

      {/* Arrow Indicator */}
      <div className="hidden sm:flex w-10 h-10 rounded-full bg-white/[0.03] border border-white/5 items-center justify-center text-white/10 group-hover:text-white/40 group-hover:bg-white/[0.06] transition-all duration-500 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 relative z-10">
        <ChevronRight size={20} />
      </div>
    </Link>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function LancamentoHubPage() {
  return (
    <div className="animate-in fade-in zoom-in-95 duration-700 max-w-5xl mx-auto py-10 lg:py-20 px-4">
      {/* Header */}
      <header className="mb-16 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/30 mb-6">
           <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
           Novo Registro
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-white/95 tracking-tighter drop-shadow-sm mb-4">
          Qual o fluxo de hoje?
        </h1>
        <p className="text-sm lg:text-base font-medium text-white/40 leading-relaxed px-4">
          Escolha uma das categorias abaixo para registrar uma movimentação e manter seu dashboard atualizado em tempo real.
        </p>
      </header>

      {/* Grid — Optimized for Premium feel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {OPTIONS.map((opt, idx) => (
          <OptionCard key={opt.href} opt={opt} index={idx} />
        ))}
      </div>

      {/* Footer / Back Link */}
      <footer className="mt-16 text-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white/20 hover:text-white/60 transition-all group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Voltar ao Dashboard
        </Link>
      </footer>
    </div>
  );
}