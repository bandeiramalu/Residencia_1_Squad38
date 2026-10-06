/**
 * Regras puras dos campeonatos: chaveamento do mata-mata, avanço de fase,
 * resultado dos confrontos dos colegas (derivado do nível real) e classificação. Nada aqui muda o estado.
 */
import { hashTexto, mulberry32 } from "@/lib/aleatorio";
import type { Disciplina } from "@/data/escola";
import type { AppState, Campeonato, Partida, Pessoa } from "@/store/types";

export function totalRodadas(c: Campeonato) {
  return c.partidas.reduce((m, p) => Math.max(m, p.rodada + 1), 0);
}

export function partidasDaRodada(c: Campeonato, rodada: number) {
  return c.partidas.filter((p) => p.rodada === rodada);
}

/** Rodada atual = a primeira que ainda tem partida não encerrada. */
export function rodadaAtual(c: Campeonato) {
  const pendente = c.partidas.find((p) => p.status !== "encerrada");
  return pendente ? pendente.rodada : Math.max(0, totalRodadas(c) - 1);
}

/** Partida liberada para o aluno jogar agora (se houver). */
export function partidaDoAluno(c: Campeonato, alunoId: string) {
  return c.partidas.find((p) => p.status === "disponivel" && (p.a === alunoId || p.b === alunoId));
}

/** Monta o chaveamento a partir da ordem dos participantes (completa com "folga" até a potência de 2). */
export function gerarChave(participantes: string[]): Partida[] {
  let tamanho = 2;
  while (tamanho < participantes.length) tamanho *= 2;
  const vagas: (string | null)[] = [...participantes, ...Array(tamanho - participantes.length).fill(null)];
  const partidas: Partida[] = [];
  let rodada = 0;
  let naRodada = tamanho / 2;
  while (naRodada >= 1) {
    for (let i = 0; i < naRodada; i++) {
      const a = rodada === 0 ? vagas[i * 2] : null;
      const b = rodada === 0 ? vagas[i * 2 + 1] : null;
      partidas.push({ id: `r${rodada}-${i}`, rodada, a, b, status: rodada === 0 && a && b ? "disponivel" : "aguardando" });
    }
    rodada++;
    naRodada /= 2;
  }
  // Quem ficou sem adversário na 1ª rodada avança direto.
  let resultado: Campeonato = { partidas } as Campeonato;
  for (const p of partidas.filter((x) => x.rodada === 0 && (!x.a || !x.b) && (x.a || x.b))) {
    resultado = registrarResultado(resultado, p.id, p.a ? 1 : 0, p.b ? 1 : 0);
  }
  return resultado.partidas;
}

/**
 * Registra o placar de uma partida, define o vencedor e o leva para a próxima rodada.
 * Empate no placar: vence quem o chamador indicar em `desempate` (menor tempo total de resposta; padrão: lado A).
 */
export function registrarResultado(c: Campeonato, partidaId: string, placarA: number, placarB: number, desempate?: string): Campeonato {
  const partida = c.partidas.find((p) => p.id === partidaId);
  if (!partida || partida.status === "encerrada") return c;
  const vencedor = placarA > placarB ? partida.a : placarB > placarA ? partida.b : (desempate ?? partida.a);
  const doRound = c.partidas.filter((p) => p.rodada === partida.rodada);
  const indice = doRound.findIndex((p) => p.id === partidaId);
  const proxima = c.partidas.filter((p) => p.rodada === partida.rodada + 1)[Math.floor(indice / 2)];

  let partidas = c.partidas.map((p) => (p.id === partidaId ? { ...p, placarA, placarB, vencedor: vencedor ?? undefined, status: "encerrada" as const } : p));
  if (proxima && vencedor) {
    partidas = partidas.map((p) => {
      if (p.id !== proxima.id) return p;
      const atualizada = indice % 2 === 0 ? { ...p, a: vencedor } : { ...p, b: vencedor };
      return { ...atualizada, status: atualizada.a && atualizada.b ? ("disponivel" as const) : ("aguardando" as const) };
    });
  }
  const final = !proxima;
  return final && vencedor ? { ...c, partidas, status: "encerrado", campeao: vencedor } : { ...c, partidas };
}

/** Nível de um participante: XP total e, quando conhecido, domínio (0–100) na disciplina. */
export interface NivelJogador {
  xp: number;
  dominio?: number;
}

/** Força de 0 a 1: metade vem do XP (2000 XP = máximo) e metade do domínio da disciplina, quando existe. */
export function forcaDe(n: NivelJogador) {
  const base = Math.min(1, Math.max(0, n.xp) / 2000);
  return n.dominio === undefined ? base : 0.5 * base + 0.5 * Math.min(1, Math.max(0, n.dominio) / 100);
}

export const LIMITE_PERGUNTA_MS = 20_000;

export interface DesempenhoDuelo {
  acertou: boolean[];
  /** Tempo gasto em cada pergunta (ms). */
  tempos: number[];
  acertos: number;
  tempoTotal: number;
}

/**
 * Desempenho de um colega num duelo: acerto e velocidade derivam do nível real (XP/domínio).
 * A mesma semente sempre dá o mesmo resultado; a "forma do dia" e o ritmo variam de forma plausível.
 */
export function desempenhoDoColega(nivel: NivelJogador, semente: string, qtd = 5): DesempenhoDuelo {
  const rnd = mulberry32(hashTexto(semente));
  const forca = forcaDe(nivel);
  const forma = (rnd() - 0.5) * 0.16;
  const pAcerto = Math.min(0.95, Math.max(0.15, 0.3 + 0.6 * forca + forma));
  const acertou: boolean[] = [];
  const tempos: number[] = [];
  for (let i = 0; i < qtd; i++) {
    const ok = rnd() < pAcerto;
    const base = 13_500 - 8_000 * forca;
    const t = base * (0.7 + 0.6 * rnd()) * (ok ? 1 : 1.2);
    acertou.push(ok);
    tempos.push(Math.round(Math.min(LIMITE_PERGUNTA_MS - 500, Math.max(2_500, t))));
  }
  return { acertou, tempos, acertos: acertou.filter(Boolean).length, tempoTotal: tempos.reduce((a, b) => a + b, 0) };
}

export interface LadoDuelo {
  acertos: number;
  tempoTotal: number;
  forca: number;
}

/** Vence quem acertou mais; empate em acertos é decidido pelo menor tempo total de resposta (depois, pela maior força). */
export function ladoVencedor(a: LadoDuelo, b: LadoDuelo): "a" | "b" {
  if (a.acertos !== b.acertos) return a.acertos > b.acertos ? "a" : "b";
  if (a.tempoTotal !== b.tempoTotal) return a.tempoTotal < b.tempoTotal ? "a" : "b";
  return a.forca >= b.forca ? "a" : "b";
}

export type NivelDe = (id: string) => NivelJogador;

/** Quem tem mais força (XP/domínio); empate: mais XP, depois ordem do id. Critério dos confrontos não jogados. */
function melhorPorDesempenho(a: string, b: string, nivelDe: NivelDe) {
  const na = nivelDe(a);
  const nb = nivelDe(b);
  const fa = forcaDe(na);
  const fb = forcaDe(nb);
  if (fa !== fb) return fa > fb ? a : b;
  if (na.xp !== nb.xp) return na.xp > nb.xp ? a : b;
  return a < b ? a : b;
}

/** Ordem do chaveamento por nível: o melhor enfrenta o pior, o 2º o penúltimo… (sem sorteio). */
export function semearParticipantes(ids: string[], nivelDe: NivelDe) {
  const ordenados = [...ids].sort((a, b) => (a === b ? 0 : melhorPorDesempenho(a, b, nivelDe) === a ? -1 : 1));
  const ordem: string[] = [];
  let i = 0;
  let j = ordenados.length - 1;
  while (i <= j) {
    ordem.push(ordenados[i++]);
    if (i <= j) ordem.push(ordenados[j--]);
  }
  return ordem;
}

/** Os colegas jogam o confronto: placar e tempo vêm do nível de cada um. */
function jogarPartidaDosColegas(c: Campeonato, p: Partida, nivelDe: NivelDe): Campeonato {
  if (!p.a || !p.b) return c;
  const na = nivelDe(p.a);
  const nb = nivelDe(p.b);
  const da = desempenhoDoColega(na, `${c.id}-${p.id}-${p.a}`);
  const db = desempenhoDoColega(nb, `${c.id}-${p.id}-${p.b}`);
  const lado = ladoVencedor({ acertos: da.acertos, tempoTotal: da.tempoTotal, forca: forcaDe(na) }, { acertos: db.acertos, tempoTotal: db.tempoTotal, forca: forcaDe(nb) });
  return registrarResultado(c, p.id, da.acertos, db.acertos, lado === "a" ? p.a : p.b);
}

/** Resolve os confrontos disponíveis que não envolvem o aluno (os colegas jogam; resultado derivado do nível). */
export function resolverPartidasDosColegas(c: Campeonato, alunoId: string, nivelDe: NivelDe, ateRodada = Infinity): Campeonato {
  let atual = c;
  for (let guarda = 0; guarda < 64; guarda++) {
    const p = atual.partidas.find((x) => x.status === "disponivel" && x.a !== alunoId && x.b !== alunoId && x.rodada <= ateRodada);
    if (!p) break;
    atual = jogarPartidaDosColegas(atual, p, nivelDe);
  }
  return atual;
}

/** Quantos confrontos ainda não têm vencedor. */
export function partidasPendentes(c: Campeonato) {
  return c.partidas.filter((p) => p.status !== "encerrada").length;
}

/**
 * Encerramento antecipado: cada confronto que falta vai para quem tem melhor desempenho real
 * (força = XP total e domínio da disciplina). Não há sorteio; os confrontos ficam marcados com esse critério.
 */
export function decidirPendentesPorDesempenho(c: Campeonato, nivelDe: NivelDe): Campeonato {
  let atual = c;
  for (let guarda = 0; guarda < 64; guarda++) {
    const p = atual.partidas.find((x) => x.status !== "encerrada" && x.a && x.b);
    if (!p || !p.a || !p.b) break;
    const vencedor = melhorPorDesempenho(p.a, p.b, nivelDe);
    atual = registrarResultado(atual, p.id, vencedor === p.a ? 1 : 0, vencedor === p.b ? 1 : 0, vencedor);
    atual = { ...atual, partidas: atual.partidas.map((x) => (x.id === p.id ? { ...x, criterio: "desempenho" as const } : x)) };
  }
  return atual;
}

export interface LinhaClassificacao {
  id: string;
  pontos: number;
  posicao: number;
}

export function classificacao(c: Campeonato): LinhaClassificacao[] {
  return c.participantes
    .map((id) => ({ id, pontos: c.placar[id] ?? 0 }))
    .sort((a, b) => b.pontos - a.pontos)
    .map((l, i) => ({ ...l, posicao: i + 1 }));
}

export function lider(c: Campeonato) {
  return classificacao(c)[0]?.id;
}

/** Nome exibível: aluno (pelo cadastro) ou turma (interclasses). */
export function nomeParticipante(id: string | null, pessoas: Record<string, Pessoa>) {
  if (!id) return "A definir";
  return pessoas[id]?.nome ?? id;
}

/** O aluno participa (diretamente ou pela turma, no interclasses)? */
export function participa(c: Campeonato, alunoId: string, turma: string) {
  return c.formato === "interclasses" ? c.participantes.includes(turma) : c.participantes.includes(alunoId);
}

export function podeInscrever(c: Campeonato, turma: string) {
  return c.status === "inscricoes" && c.formato !== "interclasses" && c.participantes.length < c.maxParticipantes && (!c.turmas.length || c.turmas.includes(turma));
}

/** Nível real de cada pessoa no estado atual: XP (+ bônus de professores) e, para a aluna, o domínio da disciplina. */
export function nivelDoEstado(estado: AppState, disciplina?: Disciplina): NivelDe {
  return (id) => {
    if (id === estado.usuario.id) return { xp: estado.usuario.xp, dominio: disciplina ? estado.usuario.dominio[disciplina] : undefined };
    return { xp: (estado.pessoas[id]?.xp ?? 0) + (estado.bonus[id]?.xp ?? 0) };
  };
}
