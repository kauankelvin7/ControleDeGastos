"use client";

import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, Database } from "lucide-react";

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white/90 selection:bg-orange-500/30 selection:text-white font-sans py-20 px-6">
      <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Botão de Voltar */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-all group"
        >
          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
            <ArrowLeft size={16} />
          </div>
          <span className="text-sm font-medium">Voltar ao Login</span>
        </Link>

        {/* Header da Página */}
        <header className="space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <Shield size={24} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Política de Privacidade</h1>
          <p className="text-white/40 text-sm">Última atualização: 29 de Abril de 2026</p>
        </header>

        {/* Card Principal (Glassmorphism) */}
        <main className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Sutil gradiente de fundo no card */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none" />

          <div className="relative z-10 space-y-10">

            {/* Seção 1 - LGPD */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <span className="text-emerald-500/50 font-mono text-sm">01.</span>
                Conformidade com a LGPD
              </h2>
              <p className="text-white/60 leading-relaxed text-sm md:text-base">
                O KiNance está totalmente comprometido com a transparência e a segurança dos seus dados. Operamos em conformidade rigorosa com a <strong>Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</strong>, garantindo que você tenha controle total sobre suas informações pessoais e financeiras.
              </p>
            </section>

            {/* Seção 2 - Dados Coletados */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <span className="text-emerald-500/50 font-mono text-sm">02.</span>
                Dados que Coletamos
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Database size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Identificação</span>
                  </div>
                  <p className="text-white/50 text-xs leading-relaxed">
                    E-mail e nome (opcional) para autenticação segura via Firebase Auth.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Lock size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Financeiros</span>
                  </div>
                  <p className="text-white/50 text-xs leading-relaxed">
                    Registros de aportes, metas e ativos inseridos manualmente por você na plataforma.
                  </p>
                </div>
              </div>
            </section>

            {/* Seção 3 - Criptografia */}
            <section className="space-y-4 p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
              <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-3">
                <Lock size={20} />
                Segurança Nível Bancário
              </h2>
              <p className="text-white/70 leading-relaxed text-sm md:text-base font-medium">
                Seus dados são protegidos por criptografia de ponta a ponta (E2E) durante o trânsito e em repouso.
              </p>
              <p className="text-white/60 leading-relaxed text-sm">
                Utilizamos a infraestrutura do Google Firebase (Firestore/Auth) para garantir que apenas você tenha acesso às suas informações privadas. Nenhuma senha é armazenada em texto puro em nossos servidores.
              </p>
            </section>

            {/* Seção 4 - Compartilhamento */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <span className="text-emerald-500/50 font-mono text-sm">03.</span>
                Venda de Dados
              </h2>
              <p className="text-white/60 leading-relaxed text-sm md:text-base italic flex items-center gap-3">
                <Eye size={18} className="text-emerald-500/50" />
                "O KiNance NUNCA vende ou aluga seus dados financeiros para terceiros."
              </p>
              <p className="text-white/60 leading-relaxed text-sm">
                Não utilizamos suas informações para fins de marketing direcionado de produtos financeiros externos. Seus dados pertencem a você e são utilizados exclusivamente para gerar os insights e gráficos que você visualiza na plataforma.
              </p>
            </section>

            {/* Seção 5 - Direitos */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <span className="text-emerald-500/50 font-mono text-sm">04.</span>
                Seus Direitos
              </h2>
              <p className="text-white/60 leading-relaxed text-sm md:text-base">
                A qualquer momento, você pode solicitar a exportação completa dos seus dados ou a exclusão definitiva da sua conta e de todos os registros associados a ela através das configurações da plataforma.
              </p>
            </section>

            {/* Footer do Card */}
            <footer className="pt-10 border-t border-white/5 space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <Shield size={18} className="text-white/20 mt-1" />
                <p className="text-[11px] text-white/30 leading-relaxed">
                  Este é um texto base para a Política de Privacidade do KiNance. Como lidamos com informações sensíveis de patrimônio, é imperativo que você consulte um advogado especializado em direito digital para validar a versão final de produção do seu projeto.
                </p>
              </div>
              <p className="text-center text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">
                KiNance &copy; 2026 - Proteção de Dados LGPD
              </p>
            </footer>

          </div>
        </main>
      </div>
    </div>
  );
}
