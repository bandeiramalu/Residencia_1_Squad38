/** Gerador pseudoaleatório determinístico: os mesmos dados de demonstração em todo acesso. */
export function mulberry32(semente: number) {
  let a = semente;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash estável de texto → inteiro positivo (para escolhas determinísticas por id). */
export function hashTexto(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function escolher<T>(lista: readonly T[], rnd: () => number) {
  return lista[Math.floor(rnd() * lista.length)];
}

export function entre(min: number, max: number, rnd: () => number) {
  return Math.round(min + (max - min) * rnd());
}
