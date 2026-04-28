"use client";

import { useState } from "react";
import { useGastos } from "@/hooks/useFirebaseData";
import { formatBRL } from "@/lib/utils";
import { Plus, Receipt, Pencil, Trash2, AlertCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { doc, deleteDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useQueryClient } from "@tanstack/react-query";

// ─── types ────────────────────────────────────────────────────────────────────

interface Gasto {
  id: string;
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
  mesKey: string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Agrupa os gastos por mesKey (ex: "2024-05") em ordem decrescente. */
function groupByMonth(gastos: Gasto[]): Array<{ mesKey: string; label: string; items: Gasto[]; total: number }> {
  const map = new Map<string, Gasto[]>();

  for (const g of gastos) {
    const key = g.mesKey ?? g.data?.substring(0, 7) ?? "—";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(g);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([mesKey, items]) => {
      const [year, month] = mesKey.split("-");
      const label = new Date(Number(year), Number(month) - 1).toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      });
      const total = items.reduce((acc, g) => acc + (g.valor ?? 0), 0);
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onCancel}
        aria-hidden
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm bg-[linear-gradient(145deg,rgba(30,30,30,0.98),rgba(20,20,20,0.98))] border border-white/10 rounded-2xl p-6 shadow-[0_32px_64px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center">
            <AlertTriangle size={26} className="text-danger" />
          </div>

          <div>
            <h2 id="modal-title" className="font-display font-bold text-xl text-text-primary">
              Excluir gasto?
            </h2>
            <p className="text-text-muted text-sm mt-1">
              <span className="font-semibold text-text-secondary">"{descricao}"</span> será removido permanentemente.
            </p>
          </div>

          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-text-primary font-bold transition-all duration-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-danger/90 hover:bg-danger text-white font-bold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Excluindo...
                </>
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

// ─── gasto card ───────────────────────────────────────────────────────────────

interface GastoCardProps {
  gasto: Gasto;
  onDelete: (gasto: Gasto) => void;
  deletingId: string | null;
}

function GastoCard({ gasto, onDelete, deletingId }: GastoCardProps) {
  const isDeleting = deletingId === gasto.id;

  return (
    <div
      className={`group flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        isDeleting ? "opacity-40 pointer-events-none" : ""
      }`}
    >
      {/* Info */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-black/20 border border-white/5 flex items-center justify-center text-text-muted group-hover:text-brand-orange transition-colors duration-300 shadow-inner shrink-0">
          <Receipt size={22} />
        </div>
        <div>
          <div className="font-display font-bold text-lg text-text-primary tracking-tight group-hover:text-white transition-colors">
            {gasto.descricao}
          </div>
          <div className="font-display text-sm text-text-muted mt-0.5 flex items-center gap-2">
            <span>{formatDate(gasto.data)}</span>
            <span className="w-1 h-1 rounded-full bg-text-disabled" aria-hidden />
            <span className="uppercase tracking-wider text-[11px] font-bold text-text-disabled group-hover:text-text-secondary transition-colors">
              {gasto.categoria}
            </span>
          </div>
        </div>
      </div>

      {/* Value + actions */}
      <div className="text-left sm:text-right mt-4 sm:mt-0 px-2 sm:px-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3">
        <div className="font-mono font-bold text-xl text-danger drop-shadow-[0_0_10px_rgba(248,113,113,0.2)] group-hover:drop-shadow-[0_0_15px_rgba(248,113,113,0.4)] transition-all">
          -{formatBRL(gasto.valor ?? 0)}
        </div>

        {/* Actions — always visible on mobile, hover on desktop */}
        <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
          <Link
            href={`/gastos/novo?id=${gasto.id}`}
            aria-label={`Editar ${gasto.descricao}`}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-all"
          >
            <Pencil size={16} />
          </Link>
          <button
            onClick={() => onDelete(gasto)}
            aria-label={`Excluir ${gasto.descricao}`}
            className="p-2 rounded-lg bg-white/5 hover:bg-danger/20 text-text-muted hover:text-danger transition-all"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function GastosPage() {
  const { data: gastos, isLoading, isError } = useGastos();
  const queryClient = useQueryClient();

  const [deleteTarget, setDeleteTarget] = useState<Gasto | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !auth.currentUser) return;

    setDeletingId(deleteTarget.id);
    setDeleteError(null);
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/gastos`, deleteTarget.id));
      await queryClient.invalidateQueries({ queryKey: ["gastos"] });
      setDeleteTarget(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Tente novamente.";
      console.error("Erro ao excluir gasto:", err);
      setDeleteError(`Não foi possível excluir: ${message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // ── loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" aria-label="Carregando gastos">
        <div className="animate-spin w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full shadow-[0_0_15px_var(--orange-dim)]" />
      </div>
    );
  }

  // ── error ──────────────────────────────────────────────────────────────────

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-text-muted">
        <AlertCircle size={36} className="text-danger opacity-60" />
        <p className="font-display text-lg">Erro ao carregar gastos.</p>
        <p className="text-sm text-text-disabled">Verifique sua conexão e tente novamente.</p>
      </div>
    );
  }

  const groups = groupByMonth((gastos as Gasto[]) ?? []);

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="animate-in fade-in duration-500">
        {/* Header */}
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="font-display font-bold text-3xl text-text-primary tracking-tight drop-shadow-md">
              Gastos
            </h1>
            <p className="text-text-muted mt-1">Acompanhe suas despesas mensais.</p>
          </div>
          <Link
            href="/gastos/novo"
            className="hidden md:flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-orange/50 text-text-primary px-5 py-2.5 rounded-xl font-bold transition-all duration-300 hover:-translate-y-0.5 shadow-lg backdrop-blur-md"
          >
            <Plus size={20} className="text-brand-orange" />
            Novo Gasto
          </Link>
        </header>

        {/* Delete error banner */}
        {deleteError && (
          <div
            role="alert"
            className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" aria-hidden />
            <p className="text-sm text-red-300">{deleteError}</p>
          </div>
        )}

        {/* Content */}
        <div className="bg-[linear-gradient(145deg,rgba(255,255,255,0.02)_0%,transparent_100%)] backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">

          {/* Empty state */}
          {groups.length === 0 ? (
            <div className="text-center py-20 text-text-muted flex flex-col items-center gap-4 opacity-50">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                <Receipt size={32} strokeWidth={1} />
              </div>
              <p className="font-display">Nenhum gasto registrado.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {groups.map(({ mesKey, label, items, total }) => (
                <section key={mesKey} aria-labelledby={`mes-${mesKey}`}>
                  {/* Month header */}
                  <div className="flex items-center justify-between mb-4">
                    <h2
                      id={`mes-${mesKey}`}
                      className="text-xs font-display font-bold text-text-disabled uppercase tracking-widest"
                    >
                      {label}
                    </h2>
                    <span className="font-mono text-sm font-bold text-danger opacity-70">
                      -{formatBRL(total)}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="space-y-3">
                    {items.map((gasto) => (
                      <GastoCard
                        key={gasto.id}
                        gasto={gasto}
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
      </div>

      {/* FAB Mobile */}
      <Link
        href="/gastos/novo"
        aria-label="Novo gasto"
        className="md:hidden fixed bottom-24 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-brand-orange to-amber-500 text-white flex items-center justify-center shadow-[0_8px_24px_rgba(229,89,29,0.4),inset_0_2px_4px_rgba(255,255,255,0.3)] active:scale-90 transition-all z-50"
      >
        <Plus size={28} />
      </Link>

      {/* Confirmation modal */}
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
    </>
  );
}