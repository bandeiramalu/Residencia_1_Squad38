"use client";

import { BarChart3, FileDown, FileSpreadsheet, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState, type ReactNode } from "react";
import { LinkPessoa } from "@/components/ui/LinkPessoa";
import { TituloPagina, Vazio } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { Entrada, Seletor } from "@/components/ui/Campo";
import { Barras, BarrasHorizontais, MapaDeCalor, Rosca, type Barra, type BarraH, type Fatia } from "@/components/ui/graficos";
import { Segmentado } from "@/components/ui/Segmentado";
import { DISCIPLINAS, type Disciplina } from "@/data/escola";
import { LIGAS } from "@/data/ranking";
import { MEDIA_MINUTOS_TURMA } from "@/data/turmas";
import { TURMAS_ESCOLA } from "@/data/professor";
import { useAgora } from "@/hooks/useAgora";
import { cn } from "@/lib/cn";
import { COR_DISCIPLINA } from "@/lib/cores";
import { formatarMinutos } from "@/lib/estudos";
import { fmt, normalizar } from "@/lib/format";
import { ultimoAcesso, alunosDoPainel, type AlunoPainel } from "@/lib/turmas";
import { useEstado } from "@/store/store";
import { ligaDoAluno, missoesConcluidas, mapa, PERIODOS, porHora, SECOES, serie, TURMAS, xpNoPeriodo, type Liga, type Periodo, type SecaoId } from "./estatisticasDados";
import { RiscoBadge, turmaCurta } from "./comum";
import { baixarEstatisticasCsv, baixarEstatisticasPdf, type SecaoExport } from "./relatorios";

const COR_LIGA: Record<Liga, string> = { bronze: "var(--color-ambar)", prata: "var(--color-texto-2)", ouro: "var(--color-ouro)", diamante: "var(--color-cepi)" };
const IDS_SECAO = SECOES.map((s) => s.id);

/** Estatísticas da equipe pedagógica: todos os gráficos, com filtros guardados na URL. */
export function EstatisticasView() {
  return (
    <Suspense fallback={null}>
      <Conteudo />
    </Suspense>
  );
}

function Cartao({ titulo, destaque, legenda, children, className }: { titulo: string; destaque?: ReactNode; legenda?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0 rounded-2xl border border-borda bg-superficie p-4", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[14px] font-semibold text-tinta">{titulo}</h3>
        {destaque && <p className="shrink-0 text-[15px] font-semibold tabular-nums text-tinta">{destaque}</p>}
      </div>
      {legenda && <p className="mt-0.5 text-[12px] text-texto-2">{legenda}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Bloco({ id, titulo, children, nota }: { id: SecaoId; titulo: string; children: ReactNode; nota?: string }) {
  return (
    <section aria-labelledby={`sec-${id}`} className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={`sec-${id}`} className="text-[16px] font-semibold text-tinta">
          {titulo}
        </h2>
        {nota && <span className="text-right text-[12px] text-texto-2">{nota}</span>}
      </div>
      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Legenda({ itens }: { itens: { rotulo: string; cor: string; valor: ReactNode }[] }) {
  return (
    <ul className="space-y-1.5 text-[12.5px]">
      {itens.map((i) => (
        <li key={i.rotulo} className="flex items-center gap-2 text-texto-2">
          <i className="size-2.5 shrink-0 rounded-[3px]" style={{ background: i.cor }} />
          <span className="flex-1 truncate">{i.rotulo}</span>
          <span className="font-semibold tabular-nums text-tinta">{i.valor}</span>
        </li>
      ))}
    </ul>
  );
}

function RoscaComLegenda({ fatias, centro, rotulo }: { fatias: Fatia[]; centro: ReactNode; rotulo: string }) {
  const total = fatias.reduce((s, f) => s + f.valor, 0);
  if (total === 0) return <p className="py-6 text-center text-[13px] text-texto-2">Sem dados neste recorte.</p>;
  return (
    <div className="flex flex-wrap items-center gap-5">
      <Rosca fatias={fatias.filter((f) => f.valor > 0)} tamanho={128} espessura={14} rotulo={rotulo}>
        {centro}
      </Rosca>
      <div className="min-w-[8rem] flex-1">
        <Legenda itens={fatias.map((f) => ({ rotulo: f.rotulo, cor: f.cor, valor: f.valor }))} />
      </div>
    </div>
  );
}

const soma = (v: number[]) => v.reduce((s, x) => s + x, 0);

function Conteudo() {
  const estado = useEstado();
  const agora = useAgora(60_000);
  const router = useRouter();
  const params = useSearchParams();

  const turma = params.get("turma") ?? "todas";
  const periodo = (PERIODOS.some((p) => p.id === params.get("periodo")) ? params.get("periodo") : "30") as Periodo;
  const disc = (DISCIPLINAS as readonly string[]).includes(params.get("disc") ?? "") ? (params.get("disc") as Disciplina) : "todas";
  const alunoId = params.get("aluno") ?? "";
  const visiveisParam = params.get("secoes");
  const visiveis: SecaoId[] = visiveisParam === null ? IDS_SECAO : (visiveisParam.split(",").filter((s) => (IDS_SECAO as string[]).includes(s)) as SecaoId[]);
  const dias = PERIODOS.find((p) => p.id === periodo)?.dias ?? 30;
  const rotuloPeriodo = periodo === "bim" ? "no bimestre" : `em ${dias} dias`;

  const [busca, setBusca] = useState("");

  const atualizar = (mudancas: Record<string, string | null>) => {
    const q = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(mudancas)) {
      if (v === null || v === "" || v === "todas") q.delete(k);
      else q.set(k, v);
    }
    const s = q.toString();
    router.replace(`/professor/estatisticas${s ? `?${s}` : ""}`);
  };
  const alternarSecao = (id: SecaoId) => {
    const novas = visiveis.includes(id) ? visiveis.filter((x) => x !== id) : IDS_SECAO.filter((x) => x === id || visiveis.includes(x));
    atualizar({ secoes: novas.length === IDS_SECAO.length ? null : novas.length === 0 ? "nenhuma" : novas.join(",") });
  };

  // Todos os alunos das turmas do professor (base para busca e filtros).
  const todos = useMemo(() => TURMAS.flatMap((t) => alunosDoPainel(estado, t, agora)), [estado, agora]);
  const escolhido = todos.find((a) => a.id === alunoId);
  const alunos: AlunoPainel[] = todos.filter((a) => (turma === "todas" || a.turma === turma) && (!alunoId || a.id === alunoId));
  const ids = new Set(alunos.map((a) => a.id));
  const turmasEscopo = turma === "todas" ? [...TURMAS] : [turma];
  const filtrosAtivos = turma !== "todas" || periodo !== "30" || disc !== "todas" || !!alunoId || visiveisParam !== null;
  const termo = normalizar(busca.trim());
  const sugestoes = termo ? todos.filter((a) => normalizar(a.nome).includes(termo)).slice(0, 6) : [];

  const mostra = (id: SecaoId) => visiveis.includes(id);
  const n = Math.max(1, alunos.length);

  /* ───── derivados ───── */
  const pontos = serie(alunos, dias, disc, agora);
  const totalMin = soma(pontos.map((p) => p.minutos));
  const mediaAtivos = Math.round(soma(pontos.map((p) => p.ativos)) / Math.max(1, pontos.length));
  const diario = dias <= 30;
  const barrasAtivos: Barra[] = pontos.map((p, i) => ({ chave: i, rotulo: p.rotulo, valor: p.ativos, destaque: i === pontos.length - 1, dica: `${p.rotulo} · ${p.ativos} ativos` }));
  const barrasHoras: Barra[] = pontos.map((p, i) => ({ chave: i, rotulo: p.rotulo, valor: Math.round(p.minutos / 6) / 10, destaque: i === pontos.length - 1, dica: `${p.rotulo} · ${formatarMinutos(p.minutos)}` }));
  const passo = pontos.length > 12 ? 5 : 1;

  const semanas = periodo === "7" ? 2 : periodo === "30" ? 5 : 9;
  const celulas = mapa(alunos, semanas, disc, agora);
  const diasComEstudo = celulas.flat().filter((c) => !c.futuro && c.minutos > 0).length;
  const diasPassados = celulas.flat().filter((c) => !c.futuro).length;

  const horas = porHora(totalMin, `${turma}:${alunoId}:${disc}`);
  const pico = horas.reduce((m, h) => (h.minutos > m.minutos ? h : m), horas[0]);
  const barrasHora: Barra[] = horas.map((h) => ({ chave: h.hora, rotulo: `${h.hora}h`, valor: h.minutos, destaque: h.hora === pico.hora, dica: `${h.hora}h · ${formatarMinutos(h.minutos)}` }));

  const totaisDisc = DISCIPLINAS.map((d) => {
    const s = serie(alunos, dias, d, agora);
    return { d, min: soma(s.map((p) => p.minutos)) };
  });
  const porDisc: BarraH[] = (disc === "todas" ? totaisDisc : [totaisDisc.find((t) => t.d === disc)!, { d: "Outras" as Disciplina, min: soma(totaisDisc.filter((t) => t.d !== disc).map((t) => t.min)) }])
    .sort((x, y) => y.min - x.min)
    .map((t) => ({ chave: t.d, rotulo: t.d, valor: t.min, cor: t.d === ("Outras" as string) ? "var(--color-texto-2)" : COR_DISCIPLINA[t.d], valorTexto: formatarMinutos(t.min) }));

  const fator = disc === "todas" ? 1 : 0.125;
  const mediaTurma = (t: string) => {
    const doGrupo = todos.filter((a) => a.turma === t);
    const sel = turmasEscopo.includes(t) && !alunoId;
    return Math.round((sel && doGrupo.length ? soma(doGrupo.map((a) => a.minutosSemana)) / doGrupo.length : (MEDIA_MINUTOS_TURMA[t] ?? 0)) * fator);
  };
  const turmasEscola: BarraH[] = TURMAS_ESCOLA.map((t) => ({ chave: t, rotulo: turmaCurta(t), valor: mediaTurma(t), cor: turmasEscopo.includes(t) ? "var(--color-verde)" : "var(--color-texto-2)", valorTexto: formatarMinutos(mediaTurma(t)) })).sort((a, b) => b.valor - a.valor);
  const mediaEscola = Math.round(soma(TURMAS_ESCOLA.map(mediaTurma)) / TURMAS_ESCOLA.length);
  const minhaMedia = alunos.length ? Math.round(soma(alunos.map((a) => a.minutosSemana)) * fator / n) : 0;

  const atividades = estado.atividades.filter((a) => turmasEscopo.includes(a.turma) && (disc === "todas" || a.disciplina === disc)).sort((x, y) => x.prazo - y.prazo).slice(-10);
  const linhasAtiv = atividades.map((a) => {
    const es = a.entregas.filter((e) => ids.has(e.alunoId));
    const notas = es.filter((e) => e.status === "corrigida" && e.nota !== undefined).map((e) => e.nota as number);
    return { a, notas, media: notas.length ? soma(notas) / notas.length : 0, entregue: es.length ? Math.round((es.filter((e) => e.status !== "pendente").length / es.length) * 100) : 0, total: es.length };
  });
  const notasTodas = linhasAtiv.flatMap((l) => l.notas);
  const mediaNotas = notasTodas.length ? soma(notasTodas) / notasTodas.length : 0;
  const taxaEntrega = linhasAtiv.length ? Math.round(soma(linhasAtiv.map((l) => l.entregue)) / linhasAtiv.length) : 0;
  const curto = (t: string) => t.split(" ")[0].slice(0, 7);
  const barrasNotas: Barra[] = linhasAtiv.map((l) => ({ chave: l.a.id, rotulo: curto(l.a.titulo), valor: Math.round(l.media * 10) / 10, dica: `${l.a.titulo} · média ${l.media.toFixed(1)}` }));
  const barrasEntregas: Barra[] = linhasAtiv.map((l) => ({ chave: l.a.id, rotulo: curto(l.a.titulo), valor: l.entregue, dica: `${l.a.titulo} · ${l.entregue}% entregaram` }));
  const faixas = ["<5", "5-6", "7-8", "9-10"].map((rotulo, i) => ({
    chave: rotulo,
    rotulo,
    valor: notasTodas.filter((x) => (i === 0 ? x < 5 : i === 1 ? x >= 5 && x < 7 : i === 2 ? x >= 7 && x < 9 : x >= 9)).length,
  }));

  const concl = soma(alunos.map((a) => missoesConcluidas(a, dias, disc)));
  const andamento = Math.round(concl * 0.3);
  const naoIniciadas = Math.round(concl * 0.18);
  const taxaMissoes = concl + andamento + naoIniciadas ? Math.round((concl / (concl + andamento + naoIniciadas)) * 100) : 0;
  const cartoes = pontos.map((p, i) => ({ chave: i, rotulo: p.rotulo, valor: Math.round(p.minutos * 0.8), destaque: i === pontos.length - 1, dica: `${p.rotulo} · ${Math.round(p.minutos * 0.8)} cartões` }));
  const totalCartoes = soma(cartoes.map((c) => c.valor));

  const porLiga = LIGAS.map((l) => ({ chave: l.id, rotulo: l.nome, valor: alunos.filter((a) => ligaDoAluno(a.xp) === l.id).length, cor: COR_LIGA[l.id] }));
  const xpPeriodo = (a: AlunoPainel) => xpNoPeriodo(a, dias, disc, agora);
  const topXp = [...alunos].sort((a, b) => xpPeriodo(b) - xpPeriodo(a)).slice(0, 6);

  const campeonatos = estado.campeonatos
    .map((c) => ({ c, qtd: c.formato === "interclasses" ? c.participantes.filter((t) => turmasEscopo.includes(t)).length : c.participantes.filter((id) => ids.has(id)).length }))
    .filter((x) => x.qtd > 0 && (disc === "todas" || x.c.disciplina === disc || !x.c.disciplina));
  const barrasCamp: BarraH[] = campeonatos.sort((x, y) => y.qtd - x.qtd).slice(0, 6).map(({ c, qtd }) => ({
    chave: c.id,
    rotulo: (
      <Link href={`/campeonatos/${c.id}`} className="hover:underline">
        {c.nome}
      </Link>
    ),
    valor: qtd,
    valorTexto: c.formato === "interclasses" ? `${qtd} ${qtd === 1 ? "turma" : "turmas"}` : `${qtd} ${qtd === 1 ? "aluno" : "alunos"}`,
  }));
  const participantes = new Set(estado.campeonatos.filter((c) => c.formato !== "interclasses").flatMap((c) => c.participantes.filter((id) => ids.has(id))));

  const fila = estado.posts.filter((p) => p.emRevisao || p.denuncia);
  const doEscopo = (autorId: string) => (alunoId ? autorId === alunoId : turma === "todas" || estado.pessoas[autorId]?.turma === turma);
  const sinalizadas = fila.filter((p) => doEscopo(p.autorId)).length;
  const decisoes = Object.entries(estado.moderacao);
  const decididas = decisoes.filter(([id]) => {
    const post = estado.posts.find((p) => p.id === id);
    return post ? doEscopo(post.autorId) : turma === "todas" && !alunoId;
  });
  const liberadas = decididas.filter(([, d]) => d === "aprovado").length;
  const removidas = decididas.filter(([, d]) => d === "removido").length;

  const emRisco = alunos.filter((a) => a.risco !== "baixo").sort((a, b) => Number(b.risco === "alto") - Number(a.risco === "alto") || b.ultimoAcessoHa - a.ultimoAcessoHa);
  const riscoAlto = emRisco.filter((a) => a.risco === "alto").length;
  const riscoMedio = emRisco.length - riscoAlto;

  const semDados = alunos.length === 0;

  const recorteTexto = [
    turma === "todas" ? "Todas as turmas" : turma,
    disc === "todas" ? "todas as disciplinas" : disc,
    periodo === "bim" ? "bimestre" : `${dias} dias`,
    escolhido ? `aluno: ${escolhido.nome}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const secoesExport = (): SecaoExport[] => {
    const r: SecaoExport[] = [
      {
        titulo: "Resumo",
        colunas: ["Indicador", "Valor"],
        linhas: [
          ["Alunos no recorte", String(alunos.length)],
          ["Estudo total", formatarMinutos(totalMin)],
          ["Estudo médio por aluno na semana", formatarMinutos(minhaMedia)],
          ["Ativos por dia (média)", String(mediaAtivos)],
        ],
      },
    ];
    if (mostra("engajamento")) r.push({ titulo: "Engajamento por dia", colunas: ["Dia", "Alunos ativos", "Estudo"], linhas: pontos.map((p) => [p.rotulo, String(p.ativos), formatarMinutos(p.minutos)]) });
    if (mostra("foco")) {
      r.push({ titulo: "Estudo por disciplina", colunas: ["Disciplina", "Tempo"], linhas: porDisc.map((b) => [String(b.rotulo), b.valorTexto ?? String(b.valor)]) });
      r.push({ titulo: "Média semanal por turma", colunas: ["Turma", "Tempo"], linhas: turmasEscola.map((b) => [String(b.rotulo), b.valorTexto ?? String(b.valor)]) });
    }
    if (mostra("desempenho")) {
      r.push({
        titulo: "Atividades",
        colunas: ["Atividade", "Disciplina", "Turma", "Média das notas", "Entregaram"],
        linhas: linhasAtiv.map((l) => [l.a.titulo, l.a.disciplina, l.a.turma, l.notas.length ? l.media.toFixed(1).replace(".", ",") : "-", `${l.entregue}%`]),
      });
      r.push({ titulo: "Distribuição das notas", colunas: ["Faixa", "Alunos"], linhas: faixas.map((f) => [f.rotulo, String(f.valor)]) });
    }
    if (mostra("missoes")) r.push({ titulo: "Missões e cartões", colunas: ["Indicador", "Valor"], linhas: [["Missões concluídas", String(concl)], ["Taxa de conclusão", `${taxaMissoes}%`], ["Cartões estudados", String(totalCartoes)]] });
    if (mostra("ranking")) {
      r.push({ titulo: "XP no período (top 6)", colunas: ["Aluno", "Turma", "XP"], linhas: topXp.map((a) => [a.nome, a.turma, String(xpPeriodo(a))]) });
      r.push({ titulo: "Ligas", colunas: ["Liga", "Alunos"], linhas: porLiga.map((l) => [l.rotulo, String(l.valor)]) });
    }
    if (mostra("campeonatos")) r.push({ titulo: "Campeonatos", colunas: ["Campeonato", "Participantes"], linhas: campeonatos.map(({ c, qtd }) => [c.nome, String(qtd)]) });
    if (mostra("moderacao")) r.push({ titulo: "Moderação", colunas: ["Indicador", "Valor"], linhas: [["Aguardando revisão", String(sinalizadas)], ["Liberadas", String(liberadas)], ["Removidas", String(removidas)]] });
    if (mostra("risco")) r.push({ titulo: "Alunos em risco", colunas: ["Aluno", "Turma", "Situação", "Último acesso", "Estudo na semana"], linhas: emRisco.map((a) => [a.nome, a.turma, a.risco === "alto" ? "Risco alto" : "Atenção", ultimoAcesso(a.ultimoAcessoHa), formatarMinutos(a.minutosSemana)]) });
    return r;
  };

  return (
    <div className="space-y-6">
      <TituloPagina
        titulo="Estatísticas"
        descricao="Todos os gráficos num só lugar. Use os filtros para limpar a tela."
        acao={
          <div className="flex gap-2">
            <Button variante="secundario" onClick={() => baixarEstatisticasPdf(recorteTexto, secoesExport())} disabled={semDados}>
              <FileDown /> Exportar (PDF)
            </Button>
            <Button variante="secundario" onClick={() => baixarEstatisticasCsv(recorteTexto, secoesExport())} disabled={semDados}>
              <FileSpreadsheet /> Dados (CSV)
            </Button>
          </div>
        }
      />

      {/* Filtros */}
      <div className="z-30 -mx-4 space-y-2 lg:sticky lg:top-14 border-b border-borda bg-fundo/95 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6 lg:mx-0 lg:rounded-2xl lg:border lg:px-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_1.3fr_auto]">
          <Seletor value={turma} onChange={(e) => atualizar({ turma: e.target.value })} aria-label="Turma">
            <option value="todas">Todas as turmas</option>
            {TURMAS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Seletor>
          <Segmentado
            opcoes={PERIODOS.map((p) => ({ id: p.id, rotulo: p.rotulo }))}
            valor={periodo}
            onChange={(v) => atualizar({ periodo: v === "30" ? null : v })}
            grupo="est-periodo"
            rotulo="Período"
            tamanho="sm"
            className="sm:col-span-2 lg:col-span-1"
          />
          <Seletor value={disc} onChange={(e) => atualizar({ disc: e.target.value })} aria-label="Disciplina">
            <option value="todas">Todas as disciplinas</option>
            {DISCIPLINAS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Seletor>
          <div className="relative">
            {escolhido ? (
              <div className="flex h-10 items-center gap-2 rounded-xl border border-borda bg-superficie px-3 text-[14px] text-tinta">
                <span className="min-w-0 flex-1 truncate">{escolhido.nome}</span>
                <button type="button" onClick={() => atualizar({ aluno: null })} aria-label="Remover filtro de aluno" className="text-texto-2 hover:text-tinta">
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <>
                <Entrada icone={<Search />} type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Aluno (opcional)" aria-label="Buscar aluno" />
                {sugestoes.length > 0 && (
                  <ul className="absolute inset-x-0 top-full z-40 mt-1 overflow-hidden rounded-xl border border-borda bg-superficie shadow-flutuante">
                    {sugestoes.map((a) => (
                      <li key={a.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setBusca("");
                            atualizar({ aluno: a.id });
                          }}
                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13.5px] text-tinta hover:bg-superficie-2"
                        >
                          <span className="truncate">{a.nome}</span>
                          <span className="shrink-0 text-[12px] text-texto-2">{turmaCurta(a.turma)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
          <Button
            variante="fantasma"
            onClick={() => {
              setBusca("");
              router.replace("/professor/estatisticas");
            }}
            disabled={!filtrosAtivos}
          >
            Limpar filtros
          </Button>
        </div>
        <div className="sem-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Seções visíveis">
          {SECOES.map((s) => {
            const ativa = visiveis.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={ativa}
                onClick={() => alternarSecao(s.id)}
                className={cn(
                  "h-8 shrink-0 rounded-full border px-3 text-[12.5px] font-medium transition-[background-color,color,transform] duration-150 active:scale-[0.97]",
                  ativa ? "border-tinta bg-tinta text-superficie" : "border-borda bg-superficie text-texto-2 hover:text-tinta",
                )}
              >
                {s.rotulo}
              </button>
            );
          })}
        </div>
      </div>

      {semDados ? (
        <Vazio
          icone={<BarChart3 />}
          titulo="Sem dados neste recorte"
          descricao="Nenhum aluno atende a esses filtros. Tente outra turma ou limpe a busca."
          acao={
            <Button variante="secundario" tamanho="sm" onClick={() => router.replace("/professor/estatisticas")}>
              Limpar filtros
            </Button>
          }
        />
      ) : visiveis.length === 0 ? (
        <Vazio icone={<BarChart3 />} titulo="Nenhuma seção marcada" descricao="Ligue uma seção nos botões acima para ver os gráficos." />
      ) : (
        <div className="space-y-8">
          <p className="text-[13px] text-texto-2">
            {escolhido ? escolhido.nome : turma === "todas" ? "Todas as turmas" : turma} · {alunos.length} {alunos.length === 1 ? "aluno" : "alunos"} · {disc === "todas" ? "todas as disciplinas" : disc} · {PERIODOS.find((p) => p.id === periodo)?.rotulo}
          </p>

          {mostra("engajamento") && (
            <Bloco id="engajamento" titulo="Engajamento">
              <Cartao titulo={diario ? "Ativos por dia" : "Ativos por semana (média diária)"} destaque={`${mediaAtivos} de ${alunos.length}`} legenda="Alunos que estudaram">
                <Barras dados={barrasAtivos} altura={140} passoRotulo={passo} rotulo="Alunos ativos por período" />
              </Cartao>
              <Cartao titulo="Horas de estudo" destaque={formatarMinutos(totalMin)} legenda={`Horas somadas ${rotuloPeriodo}`}>
                <Barras dados={barrasHoras} altura={140} passoRotulo={passo} formatar={(v) => `${v} h`} rotulo="Horas de estudo por período" />
              </Cartao>
            </Bloco>
          )}

          {mostra("foco") && (
            <Bloco id="foco" titulo="Foco e estudo">
              <Cartao titulo="Constância" destaque={`${diasComEstudo}/${diasPassados} dias`} legenda="Dias com estudo da turma">
                <MapaDeCalor semanas={celulas} formatar={(c) => `${new Date(c.dia).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} · ${formatarMinutos(c.minutos)} por aluno`} />
              </Cartao>
              <Cartao titulo="Horário de pico" destaque={`${pico.hora}h`} legenda="Quando mais estudam">
                <Barras dados={barrasHora} altura={120} passoRotulo={3} rotulo="Minutos de estudo por hora do dia" />
              </Cartao>
              <Cartao titulo="Por disciplina" destaque={formatarMinutos(disc === "todas" ? totalMin : (totaisDisc.find((t) => t.d === disc)?.min ?? 0))} legenda={disc === "todas" ? "Tempo total por matéria" : `${disc} contra as demais`}>
                <BarrasHorizontais dados={porDisc} rotulo="Tempo de estudo por disciplina" />
              </Cartao>
              <Cartao titulo="Turma contra a escola" destaque={`${formatarMinutos(minhaMedia)}`} legenda={`Média por aluno por semana (escola ${formatarMinutos(mediaEscola)})`}>
                <BarrasHorizontais dados={turmasEscola} rotulo="Estudo semanal por turma" />
              </Cartao>
            </Bloco>
          )}

          {mostra("desempenho") && (
            <Bloco id="desempenho" titulo="Desempenho" nota="Últimas atividades">
              {linhasAtiv.length === 0 ? (
                <Cartao titulo="Notas e entregas" className="md:col-span-2">
                  <p className="py-4 text-center text-[13px] text-texto-2">Nenhuma atividade neste recorte.</p>
                </Cartao>
              ) : (
                <>
                  <Cartao titulo="Notas por atividade" destaque={notasTodas.length ? mediaNotas.toFixed(1).replace(".", ",") : "–"} legenda="Média das corrigidas">
                    <Barras dados={barrasNotas} altura={130} meta={7} rotuloMeta="7" rotulo="Média de nota por atividade" />
                  </Cartao>
                  <Cartao titulo="Entregas por atividade" destaque={`${taxaEntrega}%`} legenda="Quem entregou">
                    <Barras dados={barrasEntregas} altura={130} formatar={(v) => `${v}%`} rotulo="Percentual de entregas por atividade" />
                  </Cartao>
                  <Cartao titulo="Distribuição das notas" destaque={`${notasTodas.length} notas`} legenda="Faixas de nota" className="md:col-span-2">
                    {notasTodas.length ? <Barras dados={faixas.map((f) => ({ ...f, dica: `${f.rotulo}: ${f.valor}` }))} altura={90} rotulo="Distribuição das notas" /> : <p className="py-4 text-center text-[13px] text-texto-2">Ainda sem notas.</p>}
                  </Cartao>
                </>
              )}
            </Bloco>
          )}

          {mostra("missoes") && (
            <Bloco id="missoes" titulo="Missões e flashcards">
              <Cartao titulo="Missões" destaque={`${taxaMissoes}%`} legenda={`Concluídas ${rotuloPeriodo}`}>
                <RoscaComLegenda
                  rotulo="Situação das missões"
                  centro={<p className="text-[18px] font-semibold tabular-nums text-tinta">{concl}</p>}
                  fatias={[
                    { chave: "c", rotulo: "Concluídas", valor: concl, cor: "var(--color-verde)" },
                    { chave: "a", rotulo: "Em andamento", valor: andamento, cor: "var(--color-ambar)" },
                    { chave: "n", rotulo: "Não iniciadas", valor: naoIniciadas, cor: "var(--color-texto-2)" },
                  ]}
                />
              </Cartao>
              <Cartao titulo="Flashcards revisados" destaque={fmt(totalCartoes)} legenda="Cartões por período">
                <Barras dados={cartoes} altura={120} passoRotulo={passo} rotulo="Flashcards revisados por período" />
              </Cartao>
            </Bloco>
          )}

          {mostra("ranking") && (
            <Bloco id="ranking" titulo="Ranking e ligas">
              <Cartao titulo="Alunos por liga" destaque={`${alunos.length}`} legenda="Distribuição atual">
                <RoscaComLegenda rotulo="Alunos por liga" centro={<p className="text-[18px] font-semibold tabular-nums text-tinta">{alunos.length}</p>} fatias={porLiga} />
              </Cartao>
              <Cartao titulo="Mais XP" destaque={topXp[0] ? `${fmt(xpPeriodo(topXp[0]))} XP` : undefined} legenda={`Top 6 ${rotuloPeriodo}`}>
                <BarrasHorizontais
                  rotulo="Alunos com mais XP"
                  dados={topXp.map((a) => ({
                    chave: a.id,
                    rotulo: <LinkPessoa id={a.id} className="hover:underline">{a.nome}</LinkPessoa>,
                    valor: xpPeriodo(a),
                    valorTexto: fmt(xpPeriodo(a)),
                  }))}
                />
              </Cartao>
            </Bloco>
          )}

          {mostra("campeonatos") && (
            <Bloco id="campeonatos" titulo="Campeonatos">
              <Cartao titulo="Participação" destaque={`${participantes.size} de ${alunos.length}`} legenda="Alunos em algum campeonato" className="md:col-span-2">
                {barrasCamp.length ? <BarrasHorizontais dados={barrasCamp} rotulo="Participantes por campeonato" /> : <p className="py-4 text-center text-[13px] text-texto-2">Nenhum campeonato com participantes neste recorte.</p>}
              </Cartao>
            </Bloco>
          )}

          {mostra("moderacao") && (
            <Bloco id="moderacao" titulo="Moderação">
              <Cartao titulo="Publicações revisadas" destaque={`${sinalizadas + liberadas + removidas}`} legenda="Sinalizadas, liberadas e removidas" className="md:col-span-2">
                <RoscaComLegenda
                  rotulo="Situação das publicações sinalizadas"
                  centro={<p className="text-[18px] font-semibold tabular-nums text-tinta">{sinalizadas + liberadas + removidas}</p>}
                  fatias={[
                    { chave: "s", rotulo: "Sinalizadas", valor: sinalizadas, cor: "var(--color-ambar)" },
                    { chave: "l", rotulo: "Liberadas", valor: liberadas, cor: "var(--color-verde)" },
                    { chave: "r", rotulo: "Removidas", valor: removidas, cor: "var(--color-alerta)" },
                  ]}
                />
                <Link href="/professor/moderacao" className="mt-3 inline-block text-[13px] font-medium text-acento hover:underline">
                  Abrir moderação
                </Link>
              </Cartao>
            </Bloco>
          )}

          {mostra("risco") && (
            <Bloco id="risco" titulo="Alunos em risco">
              <Cartao titulo="Situação" destaque={`${riscoAlto} em risco alto`} legenda="Acesso e estudo da semana">
                <RoscaComLegenda
                  rotulo="Alunos por nível de risco"
                  centro={<p className="text-[18px] font-semibold tabular-nums text-tinta">{emRisco.length}</p>}
                  fatias={[
                    { chave: "a", rotulo: "Risco alto", valor: riscoAlto, cor: "var(--color-alerta)" },
                    { chave: "m", rotulo: "Atenção", valor: riscoMedio, cor: "var(--color-ambar)" },
                    { chave: "b", rotulo: "Em dia", valor: alunos.length - emRisco.length, cor: "var(--color-verde)" },
                  ]}
                />
              </Cartao>
              <Cartao titulo="Quem precisa de atenção" destaque={emRisco.length ? `${emRisco.length}` : undefined}>
                {emRisco.length === 0 ? (
                  <p className="py-4 text-center text-[13px] text-texto-2">Ninguém em risco.</p>
                ) : (
                  <ul className="divide-y divide-borda">
                    {emRisco.slice(0, 6).map((a) => (
                      <li key={a.id} className="flex items-center gap-3 py-2 text-[13.5px]">
                        <LinkPessoa id={a.id} className="min-w-0 flex-1 truncate font-medium text-tinta hover:underline">
                          {a.nome}
                        </LinkPessoa>
                        <span className="shrink-0 text-[12px] text-texto-2">{ultimoAcesso(a.ultimoAcessoHa)}</span>
                        <RiscoBadge risco={a.risco} />
                      </li>
                    ))}
                  </ul>
                )}
                <Link href="/professor/alunos?filtro=risco" className="mt-2 inline-block text-[13px] font-medium text-acento hover:underline">
                  Ver na lista de alunos
                </Link>
              </Cartao>
            </Bloco>
          )}
        </div>
      )}
    </div>
  );
}
