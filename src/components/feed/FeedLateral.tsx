"use client";

import { BellRing, ChevronRight, Coins, Lock } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { DisciplinaIcon } from "@/components/ui/DisciplinaIcon";
import { LinkPessoa } from "@/components/ui/LinkPessoa";
import { EVENTOS } from "@/data/calendario";
import { CAPAS_CAMPEONATO, nomeDaRodada } from "@/data/campeonatos";
import { useAgora } from "@/hooks/useAgora";
import { nomeParticipante, participa, partidaDoAluno, totalRodadas } from "@/lib/campeonatos";
import { cn } from "@/lib/cn";
import { faseDaSala } from "@/lib/estudos";
import { fmt, primeiroNome } from "@/lib/format";
import { inicioDoDia, somarDias } from "@/lib/tempo";
import { useSeletor } from "@/store/store";

/**
 * Coluna lateral do Feed em telas largas: atalhos vivos para o resto do portal.
 * Cada widget lê só a fatia do estado que usa (`useSeletor`), então curtir ou
 * responder no feed não re-renderiza a coluna.
 */
export function FeedLateral() {
  return (
    <div className="space-y-4">
      <CampeonatoDestaque />
      <EstudandoAgora />
      <ProximasProvas />
    </div>
  );
}

function Widget({ titulo, extra, children, link, className }: { titulo: string; extra?: ReactNode; children: ReactNode; link?: { href: string; rotulo: string }; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-borda bg-superficie p-4", className)} aria-label={titulo}>
      <header className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[14px] font-semibold text-tinta">{titulo}</h2>
        {extra}
      </header>
      {children}
      {link && (
        <Link
          href={link.href}
          className="group -mx-2 mt-2 flex items-center justify-between rounded-lg px-2 py-1.5 text-[13px] font-medium text-texto-2 transition-colors duration-150 hover:bg-superficie-2 hover:text-tinta"
        >
          {link.rotulo}
          <ChevronRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
        </Link>
      )}
    </section>
  );
}

/* ───────────── Campeonato em destaque ───────────── */

function CampeonatoDestaque() {
  const campeonatos = useSeletor((e) => e.campeonatos);
  const pessoas = useSeletor((e) => e.pessoas);
  const eu = useSeletor((e) => e.usuario.id);
  const turma = useSeletor((e) => e.usuario.turma);

  let camp = campeonatos.find((c) => c.status === "andamento" && partidaDoAluno(c, eu));
  const partida = camp ? partidaDoAluno(camp, eu) : undefined;
  camp ??= campeonatos.find((c) => c.status === "andamento" && participa(c, eu, turma)) ?? campeonatos.find((c) => c.status === "inscricoes");
  if (!camp) return null;

  const capa = CAPAS_CAMPEONATO[camp.capa];
  const rivalId = partida ? (partida.a === eu ? partida.b : partida.a) : null;
  const rival = partida ? nomeParticipante(rivalId, pessoas) : null;
  const cta = partida ? "Jogar duelo" : camp.status === "inscricoes" ? "Ver inscrições" : "Ver classificação";
  const premio = [camp.premio.pontos > 0 && `${fmt(camp.premio.pontos)} pts`, camp.premio.xp > 0 && `${fmt(camp.premio.xp)} XP`].filter(Boolean).join(" + ");

  return (
    <section aria-label="Campeonato em destaque" className="overflow-hidden rounded-2xl border border-borda bg-superficie">
      {/* Cor de identidade do campeonato: só uma faixa fina no topo. */}
      <div className="h-[3px]" style={{ background: capa.brilho }} aria-hidden />
      <div className="p-4">
        <p className="text-[12.5px] text-texto-2">Campeonato em destaque</p>
        <Link href={`/campeonatos/${camp.id}`} className="mt-0.5 block text-[15px] font-semibold leading-snug text-tinta hover:underline">
          {camp.nome}
        </Link>

        {partida && rival ? (
          <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-superficie-2 px-3 py-2.5">
            <span className="flex -space-x-2">
              <LinkPessoa id={eu} rotulo="Seu perfil">
                <Avatar nome={pessoas[eu]?.nome ?? "Você"} iniciais={pessoas[eu]?.iniciais} tamanho="sm" className="rounded-full ring-2 ring-superficie-2" />
              </LinkPessoa>
              {rivalId && pessoas[rivalId] ? (
                <LinkPessoa id={rivalId} rotulo={rival}>
                  <Avatar nome={rival} iniciais={pessoas[rivalId].iniciais} tamanho="sm" className="rounded-full ring-2 ring-superficie-2" />
                </LinkPessoa>
              ) : (
                <Avatar nome={rival} tamanho="sm" className="rounded-full ring-2 ring-superficie-2" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium text-tinta">Você vs. {primeiroNome(rival)}</span>
              <span className="block truncate text-[12px] text-texto-2">{nomeDaRodada(partida.rodada, totalRodadas(camp))} · partida liberada</span>
            </span>
          </div>
        ) : (
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-texto-2">{camp.descricao}</p>
        )}

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-[12.5px] tabular-nums text-texto-2">
            {premio ? (
              <>
                <Coins className="size-3.5 shrink-0 text-ambar" /> {premio}
              </>
            ) : (
              "Amistoso"
            )}
          </span>
          <Link
            href={`/campeonatos/${camp.id}`}
            className={cn(
              "inline-flex h-8 shrink-0 items-center rounded-lg px-3 text-[13px] font-medium transition-colors duration-150 active:scale-[0.98]",
              partida ? "bg-verde text-white hover:bg-verde-2" : "border border-borda bg-superficie text-tinta hover:bg-superficie-2",
            )}
          >
            {cta}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ───────────── Estudando agora (salas abertas com gente dentro) ───────────── */

function EstudandoAgora() {
  const salas = useSeletor((e) => e.salas);
  const salaAtual = useSeletor((e) => e.salaAtual);
  const agora = useAgora(60_000);

  const abertas = salas
    .map((s) => ({ s, fase: faseDaSala(s, agora), pessoas: s.membros.length + (s.id === salaAtual ? 1 : 0) }))
    .filter(({ s, fase, pessoas }) => fase.aberta && pessoas > 0 && (!s.privada || s.id === salaAtual));
  const total = abertas.reduce((n, a) => n + a.pessoas, 0);
  const destaque = abertas.sort((a, b) => Number(b.s.id === salaAtual) - Number(a.s.id === salaAtual) || b.pessoas - a.pessoas).slice(0, 3);

  return (
    <Widget
      titulo="Estudando agora"
      extra={
        total > 0 && (
          <span className="flex items-center gap-1.5 text-[12px] tabular-nums text-texto-2">
            <span className="relative flex size-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-verde/50" />
              <span className="relative size-2 rounded-full bg-verde" />
            </span>
            {total} ao vivo
          </span>
        )
      }
      link={{ href: "/estudos/salas", rotulo: "Ver todas as salas" }}
    >
      {destaque.length === 0 ? (
        <p className="text-[13px] text-texto-2">Nenhuma sala aberta agora.</p>
      ) : (
        <ul className="-mx-2">
          {destaque.map(({ s, fase, pessoas }) => (
            <li key={s.id}>
              <Link href={`/estudos/salas/${s.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors duration-150 hover:bg-superficie-2">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-superficie-2 text-texto-2 ring-1 ring-inset ring-borda">
                  {s.privada ? <Lock className="size-4" /> : <DisciplinaIcon disciplina={s.disciplina} className="size-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium text-tinta">{s.nome}</span>
                  <span className="flex items-center gap-1.5 text-[12px] text-texto-2">
                    <span className={cn("size-1.5 shrink-0 rounded-full", fase.fase === "foco" ? "bg-verde" : "bg-ambar")} />
                    {fase.fase === "foco" ? "Em foco" : "Na pausa"} · <span className="tabular-nums">{pessoas}</span> {pessoas === 1 ? "pessoa" : "pessoas"}
                  </span>
                </span>
                {s.id === salaAtual && <span className="shrink-0 text-[12px] font-medium text-acento">Você está aqui</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Widget>
  );
}

/* ───────────── Próximas provas ───────────── */

function ProximasProvas() {
  const lembretes = useSeletor((e) => e.lembretes);
  const agora = useAgora(60_000);
  const hoje = inicioDoDia(agora);
  const provas = EVENTOS.filter((e) => e.tipo === "prova" && e.emDias >= 0)
    .sort((a, b) => a.emDias - b.emDias)
    .slice(0, 3);

  return (
    <Widget titulo="Próximas provas" link={{ href: "/estudos", rotulo: "Planejar a revisão" }}>
      <ul className="space-y-3">
        {provas.map((e) => {
          const dia = new Date(somarDias(hoje, e.emDias));
          return (
            <li key={e.id} className="flex items-center gap-3">
              <span className="grid w-10 shrink-0 place-items-center rounded-lg border border-borda py-1 text-center">
                <span className="text-[10.5px] capitalize leading-4 text-texto-2">{dia.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</span>
                <span className="text-[15px] font-semibold leading-5 tabular-nums text-tinta">{dia.getDate()}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-[13.5px] font-medium leading-snug text-tinta">{e.titulo}</span>
                <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-texto-2">
                  {e.emDias === 0 ? "hoje" : e.emDias === 1 ? "amanhã" : `em ${e.emDias} dias`} · {e.hora}
                  {lembretes.includes(e.id) && <BellRing className="size-3 text-texto-2" aria-label="Lembrete ativo" />}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </Widget>
  );
}
