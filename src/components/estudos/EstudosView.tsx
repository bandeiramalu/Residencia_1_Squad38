"use client";

import { Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { TituloPagina } from "@/components/ui/Blocos";
import { useAgora } from "@/hooks/useAgora";
import { formatarMinutos, resumoEstudos } from "@/lib/estudos";
import { useSeletor } from "@/store/store";
import { MetaDoDia } from "./MetaDoDia";
import { RankingFoco } from "./RankingFoco";
import { SalasAoVivo } from "./SalasAoVivo";
import { SessoesRecentes } from "./SessoesRecentes";
import { TimerFoco } from "./TimerFoco";

/**
 * Coluna lateral fixa que também funciona quando é mais alta que a tela: se cabe, gruda
 * no topo; se não cabe, rola junto até o fim dela aparecer e só então gruda (nada fica
 * escondido atrás da dobra). A altura vem de um ResizeObserver, sem re-renderizar.
 */
function useColunaFixa() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ajustar = () => el.style.setProperty("top", `min(6rem, calc(100dvh - ${el.offsetHeight}px - 1.5rem))`);
    ajustar();
    const obs = new ResizeObserver(ajustar);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/**
 * Sala de Estudos (/estudos): timer de foco (protagonista), meta do dia, uma linha de números,
 * atalho das salas ao vivo, sessões recentes e ranking de foco. Sem gráficos (ficam na aba
 * Estatísticas do professor). A página lê só sessões e meta; o relógio de 1 s fica isolado no timer.
 */
export function EstudosView() {
  const agora = useAgora(60_000);
  const sessoes = useSeletor((e) => e.estudos.sessoes);
  const meta = useSeletor((e) => e.estudos.metaDiariaMin);
  const resumo = resumoEstudos(sessoes, agora, meta);
  const sugerida = resumo.disciplinaTop ?? "Matemática";
  const lateral = useColunaFixa();

  return (
    // O recorte horizontal (na borda da coluna, não do card) segura dicas de gráfico que
    // passariam da tela no celular; `clip` não cria contêiner de rolagem, então o sticky segue valendo.
    <div className="-mx-4 space-y-6 overflow-x-clip px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <TituloPagina
        titulo="Sala de estudos"
        descricao="Cronometre seu foco."
        acao={
          <Link
            href="/estudos/salas"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-borda bg-superficie px-3.5 text-[13px] font-medium text-tinta transition-colors duration-150 hover:bg-superficie-2"
          >
            <Users className="size-4 text-texto-2" aria-hidden />
            Salas ao vivo
          </Link>
        }
      />

      <p className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-texto-2 tabular-nums">
        <span>
          Hoje <b className="font-semibold text-tinta">{formatarMinutos(resumo.hojeMin)}</b>
        </span>
        <span>
          Semana <b className="font-semibold text-tinta">{formatarMinutos(resumo.semanaMin)}</b>
        </span>
        <span>
          Sequência <b className="font-semibold text-tinta">{resumo.diasSeguidos} {resumo.diasSeguidos === 1 ? "dia" : "dias"}</b>
        </span>
      </p>

      <Link href="/estatisticas" className="inline-block text-[13px] font-medium text-acento hover:underline">
        Ver minhas estatísticas
      </Link>

      <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start xl:gap-6">
        <div className="contents xl:block xl:min-w-0 xl:space-y-4">
          <TimerFoco className="order-1" disciplinaSugerida={sugerida} />
          <SessoesRecentes className="order-4" agora={agora} disciplinaSugerida={sugerida} />
        </div>

        <div ref={lateral} className="contents xl:sticky xl:block xl:space-y-4">
          <MetaDoDia className="order-2" resumo={resumo} meta={meta} />
          <SalasAoVivo className="order-3" agora={agora} />
          <RankingFoco className="order-5" agora={agora} resumo={resumo} />
        </div>
      </div>
    </div>
  );
}
