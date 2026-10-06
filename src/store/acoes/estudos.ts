/**
 * Sala de Estudos — timer de foco (Pomodoro, foco profundo ou livre).
 * O tempo é calculado por timestamps: o timer continua certo mesmo com a aba
 * em segundo plano ou a página recarregada. `tickFoco()` é chamado a cada segundo
 * pelo <MotorEstudos> do shell e faz as trocas de fase.
 */
import { BONUS_CICLO, MINUTOS_MINIMOS, MODOS_TIMER, PONTOS_POR_MINUTO } from "@/data/estudos";
import type { Disciplina } from "@/data/escola";
import { faseDaSala, formatarMinutos, LIMITE_SAIDA_MS, lerTimer, MIN, notificarSistema, pedirPermissaoNotificacao } from "@/lib/estudos";
import { gerarId, primeiroNome } from "@/lib/format";
import { avancarMissao, registrarEstudo } from "../actions";
import { commit, ehAluno, premiar } from "../nucleo";
import { obterEstado } from "../store";
import type { FaseTimer, ModoTimer } from "../types";
import { toast } from "../ui";

export interface OpcoesFoco {
  disciplina: Disciplina;
  modo: ModoTimer;
  meta?: string;
  salaId?: string;
  /** Sobrescreve o preset (ex.: timer personalizado). */
  focoMin?: number;
  pausaMin?: number;
}

export function iniciarFoco({ disciplina, modo, meta, salaId, focoMin, pausaMin }: OpcoesFoco) {
  if (obterEstado().estudos.timer) encerrarFoco(true);
  pedirPermissaoNotificacao();
  const preset = MODOS_TIMER.find((m) => m.id === modo) ?? MODOS_TIMER[0];
  const agora = Date.now();
  let fase: FaseTimer = "foco";
  let faseInicio = agora;
  let foco = focoMin ?? preset.focoMin;
  let pausa = pausaMin ?? preset.pausaMin;

  // Numa sala coletiva, o timer entra sincronizado com o ciclo da sala.
  const sala = salaId ? obterEstado().salas.find((s) => s.id === salaId) : undefined;
  if (sala) {
    const f = faseDaSala(sala, agora);
    foco = sala.focoMin;
    pausa = sala.pausaMin;
    fase = f.fase;
    faseInicio = agora - f.decorridoMs;
  }

  commit({
    type: "iniciarTimer",
    timer: { disciplina, modo, focoMin: foco, pausaMin: pausa, fase, faseInicio, acumuladoMs: 0, pausado: false, ciclos: 0, minutosRegistrados: 0, meta: meta?.trim() || undefined, salaId },
  });

  if (fase === "pausa") {
    toast({ tipo: "info", titulo: "A sala está na pausa", mensagem: "Seu foco começa junto com o próximo ciclo da sala." }, 3000);
  } else if (!sala) {
    toast({ tipo: "info", titulo: `Foco iniciado · ${disciplina}`, mensagem: foco ? `${foco} min de foco e ${pausa} de pausa.` : "Cronômetro livre." }, 3000);
  }
}

export function pausarFoco() {
  commit({ type: "pausarTimer", em: Date.now() });
}

export function retomarFoco() {
  const t = obterEstado().estudos.timer;
  const agora = Date.now();
  if (t?.saiuEm && agora - t.saiuEm >= LIMITE_SAIDA_MS) return perderFoco(agora);
  commit({ type: "retomarTimer", em: agora });
}

const FORA = () => typeof document !== "undefined" && document.visibilityState === "hidden";

/**
 * A aluna saiu da tela com o foco rodando: congela o timer no instante da saída
 * (pausa manual e intervalo não contam) e avisa pelo sistema, se permitido.
 */
export function registrarSaida(em = Date.now()) {
  const t = obterEstado().estudos.timer;
  if (!t || t.pausado || t.fase !== "foco") return;
  commit({ type: "sairDaTela", em });
  if (FORA()) notificarSistema("Foco pausado", "Foco pausado — volte em até 5 min para não perder.");
}

/** Faltando 1 min para perder o foco (chamado por um agendamento; pode atrasar em aba oculta). */
export function avisarFaltaUmMinuto() {
  const t = obterEstado().estudos.timer;
  if (t?.saiuEm && FORA()) notificarSistema("Falta 1 minuto", "Volte agora para não perder o foco.");
}

/** Mais de 5 min fora: o ciclo atual é descartado (sem pontos, minutos ou bônus); a sequência de dias não muda. */
export function perderFoco(agora = Date.now()) {
  const t = obterEstado().estudos.timer;
  if (!t) return;
  commit({
    type: "perderFoco",
    perdido: { em: agora, disciplina: t.disciplina, modo: t.modo, focoMin: t.focoMin, pausaMin: t.pausaMin, meta: t.meta, salaId: t.salaId },
  });
  if (FORA() && notificarSistema("Foco perdido", "Você ficou mais de 5 min fora.")) return;
  if (ehAluno()) toast({ tipo: "alerta", titulo: "Foco perdido", mensagem: "Você ficou mais de 5 min fora da tela." }, 4000);
}

/** "Começar de novo": reinicia com a mesma disciplina/ritmo/intenção do foco perdido. */
export function recomecarFoco() {
  const p = obterEstado().estudos.focoPerdido;
  if (!p) return;
  iniciarFoco({ disciplina: p.disciplina, modo: p.modo, meta: p.meta, salaId: p.salaId, focoMin: p.focoMin, pausaMin: p.pausaMin });
}

export function dispensarFocoPerdido() {
  commit({ type: "dispensarFocoPerdido" });
}

/** Demonstração: simula a aba ficando oculta (a contagem de 5 min aparece dentro do app). */
export function simularSaida() {
  registrarSaida();
}

/** Demonstração: faz passar 5 min fora da tela (mostra a perda do foco). */
export function pularSaidaDemo() {
  commit({ type: "ajustarSaida", ms: LIMITE_SAIDA_MS });
  tickFoco();
}

/** Registra um bloco de foco concluído: métricas, pontos, sequência, missão e campeonatos. */
function registrarBloco(minutos: number, cicloCompleto: boolean, fim: number) {
  const estado = obterEstado();
  const t = estado.estudos.timer;
  if (!t || minutos < MINUTOS_MINIMOS) return;
  commit({
    type: "registrarSessao",
    turma: estado.usuario.turma,
    sessao: { id: gerarId("se"), disciplina: t.disciplina, inicio: fim - minutos * MIN, minutos, origem: t.salaId ? "sala" : "timer", salaId: t.salaId },
  });
  const pontos = minutos * PONTOS_POR_MINUTO + (cicloCompleto ? BONUS_CICLO : 0);
  premiar(pontos, 0, cicloCompleto ? `ciclo completo de ${minutos} min em ${t.disciplina}` : `${formatarMinutos(minutos)} de foco em ${t.disciplina}`);
  registrarEstudo();
  if (cicloCompleto) avancarMissao("d4", 1);
  if (t.salaId && cicloCompleto) {
    commit({
      type: "mensagemSala",
      salaId: t.salaId,
      mensagem: { id: gerarId("sm"), autorId: estado.usuario.id, texto: `${primeiroNome(estado.usuario.nome)} completou um ciclo de ${minutos} min`, criadoEm: Date.now(), tipo: "sistema" },
    });
  }
}

/** Avança o timer: conclui o foco (registra) ou encerra a pausa. Idempotente — pode ser chamado à vontade. */
export function tickFoco(agora = Date.now()) {
  const t = obterEstado().estudos.timer;
  if (t?.saiuEm) {
    if (agora - t.saiuEm >= LIMITE_SAIDA_MS) perderFoco(agora);
    return;
  }
  if (!t || t.pausado) return;
  const l = lerTimer(t, agora);
  if (!l.terminou) return;
  // Momento exato em que a fase acabou (a aba pode ter ficado em segundo plano).
  const fimFase = agora - (l.decorridoMs - l.duracaoMs);

  if (t.fase === "foco") {
    registrarBloco(t.focoMin, true, fimFase);
    commit({ type: "trocarFase", fase: "pausa", em: fimFase });
    if (ehAluno()) toast({ tipo: "sequencia", titulo: "Ciclo concluído", mensagem: `Pausa de ${t.pausaMin} min.` }, 3600);
  } else {
    commit({ type: "trocarFase", fase: "foco", em: fimFase });
    if (ehAluno()) toast({ tipo: "info", titulo: "Pausa encerrada", mensagem: "O próximo ciclo de foco começou." }, 3000);
  }
}

/** Encerra a rodada; registra o foco parcial (≥ 1 min). Devolve os minutos registrados na rodada. */
export function encerrarFoco(silencioso = false) {
  const t = obterEstado().estudos.timer;
  if (!t) return 0;
  const agora = Date.now();
  if (t.fase === "foco") {
    const minutos = Math.floor(lerTimer(t, agora).decorridoMs / MIN);
    if (minutos >= MINUTOS_MINIMOS) registrarBloco(minutos, false, agora);
  }
  const total = obterEstado().estudos.timer?.minutosRegistrados ?? 0;
  commit({ type: "encerrarTimer" });
  if (!silencioso) {
    toast(
      total
        ? { tipo: "info", titulo: `Sessão encerrada · ${formatarMinutos(total)} de foco`, mensagem: "Tudo registrado nas suas métricas e nos campeonatos." }
        : { tipo: "info", titulo: "Sessão encerrada", mensagem: "Blocos com menos de 1 minuto não contam." },
      3400,
    );
  }
  return total;
}

export function pularPausa() {
  const t = obterEstado().estudos.timer;
  if (t?.fase === "pausa") commit({ type: "trocarFase", fase: "foco", em: Date.now() });
}

/** Demonstração: faz o tempo passar `minutos` sem esperar (para apresentar o fim de um ciclo). */
export function adiantarFoco(minutos = 5) {
  if (!obterEstado().estudos.timer) return;
  commit({ type: "adiantarTimer", ms: minutos * MIN });
  tickFoco();
}

export function definirMetaDiaria(minutos: number) {
  commit({ type: "definirMetaDiaria", minutos: Math.max(15, Math.min(480, Math.round(minutos / 5) * 5)) });
  toast({ tipo: "info", titulo: `Meta diária: ${formatarMinutos(minutos)}` }, 2400);
}

/** Estudo feito fora do app (biblioteca, aula de reforço). Entra nas métricas, mas não dá pontos. */
export function registrarEstudoManual(disciplina: Disciplina, minutos: number, inicio = Date.now() - minutos * MIN) {
  if (minutos < MINUTOS_MINIMOS) return;
  const estado = obterEstado();
  commit({ type: "registrarSessao", turma: estado.usuario.turma, sessao: { id: gerarId("se"), disciplina, inicio, minutos, origem: "manual" } });
  toast({ tipo: "info", titulo: `${formatarMinutos(minutos)} de ${disciplina} registrados`, mensagem: "Registros manuais entram nas métricas, mas não valem pontos." }, 3000);
}
