import Link from "next/link";
import { ArrowRightLeft, Wallet, ShieldAlert, Target, ArrowLeft, HandCoins } from "lucide-react";

export default function LancamentoHubPage() {
  const options = [
    {
      title: "Registrar Gasto",
      description: "Adicione uma nova despesa do seu dia a dia.",
      icon: ArrowRightLeft,
      href: "/gastos/novo",
      color: "text-danger",
      bgHover: "hover:bg-danger/10 hover:border-danger/30",
    },
    {
      title: "Comprar/Vender Ativo",
      description: "Registre novos investimentos na sua carteira.",
      icon: Wallet,
      href: "/investimentos/novo",
      color: "text-success",
      bgHover: "hover:bg-success/10 hover:border-success/30",
    },
    {
      title: "Receber Dividendo",
      description: "Registre o recebimento de proventos e renda passiva.",
      icon: HandCoins,
      href: "/dividendos/novo",
      color: "text-info",
      bgHover: "hover:bg-info/10 hover:border-info/30",
    },
    {
      title: "Guardar Reserva",
      description: "Adicione dinheiro para sua segurança financeira.",
      icon: ShieldAlert,
      href: "/reserva",
      color: "text-brand-orange",
      bgHover: "hover:bg-brand-orange/10 hover:border-brand-orange/30",
    },
    {
      title: "Aportar em Meta",
      description: "Coloque dinheiro em um dos seus objetivos.",
      icon: Target,
      href: "/metas",
      color: "text-brand-amber",
      bgHover: "hover:bg-brand-amber/10 hover:border-brand-amber/30",
    },
  ];

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 max-w-4xl mx-auto h-full flex flex-col justify-center py-10">
      <header className="mb-10 text-center relative">
        <Link 
          href="/dashboard" 
          className="absolute left-0 top-0 w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5 flex items-center justify-center text-text-muted hover:text-text-primary transition-all duration-300 shadow-sm backdrop-blur-md hidden sm:flex"
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-4 sm:px-0">
        {options.map((opt, i) => {
          const Icon = opt.icon;
          return (
            <Link 
              key={i} 
              href={opt.href}
              className={`group flex flex-col items-center text-center p-8 rounded-3xl bg-[linear-gradient(145deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.01)_100%)] backdrop-blur-2xl border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)] ${opt.bgHover}`}
            >
              <div className={`w-20 h-20 rounded-2xl bg-black/30 border border-white/5 flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500 ${opt.color}`}>
                <Icon size={40} className="drop-shadow-[0_0_15px_currentColor]" />
              </div>
              <h3 className="font-display font-bold text-2xl text-text-primary tracking-tight mb-2 group-hover:text-white transition-colors">
                {opt.title}
              </h3>
              <p className="text-text-muted text-sm px-4">
                {opt.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
