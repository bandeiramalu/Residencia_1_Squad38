/**
 * Derivação dos números da aba Estatísticas. Tudo determinístico: o que não existe no
 * estado (séries longas, recortes por disciplina, horários) vem de hash estável por aluno.
 */
import { DISCIPLINAS, type Disciplina } from "@/data/escola";
import { TURMAS_DO_PROFESSOR } from "@/data/professor";
import { hashTexto } from "@/lib/aleatorio";
import { DIA, inicioDaSemana, inicioDoDia, type CelulaMapa } from "@/lib/estudos";
import { somarDias } from "@/lib/tempo";
import type { AlunoPainel } from "@/lib/turmas";

export type Periodo = "7" | "30" | "bim";
export type SecaoId = "engajamento" | "foco" | "desempenho" | "missoes" | "ranking" | "campeonatos" | "moderacao" | "risco";

export const SECOES: { id: SecaoId; rotulo: string }[] = [
  { id: "engajamento", rotulo: "Engajamento" },
  { id: "foco", rotulo: "Foco e estudo" },
  { id: "desempenho", rotulo: "Desempenho" },
  { id: "missoes", rotulo: "Missões e flashcards" },
  { id: "ranking", rotulo: "Ranking e ligas" },
  { id: "campeonatos", rotulo: "Campeonatos" },
  { id: "moderacao", rotulo: "Moderação" },
  { id: "risco", rotulo: "Em risco" },
];

export const PERIODOS: { id: Periodo; rotulo: string; dias: number }[] = [
  { id: "7", rotulo: "7 dias", dias: 7 },
  { id: "30", rotulo: "30 dias", dias: 30 },
  { id: "bim", rotulo: "Bimestre", dias: 56 },
];

export const TURMAS = TURMAS_DO_PROFESSOR as readonly string[];

export function hash01(s: string) {
  return hashTexto(s) / 4294967296;
}

/** Fração do estudo do aluno dedicada à disciplina (1 = todas). */
export function fatiaDisciplina(alunoId: string, disc: Disciplina | "todas") {
  if (disc === "todas") return 1;
  const pesos = DISCIPLINAS.map((d) => 0.5 + hash01(`${alunoId}:${d}`));
  return pesos[DISCIPLINAS.indexOf(disc)] / pesos.reduce((s, p) => s + p, 0);
}

/** Aluna ao vivo: soma as sessões reais do dia (e da disciplina, se houver filtro). */
function minutosReais(a: AlunoPainel, diasAtras: number, disc: Disciplina | "todas", agora: number) {
  const ini = somarDias(inicioDoDia(agora), -diasAtras);
  const fim = somarDias(ini, 1);
  let total = 0;
  for (const s of a.sessoes ?? []) if (s.inicio >= ini && s.inicio < fim && (disc === "todas" || s.disciplina === disc)) total += s.minutos;
  return total;
}

/**
 * Minutos de estudo do aluno `diasAtras` dias atrás (0 = hoje). Para a aluna ao vivo vêm sempre das sessões reais;
 * para os colegas, os 7 últimos dias são os dados de exemplo e os mais antigos uma derivação determinística.
 */
export function minutosDia(a: AlunoPainel, diasAtras: number, disc: Disciplina | "todas", agora: number) {
  if (a.sessoes) return minutosReais(a, diasAtras, disc, agora);
  const f = fatiaDisciplina(a.id, disc);
  if (diasAtras < 7) return Math.round((a.minutos7d[6 - diasAtras] ?? 0) * f);
  const media = a.minutosSemana / 7;
  const h = hash01(`${a.id}:d${diasAtras}`);
  return h < 0.28 ? 0 : Math.round(media * (0.45 + 1.3 * hash01(`${a.id}:v${diasAtras}`)) * f * (a.risco === "alto" ? 0.6 : 1));
}

export interface PontoSerie {
  rotulo: string;
  ativos: number;
  minutos: number;
}

/** Série do período: diária (7 e 30 dias) ou semanal (bimestre), da mais antiga para a mais recente. */
export function serie(alunos: AlunoPainel[], dias: number, disc: Disciplina | "todas", agora: number): PontoSerie[] {
  const hoje = inicioDoDia(agora);
  const diario = dias <= 30;
  const passos = diario ? dias : Math.ceil(dias / 7);
  return Array.from({ length: passos }, (_, i) => {
    const faixa = diario ? [dias - 1 - i] : Array.from({ length: 7 }, (_, k) => (passos - 1 - i) * 7 + k);
    let ativos = 0;
    let minutos = 0;
    for (const d of faixa) {
      for (const a of alunos) {
        const m = minutosDia(a, d, disc, agora);
        if (m > 0) ativos += 1;
        minutos += m;
      }
    }
    if (!diario) ativos = Math.round(ativos / 7);
    const ref = new Date(hoje - (diario ? dias - 1 - i : (passos - 1 - i) * 7 + 6) * DIA);
    const rotulo = diario ? (i === dias - 1 ? "Hoje" : `${ref.getDate()}/${ref.getMonth() + 1}`) : `${ref.getDate()}/${ref.getMonth() + 1}`;
    return { rotulo, ativos, minutos };
  });
}

/** Mapa de calor: minutos médios por aluno em cada dia. */
export function mapa(alunos: AlunoPainel[], semanas: number, disc: Disciplina | "todas", agora: number): CelulaMapa[][] {
  const hoje = inicioDoDia(agora);
  const primeira = inicioDaSemana(agora) - (semanas - 1) * 7 * DIA;
  const n = Math.max(1, alunos.length);
  return Array.from({ length: semanas }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const dia = new Date(primeira).setDate(new Date(primeira).getDate() + w * 7 + d);
      const futuro = dia > hoje;
      const atras = Math.round((hoje - dia) / DIA);
      const media = futuro ? 0 : Math.round(alunos.reduce((s, a) => s + minutosDia(a, atras, disc, agora), 0) / n);
      const nivel = (media === 0 ? 0 : media < 10 ? 1 : media < 20 ? 2 : media < 35 ? 3 : 4) as CelulaMapa["nivel"];
      return { dia, minutos: media, nivel, futuro };
    }),
  );
}

/**
 * XP ganho no período (`dias`). Aluna ao vivo: o que ela realmente ganhou (nunca passa do XP total do perfil).
 * Colegas: derivado do XP da semana, limitado ao total do aluno. Com filtro de disciplina, só a fatia dela.
 */
export function xpNoPeriodo(a: AlunoPainel, dias: number, disc: Disciplina | "todas", agora: number) {
  if (a.xpDiario90) {
    const total = a.xpDiario90.slice(-dias).reduce((s, x) => s + x, 0);
    if (disc === "todas") return Math.min(a.xp, total);
    let todas = 0;
    let daDisc = 0;
    for (let d = 0; d < dias; d++) {
      todas += minutosReais(a, d, "todas", agora);
      daDisc += minutosReais(a, d, disc, agora);
    }
    return Math.min(a.xp, Math.round(todas ? (total * daDisc) / todas : 0));
  }
  const total = Math.min(a.xp, Math.round((a.xpSemana * dias) / 7));
  return disc === "todas" ? total : Math.round(total * fatiaDisciplina(a.id, disc));
}

/** Curva de estudo por hora (6h–23h), com pico à tarde e à noite. */
const CURVA_HORA = [0.2, 0.5, 0.9, 0.7, 0.4, 0.6, 1, 1.1, 0.9, 0.7, 0.6, 0.8, 1.3, 1.7, 1.9, 1.7, 1.2, 0.6];

export function porHora(totalMinutos: number, chave: string) {
  const pesos = CURVA_HORA.map((p, i) => p * (0.85 + 0.3 * hash01(`${chave}:h${i}`)));
  const soma = pesos.reduce((s, p) => s + p, 0);
  return pesos.map((p, i) => ({ hora: 6 + i, minutos: Math.round((p / soma) * totalMinutos) }));
}

export type Liga = "bronze" | "prata" | "ouro" | "diamante";

export function ligaDoAluno(xp: number): Liga {
  return xp < 500 ? "bronze" : xp < 900 ? "prata" : xp < 1300 ? "ouro" : "diamante";
}

/** Missões concluídas no período (derivado da constância do aluno). */
export function missoesConcluidas(a: AlunoPainel, dias: number, disc: Disciplina | "todas") {
  const porSemana = 2 + a.sequencia * 0.2 + hash01(`${a.id}:m`) * 4;
  return Math.round(porSemana * (dias / 7) * (disc === "todas" ? 1 : fatiaDisciplina(a.id, disc) * 1.6));
}

export function ehTurmaValida(t: string | null): t is string {
  return !!t && TURMAS.includes(t);
}
