import { useSyncExternalStore } from "react";

/**
 * Relógio compartilhado: um único intervalo por cadência, lido por quantos
 * componentes precisarem (tempo relativo, contagem regressiva, calendário).
 */
interface Relogio {
  assinar: (ouvinte: () => void) => () => void;
  ler: () => number;
}

const relogios = new Map<number, Relogio>();

function criarRelogio(intervalo: number): Relogio {
  let agora = Date.now();
  let timer: ReturnType<typeof setInterval> | undefined;
  const ouvintes = new Set<() => void>();

  return {
    assinar(ouvinte) {
      ouvintes.add(ouvinte);
      if (!timer) {
        agora = Date.now();
        timer = setInterval(() => {
          agora = Date.now();
          ouvintes.forEach((o) => o());
        }, intervalo);
      }
      return () => {
        ouvintes.delete(ouvinte);
        if (!ouvintes.size && timer) {
          clearInterval(timer);
          timer = undefined;
        }
      };
    },
    ler: () => agora,
  };
}

function relogio(intervalo: number) {
  let r = relogios.get(intervalo);
  if (!r) {
    r = criarRelogio(intervalo);
    relogios.set(intervalo, r);
  }
  return r;
}

const lerServidor = () => 0;

export function useAgora(intervalo = 30_000) {
  const { assinar, ler } = relogio(intervalo);
  return useSyncExternalStore(assinar, ler, lerServidor);
}
