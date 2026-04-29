import { Wallet, ShieldAlert, Sparkles, TrendingUp, ArrowDownCircle, AlertCircle } from "lucide-react";
import { formatBRL } from "@/lib/utils";

interface StatsPanelProps {
  metrics: any;
  isLoading: boolean;
}

export function StatsPanel({ metrics, isLoading }: StatsPanelProps) {
  if (isLoading) {
    return (
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 lg:p-10 animate-pulse space-y-8">
          <div className="h-10 bg-white/5 rounded-xl w-48" />
          <div className="space-y-4">
            <div className="h-12 bg-white/5 rounded-xl w-full" />
            <div className="h-12 bg-white/5 rounded-xl w-full" />
            <div className="h-12 bg-white/5 rounded-xl w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-5 space-y-6">
      <div className="bg-[#0a0a0a] bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 lg:p-10 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-3 px-1">
            Base de Análise
          </div>

          <div className="font-mono text-3xl font-bold text-white tracking-tighter mb-10 drop-shadow-sm">
            {formatBRL(metrics.patrimonio)}
          </div>

          <div className="space-y-6">
            <StatRow
              icon={<Wallet size={18} />}
              label="Em Ativos"
              value={formatBRL(metrics.totalInvestido)}
            />
            
            <div className="space-y-4 pt-2">
              <StatRow
                icon={<ShieldAlert size={18} />}
                label="Reserva de Emergência"
                value={formatBRL(metrics.totalReserva)}
              />
              
              <div className="space-y-2 px-1">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-white/20">
                  <span>Progresso: {metrics.progressoReserva.toFixed(1)}%</span>
                  <span className="text-orange-400/80">
                    {metrics.mesesParaReserva === Infinity 
                      ? "Sem aporte" 
                      : metrics.mesesParaReserva <= 0 
                        ? "Concluída!" 
                        : `Faltam ~${metrics.mesesParaReserva} meses`}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/[0.02] border border-white/5 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-orange-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(229,89,29,0.2)]"
                    style={{ width: `${metrics.progressoReserva}%`, backgroundColor: '#e5591d' }}
                  />
                </div>
              </div>

              <div className="mt-6 p-4 rounded-2xl bg-orange-500/[0.03] border border-orange-500/10 space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-bold text-orange-400 uppercase tracking-widest">
                  <Sparkles size={12} />
                  Otimização Sugerida (IA)
                </div>
                <div className="text-[11px] text-white/40 leading-relaxed">
                  Baseado nos seus gastos, sua reserva ideal seria de <span className="text-white/60 font-bold">{formatBRL(metrics.sugeridoIA)}</span>.
                </div>
                <div className="grid grid-cols-1 gap-2 pt-1">
                  <StatSimulacao label="6 meses" value={metrics.aporte6m} />
                  <StatSimulacao label="12 meses" value={metrics.aporte12m} />
                  <StatSimulacao label="24 meses" value={metrics.aporte24m} />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <StatRow
                icon={<TrendingUp size={18} />}
                label="Aporte médio/mês"
                value={formatBRL(metrics.aporteMedioMensal)}
              />
            </div>

            <div className="pt-6 border-t border-white/5">
              <StatRow
                icon={<ArrowDownCircle size={18} />}
                label="Gastos Totais"
                value={formatBRL(metrics.totalGastos)}
                valueColor="text-red-400"
              />
            </div>
          </div>
        </div>
      </div>

      {metrics.tickers.length > 0 && (
        <div className="p-5 rounded-[1.5rem] bg-white/[0.01] border border-white/5 flex flex-wrap gap-2">
          {metrics.tickers.map((t: string) => (
            <span key={t} className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg uppercase tracking-widest bg-orange-500/10 text-orange-500 border border-orange-500/20">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="p-6 rounded-[2rem] bg-white/[0.01] border border-white/5 flex items-start gap-4">
        <AlertCircle size={18} className="text-white/20 shrink-0 mt-0.5" />
        <p className="text-[11px] font-medium text-white/30 leading-relaxed uppercase tracking-wider">
          A IA usa seu histórico real para calcular o perfil e sugerir melhorias baseadas em dados.
        </p>
      </div>
    </div>
  );
}

function StatRow({ icon, label, value, valueColor = "text-white/80" }: any) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-white/20 group-hover:text-white/50 transition-colors shadow-inner">
          {icon}
        </div>
        <span className="text-sm font-medium text-white/40 group-hover:text-white/60 transition-colors">
          {label}
        </span>
      </div>
      <span className={`font-mono font-bold ${valueColor}`}>{value}</span>
    </div>
  );
}

function StatSimulacao({ label, value }: any) {
  return (
    <div className="flex justify-between items-center text-[10px] text-white/30 border-b border-white/5 pb-2 last:border-0 last:pb-0">
      <span>Concluir em {label}:</span>
      <span className="font-mono font-bold text-white/60">{formatBRL(value)}/mês</span>
    </div>
  );
}
