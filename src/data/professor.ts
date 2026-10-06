import type { Disciplina } from "./escola";

/** Professor usado no login de demonstração. */
export const PROFESSOR_ID = "prof_ricardo";

export const PROFESSOR = {
  id: PROFESSOR_ID,
  nome: "Prof. Ricardo Nogueira",
  disciplina: "Matemática" as Disciplina,
  email: "ricardo.nogueira@cepi.edu.br",
};

/** Turmas em que o professor da demonstração leciona. */
export const TURMAS_DO_PROFESSOR = ["9º Ano A", "9º Ano B", "8º Ano A"] as const;

/** Todas as turmas que aparecem em campeonatos interclasses e rankings da escola. */
export const TURMAS_ESCOLA = ["9º Ano A", "9º Ano B", "9º Ano C", "8º Ano A", "8º Ano B", "1ª Série EM"] as const;
