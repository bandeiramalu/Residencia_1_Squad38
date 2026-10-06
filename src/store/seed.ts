import { criarAtividades, criarNotificacoes } from "@/data/atividades";
import { criarCampeonatos } from "@/data/campeonatos";
import { META_DIARIA_PADRAO, criarHistoricoEstudos } from "@/data/estudos";
import { COLETIVA, FLASHCARDS, MISSOES } from "@/data/missoes";
import { PESSOAS } from "@/data/pessoas";
import { criarPosts } from "@/data/posts";
import { criarSalas } from "@/data/salas";
import { PESSOAS_GERADAS } from "@/data/turmas";
import { USUARIO_INICIAL } from "@/data/usuario";
import { diaDaSemana } from "@/lib/tempo";
import type { AppState, StatusDia } from "./types";

export const VERSAO_ESTADO = 4;
const D = 24 * 60 * 60 * 1000;

/** Partes do estado criadas na v3 (sala de estudos, salas, campeonatos, atividades, professor). */
function estadoV3(agora: number): Pick<
  AppState,
  "estudos" | "salas" | "salaAtual" | "campeonatos" | "atividades" | "atribuicoes" | "bonus" | "notificacoes" | "moderacao"
> {
  return {
    estudos: { sessoes: criarHistoricoEstudos(agora), timer: null, metaDiariaMin: META_DIARIA_PADRAO },
    salas: criarSalas(agora),
    salaAtual: null,
    campeonatos: criarCampeonatos(agora),
    atividades: criarAtividades(agora),
    atribuicoes: [
      { id: "at0", professorId: "prof_ricardo", alunoId: "ana", pontos: 40, xp: 0, motivo: "Ajudou a turma na revisão de funções", criadoEm: agora - 6 * D },
    ],
    bonus: {},
    notificacoes: criarNotificacoes(agora),
    moderacao: {},
  };
}

function pessoasIniciais() {
  return Object.fromEntries([...PESSOAS, ...PESSOAS_GERADAS].map((p) => [p.id, p]));
}

export function criarEstadoInicial(agora: number): AppState {
  const hoje = diaDaSemana(agora);
  const semana: StatusDia[] = Array.from({ length: 7 }, (_, i) => (i < hoje ? "estudou" : i === hoje ? "pendente" : "futuro"));

  return {
    versao: VERSAO_ESTADO,
    criadoEm: agora,
    usuario: structuredClone(USUARIO_INICIAL),
    pessoas: pessoasIniciais(),
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
    ...estadoV3(agora),
  };
}

type EstadoAntigo = Omit<AppState, "usuario"> & { usuario: AppState["usuario"] & { ocultarRanking?: boolean }; conversas?: unknown };

/** Atualiza um estado salvo por uma versão anterior sem perder o progresso. */
export function migrarEstado(dados: EstadoAntigo): AppState | null {
  if (dados?.versao === VERSAO_ESTADO) return dados as AppState;
  // v3 → v4: mensagens privadas saíram do app (descarta `conversas` e notificações desse tipo).
  if (dados?.versao === 3) {
    const resto = { ...dados };
    delete resto.conversas;
    return {
      ...(resto as AppState),
      versao: VERSAO_ESTADO,
      notificacoes: resto.notificacoes.filter((n) => (n.tipo as string) !== "mensagem"),
    };
  }
  if (dados?.versao !== 1 && dados?.versao !== 2) return null;

  const agora = Date.now();
  const { ocultarRanking, ...usuario } = dados.usuario;
  const base = criarEstadoInicial(agora);
  const semConversas = { ...dados };
  delete semConversas.conversas;
  return {
    ...(semConversas as AppState),
    ...estadoV3(agora),
    versao: VERSAO_ESTADO,
    usuario: { ...usuario, privacidade: ocultarRanking ? "anonimo" : "publico" },
    pessoas: { ...base.pessoas, ...dados.pessoas },
    posts: [...dados.posts, ...base.posts.filter((p) => p.emRevisao && !dados.posts.some((q) => q.id === p.id))],
    // As missões do professor viraram Atividades; entra a missão diária de foco.
    missoes: [...dados.missoes.filter((m) => m.tipo === "diaria"), ...base.missoes.filter((m) => !dados.missoes.some((d) => d.id === m.id))],
  };
}
