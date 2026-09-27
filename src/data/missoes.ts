import type { Missao, MissaoColetiva } from "@/store/types";

/** Missões diárias (renovadas a cada 24 h) e missões do professor. */
export const MISSOES: Missao[] = [
  {
    id: "d1",
    tipo: "diaria",
    titulo: "Responder 2 dúvidas de colegas",
    descricao: "O feed tem dúvidas abertas de Matemática, Biologia e História.",
    alvo: 2,
    progresso: 1,
    pontos: 25,
    xp: 10,
    concluida: false,
  },
  {
    id: "d2",
    tipo: "diaria",
    titulo: "Concluir 5 flashcards de Química",
    descricao: "Use a prática rápida desta tela. Repetição espaçada fixa melhor que reler.",
    disciplina: "Química",
    alvo: 5,
    progresso: 5,
    pontos: 25,
    xp: 10,
    concluida: true,
  },
  {
    id: "d3",
    tipo: "diaria",
    titulo: "Revisar o mapa mental de Citologia",
    descricao: "Abra o material publicado pela Profª. Denise no feed.",
    disciplina: "Biologia",
    postId: "p4",
    alvo: 1,
    progresso: 0,
    pontos: 20,
    xp: 10,
    concluida: false,
  },
  {
    id: "pr1",
    tipo: "professor",
    titulo: "Resolver a lista 7 de funções afins (10 questões)",
    descricao: "Vale para a participação prevista no plano de aula da semana.",
    disciplina: "Matemática",
    professorId: "prof_ricardo",
    postId: "p1",
    alvo: 10,
    progresso: 4,
    pontos: 30,
    xp: 20,
    concluida: false,
  },
  {
    id: "pr2",
    tipo: "professor",
    titulo: "Entregar o relatório da aula prática de Citologia",
    descricao: "O modelo está no material da aula 12.",
    disciplina: "Biologia",
    professorId: "prof_denise",
    postId: "p4",
    alvo: 1,
    progresso: 0,
    pontos: 30,
    xp: 20,
    concluida: false,
  },
];

export const COLETIVA: MissaoColetiva = {
  titulo: "Maratona da Turma · 200 flashcards",
  descricao:
    "O 9º Ano A precisa concluir 200 flashcards até domingo. Os 100 pontos são divididos entre os participantes e cada um garante +30 XP.",
  alvo: 200,
  progresso: 163,
  pontosTotal: 100,
  xp: 30,
  participantes: ["ana", "lucas", "julia", "pedro", "marina", "sofia"],
  concluida: false,
};

export const FLASHCARDS = [
  { pergunta: "Qual é a fórmula do ácido sulfúrico?", resposta: "H₂SO₄ — ácido forte, presente na bateria de carro." },
  { pergunta: "Qual critério organiza a tabela periódica?", resposta: "O número atômico crescente (quantidade de prótons)." },
  { pergunta: "Qual é o nome do composto NaCl?", resposta: "Cloreto de sódio — o sal de cozinha." },
  { pergunta: "O que caracteriza uma reação de neutralização?", resposta: "Ácido + base → sal + água." },
  { pergunta: "Quantos elétrons de valência tem o oxigênio?", resposta: "Seis elétrons de valência (família 16)." },
];

/** Recompensa por dia de sequência: dias 1–7 crescem; a partir do dia 8, +50. */
export function pontosDaSequencia(dia: number) {
  const escala = [10, 15, 20, 25, 30, 40, 50];
  return dia >= 8 ? 50 : escala[Math.max(0, dia - 1)];
}

export const CATEGORIAS_RELATO = ["Estrutura", "Biblioteca", "Merenda", "Tecnologia", "Convivência", "Outro"];
