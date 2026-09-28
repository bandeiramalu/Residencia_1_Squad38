/**
 * Store global do Portal do Aluno.
 *
 * Um "mini-Redux": o estado vive fora do React, muda só via `despachar(acao)`
 * (reducer puro em ./reducer.ts) e os componentes leem com `useEstado()`, que usa
 * o `useSyncExternalStore` do React. O estado é salvo no localStorage, então a
 * demonstração continua de onde parou ao recarregar a página.
 */
import { useSyncExternalStore } from "react";
import { reducer, type Acao } from "./reducer";
import { criarEstadoInicial, migrarEstado } from "./seed";
import type { AppState } from "./types";

const CHAVE = "cepi-portal-do-aluno";

let estado: AppState | null = null;
let estadoServidor: AppState | null = null;
const ouvintes = new Set<() => void>();
let salvarTimer: ReturnType<typeof setTimeout> | undefined;

function carregar(): AppState {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (salvo) {
      const dados = migrarEstado(JSON.parse(salvo) as AppState);
      if (dados) return dados;
    }
  } catch {
    // localStorage indisponível (aba anônima, bloqueio): segue com o estado inicial.
  }
  return criarEstadoInicial(Date.now());
}

function salvarAgora() {
  clearTimeout(salvarTimer);
  salvarTimer = undefined;
  if (!estado) return;
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch {
    // Sem armazenamento: a demo funciona, só não persiste.
  }
}

/** Agrupa várias mudanças seguidas em uma única gravação. */
function persistir() {
  clearTimeout(salvarTimer);
  salvarTimer = setTimeout(salvarAgora, 150);
}

function notificar() {
  ouvintes.forEach((ouvinte) => ouvinte());
}

export function obterEstado(): AppState {
  if (!estado) estado = carregar();
  return estado;
}

export function despachar(acao: Acao): AppState {
  const anterior = obterEstado();
  const proximo = reducer(anterior, acao);
  if (proximo !== anterior) {
    estado = proximo;
    persistir();
    notificar();
  }
  return proximo;
}

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

if (typeof window !== "undefined") {
  // Grava na hora se a página for fechada ou recarregada antes do agrupamento.
  window.addEventListener("pagehide", salvarAgora);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") salvarAgora();
  });

  // Mantém duas abas abertas sincronizadas.
  window.addEventListener("storage", (e) => {
    if (e.key !== CHAVE || !e.newValue) return;
    try {
      estado = JSON.parse(e.newValue) as AppState;
      notificar();
    } catch {
      /* ignora dado corrompido */
    }
  });
}

function obterEstadoServidor() {
  // Só é lido durante a hidratação; o <PortaDeHidratacao> não renderiza telas nesse momento.
  if (!estadoServidor) estadoServidor = criarEstadoInicial(0);
  return estadoServidor;
}

export function useEstado(): AppState {
  return useSyncExternalStore(assinar, obterEstado, obterEstadoServidor);
}

const assinarNada = () => () => {};

/** `false` no servidor e durante a hidratação; `true` depois, no navegador. */
export function useHidratado() {
  return useSyncExternalStore(
    assinarNada,
    () => true,
    () => false,
  );
}
