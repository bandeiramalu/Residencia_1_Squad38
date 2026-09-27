/**
 * Estado de interface que NÃO é salvo: notificações (toasts), comemorações,
 * a publicação que o feed deve destacar e quem está "digitando" nas conversas.
 */
import { useSyncExternalStore } from "react";

export type TipoToast = "ganho" | "gasto" | "info" | "sequencia" | "alerta" | "medalha" | "nivel" | "xp" | "mensagem";

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
  /** conversaId → id de quem está digitando. */
  digitando: Record<string, string>;
  conversaAberta: string | null;
}

const inicial: EstadoUI = { toasts: [], celebracao: 0, focoPost: null, digitando: {}, conversaAberta: null };
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

export function definirDigitando(conversaId: string, autorId: string | null) {
  const digitando = { ...ui.digitando };
  if (autorId) digitando[conversaId] = autorId;
  else delete digitando[conversaId];
  atualizar({ digitando });
}

export function definirConversaAberta(conversaId: string | null) {
  atualizar({ conversaAberta: conversaId });
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
