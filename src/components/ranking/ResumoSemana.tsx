"use client";

import { ChevronRight, Eye, EyeOff, Timer, UserRound } from "lucide-react";
import { m as motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DISCIPLINAS } from "@/data/escola";
import { LIGA_DO_USUARIO, LIGAS, ZONA } from "@/data/ranking";
import { useAgora } from "@/hooks/useAgora";
import { fmt } from "@/lib/format";
import { montarRanking } from "@/lib/gamificacao";
import { contagemRegressiva, fechamentoDaSemana } from "@/lib/tempo";
import { definirPrivacidade } from "@/store/actions";
import type { Usuario } from "@/store/types";
import { Variacao } from "./LinhaRankingItem";
import { EmblemaLiga, nomeDaLiga } from "./ReguaLigas";

const ROTULO_VISIBILIDADE = { publico: "Público", anonimo: "Anônimo", sombra: "Invisível" } as const;
const ICONE_VISIBILIDADE = { publico: Eye, anonimo: UserRound, sombra: EyeOff } as const;

/** Resumo da semana na liga: posição (mesmo oculta, só para você), meta de zona e contagem até domingo. */
export function ResumoSemana({ usuario }: { usuario: Usuario }) {
  const lista = montarRanking(usuario, "liga", LIGA_DO_USUARIO, DISCIPLINAS[0]);
  const eu = lista.find((l) => l.eu);
  if (!eu) return null;

  const indice = LIGAS.findIndex((l) => l.id === LIGA_DO_USUARIO);
  const proxima = LIGAS[indice + 1]?.nome;
  const linhaPromocao = lista[ZONA - 1];
  const linhaSegura = lista[lista.length - ZONA - 1];
  const sombra = usuario.privacidade === "sombra";
  const IconeVis = ICONE_VISIBILIDADE[usuario.privacidade];

  let meta: { texto: string; atual: number; alvo: number } | null = null;
  if (eu.zona === "rebaixamento" && linhaSegura) {
    meta = { texto: `Faltam ${fmt(linhaSegura.xp - eu.xp + 1)} XP para sair da zona de rebaixamento`, atual: eu.xp, alvo: linhaSegura.xp + 1 };
  } else if (eu.zona !== "promocao" && linhaPromocao) {
    meta = { texto: `Faltam ${fmt(linhaPromocao.xp - eu.xp + 1)} XP para a zona de promoção`, atual: eu.xp, alvo: linhaPromocao.xp + 1 };
  }

  return (
    <section aria-label="Resumo da semana" className="rounded-2xl border border-borda bg-superficie p-4">
      <div className="flex items-center gap-3">
        <EmblemaLiga liga={LIGA_DO_USUARIO} />
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold text-tinta">Liga {nomeDaLiga(LIGA_DO_USUARIO)}</h2>
          <p className="text-[13px] text-texto-2">Sua semana</p>
        </div>
        <Variacao tendencia={eu.tendencia} variacao={eu.variacao} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <dt className="text-[13px] text-texto-2">{sombra ? "Posição (só você vê)" : "Posição"}</dt>
          <dd className="mt-0.5 flex items-baseline gap-1.5">
            <motion.span
              key={eu.posicao}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="text-2xl font-semibold tabular-nums text-tinta"
            >
              {eu.posicao}º
            </motion.span>
            <span className="text-[13px] text-texto-2">de {lista.length}</span>
          </dd>
        </div>
        <div>
          <dt className="text-[13px] text-texto-2">XP na semana</dt>
          <dd className="mt-0.5 text-2xl font-semibold tabular-nums text-tinta">{fmt(eu.xp)}</dd>
        </div>
      </dl>

      <div className="mt-3">
        {meta ? (
          <>
            <p className="text-[13px] text-texto">{meta.texto}</p>
            <ProgressBar valor={meta.atual} max={meta.alvo} fina className="mt-2" rotulo="Progresso até a próxima zona" />
          </>
        ) : (
          <p className="text-[13px] text-texto">
            {proxima ? (
              <>
                Na <span className="font-medium text-acento">zona de promoção</span>. Segure até domingo para subir para a Liga {proxima}.
              </>
            ) : (
              "No topo da liga mais alta. Segure até domingo."
            )}
          </p>
        )}
      </div>

      <div className="mt-4 space-y-1 border-t border-borda pt-3">
        <div className="-mx-2 flex items-center gap-1">
          <button
            type="button"
            onClick={() => document.getElementById("visibilidade")?.scrollIntoView({ behavior: "smooth", block: "center" })}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] text-texto transition-colors hover:bg-superficie-2 toque:min-h-11"
          >
            <IconeVis className="size-4 shrink-0 text-texto-2" aria-hidden />
            <span className="min-w-0 flex-1 truncate">
              {sombra ? (
                <span className="font-medium text-tinta">Modo invisível</span>
              ) : (
                <>
                  Visibilidade: <span className="font-medium text-tinta">{ROTULO_VISIBILIDADE[usuario.privacidade]}</span>
                </>
              )}
            </span>
            {!sombra && <ChevronRight className="size-4 shrink-0 text-texto-2" aria-hidden />}
          </button>
          {sombra && (
            <Button variante="fantasma" tamanho="sm" className="h-8 shrink-0 px-2 text-acento" onClick={() => definirPrivacidade("publico")}>
              Voltar a aparecer
            </Button>
          )}
        </div>
        <Contagem />
      </div>
    </section>
  );
}

/** Contagem regressiva isolada: só este texto re-renderiza a cada segundo. */
function Contagem() {
  const agora = useAgora(1000);
  const { dias, horas, minutos, segundos } = contagemRegressiva(fechamentoDaSemana(agora) - agora);
  const dois = (n: number) => String(n).padStart(2, "0");
  return (
    <p className="flex items-center gap-2 py-1.5 text-[13px] text-texto" role="timer" aria-label={`Faltam ${dias} dias, ${horas} horas e ${minutos} minutos para o fechamento`}>
      <Timer className="size-4 shrink-0 text-texto-2" aria-hidden />
      <span className="min-w-0 flex-1">Fecha domingo, 23:59</span>
      <span className="shrink-0 tabular-nums text-texto-2" aria-hidden>
        {dias}d {dois(horas)}h {dois(minutos)}m {dois(segundos)}s
      </span>
    </p>
  );
}
