import type { Metadata, Viewport } from "next";
import { Caveat, Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/shell/AppShell";
import { ESCOLA } from "@/data/escola";
import { COR_BARRA, SCRIPT_TEMA } from "@/lib/tema-script";
import "./globals.css";

// Mesma família do portal Zenix Education — o módulo social parece parte do portal.
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

// Números do timer e códigos.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

// Usada só no item "Fonte manuscrita no nome" da Loja — não precisa ser pré-carregada.
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["700"],
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: `Portal do Aluno · ${ESCOLA.curto}`,
    template: `%s · Portal ${ESCOLA.curto}`,
  },
  description: `Rede social educacional do ${ESCOLA.nome}: sala de estudos com métricas, salas coletivas, campeonatos, feed de dúvidas, missões, ranking, loja de recompensas e painel do professor.`,
  applicationName: "Portal do Aluno CEPI",
  authors: [{ name: "Squad 38 — Residência de Software" }],
};

export const viewport: Viewport = {
  // Barra do navegador na cor do tema. O script do tema e o AppShell reescrevem os metas quando a pessoa
  // escolhe um tema diferente do sistema (preferência "claro"/"escuro").
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: COR_BARRA.claro },
    { media: "(prefers-color-scheme: dark)", color: COR_BARRA.escuro },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${geist.variable} ${geistMono.variable} ${caveat.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="min-h-dvh">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
