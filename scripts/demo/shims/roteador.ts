/** Roteamento por hash (#/feed) — funciona abrindo o HTML direto do disco (file://), sem servidor. */
import { useSyncExternalStore } from "react";

const ouvintes = new Set<() => void>();
if (typeof window !== "undefined") window.addEventListener("hashchange", () => ouvintes.forEach((o) => o()));

function assinar(o: () => void) {
  ouvintes.add(o);
  return () => ouvintes.delete(o);
}

/** Caminho + query atuais, ex.: "/feed?aba=duvidas". */
export function urlAtual() {
  const h = decodeURI(location.hash.slice(1));
  if (!h || h === "/") return "/";
  return h.startsWith("/") ? h : `/${h}`;
}

export function separar(url: string) {
  const semAncora = url.split("#")[0];
  const [caminho, query = ""] = semAncora.split("?");
  return { caminho: caminho.replace(/\/+$/, "") || "/", query };
}

export function useUrl() {
  return useSyncExternalStore(assinar, urlAtual, urlAtual);
}

export function navegar(href: string, substituir = false) {
  const destino = href.startsWith("/") ? href : `/${href}`;
  if (destino === urlAtual()) return;
  if (substituir) location.replace(`#${destino}`);
  else location.hash = destino;
}
