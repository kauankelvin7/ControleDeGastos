import { Sparkles } from "lucide-react";
import { formatBRL } from "@/lib/utils";

interface ReservaOptimizationProps {
  ritmoReserva: number;
  mesesRestantes: number;
  aporte6m: number;
  aporte12m: number;
  aporte24m: number;
}

export function ReservaOptimization({ 
  ritmoReserva, 
  mesesRestantes, 
  aporte6m, 
  aporte12m, 
  aporte24m 
}: ReservaOptimizationProps) {
  return (
    <div className="mt-10 pt-8 border-t border-white/5 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[10px] font-bold text-orange-400 uppercase tracking-widest">
          <Sparkles size={14} className="animate-pulse" />
          Otimização Estratégica (IA)
        </div>
        <div className="text-sm text-white/50 font-medium leading-relaxed">
          Com seu ritmo de <span className="text-white font-bold">{formatBRL(ritmoReserva)}/mês</span>, 
          você atingirá a meta em <span className="text-orange-400 font-bold">
            {mesesRestantes === Infinity ? "um longo prazo" : `~${mesesRestantes} meses`}
          </span>.
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        <div className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-1 mb-1">Cenários para Acelerar</div>
        <ScenarioRow label="Meta em 6 meses" value={aporte6m} />
        <ScenarioRow label="Meta em 12 meses" value={aporte12m} />
        <ScenarioRow label="Meta em 24 meses" value={aporte24m} />
      </div>

      <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.01] border border-white/5">
        <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest leading-relaxed">
          * Valores calculados para atingir o saldo restante de forma linear.
        </div>
      </div>
    </div>
  );
}

function ScenarioRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest group-hover:text-white/60 transition-colors">{label}</span>
      <span className="font-mono font-bold text-white/80">{formatBRL(value)}<span className="text-[10px] text-white/20 ml-1">/mês</span></span>
    </div>
  );
}

