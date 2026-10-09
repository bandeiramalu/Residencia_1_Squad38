/**
 * Modo apresentação: mostra os atalhos de demonstração (avançar o timer, simular saída da tela,
 * roteiro guiado). Desligado por padrão — o app aparece como na versão final.
 * Liga/desliga em Perfil › Configurações ou com o atalho Alt+Shift+D.
 * As simulações de falha (`lib/simulacoes.ts`) só agem com o modo ligado.
 */
import { useEffect, useSyncExternalStore } from "react";
import { CHAVE_APRESENTACAO as CHAVE, EVENTO_APRESENTACAO, limparSimulacoes } from "./simulacoes";

const ouvintes = new Set<() => void>();

function ler(): boolean {
  try {
    return localStorage.getItem(CHAVE) === "1";
  } catch {
    return false;
  }
}

export function definirModoApresentacao(ativo: boolean) {
  try {
    if (ativo) localStorage.setItem(CHAVE, "1");
    else localStorage.removeItem(CHAVE);
  } catch {
    /* sem armazenamento: vale só nesta visita */
  }
  // Ao sair do modo, as simulações de falha voltam todas desligadas.
  if (!ativo) limparSimulacoes();
  ouvintes.forEach((o) => o());
  // Avisa quem depende do modo (simulações de falha, faixa de conexão…).
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENTO_APRESENTACAO));
}

export function alternarModoApresentacao() {
  definirModoApresentacao(!ler());
  return ler();
}

function assinar(o: () => void) {
  ouvintes.add(o);
  const aoMudarOutraAba = (e: StorageEvent) => {
    if (e.key === CHAVE) o();
  };
  window.addEventListener("storage", aoMudarOutraAba);
  return () => {
    ouvintes.delete(o);
    window.removeEventListener("storage", aoMudarOutraAba);
  };
}

export function useModoApresentacao() {
  return useSyncExternalStore(assinar, ler, () => false);
}

/** Registra o atalho Alt+Shift+D (use uma vez, no AppShell). */
export function useAtalhoApresentacao(aoAlternar?: (ativo: boolean) => void) {
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (!(e.altKey && e.shiftKey && e.code === "KeyD")) return;
      e.preventDefault();
      aoAlternar?.(alternarModoApresentacao());
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aoAlternar]);
}
