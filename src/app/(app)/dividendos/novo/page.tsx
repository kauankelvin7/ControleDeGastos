"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { HandCoins, ArrowLeft, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import Link from "next/link";
import { maskCurrency, parseCurrency } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

// ─── helpers ────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split("T")[0];

function todayLabel(dateStr: string): string {
  if (dateStr === TODAY) return "Hoje";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

// ─── sub-components ──────────────────────────────────────────────────────────

interface FieldErrorProps {
  message: string;
}

function FieldError({ message }: FieldErrorProps) {
  return (
    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-red-400 mt-2 px-1 animate-in fade-in slide-in-from-top-1 duration-200">
      <AlertCircle size={12} />
      {message}
    </p>
  );
}

interface PreviewBadgeProps {
  ativo: string;
  valor: string;
  data: string;
}

function PreviewBadge({ ativo, valor, data }: PreviewBadgeProps) {
  const parsed = parseCurrency(valor);
  const isValid = ativo.length >= 4 && parsed > 0;

  if (!isValid) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 flex items-center gap-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl px-5 py-4 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner">
        <CheckCircle2 size={18} className="text-emerald-400" />
      </div>
      <p className="text-sm text-white/70 leading-relaxed">
        Você está registrando <span className="font-mono font-bold text-emerald-400 text-base">R$ {valor}</span> de <span className="font-mono font-bold text-white tracking-tight">{ativo}</span> recebidos em <span className="font-semibold text-white/90">{todayLabel(data)}</span>.
      </p>
    </div>
  );
}

// ─── form ────────────────────────────────────────────────────────────────────

function NovoDividendoForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [ativo, setAtivo] = useState("");
  const [ativoError, setAtivoError] = useState<string | null>(null);

  const [valor, setValor] = useState("");
  const [valorError, setValorError] = useState<string | null>(null);

  const [data, setData] = useState(TODAY);

  // ── validation ────────────────────────────────────────────────────────────

  function validateAtivo(v: string): boolean {
    if (v.length < 4) {
      setAtivoError("Ticker inválido (mín. 4 caracteres)");
      return false;
    }
    setAtivoError(null);
    return true;
  }

  function validateValor(v: string): boolean {
    const parsed = parseCurrency(v);
    if (!v || parsed <= 0) {
      setValorError("Informe um valor positivo");
      return false;
    }
    setValorError(null);
    return true;
  }

  const isFormReady =
    ativo.length >= 4 &&
    parseCurrency(valor) > 0 &&
    !ativoError &&
    !valorError;

  // ── submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGlobalError(null);

    const ativoOk = validateAtivo(ativo);
    const valorOk = validateValor(valor);
    if (!ativoOk || !valorOk) return;

    if (!auth.currentUser) {
      setGlobalError("Sessão expirada. Faça login novamente.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, `users/${auth.currentUser.uid}/dividendos`), {
        ativo: ativo.toUpperCase(),
        valorTotal: parseCurrency(valor),
        tipo: "dividendo",
        data: `${data}T12:00:00Z`,
        criadoEm: new Date().toISOString(),
      });

      await queryClient.invalidateQueries({ queryKey: ["dividendos"] });
      router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro desconhecido. Tente novamente.";
      console.error("Erro ao salvar dividendo:", err);
      setGlobalError(`Falha na operação: ${message}`);
      setLoading(false);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="animate-in fade-in zoom-in-95 duration-700 max-w-xl mx-auto pb-12">

      {/* Header */}
      <header className="mb-10 flex items-center gap-5 px-2">
        <Link
          href="/lancamento"
          aria-label="Voltar"
          className="group w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 flex items-center justify-center text-white/40 hover:text-white transition-all duration-300 shadow-xl backdrop-blur-md"
        >
          <ArrowLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white/95 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.1)]">
              <HandCoins className="text-emerald-400" size={22} />
            </div>
            Novo Dividendo
          </h1>
          <p className="text-sm font-medium text-white/40 mt-1.5 ml-1">
            Registre proventos e renda passiva na sua carteira.
          </p>
        </div>
      </header>

      {/* Card Form */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="relative bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 lg:p-10 shadow-2xl space-y-8 overflow-hidden"
      >
        {/* Subtle Decorative Icon */}
        <TrendingUp
          size={180}
          className="absolute -right-12 -bottom-12 text-emerald-500/[0.02] pointer-events-none select-none -rotate-12"
          aria-hidden
        />

        <div className="space-y-8 relative z-10">
          
          {/* Ticker Input */}
          <div className="group">
            <label
              htmlFor="ativo"
              className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] px-1 mb-3 block"
            >
              Código do Ativo
            </label>
            <div className="relative">
              <input
                id="ativo"
                type="text"
                required
                maxLength={10}
                autoComplete="off"
                spellCheck={false}
                value={ativo}
                onChange={(e) => {
                  const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                  setAtivo(v);
                  if (ativoError) validateAtivo(v);
                }}
                onBlur={() => validateAtivo(ativo)}
                placeholder="Ex: PETR4, IVVB11"
                aria-describedby={ativoError ? "ativo-error" : undefined}
                aria-invalid={!!ativoError}
                className={`w-full bg-white/[0.02] border rounded-2xl px-6 py-5 text-white font-mono text-2xl tracking-tight focus:outline-none focus:bg-white/[0.04] transition-all duration-300 placeholder:text-white/10 ${
                  ativoError
                    ? "border-red-500/30 focus:border-red-500/50"
                    : "border-white/5 focus:border-white/20"
                }`}
              />
            </div>
            {ativoError && <FieldError message={ativoError} />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Valor Input */}
            <div className="group">
              <label
                htmlFor="valor"
                className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] px-1 mb-3 block"
              >
                Valor Total
              </label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 font-mono font-bold text-xl select-none">
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
                  className={`w-full bg-white/[0.02] border rounded-2xl pl-16 pr-6 py-5 text-white font-mono text-2xl tracking-tight focus:outline-none focus:bg-white/[0.04] transition-all duration-300 placeholder:text-white/10 ${
                    valorError
                      ? "border-red-500/30 focus:border-red-500/50"
                      : "border-white/5 focus:border-white/20"
                  }`}
                />
              </div>
              {valorError && <FieldError message={valorError} />}
            </div>

            {/* Data Input */}
            <div className="group">
              <label
                htmlFor="data"
                className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] px-1 mb-3 block"
              >
                Data do Recebimento
              </label>
              <input
                id="data"
                type="date"
                required
                max={TODAY}
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-white font-mono text-lg tracking-tight focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all duration-300 [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {/* Live Preview & Feedback */}
        <div className="space-y-6 pt-2 relative z-10">
          <PreviewBadge ativo={ativo} valor={valor} data={data} />

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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !isFormReady}
            className="w-full relative group/btn overflow-hidden rounded-2xl py-5 transition-all duration-500 disabled:opacity-20 disabled:cursor-not-allowed active:scale-[0.98] shadow-xl"
          >
            {/* Emerald Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-500 transition-opacity duration-500 ${isFormReady ? "opacity-100" : "opacity-40"}`} />
            
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-emerald-400 opacity-0 group-hover/btn:opacity-20 transition-opacity blur-xl" />
            
            <span className="relative z-10 flex items-center justify-center gap-3 text-white font-bold text-lg tracking-wide">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                  Salvando Registro...
                </>
              ) : (
                <>
                  Registrar Recebimento
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

// ─── page ─────────────────────────────────────────────────────────────────────

export default function NovoDividendoPage() {
  return <NovoDividendoForm />;
}