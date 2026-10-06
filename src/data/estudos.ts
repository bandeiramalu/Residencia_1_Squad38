import { entre, mulberry32 } from "@/lib/aleatorio";
import type { ModoTimer, SessaoEstudo } from "@/store/types";
import type { Disciplina } from "./escola";

const MIN = 60_000;
const D = 24 * 60 * MIN;

/** Presets do timer de foco. */
export const MODOS_TIMER: { id: ModoTimer; nome: string; descricao: string; focoMin: number; pausaMin: number }[] = [
  { id: "pomodoro", nome: "Pomodoro", descricao: "25 min de foco · 5 de pausa", focoMin: 25, pausaMin: 5 },
  { id: "profundo", nome: "Foco profundo", descricao: "50 min de foco · 10 de pausa", focoMin: 50, pausaMin: 10 },
  { id: "livre", nome: "Livre", descricao: "Cronômetro sem limite", focoMin: 0, pausaMin: 0 },
];

/** Pontos por minuto de foco concluído (tempo de estudo é constância → pontos, não XP). */
export const PONTOS_POR_MINUTO = 1;
/** Bônus ao completar um ciclo inteiro de foco. */
export const BONUS_CICLO = 10;
/** Sessões mais curtas que isso não contam (evita "farmar" pontos). */
export const MINUTOS_MINIMOS = 1;

export const META_DIARIA_PADRAO = 90;

/** Peso de cada disciplina no histórico da aluna (ela estuda mais Matemática e Química). */
const PESOS: [Disciplina, number][] = [
  ["Matemática", 0.24],
  ["Química", 0.17],
  ["Biologia", 0.15],
  ["Português", 0.13],
  ["História", 0.1],
  ["Inglês", 0.08],
  ["Física", 0.07],
  ["Geografia", 0.06],
];

function sortearDisciplina(rnd: () => number): Disciplina {
  let x = rnd();
  for (const [d, p] of PESOS) {
    x -= p;
    if (x <= 0) return d;
  }
  return "Matemática";
}

/**
 * Histórico de estudo dos últimos 12 semanas (sem o dia de hoje), coerente com a
 * sequência de 13 dias do seed: os 13 dias anteriores a hoje sempre têm estudo.
 */
export function criarHistoricoEstudos(agora: number): SessaoEstudo[] {
  const rnd = mulberry32(90210);
  const hoje = new Date(agora);
  hoje.setHours(0, 0, 0, 0);
  const sessoes: SessaoEstudo[] = [];

  for (let diasAtras = 83; diasAtras >= 1; diasAtras--) {
    const dia = hoje.getTime() - diasAtras * D;
    const diaSemana = new Date(dia).getDay();
    const naSequencia = diasAtras <= 13;
    const quebraDaSequencia = diasAtras === 14;
    // Semanas mais recentes são um pouco mais fortes: dá para ver a evolução no gráfico.
    const tendencia = 0.62 + (1 - diasAtras / 83) * 0.3;
    const estudou = !quebraDaSequencia && (naSequencia || rnd() < tendencia - (diaSemana === 6 ? 0.25 : 0));
    if (!estudou) continue;

    const blocos = rnd() < 0.3 ? 1 : rnd() < 0.75 ? 2 : 3;
    let hora = entre(diaSemana === 0 || diaSemana === 6 ? 9 : 14, 17, rnd);
    for (let b = 0; b < blocos; b++) {
      const longo = rnd() < 0.3;
      const minutos = longo ? 50 : rnd() < 0.7 ? 25 : entre(12, 40, rnd);
      const inicio = dia + hora * 60 * MIN + entre(0, 40, rnd) * MIN;
      sessoes.push({ id: `h${diasAtras}-${b}`, disciplina: sortearDisciplina(rnd), inicio, minutos, origem: rnd() < 0.2 ? "sala" : "timer" });
      hora += longo ? 2 : 1;
      if (hora > 22) break;
    }
  }
  return sessoes;
}
