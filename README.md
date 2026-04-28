# 📊 KiNance — Dashboard de Gestão Patrimonial

**KiNance** é uma plataforma moderna e intuitiva de gestão financeira e patrimonial, desenvolvida para proporcionar uma visão clara e em tempo real dos seus investimentos, gastos e rendimentos passivos.

![KiNance Preview](https://via.placeholder.com/1200x600/050403/e5591d?text=KiNance+Dashboard+Preview)

## 🚀 Objetivo

O objetivo principal do KiNance é centralizar o controle de ativos financeiros e despesas mensais em um único dashboard "cyber-premium". O sistema foca em:
- **Visualização Analítica**: Gráficos dinâmicos de evolução de patrimônio vs. capital investido.
- **Inteligência de Dados**: Sincronização em tempo real com cotações do mercado (via Brapi).
- **Gestão de Gastos**: Categorização inteligente de despesas para melhor saúde financeira.
- **Rendas Passivas**: Monitoramento de dividendos e proventos recebidos mensalmente.

## 🛠️ Stack Tecnológica

O projeto utiliza as tecnologias mais modernas do ecossistema React/Next.js:

- **Frontend**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: [Tailwind CSS 4](https://tailwindcss.com/) com design system personalizado (Glassmorphism)
- **Banco de Dados & Auth**: [Firebase](https://firebase.google.com/) (Firestore & Authentication)
- **Gerenciamento de Estado**: [TanStack Query v5](https://tanstack.com/query/latest) (React Query)
- **Gráficos**: [Chart.js](https://www.chartjs.org/) & [React-Chartjs-2](https://react-chartjs-2.js.org/)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Datas**: [date-fns](https://date-fns.org/)

## ✨ Funcionalidades Principais

- **Dashboard Real-time**: Evolução do patrimônio com suporte a períodos dinâmicos (1M, 3M, 6M, 1A, TUDO).
- **Cotações Reais**: Integração com API externa para atualizar o valor de mercado da carteira instantaneamente.
- **Métricas Avançadas**: Cálculo automático de preço médio, rendimento total e variações percentuais.
- **Sistema de Notificações**: Alertas sobre oportunidades de investimento e lembretes de gastos.
- **Design Premium**: Interface dark mode com efeitos de vidro, gradientes suaves e alta legibilidade.

## 📦 Como Rodar o Projeto

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/kauankelvin7/ControleDeGastos.git
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**:
   Crie um arquivo `.env.local` na raiz do projeto com suas credenciais do Firebase e chaves de API necessárias.

4. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

5. **Acesse no navegador**:
   [http://localhost:3000](http://localhost:3000)

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

---
Desenvolvido com ❤️ por [Kauan Kelvin](https://github.com/kauankelvin7)
