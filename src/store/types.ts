import type { Disciplina } from "@/data/escola";

export type Papel = "aluno" | "professor" | "escola";

export interface Pessoa {
  id: string;
  nome: string;
  /** Iniciais exibidas no avatar (ex.: "R", "JN"). */
  iniciais: string;
  papel: Papel;
  turma?: string;
  disciplina?: Disciplina;
  /** XP total — define o nível exibido no card ("Estudante · Nível 3"). */
  xp?: number;
}

export type EspacoId = "escola" | "9A" | "robotica" | "bilingue";

export type TipoPost = "publicacao" | "duvida" | "material" | "aviso";

export interface Anexo {
  nome: string;
  paginas: number;
  tamanho: string;
}

export interface Resposta {
  id: string;
  autorId: string;
  texto: string;
  criadoEm: number;
  uteis: number;
  /** Marcada como útil pelo autor da dúvida. */
  util: boolean;
  /** Resposta oficial de professor — fica fixada no topo (US03). */
  oficial?: boolean;
}

export interface Denuncia {
  motivo: string;
  descricao: string;
  evidencia: boolean;
  categoriaIA: string;
  prioridade: "alta" | "média" | "baixa";
  criadoEm: number;
}

export interface Post {
  id: string;
  tipo: TipoPost;
  autorId: string;
  espaco: EspacoId;
  disciplina?: Disciplina;
  texto: string;
  tags: string[];
  anexo?: Anexo;
  criadoEm: number;
  curtidas: number;
  curtido: boolean;
  salvo: boolean;
  respostas: Resposta[];
  /** US06 — sinalizado pela triagem automática e aguardando revisão humana. */
  emRevisao?: boolean;
  denuncia?: Denuncia;
}

export type TipoMissao = "diaria" | "professor";

export interface Missao {
  id: string;
  tipo: TipoMissao;
  titulo: string;
  descricao: string;
  disciplina?: Disciplina;
  professorId?: string;
  /** Post do feed ligado à missão (direcionamento para a atividade). */
  postId?: string;
  alvo: number;
  progresso: number;
  pontos: number;
  xp: number;
  concluida: boolean;
}

export interface MissaoColetiva {
  titulo: string;
  descricao: string;
  alvo: number;
  progresso: number;
  pontosTotal: number;
  xp: number;
  participantes: string[];
  concluida: boolean;
}

export type StatusDia = "estudou" | "congelado" | "perdido" | "pendente" | "futuro";

export interface Sequencia {
  dias: number;
  /** Dias seguidos sem gastar congelador (medalha "Sem Congelador"). */
  diasSemCongelador: number;
  congeladores: number;
  congeladoresMax: number;
  estudouHoje: boolean;
  quebrada: boolean;
  /** Status de segunda (0) a domingo (6) da semana corrente. */
  semana: StatusDia[];
  hoje: number;
}

export interface Pratica {
  fila: number[];
  virada: boolean;
  acertos: number;
  vistas: number;
  fim: boolean;
}

export type StatusRelato = "em análise" | "validado";

export interface Relato {
  id: string;
  categoria: string;
  texto: string;
  status: StatusRelato;
  criadoEm: number;
}

export interface Compra {
  id: string;
  itemId: string;
  custo: number;
  criadoEm: number;
  /** Código para retirar recompensas físicas na secretaria. */
  voucher?: string;
}

export interface Usuario {
  id: string;
  nome: string;
  turma: string;
  xp: number;
  xpSemana: number;
  xpSemanaDisc: Partial<Record<Disciplina, number>>;
  pontos: number;
  respostasUteis: number;
  relatosValidados: number;
  dominio: Record<Disciplina, number>;
  ocultarRanking: boolean;
  equipados: string[];
}

export interface Medalha {
  id: string;
  desbloqueadaEm?: number;
}

export interface AppState {
  versao: number;
  criadoEm: number;
  usuario: Usuario;
  pessoas: Record<string, Pessoa>;
  posts: Post[];
  missoes: Missao[];
  coletiva: MissaoColetiva;
  sequencia: Sequencia;
  pratica: Pratica;
  relatos: Relato[];
  compras: Compra[];
  medalhas: Medalha[];
  desafiosConcluidos: Disciplina[];
  lembretes: string[];
  materiaisAbertos: string[];
  espaco: EspacoId;
}
