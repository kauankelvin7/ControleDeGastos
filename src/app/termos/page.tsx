"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, Gavel, FileText } from "lucide-react";

export default function TermosPage() {
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
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
            <Gavel size={24} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Termos de Serviço</h1>
          <p className="text-white/40 text-sm">Última atualização: 29 de Abril de 2026</p>
        </header>

        {/* Card Principal (Glassmorphism) */}
        <main className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Sutil gradiente de fundo no card */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 space-y-10">
            
            {/* Seção 1 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <span className="text-orange-500/50 font-mono text-sm">01.</span>
                Aceitação dos Termos
              </h2>
              <p className="text-white/60 leading-relaxed text-sm md:text-base">
                Ao acessar e utilizar a plataforma KiNance, você concorda em cumprir e estar vinculado a estes Termos de Serviço. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços. O uso contínuo da plataforma após alterações nos termos constitui aceitação das novas condições.
              </p>
            </section>

            {/* Seção 2 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <span className="text-orange-500/50 font-mono text-sm">02.</span>
                Descrição do Serviço
              </h2>
              <p className="text-white/60 leading-relaxed text-sm md:text-base">
                O KiNance é uma ferramenta de inteligência financeira projetada para auxiliar na gestão, acompanhamento e visualização de ativos e despesas. A plataforma fornece gráficos, projeções e organização de dados para facilitar a compreensão da sua saúde financeira.
              </p>
            </section>

            {/* Seção 3 - Isenção de Responsabilidade (CRÍTICO) */}
            <section className="space-y-4 p-6 rounded-3xl bg-orange-500/5 border border-orange-500/10">
              <h2 className="text-xl font-bold text-orange-400 flex items-center gap-3">
                <ShieldCheck size={20} />
                Isenção de Responsabilidade
              </h2>
              <p className="text-white/70 leading-relaxed text-sm md:text-base font-medium">
                O KiNance NÃO fornece recomendações de investimento, consultoria financeira, jurídica ou tributária. Todo o conteúdo, análises e ferramentas são fornecidos apenas para fins informativos e educacionais.
              </p>
              <p className="text-white/60 leading-relaxed text-sm">
                Decisões de compra, venda ou manutenção de ativos financeiros são de responsabilidade exclusiva do usuário. Investimentos em renda variável e criptoativos envolvem riscos significativos de perda de capital.
              </p>
            </section>

            {/* Seção 4 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <span className="text-orange-500/50 font-mono text-sm">03.</span>
                Uso da Conta e Segurança
              </h2>
              <p className="text-white/60 leading-relaxed text-sm md:text-base">
                Você é responsável por manter a confidencialidade de suas credenciais de acesso (e-mail e senha). Qualquer atividade realizada através de sua conta será de sua inteira responsabilidade. O KiNance utiliza criptografia de ponta a ponta e autenticação via Firebase para garantir a máxima segurança dos seus dados de acesso.
              </p>
            </section>

            {/* Seção 5 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <span className="text-orange-500/50 font-mono text-sm">04.</span>
                Limitação de Responsabilidade
              </h2>
              <p className="text-white/60 leading-relaxed text-sm md:text-base">
                Em nenhuma circunstância o KiNance ou seus desenvolvedores serão responsáveis por quaisquer danos diretos, indiretos, incidentais ou consequentes resultantes do uso ou da incapacidade de usar a plataforma, incluindo, mas não se limitando a, perdas financeiras em investimentos.
              </p>
            </section>

            {/* Footer do Card */}
            <footer className="pt-10 border-t border-white/5 space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <FileText size={18} className="text-white/20 mt-1" />
                <p className="text-[11px] text-white/30 leading-relaxed">
                  Este documento é uma versão base gerada para fins de demonstração da plataforma KiNance. Para uso em produção, recomenda-se a revisão por um profissional jurídico especializado para garantir total conformidade com as leis locais vigentes.
                </p>
              </div>
              <p className="text-center text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">
                KiNance &copy; 2026 - Todos os direitos reservados.
              </p>
            </footer>

          </div>
        </main>
      </div>
    </div>
  );
}
