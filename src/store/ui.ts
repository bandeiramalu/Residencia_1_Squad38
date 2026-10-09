/**
 * Estado de interface que NÃO é salvo: notificações (toasts), comemorações,
 * a publicação que o feed deve destacar e os avanços que não foram salvos (tela 76).
 */
import { useSyncExternalStore } from "react";
import type { TipoNotificacao } from "./types";

export type TipoToast = "ganho" | "gasto" | "info" | "sequencia" | "alerta" | "medalha" | "nivel" | "xp";

export const TOAST_DA_NOTIFICACAO: Record<TipoNotificacao, TipoToast> = {
  pontos: "ganho",
  atividade: "info",
  correcao: "xp",
  entrega: "info",
  campeonato: "medalha",
  sala: "info",
  moderacao: "alerta",
  sistema: "info",
};

export interface Toast {
  id: number;
  tipo: TipoToast;
  titulo: string;
  mensagem?: string;
  /** Rota aberta ao tocar na notificação. */
  href?: string;
}

/** Avanço que não foi salvo (simulação "salvar"): quanto faltou registrar e quando foi a tentativa. */
export interface FalhaProgresso {
  quantidade: number;
  em: number;
}

export interface EstadoUI {
  toasts: Toast[];
  celebracao: number;
  focoPost: string | null;
  /** Progresso de missão que não foi salvo, por chave (id da missão ou "coletiva"): a tela oferece "Tentar novamente". */
  falhasProgresso: Record<string, FalhaProgresso>;
}

const inicial: EstadoUI = { toasts: [], celebracao: 0, focoPost: null, falhasProgresso: {} };
let ui: EstadoUI = inicial;
const ouvintes = new Set<() => void>();
let proximoId = 1;

function atualizar(parcial: Partial<EstadoUI>) {
  ui = { ...ui, ...parcial };
  ouvintes.forEach((o) => o());
}

export function toast(t: Omit<Toast, "id">, duracao = 3400) {
  const id = proximoId++;
  // Mantém no máximo 3 notificações empilhadas.
  atualizar({ toasts: [...ui.toasts.slice(-2), { ...t, id }] });
  setTimeout(() => removerToast(id), duracao);
}

export function removerToast(id: number) {
  if (ui.toasts.some((t) => t.id === id)) atualizar({ toasts: ui.toasts.filter((t) => t.id !== id) });
}

export function celebrar() {
  atualizar({ celebracao: ui.celebracao + 1 });
}

export function focarPost(id: string | null) {
  atualizar({ focoPost: id });
}

/** Falha de salvamento ainda pendente de `chave` (id da missão ou "coletiva"). */
export function falhaDeProgresso(chave: string): FalhaProgresso | undefined {
  return ui.falhasProgresso[chave];
}

/** Guarda (ou soma, se já havia) um avanço que não foi salvo. */
export function registrarFalhaProgresso(chave: string, quantidade: number) {
  const atual = ui.falhasProgresso[chave];
  atualizar({ falhasProgresso: { ...ui.falhasProgresso, [chave]: { quantidade: (atual?.quantidade ?? 0) + quantidade, em: Date.now() } } });
}

/** Marca nova tentativa sem somar de novo (a quantidade pendente é a mesma). */
export function renovarFalhaProgresso(chave: string) {
  const atual = ui.falhasProgresso[chave];
  if (atual) atualizar({ falhasProgresso: { ...ui.falhasProgresso, [chave]: { ...atual, em: Date.now() } } });
}

export function limparFalhaProgresso(chave?: string) {
  if (chave === undefined) {
    if (Object.keys(ui.falhasProgresso).length) atualizar({ falhasProgresso: {} });
    return;
  }
  if (!(chave in ui.falhasProgresso)) return;
  const restantes = { ...ui.falhasProgresso };
  delete restantes[chave];
  atualizar({ falhasProgresso: restantes });
}

export function useUI() {
  return useSyncExternalStore(
    (o) => {
      ouvintes.add(o);
      return () => {
        ouvintes.delete(o);
      };
    },
    () => ui,
    () => inicial,
  );
}
