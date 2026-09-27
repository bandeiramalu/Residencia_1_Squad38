import type { Metadata, Viewport } from "next";
import { Caveat, Plus_Jakarta_Sans } from "next/font/google";
import { AppShell } from "@/components/shell/AppShell";
import { ESCOLA } from "@/data/escola";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

// Usada só no item "Fonte manuscrita no nome" da Loja.
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["700"],
});

export const metadata: Metadata = {
  title: {
    default: `Portal do Aluno · ${ESCOLA.curto}`,
    template: `%s · Portal do Aluno ${ESCOLA.curto}`,
  },
  description: `Rede social educacional do ${ESCOLA.nome}: feed de dúvidas e materiais, missões, ranking por liga, marketplace de recompensas e perfil com medalhas.`,
  applicationName: "Portal do Aluno CEPI",
  authors: [{ name: "Squad 38 — Residência de Software" }],
};

export const viewport: Viewport = {
  themeColor: "#1e7149",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${jakarta.variable} ${caveat.variable} antialiased`}>
      <body className="min-h-dvh">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
