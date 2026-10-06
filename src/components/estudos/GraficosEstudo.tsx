"use client";

import { ArrowDownRight, ArrowUpRight, Target } from "lucide-react";
import { m as motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Barras, BarrasHorizontais, MapaDeCalor, Rosca } from "@/components/ui/graficos";
import { Segmentado } from "@/components/ui/Segmentado";
import { MEDIA_MINUTOS_TURMA } from "@/data/turmas";
import { cn } from "@/lib/cn";
import { COR_DISCIPLINA } from "@/lib/cores";
import { formatarMinutos, inicioDaSemana, mapaDeCalor, minutosPorDia, porDisciplina, porHora, type ResumoEstudos } from "@/lib/estudos";
import { plural } from "@/lib/format";
import { diaDaSemana, inicioDoDia, NOMES_DIAS, somarDias } from "@/lib/tempo";
import type { SessaoEstudo } from "@/store/types";
import { diaMes, diaSemanaMes, faixaHora, turmaCurta } from "./formato";

/** Cabeçalho dos cards de gráfico: título da seção à esquerda, controle/nota à direita. */
function Cabecalho({ titulo, children, className }: { titulo: string; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <h2 className="text-[15px] font-semibold text-tinta">{titulo}</h2>
      {children}
    </div>
  );
}

/**
 * Rótulos do eixo X posicionados pelo centro da barra — nas séries longas (30 dias, 24 horas)
 * a barra é mais estreita que o texto, então o rótulo não pode ficar preso à largura dela.
 */
function Eixo({ total, marcas }: { total: number; marcas: { i: number; texto: string; destaque?: boolean }[] }) {
  return (
    <div className="relative mt-1.5 h-3.5" aria-hidden>
      {marcas.map((m) => {
        const pos = ((m.i + 0.5) / total) * 100;
        const borda = m.i === 0 ? "translate-x-0" : m.i === total - 1 ? "-translate-x-full" : "-translate-x-1/2";
        return (
          <span
            key={m.i}
            className={cn("absolute top-0 whitespace-nowrap text-[10px] leading-none tabular-nums", borda, m.destaque ? "font-medium text-tinta" : "text-texto-2")}
            style={{ left: m.i === 0 ? 0 : m.i === total - 1 ? "100%" : `${pos}%` }}
          >
            {m.texto}
          </span>
        );
      })}
    </div>
  );
}

/* ───────────── Métricas: uma faixa com divisórias ───────────── */

function Celula({ rotulo, valor, detalhe, variacao, dica }: { rotulo: string; valor: ReactNode; detalhe: ReactNode; variacao?: number; dica?: string }) {
  const sobe = (variacao ?? 0) >= 0;
  return (
    <div className="min-w-0 bg-superficie px-4 py-3.5">
      <dt className="flex items-center justify-between gap-2 text-[13px] text-texto-2">
        <span className="truncate">{rotulo}</span>
        {variacao !== undefined && Number.isFinite(variacao) && (
          <span title={dica} className={cn("inline-flex shrink-0 items-center text-[12px] font-medium tabular-nums", sobe ? "text-acento" : "text-alerta")}>
            {sobe ? <ArrowUpRight className="size-3.5" aria-hidden /> : <ArrowDownRight className="size-3.5" aria-hidden />}
            {Math.abs(Math.round(variacao * 100))}%
          </span>
        )}
      </dt>
      <dd className="mt-1 text-2xl font-semibold leading-tight tracking-tight text-tinta tabular-nums">{valor}</dd>
      <dd className="mt-0.5 truncate text-[12px] text-texto-2">{detalhe}</dd>
    </div>
  );
}

export function MetricasEstudo({ resumo, className }: { resumo: ResumoEstudos; className?: string }) {
  const { hojeMin, semanaMin, semanaPassadaMin, variacaoSemana, mediaDiaria30, diasAtivos30, maiorSessaoMin, totalSessoes } = resumo;
  return (
    <section aria-label="Seus números" className={className}>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-borda bg-borda sm:grid-cols-4">
        <Celula rotulo="Hoje" valor={formatarMinutos(hojeMin)} detalhe={`${Math.round(resumo.metaPct * 100)}% da meta`} />
        <Celula
          rotulo="Esta semana"
          valor={formatarMinutos(semanaMin)}
          variacao={variacaoSemana !== 0 ? variacaoSemana : undefined}
          dica="Comparado ao mesmo ponto da semana passada"
          detalhe={`sem. passada: ${formatarMinutos(semanaPassadaMin)}`}
        />
        <Celula rotulo="Média diária" valor={formatarMinutos(mediaDiaria30)} detalhe={`em ${diasAtivos30} de 30 dias`} />
        <Celula rotulo="Maior sessão" valor={maiorSessaoMin ? formatarMinutos(maiorSessaoMin) : "—"} detalhe={`${plural(totalSessoes, "sessão", "sessões")} no total`} />
      </dl>
    </section>
  );
}

/* ───────────── Barras: 7 ou 30 dias, com a linha da meta ───────────── */

type Periodo = "7" | "30";

export function TempoDeEstudo({ sessoes, agora, meta, className }: { sessoes: SessaoEstudo[]; agora: number; meta: number; className?: string }) {
  const [periodo, setPeriodo] = useState<Periodo>("7");
  const n = periodo === "7" ? 7 : 30;
  const dias = minutosPorDia(sessoes, n, agora);
  const total = dias.reduce((s, d) => s + d.minutos, 0);
  const naMeta = dias.filter((d) => d.minutos >= meta).length;
  const longo = n > 7;

  const dados = dias.map((d, i) => ({
    chave: d.dia,
    rotulo: longo ? "" : NOMES_DIAS[diaDaSemana(d.dia)],
    valor: d.minutos,
    dica: `${diaSemanaMes(d.dia)} · ${d.minutos ? formatarMinutos(d.minutos) : "sem estudo"}`,
    destaque: i === dias.length - 1,
  }));

  return (
    <Card semPadding className={cn("p-5", className)}>
      <Cabecalho titulo="Tempo de estudo">
        <Segmentado
          tamanho="sm"
          grupo="periodo-estudo"
          rotulo="Período do gráfico"
          opcoes={[
            { id: "7", rotulo: "7 dias" },
            { id: "30", rotulo: "30 dias" },
          ]}
          valor={periodo}
          onChange={setPeriodo}
          className="w-[148px] shrink-0"
        />
      </Cabecalho>
      <p className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-tinta tabular-nums">{formatarMinutos(total)}</p>
      <p className="text-[13px] text-texto-2">
        nos últimos {n} dias · média de {formatarMinutos(Math.round(total / n))} por dia
      </p>

      <motion.div key={periodo} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="mt-6">
        <Barras dados={dados} altura={150} meta={meta} rotuloMeta={`meta ${formatarMinutos(meta)}`} formatar={formatarMinutos} rotulo={`Minutos de estudo por dia nos últimos ${n} dias`} />
        {longo && (
          <Eixo
            total={n}
            marcas={[0, 7, 14, 21, n - 1].map((i) => ({ i, texto: i === n - 1 ? "hoje" : diaMes(dias[i].dia), destaque: i === n - 1 }))}
          />
        )}
      </motion.div>

      <p className="mt-4 flex items-center gap-1.5 border-t border-borda pt-3 text-[13px] text-texto-2">
        <Target className="size-3.5 shrink-0" aria-hidden />
        {total ? (
          <>
            Meta batida em <b className="font-medium text-tinta">{naMeta}</b> de {n} dias
          </>
        ) : (
          "Nenhum estudo registrado no período."
        )}
      </p>
    </Card>
  );
}

/* ───────────── Você vs sua turma ───────────── */

export function VoceVsTurma({ resumo, turma, agora, className }: { resumo: ResumoEstudos; turma: string; agora: number; className?: string }) {
  const media = MEDIA_MINUTOS_TURMA[turma] ?? 0;
  if (!media) return null;
  const tc = turmaCurta(turma);
  const { semanaMin, semanaPassadaMin } = resumo;
  const falta = Math.max(0, media - semanaMin);
  // Dias que ainda restam na semana, contando hoje (seg = 7 … dom = 1).
  const diasRestantes = 7 - diaDaSemana(agora);
  const porDia = Math.ceil(falta / diasRestantes);

  const frase =
    semanaMin >= media
      ? `Você está ${formatarMinutos(semanaMin - media)} acima da média do ${tc} nesta semana.`
      : `Faltam ${formatarMinutos(falta)} para a média do ${tc} — cerca de ${formatarMinutos(porDia)} por dia até domingo.`;

  return (
    <Card semPadding className={cn("p-5", className)}>
      <Cabecalho titulo="Você × turma" className="mb-4">
        <span className="text-[13px] text-texto-2" title={`“Sem. passada” é a sua semana anterior completa; a média é a semana inteira dos colegas do ${tc}.`}>
          nesta semana
        </span>
      </Cabecalho>
      <BarrasHorizontais
        rotulo={`Seus minutos nesta semana comparados à média do ${tc}`}
        dados={[
          { chave: "voce", rotulo: "Você", valor: semanaMin, cor: "var(--color-verde)", valorTexto: formatarMinutos(semanaMin) },
          { chave: "turma", rotulo: `Média do ${tc}`, valor: media, cor: "var(--color-texto-2)", valorTexto: formatarMinutos(media) },
          { chave: "passada", rotulo: "Sem. passada", valor: semanaPassadaMin, cor: "var(--color-verde-suave)", valorTexto: formatarMinutos(semanaPassadaMin) },
        ]}
      />
      <p className="mt-4 border-t border-borda pt-3 text-[13px] leading-snug text-texto-2">{frase}</p>
    </Card>
  );
}

/* ───────────── Tempo por disciplina ───────────── */

type Janela = "semana" | "30";

export function PorDisciplina({ sessoes, agora, semanaMin, className }: { sessoes: SessaoEstudo[]; agora: number; semanaMin: number; className?: string }) {
  // Numa segunda de manhã a semana está vazia: começa pelos 30 dias para o gráfico não nascer em branco.
  const [janela, setJanela] = useState<Janela>(() => (semanaMin > 0 ? "semana" : "30"));
  const desde = janela === "semana" ? inicioDaSemana(agora) : somarDias(inicioDoDia(agora), -29);
  const lista = porDisciplina(sessoes, desde);
  const total = lista.reduce((s, l) => s + l.minutos, 0);
  const top = lista[0];

  return (
    <Card semPadding className={cn("p-5", className)}>
      <Cabecalho titulo="Por disciplina">
        <Segmentado
          tamanho="sm"
          grupo="janela-disciplina"
          rotulo="Período por disciplina"
          opcoes={[
            { id: "semana", rotulo: "Semana" },
            { id: "30", rotulo: "30 dias" },
          ]}
          valor={janela}
          onChange={setJanela}
          className="w-[148px] shrink-0"
        />
      </Cabecalho>

      {top ? (
        <motion.div key={janela} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
          <p className="mt-1 text-[13px] text-texto-2">
            Mais estudada: <b className="font-medium text-tinta">{top.disciplina}</b> ({Math.round(top.pct * 100)}% do tempo)
          </p>
          <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row">
            <Rosca
              tamanho={156}
              espessura={18}
              rotulo={`Divisão do tempo de estudo por disciplina (${janela === "semana" ? "semana" : "30 dias"})`}
              fatias={lista.map((l) => ({ chave: l.disciplina, rotulo: l.disciplina, valor: l.minutos, cor: COR_DISCIPLINA[l.disciplina] }))}
            >
              <p className="text-lg font-semibold leading-none tracking-tight text-tinta tabular-nums">{formatarMinutos(total)}</p>
              <p className="mt-1 text-[12px] text-texto-2">{janela === "semana" ? "na semana" : "em 30 dias"}</p>
            </Rosca>
            <BarrasHorizontais
              className="w-full min-w-0 flex-1"
              rotulo="Minutos por disciplina"
              dados={lista.map((l) => ({ chave: l.disciplina, rotulo: l.disciplina, valor: l.minutos, cor: COR_DISCIPLINA[l.disciplina], valorTexto: formatarMinutos(l.minutos) }))}
            />
          </div>
        </motion.div>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-borda px-4 py-6 text-center text-[13px] text-texto-2">
          Nada registrado {janela === "semana" ? "nesta semana" : "nos últimos 30 dias"}.
        </p>
      )}
    </Card>
  );
}

/* ───────────── Constância (mapa de calor) ───────────── */

export function Constancia({ sessoes, agora, className }: { sessoes: SessaoEstudo[]; agora: number; className?: string }) {
  const semanas = mapaDeCalor(sessoes, 12, agora);
  const dias = semanas.flat().filter((c) => !c.futuro);
  const ativos = dias.filter((c) => c.minutos > 0).length;

  return (
    <Card semPadding className={cn("p-5", className)}>
      <Cabecalho titulo="Constância">
        <span className="text-[13px] text-texto-2">
          <b className="font-medium text-tinta tabular-nums">{ativos}</b> de {dias.length} dias
        </span>
      </Cabecalho>
      <p className="mb-4 mt-0.5 text-[13px] text-texto-2" title="Cada quadrado é um dia">
        Últimas 12 semanas
      </p>
      <MapaDeCalor semanas={semanas} formatar={(c) => `${diaMes(c.dia)} · ${c.minutos ? formatarMinutos(c.minutos) : "sem estudo"}`} />
    </Card>
  );
}

/* ───────────── Distribuição por hora do dia ───────────── */

export function HorarioDePico({ sessoes, agora, className }: { sessoes: SessaoEstudo[]; agora: number; className?: string }) {
  const horas = porHora(sessoes, somarDias(inicioDoDia(agora), -29));
  const max = Math.max(...horas);
  const pico = max > 0 ? horas.indexOf(max) : null;
  const dados = horas.map((v, h) => ({
    chave: h,
    rotulo: "",
    valor: v,
    dica: `${faixaHora(h)} · ${v ? formatarMinutos(v) : "nada"}`,
    destaque: h === pico,
  }));

  return (
    <Card semPadding className={cn("p-5", className)}>
      <Cabecalho titulo="Horário de pico">
        <span className="text-[13px] text-texto-2">30 dias</span>
      </Cabecalho>
      <p className="mb-5 mt-0.5 text-[13px] leading-snug text-texto-2">
        {pico !== null ? (
          <>
            Você rende mais entre <b className="font-medium text-tinta">{faixaHora(pico)}</b>
          </>
        ) : (
          "Sem dados suficientes ainda"
        )}
      </p>
      <Barras dados={dados} altura={104} formatar={formatarMinutos} rotulo="Minutos de estudo por hora do dia nos últimos 30 dias" />
      <Eixo total={24} marcas={[0, 6, 12, 18, 23].map((h) => ({ i: h, texto: `${h}h` }))} />
    </Card>
  );
}
