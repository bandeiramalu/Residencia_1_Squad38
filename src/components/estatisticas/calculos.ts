/** Derivações puras das estatísticas pessoais da aluna (nada aqui muda estado). */
import { ESCOLA, type Disciplina } from "@/data/escola";
import { MEDALHAS } from "@/data/medalhas";
import { diasSeguidosComEstudo, formatarMinutos, minutosPorDia, porDisciplina } from "@/lib/estudos";
import { progressoMedalha } from "@/lib/gamificacao";
import { fmt } from "@/lib/format";
import type { Documento } from "@/lib/pdf";
import { dataCurta, diaDaSemana, inicioDoDia, NOMES_DIAS, somarDias } from "@/lib/tempo";
import type { AppState, SessaoEstudo } from "@/store/types";

export type PeriodoId = "7" | "30" | "60";
export const PERIODOS: { id: PeriodoId; rotulo: string; dias: number; texto: string }[] = [
  { id: "7", rotulo: "7 dias", dias: 7, texto: "últimos 7 dias" },
  { id: "30", rotulo: "30 dias", dias: 30, texto: "últimos 30 dias" },
  { id: "60", rotulo: "Bimestre", dias: 60, texto: "último bimestre (60 dias)" },
];

export type SecaoId = "resumo" | "foco" | "evolucao" | "desempenho" | "missoes";
export const SECOES: { id: SecaoId; rotulo: string }[] = [
  { id: "resumo", rotulo: "Resumo" },
  { id: "foco", rotulo: "Foco e estudo" },
  { id: "evolucao", rotulo: "Evolução" },
  { id: "desempenho", rotulo: "Desempenho" },
  { id: "missoes", rotulo: "Missões e medalhas" },
];

export interface Recorte {
  dias: number;
  desde: number;
  disciplina: Disciplina | null;
  /** Sessões do período, já filtradas por disciplina. */
  sessoes: SessaoEstudo[];
  /** Sessões de todo o histórico, filtradas por disciplina (para gráficos com janela própria). */
  historico: SessaoEstudo[];
}

export function recortar(estado: AppState, dias: number, disciplina: Disciplina | null, agora: number): Recorte {
  const desde = somarDias(inicioDoDia(agora), -(dias - 1));
  const historico = estado.estudos.sessoes.filter((s) => !disciplina || s.disciplina === disciplina);
  return { dias, desde, disciplina, historico, sessoes: historico.filter((s) => s.inicio >= desde) };
}

/* ───────────── Evolução de XP e pontos ───────────── */

export interface GanhoDia {
  dia: number;
  xp: number;
  pontos: number;
}

/**
 * Ganhos diários. Eventos datados (atividades corrigidas, bônus de professor) entram no dia real;
 * o que sobra do total atual de XP/pontos é distribuído pelos últimos 90 dias na proporção do tempo
 * estudado em cada dia (determinístico, sem sorteio) — a soma fecha com o total do perfil.
 */
export function ganhosPorDia(estado: AppState, dias: number, agora: number): GanhoDia[] {
  const JANELA = 90;
  const u = estado.usuario;
  const hoje = inicioDoDia(agora);
  const inicioJanela = somarDias(hoje, -(JANELA - 1));
  const xp = new Map<number, number>();
  const pts = new Map<number, number>();
  let somaXp = 0;
  let somaPts = 0;
  const somar = (ts: number, x: number, p: number) => {
    const dia = Math.max(inicioJanela, Math.min(hoje, inicioDoDia(ts)));
    xp.set(dia, (xp.get(dia) ?? 0) + x);
    pts.set(dia, (pts.get(dia) ?? 0) + p);
    somaXp += x;
    somaPts += p;
  };
  for (const a of estado.atividades) {
    for (const e of a.entregas) if (e.alunoId === u.id && e.status === "corrigida") somar(e.entregueEm ?? a.prazo, e.xp ?? 0, e.pontos ?? 0);
  }
  for (const a of estado.atribuicoes) if (a.alunoId === u.id && a.origem !== "correcao") somar(a.criadoEm, a.xp, a.pontos);

  const base = minutosPorDia(estado.estudos.sessoes, JANELA, agora);
  const pesoTotal = base.reduce((s, d) => s + d.minutos, 0);
  const restoXp = Math.max(0, u.xp - somaXp);
  const restoPts = Math.max(0, u.pontos - somaPts);
  const serie = base.map((d) => {
    const peso = pesoTotal ? d.minutos / pesoTotal : 1 / JANELA;
    return { dia: d.dia, xp: Math.round((xp.get(d.dia) ?? 0) + restoXp * peso), pontos: Math.round((pts.get(d.dia) ?? 0) + restoPts * peso) };
  });
  return serie.slice(-dias);
}

/* ───────────── Desempenho ───────────── */

export interface NotaAtividade {
  id: string;
  titulo: string;
  disciplina: Disciplina;
  nota: number;
  quando: number;
}

export function notasDaAluna(estado: AppState, desde: number, disciplina: Disciplina | null): NotaAtividade[] {
  const lista: NotaAtividade[] = [];
  for (const a of estado.atividades) {
    if (disciplina && a.disciplina !== disciplina) continue;
    const e = a.entregas.find((x) => x.alunoId === estado.usuario.id && x.status === "corrigida" && x.nota !== undefined);
    if (!e) continue;
    const quando = e.entregueEm ?? a.prazo;
    if (quando < desde) continue;
    lista.push({ id: a.id, titulo: a.titulo, disciplina: a.disciplina, nota: e.nota ?? 0, quando });
  }
  return lista.sort((x, y) => y.quando - x.quando);
}

export function mediaNotas(notas: NotaAtividade[]) {
  return notas.length ? notas.reduce((s, n) => s + n.nota, 0) / notas.length : null;
}

export function formatarNota(n: number) {
  return n.toFixed(1).replace(".", ",");
}

export function duelosDaAluna(estado: AppState) {
  let vitorias = 0;
  let derrotas = 0;
  let pontosFeitos = 0;
  let pontosTotal = 0;
  for (const c of estado.campeonatos) {
    for (const p of c.partidas) {
      if (p.status !== "encerrada") continue;
      const sou = p.a === estado.usuario.id ? "a" : p.b === estado.usuario.id ? "b" : null;
      if (!sou) continue;
      const meu = (sou === "a" ? p.placarA : p.placarB) ?? 0;
      const dele = (sou === "a" ? p.placarB : p.placarA) ?? 0;
      pontosFeitos += meu;
      pontosTotal += meu + dele;
      if (p.vencedor === estado.usuario.id) vitorias++;
      else derrotas++;
    }
  }
  return { vitorias, derrotas, jogos: vitorias + derrotas, pontosFeitos, pontosTotal };
}

/* ───────────── Missões e medalhas ───────────── */

export interface SemanaConcluida {
  inicio: number;
  total: number;
}

/** Itens concluídos por semana (8 semanas): atividades entregues pela data; missões concluídas contam na semana atual (não têm data). */
export function concluidasPorSemana(estado: AppState, agora: number, disciplina: Disciplina | null): SemanaConcluida[] {
  const hoje = inicioDoDia(agora);
  const segunda = somarDias(hoje, -diaDaSemana(hoje));
  const semanas = Array.from({ length: 8 }, (_, i) => ({ inicio: somarDias(segunda, -7 * (7 - i)), total: 0 }));
  for (const a of estado.atividades) {
    if (disciplina && a.disciplina !== disciplina) continue;
    for (const e of a.entregas) {
      const quando = e.entregueEm;
      if (e.alunoId !== estado.usuario.id || e.status === "pendente" || !quando) continue;
      const s = semanas.find((w) => quando >= w.inicio && quando < somarDias(w.inicio, 7));
      if (s) s.total++;
    }
  }
  semanas[7].total += estado.missoes.filter((m) => m.concluida && (!disciplina || m.disciplina === disciplina)).length;
  return semanas;
}

export function medalhasProgresso(estado: AppState) {
  return MEDALHAS.map((def) => ({ def, ...progressoMedalha(def, estado) }));
}

/* ───────────── Relatório em PDF ───────────── */

export interface DadosRelatorio {
  estado: AppState;
  periodoTexto: string;
  recorte: Recorte;
  agora: number;
  ocultas: Set<SecaoId>;
}

export function montarRelatorio({ estado, periodoTexto, recorte, agora, ocultas }: DadosRelatorio): Documento {
  const u = estado.usuario;
  const { sessoes, desde, dias, disciplina } = recorte;
  const foco = sessoes.reduce((s, x) => s + x.minutos, 0);
  const ciclos = sessoes.filter((s) => s.origem !== "manual").length;
  const sequencia = diasSeguidosComEstudo(estado.estudos.sessoes, agora);
  const ganhos = ganhosPorDia(estado, dias, agora);
  const xp = ganhos.reduce((s, g) => s + g.xp, 0);
  const pontos = ganhos.reduce((s, g) => s + g.pontos, 0);
  const notas = notasDaAluna(estado, desde, disciplina);
  const media = mediaNotas(notas);
  const diasAtivos = new Set(sessoes.map((s) => inicioDoDia(s.inicio))).size;
  const concluidas = estado.missoes.filter((m) => m.concluida).length;
  const duelos = duelosDaAluna(estado);
  const medalhas = medalhasProgresso(estado);

  const semana = Array<number>(7).fill(0);
  for (const s of sessoes) semana[diaDaSemana(s.inicio)] += s.minutos;
  const discs = porDisciplina(sessoes, desde);
  const dias_ = (n: number) => `${n} ${n === 1 ? "dia" : "dias"}`;

  const blocos: Documento["blocos"] = [];

  blocos.push({ tipo: "secao", texto: "Resumo" });
  blocos.push({
    tipo: "paragrafo",
    texto:
      foco > 0
        ? `Nos ${periodoTexto}${disciplina ? `, em ${disciplina}` : ""}, ${u.nome.split(" ")[0]} estudou ${formatarMinutos(foco)} em ${sessoes.length} ${sessoes.length === 1 ? "sessão" : "sessões"}, distribuídas em ${diasAtivos} de ${dias} dias (média de ${formatarMinutos(Math.round(foco / dias))} por dia). A sequência atual é de ${dias_(sequencia)} seguidos. No período, ganhou ${fmt(xp)} XP e ${fmt(pontos)} pontos.`
        : `Não há estudo registrado nos ${periodoTexto}${disciplina ? ` em ${disciplina}` : ""}.`,
  });
  blocos.push({
    tipo: "tabela",
    colunas: ["Indicador", "Valor"],
    linhas: [
      ["Tempo de foco", formatarMinutos(foco)],
      ["Sessões", String(sessoes.length)],
      ["Ciclos de foco (timer e salas)", String(ciclos)],
      ["Sequência de estudo", dias_(sequencia)],
      ["XP ganho no período", fmt(xp)],
      ["Pontos ganhos no período", fmt(pontos)],
    ],
    larguras: [3, 2],
  });

  if (!ocultas.has("foco")) {
    blocos.push({ tipo: "secao", texto: "Foco e estudo" });
    blocos.push({
      tipo: "tabela",
      colunas: ["Disciplina", "Tempo", "Parte do total"],
      linhas: discs.length ? discs.map((d) => [d.disciplina, formatarMinutos(d.minutos), `${Math.round(d.pct * 100)}%`]) : [["Sem registros", "-", "-"]],
      larguras: [3, 2, 2],
    });
    blocos.push({
      tipo: "tabela",
      colunas: ["Dia da semana", "Tempo estudado"],
      linhas: NOMES_DIAS.map((n, i) => [n, semana[i] ? formatarMinutos(semana[i]) : "-"]),
      larguras: [3, 2],
    });
  }

  if (!ocultas.has("desempenho")) {
    blocos.push({ tipo: "secao", texto: "Desempenho" });
    blocos.push({
      tipo: "paragrafo",
      texto: `${media !== null ? `Média das ${notas.length} ${notas.length === 1 ? "atividade corrigida" : "atividades corrigidas"}: ${formatarNota(media)}.` : "Nenhuma atividade corrigida no recorte."} Flashcards: ${estado.pratica.acertos} acertos em ${estado.pratica.vistas} cartas vistas na rodada atual. Duelos: ${duelos.vitorias} ${duelos.vitorias === 1 ? "vitória" : "vitórias"} em ${duelos.jogos} ${duelos.jogos === 1 ? "partida" : "partidas"}.`,
    });
    blocos.push({
      tipo: "tabela",
      colunas: ["Atividade", "Disciplina", "Data", "Nota"],
      linhas: notas.length ? notas.map((n) => [n.titulo, n.disciplina, dataCurta(n.quando), formatarNota(n.nota)]) : [["Sem notas no recorte", "-", "-", "-"]],
      larguras: [5, 2, 2, 1],
    });
  }

  if (!ocultas.has("missoes")) {
    blocos.push({ tipo: "secao", texto: "Missões e medalhas" });
    blocos.push({ tipo: "paragrafo", texto: `${concluidas} de ${estado.missoes.length} missões concluídas.` });
    blocos.push({
      tipo: "tabela",
      colunas: ["Medalha", "Progresso", "Situação"],
      linhas: medalhas.map((m) => [m.def.nome, m.texto, m.completa ? "Conquistada" : `${Math.round(m.pct)}%`]),
      larguras: [3, 2, 2],
    });
  }

  return {
    escola: ESCOLA.nome,
    titulo: "Relatório de estatísticas",
    subtitulo: `${u.nome} · ${u.turma} · ${periodoTexto}${disciplina ? ` · ${disciplina}` : ""} · gerado em ${dataCurta(agora)}`,
    blocos,
  };
}
