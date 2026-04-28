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
    <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1.5 px-1 animate-in fade-in slide-in-from-top-1 duration-200">
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
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
      <p className="text-sm text-emerald-300">
        Lançando{" "}
        <span className="font-bold font-mono text-emerald-200">
          R$ {valor}
        </span>{" "}
        de <span className="font-bold font-mono text-emerald-200">{ativo}</span>{" "}
        em <span className="font-bold text-emerald-200">{todayLabel(data)}</span>
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
      setAtivoError("O ticker deve ter pelo menos 4 caracteres.");
      return false;
    }
    setAtivoError(null);
    return true;
  }

  function validateValor(v: string): boolean {
    const parsed = parseCurrency(v);
    if (!v || parsed <= 0) {
      setValorError("Informe um valor maior que R$ 0,00.");
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
      setGlobalError(`Não foi possível salvar: ${message}`);
      setLoading(false);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="animate-in fade-in duration-500 max-w-2xl mx-auto">

      {/* Header */}
      <header className="mb-8 flex items-center gap-4">
        <Link
          href="/lancamento"
          aria-label="Voltar para lançamentos"
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5 flex items-center justify-center text-text-muted hover:text-text-primary transition-all duration-300 shadow-sm backdrop-blur-md"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display font-bold text-3xl text-text-primary flex items-center gap-3 drop-shadow-md tracking-tight">
            <HandCoins
              className="text-brand-orange drop-shadow-[0_0_8px_rgba(229,89,29,0.5)]"
              size={28}
            />
            Receber Dividendo
          </h1>
          <p className="text-text-muted mt-1">
            Registre o recebimento de proventos e renda passiva.
          </p>
        </div>
      </header>

      {/* Card */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-[linear-gradient(145deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.01)_100%)] backdrop-blur-2xl border border-white/5 rounded-2xl p-6 md:p-8 shadow-[0_32px_64px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] space-y-6 relative overflow-hidden"
      >

        {/* Subtle decorative icon */}
        <TrendingUp
          size={140}
          className="absolute -right-6 -bottom-6 text-white/[0.02] pointer-events-none select-none"
          aria-hidden
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Ticker */}
          <div className="md:col-span-2">
            <label
              htmlFor="ativo"
              className="text-xs font-display font-bold text-text-secondary uppercase tracking-wider px-1 mb-2 block"
            >
              Ticker do Ativo
            </label>
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
              placeholder="Ex: MXRF11, PETR4"
              aria-describedby={ativoError ? "ativo-error" : undefined}
              aria-invalid={!!ativoError}
              className={`w-full bg-black/20 border shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] rounded-xl px-4 py-4 text-text-primary font-mono text-xl focus:outline-none focus:bg-black/30 hover:border-white/20 transition-all duration-300 uppercase placeholder:text-text-disabled ${
                ativoError
                  ? "border-red-500/60 focus:border-red-500 focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_0_0_3px_rgba(239,68,68,0.2)]"
                  : "border-white/10 focus:border-brand-orange focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_0_0_3px_rgba(229,89,29,0.2)]"
              }`}
            />
            {ativoError && (
              <FieldError message={ativoError} />
            )}
          </div>

          {/* Valor */}
          <div className="md:col-span-2">
            <label
              htmlFor="valor"
              className="text-xs font-display font-bold text-text-secondary uppercase tracking-wider px-1 mb-2 block"
            >
              Valor Recebido (Total)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-disabled font-bold text-lg select-none">
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
                className={`w-full bg-black/20 border shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] rounded-xl pl-12 pr-4 py-4 text-text-primary font-mono text-lg focus:outline-none focus:bg-black/30 hover:border-white/20 transition-all duration-300 placeholder:text-text-disabled ${
                  valorError
                    ? "border-red-500/60 focus:border-red-500 focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_0_0_3px_rgba(239,68,68,0.2)]"
                    : "border-white/10 focus:border-brand-orange focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_0_0_3px_rgba(229,89,29,0.2)]"
                }`}
              />
            </div>
            {valorError && (
              <FieldError message={valorError} />
            )}
          </div>

          {/* Data */}
          <div className="md:col-span-2">
            <label
              htmlFor="data"
              className="text-xs font-display font-bold text-text-secondary uppercase tracking-wider px-1 mb-2 block"
            >
              Data do Pagamento
            </label>
            <input
              id="data"
              type="date"
              required
              max={TODAY}
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full bg-black/20 border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] rounded-xl px-4 py-4 text-text-primary font-mono text-lg focus:outline-none focus:border-brand-orange focus:bg-black/30 focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_0_0_3px_rgba(229,89,29,0.2)] hover:border-white/20 transition-all duration-300 [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Live preview */}
        <PreviewBadge ativo={ativo} valor={valor} data={data} />

        {/* Global error */}
        {globalError && (
          <div
            role="alert"
            className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-red-300">{globalError}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !isFormReady}
          className="w-full bg-[linear-gradient(135deg,var(--orange),var(--amber))] shadow-[0_4px_16px_rgba(229,89,29,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_6px_24px_rgba(229,89,29,0.4),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-1 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none text-white font-bold py-4 rounded-xl transition-all duration-300 text-lg tracking-wide mt-2"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Salvando...
            </span>
          ) : (
            "Registrar Dividendo"
          )}
        </button>
      </form>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function NovoDividendoPage() {
  return <NovoDividendoForm />;
}