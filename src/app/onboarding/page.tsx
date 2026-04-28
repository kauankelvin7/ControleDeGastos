"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { maskCurrency, parseCurrency } from "@/lib/utils";
import { Target, ShieldAlert, PiggyBank, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Objective = "reserva" | "renda_passiva" | "objetivo_especifico";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Erro inesperado. Tente novamente.";
}

// ─── Opções de objetivo ──────────────────────────────────────────────────────

interface ObjetivoOption {
  value: Objective;
  label: string;
  description: string;
  icon: React.ElementType;
  activeColor: string;
  activeBorder: string;
  activeBg: string;
  activeShadow: string;
  activeIconBg: string;
  activeIconColor: string;
  activeIconShadow: string;
}

const OBJETIVO_OPTIONS: ObjetivoOption[] = [
  {
    value: "reserva",
    label: "Reserva de Emergência",
    description: "Paz de espírito para imprevistos e segurança total.",
    icon: ShieldAlert,
    activeColor: "text-brand-orange",
    activeBorder: "border-brand-orange",
    activeBg: "bg-brand-orange/10",
    activeShadow: "shadow-[0_0_20px_rgba(229,89,29,0.15)]",
    activeIconBg: "bg-brand-orange",
    activeIconColor: "text-white",
    activeIconShadow: "shadow-[0_0_15px_rgba(229,89,29,0.4)]",
  },
  {
    value: "renda_passiva",
    label: "Renda Mensal Gerada",
    description: "Viver de dividendos e ver o dinheiro trabalhar por você.",
    icon: PiggyBank,
    activeColor: "text-success",
    activeBorder: "border-success",
    activeBg: "bg-success/10",
    activeShadow: "shadow-[0_0_20px_rgba(74,222,128,0.15)]",
    activeIconBg: "bg-success",
    activeIconColor: "text-black",
    activeIconShadow: "shadow-[0_0_15px_rgba(74,222,128,0.3)]",
  },
  {
    value: "objetivo_especifico",
    label: "Objetivo Específico",
    description: "Conquistar um bem material ou aquela viagem inesquecível.",
    icon: Target,
    activeColor: "text-info",
    activeBorder: "border-info",
    activeBg: "bg-info/10",
    activeShadow: "shadow-[0_0_20px_rgba(96,165,250,0.15)]",
    activeIconBg: "bg-info",
    activeIconColor: "text-black",
    activeIconShadow: "shadow-[0_0_15px_rgba(96,165,250,0.3)]",
  },
];

// ─── Componente principal ────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Dados do formulário
  const [nome, setNome] = useState("");
  const [objetivo, setObjetivo] = useState<Objective | null>(null);
  const [aporteMensal, setAporteMensal] = useState("");

  // Validações por step
  const canAdvanceStep1 = nome.trim().length >= 1;
  const canAdvanceStep2 = objetivo !== null;
  const parsedAporte = parseCurrency(aporteMensal);
  const canComplete = aporteMensal.trim().length > 0 && parsedAporte > 0;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/");
      } else {
        setUser(u);
      }
      setLoading(false);
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // router é estável no App Router — não precisa estar nos deps
  }, []);

  const handleComplete = useCallback(async () => {
    if (!user || !canComplete) return;
    setSaveError(null);
    setSaving(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          nome: nome.trim() || "Investidor",
          objetivoPrincipal: objetivo,
          metaAporteMensal: parsedAporte,
          reservaEmergenciaAlvo: 15000,
          onboardingCompleto: true,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      router.push("/dashboard");
    } catch (err) {
      setSaveError(errorMessage(err));
      setSaving(false);
    }
  }, [user, canComplete, nome, objetivo, parsedAporte, router]);

  // ── Loading screen ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[#050403]"
        role="status"
        aria-label="Carregando"
      >
        <div
          className="animate-spin w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full shadow-[0_0_15px_rgba(229,89,29,0.3)]"
          aria-hidden="true"
        />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-bg-base flex flex-col relative overflow-hidden">
      {/* Glows atmosféricos */}
      <div className="fixed pointer-events-none inset-0 z-0" aria-hidden="true">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-orange/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-lg mx-auto w-full relative z-10">

        {/* Progress Bar */}
        <div className="w-full flex gap-3 mb-12 px-2" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={3} aria-label={`Passo ${step} de 3`}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                step >= s
                  ? "bg-[linear-gradient(90deg,var(--orange),var(--amber))] shadow-[0_0_10px_rgba(229,89,29,0.4)]"
                  : "bg-white/5 border border-white/5"
              }`}
            />
          ))}
        </div>

        {/* Card principal */}
        <div className="w-full bg-[linear-gradient(145deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.01)_100%)] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-[0_32px_64px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">

          {/* ── Step 1: Nome ───────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h1 className="font-display font-bold text-4xl text-text-primary mb-3 tracking-tight">
                Bem-vindo ao{" "}
                <span className="bg-gradient-to-r from-brand-orange to-brand-amber bg-clip-text text-transparent">
                  KiNance
                </span>
                ! 👋
              </h1>
              <p className="text-text-secondary text-base mb-8 leading-relaxed">
                Para começarmos a transformar sua vida financeira, como gostaria de ser chamado?
              </p>

              <div className="relative mb-10">
                <label htmlFor="nome-input" className="sr-only">
                  Seu nome ou apelido
                </label>
                <input
                  id="nome-input"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canAdvanceStep1) setStep(2);
                  }}
                  placeholder="Seu nome ou apelido"
                  maxLength={60}
                  autoFocus
                  className="w-full bg-black/20 border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] rounded-2xl px-6 py-5 text-text-primary font-display text-xl focus:outline-none focus:border-brand-orange focus:bg-black/30 transition-all duration-300 placeholder:text-text-disabled"
                />
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!canAdvanceStep1}
                className="w-full flex items-center justify-center gap-2 bg-[linear-gradient(135deg,var(--orange),var(--amber))] shadow-[0_4px_16px_rgba(229,89,29,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_6px_24px_rgba(229,89,29,0.4),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0 text-white font-display font-bold py-5 rounded-2xl transition-all text-lg"
              >
                Continuar <ArrowRight size={22} className="ml-1" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* ── Step 2: Objetivo ───────────────────────────────────────────── */}
          {step === 2 && (
            <div className="w-full animate-in fade-in slide-in-from-right-8 duration-700">
              <h1
                id="objetivo-group-label"
                className="font-display font-bold text-2xl text-text-primary mb-3 tracking-tight"
              >
                Qual o seu objetivo principal?
              </h1>
              <p className="text-text-secondary text-sm mb-8">
                Isso nos ajudará a personalizar seus relatórios e sugestões da IA.
              </p>

              <div
                role="group"
                aria-labelledby="objetivo-group-label"
                className="flex flex-col gap-4 mb-10"
              >
                {OBJETIVO_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = objetivo === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setObjetivo(opt.value)}
                      aria-pressed={isSelected}
                      aria-label={opt.label}
                      className={`flex items-center gap-5 p-5 rounded-2xl border text-left transition-all duration-300 backdrop-blur-md ${
                        isSelected
                          ? `${opt.activeBorder} ${opt.activeBg} ${opt.activeShadow}`
                          : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
                      }`}
                    >
                      <div
                        className={`p-3 rounded-xl transition-all duration-300 flex-shrink-0 ${
                          isSelected
                            ? `${opt.activeIconBg} ${opt.activeIconColor} ${opt.activeIconShadow}`
                            : "bg-black/20 text-text-muted"
                        }`}
                      >
                        <Icon size={24} aria-hidden="true" />
                      </div>
                      <div>
                        <div
                          className={`font-bold font-display text-base ${
                            isSelected ? opt.activeColor : "text-text-primary"
                          }`}
                        >
                          {opt.label}
                        </div>
                        <div className="text-xs text-text-muted mt-0.5 leading-snug">
                          {opt.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-5 px-6 rounded-2xl border border-white/10 text-text-muted hover:text-text-primary hover:border-white/20 hover:bg-white/5 transition-all font-semibold"
                  aria-label="Voltar para o passo anterior"
                >
                  Voltar
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!canAdvanceStep2}
                  className="flex-1 flex items-center justify-center gap-2 bg-[linear-gradient(135deg,var(--orange),var(--amber))] shadow-[0_4px_16px_rgba(229,89,29,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_6px_24px_rgba(229,89,29,0.4),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0 text-white font-display font-bold py-5 rounded-2xl transition-all text-lg"
                >
                  Continuar <ArrowRight size={22} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Aporte mensal ──────────────────────────────────────── */}
          {step === 3 && (
            <div className="w-full animate-in fade-in slide-in-from-right-8 duration-700">
              <h1 className="font-display font-bold text-2xl text-text-primary mb-3 tracking-tight">
                Quanto você pretende investir por mês?
              </h1>
              <p className="text-text-secondary text-sm mb-8 leading-relaxed">
                Não se preocupe, você pode alterar isso depois.
                <br />
                Consistência é melhor que quantidade.
              </p>

              <div className="relative mb-4">
                <span
                  className="absolute left-6 top-1/2 -translate-y-1/2 text-text-disabled font-bold text-2xl"
                  aria-hidden="true"
                >
                  R$
                </span>
                <label htmlFor="aporte-input" className="sr-only">
                  Aporte mensal em reais
                </label>
                <input
                  id="aporte-input"
                  type="text"
                  inputMode="decimal"
                  value={aporteMensal}
                  onChange={(e) => {
                    setAporteMensal(maskCurrency(e.target.value));
                    setSaveError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canComplete && !saving) handleComplete();
                  }}
                  placeholder="0,00"
                  autoFocus
                  aria-invalid={!!saveError}
                  aria-describedby={saveError ? "aporte-error" : undefined}
                  className="w-full bg-black/20 border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] rounded-2xl pl-16 pr-6 py-6 text-brand-orange font-mono font-bold text-3xl focus:outline-none focus:border-brand-orange transition-all duration-300 placeholder:text-brand-orange/20"
                />
              </div>

              {/* Erro de salvamento */}
              {saveError && (
                <div
                  id="aporte-error"
                  role="alert"
                  className="mb-6 flex items-center gap-3 px-4 py-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm"
                >
                  <AlertTriangle size={15} aria-hidden="true" />
                  {saveError}
                </div>
              )}

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={saving}
                  className="py-6 px-6 rounded-2xl border border-white/10 text-text-muted hover:text-text-primary hover:border-white/20 hover:bg-white/5 transition-all font-semibold disabled:opacity-50"
                  aria-label="Voltar para o passo anterior"
                >
                  Voltar
                </button>
                <button
                  onClick={handleComplete}
                  disabled={!canComplete || saving}
                  className="flex-1 flex items-center justify-center gap-3 bg-[linear-gradient(135deg,var(--orange),var(--amber))] shadow-[0_8px_32px_rgba(229,89,29,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] hover:shadow-[0_12px_40px_rgba(229,89,29,0.5),inset_0_1px_0_rgba(255,255,255,0.5)] hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0 text-white font-display font-bold py-6 rounded-2xl transition-all text-xl"
                >
                  {saving ? (
                    <>
                      <span
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                        aria-hidden="true"
                      />
                      Preparando seu dashboard...
                    </>
                  ) : (
                    <>
                      Começar minha jornada
                      <CheckCircle2 size={24} aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Indicador textual de passo */}
        <p className="mt-6 text-text-disabled text-xs font-semibold uppercase tracking-widest" aria-hidden="true">
          Passo {step} de 3
        </p>
      </div>
    </div>
  );
}