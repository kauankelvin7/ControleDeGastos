"use client";

import { useAportes } from "@/hooks/useFirebaseData";
import { formatBRL } from "@/lib/utils";
import { Plus, TrendingUp, Pencil, Trash2, Wallet, AlertTriangle, ArrowUpRight, ArrowDownRight, Search } from "lucide-react";
import Link from "next/link";
import { doc, deleteDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

// ─── delete modal ─────────────────────────────────────────────────────────────

interface ConfirmDeleteModalProps {
  ticker: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDeleteModal({ ticker, loading, onConfirm, onCancel }: ConfirmDeleteModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onCancel} aria-hidden />
      <div className="relative z-10 w-full max-w-sm bg-[#0a0a0a] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-inner">
            <Trash2 size={28} className="text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Remover Lançamento
            </h2>
            <p className="text-white/40 text-sm mt-2 leading-relaxed">
              Deseja excluir a operação de <span className="text-white font-semibold">"{ticker}"</span>? Esta ação não pode ser desfeita.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full pt-2">
            <button
              onClick={onCancel}
              disabled={loading}
              className="py-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-white/60 font-bold text-sm transition-all duration-300 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="py-4 rounded-2xl bg-red-500/90 hover:bg-red-500 text-white font-bold text-sm transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "Excluir"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function InvestimentosPage() {
  const { data: aportes, isLoading, isError } = useAportes();
  const queryClient = useQueryClient();
  
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteConfirm = async () => {
    if (!auth.currentUser || !deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/aportes`, deleteTarget.id));
      await queryClient.invalidateQueries({ queryKey: ["aportes"] });
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      setDeleteTarget(null);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4" aria-label="Carregando">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center justify-center animate-pulse">
           <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin shadow-[0_0_20px_rgba(249,115,22,0.1)]" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Acessando Carteira</span>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in zoom-in-95 duration-700 pb-20">
      
      {/* Delete Modal */}
      {deleteTarget && (
        <ConfirmDeleteModal
          ticker={deleteTarget.ativo}
          loading={deletingId === deleteTarget.id}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Header */}
      <header className="mb-12 px-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white/95 flex items-center gap-4">
            <div className="w-12 h-12 rounded-[1.25rem] bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
              <Wallet className="text-orange-500" size={28} />
            </div>
            Investimentos
          </h1>
          <p className="text-sm font-medium text-white/40 mt-3 max-w-xl leading-relaxed ml-1">
            Seu histórico de ativos e movimentações de mercado em ordem cronológica.
          </p>
        </div>

        <Link 
          href="/investimentos/novo" 
          className="hidden sm:flex items-center gap-2.5 bg-orange-500 text-white px-6 py-3.5 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all duration-500 hover:shadow-[0_8px_24px_rgba(249,115,22,0.3)] hover:-translate-y-1 active:scale-95 shadow-xl"
        >
          <Plus size={20} /> Nova Ordem
        </Link>
      </header>

      {/* List Section */}
      <div className="max-w-5xl mx-auto space-y-6">
        {aportes?.map((aporte: any, index: number) => {
          const isCompra = aporte.tipo === 'compra';
          return (
            <div 
              key={aporte.id} 
              style={{ animationDelay: `${index * 50}ms` }}
              className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-6 sm:p-8 rounded-[2.5rem] bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] hover:border-white/10 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4"
            >
              {/* Type Indicator */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-opacity duration-500 ${isCompra ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'} group-hover:opacity-100 opacity-40`} />

              {/* Main Info */}
              <div className="flex items-center gap-6 mb-6 sm:mb-0 relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-mono font-bold text-xl border transition-all duration-500 group-hover:scale-110 ${
                  isCompra ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                  {isCompra ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-2xl font-bold text-white tracking-tighter uppercase group-hover:text-white transition-colors">
                      {aporte.ativo}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${isCompra ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {aporte.tipo}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                     <span className="text-[11px] font-bold text-white/20 uppercase tracking-widest">{new Date(aporte.data).toLocaleDateString('pt-BR')}</span>
                     <span className="w-1 h-1 rounded-full bg-white/10" />
                     <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">{aporte.quantidade} cotas</span>
                  </div>
                </div>
              </div>

              {/* Values and Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-10 sm:gap-12 relative z-10">
                <div className="text-left sm:text-right">
                  <div className={`font-mono text-2xl font-bold tracking-tighter ${isCompra ? 'text-white' : 'text-white/60'}`}>
                    {formatBRL(aporte.valorTotal || 0)}
                  </div>
                  <div className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mt-1">
                    P. Médio: <span className="text-white/40">{formatBRL(aporte.valor || 0)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                   <Link 
                    href={`/investimentos/novo?id=${aporte.id}`}
                    className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-white/20 hover:text-white hover:bg-white/[0.06] transition-all shadow-sm"
                  >
                    <Pencil size={16} />
                  </Link>
                  <button 
                    onClick={() => setDeleteTarget(aporte)}
                    className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all shadow-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Huge Background Letter */}
              <span className="absolute -right-4 -bottom-6 text-white/[0.02] font-mono font-bold text-[140px] leading-none pointer-events-none select-none transition-transform duration-1000 group-hover:-translate-x-4">
                {aporte.ativo?.[0]}
              </span>
            </div>
          );
        })}

        {(!aportes || aportes.length === 0) && (
          <div className="flex flex-col items-center justify-center py-40 gap-8 bg-white/[0.01] border border-white/5 border-dashed rounded-[3rem] animate-in fade-in duration-1000">
             <div className="w-24 h-24 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-center shadow-inner group overflow-hidden">
                <TrendingUp size={40} className="text-white/10 group-hover:scale-110 transition-transform duration-700" strokeWidth={1} />
             </div>
             <div className="text-center max-w-sm px-8">
               <p className="text-white/60 font-bold tracking-wide text-lg">Carteira Vazia</p>
               <p className="text-white/30 text-sm mt-3 leading-relaxed">Comece a construir seu patrimônio hoje mesmo registrando sua primeira operação de ativos.</p>
               <Link 
                href="/investimentos/novo" 
                className="inline-flex items-center gap-2 mt-8 px-8 py-4 rounded-2xl bg-orange-500 text-white font-bold text-xs uppercase tracking-widest hover:shadow-2xl hover:shadow-orange-500/20 transition-all active:scale-95 shadow-xl"
              >
                Registrar Primeiro Ativo
              </Link>
             </div>
          </div>
        )}
      </div>

      {/* FAB Mobile */}
      <Link 
        href="/investimentos/novo"
        className="sm:hidden fixed bottom-10 right-8 w-16 h-16 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-[0_12px_32px_rgba(249,115,22,0.4),inset_0_2px_4px_rgba(255,255,255,0.3)] active:scale-90 transition-all z-50 animate-in slide-in-from-bottom-10"
      >
        <Plus size={32} />
      </Link>
    </div>
  );
}