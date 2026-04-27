"use client";

import { useAportes } from "@/hooks/useFirebaseData";
import { formatBRL } from "@/lib/utils";
import { Plus, TrendingUp, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { doc, deleteDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useQueryClient } from "@tanstack/react-query";

export default function InvestimentosPage() {
  const { data: aportes, isLoading } = useAportes();
  const queryClient = useQueryClient();

  const handleDelete = async (id: string) => {
    if (!auth.currentUser || !confirm("Tem certeza que deseja excluir este lançamento?")) return;
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/aportes`, id));
      await queryClient.invalidateQueries({ queryKey: ["aportes"] });
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full shadow-[0_0_15px_var(--orange-dim)]"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="font-display font-bold text-3xl text-text-primary tracking-tight drop-shadow-md">
            Investimentos
          </h1>
          <p className="text-text-muted mt-1">Seu histórico de ativos.</p>
        </div>
        <Link 
          href="/investimentos/novo" 
          className="hidden md:flex items-center gap-2 bg-[linear-gradient(135deg,var(--orange),var(--amber))] text-white px-5 py-2.5 rounded-xl font-bold transition-all duration-300 hover:shadow-[0_8px_24px_rgba(229,89,29,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] hover:-translate-y-0.5 active:scale-95 shadow-md"
        >
          <Plus size={20} /> Novo Lançamento
        </Link>
      </header>

      <div className="bg-[linear-gradient(145deg,rgba(255,255,255,0.02)_0%,transparent_100%)] backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
        <div className="space-y-4">
          {aportes?.map((aporte: any) => (
            <div 
              key={aporte.id} 
              className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer relative overflow-hidden"
            >
              {/* Indicador lateral sutil de tipo */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${aporte.tipo === 'compra' ? 'bg-success' : 'bg-danger'} opacity-60`} />

              <div className="flex items-center gap-5 mb-4 sm:mb-0">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold font-mono text-lg backdrop-blur-md shadow-inner border border-white/10 ${
                  aporte.tipo === 'compra' 
                  ? 'bg-success/10 text-success' 
                  : 'bg-danger/10 text-danger'
                }`}>
                  {aporte.ativo?.[0]?.toUpperCase() || "A"}
                </div>
                <div>
                  <div className="font-mono font-bold text-lg text-text-primary tracking-wide group-hover:text-white transition-colors">
                    {aporte.ativo?.toUpperCase()}
                  </div>
                  <div className="font-display text-sm text-text-muted mt-0.5 flex items-center gap-2">
                    <span>{new Date(aporte.data).toLocaleDateString('pt-BR')}</span>
                    <span className="w-1 h-1 rounded-full bg-text-disabled"></span>
                    <span className="font-medium text-text-secondary">{aporte.quantidade} cotas</span>
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right flex flex-col justify-center border-t border-white/5 sm:border-none pt-4 sm:pt-0">
                <div className="font-mono font-bold text-xl text-text-primary drop-shadow-sm">
                  {formatBRL(aporte.valorTotal || 0)}
                </div>
                <div className="font-display text-[12px] text-text-muted mt-1 uppercase tracking-wider font-semibold">
                  Preço médio: <span className="text-text-secondary">{formatBRL(aporte.valor || 0)}</span>
                </div>
                
                {/* Ações */}
                <div className="flex items-center gap-2 mt-3 sm:justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link 
                    href={`/investimentos/novo?id=${aporte.id}`}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-all"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </Link>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(aporte.id);
                    }}
                    className="p-2 rounded-lg bg-white/5 hover:bg-danger/20 text-text-muted hover:text-danger transition-all"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {(!aportes || aportes.length === 0) && (
            <div className="text-center py-20 text-text-muted flex flex-col items-center gap-4 opacity-60">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                <TrendingUp size={32} strokeWidth={1} />
              </div>
              <div className="max-w-xs mx-auto font-display">
                Você ainda não possui nenhum investimento registrado.<br />
                <Link href="/investimentos/novo" className="text-brand-orange hover:text-amber-500 hover:underline font-bold mt-3 inline-block transition-colors">
                  Comece sua carteira agora
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FAB Mobile */}
      <Link 
        href="/investimentos/novo"
        className="md:hidden fixed bottom-24 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-brand-orange to-amber-500 text-white flex items-center justify-center shadow-[0_8px_24px_rgba(229,89,29,0.4),inset_0_2px_4px_rgba(255,255,255,0.3)] active:scale-90 transition-all z-50"
      >
        <Plus size={28} />
      </Link>
    </div>
  );
}