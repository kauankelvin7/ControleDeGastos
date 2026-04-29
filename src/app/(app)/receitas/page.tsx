"use client";

import { useState } from "react";
import { useReceitas } from "@/hooks/useFirebaseData";
import { formatBRL } from "@/lib/utils";
import { Plus, TrendingUp, Pencil, Trash2, AlertCircle, AlertTriangle, Calendar } from "lucide-react";
import Link from "next/link";
import { doc, deleteDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useQueryClient } from "@tanstack/react-query";
import { Receita } from "@/types/receita";

// ─── helpers ──────────────────────────────────────────────────────────────────

function groupByMonth(receitas: Receita[]): Array<{ mesKey: string; label: string; items: Receita[]; total: number }> {
  const map = new Map<string, Receita[]>();

  for (const r of receitas) {
    const key = r.mesKey ?? r.data?.substring(0, 7) ?? "—";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([mesKey, items]) => {
      const [year, month] = mesKey.split("-");
      const date = new Date(Number(year), Number(month) - 1);
      const label = date.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      }).replace(/^\w/, (c) => c.toUpperCase());
      const total = items.reduce((acc, r) => acc + (r.valor ?? 0), 0);
      return { mesKey, label, items, total };
    });
}

function formatDate(isoString: string): string {
  const [datePart] = isoString.split("T");
  const [y, m, d] = datePart.split("-");
  return `${d}/${m}/${y}`;
}

// ─── delete confirmation modal ────────────────────────────────────────────────

interface ConfirmDeleteModalProps {
  descricao: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

function ConfirmDeleteModal({ descricao, onConfirm, onCancel, loading }: ConfirmDeleteModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onCancel}
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-sm bg-[#0a0a0a] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-inner">
            <AlertTriangle size={28} className="text-red-400" />
          </div>

          <div>
            <h2 id="modal-title" className="text-xl font-bold text-white tracking-tight">
              Confirmar Exclusão
            </h2>
            <p className="text-white/40 text-sm mt-2 leading-relaxed">
              Você deseja remover a receita <span className="text-white font-semibold">"{descricao}"</span>? Esta ação não pode ser desfeita.
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
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                "Excluir"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── receita card ─────────────────────────────────────────────────────────────

interface ReceitaCardProps {
  receita: Receita;
  onDelete: (receita: Receita) => void;
  deletingId: string | null;
}

function ReceitaCard({ receita, onDelete, deletingId }: ReceitaCardProps) {
  const isDeleting = deletingId === receita.id;

  return (
    <div
      className={`group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 hover:bg-white/[0.03] transition-all duration-500 ${
        isDeleting ? "opacity-30 pointer-events-none scale-95" : ""
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/20 group-hover:text-emerald-400/60 group-hover:bg-emerald-400/5 transition-all duration-500 shadow-inner shrink-0">
          <TrendingUp size={22} strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-base text-white/90 tracking-tight truncate pr-2 group-hover:text-white transition-colors">
            {receita.descricao}
          </div>
          <div className="text-[11px] font-medium text-white/30 mt-1 flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Calendar size={10} />
              {formatDate(receita.data)}
            </span>
            <span className="w-1 h-1 rounded-full bg-white/10" aria-hidden />
            <span className="uppercase tracking-[0.15em] font-bold">
              {receita.categoria}
            </span>
          </div>
        </div>
      </div>

      <div className="text-left sm:text-right mt-4 sm:mt-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 pl-16 sm:pl-0">
        <div className="font-mono font-bold text-lg text-emerald-400 group-hover:scale-105 transition-transform duration-500">
          +{formatBRL(receita.valor ?? 0)}
        </div>

        <div className="flex items-center gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 translate-y-0 sm:group-hover:translate-y-0 sm:translate-y-2">
          <Link
            href={`/receitas/novo?id=${receita.id}`}
            aria-label={`Editar ${receita.descricao}`}
            className="p-2 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all shadow-sm"
          >
            <Pencil size={15} strokeWidth={2} />
          </Link>
          <button
            onClick={() => onDelete(receita)}
            aria-label={`Excluir ${receita.descricao}`}
            className="p-2 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all shadow-sm"
          >
            <Trash2 size={15} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ReceitasPage() {
  const { data: receitas, isLoading, isError } = useReceitas();
  const queryClient = useQueryClient();

  const [deleteTarget, setDeleteTarget] = useState<Receita | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !auth.currentUser) return;

    setDeletingId(deleteTarget.id);
    setDeleteError(null);
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/receitas`, deleteTarget.id));
      await queryClient.invalidateQueries({ queryKey: ["receitas"] });
      setDeleteTarget(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Tente novamente.";
      console.error("Erro ao excluir receita:", err);
      setDeleteError(`Não foi possível excluir: ${message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // ── loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4" aria-label="Carregando">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center justify-center animate-pulse">
           <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin shadow-[0_0_20px_rgba(16,185,129,0.1)]" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Sincronizando Entradas</span>
      </div>
    );
  }

  // ── error ──────────────────────────────────────────────────────────────────

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6 animate-in fade-in duration-700">
        <div className="w-20 h-20 rounded-3xl bg-red-500/5 border border-red-500/10 flex items-center justify-center shadow-inner">
          <AlertCircle size={40} className="text-red-400/40" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-white/80">Erro de Carregamento</p>
          <p className="text-sm text-white/30 mt-2">Não conseguimos buscar suas receitas agora.</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/70 font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
        >
          Recarregar
        </button>
      </div>
    );
  }

  const groups = groupByMonth((receitas as Receita[]) ?? []);

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="animate-in fade-in zoom-in-95 duration-700 pb-20">
      
      {/* Header */}
      <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 px-2">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white/95 drop-shadow-sm">
            Receitas
          </h1>
          <p className="text-sm font-medium text-white/40 mt-1.5">
            Gerencie suas fontes de renda e acompanhe seu crescimento.
          </p>
        </div>
        
        <Link
          href="/receitas/novo"
          className="group relative flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 text-white px-6 py-3.5 rounded-2xl font-bold transition-all duration-300 shadow-xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Plus size={18} className="text-emerald-500 relative z-10" />
          <span className="relative z-10 text-sm tracking-wide">Nova Receita</span>
        </Link>
      </header>

      {/* Delete error banner */}
      {deleteError && (
        <div
          role="alert"
          className="flex items-center gap-4 bg-red-500/10 border border-red-500/20 rounded-2xl px-6 py-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-500 shadow-lg"
        >
          <AlertCircle size={18} className="text-red-400 shrink-0" aria-hidden />
          <p className="text-sm font-medium text-red-400">{deleteError}</p>
        </div>
      )}

      {/* Main List Container */}
      <div className="bg-[#0a0a0a] bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-6 lg:p-10 shadow-2xl relative overflow-hidden">
        
        {/* Subtle Decorative Background Element */}
        <TrendingUp
          size={300}
          className="absolute -left-20 -top-20 text-white/[0.01] pointer-events-none select-none rotate-12"
          aria-hidden
        />

        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6 animate-in fade-in duration-1000">
            <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center shadow-inner">
              <TrendingUp size={36} className="text-white/10" strokeWidth={1} />
            </div>
            <div className="text-center max-w-xs">
              <p className="text-white/60 font-semibold tracking-wide">Sem receitas registradas</p>
              <p className="text-white/30 text-sm mt-2">Suas entradas agrupadas por mês aparecerão aqui assim que você as cadastrar.</p>
            </div>
            <Link 
               href="/receitas/novo"
               className="mt-2 text-xs font-bold uppercase tracking-widest text-emerald-500/80 hover:text-emerald-400 transition-colors"
            >
              Adicionar primeira entrada →
            </Link>
          </div>
        ) : (
          <div className="space-y-12 relative z-10">
            {groups.map(({ mesKey, label, items, total }) => (
              <section key={mesKey} aria-labelledby={`mes-${mesKey}`} className="animate-in fade-in duration-700">
                {/* Month Group Header */}
                <div className="flex items-center justify-between mb-6 px-1">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 rounded-full bg-emerald-400/20" />
                    <h2
                      id={`mes-${mesKey}`}
                      className="text-xs font-bold text-white/50 uppercase tracking-[0.2em]"
                    >
                      {label}
                    </h2>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-0.5">Entrada Mensal</span>
                    <span className="font-mono text-base font-bold text-emerald-400/90 tracking-tighter">
                      +{formatBRL(total)}
                    </span>
                  </div>
                </div>

                {/* Grid of Cards */}
                <div className="grid grid-cols-1 gap-4">
                  {items.map((receita) => (
                    <ReceitaCard
                      key={receita.id}
                      receita={receita}
                      onDelete={setDeleteTarget}
                      deletingId={deletingId}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button - Mobile Only */}
      <Link
        href="/receitas/novo"
        aria-label="Nova receita"
        className="md:hidden fixed bottom-8 right-6 w-16 h-16 rounded-[2rem] bg-emerald-500 text-white flex items-center justify-center shadow-[0_12px_32px_rgba(16,185,129,0.4)] active:scale-95 transition-all z-50 border border-white/20 group"
      >
        <Plus size={30} className="group-hover:rotate-90 transition-transform duration-500" />
      </Link>

      {/* Confirmation Modal Container */}
      {deleteTarget && (
        <ConfirmDeleteModal
          descricao={deleteTarget.descricao}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setDeleteTarget(null);
            setDeleteError(null);
          }}
          loading={deletingId === deleteTarget.id}
        />
      )}
    </div>
  );
}
