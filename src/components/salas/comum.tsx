"use client";

import { Bell, BellRing, Check, Copy, Share2 } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { DisciplinaIcon } from "@/components/ui/DisciplinaIcon";
import { TEMAS_SALA } from "@/data/salas";
import { useAgora } from "@/hooks/useAgora";
import { cn } from "@/lib/cn";
import { faseDaSala, formatarRelogio, inicioDoDia } from "@/lib/estudos";
import { contagemRegressiva } from "@/lib/tempo";
import { alternarLembrete } from "@/store/actions";
import { useSeletor } from "@/store/store";
import type { Pessoa, SalaEstudo, TemaSala } from "@/store/types";
import { toast } from "@/store/ui";

export type FaseCiclo = "foco" | "pausa";
export type StatusMembro = "foco" | "pausa";

/** Cores do anel (tokens): foco é verde (estado ativo), pausa é âmbar, pausado é neutro. */
export const COR_FOCO = "var(--color-verde)";
export const COR_PAUSA = "var(--color-ambar)";
export const COR_PAUSADO = "var(--color-texto-2)";
export const TRILHO = "var(--color-borda)";

export const REACOES = ["🔥", "👏", "💪", "☕", "🎯"] as const;

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Status de cada membro, determinístico: a maioria acompanha a fase da sala e
 * alguns "fogem" do ritmo; muda a cada ciclo para a grade parecer viva.
 */
export function statusMembro(id: string, fase: FaseCiclo, ciclo: number): StatusMembro {
  const h = hash(`${id}:${ciclo}`);
  if (fase === "foco") return h % 8 === 0 ? "pausa" : "foco";
  return h % 6 === 0 ? "foco" : "pausa";
}

export function contarStatus(membros: string[], fase: FaseCiclo, ciclo: number) {
  let foco = 0;
  for (const id of membros) if (statusMembro(id, fase, ciclo) === "foco") foco++;
  return { foco, pausa: membros.length - foco };
}

/* ───────────── Fase da sala sem re-render a cada segundo ───────────── */

const ouvintesSegundo = new Set<() => void>();
let intervaloSegundo: ReturnType<typeof setInterval> | undefined;

function assinarSegundo(ouvinte: () => void) {
  ouvintesSegundo.add(ouvinte);
  intervaloSegundo ??= setInterval(() => ouvintesSegundo.forEach((o) => o()), 1000);
  return () => {
    ouvintesSegundo.delete(ouvinte);
    if (!ouvintesSegundo.size && intervaloSegundo) {
      clearInterval(intervaloSegundo);
      intervaloSegundo = undefined;
    }
  };
}

function leitorDeFase(sala: SalaEstudo | undefined) {
  return () => {
    if (!sala) return "";
    const f = faseDaSala(sala, Date.now());
    return `${f.aberta ? 1 : 0}|${f.fase}|${f.ciclo}`;
  };
}

const semFase = () => "";

/**
 * Fase/ciclo/abertura da sala. Confere a cada segundo, mas só re-renderiza quando
 * a fase vira (a chave em texto é comparada por valor) — a grade de presença e os
 * contadores não repintam junto com o relógio.
 */
export function useFaseDaSala(sala: SalaEstudo | undefined) {
  const chave = useSyncExternalStore(assinarSegundo, leitorDeFase(sala), semFase);
  const [aberta, fase, ciclo] = chave.split("|");
  return { aberta: aberta === "1", fase: (fase === "pausa" ? "pausa" : "foco") as FaseCiclo, ciclo: Number(ciclo) || 1 };
}

/* ───────────── Salas privadas liberadas por código (vale até recarregar) ───────────── */

let liberadas = new Set<string>();
const ouvintesLiberadas = new Set<() => void>();

export function liberarSala(id: string) {
  if (liberadas.has(id)) return;
  liberadas = new Set(liberadas).add(id);
  ouvintesLiberadas.forEach((o) => o());
}

function assinarLiberadas(ouvinte: () => void) {
  ouvintesLiberadas.add(ouvinte);
  return () => {
    ouvintesLiberadas.delete(ouvinte);
  };
}

export function useSalaLiberada(id: string) {
  return useSyncExternalStore(
    assinarLiberadas,
    () => liberadas.has(id),
    () => false,
  );
}

/* ───────────── Formatação ───────────── */

export function horaCurta(ts: number) {
  return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** "Hoje · 19:00", "Amanhã · 19:00", "qua., 02/10 · 19:00". */
export function quandoAbre(ts: number, agora: number) {
  const dias = Math.round((inicioDoDia(ts) - inicioDoDia(agora)) / 86_400_000);
  const dia = dias === 0 ? "Hoje" : dias === 1 ? "Amanhã" : new Date(ts).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
  return `${dia} · ${horaCurta(ts)}`;
}

/** "abre em 2 dias", "abre em 5h 20", "abre em 12 min". */
export function faltaParaAbrir(ts: number, agora: number) {
  const { dias, horas, minutos } = contagemRegressiva(ts - agora);
  if (dias >= 1) return `abre em ${dias} ${dias === 1 ? "dia" : "dias"}`;
  if (horas >= 1) return `abre em ${horas}h ${String(minutos).padStart(2, "0")}`;
  return minutos >= 1 ? `abre em ${minutos} min` : "abre em instantes";
}

export function rotuloRitmo(sala: Pick<SalaEstudo, "focoMin" | "pausaMin">) {
  return `${sala.focoMin}/${sala.pausaMin} min`;
}

export function agendadaFechada(sala: SalaEstudo, agora: number) {
  return !!sala.agendadaPara && sala.agendadaPara > agora;
}

/* ───────────── Peças visuais ───────────── */

/** Marcador de cor da sala: a identidade aparece só como um ponto. */
export function PontoSala({ tema, className }: { tema: TemaSala; className?: string }) {
  return <span className={cn("inline-block size-2 shrink-0 rounded-full", className)} style={{ background: TEMAS_SALA[tema].cor }} aria-hidden />;
}

/** "Avatar" da sala (como o ícone de um grupo): ícone da disciplina + ponto com a cor da sala. */
export function IconeSala({ sala, tamanho = "md" }: { sala: Pick<SalaEstudo, "disciplina" | "tema">; tamanho?: "md" | "lg" }) {
  return (
    <span className={cn("relative grid shrink-0 place-items-center rounded-xl border border-borda bg-superficie-2 text-texto-2", tamanho === "lg" ? "size-12 [&_svg]:size-5" : "size-10 [&_svg]:size-[18px]")}>
      <DisciplinaIcon disciplina={sala.disciplina} />
      <PontoSala tema={sala.tema} className="absolute -bottom-0.5 -right-0.5 size-2.5 ring-2 ring-superficie" />
    </span>
  );
}

/**
 * "Em foco · 12:30" / "Pausa · 03:10" do ciclo da sala. O ponto verde pulsando é o único
 * elemento animado contínuo da lista. Isolado: só ele re-renderiza a cada segundo.
 */
export function FaseAoVivo({ sala, className }: { sala: SalaEstudo; className?: string }) {
  const agora = useAgora(1000);
  const f = faseDaSala(sala, agora);
  const pausa = f.fase === "pausa";
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[12px] font-medium tabular-nums text-texto-2", className)}>
      <span className={cn("size-1.5 shrink-0 rounded-full", pausa ? "bg-ambar" : "animate-pulso bg-verde")} aria-hidden />
      <span>
        <span className={pausa ? "text-ambar" : "text-acento"}>{pausa ? "Pausa" : "Em foco"}</span> · {formatarRelogio(f.restanteMs)}
      </span>
    </span>
  );
}

/** Contagem regressiva (dias/horas/min/seg) até a abertura de uma sala agendada. */
export function ContagemAbertura({ ate, className }: { ate: number; className?: string }) {
  const agora = useAgora(1000);
  const { dias, horas, minutos, segundos } = contagemRegressiva(ate - agora);
  const blocos = [
    ...(dias ? [{ v: dias, r: dias === 1 ? "dia" : "dias" }] : []),
    { v: horas, r: "h" },
    { v: minutos, r: "min" },
    { v: segundos, r: "s" },
  ];
  return (
    <div className={cn("flex items-start justify-center gap-2", className)} role="timer" aria-label="Tempo até a sala abrir">
      {blocos.map((b) => (
        <span key={b.r} className="grid min-w-14 place-items-center rounded-xl border border-borda bg-superficie-2 px-2.5 py-2">
          <span className="text-[24px] font-light leading-none tabular-nums tracking-tight text-tinta">{String(b.v).padStart(2, "0")}</span>
          <span className="mt-1 text-[11px] text-texto-2">{b.r}</span>
        </span>
      ))}
    </div>
  );
}

/** Pilha de avatares sobrepostos ("quem está aqui"). */
export function PilhaAvatares({ ids, pessoas, max = 4 }: { ids: string[]; pessoas: Record<string, Pessoa>; max?: number }) {
  const visiveis = ids.slice(0, max);
  const resto = ids.length - visiveis.length;
  if (!ids.length) return null;
  return (
    <span className="flex items-center -space-x-1.5">
      {visiveis.map((id) => (
        <span key={id} className="flex rounded-full ring-2 ring-superficie">
          <Avatar nome={pessoas[id]?.nome ?? "Colega"} iniciais={pessoas[id]?.iniciais} tamanho="xs" />
        </span>
      ))}
      {resto > 0 && (
        <span className="relative grid h-6 min-w-6 place-items-center rounded-full bg-superficie-2 px-1 text-[10px] font-medium tabular-nums text-texto-2 ring-2 ring-superficie">
          +{resto}
        </span>
      )}
    </span>
  );
}

/** Copia o código de convite; o ícone vira um check por um instante. */
export function BotaoCopiar({ texto, className, rotulo = "Copiar código" }: { texto: string; className?: string; rotulo?: string }) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1600);
      toast({ tipo: "info", titulo: "Código copiado", mensagem: `${texto} · mande para quem vai estudar com você.` }, 2400);
    } catch {
      toast({ tipo: "alerta", titulo: "Não deu para copiar", mensagem: `Anote o código: ${texto}` }, 3000);
    }
  };

  return (
    <button type="button" onClick={copiar} aria-label={`${rotulo} ${texto}`} title="Copiar código" className={className}>
      <span className="font-mono tracking-wide">{texto}</span>
      {copiado ? <Check aria-hidden className="text-acento" /> : <Copy aria-hidden />}
    </button>
  );
}

/** "Lembrar-me" de uma sala agendada — usa os lembretes do estado (persistem). */
export function BotaoLembrar({ sala, className }: { sala: SalaEstudo; className?: string }) {
  const chave = `sala:${sala.id}`;
  const ativo = useSeletor((e) => e.lembretes.includes(chave));
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={() => alternarLembrete(chave, `“${sala.nome}” · avisamos quando a sala abrir.`)}
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium transition-colors duration-150 active:scale-[0.98] [&_svg]:size-4",
        ativo ? "border-verde-claro bg-verde-mclaro text-acento" : "border-borda bg-superficie text-tinta hover:bg-superficie-2",
        className,
      )}
    >
      {ativo ? <BellRing aria-hidden /> : <Bell aria-hidden />}
      {ativo ? "Lembrete ativo" : "Lembrar-me"}
    </button>
  );
}

/** Link da sala: rota por hash no HTML offline (file://); no Next, URL normal. */
export function linkDaSala(id: string) {
  const caminho = `/estudos/salas/${encodeURIComponent(id)}`;
  return location.protocol === "file:" ? `${location.href.split("#")[0]}#${caminho}` : `${location.origin}${caminho}`;
}

/** Convida: compartilha o link da sala (navigator.share) ou copia como alternativa. */
export function BotaoConvidar({ sala, className }: { sala: SalaEstudo; className?: string }) {
  const convidar = async () => {
    const url = linkDaSala(sala.id);
    const texto = sala.privada && sala.codigo ? `Estude comigo em “${sala.nome}”. Código: ${sala.codigo}` : `Estude comigo em “${sala.nome}”.`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: sala.nome, text: texto, url });
        return;
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(`${texto} ${url}`);
      toast({ tipo: "info", titulo: "Link copiado", mensagem: "Mande para quem vai estudar com você." }, 2400);
    } catch {
      toast({ tipo: "alerta", titulo: "Não deu para copiar", mensagem: url }, 4000);
    }
  };
  return (
    <button type="button" onClick={convidar} className={className}>
      <Share2 aria-hidden />
      Convidar
    </button>
  );
}
