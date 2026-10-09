/** Chave do tema no localStorage (compartilhada com lib/tema.ts). */
export const CHAVE_TEMA = "cepi-tema";

/** Cor da barra do navegador (`<meta name="theme-color">`) em cada tema: o fundo da superfície. */
export const COR_BARRA = { claro: "#ffffff", escuro: "#0f1623" } as const;

/**
 * Executado inline no <head>, antes do React. Mantenha curto e sem dependências.
 * Aplica o tema e já acerta o `theme-color` (todos os metas existentes) na carga a frio, sem esperar o React.
 */
export const SCRIPT_TEMA = `(function(){try{var p=localStorage.getItem("${CHAVE_TEMA}")||"sistema";var e=p==="escuro"||(p==="sistema"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.tema=e?"escuro":"claro";var c=e?"${COR_BARRA.escuro}":"${COR_BARRA.claro}";var m=document.querySelectorAll('meta[name="theme-color"]');for(var i=0;i<m.length;i++)m[i].setAttribute("content",c);}catch(_){document.documentElement.dataset.tema="claro";}})();`;
