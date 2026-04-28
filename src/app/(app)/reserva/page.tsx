"use client";

import { useState, useRef } from "react";
import { useReserva } from "@/hooks/useFirebaseData";
import { formatBRL, maskCurrency, parseCurrency } from "@/lib/utils";
import { ShieldAlert, Plus, History, Pencil, Trash2, X, AlertTriangle, Check } from "lucide-react";
import { doc, getDoc, addDoc, updateDoc, deleteDoc, collection } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ReservaItem {
  id: string;
  valor: number;
  data: string;
  descricao: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Erro inesperado. Tente novamente.";
}

/**
 * Evita o bug de timezone do ISO UTC:
 * new Date("2024-01-15") em UTC-3 retorna dia 14.
 * Fazemos o parse manual para exibir a data correta.
 */
function formatDate(iso: string): string {
  const [year, month, day] = iso.split("T")[0].split("-");
  return `${day}/${month}/${year}`;
}

// ─── Modal de confirmação de exclusão ────────────────────────────────────────

interface ConfirmDeleteModalProps {
  descricao: string;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDeleteModal({ descricao, deleting, onConfirm, onCancel }: ConfirmDeleteModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      <div className="relative bg-[linear-gradient(145deg,rgba(30,15,5,0.98)_0%,rgba(15,8,2,0.98)_100%)] border border-white/10 rounded-2xl p-7 max-w-sm w-full shadow-[0_32px_64px_rgba(0,0,0,0.5)] z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center">
            <Trash2 size={18} className="text-danger" />
          </div>
          <h2 id="confirm-delete-title" className="font-display font-bold text-text-primary text-lg">
            Remover aporte?
          </h2>
        </div>

        <p className="text-text-muted text-sm mb-6">
          O aporte <span className="text-text-primary font-semibold">"{descricao}"</span> será removido da sua reserva de emergência. Essa ação não pode ser desfeita.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 py-3 rounded-xl border border-white/10 text-text-muted hover:text-text-primary hover:border-white/20 hover:bg-white/5 transition-all font-semibold text-sm disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-3 rounded-xl bg-danger/20 border border-danger/30 text-danger hover:bg-danger/30 hover:border-danger/50 transition-all font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting ? (
              <>
                <span
                  className="w-4 h-4 border-2 border-danger border-t-transparent rounded-full animate-spin"
                  aria-hidden="true"
                />
                Removendo...
              </>
            ) : (
              "Remover"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function ReservaPage() {
  const { data: historico, isLoading, isError } = useReserva();
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);

  const [meta, setMeta] = useState(15000);
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaInput, setMetaInput] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);
  const metaInputRef = useRef<HTMLInputElement>(null);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [valorAdd, setValorAdd] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  // Erros separados por escopo
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Controle do modal de exclusão
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Tipagem do historico
  const items = (historico as ReservaItem[] | undefined) ?? [];

  const totalReserva = items.reduce((acc, cur) => acc + (cur.valor || 0), 0);
  const porcentagem = Math.min((totalReserva / meta) * 100, 100);
  const isReservaCompleta = porcentagem >= 100;

  // Validação do formulário
  const parsedValor = parseCurrency(valorAdd);
  const isFormReady = valorAdd.trim().length > 0 && parsedValor > 0;

  useEffect(() => {
    const fetchMeta = async () => {
      if (!auth.currentUser) return;
      const d = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (d.exists() && d.data().reservaEmergenciaAlvo) {
        setMeta(d.data().reservaEmergenciaAlvo);
      }
    };
    fetchMeta();
  }, []);

  // ── Meta handlers ──────────────────────────────────────────────────────────

  const handleStartEditMeta = () => {
    const valorFormatado = meta.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    setMetaInput(maskCurrency(valorFormatado));
    setMetaError(null);
    setEditingMeta(true);
    // Foca o input no próximo tick, após o render
    setTimeout(() => metaInputRef.current?.focus(), 0);
  };

  const handleCancelEditMeta = () => {
    setEditingMeta(false);
    setMetaError(null);
  };

  const handleSaveMeta = async () => {
    if (!auth.currentUser) return;
    const novaMeta = parseCurrency(metaInput);
    if (novaMeta <= 0) {
      setMetaError("Informe um valor maior que R$ 0,00.");
      return;
    }
    setSavingMeta(true);
    setMetaError(null);
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        reservaEmergenciaAlvo: novaMeta,
      });
      setMeta(novaMeta);
      setEditingMeta(false);
    } catch (err) {
      setMetaError(errorMessage(err));
    } finally {
      setSavingMeta(false);
    }
  };

  // ── Form handlers ──────────────────────────────────────────────────────────

  const resetForm = () => {
    setValorAdd("");
    setEditId(null);
    setFormError(null);
  };

  const handleAddReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!auth.currentUser) return;
    if (!isFormReady) {
      setFormError("Informe um valor válido maior que R$ 0,00.");
      return;
    }

    setLoadingAdd(true);
    try {
      if (editId) {
        await updateDoc(doc(db, `users/${auth.currentUser.uid}/reserva`, editId), {
          valor: parsedValor,
        });
      } else {
        await addDoc(collection(db, `users/${auth.currentUser.uid}/reserva`), {
          valor: parsedValor,
          data: new Date().toISOString(),
          descricao: "Aporte na Reserva",
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["reserva"] });
      resetForm();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleEditClick = (item: ReservaItem) => {
    setEditId(item.id);
    const valorFormatado = (item.valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    setValorAdd(maskCurrency(valorFormatado));
    setFormError(null);
    // Scroll acessível via ref, sem acessar window diretamente
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCancelEdit = () => resetForm();

  const handleDeleteConfirm = async () => {
    if (!auth.currentUser || !pendingDeleteId) return;
    setDeleteError(null);
    setDeletingId(pendingDeleteId);
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/reserva`, pendingDeleteId));
      await queryClient.invalidateQueries({ queryKey: ["reserva"] });
      setPendingDeleteId(null);
    } catch (err) {
      setDeleteError(errorMessage(err));
      setPendingDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="Carregando reserva de emergência">
        <div
          className="animate-spin w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full shadow-[0_0_15px_rgba(229,89,29,0.3)]"
          aria-hidden="true"
        />
      </div>
    );
  }

  // ── Erro de query ─────────────────────────────────────────────────────────

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <AlertTriangle size={36} className="text-danger opacity-60" aria-hidden="true" />
        <p className="text-text-muted text-sm max-w-xs">
          Não foi possível carregar a reserva de emergência. Verifique sua conexão e tente novamente.
        </p>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ["reserva"] })}
          className="text-brand-orange hover:underline text-sm font-semibold"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // ── Dados do item sendo deletado (para exibir no modal) ──────────────────
  const pendingDeleteItem = items.find((i) => i.id === pendingDeleteId);

  return (
    <>
      {/* Modal de confirmação de exclusão */}
      {pendingDeleteId && pendingDeleteItem && (
        <ConfirmDeleteModal
          descricao={pendingDeleteItem.descricao}
          deleting={!!deletingId}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}

      <div className="animate-in fade-in duration-500">
        <header className="mb-10">
          <h1 className="font-display font-bold text-3xl text-text-primary flex items-center gap-3 tracking-tight drop-shadow-md">
            <ShieldAlert
              className="text-brand-orange"
              style={{ filter: "drop-shadow(0 0 8px rgba(229,89,29,0.5))" }}
              size={32}
              aria-hidden="true"
            />
            Reserva de Emergência
          </h1>
          <p className="text-text-muted mt-2">Sua base de segurança financeira para imprevistos.</p>
        </header>

        {/* Erro de exclusão */}
        {deleteError && (
          <div role="alert" className="mb-6 flex items-center gap-3 px-5 py-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm">
            <AlertTriangle size={16} aria-hidden="true" />
            {deleteError}
            <button
              onClick={() => setDeleteError(null)}
              className="ml-auto text-danger/60 hover:text-danger transition-colors"
              aria-label="Fechar erro"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Painel Principal */}
          <div className="lg:col-span-2 space-y-6">

            {/* Card de Saldo e Meta */}
            <div className="bg-[linear-gradient(145deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.01)_100%)] backdrop-blur-2xl border border-white/5 rounded-2xl p-7 shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all hover:border-white/10">
              <div className="flex justify-between items-end mb-6 relative z-10">
                <div>
                  <div className="text-text-disabled font-display text-[10px] uppercase tracking-widest mb-1 font-bold">
                    Saldo Protegido
                  </div>
                  <div className="font-mono font-bold text-4xl text-text-primary tracking-tighter drop-shadow-sm">
                    {formatBRL(totalReserva)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-text-disabled font-display text-[10px] uppercase tracking-widest mb-1 font-bold flex items-center justify-end gap-1.5">
                    Meta atual
                    {!editingMeta && (
                      <button
                        onClick={handleStartEditMeta}
                        className="text-text-disabled hover:text-brand-orange transition-colors"
                        aria-label="Editar meta da reserva"
                      >
                        <Pencil size={10} aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  {editingMeta ? (
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-text-disabled font-bold text-sm" aria-hidden="true">R$</span>
                        <input
                          ref={metaInputRef}
                          id="meta-input"
                          type="text"
                          inputMode="decimal"
                          value={metaInput}
                          onChange={(e) => {
                            setMetaInput(maskCurrency(e.target.value));
                            setMetaError(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveMeta();
                            if (e.key === "Escape") handleCancelEditMeta();
                          }}
                          aria-label="Nova meta da reserva de emergência"
                          aria-invalid={!!metaError}
                          className="w-32 bg-black/30 border border-brand-orange/50 focus:border-brand-orange rounded-lg px-2 py-1 text-right font-mono text-base text-text-primary focus:outline-none transition-all"
                        />
                        <button
                          onClick={handleSaveMeta}
                          disabled={savingMeta}
                          className="w-7 h-7 rounded-lg bg-brand-orange/20 hover:bg-brand-orange/40 border border-brand-orange/30 text-brand-orange flex items-center justify-center transition-all disabled:opacity-50"
                          aria-label="Confirmar nova meta"
                        >
                          {savingMeta ? (
                            <span className="w-3 h-3 border border-brand-orange border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                          ) : (
                            <Check size={13} aria-hidden="true" />
                          )}
                        </button>
                        <button
                          onClick={handleCancelEditMeta}
                          disabled={savingMeta}
                          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-text-muted flex items-center justify-center transition-all disabled:opacity-50"
                          aria-label="Cancelar edição da meta"
                        >
                          <X size={13} aria-hidden="true" />
                        </button>
                      </div>
                      {metaError && (
                        <p role="alert" className="text-danger text-[10px] font-semibold">
                          {metaError}
                        </p>
                      )}
                      <p className="text-text-disabled text-[10px]">Enter para salvar · Esc para cancelar</p>
                    </div>
                  ) : (
                    <button
                      onClick={handleStartEditMeta}
                      className="font-mono text-lg text-text-secondary opacity-80 hover:opacity-100 hover:text-brand-orange transition-all group flex items-center gap-1.5"
                      aria-label={`Meta atual: ${formatBRL(meta)}. Clique para editar.`}
                    >
                      {formatBRL(meta)}
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative z-10">
                <div
                  className="w-full bg-black/40 rounded-full h-4 mb-3 overflow-hidden border border-white/5 shadow-inner"
                  role="progressbar"
                  aria-valuenow={Math.round(porcentagem)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Reserva ${porcentagem.toFixed(1)}% concluída`}
                >
                  <div
                    className={`h-full transition-all duration-1000 ease-out relative ${
                      isReservaCompleta
                        ? "bg-[linear-gradient(90deg,var(--success),#22d3ee)]"
                        : "bg-[linear-gradient(90deg,var(--orange),var(--amber))]"
                    } shadow-[0_0_20px_rgba(229,89,29,0.3)]`}
                    style={{ width: `${porcentagem}%` }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.2),transparent)] opacity-40" />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase text-text-disabled font-bold tracking-widest">
                    Evolução
                  </span>
                  <span
                    className={`font-mono text-sm font-bold ${
                      isReservaCompleta
                        ? "text-success drop-shadow-[0_0_8px_rgba(74,222,128,0.3)]"
                        : "text-brand-orange drop-shadow-[0_0_8px_rgba(229,89,29,0.2)]"
                    }`}
                  >
                    {isReservaCompleta ? "✓ Meta atingida!" : `${porcentagem.toFixed(1)}% concluído`}
                  </span>
                </div>
              </div>
            </div>

            {/* Formulário de Aporte */}
            <form
              ref={formRef}
              onSubmit={handleAddReserva}
              noValidate
              className="bg-[linear-gradient(145deg,rgba(255,255,255,0.02)_0%,transparent_100%)] backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.1)] flex flex-col sm:flex-row gap-5 items-end transition-all hover:border-white/10 relative"
            >
              {editId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="absolute top-4 right-4 text-text-muted hover:text-white bg-black/20 p-2 rounded-full transition-colors"
                  aria-label="Cancelar edição"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              )}

              <div className="flex-1 w-full">
                <label
                  htmlFor="valor-reserva"
                  className="text-[10px] font-display font-bold text-text-disabled uppercase tracking-widest px-1 mb-2 block"
                >
                  {editId ? "Editar Valor" : "Adicionar à Reserva"}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-disabled font-bold" aria-hidden="true">
                    R$
                  </span>
                  <input
                    id="valor-reserva"
                    type="text"
                    inputMode="decimal"
                    value={valorAdd}
                    onChange={(e) => {
                      setValorAdd(maskCurrency(e.target.value));
                      setFormError(null);
                    }}
                    placeholder="0,00"
                    aria-invalid={!!formError}
                    aria-describedby={formError ? "valor-reserva-error" : undefined}
                    className={`w-full bg-black/20 border shadow-inner rounded-xl pl-12 pr-4 py-4 text-text-primary font-mono text-lg focus:outline-none transition-all placeholder:text-text-disabled ${
                      formError
                        ? "border-danger/50 focus:border-danger focus:bg-black/30"
                        : editId
                        ? "border-brand-amber focus:border-brand-orange focus:bg-black/30"
                        : "border-white/10 focus:border-brand-orange focus:bg-black/30"
                    }`}
                  />
                </div>
                {formError && (
                  <p id="valor-reserva-error" role="alert" className="text-danger text-xs mt-2 px-1">
                    {formError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loadingAdd || !isFormReady}
                className="w-full sm:w-auto bg-[linear-gradient(135deg,var(--orange),var(--amber))] shadow-[0_4px_16px_rgba(229,89,29,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_6px_24px_rgba(229,89,29,0.4),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 tracking-wide"
              >
                {loadingAdd ? (
                  <>
                    <span
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                      aria-hidden="true"
                    />
                    Salvando...
                  </>
                ) : editId ? (
                  "Atualizar"
                ) : (
                  <>
                    <Plus size={20} aria-hidden="true" />
                    Guardar
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Histórico Lateral */}
          <div className="bg-[linear-gradient(145deg,rgba(255,255,255,0.02)_0%,transparent_100%)] backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all hover:border-white/10 h-fit">
            <h2 className="font-display font-bold text-text-primary mb-6 flex items-center gap-2 tracking-tight">
              <History size={18} className="text-text-disabled" aria-hidden="true" />
              Histórico
            </h2>

            <div className="space-y-4">
              {items.map((item) => {
                const isDeleting = deletingId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`group flex justify-between items-center py-3 px-3 rounded-xl hover:bg-white/[0.03] transition-all border border-transparent hover:border-white/5 relative overflow-hidden ${
                      isDeleting ? "opacity-40 pointer-events-none" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-bold text-sm text-text-primary group-hover:text-white transition-colors truncate">
                        {item.descricao}
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5 uppercase tracking-wider font-semibold">
                        {formatDate(item.data)}
                      </div>
                    </div>

                    {/* Valor — oculto no hover em sm+ */}
                    <div className="font-mono font-bold text-success flex-shrink-0 mr-2 transition-all sm:group-hover:opacity-0 sm:group-hover:-translate-x-4 absolute right-3">
                      <span style={{ filter: "drop-shadow(0 0 8px rgba(74,222,128,0.2))" }}>
                        +{formatBRL(item.valor)}
                      </span>
                    </div>

                    {/* Ações — sempre visíveis no mobile, hover no sm+ */}
                    <div className="flex items-center gap-1 sm:opacity-0 sm:translate-x-4 sm:group-hover:opacity-100 sm:group-hover:translate-x-0 transition-all absolute right-2 bg-black/40 backdrop-blur-md p-1 rounded-lg">
                      <button
                        onClick={() => handleEditClick(item)}
                        className="p-1.5 rounded-md hover:bg-white/10 text-text-muted hover:text-white transition-all"
                        aria-label={`Editar aporte de ${formatBRL(item.valor)}`}
                      >
                        <Pencil size={14} aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => setPendingDeleteId(item.id)}
                        className="p-1.5 rounded-md hover:bg-danger/20 text-text-muted hover:text-danger transition-all"
                        aria-label={`Excluir aporte de ${formatBRL(item.valor)}`}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {items.length === 0 && (
                <div className="text-center py-12 text-sm text-text-muted flex flex-col items-center gap-3 opacity-50">
                  <History size={32} strokeWidth={1} aria-hidden="true" />
                  Nenhum valor guardado ainda.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}