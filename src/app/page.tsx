"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { TrendingUp, Mail, Lock, Loader2, ArrowRight, AlertTriangle, Activity } from "lucide-react";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Ref para o efeito de Spotlight (brilho seguindo o mouse)
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const router = useRouter();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    const card = cardRef.current;
    if (card) {
      card.addEventListener("mousemove", handleMouseMove);
      return () => card.removeEventListener("mousemove", handleMouseMove);
    }
  }, []);

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
      let msg = "Ocorreu um erro inesperado. Tente novamente.";
      if (err.code === "auth/invalid-credential") msg = "E-mail ou senha incorretos.";
      if (err.code === "auth/email-already-in-use") msg = "Este e-mail já está em uso.";
      if (err.code === "auth/weak-password") msg = "A senha deve ter no mínimo 6 caracteres.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#050505] relative overflow-hidden font-sans selection:bg-orange-500/30 selection:text-white">
      
      {/* 1. Grid Background Animado (Remete a dados financeiros) */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 20%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 20%, transparent 100%)',
        }}
      />

      {/* 2. Gráfico Abstrato de Fundo (Bull Market) */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-10 pointer-events-none" aria-hidden="true">
        <svg viewBox="0 0 1000 400" className="w-full max-w-5xl h-auto stroke-orange-500" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M0 300 C 100 280, 200 320, 300 200 C 400 80, 500 250, 600 150 C 700 50, 800 120, 1000 20" />
          <path d="M0 350 C 150 350, 250 380, 350 250 C 450 120, 550 280, 650 180 C 750 80, 850 150, 1000 50" className="stroke-amber-500 opacity-50" strokeWidth="1" />
        </svg>
      </div>

      {/* 3. Luzes de Fundo Embasadas (Premium Glows) */}
      <div className="fixed pointer-events-none inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-600/[0.05] blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/[0.03] blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-[420px] relative z-10 animate-in fade-in zoom-in-95 duration-1000 ease-out">
        
        {/* Cabeçalho / Branding */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-orange-500 blur-xl opacity-20 rounded-full animate-pulse" />
            <div className="w-16 h-16 relative rounded-2xl bg-gradient-to-br from-white/[0.08] to-transparent border border-white/10 flex items-center justify-center text-orange-400 backdrop-blur-sm mb-6 group transition-all duration-500 hover:scale-105 hover:border-orange-500/50">
              <Activity size={32} strokeWidth={2} className="group-hover:scale-110 transition-transform duration-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">
            KiNance
          </h1>
          <p className="text-xs font-medium text-white/40 mt-2 tracking-wide">
            Inteligência e controle para seus ativos.
          </p>
        </div>

        {/* Card Principal com Spotlight Effect */}
        <div 
          ref={cardRef}
          className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-8 sm:p-10 shadow-2xl relative overflow-hidden group"
        >
          {/* Spotlight Gradient que segue o mouse */}
          <div 
            className="pointer-events-none absolute -inset-px rounded-[2rem] opacity-0 transition duration-300 group-hover:opacity-100"
            style={{
              background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(249,115,22,0.06), transparent 40%)`,
            }}
          />
          
          {/* Seletor de Modo (Entrar / Cadastrar) */}
          <div className="relative flex bg-black/50 border border-white/5 rounded-2xl p-1 mb-8 shadow-inner">
            <button
              onClick={() => { setIsRegister(false); setError(""); }}
              className={`relative z-10 flex-1 py-2.5 text-xs font-bold tracking-wide rounded-xl transition-all duration-300 ${
                !isRegister 
                  ? "text-white" 
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              Acessar
            </button>
            <button
              onClick={() => { setIsRegister(true); setError(""); }}
              className={`relative z-10 flex-1 py-2.5 text-xs font-bold tracking-wide rounded-xl transition-all duration-300 ${
                isRegister 
                  ? "text-white" 
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              Criar Conta
            </button>
            
            {/* Pílula de background animada para o seletor */}
            <div 
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white/[0.08] border border-white/10 rounded-xl transition-transform duration-300 ease-out ${
                isRegister ? "translate-x-[calc(100%+2px)]" : "translate-x-0"
              } left-1`} 
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-5">
              
              {/* Campo E-mail */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-white/50 uppercase tracking-widest px-1">
                  E-mail
                </label>
                <div className="relative group/input">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-orange-400 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="conta@kinance.com"
                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white font-medium text-sm focus:outline-none focus:border-orange-500/40 focus:bg-white/[0.04] transition-all placeholder:text-white/20 shadow-inner"
                  />
                </div>
              </div>
              
              {/* Campo Senha */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                   <label className="text-[11px] font-bold text-white/50 uppercase tracking-widest">
                     Senha
                   </label>
                   {!isRegister && (
                    <button type="button" className="text-[10px] font-bold text-white/30 hover:text-orange-400 transition-colors uppercase tracking-wider">
                      Recuperar
                    </button>
                  )}
                </div>
                <div className="relative group/input">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-orange-400 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white font-medium text-sm focus:outline-none focus:border-orange-500/40 focus:bg-white/[0.04] transition-all placeholder:text-white/20 shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
                <AlertTriangle size={16} className="shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Botão de Ação */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="group/btn relative w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-sm transition-all duration-300 hover:bg-orange-400 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none overflow-hidden"
            >
              {/* Efeito de brilho passando pelo botão */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:animate-[shimmer_1.5s_infinite]" />
              
              <div className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <Loader2 size={18} className="animate-spin text-white" />
                ) : (
                  <>
                    {isRegister ? "Iniciar jornada financeira" : "Acessar plataforma"}
                    <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>
        </div>
        
        {/* Rodapé Seguro */}
        <div className="mt-8 flex items-center justify-center gap-2 text-white/30">
           <Lock size={12} />
           <p className="text-[10px] font-medium tracking-wide">
             Acesso seguro e criptografado de ponta a ponta.
           </p>
        </div>
      </div>
      
      {/* Definição da animação do brilho do botão no Tailwind config global ou injetado aqui */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}