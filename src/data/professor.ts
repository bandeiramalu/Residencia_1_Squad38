import type { EspacoId } from "@/store/types";
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

/** Para onde o professor publica no feed (avisos, materiais e publicações): a escola toda ou uma das suas turmas. */
export type DestinoProfessor = "escola" | "9A" | "9B" | "8A";

export const DESTINOS_PROFESSOR: { id: DestinoProfessor; nome: string; descricao: string }[] = [
  { id: "escola", nome: "Toda a escola", descricao: "Todos os alunos do colégio" },
  { id: "9A", nome: "9º Ano A", descricao: "Alunos do 9º Ano A" },
  { id: "9B", nome: "9º Ano B", descricao: "Alunos do 9º Ano B" },
  { id: "8A", nome: "8º Ano A", descricao: "Alunos do 8º Ano A" },
];

/** Espaço de post que corresponde a uma turma (só as turmas do professor têm espaço próprio). */
export const TURMA_DO_ESPACO: Partial<Record<EspacoId, string>> = { "9A": "9º Ano A", "9B": "9º Ano B", "8A": "8º Ano A" };

/** Espaço de post de uma turma ("9º Ano B" → "9B"); `undefined` para turmas sem espaço próprio. */
export function espacoDaTurma(turma: string): EspacoId | undefined {
  return (Object.keys(TURMA_DO_ESPACO) as EspacoId[]).find((espaco) => TURMA_DO_ESPACO[espaco] === turma);
}
