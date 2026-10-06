/**
 * Estado de interface que NÃO é salvo: notificações (toasts), comemorações,
 * a publicação que o feed deve destacar.
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

interface EstadoUI {
  toasts: Toast[];
  celebracao: number;
  focoPost: string | null;
}

const inicial: EstadoUI = { toasts: [], celebracao: 0, focoPost: null };
let ui: EstadoUI = inicial;
const ouvintes = new Set<() => void>();
let proximoId = 1;

function atualizar(parcial: Partial<EstadoUI>) {
  ui = { ...ui, ...parcial };
  ouvintes.forEach((o) => o());
}

export function lerUI() {
  return ui;
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
