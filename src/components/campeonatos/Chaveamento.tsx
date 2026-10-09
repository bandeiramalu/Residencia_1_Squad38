"use client";

import { Trophy } from "lucide-react";
import { m as motion } from "motion/react";
import { useEffect, useRef } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { LinkPessoa } from "@/components/ui/LinkPessoa";
import { nomeDaRodada } from "@/data/campeonatos";
import { partidasDaRodada, totalRodadas } from "@/lib/campeonatos";
import { cn } from "@/lib/cn";
import { primeiroNome } from "@/lib/format";
import type { Campeonato, Partida, Pessoa } from "@/store/types";
import { PontoAoVivo } from "./comum";

/** Altura de cada "vaga" da primeira rodada; as rodadas seguintes dobram e centralizam entre os confrontos de origem. */
const VAGA = 92;
const LARGURA = 188;
/** Metade do espaço entre colunas (gap-8 = 32 px): comprimento de cada conector horizontal. */
const MEIO_GAP = 16;
/** Coluna do campeão (w-32) e o círculo do troféu (size-12): o conector da final vai até a borda do círculo. */
const LARGURA_CAMPEAO = 128;
const CIRCULO = 48;

interface Props {
  c: Campeonato;
  pessoas: Record<string, Pessoa>;
  /** Aluna (caminho em verde e confronto jogável). `null` para o professor. */
  euId: string | null;
  onJogar?: (partidaId: string) => void;
}

/**
 * Chaveamento do mata-mata: uma coluna por rodada, conectores finos entre os confrontos e o caminho da aluna em verde.
 * No celular rola na horizontal e já abre na rodada em que a aluna está.
 */
export function Chaveamento({ c, pessoas, euId, onJogar }: Props) {
  const rodadas = totalRodadas(c);
  const colunas = Array.from({ length: rodadas }, (_, r) => partidasDaRodada(c, r));
  const altura = Math.max(2, colunas[0]?.length ?? 1) * VAGA;
  const rolagem = useRef<HTMLDivElement>(null);

  const colunaDaAluna = euId ? colunas.findLastIndex((ps) => ps.some((p) => p.a === euId || p.b === euId)) : -1;
  useEffect(() => {
    const el = rolagem.current;
    if (!el || colunaDaAluna <= 0) return;
    el.scrollTo({ left: Math.max(0, colunaDaAluna * (LARGURA + MEIO_GAP * 2) - 24), behavior: "smooth" });
  }, [colunaDaAluna]);

  if (!rodadas) return null;
  const campeaEu = !!euId && c.campeao === euId;

  return (
    <div ref={rolagem} className="sem-scrollbar -mx-4 overflow-x-auto px-4 pb-1 outline-none focus-visible:ring-2 focus-visible:ring-verde/40 sm:-mx-5 sm:px-5" tabIndex={0} aria-label="Chaveamento (role para os lados)">
      <div className="flex w-max gap-8">
        {colunas.map((partidas, r) => (
          <div key={r} style={{ width: LARGURA }} className="shrink-0">
            <p className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-texto-2">
              {nomeDaRodada(r, rodadas)}
              {partidas.some((p) => p.status === "disponivel") && <PontoAoVivo />}
            </p>
            <ol className="flex flex-col" style={{ height: altura }}>
              {partidas.map((p, i) => {
                const minha = !!euId && (p.a === euId || p.b === euId);
                const avancei = !!euId && p.vencedor === euId;
                return (
                  <li key={p.id} className="relative flex flex-1 items-center">
                    {r > 0 && <Linha className="right-full top-1/2" largura={MEIO_GAP} destaque={minha} />}
                    <Linha className="left-full top-1/2" largura={r === rodadas - 1 ? MEIO_GAP * 2 + (LARGURA_CAMPEAO - CIRCULO) / 2 : MEIO_GAP} destaque={avancei} />
                    {r < rodadas - 1 && (
                      <span
                        aria-hidden
                        className={cn("absolute w-px transition-colors", i % 2 === 0 ? "top-1/2 h-1/2" : "bottom-1/2 h-1/2", avancei ? "bg-verde" : "bg-borda")}
                        style={{ left: `calc(100% + ${MEIO_GAP}px)` }}
                      />
                    )}
                    <Confronto p={p} pessoas={pessoas} euId={euId} indice={r * 8 + i} onJogar={minha && p.status === "disponivel" ? onJogar : undefined} />
                  </li>
                );
              })}
            </ol>
          </div>
        ))}

        {/* Coluna do campeão */}
        <div className="w-32 shrink-0">
          <p className="mb-2 text-[12px] font-medium text-texto-2">Campeão</p>
          <div className="flex flex-col items-center justify-center" style={{ height: altura }}>
            <div className={cn("relative grid size-12 place-items-center rounded-full border", c.campeao ? "border-ouro/30 bg-ouro-claro text-ouro" : "border-borda bg-superficie-2 text-texto-2")}>
              <Trophy className="size-5" aria-hidden />
              <div className="absolute left-1/2 top-full mt-2 w-32 -translate-x-1/2 text-center">
                <p className={cn("truncate text-[13px] font-medium", c.campeao ? "text-tinta" : "text-texto-2")}>{c.campeao ? (campeaEu ? "Você" : primeiroNome(pessoas[c.campeao]?.nome ?? c.campeao)) : "A definir"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Linha({ className, largura, destaque }: { className: string; largura: number; destaque: boolean }) {
  return <span aria-hidden className={cn("absolute h-px transition-colors", destaque ? "bg-verde" : "bg-borda", className)} style={{ width: largura }} />;
}

function Confronto({ p, pessoas, euId, indice, onJogar }: { p: Partida; pessoas: Record<string, Pessoa>; euId: string | null; indice: number; onJogar?: (id: string) => void }) {
  const folga = p.status === "encerrada" && (!p.a || !p.b);
  const minha = !!euId && (p.a === euId || p.b === euId);
  const jogavel = !!onJogar;
  const porDesempenho = p.criterio === "desempenho";

  const conteudo = (
    <>
      <Lado id={p.a} placar={porDesempenho ? undefined : p.placarA} venceu={!!p.vencedor && p.vencedor === p.a} perdeu={!!p.vencedor && p.vencedor !== p.a} pessoas={pessoas} euId={euId} folga={folga} />
      <div className="h-px bg-borda" />
      <Lado id={p.b} placar={porDesempenho ? undefined : p.placarB} venceu={!!p.vencedor && p.vencedor === p.b} perdeu={!!p.vencedor && p.vencedor !== p.b} pessoas={pessoas} euId={euId} folga={folga} />
      {porDesempenho && (
        <span className="absolute -top-2 right-2 inline-flex items-center rounded-full border border-borda bg-superficie px-1.5 text-[11px] font-medium leading-4 text-texto-2" title="Sem duelo: venceu quem tem melhor desempenho (XP e domínio)">
          Por desempenho
        </span>
      )}
      {p.status === "disponivel" && (
        <span className={cn("absolute -top-2 right-2 inline-flex items-center gap-1 rounded-full border px-1.5 text-[11px] font-medium leading-4", jogavel ? "border-acao bg-acao text-white" : "border-borda bg-superficie text-texto-2")}>
          {!jogavel && <PontoAoVivo className="size-1" />}
          {jogavel ? "Jogar" : "Em disputa"}
        </span>
      )}
    </>
  );

  const classe = cn(
    "relative block w-full rounded-xl border bg-superficie text-left",
    minha ? "border-verde" : "border-borda",
    jogavel && "cursor-pointer transition-colors duration-150 hover:bg-superficie-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde",
  );

  return (
    <motion.div className="relative w-full" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, ease: [0.2, 0, 0, 1], delay: Math.min(indice, 20) * 0.02 }}>
      {jogavel ? (
        <button type="button" className={classe} onClick={() => onJogar(p.id)} aria-label="Jogar este duelo">
          {conteudo}
        </button>
      ) : (
        <div className={classe}>{conteudo}</div>
      )}
    </motion.div>
  );
}

function Lado({ id, placar, venceu, perdeu, pessoas, euId, folga }: { id: string | null; placar?: number; venceu: boolean; perdeu: boolean; pessoas: Record<string, Pessoa>; euId: string | null; folga: boolean }) {
  const eu = !!id && id === euId;
  const nome = id ? (eu ? "Você" : primeiroNome(pessoas[id]?.nome ?? id)) : folga ? "Folga" : "A definir";
  return (
    // No toque cada lado tem 44 px (2 × 44 + divisória + bordas = 91 px, cabe na vaga de 92): avatar e nome não disputam a mesma área.
    <div className="flex h-9 items-center gap-2 px-2.5 toque:h-11 toque:gap-2.5">
      {id ? (
        <LinkPessoa id={id} rotulo={`Perfil de ${pessoas[id]?.nome ?? id}`} className="shrink-0">
          <Avatar nome={pessoas[id]?.nome ?? id} iniciais={pessoas[id]?.iniciais} tamanho="xs" className={cn(perdeu && "opacity-80 grayscale")} />
        </LinkPessoa>
      ) : (
        <span className="size-6 shrink-0 rounded-full border border-dashed border-borda" aria-hidden />
      )}
      {/* O link é quem corta com reticências (um pai com `truncate` recortaria a área de toque de 44 px). */}
      {id ? (
        <span className="min-w-0 flex-1">
          <LinkPessoa id={id} className={cn("block w-fit max-w-full truncate text-[13px]", venceu ? "font-medium text-tinta" : perdeu ? "text-texto-2" : "text-texto")}>
            {nome}
          </LinkPessoa>
        </span>
      ) : (
        <span className="min-w-0 flex-1 truncate text-[13px] text-texto-2">{nome}</span>
      )}
      {placar !== undefined && !folga && <span className={cn("text-[13px] tabular-nums", venceu ? "font-medium text-tinta" : "text-texto-2")}>{placar}</span>}
    </div>
  );
}
