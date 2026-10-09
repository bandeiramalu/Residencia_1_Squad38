"use client";

import { m as motion } from "motion/react";
import { Avatar } from "@/components/ui/Avatar";
import { LinkPessoa } from "@/components/ui/LinkPessoa";
import { Badge } from "@/components/ui/Badge";
import { ROTULO_METRICA } from "@/data/campeonatos";
import { classificacao, empateNoTopo, partidasDaRodada, totalRodadas, type NivelDe } from "@/lib/campeonatos";
import { cn } from "@/lib/cn";
import { fmt, primeiroNome } from "@/lib/format";
import type { Campeonato, Pessoa } from "@/store/types";
import { Medalha, ordinal, turmaCurta, useDesempate } from "./comum";

const ENTRADA = { duration: 0.18, ease: [0.2, 0, 0, 1] } as const;

/** Tabela de classificação (pontos corridos) com a aluna destacada e a distância para quem está à frente. */
export function TabelaClassificacao({ c, pessoas, euId }: { c: Campeonato; pessoas: Record<string, Pessoa>; euId: string | null }) {
  const nivelDe = useDesempate(c.disciplina);
  const linhas = classificacao(c, nivelDe);
  const unidade = ROTULO_METRICA[c.metrica].unidade;
  const comEmpate = linhas.some((l, i) => i > 0 && l.pontos === linhas[i - 1].pontos);

  return (
    <div className="overflow-hidden rounded-2xl border border-borda bg-superficie">
      <div className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-borda px-4 py-2 text-[12px] text-texto-2" aria-hidden>
        <span className="text-center">#</span>
        <span>Participante</span>
        <span>{unidade === "pts" ? "Pontos" : unidade}</span>
      </div>
      <ol className="divide-y divide-borda">
        {linhas.map((l, i) => {
          const eu = l.id === euId;
          const acima = i > 0 ? linhas[i - 1] : null;
          return (
            <motion.li
              key={l.id}
              layout="position"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...ENTRADA, delay: Math.min(i, 12) * 0.02 }}
              className={cn("grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5", eu && "bg-verde-mclaro")}
            >
              <Medalha posicao={l.posicao} className="mx-auto" />
              <span className="flex min-w-0 items-center gap-2.5">
                <LinkPessoa id={l.id} rotulo={`Perfil de ${pessoas[l.id]?.nome ?? l.id}`} className="shrink-0">
                  <Avatar nome={pessoas[l.id]?.nome ?? l.id} iniciais={pessoas[l.id]?.iniciais} tamanho="sm" />
                </LinkPessoa>
                {/* A privacidade dos rankings vale para a aluna; aqui, para quem joga com ela, a linha dela diz "Você". */}
                {eu ? (
                  <span className="truncate text-[14px] font-medium text-tinta">Você</span>
                ) : (
                  <LinkPessoa id={l.id} className="truncate text-[14px] text-texto">{pessoas[l.id]?.nome ?? l.id}</LinkPessoa>
                )}
              </span>
              <span className="text-right">
                <span className="block text-[14px] font-medium tabular-nums text-tinta">{fmt(l.pontos)}</span>
                {eu && acima && <span className="block text-[12px] tabular-nums text-texto-2">−{fmt(acima.pontos - l.pontos)} do {ordinal(acima.posicao)}</span>}
              </span>
            </motion.li>
          );
        })}
      </ol>
      {comEmpate && <p className="border-t border-borda px-4 py-2.5 text-[12px] text-texto-2">Desempate: maior XP.</p>}
    </div>
  );
}

/** Placar do interclasses: linhas com barra fina relativa à turma líder; a turma da aluna em verde. */
export function PlacarTurmas({ c, turma }: { c: Campeonato; turma: string | null }) {
  const nivelDe = useDesempate(c.disciplina);
  const linhas = classificacao(c, nivelDe);
  const lider = linhas[0]?.pontos || 1;
  const unidade = ROTULO_METRICA[c.metrica].unidade;
  const comEmpate = linhas.some((l, i) => i > 0 && l.pontos === linhas[i - 1].pontos);

  return (
    <>
      <ol className="divide-y divide-borda">
        {linhas.map((l, i) => {
          const minha = l.id === turma;
          const pct = Math.max(2, (l.pontos / lider) * 100);
          return (
            <li key={l.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <Medalha posicao={l.posicao} />
                <span className={cn("min-w-0 flex-1 truncate text-[14px]", minha ? "font-medium text-tinta" : "text-texto")}>{l.id}</span>
                {minha && <Badge tom="claro">Sua turma</Badge>}
                <span className="shrink-0 text-[14px] font-medium tabular-nums text-tinta">
                  {fmt(l.pontos)} <span className="text-[12px] font-normal text-texto-2">{unidade}</span>
                </span>
              </div>
              <div className="ml-9 mt-2 h-1.5 overflow-hidden rounded-full bg-superficie-2">
                <motion.div
                  className={cn("h-full rounded-full", minha ? "bg-verde" : "bg-texto-2/35")}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: [0.2, 0, 0, 1], delay: i * 0.04 }}
                />
              </div>
            </li>
          );
        })}
      </ol>
      {comEmpate && <p className="mt-3 border-t border-borda pt-3 text-[12px] text-texto-2">Desempate: maior XP.</p>}
    </>
  );
}

/** Frase de disputa do interclasses: quanto falta para a turma da aluna passar a da frente. */
export function fraseDaDisputa(c: Campeonato, turma: string, nivelDe?: NivelDe) {
  const linhas = classificacao(c, nivelDe);
  const minha = linhas.find((l) => l.id === turma);
  if (!minha) return null;
  const unidade = c.metrica === "foco" ? "min" : "XP";
  if (minha.posicao === 1) {
    const segunda = linhas[1];
    return segunda ? `O ${turmaCurta(turma)} lidera por ${fmt(minha.pontos - segunda.pontos)} ${unidade}` : `O ${turmaCurta(turma)} lidera`;
  }
  const acima = linhas[minha.posicao - 2];
  return `Faltam ${fmt(acima.pontos - minha.pontos + 1)} ${unidade} para o ${turmaCurta(turma)} passar o ${turmaCurta(acima.id)}`;
}

interface Degrau {
  id: string;
  valor?: string;
}

/** Top 3 de um campeonato encerrado. No mata-mata: campeão, vice e o melhor semifinalista. */
function top3(c: Campeonato, nivelDe: NivelDe): Degrau[] {
  const unidade = ROTULO_METRICA[c.metrica].unidade;
  if (c.formato !== "mata-mata") {
    if (!c.campeao) return [];
    return classificacao(c, nivelDe).slice(0, 3).map((l) => ({ id: l.id, valor: `${fmt(l.pontos)} ${unidade}` }));
  }
  const rodadas = totalRodadas(c);
  const final = partidasDaRodada(c, rodadas - 1)[0];
  const campeao = c.campeao ?? final?.vencedor;
  if (!campeao) return [];
  const vice = final && (final.a === campeao ? final.b : final.a);
  const semis = rodadas >= 2 ? partidasDaRodada(c, rodadas - 2) : [];
  const terceiro = semis
    .filter((p) => p.vencedor && p.a && p.b)
    .map((p) => ({ id: p.vencedor === p.a ? p.b! : p.a!, acertos: (p.vencedor === p.a ? p.placarB : p.placarA) ?? 0 }))
    .sort((a, b) => b.acertos - a.acertos)[0];
  const placarFinal = final?.criterio === "desempenho" ? "final decidida por desempenho" : final?.placarA !== undefined ? `${Math.max(final.placarA ?? 0, final.placarB ?? 0)} × ${Math.min(final.placarA ?? 0, final.placarB ?? 0)} na final` : undefined;
  return [{ id: campeao, valor: placarFinal }, ...(vice ? [{ id: vice, valor: "Vice" }] : []), ...(terceiro ? [{ id: terceiro.id, valor: "Semifinal" }] : [])];
}

/** Pódio simples: 1º, 2º e 3º lado a lado, com medalhas pequenas. */
export function Podio({ c, pessoas, euId, turma }: { c: Campeonato; pessoas: Record<string, Pessoa>; euId: string | null; turma: string | null }) {
  const nivelDe = useDesempate(c.disciplina);
  const degraus = top3(c, nivelDe);
  if (!degraus.length) return null;
  const interclasses = c.formato === "interclasses";
  const campeao = degraus[0];
  const souCampea = campeao.id === euId || (interclasses && campeao.id === turma);
  const nomeCampeao = interclasses ? campeao.id : (pessoas[campeao.id]?.nome ?? campeao.id);

  return (
    <section className="rounded-2xl border border-borda bg-superficie p-4 sm:p-5" aria-label="Pódio">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-[15px] font-semibold text-tinta">{souCampea ? (interclasses ? "Sua turma é campeã" : "Você é a campeã") : `Campeão: ${nomeCampeao}`}</h2>
        {c.premio.titulo && <span className="text-[13px] text-texto-2">Título: {c.premio.titulo}</span>}
      </div>
      {c.formato !== "mata-mata" && empateNoTopo(c) && <p className="-mt-2 mb-3 text-[12px] text-texto-2">Desempate: maior XP.</p>}
      <ol className={cn("grid gap-2", degraus.length === 3 ? "grid-cols-3" : degraus.length === 2 ? "grid-cols-2" : "grid-cols-1")}>
        {degraus.map((d, i) => {
          const eu = d.id === euId || (interclasses && d.id === turma);
          const nome = eu ? "Você" : interclasses ? turmaCurta(d.id) : primeiroNome(pessoas[d.id]?.nome ?? d.id);
          return (
            <motion.li
              key={d.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...ENTRADA, delay: i * 0.05 }}
              className={cn("flex min-w-0 flex-col items-center rounded-xl border px-2 py-3 text-center", eu ? "border-verde bg-verde-mclaro" : "border-borda")}
            >
              {interclasses ? (
                <span className="grid size-10 place-items-center rounded-full bg-superficie-2 text-[13px] font-medium text-tinta">{d.id.replace("º Ano ", "").replace("ª Série ", "")}</span>
              ) : (
                <LinkPessoa id={d.id} rotulo={`Perfil de ${pessoas[d.id]?.nome ?? d.id}`}>
                  <Avatar nome={pessoas[d.id]?.nome ?? d.id} iniciais={pessoas[d.id]?.iniciais} tamanho="md" />
                </LinkPessoa>
              )}
              <p className={cn("mt-2 flex w-full min-w-0 items-center justify-center gap-1.5 text-[13px]", i === 0 ? "font-medium text-tinta" : "text-texto")}>
                <Medalha posicao={i + 1} className="size-5 text-[11px]" />
                {interclasses ? <span className="truncate">{nome}</span> : <LinkPessoa id={d.id} className="truncate">{nome}</LinkPessoa>}
              </p>
              {d.valor && <p className="w-full truncate text-[12px] text-texto-2">{d.valor}</p>}
            </motion.li>
          );
        })}
      </ol>
    </section>
  );
}

/** Inscritos (antes do início): avatar + nome, a aluna primeiro e as vagas restantes. */
export function ListaInscritos({ c, pessoas, euId }: { c: Campeonato; pessoas: Record<string, Pessoa>; euId: string | null }) {
  if (c.formato === "interclasses") {
    return (
      <div className="flex flex-wrap gap-1.5">
        {c.participantes.map((t) => (
          <Badge key={t} tom="contorno" className="px-2.5 py-1 text-[13px]">
            {t}
          </Badge>
        ))}
      </div>
    );
  }
  const ids = [...c.participantes].sort((a, b) => Number(b === euId) - Number(a === euId));
  const vagas = Math.max(0, c.maxParticipantes - c.participantes.length);
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
      {ids.map((id, i) => (
        <motion.li key={id} layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...ENTRADA, delay: Math.min(i, 16) * 0.015 }} className="flex min-w-0 items-center gap-2.5">
          <LinkPessoa id={id} rotulo={`Perfil de ${pessoas[id]?.nome ?? id}`} className="shrink-0">
            <Avatar nome={pessoas[id]?.nome ?? id} iniciais={pessoas[id]?.iniciais} tamanho="sm" />
          </LinkPessoa>
          <LinkPessoa id={id} className={cn("truncate text-[14px]", id === euId ? "font-medium text-tinta" : "text-texto")}>{id === euId ? "Você" : primeiroNome(pessoas[id]?.nome ?? id)}</LinkPessoa>
        </motion.li>
      ))}
      {Array.from({ length: Math.min(vagas, 3) }, (_, i) => (
        <li key={`vaga-${i}`} className="flex items-center gap-2.5 text-[14px] text-texto-2">
          <span className="size-8 shrink-0 rounded-full border border-dashed border-borda" aria-hidden />
          Vaga livre
        </li>
      ))}
    </ul>
  );
}
