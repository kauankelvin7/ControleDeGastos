"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", cred.user.uid), {
          email: cred.user.email,
          createdAt: new Date().toISOString(),
          onboardingCompleto: false
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
    } catch (err: any) {
      let msg = "Ocorreu um erro inesperado.";
      if (err.code === "auth/invalid-credential") msg = "E-mail ou senha incorretos.";
      if (err.code === "auth/email-already-in-use") msg = "Este e-mail já está em uso.";
      if (err.code === "auth/weak-password") msg = "A senha deve ter no mínimo 6 caracteres.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg-base relative overflow-hidden">
      {/* Luzes Atmosféricas de Fundo */}
      <div className="fixed pointer-events-none inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-orange/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-[420px] relative z-10 animate-in fade-in zoom-in-95 duration-700">
        {/* Logo Branding */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 rounded-[24px] bg-[linear-gradient(135deg,var(--orange),var(--amber))] flex items-center justify-center font-bold text-white text-3xl shadow-[0_8px_32px_rgba(229,89,29,0.4),inset_0_2px_4px_rgba(255,255,255,0.4)] mb-6 transition-transform hover:scale-105 duration-500">
            K₿
          </div>
          <h1 className="font-display font-bold text-3xl text-text-primary tracking-tighter drop-shadow-md">KiNance</h1>
          <p className="text-text-muted text-sm font-mono mt-2 opacity-70">Seu patrimônio, em tempo real.</p>
        </div>

        {/* Card de Login */}
        <div className="bg-[linear-gradient(145deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.01)_100%)] backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 md:p-10 shadow-[0_32px_64px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
          
          {/* Toggle Switch Glass */}
          <div className="flex bg-black/30 backdrop-blur-md rounded-2xl p-1.5 mb-8 border border-white/5 shadow-inner">
            <button
              onClick={() => { setIsRegister(false); setError(""); }}
              className={`flex-1 py-2.5 text-sm font-bold font-display rounded-xl transition-all duration-300 ${!isRegister ? "bg-[linear-gradient(135deg,var(--orange),var(--amber))] text-white shadow-[0_4px_12px_rgba(229,89,29,0.3)]" : "text-text-muted hover:text-text-secondary"}`}
            >
              Entrar
            </button>
            <button
              onClick={() => { setIsRegister(true); setError(""); }}
              className={`flex-1 py-2.5 text-sm font-bold font-display rounded-xl transition-all duration-300 ${isRegister ? "bg-[linear-gradient(135deg,var(--orange),var(--amber))] text-white shadow-[0_4px_12px_rgba(229,89,29,0.3)]" : "text-text-muted hover:text-text-secondary"}`}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Input Email */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-display font-bold text-text-disabled uppercase tracking-widest px-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-black/20 border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] rounded-xl px-4 py-4 text-text-primary font-mono text-sm focus:outline-none focus:border-brand-orange focus:bg-black/40 transition-all duration-300 placeholder:text-text-disabled"
              />
            </div>
            
            {/* Input Senha */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-display font-bold text-text-disabled uppercase tracking-widest px-1">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/20 border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] rounded-xl px-4 py-4 text-text-primary font-mono text-sm focus:outline-none focus:border-brand-orange focus:bg-black/40 transition-all duration-300 placeholder:text-text-disabled"
              />
            </div>

            {!isRegister && (
              <div className="text-right -mt-2">
                <button type="button" className="text-xs font-display font-bold text-text-disabled hover:text-brand-orange transition-colors tracking-wide">
                  Esqueceu a senha?
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-danger text-xs font-bold font-display rounded-xl p-4 text-center animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[linear-gradient(135deg,var(--orange),var(--amber))] shadow-[0_8px_24px_rgba(229,89,29,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] hover:shadow-[0_12px_32px_rgba(229,89,29,0.4),inset_0_1px_0_rgba(255,255,255,0.5)] hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 text-white font-display font-bold py-5 rounded-2xl transition-all duration-300 mt-4 text-base tracking-wide"
            >
              {loading ? "Aguarde..." : isRegister ? "Criar minha conta" : "Entrar no KiNance"}
            </button>
          </form>
        </div>
        
        <p className="text-center mt-8 text-xs text-text-disabled font-display">
          Ao entrar, você concorda com nossos <span className="text-text-muted hover:underline cursor-pointer">Termos de Uso</span>.
        </p>
      </div>
    </div>
  );
}