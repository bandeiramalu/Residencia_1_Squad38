import { DISCIPLINAS, type Disciplina } from "@/data/escola";

/** Cor fixa de cada disciplina nos gráficos (variáveis CSS com versão clara/escura). */
export const COR_DISCIPLINA = Object.fromEntries(DISCIPLINAS.map((d, i) => [d, `var(--disc-${i + 1})`])) as Record<Disciplina, string>;

/** Rampa do mapa de calor (nível 0–4). */
export const COR_CALOR = ["var(--calor-0)", "var(--calor-1)", "var(--calor-2)", "var(--calor-3)", "var(--calor-4)"] as const;
