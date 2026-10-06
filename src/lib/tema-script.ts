/** Chave do tema no localStorage (compartilhada com lib/tema.ts). */
export const CHAVE_TEMA = "cepi-tema";

/** Executado inline no <head>, antes do React. Mantenha curto e sem dependências. */
export const SCRIPT_TEMA = `(function(){try{var p=localStorage.getItem("${CHAVE_TEMA}")||"sistema";var e=p==="escuro"||(p==="sistema"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.tema=e?"escuro":"claro";}catch(_){document.documentElement.dataset.tema="claro";}})();`;
