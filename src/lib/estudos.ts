/**
 * Regras puras da Sala de Estudos: relógio do timer, fase das salas coletivas,
 * métricas de tempo de estudo e ranking de foco. Nada aqui muda estado.
 */
import { ALUNOS_TURMAS } from "@/data/turmas";
import type { Disciplina } from "@/data/escola";
import type { AppState, SalaEstudo, SessaoEstudo, TimerAtivo } from "@/store/types";

export const MIN = 60_000;
export const DIA = 24 * 60 * MIN;

/* ───────────── Timer ───────────── */

export function duracaoFaseMs(t: TimerAtivo) {
  return (t.fase === "foco" ? t.focoMin : t.pausaMin) * MIN;
}

export function decorridoFaseMs(t: TimerAtivo, agora: number) {
  return t.acumuladoMs + (t.pausado ? 0 : Math.max(0, agora - t.faseInicio));
}

export interface LeituraTimer {
  decorridoMs: number;
  /** 0 no modo livre (sem duração). */
  duracaoMs: number;
  /** null no modo livre. */
  restanteMs: number | null;
  /** 0 → 1; null no modo livre. */
  progresso: number | null;
  terminou: boolean;
}

export function lerTimer(t: TimerAtivo, agora: number): LeituraTimer {
  const decorridoMs = decorridoFaseMs(t, agora);
  const duracaoMs = duracaoFaseMs(t);
  if (!duracaoMs) return { decorridoMs, duracaoMs, restanteMs: null, progresso: null, terminou: false };
  return {
    decorridoMs,
    duracaoMs,
    restanteMs: Math.max(0, duracaoMs - decorridoMs),
    progresso: Math.min(1, decorridoMs / duracaoMs),
    terminou: decorridoMs >= duracaoMs,
  };
}

/**
 * Parte do foco que já tinha passado quando a aluna entrou numa sala em andamento (não conta).
 * Só vale na primeira fase de foco da rodada: depois da primeira pausa, os ciclos são inteiros.
 */
export function descontoDoFocoMs(t: TimerAtivo) {
  return t.fase === "foco" && t.ciclos === 0 ? Math.max(0, t.descontoMs ?? 0) : 0;
}

/** Minutos de foco já cumpridos na fase atual, sem o desconto de quem entrou no meio do ciclo. */
export function minutosCumpridos(t: TimerAtivo, agora: number) {
  if (t.fase !== "foco") return 0;
  return Math.max(0, Math.floor((decorridoFaseMs(t, agora) - descontoDoFocoMs(t)) / MIN));
}

/** "07:42" · "1:05:09" */
export function formatarRelogio(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** "45 min" · "2h 15" · "12h" */
export function formatarMinutos(min: number) {
  const m = Math.round(min);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${String(r).padStart(2, "0")}` : `${h}h`;
}

/* ───────────── Salas coletivas: ciclo sincronizado ───────────── */

export interface FaseSala {
  aberta: boolean;
  fase: "foco" | "pausa";
  decorridoMs: number;
  restanteMs: number;
  progresso: number;
  /** Número do ciclo desde a abertura (1, 2, 3…). */
  ciclo: number;
}

export function faseDaSala(sala: SalaEstudo, agora: number): FaseSala {
  const foco = sala.focoMin * MIN;
  const pausa = sala.pausaMin * MIN;
  const aberta = !sala.agendadaPara || agora >= sala.agendadaPara;
  const desde = Math.max(0, agora - sala.cicloInicio);
  const volta = foco + pausa || 1;
  const pos = desde % volta;
  const ciclo = Math.floor(desde / volta) + 1;
  if (pos < foco) return { aberta, fase: "foco", decorridoMs: pos, restanteMs: foco - pos, progresso: pos / foco, ciclo };
  return { aberta, fase: "pausa", decorridoMs: pos - foco, restanteMs: volta - pos, progresso: (pos - foco) / (pausa || 1), ciclo };
}

/* ───────────── Datas ───────────── */

export function inicioDoDia(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Segunda-feira 00:00 da semana de `ts`. */
export function inicioDaSemana(ts: number) {
  const d = new Date(inicioDoDia(ts));
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

function somarDias(ts: number, n: number) {
  const d = new Date(ts);
  d.setDate(d.getDate() + n);
  return d.getTime();
}

/* ───────────── Métricas ───────────── */

export function minutosEntre(sessoes: SessaoEstudo[], desde: number, ate = Infinity) {
  let total = 0;
  for (const s of sessoes) if (s.inicio >= desde && s.inicio < ate) total += s.minutos;
  return total;
}

/** Minutos por dia nos últimos `dias` dias (do mais antigo até hoje). */
export function minutosPorDia(sessoes: SessaoEstudo[], dias: number, agora: number) {
  const hoje = inicioDoDia(agora);
  const inicio = somarDias(hoje, -(dias - 1));
  const mapa = new Map<number, number>();
  for (const s of sessoes) {
    if (s.inicio < inicio) continue;
    const dia = inicioDoDia(s.inicio);
    mapa.set(dia, (mapa.get(dia) ?? 0) + s.minutos);
  }
  return Array.from({ length: dias }, (_, i) => {
    const dia = somarDias(inicio, i);
    return { dia, minutos: mapa.get(dia) ?? 0 };
  });
}

export function porDisciplina(sessoes: SessaoEstudo[], desde: number) {
  const mapa = new Map<Disciplina, number>();
  let total = 0;
  for (const s of sessoes) {
    if (s.inicio < desde) continue;
    mapa.set(s.disciplina, (mapa.get(s.disciplina) ?? 0) + s.minutos);
    total += s.minutos;
  }
  return [...mapa.entries()]
    .map(([disciplina, minutos]) => ({ disciplina, minutos, pct: total ? minutos / total : 0 }))
    .sort((a, b) => b.minutos - a.minutos);
}

/** Minutos por hora do dia (0–23) — mostra o horário em que a aluna mais rende. */
export function porHora(sessoes: SessaoEstudo[], desde = 0) {
  const horas = Array<number>(24).fill(0);
  for (const s of sessoes) if (s.inicio >= desde) horas[new Date(s.inicio).getHours()] += s.minutos;
  return horas;
}

export interface CelulaMapa {
  dia: number;
  minutos: number;
  /** 0 (nada) a 4 (muito). */
  nivel: 0 | 1 | 2 | 3 | 4;
  futuro: boolean;
}

/** Grade estilo "contribuições": colunas = semanas (seg→dom), da mais antiga até a atual. */
export function mapaDeCalor(sessoes: SessaoEstudo[], semanas: number, agora: number): CelulaMapa[][] {
  const hoje = inicioDoDia(agora);
  const primeiraSegunda = somarDias(inicioDaSemana(agora), -7 * (semanas - 1));
  const porDia = new Map(minutosPorDia(sessoes, Math.round((hoje - primeiraSegunda) / DIA) + 1, agora).map((d) => [d.dia, d.minutos]));
  return Array.from({ length: semanas }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const dia = somarDias(primeiraSegunda, w * 7 + d);
      const minutos = porDia.get(dia) ?? 0;
      const nivel = (minutos === 0 ? 0 : minutos < 30 ? 1 : minutos < 60 ? 2 : minutos < 100 ? 3 : 4) as CelulaMapa["nivel"];
      return { dia, minutos, nivel, futuro: dia > hoje };
    }),
  );
}

/** Dias seguidos com estudo registrado (se hoje ainda não tem, conta a partir de ontem). */
export function diasSeguidosComEstudo(sessoes: SessaoEstudo[], agora: number) {
  const dias = new Set(sessoes.map((s) => inicioDoDia(s.inicio)));
  let dia = inicioDoDia(agora);
  if (!dias.has(dia)) dia = somarDias(dia, -1);
  let n = 0;
  while (dias.has(dia)) {
    n++;
    dia = somarDias(dia, -1);
  }
  return n;
}

export interface ResumoEstudos {
  hojeMin: number;
  semanaMin: number;
  semanaPassadaMin: number;
  /** Variação da semana atual contra o mesmo ponto da semana passada (−1…+∞). */
  variacaoSemana: number;
  mesMin: number;
  mediaDiaria30: number;
  diasAtivos30: number;
  maiorSessaoMin: number;
  totalSessoes: number;
  melhorHora: number | null;
  disciplinaTop: Disciplina | null;
  metaPct: number;
  diasSeguidos: number;
}

export function resumoEstudos(sessoes: SessaoEstudo[], agora: number, metaDiariaMin: number): ResumoEstudos {
  const hoje = inicioDoDia(agora);
  const semana = inicioDaSemana(agora);
  const semanaPassada = somarDias(semana, -7);
  const decorridoSemana = agora - semana;
  const d30 = somarDias(hoje, -29);
  const ultimos30 = minutosPorDia(sessoes, 30, agora);

  const hojeMin = minutosEntre(sessoes, hoje);
  const semanaMin = minutosEntre(sessoes, semana);
  const semanaPassadaMin = minutosEntre(sessoes, semanaPassada, semana);
  const mesmoPontoPassado = minutosEntre(sessoes, semanaPassada, semanaPassada + decorridoSemana);
  const horas = porHora(sessoes, d30);
  const maxHora = Math.max(...horas);

  return {
    hojeMin,
    semanaMin,
    semanaPassadaMin,
    variacaoSemana: mesmoPontoPassado ? semanaMin / mesmoPontoPassado - 1 : 0,
    mesMin: minutosEntre(sessoes, d30),
    mediaDiaria30: Math.round(ultimos30.reduce((a, d) => a + d.minutos, 0) / 30),
    diasAtivos30: ultimos30.filter((d) => d.minutos > 0).length,
    maiorSessaoMin: sessoes.reduce((m, s) => Math.max(m, s.minutos), 0),
    totalSessoes: sessoes.length,
    melhorHora: maxHora > 0 ? horas.indexOf(maxHora) : null,
    disciplinaTop: porDisciplina(sessoes, semana)[0]?.disciplina ?? null,
    metaPct: metaDiariaMin ? Math.min(1, hojeMin / metaDiariaMin) : 0,
    diasSeguidos: diasSeguidosComEstudo(sessoes, agora),
  };
}

/* ───────────── Ranking de foco (minutos na semana) ───────────── */

/**
 * Minutos de um colega "até agora" nesta semana: soma só os dias já passados
 * (seg → hoje) dos últimos 7 dias gerados. Assim, numa segunda-feira, todos começam
 * perto do zero — a comparação com a aluna é justa em qualquer dia da apresentação.
 */
export function minutosDaSemanaAteHoje(minutos7d: number[], agora: number) {
  const diasPassados = ((new Date(agora).getDay() + 6) % 7) + 1;
  return minutos7d.slice(-diasPassados).reduce((s, m) => s + m, 0);
}

export type EscopoFoco = "turma" | "escola";

export interface LinhaFoco {
  id: string;
  nome: string;
  turma: string;
  minutos: number;
  posicao: number;
  eu: boolean;
}

export interface RankingFoco {
  linhas: LinhaFoco[];
  /** Posição da aluna mesmo no Modo Sombra (só ela vê). */
  minhaPosicao: number;
  meusMinutos: number;
  total: number;
  /** A aluna está fora da lista pública (Modo Sombra). */
  sombra: boolean;
}

export function montarRankingFoco(estado: AppState, escopo: EscopoFoco, agora: number): RankingFoco {
  const { usuario } = estado;
  // Só foco cronometrado entra na disputa; registro manual fica apenas nas métricas pessoais.
  const meusMinutos = minutosEntre(estado.estudos.sessoes.filter((s) => s.origem !== "manual"), inicioDaSemana(agora));
  const colegas = ALUNOS_TURMAS.filter((a) => a.id !== usuario.id && (escopo === "escola" || a.turma === usuario.turma)).map((a) => ({
    id: a.id,
    nome: a.nome,
    turma: a.turma,
    minutos: minutosDaSemanaAteHoje(a.minutos7d, agora),
    eu: false,
  }));
  const eu = { id: usuario.id, nome: usuario.nome, turma: usuario.turma, minutos: meusMinutos, eu: true };
  const ordenar = <T extends { minutos: number; eu: boolean }>(l: T[]) => [...l].sort((a, b) => b.minutos - a.minutos || Number(a.eu) - Number(b.eu));

  const comigo = ordenar([...colegas, eu]).map((l, i) => ({ ...l, posicao: i + 1 }));
  const minhaPosicao = comigo.find((l) => l.eu)!.posicao;
  const sombra = usuario.privacidade === "sombra";
  const linhas = sombra ? ordenar(colegas).map((l, i) => ({ ...l, posicao: i + 1 })) : comigo;
  return { linhas, minhaPosicao, meusMinutos, total: comigo.length, sombra };
}

/* ───────────── Saída da tela durante o foco ───────────── */

/** Tempo máximo fora da tela antes de perder o foco. */
export const LIMITE_SAIDA_MS = 5 * MIN;

/** Pede permissão de notificação (só se ainda não foi decidida). Nunca lança. */
export function pedirPermissaoNotificacao() {
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "default") void Notification.requestPermission().catch(() => {});
  } catch {
    // Navegador sem Notification API: o aviso aparece dentro do app.
  }
}

/** Notificação do sistema; devolve false se indisponível ou negada. */
export function notificarSistema(titulo: string, corpo: string) {
  try {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return false;
    new Notification(titulo, { body: corpo, tag: "foco-cepi", icon: "/favicon.ico" });
    return true;
  } catch {
    return false;
  }
}

/** Quanto resta dos 5 min de tolerância desde a saída (0 = perdido). */
export function restanteDaSaidaMs(saiuEm: number, agora: number) {
  return Math.max(0, LIMITE_SAIDA_MS - (agora - saiuEm));
}
