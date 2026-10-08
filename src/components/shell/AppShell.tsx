"use client";

import { domMax, LazyMotion, MotionConfig } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";
import { FocoAoVivo, MotorEstudos } from "@/components/estudos/FocoAoVivo";
import { Celebracao } from "@/components/ui/Celebracao";
import { Toaster } from "@/components/ui/Toaster";
import { useAtalhoApresentacao } from "@/lib/apresentacao";
import { useSessao, type PapelSessao } from "@/lib/auth";
import { destinoDaGuarda } from "@/lib/guarda";
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

/** Faz o redirecionamento da guarda (precisa da query, por isso fica num Suspense próprio). */
function Redirecionador({ caminho, papel }: { caminho: string; papel: PapelSessao | null }) {
  const router = useRouter();
  const busca = useSearchParams().toString();
  const destino = destinoDaGuarda(caminho, papel, busca);
  useEffect(() => {
    if (destino) router.replace(destino);
  }, [destino, router]);
  return null;
}

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

  // Guarda de rotas: a sessão é por aba (sessionStorage), então a decisão é feita aqui, no cliente.
  // Enquanto redireciona, aparece só o esqueleto — a tela protegida nunca chega a ser montada.
  const redirecionando = hidratado && destinoDaGuarda(caminho, sessao?.papel ?? null) !== null;
  const guarda = hidratado && (
    <Suspense fallback={null}>
      <Redirecionador caminho={caminho} papel={sessao?.papel ?? null} />
    </Suspense>
  );

  if (redirecionando) {
    return envolver(
      <>
        <HeaderEsqueleto />
        <main className="coluna px-4 pt-5 sm:px-6 lg:px-8 lg:pt-8">
          <Esqueleto />
        </main>
        {guarda}
      </>,
    );
  }

  if (caminho === "/login") {
    return envolver(
      <>
        {children}
        {guarda}
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
      {guarda}
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
