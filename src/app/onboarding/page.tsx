"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { maskCurrency, parseCurrency } from "@/lib/utils";
import { Target, ShieldAlert, PiggyBank, ArrowRight, CheckCircle2, AlertTriangle, ChevronLeft, Sparkles } from "lucide-react";

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
  glowColor: string;
}

const OBJETIVO_OPTIONS: ObjetivoOption[] = [
  {
    value: "reserva",
    label: "Reserva de Emergência",
    description: "Paz de espírito para imprevistos e segurança total.",
    icon: ShieldAlert,
    activeColor: "text-orange-500",
    glowColor: "shadow-[0_0_20px_rgba(249,115,22,0.2)]",
  },
  {
    value: "renda_passiva",
    label: "Renda Mensal Gerada",
    description: "Viver de dividendos e ver o dinheiro trabalhar por você.",
    icon: PiggyBank,
    activeColor: "text-emerald-400",
    glowColor: "shadow-[0_0_20px_rgba(16,185,129,0.2)]",
  },
  {
    value: "objetivo_especifico",
    label: "Objetivo Específico",
    description: "Conquistar um bem material ou aquela viagem inesquecível.",
    icon: Target,
    activeColor: "text-sky-400",
    glowColor: "shadow-[0_0_20px_rgba(56,189,248,0.2)]",
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
  }, [router]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center justify-center animate-pulse">
           <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin shadow-[0_0_20px_rgba(249,115,22,0.1)]" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Configurando Ambiente</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col relative overflow-hidden font-sans selection:bg-orange-500/30 selection:text-white">
      
      {/* Background Glows */}
      <div className="fixed pointer-events-none inset-0 z-0 overflow-hidden" aria-hidden>
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-orange-500/[0.04] blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/[0.04] blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full relative z-10">

        {/* Header Branding */}
        <div className="flex flex-col items-center mb-12 animate-in fade-in zoom-in-95 duration-1000">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center font-bold text-black shadow-2xl mb-6">
            <Sparkles size={28} />
          </div>
          <h2 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em]">Setup Sequence</h2>
        </div>

        {/* Progress System */}
        <div className="w-full max-w-md flex gap-4 mb-12 px-2" role="progressbar">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-700 ${
                step >= s
                  ? "bg-white shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                  : "bg-white/5"
              }`}
            />
          ))}
        </div>

        {/* Main Interface */}
        <div className="w-full bg-[#0a0a0a]/40 backdrop-blur-3xl border border-white/[0.05] rounded-[3rem] p-10 lg:p-14 shadow-2xl relative overflow-hidden transition-all duration-700">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />

          {/* ── Step 1: Identity ──────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
              <h1 className="text-4xl font-bold text-white tracking-tighter mb-4">
                Identidade <span className="text-orange-500">Premium</span>
              </h1>
              <p className="text-sm font-medium text-white/40 mb-12 leading-relaxed max-w-sm">
                Iniciando seu protocolo de inteligência financeira. Como devemos identificar você no ecossistema?
              </p>

              <div className="space-y-10">
                <div className="space-y-4">
                  <label htmlFor="nome-input" className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-1 block">Nome do Titular</label>
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
                    className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl px-6 py-5 text-white font-bold text-2xl tracking-tight focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all duration-500 placeholder:text-white/5"
                  />
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!canAdvanceStep1}
                  className="group w-full flex items-center justify-center gap-3 bg-white text-black py-5 rounded-[1.5rem] font-bold text-sm uppercase tracking-[0.2em] transition-all duration-500 hover:shadow-[0_12px_32px_rgba(255,255,255,0.1)] hover:-translate-y-1 active:scale-95 disabled:opacity-20"
                >
                  Continuar <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Objectives ───────────────────────────────────────────── */}
          {step === 2 && (
            <div className="w-full animate-in fade-in slide-in-from-right-12 duration-700 ease-out">
              <h1 className="text-3xl font-bold text-white tracking-tighter mb-4">
                Foco Estratégico
              </h1>
              <p className="text-sm font-medium text-white/40 mb-10 leading-relaxed max-w-sm">
                O KiNance personalizará seus insights de acordo com sua prioridade atual.
              </p>

              <div className="space-y-4 mb-10">
                {OBJETIVO_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = objetivo === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setObjetivo(opt.value)}
                      className={`w-full flex items-center gap-6 p-6 rounded-3xl border text-left transition-all duration-500 group relative overflow-hidden ${
                        isSelected
                          ? `bg-white/[0.03] border-white/20 ${opt.glowColor}`
                          : "border-white/5 bg-white/[0.01] hover:bg-white/[0.04] hover:border-white/10"
                      }`}
                    >
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 ${
                          isSelected
                            ? `bg-white text-black border-white`
                            : "bg-white/[0.02] border-white/5 text-white/20 group-hover:text-white/40 shadow-inner"
                        }`}
                      >
                        <Icon size={24} />
                      </div>
                      <div>
                        <div className={`text-base font-bold tracking-tight ${isSelected ? 'text-white' : 'text-white/60'}`}>
                          {opt.label}
                        </div>
                        <p className={`text-[13px] font-medium leading-relaxed mt-1 ${isSelected ? 'text-white/40' : 'text-white/20'}`}>
                          {opt.description}
                        </p>
                      </div>
                      {isSelected && (
                         <div className="absolute right-6 top-1/2 -translate-y-1/2">
                            <CheckCircle2 size={24} className={opt.activeColor} />
                         </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-16 h-16 rounded-[1.5rem] bg-white/[0.02] border border-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/5 transition-all duration-500 active:scale-95"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!canAdvanceStep2}
                  className="flex-1 flex items-center justify-center gap-3 bg-white text-black py-5 rounded-[1.5rem] font-bold text-sm uppercase tracking-[0.2em] transition-all duration-500 hover:shadow-[0_12px_32px_rgba(255,255,255,0.1)] hover:-translate-y-1 active:scale-95 disabled:opacity-20"
                >
                  Confirmar Foco <ArrowRight size={20} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Capital Flow ───────────────────────────────────────── */}
          {step === 3 && (
            <div className="w-full animate-in fade-in slide-in-from-right-12 duration-700 ease-out">
              <h1 className="text-3xl font-bold text-white tracking-tighter mb-4">
                Fluxo de Capital
              </h1>
              <p className="text-sm font-medium text-white/40 mb-12 leading-relaxed max-w-sm">
                Defina sua meta de aporte mensal. Você poderá ajustar sua estratégia a qualquer momento.
              </p>

              <div className="space-y-12">
                <div className="space-y-4">
                  <label htmlFor="aporte-input" className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-1 block">Meta de Aporte Mensal</label>
                  <div className="relative group">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 font-bold text-2xl select-none group-focus-within:text-orange-500 transition-colors">R$</span>
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
                      className="w-full bg-white/[0.02] border border-white/[0.05] rounded-[2rem] pl-20 pr-8 py-8 text-white font-mono font-bold text-4xl tracking-tighter focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all duration-500 placeholder:text-white/5"
                    />
                  </div>
                </div>

                {saveError && (
                  <div className="flex items-center gap-4 bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold uppercase tracking-widest rounded-2xl p-5 animate-in slide-in-from-top-2">
                    <AlertTriangle size={16} className="shrink-0" />
                    {saveError}
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={saving}
                    className="w-16 h-16 rounded-[1.5rem] bg-white/[0.02] border border-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/5 transition-all duration-500 active:scale-95 disabled:opacity-20"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={!canComplete || saving}
                    className="flex-1 flex items-center justify-center gap-3 bg-orange-500 text-white py-5 rounded-[1.5rem] font-bold text-sm uppercase tracking-[0.2em] transition-all duration-500 hover:shadow-[0_12px_40px_rgba(249,115,22,0.3)] hover:-translate-y-1 active:scale-95 disabled:opacity-40 overflow-hidden"
                  >
                    {saving ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                        Finalizando...
                      </div>
                    ) : (
                      <>
                        Ativar Plataforma
                        <CheckCircle2 size={22} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Indicator */}
        <div className="mt-10">
           <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.5em]">Phase 0{step} / 03</p>
        </div>
      </div>
    </div>
  );
}