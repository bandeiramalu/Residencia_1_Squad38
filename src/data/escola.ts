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

/** Nome de todo espaço de post, inclusive "9B" e "8A" (que não estão em `ESPACOS`, o seletor da aluna). */
const NOMES_DE_ESPACO: Record<string, string> = {
  escola: "Toda a escola",
  "9A": "9º Ano A",
  "9B": "9º Ano B",
  "8A": "8º Ano A",
  robotica: "Clube de Robótica",
  bilingue: "Bilíngue Cultura Inglesa",
};

/** "9B" → "9º Ano B". Id desconhecido volta como veio. */
export function nomeDoEspaco(id: string): string {
  return NOMES_DE_ESPACO[id] ?? id;
}

/** Nome curto para frases e toasts: "9º A", "Toda a escola". */
export function rotuloDoEspaco(id: string): string {
  return nomeDoEspaco(id).replace("º Ano ", "º ");
}
