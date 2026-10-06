import type { Usuario } from "@/store/types";

/** Estado inicial da aluna usada na demonstração (persona do Portal do Aluno). */
export const USUARIO_INICIAL: Usuario = {
  id: "ana",
  nome: "Ana Beatriz Moura",
  turma: "9º Ano A",
  xp: 890,
  xpSemana: 368,
  xpSemanaDisc: {
    Matemática: 92,
    Biologia: 64,
    Português: 58,
    Química: 70,
    História: 24,
    Física: 22,
    Geografia: 18,
    Inglês: 20,
  },
  pontos: 2570,
  respostasUteis: 10,
  relatosValidados: 1,
  dominio: {
    Matemática: 72,
    Biologia: 58,
    História: 45,
    Português: 80,
    Química: 76,
    Física: 66,
    Geografia: 61,
    Inglês: 70,
  },
  privacidade: "publico",
  equipados: ["av1", "pf3"],
};
