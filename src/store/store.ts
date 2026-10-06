/**
 * Store global do Portal do Aluno.
 *
 * Um "mini-Redux": o estado vive fora do React, muda só via `despachar(acao)`
 * (reducer puro em ./reducer.ts) e os componentes leem com `useEstado()`, que usa
 * o `useSyncExternalStore` do React. O estado é salvo no localStorage: o app continua
 * de onde parou ao recarregar e várias janelas compartilham os mesmos dados em tempo real.
 */
import { useSyncExternalStore } from "react";
import { lerSessao } from "@/lib/auth";
import { reducer, type Acao } from "./reducer";
import { criarEstadoInicial, migrarEstado } from "./seed";
import type { AppState } from "./types";
import { TOAST_DA_NOTIFICACAO, toast } from "./ui";

const CHAVE = "cepi-portal-do-aluno";

let estado: AppState | null = null;
let estadoServidor: AppState | null = null;
const ouvintes = new Set<() => void>();

function carregar(): AppState {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (salvo) {
      const dados = migrarEstado(JSON.parse(salvo));
      if (dados) return dados;
    }
  } catch {
    // localStorage indisponível (aba anônima, bloqueio): segue com o estado inicial.
  }
  return criarEstadoInicial(Date.now());
}

function salvarAgora() {
  if (!estado) return;
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch {
    // Sem armazenamento: o app funciona, só não persiste.
  }
}

/**
 * Grava na hora: só a aba que despachou a ação escreve; as outras reidratam pelo evento
 * `storage`. Sem atraso, duas janelas não sobrescrevem uma à outra com dado velho.
 */
function persistir() {
  salvarAgora();
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
  // Tempo real entre janelas: quando outra aba grava, esta reidrata o estado inteiro.
  // Esta aba não grava de volta (só quem despacha grava), então não há laço.
  window.addEventListener("storage", (e) => {
    if (e.key !== CHAVE || !e.newValue) return;
    try {
      const novo = migrarEstado(JSON.parse(e.newValue));
      if (!novo) return;
      const antes = estado;
      estado = novo;
      avisarNovasNotificacoes(antes, novo);
      notificar();
    } catch {
      /* ignora dado corrompido */
    }
  });
}

/** Mostra como toast as notificações que chegaram de outra janela para quem está logado aqui. */
function avisarNovasNotificacoes(antes: AppState | null, depois: AppState) {
  const eu = lerSessao()?.usuarioId;
  if (!eu || !antes) return;
  const conhecidas = new Set(antes.notificacoes.map((n) => n.id));
  const novas = depois.notificacoes.filter((n) => n.para === eu && !n.lida && !conhecidas.has(n.id)).slice(0, 3);
  for (const n of novas) toast({ tipo: TOAST_DA_NOTIFICACAO[n.tipo], titulo: n.titulo, mensagem: n.texto, href: n.href }, 4200);
}

function obterEstadoServidor() {
  // Só é lido durante a hidratação; o <PortaDeHidratacao> não renderiza telas nesse momento.
  if (!estadoServidor) estadoServidor = criarEstadoInicial(0);
  return estadoServidor;
}

export function useEstado(): AppState {
  return useSyncExternalStore(assinar, obterEstado, obterEstadoServidor);
}

/**
 * Lê só uma fatia do estado: o componente re-renderiza apenas quando ESSA fatia muda.
 * O seletor deve devolver algo já existente no estado (não crie objetos novos aqui).
 */
export function useSeletor<T>(seletor: (estado: AppState) => T): T {
  return useSyncExternalStore(
    assinar,
    () => seletor(obterEstado()),
    () => seletor(obterEstadoServidor()),
  );
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
