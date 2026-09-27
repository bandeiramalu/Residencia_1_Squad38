export const ESCOLA = {
  nome: "Colégio CEPI Expansão",
  curto: "CEPI Expansão",
  cidade: "Aracaju · SE",
  slogan: "Um colégio para chamar de meu",
  site: "https://www.cepiexpansao.com.br",
} as const;

export const DISCIPLINAS = [
  "Matemática",
  "Biologia",
  "História",
  "Português",
  "Química",
  "Física",
  "Geografia",
  "Inglês",
] as const;

export type Disciplina = (typeof DISCIPLINAS)[number];

export const ESPACOS = [
  { id: "escola", nome: "Toda a escola", descricao: "Colégio CEPI Expansão" },
  { id: "9A", nome: "9º Ano A", descricao: "Sua turma" },
  { id: "robotica", nome: "Clube de Robótica", descricao: "Terças e quintas, 14h" },
  { id: "bilingue", nome: "Bilíngue Cultura Inglesa", descricao: "Programa bilíngue 2026" },
] as const;

export const TURMA_DO_ALUNO = "9º Ano A";
