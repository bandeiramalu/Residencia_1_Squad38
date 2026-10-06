"use client";

import { domMax, LazyMotion, MotionConfig } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { FocoAoVivo, MotorEstudos } from "@/components/estudos/FocoAoVivo";
import { Celebracao } from "@/components/ui/Celebracao";
import { Toaster } from "@/components/ui/Toaster";
import { useAtalhoApresentacao } from "@/lib/apresentacao";
import { useSessao } from "@/lib/auth";
import { useHidratado } from "@/store/store";
import { toast } from "@/store/ui";
import { BottomNav } from "./BottomNav";
import { Esqueleto, HeaderEsqueleto } from "./Esqueleto";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

/**
 * Moldura do app. Celular/tablet: cabeçalho + conteúdo + barra inferior.
 * Desktop (≥ 1024 px): barra lateral fixa + cabeçalho + conteúdo em coluna larga.
 * Os dados vivem no navegador (localStorage), então as telas só renderizam depois
 * da hidratação — antes disso aparece um esqueleto do mesmo tamanho (sem "pulo").
 */
const avisarModo = (ativo: boolean) =>
  toast({ tipo: "info", titulo: ativo ? "Modo apresentação ligado" : "Modo apresentação desligado", mensagem: ativo ? "Atalhos de demonstração visíveis." : undefined }, 2400);

export function AppShell({ children }: { children: ReactNode }) {
  const hidratado = useHidratado();
  useAtalhoApresentacao(avisarModo);
  const sessao = useSessao();
  const caminho = usePathname();

  // Animações carregam só as funções usadas (LazyMotion + componentes `m`): bundle menor.
  const envolver = (conteudo: ReactNode) => (
    <LazyMotion features={domMax}>
      <MotionConfig reducedMotion="user">{conteudo}</MotionConfig>
    </LazyMotion>
  );

  if (caminho === "/login") {
    return envolver(
      <>
        {children}
        {hidratado && <Toaster />}
      </>,
    );
  }

  const papel = sessao?.papel ?? (caminho.startsWith("/professor") ? "professor" : "aluno");

  return envolver(
    <>
      <Sidebar papel={papel} sessao={sessao} />
      <div className="min-h-dvh lg:pl-(--sidebar)">
        {(hidratado ? <Header papel={papel} usuarioId={sessao?.usuarioId ?? "ana"} /> : <HeaderEsqueleto />)}
        <main id="conteudo" className="coluna pb-nav px-4 pt-5 sm:px-6 lg:px-8 lg:pt-8">
          {hidratado ? children : <Esqueleto />}
        </main>
      </div>
      <BottomNav papel={papel} />
      {hidratado && (
        <>
          <Toaster />
          <Celebracao />
          {papel === "aluno" && (
            <>
              <MotorEstudos />
              <FocoAoVivo />
            </>
          )}
        </>
      )}
    </>,
  );
}
