import { commit, notificar, novaEpoca } from "../nucleo";
import type { DadosPerfil } from "../reducer";
import { criarEstadoInicial } from "../seed";
import { despachar, obterEstado } from "../store";
import { toast } from "../ui";
import type { LembreteAgendado } from "../types";

/** Salva nome, @usuário, bio, foto e selos. O nome também vale para `pessoas[usuario.id]`. */
export function editarPerfil(dados: DadosPerfil) {
  commit({ type: "editarPerfil", dados });
  toast({ tipo: "info", titulo: "Perfil atualizado" }, 2200);
}

/* ───────────── Lembretes do calendário ───────────── */

export const ANTECEDENCIA_LEMBRETE_MIN = 30;

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

/** Liga/desliga o lembrete de um evento. Ao ligar, pede permissão para notificações do sistema. */
export function alternarLembreteEvento(evento: { id: string; titulo: string; inicio: number }) {
  const estado = obterEstado();
  const ativo = estado.lembretes.includes(evento.id);
  const agendados = (estado.lembretesAgendados ?? []).filter((l) => l.eventoId !== evento.id);

  if (ativo) {
    commit({ type: "alternarLembrete", eventoId: evento.id });
    commit({ type: "definirLembretesAgendados", itens: agendados });
    toast({ tipo: "info", titulo: "Lembrete desativado", mensagem: evento.titulo }, 2400);
    return;
  }

  const novo: LembreteAgendado = { eventoId: evento.id, titulo: evento.titulo, inicio: evento.inicio, disparoEm: evento.inicio - ANTECEDENCIA_LEMBRETE_MIN * 60_000 };
  commit({ type: "alternarLembrete", eventoId: evento.id });
  commit({ type: "definirLembretesAgendados", itens: [...agendados, novo] });
  toast({ tipo: "info", titulo: "Lembrete ativado", mensagem: `${evento.titulo} · aviso ${ANTECEDENCIA_LEMBRETE_MIN} min antes` }, 2800);
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "default") void Notification.requestPermission();
  } catch {
    /* sem suporte */
  }
  verificarLembretes();
}

/** Cria o horário dos lembretes ativos que ainda não têm (ex.: o lembrete que já vem ligado). */
export function reconciliarLembretes(eventos: { id: string; titulo: string; inicio: number }[]) {
  const estado = obterEstado();
  const agendados = estado.lembretesAgendados ?? [];
  const faltando = estado.lembretes.filter((id) => !agendados.some((l) => l.eventoId === id));
  const novos = faltando
    .map((id) => eventos.find((e) => e.id === id))
    .filter((e): e is { id: string; titulo: string; inicio: number } => !!e)
    .map((e) => ({ eventoId: e.id, titulo: e.titulo, inicio: e.inicio, disparoEm: e.inicio - ANTECEDENCIA_LEMBRETE_MIN * 60_000 }));
  if (novos.length) commit({ type: "definirLembretesAgendados", itens: [...agendados, ...novos] });
}

/** Dispara os lembretes vencidos: notificação no sino + notificação do sistema. */
export function verificarLembretes() {
  const estado = obterEstado();
  const agora = Date.now();
  const lista = estado.lembretesAgendados ?? [];
  const vencidos = lista.filter((l) => !l.disparado && l.disparoEm <= agora);
  if (vencidos.length === 0) return;

  commit({ type: "definirLembretesAgendados", itens: lista.map((l) => (vencidos.includes(l) ? { ...l, disparado: true } : l)) });
  for (const l of vencidos) {
    if (obterEstado().lembretes.includes(l.eventoId)) commit({ type: "alternarLembrete", eventoId: l.eventoId });
    const faltam = Math.round((l.inicio - agora) / 60_000);
    const texto = faltam > 0 ? `Começa em ${faltam} min, às ${hora(l.inicio)}.` : `Estava marcado para ${hora(l.inicio)}.`;
    notificar(estado.usuario.id, { tipo: "sistema", titulo: `Lembrete: ${l.titulo}`, texto });
    notificacaoDoSistema(`Lembrete: ${l.titulo}`, texto, l.eventoId);
  }
}

/** Apaga tudo o que está salvo neste dispositivo e volta ao estado inicial (mesmo fluxo de `resetarDemonstracao`, com texto de versão final). */
export function apagarDadosDoDispositivo() {
  novaEpoca();
  despachar({ type: "resetar", estado: criarEstadoInicial(Date.now()) });
  toast({ tipo: "info", titulo: "Dados apagados", mensagem: "Este dispositivo voltou ao estado inicial." });
}
