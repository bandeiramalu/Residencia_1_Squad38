"use client";

import { Hourglass, Info } from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Barras, BarrasHorizontais, MapaDeCalor, Rosca } from "@/components/ui/graficos";
import { diaMes, faixaHora, turmaCurta } from "@/components/estudos/formato";
import { MEDIA_MINUTOS_TURMA } from "@/data/turmas";
import { cn } from "@/lib/cn";
import { COR_DISCIPLINA } from "@/lib/cores";
import { formatarMinutos, mapaDeCalor, porDisciplina, porHora } from "@/lib/estudos";
import type { Recorte } from "./calculos";

/** Versões dos gráficos de estudo que obedecem ao recorte (período + disciplina) das Estatísticas. */

function Cab({ titulo, nota }: { titulo: string; nota?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-[15px] font-semibold text-tinta">{titulo}</h3>
      {nota && <span className="text-[13px] text-texto-2">{nota}</span>}
    </div>
  );
}

function Vazio({ children, icone, acao }: { children: ReactNode; icone?: ReactNode; acao?: { rotulo: string; href: string } }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-borda px-4 py-6 text-center text-[13px] text-texto-2">
      {icone && <span className="mx-auto mb-2 grid size-9 place-items-center rounded-full bg-superficie-2 text-texto-2 [&_svg]:size-4">{icone}</span>}
      <p>{children}</p>
      {acao && (
        <Link href={acao.href} className="alvo-toque mt-2 inline-block font-medium text-acento hover:underline">
          {acao.rotulo}
        </Link>
      )}
    </div>
  );
}

const sufixo = (r: Recorte) => (r.disciplina ? ` · ${r.disciplina}` : "");

export function ConstanciaRecorte({ recorte, agora, className }: { recorte: Recorte; agora: number; className?: string }) {
  const nSemanas = Math.max(2, Math.ceil(recorte.dias / 7) + 1);
  const semanas = mapaDeCalor(recorte.sessoes, nSemanas, agora);
  const dentro = semanas.flat().filter((c) => !c.futuro && c.dia >= recorte.desde);
  const ativos = dentro.filter((c) => c.minutos > 0).length;
  return (
    <Card semPadding className={cn("p-5", className)}>
      <Cab
        titulo="Constância"
        nota={
          <>
            <b className="font-medium tabular-nums text-tinta">{ativos}</b> de {dentro.length} dias
          </>
        }
      />
      <p className="mb-4 mt-0.5 text-[13px] text-texto-2">
        Cada quadrado é um dia · últimos {recorte.dias} dias
        {sufixo(recorte)}
      </p>
      <MapaDeCalor
        semanas={semanas.map((s) => s.map((c) => (c.dia < recorte.desde ? { ...c, minutos: 0, nivel: 0 as const } : c)))}
        formatar={(c) => `${diaMes(c.dia)} · ${c.minutos ? formatarMinutos(c.minutos) : "sem estudo"}`}
      />
    </Card>
  );
}

export function HorarioDePicoRecorte({ recorte, className }: { recorte: Recorte; className?: string }) {
  const horas = porHora(recorte.sessoes);
  const max = Math.max(...horas);
  const pico = max > 0 ? horas.indexOf(max) : null;
  return (
    <Card semPadding className={cn("p-5", className)}>
      <Cab titulo="Horário de pico" nota={`${recorte.dias} dias`} />
      <p className="mb-5 mt-0.5 text-[13px] leading-snug text-texto-2">
        {pico !== null ? (
          <>
            Você rende mais entre <b className="font-medium text-tinta">{faixaHora(pico)}</b>
            {sufixo(recorte)}
          </>
        ) : (
          "Sem estudo neste recorte."
        )}
      </p>
      <Barras
        dados={horas.map((v, h) => ({ chave: h, rotulo: "", valor: v, dica: `${faixaHora(h)} · ${v ? formatarMinutos(v) : "nada"}`, destaque: h === pico }))}
        altura={104}
        formatar={formatarMinutos}
        rotulo={`Minutos de estudo por hora do dia nos últimos ${recorte.dias} dias`}
      />
      <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-texto-2" aria-hidden>
        {[0, 6, 12, 18, 23].map((h) => (
          <span key={h}>{h}h</span>
        ))}
      </div>
    </Card>
  );
}

export function PorDisciplinaRecorte({ recorte, className }: { recorte: Recorte; className?: string }) {
  const lista = porDisciplina(recorte.sessoes, 0);
  const total = lista.reduce((s, l) => s + l.minutos, 0);
  const top = lista[0];
  return (
    <Card semPadding className={cn("p-5", className)}>
      <Cab titulo="Por disciplina" nota={`${recorte.dias} dias`} />
      {top ? (
        <>
          <p className="mt-1 text-[13px] text-texto-2">
            Mais estudada: <b className="font-medium text-tinta">{top.disciplina}</b> ({Math.round(top.pct * 100)}% do tempo)
          </p>
          <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row">
            <Rosca
              tamanho={156}
              espessura={18}
              rotulo={`Divisão do tempo de estudo por disciplina (${recorte.dias} dias)`}
              fatias={lista.map((l) => ({ chave: l.disciplina, rotulo: l.disciplina, valor: l.minutos, cor: COR_DISCIPLINA[l.disciplina] }))}
            >
              <p className="text-lg font-semibold leading-none tracking-tight text-tinta tabular-nums">{formatarMinutos(total)}</p>
              <p className="mt-1 text-[12px] text-texto-2">em {recorte.dias} dias</p>
            </Rosca>
            <BarrasHorizontais
              className="w-full min-w-0 flex-1"
              rotulo="Minutos por disciplina"
              dados={lista.map((l) => ({ chave: l.disciplina, rotulo: l.disciplina, valor: l.minutos, cor: COR_DISCIPLINA[l.disciplina], valorTexto: formatarMinutos(l.minutos) }))}
            />
          </div>
        </>
      ) : (
        <Vazio icone={<Hourglass />} acao={{ rotulo: "Iniciar um foco", href: "/estudos" }}>Nada registrado neste recorte.</Vazio>
      )}
    </Card>
  );
}

/** Média semanal da aluna no período contra a média semanal da turma (que considera todas as disciplinas). */
export function VoceVsTurmaRecorte({ recorte, turma, className }: { recorte: Recorte; turma: string; className?: string }) {
  const media = MEDIA_MINUTOS_TURMA[turma] ?? 0;
  if (!media) return null;
  const tc = turmaCurta(turma);
  const total = recorte.sessoes.reduce((s, x) => s + x.minutos, 0);
  const semanal = Math.round((total / recorte.dias) * 7);
  return (
    <Card semPadding className={cn("p-5", className)}>
      <Cab titulo="Você × turma" nota="média por semana" />
      {recorte.disciplina ? (
        <Vazio icone={<Info />}>A média da turma considera todas as disciplinas. Escolha &ldquo;Todas as disciplinas&rdquo; para comparar.</Vazio>
      ) : (
        <>
          <div className="mt-4">
            <BarrasHorizontais
              rotulo={`Sua média semanal nos últimos ${recorte.dias} dias comparada à média do ${tc}`}
              dados={[
                { chave: "voce", rotulo: "Você", valor: semanal, cor: "var(--color-verde)", valorTexto: formatarMinutos(semanal) },
                { chave: "turma", rotulo: `Média do ${tc}`, valor: media, cor: "var(--color-texto-2)", valorTexto: formatarMinutos(media) },
              ]}
            />
          </div>
          <p className="mt-4 border-t border-borda pt-3 text-[13px] leading-snug text-texto-2">
            {semanal >= media
              ? `Você está ${formatarMinutos(semanal - media)} por semana acima da média do ${tc}.`
              : `Faltam ${formatarMinutos(media - semanal)} por semana para a média do ${tc}.`}
          </p>
        </>
      )}
    </Card>
  );
}
