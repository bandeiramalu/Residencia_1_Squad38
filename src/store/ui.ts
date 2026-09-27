/**
 * Estado de interface que NÃO é salvo: notificações (toasts), comemorações
 * e a publicação que o feed deve destacar ao abrir.
 */
import { useSyncExternalStore } from "react";

export type TipoToast = "ganho" | "gasto" | "info" | "sequencia" | "alerta" | "medalha" | "nivel" | "xp";

export interface Toast {
  id: number;
  tipo: TipoToast;
  titulo: string;
  mensagem?: string;
}

interface EstadoUI {
  toasts: Toast[];
  celebracao: number;
  focoPost: string | null;
}

let ui: EstadoUI = { toasts: [], celebracao: 0, focoPost: null };
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

const inicial: EstadoUI = { toasts: [], celebracao: 0, focoPost: null };

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
