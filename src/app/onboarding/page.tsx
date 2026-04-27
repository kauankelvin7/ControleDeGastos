"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Target, ShieldAlert, PiggyBank, ArrowRight, CheckCircle2 } from "lucide-react";

type Objective = "reserva" | "renda_passiva" | "objetivo_especifico" | null;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [nome, setNome] = useState("");
  const [objetivo, setObjetivo] = useState<Objective>(null);
  const [aporteMensal, setAporteMensal] = useState("");

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

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await setDoc(doc(db, "users", user.uid), {
        nome: nome || "Investidor",
        objetivoPrincipal: objetivo,
        metaAporteMensal: Number(aporteMensal) || 0,
        reservaEmergenciaAlvo: 15000, // default
        onboardingCompleto: true,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      router.push("/dashboard");
    } catch (err) {
      console.error("Erro ao salvar onboarding", err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050403]">
        <div className="animate-spin w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full shadow-[0_0_15px_rgba(229,89,29,0.3)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col relative overflow-hidden">
      {/* Background Glows Atmosféricos */}
      <div className="fixed pointer-events-none inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-orange/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-lg mx-auto w-full relative z-10">
        
        {/* Progress Bar Premium */}
        <div className="w-full flex gap-3 mb-12 px-2">
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

        {/* Card Principal de Vidro */}
        <div className="w-full bg-[linear-gradient(145deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.01)_100%)] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-[0_32px_64px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
          
          {/* Step 1: Nome e Boas vindas */}
          {step === 1 && (
            <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h1 className="font-display font-bold text-4xl text-text-primary mb-3 tracking-tight">
                Bem-vindo ao <span className="bg-gradient-to-r from-brand-orange to-brand-amber bg-clip-text text-transparent">KiNance</span>! 👋
              </h1>
              <p className="text-text-secondary text-base mb-8 leading-relaxed">Para começarmos a transformar sua vida financeira, como gostaria de ser chamado?</p>
              
              <div className="relative mb-10">
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome ou apelido"
                  className="w-full bg-black/20 border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] rounded-2xl px-6 py-5 text-text-primary font-display text-xl focus:outline-none focus:border-brand-orange focus:bg-black/30 transition-all duration-300 placeholder:text-text-disabled"
                  autoFocus
                />
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!nome.trim()}
                className="w-full flex items-center justify-center gap-2 bg-[linear-gradient(135deg,var(--orange),var(--amber))] shadow-[0_4px_16px_rgba(229,89,29,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_6px_24px_rgba(229,89,29,0.4),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 text-white font-display font-bold py-5 rounded-2xl transition-all text-lg"
              >
                Continuar <ArrowRight size={22} className="ml-1" />
              </button>
            </div>
          )}

          {/* Step 2: Objetivo */}
          {step === 2 && (
            <div className="w-full animate-in fade-in slide-in-from-right-8 duration-700">
              <h1 className="font-display font-bold text-2xl text-text-primary mb-3 tracking-tight">Qual o seu objetivo principal?</h1>
              <p className="text-text-secondary text-sm mb-8">Isso nos ajudará a personalizar seus relatórios e sugestões da IA.</p>

              <div className="flex flex-col gap-4 mb-10">
                {/* Reserva */}
                <button
                  onClick={() => setObjetivo("reserva")}
                  className={`flex items-center gap-5 p-5 rounded-2xl border text-left transition-all duration-300 backdrop-blur-md ${
                    objetivo === "reserva" 
                    ? "border-brand-orange bg-brand-orange/10 shadow-[0_0_20px_rgba(229,89,29,0.15)]" 
                    : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
                  }`}
                >
                  <div className={`p-3 rounded-xl transition-all duration-300 ${objetivo === "reserva" ? "bg-brand-orange text-white shadow-glow" : "bg-black/20 text-text-muted"}`}>
                    <ShieldAlert size={24} />
                  </div>
                  <div>
                    <div className={`font-bold font-display text-base ${objetivo === "reserva" ? "text-brand-orange" : "text-text-primary"}`}>Reserva de Emergência</div>
                    <div className="text-xs text-text-muted mt-0.5 leading-snug">Paz de espírito para imprevistos e segurança total.</div>
                  </div>
                </button>

                {/* Renda Passiva */}
                <button
                  onClick={() => setObjetivo("renda_passiva")}
                  className={`flex items-center gap-5 p-5 rounded-2xl border text-left transition-all duration-300 backdrop-blur-md ${
                    objetivo === "renda_passiva" 
                    ? "border-success bg-success/10 shadow-[0_0_20px_rgba(74,222,128,0.15)]" 
                    : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
                  }`}
                >
                  <div className={`p-3 rounded-xl transition-all duration-300 ${objetivo === "renda_passiva" ? "bg-success text-black shadow-[0_0_15px_rgba(74,222,128,0.3)]" : "bg-black/20 text-text-muted"}`}>
                    <PiggyBank size={24} />
                  </div>
                  <div>
                    <div className={`font-bold font-display text-base ${objetivo === "renda_passiva" ? "text-success" : "text-text-primary"}`}>Renda Mensal Gerada</div>
                    <div className="text-xs text-text-muted mt-0.5 leading-snug">Viver de dividendos e ver o dinheiro trabalhar por você.</div>
                  </div>
                </button>

                {/* Específico */}
                <button
                  onClick={() => setObjetivo("objetivo_especifico")}
                  className={`flex items-center gap-5 p-5 rounded-2xl border text-left transition-all duration-300 backdrop-blur-md ${
                    objetivo === "objetivo_especifico" 
                    ? "border-info bg-info/10 shadow-[0_0_20px_rgba(96,165,250,0.15)]" 
                    : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
                  }`}
                >
                  <div className={`p-3 rounded-xl transition-all duration-300 ${objetivo === "objetivo_especifico" ? "bg-info text-black shadow-[0_0_15px_rgba(96,165,250,0.3)]" : "bg-black/20 text-text-muted"}`}>
                    <Target size={24} />
                  </div>
                  <div>
                    <div className={`font-bold font-display text-base ${objetivo === "objetivo_especifico" ? "text-info" : "text-text-primary"}`}>Objetivo Específico</div>
                    <div className="text-xs text-text-muted mt-0.5 leading-snug">Conquistar um bem material ou aquela viagem inesquecível.</div>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setStep(3)}
                disabled={!objetivo}
                className="w-full flex items-center justify-center gap-2 bg-[linear-gradient(135deg,var(--orange),var(--amber))] shadow-[0_4px_16px_rgba(229,89,29,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_6px_24px_rgba(229,89,29,0.4),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 text-white font-display font-bold py-5 rounded-2xl transition-all text-lg"
              >
                Continuar <ArrowRight size={22} />
              </button>
            </div>
          )}

          {/* Step 3: Aporte */}
          {step === 3 && (
            <div className="w-full animate-in fade-in slide-in-from-right-8 duration-700">
              <h1 className="font-display font-bold text-2xl text-text-primary mb-3 tracking-tight">Quanto você pretende investir por mês?</h1>
              <p className="text-text-secondary text-sm mb-8 leading-relaxed">Não se preocupe, você pode alterar isso depois. <br/>Consistência é melhor que quantidade.</p>

              <div className="relative mb-12">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-text-disabled font-bold text-2xl">R$</span>
                <input
                  type="number"
                  value={aporteMensal}
                  onChange={(e) => setAporteMensal(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-black/20 border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] rounded-2xl pl-16 pr-6 py-6 text-brand-orange font-mono font-bold text-3xl focus:outline-none focus:border-brand-orange transition-all duration-300 placeholder:text-brand-orange/20"
                  autoFocus
                />
              </div>

              <button
                onClick={handleComplete}
                disabled={!aporteMensal || Number(aporteMensal) <= 0 || loading}
                className="w-full flex items-center justify-center gap-3 bg-[linear-gradient(135deg,var(--orange),var(--amber))] shadow-[0_8px_32px_rgba(229,89,29,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] hover:shadow-[0_12px_40px_rgba(229,89,29,0.5),inset_0_1px_0_rgba(255,255,255,0.5)] hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 text-white font-display font-bold py-6 rounded-2xl transition-all text-xl"
              >
                {loading ? "Preparando seu dashboard..." : "Começar minha jornada"} <CheckCircle2 size={24} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}