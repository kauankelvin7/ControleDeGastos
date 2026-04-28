import Link from "next/link";
import { ArrowRightLeft, Wallet, ShieldAlert, Target, ArrowLeft, HandCoins, LucideIcon } from "lucide-react";

// ─── types ────────────────────────────────────────────────────────────────────

interface LancamentoOption {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  colorClass: string;
  hoverClass: string;
  glowColor: string; // valor literal para drop-shadow
}

// ─── static data (fora do componente — não recria a cada render) ──────────────

const OPTIONS: LancamentoOption[] = [
  {
    title: "Registrar Gasto",
    description: "Adicione uma nova despesa do seu dia a dia.",
    icon: ArrowRightLeft,
    href: "/gastos/novo",
    colorClass: "text-danger",
    hoverClass: "hover:bg-danger/10 hover:border-danger/30",
    glowColor: "rgba(248,113,113,0.6)",
  },
  {
    title: "Comprar / Vender Ativo",
    description: "Registre novos investimentos na sua carteira.",
    icon: Wallet,
    href: "/investimentos/novo",
    colorClass: "text-success",
    hoverClass: "hover:bg-success/10 hover:border-success/30",
    glowColor: "rgba(74,222,128,0.6)",
  },
  {
    title: "Receber Dividendo",
    description: "Registre o recebimento de proventos e renda passiva.",
    icon: HandCoins,
    href: "/dividendos/novo",
    colorClass: "text-info",
    hoverClass: "hover:bg-info/10 hover:border-info/30",
    glowColor: "rgba(56,189,248,0.6)",
  },
  {
    title: "Guardar Reserva",
    description: "Adicione dinheiro para sua segurança financeira.",
    icon: ShieldAlert,
    href: "/reserva",
    colorClass: "text-brand-orange",
    hoverClass: "hover:bg-brand-orange/10 hover:border-brand-orange/30",
    glowColor: "rgba(229,89,29,0.6)",
  },
  {
    title: "Aportar em Meta",
    description: "Coloque dinheiro em um dos seus objetivos.",
    icon: Target,
    href: "/metas",
    colorClass: "text-brand-amber",
    hoverClass: "hover:bg-brand-amber/10 hover:border-brand-amber/30",
    glowColor: "rgba(251,191,36,0.6)",
  },
];

// ─── card ─────────────────────────────────────────────────────────────────────

function OptionCard({ opt }: { opt: LancamentoOption }) {
  const Icon = opt.icon;
  return (
    <Link
      href={opt.href}
      aria-label={opt.title}
      className={`group flex flex-col items-center text-center p-8 rounded-3xl bg-[linear-gradient(145deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.01)_100%)] backdrop-blur-2xl border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)] ${opt.hoverClass}`}
    >
      <div
        className={`w-20 h-20 rounded-2xl bg-black/30 border border-white/5 flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500 ${opt.colorClass}`}
      >
        <Icon
          size={40}
          style={{ filter: `drop-shadow(0 0 12px ${opt.glowColor})` }}
        />
      </div>
      <h3 className="font-display font-bold text-2xl text-text-primary tracking-tight mb-2 group-hover:text-white transition-colors">
        {opt.title}
      </h3>
      <p className="text-text-muted text-sm px-4">{opt.description}</p>
    </Link>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function LancamentoHubPage() {
  // Separa os pares do último item (caso o total seja ímpar)
  const isOdd = OPTIONS.length % 2 !== 0;
  const pairs = isOdd ? OPTIONS.slice(0, -1) : OPTIONS;
  const lastItem = isOdd ? OPTIONS[OPTIONS.length - 1] : null;

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 max-w-4xl mx-auto h-full flex flex-col justify-center py-10">

      {/* Header */}
      <header className="mb-10 text-center relative">
        <Link
          href="/dashboard"
          aria-label="Voltar para o dashboard"
          className="absolute left-0 top-1/2 -translate-y-1/2 sm:top-0 sm:translate-y-0 w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5 flex items-center justify-center text-text-muted hover:text-text-primary transition-all duration-300 shadow-sm backdrop-blur-md"
        >
          <ArrowLeft size={20} />
        </Link>

        <h1 className="font-display font-bold text-4xl text-text-primary tracking-tight drop-shadow-md">
          Novo Lançamento
        </h1>
        <p className="text-text-muted mt-3 max-w-md mx-auto text-lg">
          Para onde vai esse dinheiro? Escolha o tipo de registro que deseja realizar.
        </p>
      </header>

      {/* Grid — pares normais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-4 sm:px-0">
        {pairs.map((opt) => (
          <OptionCard key={opt.href} opt={opt} />
        ))}

        {/* Último item ímpar — centralizado em coluna única */}
        {lastItem && (
          <div className="sm:col-span-2 sm:max-w-sm sm:mx-auto w-full">
            <OptionCard key={lastItem.href} opt={lastItem} />
          </div>
        )}
      </div>
    </div>
  );
}