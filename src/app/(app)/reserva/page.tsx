"use client";

import { useState, useMemo } from "react";
import { useReserva } from "@/hooks/useFirebaseData";
import { formatBRL, maskCurrency, parseCurrency } from "@/lib/utils";
import { 
  ShieldAlert, Plus, History, Pencil, Trash2, X, 
  AlertTriangle, Check, CheckCircle2, TrendingUp 
} from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useQueryClient } from "@tanstack/react-query";
import { subMonths } from "date-fns";

// Componentes Modularizados
import { useReservaActions } from "./hooks/useReservaActions";
import { ReservaOptimization } from "./components/ReservaOptimization";
import { ReservaItem } from "@/types/financeiro";

export default function ReservaPage() {
  const queryClient = useQueryClient();
  const { data: historico, isLoading } = useReserva();
  const { addReserva, deleteItem, loading: processing } = useReservaActions();

  // Estados Locais
  const [valorAdd, setValorAdd] = useState("");
  const [descricaoAdd, setDescricaoAdd] = useState("");
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [novaMeta, setNovaMeta] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ReservaItem | null>(null);

  // Cálculos de Métricas
  const items = (historico as ReservaItem[] | undefined) ?? [];
  const totalReserva = items.reduce((acc, cur) => acc + (cur.valor || 0), 0);
  const meta = Number(items[0]?.meta ?? 15000);
  const porcentagem = Math.min((totalReserva / meta) * 100, 100);
  const isReservaCompleta = porcentagem >= 100;

  // Ritmo de Reserva (Últimos 3 meses)
  const ritmoReserva = useMemo(() => {
    if (!items.length) return 0;
    const tresMesesAtras = subMonths(new Date(), 3);
    const aportesRecentes = items.filter(item => new Date(item.data) >= tresMesesAtras);
    const totalRecente = aportesRecentes.reduce((acc, cur) => acc + (cur.valor || 0), 0);
    return totalRecente / 3;
  }, [items]);

  const mesesRestantes = ritmoReserva > 0 
    ? Math.ceil(Math.max(meta - totalReserva, 0) / ritmoReserva) 
    : Infinity;

  // Handlers
  const handleAddAporte = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor = parseCurrency(valorAdd);
    if (valor <= 0) return;
    
    const success = await addReserva(valor, descricaoAdd || "Aporte Reserva");
    if (success) {
      setValorAdd("");
      setDescricaoAdd("");
    }
  };

  const handleUpdateMeta = async () => {
    const valorMeta = parseCurrency(novaMeta);
    if (valorMeta <= 0 || !auth.currentUser || !items[0]?.id) return;

    try {
      const docRef = doc(db, `users/${auth.currentUser.uid}/reserva`, items[0].id);
      await updateDoc(docRef, { meta: valorMeta });
      await queryClient.invalidateQueries({ queryKey: ["reserva"] });
      setIsEditingMeta(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="animate-in fade-in zoom-in-95 duration-700 pb-20 space-y-12">
      {/* Header */}
      <header className="px-2">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white/95 flex items-center gap-4">
          <div className="w-12 h-12 rounded-[1.25rem] bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
            <ShieldAlert className="text-orange-500" size={28} />
          </div>
          Reserva de Emergência
        </h1>
        <p className="text-sm font-medium text-white/40 mt-3 max-w-xl leading-relaxed ml-1">
          Sua rede de segurança financeira. Mantenha seu custo de vida protegido contra imprevistos.
        </p>
      </header>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Painel Esquerdo: Status e Add */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Card de Resumo */}
          <div className="bg-[#0a0a0a] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-[2.5rem] p-8 lg:p-10 shadow-2xl relative overflow-hidden">
             <div className="relative z-10 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Saldo Protegido</span>
                    <div className="font-mono text-4xl font-bold text-white tracking-tighter drop-shadow-sm">
                      {formatBRL(totalReserva)}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Meta</span>
                    {isEditingMeta ? (
                      <div className="flex flex-col items-end gap-2">
                        <input
                          autoFocus
                          value={novaMeta}
                          onChange={(e) => setNovaMeta(maskCurrency(e.target.value))}
                          onBlur={() => !novaMeta && setIsEditingMeta(false)}
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-right font-mono text-sm focus:outline-none focus:border-orange-500/50 w-32"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => setIsEditingMeta(false)} className="text-white/20 hover:text-white transition-colors"><X size={14}/></button>
                          <button onClick={handleUpdateMeta} className="text-emerald-500 hover:text-emerald-400 transition-colors"><Check size={14}/></button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2 group cursor-pointer" onClick={() => { setNovaMeta(meta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })); setIsEditingMeta(true); }}>
                        <span className="font-mono text-lg font-bold text-white/40">{formatBRL(meta)}</span>
                        <Pencil size={12} className="text-white/10 group-hover:text-white/40 transition-colors" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="flex items-baseline gap-2">
                      <span className={`font-mono text-3xl font-bold tracking-tighter ${isReservaCompleta ? "text-emerald-400" : "text-orange-500"}`}>
                        {porcentagem.toFixed(1)}%
                      </span>
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">da meta concluída</span>
                    </div>
                    {isReservaCompleta && (
                      <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase tracking-widest bg-emerald-400/10 px-3 py-1 rounded-full">
                        <CheckCircle2 size={12} />
                        Seguro
                      </div>
                    )}
                  </div>
                  <div className="relative h-4 w-full bg-white/[0.02] border border-white/5 rounded-full overflow-hidden shadow-inner backdrop-blur-sm">
                     <div 
                       className={`h-full transition-all duration-1000 ease-out relative ${isReservaCompleta ? "bg-emerald-500" : "bg-orange-500"}`}
                       style={{ width: `${porcentagem}%` }}
                     />
                  </div>
                </div>

                {/* Otimização IA Integrada */}
                {!isReservaCompleta && (
                  <ReservaOptimization 
                    ritmoReserva={ritmoReserva}
                    mesesRestantes={mesesRestantes}
                    aporte6m={Math.max((meta - totalReserva) / 6, 0)}
                    aporte12m={Math.max((meta - totalReserva) / 12, 0)}
                    aporte24m={Math.max((meta - totalReserva) / 24, 0)}
                  />
                )}
             </div>
          </div>

          {/* Adicionar Aporte */}
          <form onSubmit={handleAddAporte} className="bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                <Plus className="text-orange-500" size={16} />
              </div>
              <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest">Novo Aporte</h3>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 font-mono font-bold">R$</span>
                <input
                  type="text"
                  required
                  value={valorAdd}
                  onChange={(e) => setValorAdd(maskCurrency(e.target.value))}
                  placeholder="0,00"
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white font-mono focus:outline-none focus:border-orange-500/50 transition-all"
                />
              </div>
              <input
                type="text"
                value={descricaoAdd}
                onChange={(e) => setDescricaoAdd(e.target.value)}
                placeholder="Descrição (ex: Aporte Mensal)"
                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-white/10"
              />
              <button
                type="submit"
                disabled={processing || !valorAdd}
                className="w-full py-4 rounded-2xl bg-white text-black font-bold text-xs uppercase tracking-[0.2em] transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 disabled:opacity-30"
              >
                Confirmar Aporte
              </button>
            </div>
          </form>
        </div>

        {/* Painel Direito: Histórico */}
        <div className="lg:col-span-7 space-y-8">
           <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-bold text-white/90 tracking-tight flex items-center gap-3">
                <History size={22} className="text-orange-500" />
                Histórico de Movimentações
              </h2>
           </div>

           <div className="space-y-4">
              {isLoading ? (
                <div className="h-40 bg-white/[0.02] border border-white/5 rounded-[2rem] animate-pulse" />
              ) : items.length === 0 ? (
                <div className="py-20 bg-white/[0.01] border border-dashed border-white/5 rounded-[3rem] flex flex-col items-center gap-4">
                  <ShieldAlert size={48} className="text-white/10" strokeWidth={1} />
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Sem registros</p>
                </div>
              ) : (
                items.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map((item) => (
                  <div key={item.id} className="group flex items-center justify-between p-6 bg-[#0a0a0a] border border-white/5 rounded-3xl hover:border-white/10 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.02] flex items-center justify-center text-white/20">
                        <TrendingUp size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white/80">{item.descricao}</div>
                        <div className="text-[10px] font-medium text-white/20 mt-0.5">
                          {new Date(item.data).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="font-mono text-sm font-bold text-emerald-400">+{formatBRL(item.valor)}</div>
                      <button 
                        onClick={() => setDeleteTarget(item)}
                        className="p-2 rounded-lg text-white/5 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>

      {/* Modal de Exclusão */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setDeleteTarget(null)} />
           <div className="relative z-10 w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500">
                <AlertTriangle size={28} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Excluir Registro</h2>
                <p className="text-sm text-white/40 mt-2">Deseja remover este aporte de {formatBRL(deleteTarget.valor)}?</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setDeleteTarget(null)} className="py-4 rounded-2xl bg-white/5 text-white/60 font-bold text-xs uppercase tracking-widest">Cancelar</button>
                <button 
                  onClick={async () => { await deleteItem(deleteTarget.id); setDeleteTarget(null); }}
                  className="py-4 rounded-2xl bg-red-500 text-white font-bold text-xs uppercase tracking-widest"
                >
                  Excluir
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}