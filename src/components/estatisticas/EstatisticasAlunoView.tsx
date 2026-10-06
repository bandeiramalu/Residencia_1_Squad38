"use client";

import { Download, FileX } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { diaMes, diaSemanaMes } from "@/components/estudos/formato";
import { TituloPagina, TituloSecao } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Barras, BarrasHorizontais, Sparkline } from "@/components/ui/graficos";
import { Segmentado } from "@/components/ui/Segmentado";
import { useAgora } from "@/hooks/useAgora";
import { DISCIPLINAS, type Disciplina } from "@/data/escola";
import { cn } from "@/lib/cn";
import { diasSeguidosComEstudo, formatarMinutos, minutosPorDia } from "@/lib/estudos";
import { fmt, plural } from "@/lib/format";
import { baixarArquivo, gerarPdfDocumento } from "@/lib/pdf";
import { diaDaSemana, NOMES_DIAS } from "@/lib/tempo";
import { useEstado } from "@/store/store";
import {
  concluidasPorSemana,
  duelosDaAluna,
  formatarNota,
  ganhosPorDia,
  medalhasProgresso,
  mediaNotas,
  montarRelatorio,
  notasDaAluna,
  PERIODOS,
  recortar,
  SECOES,
  type PeriodoId,
  type SecaoId,
} from "./calculos";
import { ConstanciaRecorte, HorarioDePicoRecorte, PorDisciplinaRecorte, VoceVsTurmaRecorte } from "./GraficosRecorte";

/** Card de gráfico: título, 1 número de destaque e o gráfico. */
function Painel({ titulo, destaque, nota, children, className }: { titulo: string; destaque?: ReactNode; nota?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card semPadding className={cn("min-w-0 p-5", className)}>
      <h3 className="text-[15px] font-semibold text-tinta">{titulo}</h3>
      {destaque !== undefined && <p className="mt-1.5 text-2xl font-semibold leading-tight tracking-tight text-tinta tabular-nums">{destaque}</p>}
      {nota && <p className="text-[13px] text-texto-2">{nota}</p>}
      <div className="mt-4">{children}</div>
    </Card>
  );
}

function Vazio({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-borda px-4 py-6 text-center text-[13px] text-texto-2">{children}</p>;
}

function Numero({ rotulo, valor, detalhe }: { rotulo: string; valor: ReactNode; detalhe?: string }) {
  return (
    <div className="min-w-0 bg-superficie px-4 py-3.5">
      <dt className="truncate text-[13px] text-texto-2">{rotulo}</dt>
      <dd className="mt-1 text-2xl font-semibold leading-tight tracking-tight text-tinta tabular-nums">{valor}</dd>
      {detalhe && <dd className="mt-0.5 truncate text-[12px] text-texto-2">{detalhe}</dd>}
    </div>
  );
}

export function EstatisticasAlunoView() {
  const router = useRouter();
  const params = useSearchParams();
  const estado = useEstado();
  const agora = useAgora(60_000);
  const [erro, setErro] = useState(false);

  const periodo = PERIODOS.find((p) => p.id === params.get("p")) ?? PERIODOS[1];
  const dParam = params.get("d");
  const disciplina = (DISCIPLINAS as readonly string[]).includes(dParam ?? "") ? (dParam as Disciplina) : null;
  const ocultas = useMemo(() => new Set((params.get("ocultar") ?? "").split(",").filter((s) => SECOES.some((x) => x.id === s)) as SecaoId[]), [params]);
  const filtrado = periodo.id !== "30" || disciplina !== null || ocultas.size > 0;

  const atualizar = (p: PeriodoId, d: Disciplina | null, o: Set<SecaoId>) => {
    const qs = new URLSearchParams();
    if (p !== "30") qs.set("p", p);
    if (d) qs.set("d", d);
    if (o.size) qs.set("ocultar", [...o].join(","));
    const texto = qs.toString();
    router.replace(texto ? `/estatisticas?${texto}` : "/estatisticas");
  };
  const alternar = (id: SecaoId) => {
    const novo = new Set(ocultas);
    if (novo.has(id)) novo.delete(id);
    else novo.add(id);
    atualizar(periodo.id, disciplina, novo);
  };

  const { usuario } = estado;
  const recorte = recortar(estado, periodo.dias, disciplina, agora);
  const { sessoes, historico, desde } = recorte;
  const foco = sessoes.reduce((s, x) => s + x.minutos, 0);
  const ciclos = sessoes.filter((s) => s.origem !== "manual").length;
  const sequencia = diasSeguidosComEstudo(estado.estudos.sessoes, agora);
  const dias = minutosPorDia(historico, periodo.dias, agora);
  const ganhos = ganhosPorDia(estado, periodo.dias, agora);
  const xpPeriodo = ganhos.reduce((s, g) => s + g.xp, 0);
  const ptsPeriodo = ganhos.reduce((s, g) => s + g.pontos, 0);
  const acumulado = ganhos.reduce<number[]>((acc, g) => [...acc, (acc[acc.length - 1] ?? 0) + g.xp], []);
  const notas = notasDaAluna(estado, desde, disciplina);
  const media = mediaNotas(notas);
  const duelos = duelosDaAluna(estado);
  const { acertos, vistas } = estado.pratica;
  const semanas = concluidasPorSemana(estado, agora, disciplina);
  const totalConcluidas = semanas.reduce((s, w) => s + w.total, 0);
  const medalhas = medalhasProgresso(estado);
  const conquistadas = medalhas.filter((m) => m.completa).length;
  const semEstudo = foco === 0;
  const longo = periodo.dias > 7;

  const baixar = () => {
    try {
      const doc = montarRelatorio({ estado, periodoTexto: periodo.texto, recorte, agora, ocultas });
      const { blob } = gerarPdfDocumento(doc);
      baixarArquivo(blob, `relatorio-estatisticas-${periodo.id}d.pdf`);
      setErro(false);
    } catch {
      setErro(true);
    }
  };

  return (
    <div className="space-y-6">
      <TituloPagina
        titulo="Estatísticas"
        descricao="Seus números de estudo, evolução e desempenho."
        acao={
          <Button variante="secundario" tamanho="sm" onClick={baixar}>
            <Download className="size-4" aria-hidden /> Baixar relatório (PDF)
          </Button>
        }
      />
      {erro && (
        <p role="alert" className="text-[13px] text-alerta">
          Não foi possível gerar o PDF. Tente de novo.
        </p>
      )}

      <section aria-label="Filtros" className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Segmentado
            grupo="periodo-estatisticas"
            rotulo="Período"
            tamanho="sm"
            opcoes={PERIODOS.map((p) => ({ id: p.id, rotulo: p.rotulo }))}
            valor={periodo.id}
            onChange={(p) => atualizar(p, disciplina, ocultas)}
            className="w-full sm:w-[260px]"
          />
          <label className="flex items-center gap-2 text-[13px] text-texto-2">
            <span className="sr-only sm:not-sr-only">Disciplina</span>
            <select
              value={disciplina ?? ""}
              onChange={(e) => atualizar(periodo.id, (e.target.value || null) as Disciplina | null, ocultas)}
              className="h-9 rounded-lg border border-borda bg-superficie px-3 text-[13px] text-tinta"
            >
              <option value="">Todas as disciplinas</option>
              {DISCIPLINAS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          {filtrado && (
            <button type="button" onClick={() => router.replace("/estatisticas")} className="text-[13px] font-medium text-acento hover:underline active:scale-[0.98]">
              Limpar filtros
            </button>
          )}
        </div>
        <ul aria-label="Seções visíveis" className="flex flex-wrap gap-2">
          {SECOES.map((s) => {
            const ativa = !ocultas.has(s.id);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  aria-pressed={ativa}
                  onClick={() => alternar(s.id)}
                  className={cn(
                    "h-8 rounded-full border px-3 text-[13px] font-medium transition-colors duration-150 active:scale-[0.98]",
                    ativa ? "border-tinta bg-tinta text-superficie" : "border-borda bg-superficie text-texto-2 hover:bg-superficie-2",
                  )}
                >
                  {s.rotulo}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {ocultas.size === SECOES.length && (
        <Vazio>
          <FileX className="mx-auto mb-2 size-5" aria-hidden />
          Todas as seções estão ocultas. Ative alguma acima.
        </Vazio>
      )}

      {!ocultas.has("resumo") && (
        <section aria-label="Resumo do período">
          <TituloSecao extra={periodo.texto}>Resumo</TituloSecao>
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-borda bg-borda sm:grid-cols-3 lg:grid-cols-6">
            <Numero rotulo="Tempo de foco" valor={formatarMinutos(foco)} />
            <Numero rotulo="Sessões" valor={fmt(sessoes.length)} />
            <Numero rotulo="Ciclos" valor={fmt(ciclos)} detalhe="timer e salas" />
            <Numero rotulo="Sequência" valor={plural(sequencia, "dia", "dias")} />
            <Numero rotulo="XP ganho" valor={fmt(xpPeriodo)} />
            <Numero rotulo="Pontos ganhos" valor={fmt(ptsPeriodo)} />
          </dl>
        </section>
      )}

      {!ocultas.has("foco") && (
        <section aria-label="Foco e estudo">
          <TituloSecao extra={disciplina ?? "todas as disciplinas"}>Foco e estudo</TituloSecao>
          {semEstudo && historico.length === 0 ? (
            <Vazio>Sem estudo registrado{disciplina ? ` em ${disciplina}` : ""}. Comece um foco na Sala de estudos.</Vazio>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <Painel titulo="Tempo por dia" destaque={formatarMinutos(foco)} nota={`${periodo.texto} · média de ${formatarMinutos(Math.round(foco / periodo.dias))} por dia`} className="lg:col-span-2">
                {semEstudo ? (
                  <Vazio>Nenhum estudo neste período.</Vazio>
                ) : (
                  <Barras
                    dados={dias.map((d, i) => ({
                      chave: d.dia,
                      rotulo: longo ? "" : NOMES_DIAS[diaDaSemana(d.dia)],
                      valor: d.minutos,
                      dica: `${diaSemanaMes(d.dia)} · ${d.minutos ? formatarMinutos(d.minutos) : "sem estudo"}`,
                      destaque: i === dias.length - 1,
                    }))}
                    altura={150}
                    meta={estado.estudos.metaDiariaMin}
                    rotuloMeta={`meta ${formatarMinutos(estado.estudos.metaDiariaMin)}`}
                    formatar={formatarMinutos}
                    rotulo={`Minutos de estudo por dia nos ${periodo.texto}`}
                  />
                )}
                {longo && !semEstudo && (
                  <p className="mt-2 flex justify-between text-[10px] tabular-nums text-texto-2" aria-hidden>
                    <span>{diaMes(dias[0].dia)}</span>
                    <span>hoje</span>
                  </p>
                )}
              </Painel>
              <ConstanciaRecorte recorte={recorte} agora={agora} />
              <HorarioDePicoRecorte recorte={recorte} />
              <PorDisciplinaRecorte recorte={recorte} />
              <VoceVsTurmaRecorte recorte={recorte} turma={usuario.turma} />
            </div>
          )}
        </section>
      )}

      {!ocultas.has("evolucao") && (
        <section aria-label="Evolução">
          <TituloSecao extra="todas as disciplinas">Evolução</TituloSecao>
          <div className="grid gap-4 lg:grid-cols-2">
            <Painel titulo="XP no período" destaque={`+${fmt(xpPeriodo)} XP`} nota={`${fmt(usuario.xp)} XP no total`}>
              {xpPeriodo > 0 ? (
                <>
                  <Sparkline valores={acumulado} largura={320} altura={72} className="h-[72px] w-full" />
                  <Barras
                    className="mt-4"
                    altura={72}
                    dados={ganhos.map((g, i) => ({ chave: g.dia, rotulo: "", valor: g.xp, dica: `${diaSemanaMes(g.dia)} · +${g.xp} XP`, destaque: i === ganhos.length - 1 }))}
                    formatar={(v) => `${v} XP`}
                    rotulo="XP ganho por dia"
                  />
                </>
              ) : (
                <Vazio>Sem XP neste período.</Vazio>
              )}
            </Painel>
            <Painel titulo="Pontos no período" destaque={`+${fmt(ptsPeriodo)} pts`} nota={`${fmt(usuario.pontos)} pontos disponíveis`}>
              {ptsPeriodo > 0 ? (
                <Barras
                  altura={150}
                  dados={ganhos.map((g, i) => ({ chave: g.dia, rotulo: "", valor: g.pontos, dica: `${diaSemanaMes(g.dia)} · +${g.pontos} pts`, destaque: i === ganhos.length - 1 }))}
                  formatar={(v) => `${v} pts`}
                  rotulo="Pontos ganhos por dia"
                />
              ) : (
                <Vazio>Sem pontos neste período.</Vazio>
              )}
            </Painel>
          </div>
        </section>
      )}

      {!ocultas.has("desempenho") && (
        <section aria-label="Desempenho">
          <TituloSecao extra={disciplina ?? "todas as disciplinas"}>Desempenho</TituloSecao>
          <div className="grid gap-4 lg:grid-cols-3">
            <Painel titulo="Notas das atividades" destaque={media !== null ? formatarNota(media) : "—"} nota={media !== null ? `média de ${plural(notas.length, "atividade corrigida", "atividades corrigidas")}` : undefined} className="lg:col-span-2">
              {notas.length ? (
                <ul className="divide-y divide-borda">
                  {notas.map((n) => (
                    <li key={n.id} className="flex items-center justify-between gap-3 py-2.5 text-[14px]">
                      <span className="min-w-0">
                        <span className="block truncate text-tinta">{n.titulo}</span>
                        <span className="text-[12px] text-texto-2">{n.disciplina} · {diaMes(n.quando)}</span>
                      </span>
                      <span className="font-semibold tabular-nums text-tinta">{formatarNota(n.nota)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Vazio>Nenhuma atividade corrigida neste recorte.</Vazio>
              )}
            </Painel>
            <div className="grid gap-4">
              <Painel titulo="Duelos" destaque={duelos.jogos ? `${duelos.vitorias} de ${duelos.jogos}` : "—"} nota={duelos.jogos ? `vitórias · ${duelos.pontosFeitos} de ${duelos.pontosTotal} pontos` : undefined}>
                {duelos.jogos ? (
                  <BarrasHorizontais
                    rotulo="Vitórias e derrotas em duelos"
                    dados={[
                      { chave: "v", rotulo: "Vitórias", valor: duelos.vitorias, cor: "var(--color-verde)", valorTexto: String(duelos.vitorias) },
                      { chave: "d", rotulo: "Derrotas", valor: duelos.derrotas, cor: "var(--color-texto-2)", valorTexto: String(duelos.derrotas) },
                    ]}
                  />
                ) : (
                  <Vazio>Nenhum duelo encerrado.</Vazio>
                )}
              </Painel>
              <Painel titulo="Flashcards" destaque={vistas ? `${Math.round((acertos / vistas) * 100)}%` : "—"} nota={vistas ? `${acertos} acertos em ${vistas} cartas vistas` : undefined}>
                {vistas ? (
                  <BarrasHorizontais
                    rotulo="Cartas vistas e acertos"
                    dados={[
                      { chave: "v", rotulo: "Vistas", valor: vistas, cor: "var(--color-texto-2)", valorTexto: String(vistas) },
                      { chave: "a", rotulo: "Acertos", valor: acertos, cor: "var(--color-verde)", valorTexto: String(acertos) },
                    ]}
                  />
                ) : (
                  <Vazio>Nenhuma carta revisada ainda.</Vazio>
                )}
              </Painel>
            </div>
          </div>
        </section>
      )}

      {!ocultas.has("missoes") && (
        <section aria-label="Missões e medalhas">
          <TituloSecao extra={disciplina ?? "todas as disciplinas"}>Missões e medalhas</TituloSecao>
          <div className="grid gap-4 lg:grid-cols-2">
            <Painel titulo="Concluídas por semana" destaque={fmt(totalConcluidas)} nota="missões e atividades nas últimas 8 semanas">
              {totalConcluidas ? (
                <Barras
                  altura={120}
                  dados={semanas.map((w, i) => ({ chave: w.inicio, rotulo: i === 7 ? "Atual" : `S${i + 1}`, valor: w.total, dica: `Semana de ${diaMes(w.inicio)} · ${w.total}`, destaque: i === 7 }))}
                  rotulo="Missões e atividades concluídas por semana"
                />
              ) : (
                <Vazio>Nada concluído nas últimas semanas.</Vazio>
              )}
            </Painel>
            <Painel titulo="Medalhas" destaque={`${conquistadas} de ${medalhas.length}`} nota="conquistadas">
              <BarrasHorizontais
                rotulo="Progresso das medalhas"
                dados={medalhas.map((m) => ({ chave: m.def.id, rotulo: m.def.nome, valor: m.pct, cor: m.completa ? "var(--color-verde)" : "var(--color-texto-2)", valorTexto: m.texto }))}
              />
            </Painel>
          </div>
        </section>
      )}
    </div>
  );
}
