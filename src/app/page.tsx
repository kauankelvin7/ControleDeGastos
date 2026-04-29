"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  Mail,
  Lock,
  Loader2,
  ArrowRight,
  AlertTriangle,
  Eye,
  EyeOff,
  CheckCircle2,
  Activity,
} from "lucide-react";

// ─── Constantes ────────────────────────────────────────────────────────────────

const TICKER_ITEMS = [
  { symbol: "PETR4", value: "+2.34%" },
  { symbol: "VALE3", value: "+1.12%" },
  { symbol: "ITUB4", value: "-0.45%" },
  { symbol: "BBDC4", value: "+0.87%" },
  { symbol: "ABEV3", value: "+3.21%" },
  { symbol: "MGLU3", value: "-1.09%" },
  { symbol: "WEGE3", value: "+4.56%" },
  { symbol: "B3SA3", value: "+0.33%" },
  { symbol: "RENT3", value: "+2.01%" },
];

const FIREBASE_ERRORS: Record<string, string> = {
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/email-already-in-use": "Este e-mail já está em uso.",
  "auth/weak-password": "A senha deve ter no mínimo 6 caracteres.",
  "auth/user-not-found": "Nenhuma conta encontrada com este e-mail.",
  "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos.",
  "auth/network-request-failed": "Falha de conexão. Verifique sua internet.",
};

// ─── Componente Ticker ──────────────────────────────────────────────────────────

function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]; // Duplica para loop infinito
  return (
    <div className="absolute top-0 left-0 right-0 h-8 overflow-hidden border-b border-white/[0.04] z-20 flex items-center bg-[#050505]/80 backdrop-blur-md">
      <div className="flex gap-0 animate-ticker whitespace-nowrap">
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2 px-6 text-[10px] font-mono font-medium tracking-wider border-r border-white/[0.04]">
            <span className="text-white/40">{item.symbol}</span>
            <span className={item.value.startsWith("+") ? "text-emerald-400" : "text-red-400"}>
              {item.value}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Página Principal ───────────────────────────────────────────────────────────

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);

  const router = useRouter();

  // ── Spotlight Effect ──
  const cardRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!cardRef.current || !spotlightRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    spotlightRef.current.style.background = `radial-gradient(600px circle at ${x}px ${y}px, rgba(249,115,22,0.06), transparent 40%)`;
    spotlightRef.current.style.opacity = "1";
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (spotlightRef.current) spotlightRef.current.style.opacity = "0";
  }, []);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  // ── Handlers ──
  const switchMode = (toRegister: boolean) => {
    setIsRegister(toRegister);
    setError("");
    setSuccessMsg("");
    setResetMode(false);
    setPassword("");
    setConfirmPassword("");
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setError("Digite seu e-mail para recuperar a senha.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg("Link de recuperação enviado ao seu e-mail.");
      setResetMode(false);
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(FIREBASE_ERRORS[err.code] ?? "Erro ao enviar e-mail. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (isRegister && password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", cred.user.uid), {
          email: cred.user.email,
          createdAt: new Date().toISOString(),
          onboardingCompleto: false,
        });
        router.push("/onboarding");
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const docSnap = await getDoc(doc(db, "users", cred.user.uid));
        if (docSnap.exists() && docSnap.data().onboardingCompleto) {
          router.push("/dashboard");
        } else {
          router.push("/onboarding");
        }
      }
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(FIREBASE_ERRORS[err.code] ?? "Ocorreu um erro inesperado. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Validação em tempo real ──
  const passwordStrength = (() => {
    if (password.length === 0) return null;
    if (password.length < 6) return { level: 0, label: "Muito curta", color: "bg-red-500" };
    if (password.length < 10) return { level: 1, label: "Fraca", color: "bg-orange-500" };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) return { level: 2, label: "Média", color: "bg-amber-400" };
    return { level: 3, label: "Forte", color: "bg-emerald-400" };
  })();

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  return (
    <>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker { animation: ticker 40s linear infinite; }
        .animate-ticker:hover { animation-play-state: paused; }
        
        @keyframes shimmer-btn {
          100% { transform: translateX(100%); }
        }
      `}</style>

      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#050505] relative overflow-hidden font-sans selection:bg-orange-500/30 selection:text-white">

        {/* ── Ticker Tape ── */}
        <Ticker />

        {/* ── Grid Background Animado (Fintech Feel) ── */}
        <div
          className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 20%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 20%, transparent 100%)',
          }}
        />

        {/* ── Premium Glows ── */}
        <div className="fixed pointer-events-none inset-0 z-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-orange-600/[0.05] blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-amber-500/[0.03] blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* ─────── Container principal ─────── */}
        <div className="w-full max-w-[420px] relative z-10 animate-in fade-in zoom-in-95 duration-700 ease-out mt-8">

          {/* ── Branding ── */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-5">
              <div className="absolute inset-0 bg-orange-500 blur-xl opacity-20 rounded-full animate-pulse" />
              <div className="w-16 h-16 relative rounded-2xl bg-gradient-to-br from-white/[0.08] to-transparent border border-white/10 flex items-center justify-center text-orange-400 backdrop-blur-sm group transition-all duration-500 hover:scale-105 hover:border-orange-500/50 shadow-2xl">
                <Activity size={32} strokeWidth={2} className="group-hover:scale-110 transition-transform duration-500" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">
              KiNance
            </h1>
            <p className="text-xs font-medium text-white/40 mt-1 tracking-wide">
              Gestão inteligente do seu patrimônio
            </p>
          </div>

          {/* ── Card Interativo ── */}
          <div
            ref={cardRef}
            className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-8 sm:p-10 shadow-2xl relative overflow-hidden group/card"
          >
            {/* Spotlight Gradient */}
            <div
              ref={spotlightRef}
              className="pointer-events-none absolute inset-0 rounded-[2rem] opacity-0 transition-opacity duration-300"
              aria-hidden="true"
            />

            <div className="relative z-10">

              {/* ── Toggle Entrar / Cadastrar ── */}
              <div className="relative flex bg-black/50 border border-white/5 rounded-2xl p-1 mb-8 shadow-inner">
                {["Acessar", "Criar Conta"].map((label, i) => {
                  const active = i === 1 ? isRegister : !isRegister;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => switchMode(i === 1)}
                      className={`relative z-10 flex-1 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-colors duration-300 ${active ? "text-white" : "text-white/40 hover:text-white/70"
                        }`}
                    >
                      {label}
                    </button>
                  );
                })}
                {/* Pílula Ativa Animada */}
                <div
                  className="absolute top-1 bottom-1 w-[calc(50%-4px)] left-1 bg-white/[0.08] border border-white/10 rounded-xl transition-transform duration-300 ease-out shadow-sm"
                  style={{ transform: isRegister ? "translateX(calc(100% + 2px))" : "translateX(0)" }}
                  aria-hidden="true"
                />
              </div>

              {/* ── Formulário ── */}
              <form onSubmit={handleSubmit} noValidate className="space-y-5">

                {/* Input E-mail */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">
                    E-mail
                  </label>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-orange-500 transition-colors">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="investidor@kinance.com"
                      className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white font-medium text-sm focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.04] transition-all placeholder:text-white/20 shadow-inner"
                    />
                  </div>
                </div>

                {/* Input Senha */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                      Senha
                    </label>
                    {!isRegister && (
                      <button
                        type="button"
                        onClick={resetMode ? handlePasswordReset : () => setResetMode(true)}
                        className="text-[10px] font-bold text-white/30 hover:text-orange-400 transition-colors uppercase tracking-wider"
                      >
                        {resetMode ? (loading ? "Enviando..." : "Confirmar Recuperação") : "Recuperar"}
                      </button>
                    )}
                  </div>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-orange-500 transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-11 pr-10 py-3.5 text-white font-medium text-sm focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.04] transition-all placeholder:text-white/20 shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Medidor de Força (Apenas no Cadastro) */}
                  {isRegister && passwordStrength !== null && (
                    <div className="mt-2 space-y-1.5 animate-in fade-in slide-in-from-top-1">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength.level ? passwordStrength.color : "bg-white/10"
                              }`}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] text-white/40 font-medium tracking-wide">
                        Força da senha: <span className="text-white/70">{passwordStrength.label}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Input Confirmar Senha (Apenas Cadastro) */}
                {isRegister && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">
                      Confirmar Senha
                    </label>
                    <div className="relative group/input">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 transition-colors">
                        {passwordsMatch ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Lock size={18} />}
                      </div>
                      <input
                        type={showConfirm ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full bg-white/[0.02] border rounded-xl pl-11 pr-10 py-3.5 text-white font-medium text-sm focus:outline-none focus:bg-white/[0.04] transition-all placeholder:text-white/20 shadow-inner ${confirmPassword.length > 0 && !passwordsMatch
                            ? "border-red-500/50 focus:border-red-500"
                            : "border-white/10 focus:border-orange-500/50"
                          }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Alertas */}
                {error && (
                  <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-medium rounded-xl p-3.5 animate-in fade-in slide-in-from-top-2">
                    <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}

                {successMsg && (
                  <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium rounded-xl p-3.5 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                    <p>{successMsg}</p>
                  </div>
                )}

                {/* Botão de Submit */}
                <button
                  type="submit"
                  disabled={loading || !email || (!resetMode && !password) || (isRegister && password !== confirmPassword)}
                  className="group/btn relative w-full bg-orange-500 text-white mt-2 py-4 rounded-xl font-bold text-sm transition-all duration-300 hover:bg-orange-400 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none overflow-hidden"
                >
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:animate-[shimmer-btn_1.5s_infinite]" />
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <Loader2 size={18} className="animate-spin text-white" />
                    ) : resetMode ? (
                      "Enviar instruções"
                    ) : (
                      <>
                        {isRegister ? "Iniciar jornada financeira" : "Acessar plataforma"}
                        <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                </button>

                {/* Cancelar Reset */}
                {resetMode && (
                  <button
                    type="button"
                    onClick={() => setResetMode(false)}
                    className="w-full text-center text-[11px] font-bold text-white/30 uppercase tracking-widest hover:text-white/60 transition-colors mt-2"
                  >
                    Voltar ao Login
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* ── Rodapé Seguro & Legal ── */}
          <div className="mt-6 flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-1.5 text-white/30">
              <Lock size={12} />
              <span className="text-[10px] font-medium tracking-wide">
                Acesso seguro com criptografia E2E
              </span>
            </div>
            <p className="text-[10px] font-medium text-white/20 leading-relaxed max-w-[300px]">
              Ao continuar, você concorda com nossos <br />
              <Link href="/termos" className="text-white/40 hover:text-white cursor-pointer transition-colors underline decoration-white/10 underline-offset-4">Termos de Serviço</Link> e <Link href="/privacidade" className="text-white/40 hover:text-white cursor-pointer transition-colors underline decoration-white/10 underline-offset-4">Política de Privacidade</Link>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}