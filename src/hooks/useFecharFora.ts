import { useEffect, type RefObject } from "react";

/** Fecha menus suspensos ao tocar fora deles ou apertar Esc. */
export function useFecharFora(ref: RefObject<HTMLElement | null>, aberto: boolean, fechar: () => void) {
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) fechar();
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    document.addEventListener("pointerdown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [ref, aberto, fechar]);
}
