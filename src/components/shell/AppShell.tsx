"use client";

import { domMax, LazyMotion, MotionConfig } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";
import { FocoAoVivo, MotorEstudos } from "@/components/estudos/FocoAoVivo";
import { Celebracao } from "@/components/ui/Celebracao";
import { Toaster } from "@/components/ui/Toaster";
import { useAtalhoApresentacao } from "@/lib/apresentacao";
import { useSessao, type PapelSessao } from "@/lib/auth";
import { destinoDaGuarda, HOME } from "@/lib/guarda";
import { sincronizarTema } from "@/lib/tema";
import { iniciarMonitorDeEnvio, virarDiaSeNecessario } from "@/store/actions";
import { useHidratado } from "@/store/store";
import { toast } from "@/store/ui";
import { BottomNav } from "./BottomNav";
import { Esqueleto, HeaderEsqueleto } from "./Esqueleto";
import { FaixaConexao } from "./FaixaConexao";
import { Header } from "./Header";
import { ConteudoSeguro } from "./LimiteDeErro";
import { ID_CONTEUDO, PularParaConteudo } from "./PularParaConteudo";
import { Sidebar } from "./Sidebar";

/**
 * Moldura do app. Celular/tablet: cabeçalho + conteúdo + barra inferior.
 * Desktop (≥ 1024 px): barra lateral fixa + cabeçalho + conteúdo em coluna larga.
 * Os dados vivem no navegador (localStorage), então as telas só renderizam depois
 * da hidratação — antes disso aparece um esqueleto do mesmo tamanho (sem "pulo").
 *
 * Também cuida do que vale para o app inteiro: "Pular para o conteúdo", faixa de conexão (tela 71),
 * tela "Não foi possível carregar agora" (tela 72, limite de erro + simulação), avisos de ações recusadas
 * ou de sessão expirada, virada do dia e reenvio das publicações guardadas.
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

/** Eventos globais: ação recusada pelo servidor e sessão expirada (só acontecem com backend, no modo http). */
function useAvisosDeSincronizacao() {
  useEffect(() => {
    let ultimaExpiracao = 0;
    const recusada = (e: Event) => {
      const mensagem = (e as CustomEvent<{ mensagem?: string } | undefined>).detail?.mensagem;
      toast({ tipo: "alerta", titulo: "Não foi possível concluir uma ação", mensagem: mensagem || undefined }, 5200);
    };
    const expirada = () => {
      // O aviso chega a cada tentativa da fila: um por vez basta.
      if (Date.now() - ultimaExpiracao < 15_000) return;
      ultimaExpiracao = Date.now();
      toast({ tipo: "alerta", titulo: "Sua sessão expirou. Entre de novo." }, 6000);
    };
    window.addEventListener("cepi:sync-rejeitada", recusada);
    window.addEventListener("cepi:sessao-expirada", expirada);
    return () => {
      window.removeEventListener("cepi:sync-rejeitada", recusada);
      window.removeEventListener("cepi:sessao-expirada", expirada);
    };
  }, []);
}

/** Vira o dia (sequência, missões diárias) ao abrir, a cada minuto e ao voltar para a aba. */
function useVirada(ativo: boolean) {
  useEffect(() => {
    if (!ativo) return;
    virarDiaSeNecessario();
    const intervalo = setInterval(() => virarDiaSeNecessario(), 60_000);
    const aoVoltar = () => {
      if (document.visibilityState === "visible") virarDiaSeNecessario();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [ativo]);
}

export function AppShell({ children }: { children: ReactNode }) {
  const hidratado = useHidratado();
  useAtalhoApresentacao(avisarModo);
  const sessao = useSessao();
  const caminho = usePathname();

  // Tema em sincronia com as outras abas e com o sistema; barra do navegador na cor certa já na carga a frio.
  useEffect(() => sincronizarTema(), []);
  useAvisosDeSincronizacao();
  useVirada(hidratado);
  // Publicações feitas sem conexão são confirmadas quando a conexão volta.
  useEffect(() => (hidratado ? iniciarMonitorDeEnvio() : undefined), [hidratado]);

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
      <PularParaConteudo />
      <Sidebar papel={papel} sessao={sessao} />
      <div className="min-h-dvh lg:pl-(--sidebar)">
        {hidratado ? (
          // Cabeçalho e faixa de conexão grudam juntos no topo.
          <div className="sticky top-0 z-40">
            <Header papel={papel} usuarioId={sessao?.usuarioId ?? "ana"} />
            <FaixaConexao />
          </div>
        ) : (
          <HeaderEsqueleto />
        )}
        <main id={ID_CONTEUDO} tabIndex={-1} className="coluna pb-nav px-4 pt-5 outline-none sm:px-6 lg:px-8 lg:pt-8">
          {hidratado ? (
            <ConteudoSeguro caminho={caminho} inicio={HOME[papel]}>
              {children}
            </ConteudoSeguro>
          ) : (
            <Esqueleto />
          )}
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
