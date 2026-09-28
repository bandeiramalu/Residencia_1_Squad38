import { criarConversas } from "@/data/conversas";
import { COLETIVA, FLASHCARDS, MISSOES } from "@/data/missoes";
import { PESSOAS } from "@/data/pessoas";
import { criarPosts } from "@/data/posts";
import { USUARIO_INICIAL } from "@/data/usuario";
import { diaDaSemana } from "@/lib/tempo";
import type { AppState, StatusDia } from "./types";

export const VERSAO_ESTADO = 2;
const D = 24 * 60 * 60 * 1000;

export function criarEstadoInicial(agora: number): AppState {
  const hoje = diaDaSemana(agora);
  const semana: StatusDia[] = Array.from({ length: 7 }, (_, i) => (i < hoje ? "estudou" : i === hoje ? "pendente" : "futuro"));

  return {
    versao: VERSAO_ESTADO,
    criadoEm: agora,
    usuario: structuredClone(USUARIO_INICIAL),
    pessoas: Object.fromEntries(PESSOAS.map((p) => [p.id, p])),
    posts: criarPosts(agora),
    missoes: structuredClone(MISSOES),
    coletiva: structuredClone(COLETIVA),
    sequencia: {
      dias: 13,
      diasSemCongelador: 13,
      congeladores: 2,
      congeladoresMax: 2,
      estudouHoje: false,
      quebrada: false,
      semana,
      hoje,
    },
    pratica: { fila: FLASHCARDS.map((_, i) => i), virada: false, acertos: 0, vistas: 0, fim: false },
    relatos: [
      {
        id: "rel1",
        categoria: "Biblioteca",
        texto: 'Faltam exemplares de "Vidas Secas" para o 9º ano — só há 4 livros para 32 alunos.',
        status: "validado",
        criadoEm: agora - 20 * D,
      },
    ],
    compras: [
      { id: "c2", itemId: "pf3", custo: 160, criadoEm: agora - 15 * D },
      { id: "c1", itemId: "av1", custo: 150, criadoEm: agora - 28 * D },
    ],
    medalhas: [
      { id: "colaborador", desbloqueadaEm: agora - 40 * D },
      { id: "mestre-quimica", desbloqueadaEm: agora - 20 * D },
    ],
    desafiosConcluidos: [],
    lembretes: ["e2"],
    materiaisAbertos: [],
    espaco: "escola",
    conversas: criarConversas(agora),
  };
}

/** Atualiza um estado salvo por uma versão anterior sem perder o progresso. */
export function migrarEstado(dados: AppState): AppState | null {
  if (dados?.versao === VERSAO_ESTADO) return dados;
  if (dados?.versao === 1) return { ...dados, versao: VERSAO_ESTADO, conversas: criarConversas(Date.now()) };
  return null;
}
