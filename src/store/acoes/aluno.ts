import { apagarTodosArquivos } from "@/lib/arquivos";
import { commit, notificar, novaEpoca } from "../nucleo";
import type { DadosPerfil } from "../reducer";
import { criarEstadoInicial } from "../seed";
import { despachar, obterEstado } from "../store";
import { limparFalhaProgresso, toast } from "../ui";
import type { LembreteAgendado } from "../types";

/** Salva nome, @usuário, bio, foto e selos. O nome também vale para `pessoas[usuario.id]`. */
export function editarPerfil(dados: DadosPerfil) {
  commit({ type: "editarPerfil", dados });
  toast({ tipo: "info", titulo: "Perfil atualizado" }, 2200);
}

/* ───────────── Lembretes do calendário ───────────── */

/** Avisos de cada evento: 72 h, 24 h e 2 h antes (Navegação §4.13). Cada um vira um `LembreteAgendado`. */
export const ANTECEDENCIAS_LEMBRETE_MIN = [4320, 1440, 120] as const;

const MIN = 60_000;
const H = 60 * MIN;

type EventoLembrete = { id: string; titulo: string; inicio: number };

function notificacaoDoSistema(titulo: string, corpo: string, tag: string) {
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification(titulo, { body: corpo, tag });
  } catch {
    /* navegador sem suporte: fica só a notificação do portal */
  }
}

function hora(ts: number) {
  return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** "72 h", "24 h", "2 h", "45 min" — quanto falta, arredondado para a unidade que a pessoa entende. */
export function rotuloAntecedencia(ms: number) {
  return ms >= 90 * MIN ? `${Math.round(ms / H)} h` : `${Math.max(1, Math.round(ms / MIN))} min`;
}

/** "72 h, 24 h e 2 h" (só os que ainda valem). */
function listarAntecedencias(minutos: number[]) {
  const rotulos = minutos.map((m) => rotuloAntecedencia(m * MIN));
  return rotulos.length > 1 ? `${rotulos.slice(0, -1).join(", ")} e ${rotulos[rotulos.length - 1]}` : (rotulos[0] ?? "");
}

/** Um `LembreteAgendado` por antecedência, ignorando os horários que já passaram. */
function lembretesDoEvento(evento: EventoLembrete, agora: number): LembreteAgendado[] {
  return ANTECEDENCIAS_LEMBRETE_MIN.map((min) => ({ eventoId: evento.id, titulo: evento.titulo, inicio: evento.inicio, disparoEm: evento.inicio - min * MIN, antecedenciaMin: min as number })).filter((l) => l.disparoEm > agora);
}

/** Liga/desliga os lembretes de um evento. Ao ligar, agenda os avisos de 72 h, 24 h e 2 h e pede permissão para notificações do sistema. */
export function alternarLembreteEvento(evento: EventoLembrete) {
  const estado = obterEstado();
  const ativo = estado.lembretes.includes(evento.id);
  const agendados = (estado.lembretesAgendados ?? []).filter((l) => l.eventoId !== evento.id);

  if (ativo) {
    commit({ type: "alternarLembrete", eventoId: evento.id });
    commit({ type: "definirLembretesAgendados", itens: agendados });
    toast({ tipo: "info", titulo: "Lembretes desativados", mensagem: evento.titulo }, 2400);
    return;
  }

  const novos = lembretesDoEvento(evento, Date.now());
  if (!novos.length) {
    toast({ tipo: "info", titulo: "Não dá para agendar o lembrete", mensagem: "Faltam menos de 2 h para o evento: os avisos de 72 h, 24 h e 2 h já passaram." }, 3600);
    return;
  }
  commit({ type: "alternarLembrete", eventoId: evento.id });
  commit({ type: "definirLembretesAgendados", itens: [...agendados, ...novos] });
  const validos = novos.map((l) => l.antecedenciaMin ?? 0);
  toast({ tipo: "info", titulo: "Lembrete ativado", mensagem: `Você será avisada ${listarAntecedencias(validos)} antes de “${evento.titulo}”` }, 3600);
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "default") void Notification.requestPermission();
  } catch {
    /* sem suporte */
  }
  verificarLembretes();
}

/**
 * Cria os avisos dos lembretes ativos que ainda não os têm (ex.: o lembrete que já vem ligado) e
 * troca o aviso antigo de 30 min (estado salvo antes dos três avisos) pelos de 72 h, 24 h e 2 h.
 */
export function reconciliarLembretes(eventos: EventoLembrete[]) {
  const estado = obterEstado();
  const agendados = estado.lembretesAgendados ?? [];
  const agora = Date.now();
  const novos: LembreteAgendado[] = [];
  const trocar = new Set<string>();

  for (const id of estado.lembretes) {
    const evento = eventos.find((e) => e.id === id);
    if (!evento) continue;
    const doEvento = agendados.filter((l) => l.eventoId === id);
    if (doEvento.some((l) => l.antecedenciaMin !== undefined)) continue;
    // Sem avisos novos: agenda os três e descarta o aviso único antigo que ainda não disparou.
    for (const l of doEvento) if (!l.disparado) trocar.add(l.eventoId);
    novos.push(...lembretesDoEvento(evento, agora));
  }
  if (!novos.length && !trocar.size) return;
  commit({ type: "definirLembretesAgendados", itens: [...agendados.filter((l) => !trocar.has(l.eventoId) || l.disparado), ...novos] });
}

/**
 * Dispara os lembretes vencidos: notificação no sino + notificação do sistema.
 * Vários avisos do mesmo evento vencidos juntos (app fechado) viram uma só notificação, com o tempo que falta de verdade.
 * O lembrete só desliga depois do último aviso.
 */
export function verificarLembretes() {
  const estado = obterEstado();
  const agora = Date.now();
  const lista = estado.lembretesAgendados ?? [];
  const vencidos = lista.filter((l) => !l.disparado && l.disparoEm <= agora);
  if (vencidos.length === 0) return;

  const restantes = lista.map((l) => (vencidos.includes(l) ? { ...l, disparado: true } : l));
  commit({ type: "definirLembretesAgendados", itens: restantes });

  const eventos = [...new Set(vencidos.map((l) => l.eventoId))];
  for (const eventoId of eventos) {
    const l = vencidos.find((v) => v.eventoId === eventoId)!;
    const faltam = l.inicio - agora;
    const texto = faltam > 0 ? `Faltam ${rotuloAntecedencia(faltam)} para “${l.titulo}”, às ${hora(l.inicio)}.` : `“${l.titulo}” estava marcado para ${hora(l.inicio)}.`;
    const titulo = faltam > 0 ? `Lembrete: faltam ${rotuloAntecedencia(faltam)}` : `Lembrete: ${l.titulo}`;
    // Só desliga quando não sobra nenhum aviso futuro deste evento.
    const sobra = restantes.some((x) => x.eventoId === eventoId && !x.disparado);
    if (!sobra && obterEstado().lembretes.includes(eventoId)) commit({ type: "alternarLembrete", eventoId });
    notificar(estado.usuario.id, { tipo: "sistema", titulo, texto });
    notificacaoDoSistema(titulo, texto, eventoId);
  }
}

/**
 * Apaga tudo o que está salvo neste dispositivo (estado, arquivos do IndexedDB e rascunhos) e volta ao estado inicial
 * (mesmo fluxo de `resetarDemonstracao`, com texto de versão final).
 */
export async function apagarDadosDoDispositivo() {
  novaEpoca();
  try {
    await apagarTodosArquivos();
  } catch {
    /* sem IndexedDB: o resto segue */
  }
  despachar({ type: "resetar", estado: criarEstadoInicial(Date.now()) });
  limparFalhaProgresso();
  // Os rascunhos dos formulários escutam este evento (ui/rascunhos.ts).
  window.dispatchEvent(new CustomEvent("cepi:dados-apagados"));
  toast({ tipo: "info", titulo: "Dados apagados", mensagem: "Este dispositivo voltou ao estado inicial." });
}
