import type { KeyboardEvent } from "react";

/**
 * Padrão ARIA de abas, compartilhado por tudo que usa `role="tablist"` (Abas, ChipGroup, Segmentado e as abas do
 * Perfil e do painel do professor): no `onKeyDown` da lista, ← e → (com volta ao fim/início) e Home/End movem o foco
 * e já selecionam a aba (ativação automática, como um grupo de rádio). Combine com `abaNoTab` + `tabIndex` móvel:
 * só a aba ativa entra na ordem do Tab; as outras se alcançam pelas setas.
 */
export function aoTeclarNasAbas(e: KeyboardEvent<HTMLElement>) {
  if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  const tecla = e.key;
  if (tecla !== "ArrowLeft" && tecla !== "ArrowRight" && tecla !== "Home" && tecla !== "End") return;

  const lista = e.currentTarget;
  const abas = Array.from(lista.querySelectorAll<HTMLElement>('[role="tab"]')).filter(
    (a) => a.closest('[role="tablist"]') === lista && !a.hasAttribute("disabled") && a.getAttribute("aria-disabled") !== "true",
  );
  const atual = abas.indexOf((e.target as HTMLElement).closest<HTMLElement>('[role="tab"]') as HTMLElement);
  if (atual < 0 || abas.length < 2) return;

  const ultimo = abas.length - 1;
  const destino = tecla === "Home" ? 0 : tecla === "End" ? ultimo : tecla === "ArrowRight" ? (atual === ultimo ? 0 : atual + 1) : atual === 0 ? ultimo : atual - 1;
  e.preventDefault();
  abas[destino].focus();
  abas[destino].click();
}

/**
 * Id da aba que fica na ordem do Tab (`tabIndex={0}`; as demais, `-1`): a ativa, ou a primeira quando nenhuma
 * está ativa (ex.: filtro sem escolha ainda), para o grupo nunca ficar inalcançável pelo teclado.
 */
export function abaNoTab<T extends string>(ids: readonly T[], valor: T | null): T | undefined {
  return valor !== null && ids.includes(valor) ? valor : ids[0];
}
