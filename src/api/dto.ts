/**
 * DTOs da API — o formato dos dados que trafegam entre o front e o backend.
 *
 * Regra: sempre que possível a API devolve os MESMOS tipos do estado do app (`src/store/types.ts`),
 * para o front usar a resposta sem conversão. Aqui ficam só os formatos que diferem:
 * corpos de requisição (o cliente nunca manda campos calculados pelo servidor, como pontos, XP,
 * voucher ou triagem da IA), respostas agregadas e parâmetros de consulta.
 *
 * Espelho em OpenAPI: docs/api/openapi.yaml (components/schemas).
 */
import type { TipoEvento } from "@/data/calendario";
import type { Disciplina } from "@/data/escola";
import type { Flashcard } from "@/data/missoes";
import type { ItemLoja } from "@/data/loja";
import type { LigaId } from "@/data/ranking";
import type { PapelSessao } from "@/lib/auth";
import type { EscopoFoco } from "@/lib/estudos";
import type { Escopo, Tendencia } from "@/lib/gamificacao";
import type { AlunoPainel, ResumoTurma } from "@/lib/turmas";
import type { NovaAtividade } from "@/store/acoes/atividades";
import type { NovoCampeonato, ResultadoDuelo } from "@/store/acoes/campeonatos";
import type { NovaSala } from "@/store/acoes/salas";
import type {
  Anexo,
  AppState,
  Atividade,
  Campeonato,
  Compra,
  DecisaoModeracao,
  Denuncia,
  EstadoFlashcards,
  EspacoId,
  Medalha,
  MensagemSala,
  Missao,
  MissaoColetiva,
  Pessoa,
  Post,
  Pratica,
  Privacidade,
  SessaoEstudo,
  StatusCampeonato,
  StatusEntrega,
  StatusRelato,
  TipoPost,
} from "@/store/types";

/* ───────────── Comuns ───────────── */

/** Códigos de erro conhecidos. O front pode mostrar mensagens específicas para cada um. */
export type CodigoErro =
  | "nao_autenticado"
  | "sessao_expirada"
  | "sem_permissao"
  | "nao_encontrado"
  | "validacao"
  | "conflito"
  | "ja_processado"
  | "saldo_insuficiente"
  | "limite_diario"
  | "prazo_encerrado"
  | "fora_da_turma"
  | "muitas_requisicoes"
  | "erro_interno";

/** Corpo de TODA resposta de erro (4xx/5xx). */
export interface ErroDTO {
  codigo: CodigoErro;
  mensagem: string;
  /** Erros de validação por campo: `{ texto: "Mínimo de 3 caracteres" }`. */
  campos?: Record<string, string>;
}

/** Lista paginada por cursor (mais estável que página/offset num feed que muda o tempo todo). */
export interface Pagina<T> {
  itens: T[];
  /** Passe em `?cursor=` para buscar a próxima página; `null` = acabou. */
  proximoCursor: string | null;
}

export interface QueryPagina {
  cursor?: string;
  /** Padrão 20, máximo 50. */
  limite?: number;
}

/* ───────────── Autenticação ───────────── */

export interface LoginCorpo {
  email: string;
  senha: string;
}

export interface UsuarioSessaoDTO {
  id: string;
  nome: string;
  papel: PapelSessao;
  email: string;
  /** Aluno: turma atual. */
  turma?: string;
  /** Professor: disciplina e turmas em que leciona. */
  disciplina?: Disciplina;
  turmas?: string[];
  /** Professor com poderes de coordenação (moderação da escola inteira, ouvidoria). */
  coordenacao?: boolean;
}

export interface LoginResposta {
  /** JWT de acesso (curto, ~15 min). O refresh token vai SÓ no cookie httpOnly. */
  token: string;
  expiraEm: number;
  usuario: UsuarioSessaoDTO;
}

export interface RecuperarSenhaCorpo {
  email: string;
}

/** Ticket de uso único para abrir o WebSocket sem expor o JWT na URL. */
export interface TicketTempoRealDTO {
  ticket: string;
  expiraEm: number;
}

/* ───────────── Perfil ───────────── */

/**
 * Tudo que o app precisa ao abrir, num único GET — substitui o `criarEstadoInicial()` do modo local.
 * `pessoas` traz só quem aparece para este usuário (colegas, professores): minimização (LGPD).
 */
export type BootstrapDTO = Pick<
  AppState,
  | "usuario"
  | "pessoas"
  | "posts"
  | "missoes"
  | "coletiva"
  | "sequencia"
  | "pratica"
  | "relatos"
  | "compras"
  | "medalhas"
  | "desafiosConcluidos"
  | "lembretes"
  | "materiaisAbertos"
  | "estudos"
  | "salas"
  | "salaAtual"
  | "campeonatos"
  | "atividades"
  | "notificacoes"
> & {
  /** Relógio do servidor (ms) — o front corrige a diferença de horário do aparelho. */
  servidorEm: number;
  /** Só para professores. */
  professor?: Pick<AppState, "atribuicoes" | "moderacao">;
};

export interface PrivacidadeCorpo {
  nivel: Privacidade;
}

/** Perfil público de outra pessoa: sem e-mail, sem dados sensíveis. */
export type PessoaPublicaDTO = Pessoa & { equipados?: string[] };

export interface QueryPessoas {
  busca?: string;
  turma?: string;
  papel?: Pessoa["papel"];
  limite?: number;
}

export interface EventoCalendarioDTO {
  id: string;
  titulo: string;
  tipo: TipoEvento;
  disciplina?: Disciplina;
  /** Data e hora de início (ms). */
  inicio: number;
  local?: string;
  /** O usuário ativou lembrete. */
  lembrete: boolean;
}

export interface QueryPeriodo {
  /** Início do período (ms). */
  de?: number;
  /** Fim do período (ms). */
  ate?: number;
}

/* ───────────── Feed ───────────── */

export interface QueryPosts extends QueryPagina {
  espaco?: EspacoId;
  tipo?: TipoPost;
  autorId?: string;
  disciplina?: Disciplina;
}

/** Nova publicação. O servidor roda a triagem (US06) e pode devolver o post com `emRevisao: true`. */
export interface NovoPostCorpo {
  /** Id gerado no cliente (ver "IDs gerados no cliente" em docs/BACKEND.md). */
  id: string;
  tipo: Exclude<TipoPost, "aviso">;
  espaco: EspacoId;
  disciplina?: Disciplina;
  texto: string;
  tags: string[];
  /** Arquivo enviado antes em POST /anexos (materiais). */
  anexoId?: string;
}

export interface NovaRespostaCorpo {
  id: string;
  texto: string;
}

export interface CurtidaDTO {
  curtido: boolean;
  curtidas: number;
}

/** Denúncia (US05). O motivo é um de `MOTIVOS_DENUNCIA`; a categoria/prioridade é da triagem no servidor. */
export type DenunciaCorpo = Pick<Denuncia, "motivo" | "descricao" | "evidencia">;

export type DenunciaRecebidaDTO = Pick<Denuncia, "categoriaIA" | "prioridade"> & { protocolo: string };

export interface QueryBusca {
  q: string;
  tipo?: TipoPost;
  limite?: number;
}

/** Busca semântica (US03): o post e os conceitos que casaram. */
export interface ResultadoBuscaDTO {
  post: Post;
  relevancia: number;
  conceitos: string[];
}

export interface AnexoDTO extends Anexo {
  id: string;
  /** URL assinada e temporária para download. */
  url: string;
  mime: string;
}

export interface AvisoCorpo {
  id: string;
  texto: string;
  espaco: EspacoId;
}

export interface QueryMensagens {
  /** Id da mensagem mais antiga já carregada (rolagem para cima). */
  antes?: string;
  limite?: number;
}

/* ───────────── Missões, sequência, prática, desafios, relatos ───────────── */

export interface MissoesDTO {
  missoes: Missao[];
  coletiva: MissaoColetiva;
}

export interface ProgressoMissaoCorpo {
  delta: number;
}

/** "Reivindicação": o servidor só conta flashcards realmente respondidos e ainda não contabilizados. */
export interface ContribuicaoColetivaCorpo {
  quantidade: number;
}

export interface FlashcardDTO {
  pergunta: string;
  resposta: string;
}

export interface PraticaDTO {
  cartas: FlashcardDTO[];
  estado: Pratica;
}

export interface RespostaCartaCorpo {
  acertou: boolean;
}

/** Questão SEM gabarito — o índice da opção correta nunca sai do servidor antes da resposta. */
export interface QuestaoPublicaDTO {
  id: string;
  enunciado: string;
  opcoes: string[];
}

export interface DesafioDTO {
  tentativaId: string;
  disciplina: Disciplina;
  tema: string;
  questoes: QuestaoPublicaDTO[];
  expiraEm: number;
}

export interface RespostasDesafioCorpo {
  tentativaId: string;
  /** Índice da opção escolhida em cada questão (null = pulou). */
  respostas: (number | null)[];
}

export interface ResultadoDesafioDTO {
  acertos: number;
  total: number;
  pontos: number;
  xp: number;
  /** Novo domínio da disciplina (0–100). */
  dominio: number;
  gabarito: { questaoId: string; correta: number; explicacao: string }[];
}

export interface NovoRelatoCorpo {
  id: string;
  categoria: string;
  texto: string;
}

/* ───────────── Loja ───────────── */

export type ItemLojaDTO = ItemLoja;

/** O cliente só diz O QUE quer comprar; preço, saldo e voucher são do servidor. */
export interface CompraCorpo {
  id: string;
  itemId: string;
}

export interface CompraDTO {
  compra: Compra;
  /** Saldo de pontos depois da compra. */
  saldo: number;
}

/* ───────────── Ranking ───────────── */

export interface QueryRankingLiga {
  escopo: Escopo;
  /** Obrigatório quando `escopo=disciplina`. */
  disciplina?: Disciplina;
}

/**
 * Linha de ranking PÚBLICO. Anônimos chegam como "Aluno anônimo" com id opaco (`anon_…`, trocado a
 * cada semana) — o id e o nome reais nunca saem do servidor. Quem está no Modo Sombra não aparece.
 */
export interface LinhaRankingDTO {
  id: string;
  nome: string;
  iniciais: string;
  turma: string;
  xp: number;
  posicao: number;
  variacao: number;
  tendencia: Tendencia;
  eu: boolean;
  anonimo: boolean;
  zona?: "promocao" | "rebaixamento";
  equipados?: string[];
}

export interface RankingLigaDTO {
  liga: LigaId;
  linhas: LinhaRankingDTO[];
  /** Fechamento semanal (domingo 23:59, America/Maceio). */
  fechamentoEm: number;
  /** Posição do próprio usuário — calculada mesmo no Modo Sombra (só ele recebe). */
  minhaPosicao: number;
  meuXp: number;
  sombra: boolean;
  total: number;
}

export interface QueryRankingFoco {
  escopo: EscopoFoco;
}

export interface LinhaFocoDTO {
  id: string;
  nome: string;
  turma: string;
  minutos: number;
  posicao: number;
  eu: boolean;
  anonimo: boolean;
}

export interface RankingFocoDTO {
  linhas: LinhaFocoDTO[];
  minhaPosicao: number;
  meusMinutos: number;
  total: number;
  sombra: boolean;
}

/* ───────────── Estudos ───────────── */

/** Bloco de estudo. O servidor aplica mínimo, teto diário e anti-sobreposição (ver regras em docs/BACKEND.md). */
export type NovaSessaoCorpo = Pick<SessaoEstudo, "id" | "disciplina" | "inicio" | "minutos" | "origem" | "salaId">;

export interface SessaoRegistradaDTO {
  sessao: SessaoEstudo;
  /** Minutos que valeram pontos (pode ser menor que os enviados por causa do teto diário). */
  minutosComPontos: number;
  pontos: number;
  tetoDiarioAtingido: boolean;
}

export interface MetaDiariaCorpo {
  /** 15 a 480, múltiplo de 5. */
  minutos: number;
}

/* ───────────── Salas ───────────── */

export type NovaSalaCorpo = NovaSala & { id: string };

export interface QuerySalas {
  disciplina?: Disciplina;
  turma?: string;
  /** Inclui salas agendadas que ainda não abriram. */
  agendadas?: boolean;
}

export interface MensagemSalaCorpo {
  id: string;
  texto: string;
  /** Mensagens de sistema ("fulano entrou") são geradas só pelo servidor. */
  tipo: Exclude<MensagemSala["tipo"], "sistema">;
}

/* ───────────── Campeonatos ───────────── */

export type NovoCampeonatoCorpo = NovoCampeonato & { id: string };

export type EdicaoCampeonatoCorpo = Partial<
  Pick<Campeonato, "nome" | "descricao" | "inicio" | "fim" | "maxParticipantes" | "capa" | "turmas" | "premio">
>;

export interface QueryCampeonatos {
  status?: StatusCampeonato;
}

/** Pergunta de quiz sorteada pelo servidor (sem gabarito). */
export interface PerguntaQuizDTO {
  id: string;
  enunciado: string;
  opcoes: string[];
  disciplina?: Disciplina;
}

/** Duelo (mata-mata) ou rodada (pontos corridos) aberto no servidor. */
export interface QuizAbertoDTO {
  /** Id do duelo/rodada — vai de volta junto com as respostas. */
  id: string;
  perguntas: PerguntaQuizDTO[];
  segundosPorPergunta: number;
  /** Depois disso as respostas são recusadas (`prazo_encerrado`). */
  expiraEm: number;
}

export interface RespostaQuizDTO {
  perguntaId: string;
  /** Índice escolhido; null = tempo esgotado. */
  opcao: number | null;
}

export interface RespostasQuizCorpo {
  id: string;
  respostas: RespostaQuizDTO[];
}

export interface GabaritoQuizDTO {
  perguntaId: string;
  correta: number;
}

export type ResultadoDueloDTO = ResultadoDuelo & {
  campeonato: Campeonato;
  gabarito: GabaritoQuizDTO[];
  pontos: number;
  xp: number;
  /** O adversário ainda não jogou: o placar final chega por `campeonato.atualizado`. */
  aguardandoAdversario: boolean;
};

export interface ResultadoRodadaDTO {
  acertos: number;
  total: number;
  posicao: number;
  campeonato: Campeonato;
  gabarito: GabaritoQuizDTO[];
  pontos: number;
  xp: number;
}

/* ───────────── Atividades ───────────── */

export type NovaAtividadeCorpo = NovaAtividade & { id: string; anexoId?: string };

export type EdicaoAtividadeCorpo = Partial<Pick<Atividade, "titulo" | "descricao" | "prazo" | "pontos" | "xp">>;

export interface QueryAtividades {
  turma?: string;
  disciplina?: Disciplina;
  status?: StatusEntrega;
}

export interface EntregaCorpo {
  resposta?: string;
  anexoId?: string;
}

/** Só a nota e o comentário: pontos e XP são calculados no servidor, proporcionais à nota. */
export interface CorrecaoCorpo {
  /** 0 a 10, uma casa decimal. */
  nota: number;
  feedback?: string;
}

export interface CorrecaoEmLoteDTO {
  corrigidas: number;
}

export interface LembreteEnviadoDTO {
  avisados: number;
}

/* ───────────── Professor ───────────── */

export interface TurmaDTO {
  nome: string;
  totalAlunos: number;
  resumo: ResumoTurma;
}

/** Aluno com métricas de engajamento (painel do professor). */
export type AlunoPainelDTO = AlunoPainel;

export interface AlunoDetalheDTO extends AlunoPainelDTO {
  sessoesRecentes: SessaoEstudo[];
  atividades: { atividadeId: string; titulo: string; status: StatusEntrega; nota?: number }[];
}

/** Pontos/XP manuais. Cada aluno ganha um registro com id próprio (gerado no cliente). */
export interface AtribuicaoCorpo {
  itens: { id: string; alunoId: string }[];
  pontos: number;
  xp: number;
  motivo: string;
}

export interface QueryAtribuicoes extends QueryPagina {
  turma?: string;
  alunoId?: string;
}

/* ───────────── Moderação ───────────── */

export interface ItemModeracaoDTO {
  /** "post" (feed) ou "mensagem_sala" (mensagem do chat de uma sala retida pela triagem). */
  tipo?: "post" | "mensagem_sala";
  /** Presente quando `tipo` é "post" (ou omitido). */
  post?: Post;
  /** Presente quando `tipo` é "mensagem_sala". */
  mensagem?: MensagemSala;
  salaId?: string;
  /** "triagem" = sinalizado automaticamente (US06); "denuncia" = um usuário denunciou (US05). */
  origem: "triagem" | "denuncia";
  motivo: string;
  prioridade: Denuncia["prioridade"];
  denuncias: number;
  criadoEm: number;
}

export interface DecisaoCorpo {
  decisao: DecisaoModeracao;
  /** Motivo da decisão. Obrigatório quando "removido": vai para a auditoria, para o histórico e para o autor. */
  observacao?: string;
}

/** Linha do histórico de moderação (derivada da auditoria das decisões; posts e mensagens de sala). */
export interface RegistroModeracaoDTO {
  id: string;
  tipo: "post" | "mensagem_sala";
  /** Id do post ou da mensagem decidida. */
  alvoId: string;
  decisao: DecisaoModeracao;
  decididoPor: string;
  em: number;
  motivo?: string;
  autorId: string;
  /** Texto do conteúdo (o removido sai do feed, o histórico continua legível). */
  texto: string;
}

export interface ValidacaoRelatoCorpo {
  status: StatusRelato;
  resposta?: string;
}

/* ───────────── Perfil: extras ───────────── */

export type MedalhaDTO = Medalha & { progresso: number; meta: number };

/* ───────────── Perfil editável, loja (entrega), lembretes ───────────── */

/** `PUT /me`: o que a pessoa edita no perfil. `foto` é um JPEG recortado (~256 px) em dataURL (até ~80 KB); `null` remove. */
export interface EditarPerfilCorpo {
  nome: string;
  iniciais?: string;
  /** Sem o "@", 3–24 caracteres [a-z0-9._], único (409 se já existe). */
  arroba?: string;
  /** Até 160 caracteres. */
  bio?: string;
  foto?: string | null;
  selosExibidos?: string[];
}

/** `PUT /me/lembretes-agendados`: o servidor substitui a lista e dispara a notificação em `disparoEm` (nunca o cliente). */
export interface LembretesAgendadosCorpo {
  itens: { eventoId: string; disparoEm: number }[];
}

/** `POST /professor/lembretes`: avisa alunos que estão sem estudar. O servidor aplica a trava de 12 h por aluno. */
export interface LembrarAlunosCorpo {
  alunoIds: string[];
  /** Instante em que o professor decidiu (auditoria). */
  em: number;
}

/* ───────────── Flashcards próprios e Leitner ───────────── */

/** `PUT /me/flashcards/{id}`: cria ou edita uma carta própria (id gerado no cliente). */
export interface CartaPropriaCorpo {
  disciplina: Disciplina;
  pergunta: string;
  resposta: string;
}

/** `POST /pratica/rodadas`: começa uma rodada com as cartas escolhidas (o servidor confere que existem e vencem hoje). */
export interface NovaRodadaCorpo {
  escolha: "Todas" | "Erradas" | Disciplina;
  ids: string[];
}

/** `GET /me/flashcards`: cartas próprias + caixas de Leitner (1–5) + cartas erradas na última rodada. */
export type FlashcardsDTO = EstadoFlashcards & { minhas: Flashcard[] };

/* ───────────── Estatísticas (agregadas no servidor) ───────────── */

export type PeriodoEstatisticas = "7" | "30" | "60" | "bim";

export interface QueryEstatisticas {
  periodo?: PeriodoEstatisticas;
  disciplina?: Disciplina;
  /** Só professor: uma das suas turmas. */
  turma?: string;
}

export interface PontoDiaDTO {
  /** AAAA-MM-DD no fuso America/Maceio. */
  dia: string;
  minutos: number;
  pontos?: number;
  xp?: number;
}

/** `GET /me/estatisticas`: tudo que a tela da aluna e o relatório PDF/CSV mostram. */
export interface EstatisticasAlunoDTO {
  periodo: PeriodoEstatisticas;
  minutosTotal: number;
  metaDiariaMin: number;
  diasComEstudo: number;
  porDia: PontoDiaDTO[];
  porDisciplina: { disciplina: Disciplina; minutos: number }[];
  /** 24 posições: minutos estudados em cada hora do dia. */
  porHora: number[];
  /** Semanas × 7 dias (mapa de calor). */
  mapa: { dia: string; minutos: number }[][];
  sequencia: { atual: number; melhor: number };
  notas: { atividadeId: string; titulo: string; disciplina: Disciplina; nota: number; em: number }[];
  mediaNotas: number | null;
  duelos: { jogados: number; vitorias: number };
  concluidasPorSemana: { semana: string; quantidade: number }[];
  medalhas: { conquistadas: number; total: number };
}

/** `GET /professor/estatisticas`: agregados da turma (só turmas do professor); os alunos em risco usam os mesmos critérios do painel. */
export interface EstatisticasProfessorDTO {
  periodo: PeriodoEstatisticas;
  turma: string;
  totalAlunos: number;
  engajamento: { ativos: number; minutosTotal: number; serie: PontoDiaDTO[]; mapa: { dia: string; minutos: number }[][] };
  foco: { porHora: number[]; porDisciplina: { disciplina: Disciplina; minutos: number }[] };
  desempenho: { mediaNotas: number | null; entregasNoPrazo: number; entregasAtrasadas: number; pendentes: number };
  missoes: { concluidas: number; taxa: number };
  ranking: { alunoId: string; nome: string; xpSemana: number }[];
  campeonatos: { ativos: number; participantes: number };
  moderacao: { pendentes: number; decididas: number; removidas: number };
  risco: { alunoId: string; nome: string; motivo: string; diasSemEstudo: number }[];
}
