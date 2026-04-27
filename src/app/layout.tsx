import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "KiNance — Seu patrimônio, em tempo real.",
  description: "Gerencie seus investimentos, gastos e reserva de emergência com inteligência artificial.",
  icons: {
    icon: "/favicon-v3.svg",
    apple: "/favicon-v3.svg",
  },
  // Configuração extra para mobile (estética de App Nativo)
  themeColor: "#050403",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased bg-bg-base text-text-primary selection:bg-brand-orange/30 selection:text-white min-h-screen overflow-x-hidden">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}