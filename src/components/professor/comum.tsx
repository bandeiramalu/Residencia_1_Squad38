"use client";

import { BellRing, Check, Minus, Plus } from "lucide-react";
import { m as motion } from "motion/react";
import Link from "next/link";
import { Fragment, useSyncExternalStore, type ReactNode } from "react";
import { aoTeclarNasAbas } from "@/components/ui/abas";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LinkPessoa } from "@/components/ui/LinkPessoa";
import { PROFESSOR_ID, TURMAS_DO_PROFESSOR } from "@/data/professor";
import { useSessao } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { NOMES_DIAS, diaDaSemana, tempoRelativo } from "@/lib/tempo";
import type { Risco } from "@/lib/turmas";
import { useAgora } from "@/hooks/useAgora";
import { lembrarAlunos, liberaLembreteEm } from "@/store/actions";
import { useSeletor } from "@/store/store";

/* ───────────── Turma selecionada (compartilhada entre Painel e Alunos) ───────────── */

let turmaAtual: string = TURMAS_DO_PROFESSOR[0];
const ouvintesTurma = new Set<() => void>();

function assinarTurma(ouvinte: () => void) {
  ouvintesTurma.add(ouvinte);
  return () => {
    ouvintesTurma.delete(ouvinte);
  };
}

export function definirTurma(turma: string) {
  if (turma === turmaAtual) return;
  turmaAtual = turma;
  ouvintesTurma.forEach((o) => o());
}

/** A turma escolhida no Painel continua escolhida em Alunos (e vice-versa). */
export function useTurmaProfessor() {
  return useSyncExternalStore(
    assinarTurma,
    () => turmaAtual,
    () => TURMAS_DO_PROFESSOR[0],
  );
}

/** "9º Ano A" → "9º A" */
export function turmaCurta(turma: string) {
  return turma.replace(" Ano ", " ");
}

export const OPCOES_TURMA = TURMAS_DO_PROFESSOR.map((t) => ({ id: t as string, rotulo: turmaCurta(t), aria: t }));

export function useProfessorId() {
  return useSessao()?.usuarioId ?? PROFESSOR_ID;
}

/** Rótulos dos últimos 7 dias (do mais antigo até hoje), no formato do eixo dos gráficos. */
export function rotulosSeteDias(agora: number) {
  return Array.from({ length: 7 }, (_, i) => {
    const ts = agora - (6 - i) * 86_400_000;
    return i === 6 ? "Hoje" : NOMES_DIAS[diaDaSemana(ts)];
  });
}

/* ───────────── Peças visuais ───────────── */

const RISCO: Record<Exclude<Risco, "baixo">, { tom: "alerta" | "ambar"; rotulo: string }> = {
  alto: { tom: "alerta", rotulo: "Risco alto" },
  medio: { tom: "ambar", rotulo: "Atenção" },
};

/** Risco alto/médio vira badge pequeno; "em dia" fica só como texto discreto. */
export function RiscoBadge({ risco, className }: { risco: Risco; className?: string }) {
  if (risco === "baixo") return <span className={cn("text-[12px] text-texto-2", className)}>Em dia</span>;
  const r = RISCO[risco];
  return (
    <Badge tom={r.tom} className={className}>
      {r.rotulo}
    </Badge>
  );
}

/** Selo da aluna da demonstração: os números dela mudam ao vivo (só o ponto pulsa). */
export function AoVivo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium text-acento", className)}>
      <span className="size-1.5 animate-pulso rounded-full bg-verde" aria-hidden />
      ao vivo
    </span>
  );
}

/**
 * Caixa de seleção (com estado "misto" para o selecionar-todos). Visual de 16 px; no celular a área de toque
 * chega a 44 × 44 px (margem negativa de 12 px: cabe no vão de 12 px entre os itens da linha, sem cobrir o vizinho).
 */
export function Caixa({ marcada, mista, onChange, rotulo, className }: { marcada: boolean; mista?: boolean; onChange: () => void; rotulo: string; className?: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={mista ? "mixed" : marcada}
      aria-label={rotulo}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={cn("group/caixa grid size-4 shrink-0 place-items-center toque:-m-3 toque:size-11", className)}
    >
      <span
        className={cn(
          "grid size-4 place-items-center rounded-[5px] border transition-[background-color,border-color] duration-150",
          marcada || mista ? "border-acao bg-acao text-white" : "border-texto-2 bg-superficie group-hover/caixa:border-tinta",
        )}
      >
        {mista ? <Minus className="size-3" strokeWidth={3} /> : marcada ? <Check className="size-3" strokeWidth={3} /> : null}
      </span>
    </button>
  );
}

/** Seletor numérico com − / + e atalhos (pontos, XP). */
export function Stepper({
  valor,
  onChange,
  passo = 5,
  min = 0,
  max = 500,
  rotulo,
  sufixo,
  atalhos = [],
  icone,
}: {
  valor: number;
  onChange: (v: number) => void;
  passo?: number;
  min?: number;
  max?: number;
  rotulo: string;
  sufixo?: string;
  atalhos?: number[];
  icone?: ReactNode;
}) {
  const limitar = (v: number) => Math.max(min, Math.min(max, v));
  const botao =
    "grid size-9 shrink-0 place-items-center rounded-lg border border-borda bg-superficie text-tinta transition-colors duration-150 hover:bg-superficie-2 active:scale-95 disabled:opacity-40 toque:size-11";
  return (
    <div className="rounded-xl border border-borda bg-superficie p-3">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(limitar(valor - passo))} disabled={valor <= min} aria-label={`Diminuir ${rotulo}`} className={botao}>
          <Minus className="size-4" />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="inline-flex items-center gap-1.5 text-[20px] font-semibold leading-none text-tinta tabular-nums [&_svg]:size-4 [&_svg]:text-texto-2">
            {icone}
            {valor}
          </p>
          <p className="mt-1 text-[12px] text-texto-2">{sufixo ?? rotulo}</p>
        </div>
        <button type="button" onClick={() => onChange(limitar(valor + passo))} disabled={valor >= max} aria-label={`Aumentar ${rotulo}`} className={botao}>
          <Plus className="size-4" />
        </button>
      </div>
      {atalhos.length > 0 && (
        <div className="mt-2.5 flex gap-1.5">
          {atalhos.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => onChange(limitar(a))}
              aria-pressed={valor === a}
              className={cn(
                "h-7 min-w-0 flex-1 rounded-md text-[12px] font-medium tabular-nums transition-colors duration-150 toque:h-11",
                valor === a ? "bg-tinta text-superficie" : "bg-superficie-2 text-texto-2 hover:text-tinta",
              )}
            >
              {a}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────── Faixa de números (KPIs numa linha, com divisórias) ───────────── */

export interface ItemFaixa {
  rotulo: string;
  valor: ReactNode;
  detalhe?: ReactNode;
  icone?: ReactNode;
  /** Cor com significado no número (risco, pendência). */
  tom?: "alerta" | "ambar" | "acento";
}

const TOM_VALOR = { alerta: "text-alerta", ambar: "text-ouro", acento: "text-acento" } as const;

/**
 * Um card só, com as métricas em colunas separadas por divisórias (padrão de painel administrativo).
 * `colunas` recebe as classes de grade (ex.: "grid-cols-2 lg:grid-cols-5"). Cada célula desenha só a
 * borda de cima e da esquerda; a grade é deslocada 1 px para fora, então as bordas externas somem e
 * linhas incompletas não deixam buracos. `ultimoInteiro`: no celular a última célula ocupa a linha toda.
 */
export function FaixaNumeros({
  itens,
  colunas,
  compacta,
  ultimoInteiro,
  className,
}: {
  itens: ItemFaixa[];
  colunas: string;
  compacta?: boolean;
  ultimoInteiro?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-borda bg-superficie", className)}>
      <dl className={cn("-m-px grid", colunas)}>
        {itens.map((it, i) => (
          <div
            key={it.rotulo}
            className={cn("min-w-0 border-l border-t border-borda", compacta ? "px-3 py-3 sm:px-4" : "p-4", ultimoInteiro && i === itens.length - 1 && "max-sm:col-span-2")}
          >
            <dt className="flex items-center gap-1.5 text-[13px] text-texto-2 [&_svg]:size-3.5 [&_svg]:shrink-0">
              {it.icone}
              <span className="min-w-0 leading-tight">{it.rotulo}</span>
            </dt>
            <dd className={cn("mt-1 text-2xl font-semibold leading-tight tracking-tight tabular-nums", it.tom ? TOM_VALOR[it.tom] : "text-tinta")}>{it.valor}</dd>
            {it.detalhe && <dd className="mt-0.5 text-[12px] leading-snug text-texto-2">{it.detalhe}</dd>}
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ───────────── Abas com sublinhado ───────────── */

export interface Aba<T extends string> {
  id: T;
  rotulo: ReactNode;
  contador?: number;
  aria?: string;
}

/** Abas de texto com sublinhado deslizante (padrão de rede social). */
export function Abas<T extends string>({
  abas,
  valor,
  onChange,
  grupo,
  rotulo,
  className,
}: {
  abas: readonly Aba<T>[];
  valor: T;
  onChange: (v: T) => void;
  grupo: string;
  rotulo: string;
  className?: string;
}) {
  return (
    <div role="tablist" aria-label={rotulo} onKeyDown={aoTeclarNasAbas} className={cn("sem-scrollbar flex gap-4 overflow-x-auto border-b border-borda px-4 sm:gap-6", className)}>
      {abas.map((a) => {
        const ativa = a.id === valor;
        return (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-selected={ativa}
            tabIndex={ativa ? 0 : -1}
            aria-label={a.aria && (a.contador !== undefined ? `${a.aria}, ${a.contador}` : a.aria)}
            onClick={() => onChange(a.id)}
            className={cn(
              "relative flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap text-[13.5px] font-medium transition-colors duration-150",
              ativa ? "text-tinta" : "text-texto-2 hover:text-tinta",
            )}
          >
            {a.rotulo}
            {a.contador !== undefined && (
              <span
                className={cn(
                  "min-w-5 rounded-full px-1.5 text-center text-[11px] leading-[18px] tabular-nums",
                  ativa ? "bg-tinta text-superficie" : "bg-superficie-2 text-texto-2 ring-1 ring-inset ring-borda",
                )}
              >
                {a.contador}
              </span>
            )}
            {ativa && (
              <motion.span layoutId={`aba-${grupo}`} className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-tinta" transition={{ type: "spring", stiffness: 600, damping: 45 }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ───────────── Link com cara de botão secundário ───────────── */

export const CLASSE_BOTAO_SECUNDARIO =
  "alvo-toque inline-flex h-9 shrink-0 select-none items-center justify-center gap-2 rounded-lg border border-borda bg-superficie px-4 text-sm font-medium text-tinta transition-[background-color,transform] duration-150 hover:bg-superficie-2 active:scale-[0.98] [&_svg]:size-4 [&_svg]:shrink-0 toque:min-w-11";

export function LinkBotao({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn(CLASSE_BOTAO_SECUNDARIO, className)}>
      {children}
    </Link>
  );
}

/** Estado vazio dentro de um card/lista: ícone + frase + ação para começar (padrão W79). */
export function VazioLista({ icone, titulo, descricao, acao }: { icone: ReactNode; titulo: string; descricao?: string; acao?: ReactNode }) {
  return (
    <div className="px-6 py-8 text-center">
      <div className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-superficie-2 text-texto-2 [&_svg]:size-5">{icone}</div>
      <p className="text-sm font-medium text-tinta">{titulo}</p>
      {descricao && <p className="mx-auto mt-1 max-w-xs text-[13px] text-texto-2">{descricao}</p>}
      {acao && <div className="mt-4 flex justify-center">{acao}</div>}
    </div>
  );
}

/** Avatar + nome (+ linha de apoio) como UM só link para o perfil; no celular o alvo de toque tem 44 px de altura. */
export function PessoaLink({
  id,
  nome,
  iniciais,
  apoio,
  tamanho = "sm",
  className,
}: {
  id: string;
  nome: string;
  iniciais?: string;
  apoio?: ReactNode;
  tamanho?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <LinkPessoa id={id} rotulo={`Perfil de ${nome}`} className={cn("flex min-h-11 min-w-0 items-center gap-3", className)}>
      <Avatar nome={nome} iniciais={iniciais} tamanho={tamanho} />
      <span className="min-w-0">
        <span className="block truncate text-[14px] font-medium text-tinta">{nome}</span>
        {apoio && <span className="block truncate text-[12px] text-texto-2">{apoio}</span>}
      </span>
    </LinkPessoa>
  );
}

/** Metadados separados por "·" (ignora os vazios). */
export function Metadados({ itens, className }: { itens: ReactNode[]; className?: string }) {
  const validos = itens.filter((x) => x !== null && x !== undefined && x !== false && x !== "");
  return (
    <span className={className}>
      {validos.map((x, i) => (
        <Fragment key={i}>
          {i > 0 && <span aria-hidden> · </span>}
          {x}
        </Fragment>
      ))}
    </span>
  );
}

/* ───────────── Lembrete ao aluno (notificação real, libera de novo após 6 h) ───────────── */

export function BotaoLembrar({ alunoId, nome, rotuloCurto, tamanho = "sm" }: { alunoId: string; nome: string; rotuloCurto?: boolean; tamanho?: "sm" | "md" }) {
  const ultimo = useSeletor((e) => e.lembradoEm?.[alunoId]);
  const agora = useAgora(60_000);
  const espera = liberaLembreteEm(ultimo, agora);
  const bloqueado = espera > 0 && !!ultimo;
  return (
    <Button
      variante="secundario"
      tamanho={tamanho}
      className={tamanho === "sm" ? "toque:h-11" : undefined}
      disabled={bloqueado}
      onClick={() => lembrarAlunos([alunoId])}
      aria-label={bloqueado ? `${nome} foi lembrado ${tempoRelativo(ultimo ?? 0, agora)}` : `Lembrar ${nome}`}
    >
      {bloqueado ? <Check /> : <BellRing />}
      <span className={rotuloCurto ? "hidden sm:inline" : undefined}>{bloqueado ? `Lembrado ${tempoRelativo(ultimo ?? 0, agora)}` : "Lembrar"}</span>
    </Button>
  );
}
