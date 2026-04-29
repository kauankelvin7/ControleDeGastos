import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
};

export const metadata: Metadata = {
  title: "KiNance — Seu patrimônio, em tempo real.",
  description: "Gerencie seus investimentos, gastos e reserva de emergência com inteligência artificial.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased bg-[#0a0a0a] text-white selection:bg-orange-500/30 selection:text-white min-h-screen overflow-x-hidden font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}