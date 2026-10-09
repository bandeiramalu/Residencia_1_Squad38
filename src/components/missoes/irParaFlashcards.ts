import { iniciarRodadaSeLivre } from "@/store/acoes/flashcards";

/** Id da seção dos Flashcards em Missões (âncora de "Praticar flashcards" e da missão coletiva). */
export const ID_FLASHCARDS = "flashcards";

/** Rola até os Flashcards e leva o foco para a seção; com `iniciar`, começa uma rodada se não houver uma em andamento. */
export function irParaFlashcards(iniciar = false) {
  if (iniciar) iniciarRodadaSeLivre("Todas");
  const secao = document.getElementById(ID_FLASHCARDS);
  if (!secao) return;
  const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  // Espera a rodada aparecer para rolar até o card já com a altura final.
  requestAnimationFrame(() => {
    secao.scrollIntoView({ behavior: reduzir ? "auto" : "smooth", block: "start" });
    secao.focus({ preventScroll: true });
  });
}
