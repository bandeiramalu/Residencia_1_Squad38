import { extendTailwindMerge } from "tailwind-merge";

/** tailwind-merge com os utilitários do Design System (sombras próprias contam como "shadow"). */
const mesclar = extendTailwindMerge({
  extend: { classGroups: { shadow: [{ shadow: ["card", "flutuante", "brilho"] }] } },
});

/**
 * Junta classes e resolve conflitos do Tailwind: a última vence.
 * Ex.: `cn("inline-flex px-2", "hidden sm:inline-flex px-1.5")` → "hidden sm:inline-flex px-1.5".
 */
export function cn(...classes: (string | false | null | undefined)[]) {
  return mesclar(classes.filter(Boolean).join(" "));
}
