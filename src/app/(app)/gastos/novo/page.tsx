"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { ArrowRightLeft, ArrowLeft, AlertCircle, Pencil } from "lucide-react";
import Link from "next/link";
import { maskCurrency, parseCurrency } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useGetDoc } from "@/hooks/useFirebaseData";

// ─── constants ────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split("T")[0];

const CATEGORIAS = [
  "Moradia",
  "Alimentação",
  "Transporte",
  "Saúde",
  "Educação",
  "Lazer",
  "Outros",
] as const;

type Categoria = (typeof CATEGORIAS)[number];

// ─── types ────────────────────────────────────────────────────────────────────

interface GastoDoc {
  descricao: string;
  valor: number;
  categoria: Categoria;
  data: string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function isGastoDoc(value: unknown): value is GastoDoc {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.descricao === "string" &&
    typeof v.valor === "number" &&
    typeof v.categoria === "string" &&
    typeof v.data === "string"
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────

interface FieldErrorProps {
  message: string;
}

function FieldError({ message }: FieldErrorProps) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1.5 px-1 animate-in fade-in slide-in-from-top-1 duration-200">
      <AlertCircle size={12} aria-hidden />
      {message}
    </p>
  );
}

// ─── inner form (uses useSearchParams — must be inside Suspense) ───────────────

function NovoGastoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const editId = searchParams.get("id");
  const isEditMode = Boolean(editId);

  const { data: editData, isLoading: loadingEdit } = useGetDoc("gastos", editId);

  // ── form state ──────────────────────────────────────────────────────────────

  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [descricao, setDescricao] = useState("");
  const [descricaoError, setDescricaoError] = useState<string | null>(null);

  const [valor, setValor] = useState("");
  const [valorError, setValorError] = useState<string | null>(null);

  const [categoria, setCategoria] = useState<Categoria>(CATEGORIAS[0]);
  const [data, setData] = useState(TODAY);

  // ── populate on edit ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!editData) return;

    if (!isGastoDoc(editData)) {
      console.warn("Formato inesperado do documento de gasto:", editData);
      return;
    }

    setDescricao(editData.descricao);
    setValor(
      maskCurrency(
        editData.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
      )
    );
    setCategoria(
      CATEGORIAS.includes(editData.categoria as Categoria)
        ? (editData.categoria as Categoria)
        : CATEGORIAS[0]
    );
    setData(editData.data?.split("T")[0] ?? TODAY);
  }, [editData]);

  // ── validation ──────────────────────────────────────────────────────────────

  function validateDescricao(v: string): boolean {
    if (!v.trim()) {
      setDescricaoError("Informe uma descrição para o gasto.");
      return false;
    }
    if (v.trim().length < 3) {
      setDescricaoError("A descrição deve ter pelo menos 3 caracteres.");
      return false;
    }
    setDescricaoError(null);
    return true;
  }

  function validateValor(v: string): boolean {
    if (!v || parseCurrency(v) <= 0) {
      setValorError("Informe um valor maior que R$ 0,00.");
      return false;
    }
    setValorError(null);
    return true;
  }

  const isFormReady =
    descricao.trim().length >= 3 &&
    parseCurrency(valor) > 0 &&
    !descricaoError &&
    !valorError;

  // ── submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGlobalError(null);

    const descricaoOk = validateDescricao(descricao);
    const valorOk = validateValor(valor);
    if (!descricaoOk || !valorOk) return;

    if (!auth.currentUser) {
      setGlobalError("Sessão expirada. Faça login novamente.");
      return;
    }

    setLoading(true);
    try {
      const mesKey = data.substring(0, 7);
      const payload = {
        descricao: descricao.trim(),
        valor: parseCurrency(valor),
        categoria,
        data: `${data}T12:00:00Z`,
        mesKey,
        editadoEm: new Date().toISOString(),
      };

      if (editId) {
        await updateDoc(
          doc(db, `users/${auth.currentUser.uid}/gastos`, editId),
          payload
        );
      } else {
        await addDoc(collection(db, `users/${auth.currentUser.uid}/gastos`), {
          ...payload,
          criadoEm: new Date().toISOString(),
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["gastos"] });
      router.push("/gastos");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro desconhecido. Tente novamente.";
      console.error("Erro ao salvar gasto:", err);
      setGlobalError(`Não foi possível salvar: ${message}`);
      setLoading(false);
    }
  };

  // ── loading skeleton ────────────────────────────────────────────────────────

  if (loadingEdit) {
    return (
      <div className="flex items-center justify-center h-64" aria-label="Carregando dados do gasto">
        <div className="animate-spin w-8 h-8 border-4 border-danger border-t-transparent rounded-full shadow-[0_0_15px_rgba(248,113,113,0.3)]" />
      </div>
    );
  }

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="animate-in fade-in duration-500 max-w-2xl mx-auto">

      {/* Header */}
      <header className="mb-8 flex items-center gap-4">
        <Link
          href="/gastos"
          aria-label="Voltar para gastos"
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5 flex items-center justify-center text-text-muted hover:text-text-primary transition-all duration-300 shadow-sm backdrop-blur-md"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display font-bold text-3xl text-text-primary flex items-center gap-3 drop-shadow-md tracking-tight">
            {isEditMode ? (
              <Pencil
                className="text-danger drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]"
                size={26}
              />
            ) : (
              <ArrowRightLeft
                className="text-danger drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]"
                size={28}
              />
            )}
            {isEditMode ? "Editar Gasto" : "Registrar Gasto"}
          </h1>
          <p className="text-text-muted mt-1">
            {isEditMode
              ? "Atualize os dados da despesa registrada."
              : "Adicione uma despesa para manter o controle."}
          </p>
        </div>
      </header>

      {/* Form card */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-[linear-gradient(145deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.01)_100%)] backdrop-blur-2xl border border-white/5 rounded-2xl p-6 md:p-8 shadow-[0_32px_64px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] space-y-6 relative overflow-hidden"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Descrição */}
          <div className="md:col-span-2">
            <label
              htmlFor="descricao"
              className="text-xs font-display font-bold text-text-secondary uppercase tracking-wider px-1 mb-2 block"
            >
              Descrição
            </label>
            <input
              id="descricao"
              type="text"
              required
              maxLength={120}
              autoComplete="off"
              value={descricao}
              onChange={(e) => {
                setDescricao(e.target.value);
                if (descricaoError) validateDescricao(e.target.value);
              }}
              onBlur={() => validateDescricao(descricao)}
              placeholder="Ex: Conta de Luz, Supermercado"
              aria-describedby={descricaoError ? "descricao-error" : undefined}
              aria-invalid={!!descricaoError}
              className={`w-full bg-black/20 border shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] rounded-xl px-4 py-4 text-text-primary font-display text-lg focus:outline-none focus:bg-black/30 hover:border-white/20 transition-all duration-300 placeholder:text-text-disabled ${
                descricaoError
                  ? "border-red-500/60 focus:border-red-500 focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_0_0_3px_rgba(239,68,68,0.2)]"
                  : "border-white/10 focus:border-brand-orange focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_0_0_3px_rgba(229,89,29,0.2)]"
              }`}
            />
            {descricaoError && <FieldError message={descricaoError} />}
          </div>

          {/* Valor */}
          <div>
            <label
              htmlFor="valor"
              className="text-xs font-display font-bold text-text-secondary uppercase tracking-wider px-1 mb-2 block"
            >
              Valor Total
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-danger font-bold text-lg drop-shadow-sm select-none">
                R$
              </span>
              <input
                id="valor"
                type="text"
                inputMode="decimal"
                required
                value={valor}
                onChange={(e) => {
                  const v = maskCurrency(e.target.value);
                  setValor(v);
                  if (valorError) validateValor(v);
                }}
                onBlur={() => validateValor(valor)}
                placeholder="0,00"
                aria-describedby={valorError ? "valor-error" : undefined}
                aria-invalid={!!valorError}
                className={`w-full bg-black/20 border shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] rounded-xl pl-12 pr-4 py-4 text-danger font-mono font-bold text-xl focus:outline-none focus:bg-black/30 hover:border-white/20 transition-all duration-300 placeholder:text-danger/30 ${
                  valorError
                    ? "border-red-500/60 focus:border-red-500 focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_0_0_3px_rgba(239,68,68,0.2)]"
                    : "border-white/10 focus:border-danger focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_0_0_3px_rgba(248,113,113,0.2)]"
                }`}
              />
            </div>
            {valorError && <FieldError message={valorError} />}
          </div>

          {/* Categoria */}
          <div>
            <label
              htmlFor="categoria"
              className="text-xs font-display font-bold text-text-secondary uppercase tracking-wider px-1 mb-2 block"
            >
              Categoria
            </label>
            <select
              id="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as Categoria)}
              className="w-full bg-black/20 border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] rounded-xl px-4 py-4 text-text-primary font-display text-lg focus:outline-none focus:border-brand-orange focus:bg-black/30 focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_0_0_3px_rgba(229,89,29,0.2)] hover:border-white/20 transition-all duration-300 appearance-none cursor-pointer"
            >
              {CATEGORIAS.map((cat) => (
                <option key={cat} value={cat} className="bg-bg-panel text-text-primary">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Data */}
          <div className="md:col-span-2">
            <label
              htmlFor="data-gasto"
              className="text-xs font-display font-bold text-text-secondary uppercase tracking-wider px-1 mb-2 block"
            >
              Data do Gasto
            </label>
            <input
              id="data-gasto"
              type="date"
              required
              max={TODAY}
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full bg-black/20 border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] rounded-xl px-4 py-4 text-text-primary font-mono text-lg focus:outline-none focus:border-brand-orange focus:bg-black/30 focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_0_0_3px_rgba(229,89,29,0.2)] hover:border-white/20 transition-all duration-300 [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Global error */}
        {globalError && (
          <div
            role="alert"
            className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" aria-hidden />
            <p className="text-sm text-red-300">{globalError}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !isFormReady}
          className="w-full mt-4 bg-[linear-gradient(135deg,var(--danger),#ef4444)] shadow-[0_4px_16px_rgba(248,113,113,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_6px_24px_rgba(248,113,113,0.4),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-1 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:active:scale-100 text-white font-bold py-4 rounded-xl transition-all duration-300 text-lg tracking-wide"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Salvando...
            </span>
          ) : isEditMode ? (
            "Salvar Alterações"
          ) : (
            "Registrar Despesa"
          )}
        </button>
      </form>
    </div>
  );
}

// ─── page (Suspense obrigatório por causa do useSearchParams) ─────────────────

export default function NovoGastoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64" aria-label="Carregando">
          <div className="animate-spin w-8 h-8 border-4 border-danger border-t-transparent rounded-full shadow-[0_0_15px_rgba(248,113,113,0.3)]" />
        </div>
      }
    >
      <NovoGastoForm />
    </Suspense>
  );
}