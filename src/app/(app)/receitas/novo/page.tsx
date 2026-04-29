"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { TrendingUp, ArrowLeft, AlertCircle, Pencil, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { maskCurrency, parseCurrency } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useGetDoc } from "@/hooks/useFirebaseData";
import { ReceitaCategoria } from "@/types/receita";

// ─── constants ────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split("T")[0];

const CATEGORIAS: ReceitaCategoria[] = [
  "Salário",
  "Freelance",
  "Dividendos",
  "Aluguel",
  "Venda",
  "Outros",
];

// ─── types ────────────────────────────────────────────────────────────────────

interface ReceitaDoc {
  descricao: string;
  valor: number;
  categoria: ReceitaCategoria;
  data: string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function isReceitaDoc(value: unknown): value is ReceitaDoc {
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
    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-red-400 mt-2 px-1 animate-in fade-in slide-in-from-top-1 duration-200">
      <AlertCircle size={12} aria-hidden />
      {message}
    </p>
  );
}

// ─── inner form (uses useSearchParams — must be inside Suspense) ───────────────

function NovoReceitaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const editId = searchParams.get("id");
  const isEditMode = Boolean(editId);

  const { data: editData, isLoading: loadingEdit } = useGetDoc("receitas", editId);

  // ── form state ──────────────────────────────────────────────────────────────

  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [descricao, setDescricao] = useState("");
  const [descricaoError, setDescricaoError] = useState<string | null>(null);

  const [valor, setValor] = useState("");
  const [valorError, setValorError] = useState<string | null>(null);

  const [categoria, setCategoria] = useState<ReceitaCategoria>(CATEGORIAS[0]);
  const [data, setData] = useState(TODAY);

  // ── populate on edit ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!editData) return;

    if (!isReceitaDoc(editData)) {
      console.warn("Formato inesperado do documento de receita:", editData);
      return;
    }

    setDescricao(editData.descricao);
    setValor(
      maskCurrency(
        editData.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
      )
    );
    setCategoria(
      CATEGORIAS.includes(editData.categoria)
        ? editData.categoria
        : CATEGORIAS[0]
    );
    setData(editData.data?.split("T")[0] ?? TODAY);
  }, [editData]);

  // ── validation ──────────────────────────────────────────────────────────────

  function validateDescricao(v: string): boolean {
    if (!v.trim()) {
      setDescricaoError("Informe uma descrição");
      return false;
    }
    if (v.trim().length < 3) {
      setDescricaoError("Mínimo de 3 caracteres");
      return false;
    }
    setDescricaoError(null);
    return true;
  }

  function validateValor(v: string): boolean {
    if (!v || parseCurrency(v) <= 0) {
      setValorError("Informe um valor positivo");
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
          doc(db, `users/${auth.currentUser.uid}/receitas`, editId),
          payload
        );
      } else {
        await addDoc(collection(db, `users/${auth.currentUser.uid}/receitas`), {
          ...payload,
          criadoEm: new Date().toISOString(),
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["receitas"] });
      router.push("/receitas");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro desconhecido. Tente novamente.";
      console.error("Erro ao salvar receita:", err);
      setGlobalError(`Falha na operação: ${message}`);
      setLoading(false);
    }
  };

  // ── loading skeleton ────────────────────────────────────────────────────────

  if (loadingEdit) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4" aria-label="Carregando">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center justify-center animate-pulse">
           <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin shadow-[0_0_20px_rgba(16,185,129,0.1)]" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Preparando Entrada</span>
      </div>
    );
  }

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="animate-in fade-in zoom-in-95 duration-700 max-w-xl mx-auto pb-12">

      {/* Header */}
      <header className="mb-10 flex items-center gap-5 px-2">
        <Link
          href="/receitas"
          aria-label="Voltar"
          className="group w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 flex items-center justify-center text-white/40 hover:text-white transition-all duration-300 shadow-xl backdrop-blur-md"
        >
          <ArrowLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white/95 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.1)]">
              {isEditMode ? <Pencil className="text-emerald-400" size={20} /> : <TrendingUp className="text-emerald-400" size={22} />}
            </div>
            {isEditMode ? "Editar Receita" : "Nova Receita"}
          </h1>
          <p className="text-sm font-medium text-white/40 mt-1.5 ml-1">
            {isEditMode ? "Atualize os detalhes da entrada financeira." : "Registre um novo ganho no seu fluxo de caixa."}
          </p>
        </div>
      </header>

      {/* Form card */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="relative bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 lg:p-10 shadow-2xl space-y-8 overflow-hidden"
      >
        <div className="space-y-8 relative z-10">

          {/* Descrição */}
          <div className="group">
            <label
              htmlFor="descricao"
              className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] px-1 mb-3 block"
            >
              Qual a origem da receita?
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
              placeholder="Ex: Salário, Projeto Freelance"
              aria-describedby={descricaoError ? "descricao-error" : undefined}
              aria-invalid={!!descricaoError}
              className={`w-full bg-white/[0.02] border rounded-2xl px-6 py-5 text-white font-medium text-lg tracking-tight focus:outline-none focus:bg-white/[0.04] transition-all duration-300 placeholder:text-white/10 ${
                descricaoError
                  ? "border-red-500/30 focus:border-red-500/50"
                  : "border-white/5 focus:border-white/20"
              }`}
            />
            {descricaoError && <FieldError message={descricaoError} />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Valor */}
            <div className="group">
              <label
                htmlFor="valor"
                className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] px-1 mb-3 block"
              >
                Qual o valor recebido?
              </label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-400/40 font-mono font-bold text-xl select-none">
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
                  className={`w-full bg-white/[0.02] border rounded-2xl pl-16 pr-6 py-5 text-emerald-400 font-mono text-2xl tracking-tight focus:outline-none focus:bg-white/[0.04] transition-all duration-300 placeholder:text-emerald-400/10 ${
                    valorError
                      ? "border-red-500/30 focus:border-red-500/50"
                      : "border-white/5 focus:border-white/20"
                  }`}
                />
              </div>
              {valorError && <FieldError message={valorError} />}
            </div>

            {/* Categoria */}
            <div className="group">
              <label
                htmlFor="categoria"
                className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] px-1 mb-3 block"
              >
                Categoria
              </label>
              <div className="relative">
                <select
                  id="categoria"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as ReceitaCategoria)}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-white font-medium text-lg tracking-tight focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all duration-300 appearance-none cursor-pointer"
                >
                  {CATEGORIAS.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#0a0a0a] text-white">
                      {cat}
                    </option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                   <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                   </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Data */}
          <div className="group">
            <label
              htmlFor="data-receita"
              className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] px-1 mb-3 block"
            >
              Data do Recebimento
            </label>
            <input
              id="data-receita"
              type="date"
              required
              max={TODAY}
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-white font-mono text-lg tracking-tight focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all duration-300 [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Feedback & Submit */}
        <div className="space-y-6 pt-2 relative z-10">
          {globalError && (
            <div
              role="alert"
              className="flex items-start gap-4 bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg"
            >
              <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0">
                <AlertCircle size={18} className="text-red-400" />
              </div>
              <p className="text-sm font-medium text-red-300/80 leading-relaxed pt-1.5">{globalError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isFormReady}
            className="w-full relative group/btn overflow-hidden rounded-2xl py-5 transition-all duration-500 disabled:opacity-20 disabled:cursor-not-allowed active:scale-[0.98] shadow-xl"
          >
            <div className={`absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-500 transition-opacity duration-500 ${isFormReady ? "opacity-100" : "opacity-40"}`} />
            <div className="absolute inset-0 bg-emerald-400 opacity-0 group-hover/btn:opacity-20 transition-opacity blur-xl" />
            
            <span className="relative z-10 flex items-center justify-center gap-3 text-white font-bold text-lg tracking-wide">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                  Sincronizando...
                </>
              ) : isEditMode ? (
                "Salvar Alterações"
              ) : (
                <>
                  Confirmar Entrada
                  <CheckCircle2 size={20} className="group-hover/btn:scale-110 transition-transform" />
                </>
              )}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── page (Suspense obrigatório por causa do useSearchParams) ─────────────────

export default function NovoReceitaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center justify-center animate-pulse">
             <div className="w-8 h-8 border-4 border-white/10 border-t-white/30 rounded-full animate-spin" />
          </div>
        </div>
      }
    >
      <NovoReceitaForm />
    </Suspense>
  );
}
