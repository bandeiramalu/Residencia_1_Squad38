"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { Celebracao } from "@/components/ui/Celebracao";
import { Toaster } from "@/components/ui/Toaster";
import { useHidratado } from "@/store/store";
import { BottomNav } from "./BottomNav";
import { Esqueleto, HeaderEsqueleto } from "./Esqueleto";
import { Header } from "./Header";
import { PainelApresentacao } from "./PainelApresentacao";

/**
 * Moldura do app: cabeçalho fixo, conteúdo da aba e barra inferior.
 * Os dados do aluno ficam no navegador (localStorage), então as telas só
 * renderizam depois da hidratação — antes disso aparece um esqueleto.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const hidratado = useHidratado();

  return (
    <MotionConfig reducedMotion="user">
      <PainelApresentacao />
      <div className="relative mx-auto min-h-dvh w-full max-w-[480px] bg-fundo sm:border-x sm:border-borda sm:shadow-[0_0_60px_-20px_rgb(27_58_44/0.25)]">
        {hidratado ? <Header /> : <HeaderEsqueleto />}
        <main id="conteudo" className="pb-nav px-4 pt-4">
          {hidratado ? children : <Esqueleto />}
        </main>
        <BottomNav />
      </div>
      {hidratado && (
        <>
          <Toaster />
          <Celebracao />
        </>
      )}
    </MotionConfig>
  );
}
