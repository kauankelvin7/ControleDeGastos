"use client";

import { useRef, useState } from "react";
import { useMetas } from "@/hooks/useFirebaseData";
import { formatBRL, maskCurrency, parseCurrency } from "@/lib/utils";
import {
  Target, Plus, Flag, Calendar, X, Pencil, Trash2,
  AlertCircle, AlertTriangle,
} from "lucide-react";
import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useQueryClient } from "@tanstack/react-query";

// ─── types ────────────────────────────────────────────────────────────────────

interface Meta {
  id: string;
  titulo: string;
  valorAlvo: number;
  valorAtual: number;
  dataLimite: string | null;
  criadoEm: string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatDeadline(dateStr: string): string {
  // Append local midnight to avoid UTC timezone shift
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("pt-BR");
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Erro desconhecido. Tente novamente.";
}

// ─── delete modal ─────────────────────────────────────────────────────────────

interface ConfirmDeleteModalProps {
  titulo: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDeleteModal({ titulo, loading, onConfirm, onCancel }: ConfirmDeleteModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-delete-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onCancel} aria-hidden />
      <div className="relative z-10 w-full max-w-sm bg-[linear-gradient(145deg,rgba(30,30,30,0.98),rgba(20,20,20,0.98))] border border-white/10 rounded-2xl p-6 shadow-[0_32px_64px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center">
            <AlertTriangle size={26} className="text-danger" />
          </div>
          <div>
            <h2 id="modal-delete-title" className="font-display font-bold text-xl text-text-primary">
              Excluir meta?
            </h2>
            <p className="text-text-muted text-sm mt-1">
              <span className="font-semibold text-text-secondary">"{titulo}"</span> e todo o histórico associado serão removidos permanentemente.
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
              ) : "Excluir"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── meta card ────────────────────────────────────────────────────────────────

interface MetaCardProps {
  meta: Meta;
  onEdit: (meta: Meta) => void;
  onDelete: (meta: Meta) => void;
  aporteMetaId: string | null;
  setAporteMetaId: (id: string | null) => void;
  valorAporte: string;
  setValorAporte: (v: string) => void;
  loadingAporte: boolean;
  onAporte: (e: React.FormEvent<HTMLFormElement>, metaId: string, valorAtual: number) => void;
  aporteError: string | null;
}

function MetaCard({
  meta, onEdit, onDelete,
  aporteMetaId, setAporteMetaId, valorAporte, setValorAporte,
  loadingAporte, onAporte, aporteError,
}: MetaCardProps) {
  const porcentagem = Math.min(((meta.valorAtual ?? 0) / (meta.valorAlvo || 1)) * 100, 100);
  const isAportando = aporteMetaId === meta.id;
  const isComplete = porcentagem >= 100;

  return (
    <div className="group bg-[linear-gradient(145deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.01)_100%)] backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-white/10 transition-all duration-300 relative overflow-hidden">

      {/* Status glow bar */}
      <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b transition-opacity duration-300 opacity-70 group-hover:opacity-100 ${isComplete ? "from-emerald-400 to-emerald-600" : "from-brand-orange to-brand-amber"}`} aria-hidden />

      {/* Quick actions — always visible on mobile, hover on desktop */}
      <div className="absolute top-4 right-4 flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-all z-20">
        <button
          onClick={() => onEdit(meta)}
          aria-label={`Editar meta "${meta.titulo}"`}
          className="p-1.5 rounded-md hover:bg-white/10 text-text-muted hover:text-white transition-all bg-black/20 backdrop-blur-md"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onDelete(meta)}
          aria-label={`Excluir meta "${meta.titulo}"`}
          className="p-1.5 rounded-md hover:bg-danger/20 text-text-muted hover:text-danger transition-all bg-black/20 backdrop-blur-md"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-5 relative z-10 pr-16">
        <div>
          <h3 className="font-display font-bold text-xl text-text-primary flex items-center gap-2 tracking-tight group-hover:text-white transition-colors">
            <Flag size={18} className="text-brand-orange shrink-0" />
            {meta.titulo}
          </h3>
          {meta.dataLimite && (
            <div className="text-xs text-text-muted mt-1.5 flex items-center gap-1.5 font-medium">
              <Calendar size={13} className="opacity-70" aria-hidden />
              <span>Alvo: {formatDeadline(meta.dataLimite)}</span>
            </div>
          )}
        </div>
        <div className="text-right flex flex-col items-end gap-2 shrink-0">
          <div>
            <div className="text-text-disabled font-display text-[10px] uppercase tracking-widest mb-1 font-bold">Valor da Meta</div>
            <div className="font-mono text-xl text-text-primary drop-shadow-sm">{formatBRL(meta.valorAlvo)}</div>
          </div>
          {!isAportando && (
            <button
              onClick={() => { setAporteMetaId(meta.id); setValorAporte(""); }}
              aria-label={`Adicionar aporte à meta "${meta.titulo}"`}
              className="text-xs font-bold text-brand-orange hover:text-white bg-brand-orange/10 hover:bg-brand-orange/30 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 sm:translate-y-1 sm:group-hover:translate-y-0"
            >
              <Plus size={12} /> Guardar
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 mb-3">
        <div className="w-full bg-black/40 rounded-full h-3 border border-white/5 overflow-hidden shadow-inner">
          <div
            role="progressbar"
            aria-valuenow={Math.round(porcentagem)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${meta.titulo}: ${porcentagem.toFixed(1)}% concluído`}
            className={`h-full transition-all duration-1000 ease-out relative shadow-[0_0_15px_rgba(229,89,29,0.3)] ${isComplete ? "bg-[linear-gradient(90deg,#34d399,#10b981)]" : "bg-[linear-gradient(90deg,var(--orange),var(--amber))]"}`}
            style={{ width: `${porcentagem}%` }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.2),transparent)] opacity-50" aria-hidden />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex justify-between items-center text-sm relative z-10">
        <div className="flex items-center gap-2">
          <span className={`font-mono font-bold text-lg drop-shadow-[0_0_8px_rgba(229,89,29,0.2)] ${isComplete ? "text-emerald-400" : "text-brand-orange"}`}>
            {porcentagem.toFixed(1)}%
          </span>
          <span className="text-[10px] uppercase text-text-disabled font-bold tracking-tighter">
            {isComplete ? "concluído 🎉" : "concluído"}
          </span>
        </div>
        <span className="font-mono text-text-secondary font-medium">
          <span className="text-text-disabled text-xs mr-1 font-display uppercase tracking-wider">Guardado:</span>
          {formatBRL(meta.valorAtual ?? 0)}
        </span>
      </div>

      {/* Aporte expandable form */}
      {isAportando && (
        <form
          onSubmit={(e) => onAporte(e, meta.id, meta.valorAtual ?? 0)}
          noValidate
          className="mt-4 pt-4 border-t border-white/5 relative z-10 animate-in slide-in-from-top-4 fade-in duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-display font-bold text-text-secondary uppercase tracking-wider">Valor a guardar</span>
            <button
              type="button"
              onClick={() => setAporteMetaId(null)}
              aria-label="Cancelar aporte"
              className="text-text-muted hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {aporteError && (
            <div role="alert" className="flex items-center gap-2 text-xs text-red-400 mb-2 px-1">
              <AlertCircle size={12} aria-hidden />
              {aporteError}
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled font-bold text-xs select-none">R$</span>
              <input
                id={`aporte-${meta.id}`}
                type="text"
                inputMode="decimal"
                required
                value={valorAporte}
                onChange={(e) => setValorAporte(maskCurrency(e.target.value))}
                placeholder="0,00"
                autoFocus
                aria-label="Valor do aporte"
                className="w-full bg-black/30 border border-brand-orange/30 shadow-inner rounded-xl pl-9 pr-3 py-2.5 text-text-primary font-mono text-sm focus:outline-none focus:border-brand-orange transition-all placeholder:text-text-disabled"
              />
            </div>
            <button
              type="submit"
              disabled={loadingAporte || parseCurrency(valorAporte) <= 0}
              className="bg-[linear-gradient(135deg,var(--orange),var(--amber))] text-white font-bold px-4 py-2.5 rounded-xl text-sm hover:shadow-[0_4px_12px_rgba(229,89,29,0.3)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap flex items-center gap-1.5"
            >
              {loadingAporte ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : "Adicionar"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function MetasPage() {
  const { data: metas, isLoading, isError } = useMetas();
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLDivElement>(null);

  // ── form state ──────────────────────────────────────────────────────────────
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [valorAlvo, setValorAlvo] = useState("");
  const [dataLimite, setDataLimite] = useState("");
  const [editMetaId, setEditMetaId] = useState<string | null>(null);

  // ── aporte state ────────────────────────────────────────────────────────────
  const [aporteMetaId, setAporteMetaId] = useState<string | null>(null);
  const [valorAporte, setValorAporte] = useState("");
  const [loadingAporte, setLoadingAporte] = useState(false);
  const [aporteError, setAporteError] = useState<string | null>(null);

  // ── delete state ────────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<Meta | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isFormReady = titulo.trim().length >= 2 && parseCurrency(valorAlvo) > 0;

  // ── handlers ────────────────────────────────────────────────────────────────

  const resetForm = () => {
    setTitulo("");
    setValorAlvo("");
    setDataLimite("");
    setEditMetaId(null);
    setFormError(null);
  };

  const handleAddMeta = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth.currentUser || !isFormReady) return;

    setFormError(null);
    setLoadingAdd(true);
    try {
      const valor = parseCurrency(valorAlvo);
      const payload = { titulo: titulo.trim(), valorAlvo: valor, dataLimite: dataLimite || null };

      if (editMetaId) {
        await updateDoc(doc(db, `users/${auth.currentUser.uid}/metas`, editMetaId), payload);
      } else {
        await addDoc(collection(db, `users/${auth.currentUser.uid}/metas`), {
          ...payload,
          valorAtual: 0,
          criadoEm: new Date().toISOString(),
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["metas"] });
      resetForm();
    } catch (err: unknown) {
      console.error("Erro ao salvar meta:", err);
      setFormError(errorMessage(err));
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleEditClick = (meta: Meta) => {
    setEditMetaId(meta.id);
    setTitulo(meta.titulo);
    setValorAlvo(
      maskCurrency((meta.valorAlvo ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 }))
    );
    setDataLimite(meta.dataLimite ?? "");
    setFormError(null);
    // Scroll ao painel do formulário via ref — sem window.scrollTo imperativo
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !auth.currentUser) return;
    setDeletingId(deleteTarget.id);
    setDeleteError(null);
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/metas`, deleteTarget.id));
      await queryClient.invalidateQueries({ queryKey: ["metas"] });
      setDeleteTarget(null);
    } catch (err: unknown) {
      console.error("Erro ao excluir meta:", err);
      setDeleteError(errorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  const handleAporteMeta = async (
    e: React.FormEvent<HTMLFormElement>,
    metaId: string,
    valorAtual: number
  ) => {
    e.preventDefault();
    const valorAdicional = parseCurrency(valorAporte);
    if (!auth.currentUser || valorAdicional <= 0) return;

    setAporteError(null);
    setLoadingAporte(true);
    try {
      await updateDoc(doc(db, `users/${auth.currentUser.uid}/metas`, metaId), {
        valorAtual: valorAtual + valorAdicional,
      });
      await queryClient.invalidateQueries({ queryKey: ["metas"] });
      setAporteMetaId(null);
      setValorAporte("");
    } catch (err: unknown) {
      console.error("Erro ao realizar aporte:", err);
      setAporteError(errorMessage(err));
    } finally {
      setLoadingAporte(false);
    }
  };

  // ── loading ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" aria-label="Carregando metas">
        <div className="animate-spin w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full shadow-[0_0_15px_var(--orange-dim)]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-text-muted">
        <AlertCircle size={36} className="text-danger opacity-60" />
        <p className="font-display text-lg">Erro ao carregar metas.</p>
        <p className="text-sm text-text-disabled">Verifique sua conexão e tente novamente.</p>
      </div>
    );
  }

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="animate-in fade-in duration-500 max-w-5xl mx-auto">
        <header className="mb-10">
          <h1 className="font-display font-bold text-3xl text-text-primary flex items-center gap-3 tracking-tight drop-shadow-md">
            <Target className="text-brand-orange drop-shadow-[0_0_8px_rgba(229,89,29,0.5)]" size={32} />
            Minhas Metas
          </h1>
          <p className="text-text-muted mt-2 max-w-2xl">
            Dê um propósito para o seu dinheiro e acompanhe sua evolução para realizar seus sonhos.
          </p>
        </header>

        {/* Delete error banner */}
        {deleteError && (
          <div role="alert" className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6 animate-in fade-in duration-200">
            <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" aria-hidden />
            <p className="text-sm text-red-300">{deleteError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Meta list */}
          <div className="lg:col-span-2 space-y-5">
            {(metas as Meta[])?.map((meta) => (
              <MetaCard
                key={meta.id}
                meta={meta}
                onEdit={handleEditClick}
                onDelete={setDeleteTarget}
                aporteMetaId={aporteMetaId}
                setAporteMetaId={setAporteMetaId}
                valorAporte={valorAporte}
                setValorAporte={setValorAporte}
                loadingAporte={loadingAporte}
                onAporte={handleAporteMeta}
                aporteError={aporteError}
              />
            ))}

            {(!metas || (metas as Meta[]).length === 0) && (
              <div className="text-center py-20 bg-white/[0.02] border border-white/5 border-dashed rounded-2xl flex flex-col items-center justify-center opacity-60 hover:opacity-100 transition-opacity">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/5">
                  <Target size={32} className="text-text-disabled stroke-[1.5px]" />
                </div>
                <p className="text-text-secondary font-display font-bold mb-2">
                  Você ainda não definiu nenhuma meta.
                </p>
                <p className="text-text-muted text-sm max-w-xs mx-auto leading-relaxed">
                  Ter um objetivo claro é o primeiro passo para o sucesso financeiro. Use o formulário ao lado para começar.
                </p>
              </div>
            )}
          </div>

          {/* Form panel */}
          <div className="lg:sticky lg:top-8 h-fit" ref={formRef}>
            <div className="bg-[linear-gradient(145deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.01)_100%)] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-[0_32px_64px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] relative">

              {editMetaId && (
                <button
                  onClick={resetForm}
                  aria-label="Cancelar edição"
                  className="absolute top-6 right-6 text-text-muted hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              )}

              <h3 className="font-display font-bold text-text-primary mb-6 flex items-center gap-2 tracking-tight">
                <div className="w-8 h-8 rounded-lg bg-brand-orange/10 flex items-center justify-center" aria-hidden>
                  {editMetaId ? <Pencil size={18} className="text-brand-orange" /> : <Plus size={18} className="text-brand-orange" />}
                </div>
                {editMetaId ? "Editar Meta" : "Nova Meta"}
              </h3>

              <form onSubmit={handleAddMeta} noValidate className="space-y-5">

                {formError && (
                  <div role="alert" className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 animate-in fade-in duration-200">
                    <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" aria-hidden />
                    <p className="text-xs text-red-300">{formError}</p>
                  </div>
                )}

                {/* Título */}
                <div>
                  <label htmlFor="meta-titulo" className="text-[10px] font-display font-bold text-text-disabled uppercase tracking-widest px-1 mb-2 block">
                    Objetivo
                  </label>
                  <input
                    id="meta-titulo"
                    type="text"
                    required
                    maxLength={80}
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ex: Viagem, Carro, Casamento"
                    className="w-full bg-black/20 border border-white/10 shadow-inner rounded-xl px-4 py-3 text-text-primary font-display text-sm focus:outline-none focus:border-brand-orange focus:bg-black/30 hover:border-white/20 transition-all placeholder:text-text-disabled"
                  />
                </div>

                {/* Valor */}
                <div>
                  <label htmlFor="meta-valor" className="text-[10px] font-display font-bold text-text-disabled uppercase tracking-widest px-1 mb-2 block">
                    Valor necessário
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-disabled font-bold text-sm select-none">R$</span>
                    <input
                      id="meta-valor"
                      type="text"
                      inputMode="decimal"
                      required
                      value={valorAlvo}
                      onChange={(e) => setValorAlvo(maskCurrency(e.target.value))}
                      placeholder="0,00"
                      className="w-full bg-black/20 border border-white/10 shadow-inner rounded-xl pl-10 pr-4 py-3 text-text-primary font-mono text-sm focus:outline-none focus:border-brand-orange focus:bg-black/30 hover:border-white/20 transition-all placeholder:text-text-disabled"
                    />
                  </div>
                </div>

                {/* Data */}
                <div>
                  <label htmlFor="meta-data" className="text-[10px] font-display font-bold text-text-disabled uppercase tracking-widest px-1 mb-2 block">
                    Data Alvo <span className="normal-case tracking-normal font-normal opacity-60">(opcional)</span>
                  </label>
                  <input
                    id="meta-data"
                    type="date"
                    value={dataLimite}
                    onChange={(e) => setDataLimite(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 shadow-inner rounded-xl px-4 py-3 text-text-primary font-mono text-sm focus:outline-none focus:border-brand-orange focus:bg-black/30 hover:border-white/20 transition-all [color-scheme:dark]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingAdd || !isFormReady}
                  className="w-full bg-[linear-gradient(135deg,var(--orange),var(--amber))] shadow-[0_4px_16px_rgba(229,89,29,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_6px_24px_rgba(229,89,29,0.4),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none text-white font-bold py-4 rounded-xl transition-all duration-300 text-sm tracking-wide mt-2 flex items-center justify-center gap-2"
                >
                  {loadingAdd ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : editMetaId ? "Atualizar Meta" : "Criar Meta"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <ConfirmDeleteModal
          titulo={deleteTarget.titulo}
          loading={deletingId === deleteTarget.id}
          onConfirm={handleDeleteConfirm}
          onCancel={() => { setDeleteTarget(null); setDeleteError(null); }}
        />
      )}
    </>
  );
}