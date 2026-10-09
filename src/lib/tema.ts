/**
 * Tema claro/escuro. A preferência fica no localStorage; um script no <head>
 * (SCRIPT_TEMA) aplica o tema antes da primeira pintura — sem "piscar" branco.
 */
import { useSyncExternalStore } from "react";

export type PreferenciaTema = "claro" | "escuro" | "sistema";
export type Tema = "claro" | "escuro";

import { CHAVE_TEMA as CHAVE, COR_BARRA } from "./tema-script";

const ouvintes = new Set<() => void>();

function lerPreferencia(): PreferenciaTema {
  try {
    const v = localStorage.getItem(CHAVE);
    return v === "claro" || v === "escuro" ? v : "sistema";
  } catch {
    return "sistema";
  }
}

function resolver(p: PreferenciaTema): Tema {
  if (p !== "sistema") return p;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
}

/** Acerta todos os `<meta name="theme-color">` (o Next gera um por `media`) para a cor do tema. */
function pintarBarra(tema: Tema) {
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", COR_BARRA[tema]));
}

function aplicar(tema: Tema) {
  const html = document.documentElement;
  // Desliga as transições de cor por um quadro: a troca fica instantânea e limpa.
  html.classList.add("sem-transicao");
  html.dataset.tema = tema;
  pintarBarra(tema);
  requestAnimationFrame(() => requestAnimationFrame(() => html.classList.remove("sem-transicao")));
}

export function definirTema(p: PreferenciaTema) {
  try {
    if (p === "sistema") localStorage.removeItem(CHAVE);
    else localStorage.setItem(CHAVE, p);
  } catch {
    /* sem armazenamento: vale só nesta visita */
  }
  aplicar(resolver(p));
  ouvintes.forEach((o) => o());
}

function assinar(o: () => void) {
  ouvintes.add(o);
  const mq = matchMedia("(prefers-color-scheme: dark)");
  const aoMudarSistema = () => {
    if (lerPreferencia() === "sistema") aplicar(resolver("sistema"));
    o();
  };
  mq.addEventListener("change", aoMudarSistema);
  return () => {
    ouvintes.delete(o);
    mq.removeEventListener("change", aoMudarSistema);
  };
}

/**
 * Mantém este documento no mesmo tema das outras abas e do sistema, mesmo sem nenhum seletor de tema na tela.
 * Também acerta a cor da barra do navegador na carga a frio (o `<meta>` do Next pode chegar depois do script do tema).
 * Use uma vez, no AppShell; devolve a função que desfaz.
 */
export function sincronizarTema(): () => void {
  pintarBarra(document.documentElement.dataset.tema === "escuro" ? "escuro" : "claro");
  const aoArmazenar = (e: StorageEvent) => {
    if (e.key !== CHAVE && e.key !== null) return;
    aplicar(resolver(lerPreferencia()));
    ouvintes.forEach((o) => o());
  };
  const mq = matchMedia("(prefers-color-scheme: dark)");
  const aoMudarSistema = () => {
    if (lerPreferencia() === "sistema") {
      aplicar(resolver("sistema"));
      ouvintes.forEach((o) => o());
    }
  };
  window.addEventListener("storage", aoArmazenar);
  mq.addEventListener("change", aoMudarSistema);
  return () => {
    window.removeEventListener("storage", aoArmazenar);
    mq.removeEventListener("change", aoMudarSistema);
  };
}

const lerTemaAtual = () => (document.documentElement.dataset.tema === "escuro" ? "escuro" : "claro") as Tema;

export function useTema() {
  const preferencia = useSyncExternalStore(assinar, lerPreferencia, () => "sistema" as PreferenciaTema);
  const tema = useSyncExternalStore(assinar, lerTemaAtual, () => "claro" as Tema);
  return { preferencia, tema, definir: definirTema, alternar: () => definirTema(tema === "escuro" ? "claro" : "escuro") };
}
