"use client";

import { Hourglass, ListOrdered, Sparkles, Swords, Users, Zap, type LucideIcon } from "lucide-react";
import { useMemo } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { CAPAS_CAMPEONATO, nomeDaRodada } from "@/data/campeonatos";
import type { Disciplina } from "@/data/escola";
import { useAgora } from "@/hooks/useAgora";
import { classificacao, nivelDoEstado, partidaDoAluno, participa, totalRodadas, type NivelDe } from "@/lib/campeonatos";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/format";
import { useEstado } from "@/store/store";
import type { Campeonato, CapaCampeonato, FormatoCampeonato, MetricaCampeonato, Pessoa, StatusCampeonato } from "@/store/types";

export const ICONE_FORMATO: Record<FormatoCampeonato, LucideIcon> = {
  "mata-mata": Swords,
  "pontos-corridos": ListOrdered,
  interclasses: Users,
};

export const ICONE_METRICA: Record<MetricaCampeonato, LucideIcon> = { quiz: Zap, foco: Hourglass, xp: Sparkles };

/** Links com cara de botão (mesmas medidas do `Button` do kit; no celular a área de toque chega a 44 px). */
export const LINK_PRIMARIO =
  "alvo-toque inline-flex h-9 shrink-0 select-none items-center justify-center gap-2 rounded-lg bg-acao px-4 text-sm font-medium text-white transition-[background-color,transform] duration-150 hover:bg-acao-2 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde toque:min-w-11 [&_svg]:size-4 [&_svg]:shrink-0";
export const LINK_SECUNDARIO =
  "alvo-toque inline-flex h-9 shrink-0 select-none items-center justify-center gap-2 rounded-lg border border-borda bg-superficie px-4 text-sm font-medium text-tinta transition-[background-color,transform] duration-150 hover:bg-superficie-2 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde toque:min-w-11 [&_svg]:size-4 [&_svg]:shrink-0";

/**
 * Desempate das tabelas (maior XP): o mesmo critério que decide o campeão ao encerrar.
 * Use em `classificacao(c, nivelDe)` para a tabela mostrada e o título coincidirem.
 */
export function useDesempate(disciplina?: Disciplina): NivelDe {
  const estado = useEstado();
  return useMemo(() => nivelDoEstado(estado, disciplina), [estado, disciplina]);
}

export const ROTULO_STATUS: Record<StatusCampeonato, string> = {
  andamento: "Em andamento",
  inscricoes: "Inscrições abertas",
  encerrado: "Encerrado",
};

/**
 * "Jogar" da lista: a tela do campeonato abre o duelo/rodada assim que monta, sem um segundo toque.
 * Guardado em memória (e não na URL) porque o Next só atualiza a URL depois de renderizar a nova tela.
 * O pedido tem validade curta e só é limpo quando o jogo abre ou fecha: sobrevive a montar a tela duas vezes
 * (modo estrito, transição de rota) e não dispara um duelo "velho" mais tarde.
 */
let jogarAoAbrir: { campId: string; em: number } | null = null;
const VALIDADE_PEDIDO_MS = 10_000;

export function pedirJogo(campId: string) {
  jogarAoAbrir = { campId, em: Date.now() };
}

export function jogoPedido(campId: string) {
  return !!jogarAoAbrir && jogarAoAbrir.campId === campId && Date.now() - jogarAoAbrir.em < VALIDADE_PEDIDO_MS;
}

export function limparPedidoDeJogo() {
  jogarAoAbrir = null;
}

/** "9º Ano A" → "9º A" (placares e frases curtas). */
export function turmaCurta(turma: string) {
  return turma.replace(" Ano ", " ");
}

/** "Quartas de final" e "Oitavas de final" são plurais: "nas quartas", "estão liberadas". */
export function fasePlural(fase: string) {
  return /^(Quartas|Oitavas)/.test(fase);
}

/** "na semifinal" / "nas quartas de final". */
export function naFase(fase: string) {
  return `${fasePlural(fase) ? "nas" : "na"} ${fase.toLowerCase()}`;
}

/** "à semifinal" / "às quartas de final". */
export function aFase(fase: string) {
  return `${fasePlural(fase) ? "às" : "à"} ${fase.toLowerCase()}`;
}

/** "a semifinal" / "as quartas de final". */
export function aFaseArtigo(fase: string) {
  return `${fasePlural(fase) ? "as" : "a"} ${fase.toLowerCase()}`;
}

/** "Semifinal liberada" / "Quartas de final liberadas". */
export function faseLiberada(fase: string) {
  return `${fase} ${fasePlural(fase) ? "liberadas" : "liberada"}`;
}

export function ordinal(n: number) {
  return `${n}º`;
}

const MIN = 60_000;
const H = 60 * MIN;
const D = 24 * H;

/** "em 4 dias", "em 5 h", "em 12 min". */
export function emQuanto(ms: number) {
  if (ms >= 2 * D) return `em ${Math.floor(ms / D)} dias`;
  if (ms >= D) return "em 1 dia";
  if (ms >= H) return `em ${Math.floor(ms / H)} h`;
  if (ms >= MIN) return `em ${Math.ceil(ms / MIN)} min`;
  return "em instantes";
}

export function dataCampeonato(ts: number) {
  return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function textoPrazo(c: Campeonato, agora: number) {
  if (c.status === "encerrado") return `Encerrado em ${new Date(c.fim).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;
  if (c.status === "inscricoes") return c.inicio > agora ? `Começa ${emQuanto(c.inicio - agora)}` : "Aguardando início";
  return c.fim > agora ? `Termina ${emQuanto(c.fim - agora)}` : "Encerrando";
}

/** Prazo relativo que se atualiza sozinho (isolado para não re-renderizar a lista inteira). A data exata fica no `title`. */
export function Prazo({ c, className }: { c: Campeonato; className?: string }) {
  const agora = useAgora(60_000);
  const alvo = c.status === "inscricoes" ? c.inicio : c.fim;
  return (
    <span className={className} title={dataCampeonato(alvo)}>
      {textoPrazo(c, agora)}
    </span>
  );
}

/** Partes do prêmio para exibição ("300 pts", "120 XP"). */
export function partesPremio(premio: Campeonato["premio"]) {
  const partes: string[] = [];
  if (premio.pontos > 0) partes.push(`${fmt(premio.pontos)} pontos`);
  if (premio.xp > 0) partes.push(`${fmt(premio.xp)} XP`);
  return partes;
}

/** Prêmio em uma linha: "300 pontos · 120 XP", "Título: Rei do Fundão" ou "Vale o título". */
export function textoPremio(premio: Campeonato["premio"]) {
  const partes = partesPremio(premio);
  if (partes.length) return partes.join(" · ");
  return premio.titulo ? `Título: ${premio.titulo}` : "Vale o título";
}

export interface Situacao {
  texto: string;
  tom: "ouro" | "verde" | "neutro" | "alerta";
}

/** Cor do texto da situação da aluna (sem pílulas coloridas: ponto + texto). */
export const COR_SITUACAO: Record<Situacao["tom"], string> = {
  ouro: "text-ouro",
  verde: "text-acento",
  neutro: "text-texto-2",
  alerta: "text-alerta",
};

/** Rodada em que a aluna caiu no mata-mata (se caiu). */
export function eliminacao(c: Campeonato, alunoId: string) {
  const derrota = c.partidas.find((p) => p.status === "encerrada" && p.a && p.b && (p.a === alunoId || p.b === alunoId) && p.vencedor !== alunoId);
  return derrota ? nomeDaRodada(derrota.rodada, totalRodadas(c)) : null;
}

/** Frase curta com a situação da aluna no campeonato ("Você está em 2º", "Semifinal liberada"). */
export function situacaoDaAluna(c: Campeonato, alunoId: string, turma: string, nivelDe?: NivelDe): Situacao | null {
  if (!participa(c, alunoId, turma)) return null;
  const interclasses = c.formato === "interclasses";
  const chave = interclasses ? turma : alunoId;

  if (c.status === "inscricoes") return { texto: interclasses ? "Sua turma está inscrita" : "Você está inscrita", tom: "verde" };

  if (c.status === "encerrado") {
    if (c.campeao === chave) return { texto: interclasses ? "Sua turma venceu" : "Você é a campeã", tom: "ouro" };
    if (c.formato === "mata-mata") {
      const caiu = eliminacao(c, alunoId);
      return { texto: caiu ? `Parou ${naFase(caiu)}` : "Participou", tom: "neutro" };
    }
    const pos = classificacao(c, nivelDe).find((l) => l.id === chave)?.posicao;
    return pos ? { texto: interclasses ? `Sua turma terminou em ${ordinal(pos)}` : `Você terminou em ${ordinal(pos)}`, tom: "neutro" } : null;
  }

  if (c.formato === "mata-mata") {
    const partida = partidaDoAluno(c, alunoId);
    if (partida) return { texto: faseLiberada(nomeDaRodada(partida.rodada, totalRodadas(c))), tom: "verde" };
    const caiu = eliminacao(c, alunoId);
    if (caiu) return { texto: `Eliminada ${naFase(caiu)}`, tom: "alerta" };
    return { texto: "Aguardando adversário", tom: "neutro" };
  }

  const pos = classificacao(c, nivelDe).find((l) => l.id === chave)?.posicao;
  if (!pos) return null;
  return { texto: interclasses ? `Sua turma está em ${ordinal(pos)}` : `Você está em ${ordinal(pos)}`, tom: pos === 1 ? "ouro" : "verde" };
}

/** Ponto na cor de identidade da capa. */
export function PontoCapa({ capa, className }: { capa: CapaCampeonato; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2 shrink-0 rounded-full", className)} style={{ background: CAPAS_CAMPEONATO[capa].brilho }} />;
}

/** Ponto "ao vivo" (o único elemento que pulsa). */
export function PontoAoVivo({ className }: { className?: string }) {
  return <span aria-hidden className={cn("inline-block size-1.5 shrink-0 animate-pulso rounded-full bg-verde", className)} />;
}

const TOM_MEDALHA = ["bg-ouro-claro text-ouro", "bg-superficie-2 text-texto-2 ring-1 ring-inset ring-borda", "bg-amber-50 text-ouro"];

/** Medalha pequena de posição (1º ouro, 2º cinza, 3º âmbar); acima disso, só o número. */
export function Medalha({ posicao, className }: { posicao: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-semibold tabular-nums",
        posicao <= 3 ? TOM_MEDALHA[posicao - 1] : "text-texto-2",
        className,
      )}
      aria-label={`${posicao}º lugar`}
    >
      {posicao}
    </span>
  );
}

/** Pilha de avatares sobrepostos com "+N". */
export function PilhaAvatares({ ids, pessoas, max = 4, className }: { ids: string[]; pessoas: Record<string, Pessoa>; max?: number; className?: string }) {
  const visiveis = ids.slice(0, max);
  const resto = ids.length - visiveis.length;
  return (
    <span className={cn("flex items-center", className)}>
      {visiveis.map((id, i) => (
        <span key={id} className={cn("rounded-full ring-2 ring-superficie", i > 0 && "-ml-1.5")}>
          <Avatar nome={pessoas[id]?.nome ?? id} iniciais={pessoas[id]?.iniciais} tamanho="xs" />
        </span>
      ))}
      {resto > 0 && (
        <span className="-ml-1.5 grid h-6 min-w-6 place-items-center rounded-full bg-superficie-2 px-1 text-[10px] font-medium tabular-nums text-texto-2 ring-2 ring-superficie">+{resto}</span>
      )}
    </span>
  );
}
