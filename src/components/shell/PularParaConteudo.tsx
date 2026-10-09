"use client";

import type { MouseEvent } from "react";

/** Id do conteúdo principal que o link "Pular para o conteúdo" leva o foco. */
export const ID_CONTEUDO = "conteudo";

/**
 * Primeiro item focável da página (DS §16, navegação por teclado). Fica fora da tela até receber foco.
 * Não usa o âncora do navegador: na demonstração (rotas por hash) `href="#conteudo"` trocaria a rota,
 * por isso o clique só foca o `<main tabIndex={-1}>`.
 */
export function PularParaConteudo() {
  const pular = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById(ID_CONTEUDO)?.focus();
  };
  return (
    <a
      href={`#${ID_CONTEUDO}`}
      onClick={pular}
      className="fixed left-3 top-3 z-[80] -translate-y-24 rounded-lg bg-superficie px-4 py-2.5 text-sm font-medium text-tinta shadow-flutuante ring-1 ring-borda focus:translate-y-0"
    >
      Pular para o conteúdo
    </a>
  );
}
