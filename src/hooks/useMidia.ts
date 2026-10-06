import { useSyncExternalStore } from "react";

/** `true` quando a media query bate (ex.: "(min-width: 1024px)"). No servidor, `false`. */
export function useMidia(query: string) {
  return useSyncExternalStore(
    (ouvinte) => {
      const mq = matchMedia(query);
      mq.addEventListener("change", ouvinte);
      return () => mq.removeEventListener("change", ouvinte);
    },
    () => matchMedia(query).matches,
    () => false,
  );
}

export const DESKTOP = "(min-width: 1024px)";
