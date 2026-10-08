import type { Disciplina } from "@/data/escola";
import type { Flashcard } from "@/data/missoes";

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
  /** Arquivo real guardado no navegador (`lib/arquivos.ts`). Sem ele, o PDF é gerado do conteúdo. */
  arquivoId?: string;
  mime?: string;
  /** Miniatura (dataURL) de imagens. */
  previa?: string;
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
  /** Mensagem do chat de uma sala retida pela triagem: não aparece no feed; ao liberar, vira mensagem da sala. */
  origemSala?: { salaId: string; salaNome: string; mensagem: string };
  /** Sugestão do Portal: ids de posts parecidos (dúvidas resolvidas/materiais) achados ao publicar. */
  sugestoes?: string[];
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

/** Caixa de Leitner de uma carta: 1 (errou/nova) a 5 (dominada); `proxima` = quando volta a vencer. */
export interface CaixaLeitner {
  caixa: number;
  proxima: number;
}

/** Flashcards da aluna: cartas próprias, caixas de repetição espaçada e cartas erradas na última tentativa. */
export interface EstadoFlashcards {
  minhas: Flashcard[];
  caixas: Record<string, CaixaLeitner>;
  erradas: string[];
}

export interface Pratica {
  /** Posições (em `ids`) das cartas que faltam na rodada. */
  fila: number[];
  /** Cartas da rodada (ids de `FLASHCARDS` ou de cartas próprias). Sem isso, não há rodada em andamento. */
  ids?: string[];
  /** Escolha da rodada: uma disciplina, todas ou só as que errou. */
  escolha?: Disciplina | "Todas" | "Erradas";
  virada: boolean;
  acertos: number;
  vistas: number;
  fim: boolean;
}

export type StatusRelato = "em análise" | "validado" | "recusado";

export interface Relato {
  id: string;
  categoria: string;
  texto: string;
  status: StatusRelato;
  /** Quando e por quem a coordenação decidiu (validou ou recusou). */
  decididoEm?: number;
  decididoPor?: string;
  criadoEm: number;
}

export interface Compra {
  id: string;
  itemId: string;
  custo: number;
  criadoEm: number;
  /** Código para retirar recompensas físicas na secretaria. */
  voucher?: string;
  /** Quando a recompensa foi entregue à aluna (marcado pelo professor/secretaria). */
  entregueEm?: number;
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
  /**
   * Visibilidade nos rankings públicos:
   * - "publico": nome e avatar aparecem;
   * - "anonimo": aparece como "Aluno anônimo";
   * - "sombra": Modo Sombra — some de TODOS os rankings públicos; só o próprio aluno vê a posição.
   */
  privacidade: Privacidade;
  equipados: string[];
  /** Edição de perfil (todos opcionais). */
  arroba?: string;
  bio?: string;
  /** Foto recortada em JPEG (dataURL, ~256 px). */
  foto?: string;
  /** Nomes dos selos do CEPI exibidos no perfil (padrão: todos). */
  selosExibidos?: string[];
}

/** Lembrete de evento do calendário, com horário absoluto (sobrevive a recarregar). */
export interface LembreteAgendado {
  eventoId: string;
  titulo: string;
  /** Início do evento (timestamp). */
  inicio: number;
  /** Quando o lembrete deve disparar. */
  disparoEm: number;
  /** Já virou notificação. */
  disparado?: boolean;
}

export type Privacidade = "publico" | "anonimo" | "sombra";

export interface Medalha {
  id: string;
  desbloqueadaEm?: number;
}

/* ───────────── Sala de estudos (timer de foco e métricas) ───────────── */

export type ModoTimer = "pomodoro" | "profundo" | "livre";
export type FaseTimer = "foco" | "pausa";

/** Bloco de estudo concluído — base de todas as métricas de tempo. */
export interface SessaoEstudo {
  id: string;
  disciplina: Disciplina;
  /** Início (timestamp). */
  inicio: number;
  minutos: number;
  origem: "timer" | "sala" | "manual";
  salaId?: string;
}

/** Timer em andamento. O tempo decorrido é sempre calculado a partir de timestamps (sobrevive a recarregar a página). */
export interface TimerAtivo {
  disciplina: Disciplina;
  modo: ModoTimer;
  /** Duração do foco em minutos (0 = livre, sem limite). */
  focoMin: number;
  pausaMin: number;
  fase: FaseTimer;
  /** Quando a fase atual (re)começou a contar. */
  faseInicio: number;
  /** Tempo já acumulado na fase atual antes da última pausa manual. */
  acumuladoMs: number;
  pausado: boolean;
  /** Ciclos de foco concluídos nesta rodada. */
  ciclos: number;
  /** Minutos de foco já registrados nesta rodada (para o resumo final). */
  minutosRegistrados: number;
  /** Intenção do bloco ("Lista 7, itens a–d"). */
  meta?: string;
  salaId?: string;
  /**
   * Instante em que a aluna saiu da tela com o foco rodando (o timer fica congelado nele,
   * `pausado: true`). Some ao retomar; passou de 5 min fora, o foco é perdido.
   */
  saiuEm?: number;
}

/** Foco perdido por ficar mais de 5 min fora da tela — aguarda "Começar de novo". */
export interface FocoPerdido {
  /** Quando foi perdido (timestamp). */
  em: number;
  disciplina: Disciplina;
  modo: ModoTimer;
  focoMin: number;
  pausaMin: number;
  meta?: string;
  salaId?: string;
}

export interface EstadoEstudos {
  sessoes: SessaoEstudo[];
  timer: TimerAtivo | null;
  /** Último foco perdido ainda não dispensado (opcional: estados antigos não têm). */
  focoPerdido?: FocoPerdido | null;
  /** Meta diária de estudo em minutos. */
  metaDiariaMin: number;
}

/* ───────────── Salas de estudo coletivas ───────────── */

export type TemaSala = "esmeralda" | "oceano" | "ambar" | "rubi" | "noite";

export interface MensagemSala {
  id: string;
  autorId: string;
  texto: string;
  criadoEm: number;
  tipo: "mensagem" | "sistema" | "reacao";
}

export interface SalaEstudo {
  id: string;
  nome: string;
  descricao: string;
  /** Sem disciplina = sala livre (multidisciplinar). */
  disciplina?: Disciplina;
  criadorId: string;
  /** Criada por professor/coordenação. */
  oficial: boolean;
  privada: boolean;
  /** Código de convite das salas privadas. */
  codigo?: string;
  focoMin: number;
  pausaMin: number;
  /** Âncora do ciclo sincronizado: todos na sala estão na mesma fase (foco/pausa). */
  cicloInicio: number;
  /** Quem está na sala agora (presença simulada; não inclui a aluna). */
  membros: string[];
  capacidade: number;
  tema: TemaSala;
  mensagens: MensagemSala[];
  /** Minutos de foco somados pela sala hoje (prova social). */
  focoHojeMin: number;
  /** Sala agendada (ainda não aberta). */
  agendadaPara?: number;
  turma?: string;
  criadaEm: number;
}

/* ───────────── Campeonatos internos ───────────── */

export type FormatoCampeonato = "mata-mata" | "pontos-corridos" | "interclasses";
/** Como se pontua: duelos de quiz, minutos de foco ou XP ganho no período. */
export type MetricaCampeonato = "quiz" | "foco" | "xp";
export type StatusCampeonato = "inscricoes" | "andamento" | "encerrado";
export type CapaCampeonato = "ouro" | "esmeralda" | "oceano" | "rubi" | "noite";

/** Confronto do mata-mata. `a`/`b` são ids de alunos (null = a definir). */
export interface Partida {
  id: string;
  /** 0 = primeira rodada (ex.: quartas), sobe até a final. */
  rodada: number;
  a: string | null;
  b: string | null;
  placarA?: number;
  placarB?: number;
  vencedor?: string;
  status: "aguardando" | "disponivel" | "encerrada";
  /** Como foi decidido: duelo jogado (padrão) ou desempenho real (XP/domínio) no encerramento antecipado. */
  criterio?: "duelo" | "desempenho";
  /** Tempo total de resposta de cada lado (ms) — desempata placares iguais. */
  tempoA?: number;
  tempoB?: number;
}

export interface Campeonato {
  id: string;
  nome: string;
  descricao: string;
  formato: FormatoCampeonato;
  metrica: MetricaCampeonato;
  disciplina?: Disciplina;
  criadorId: string;
  oficial: boolean;
  status: StatusCampeonato;
  inicio: number;
  fim: number;
  premio: { pontos: number; xp: number; titulo?: string };
  /** Ids de alunos — ou nomes de turma no formato "interclasses". */
  participantes: string[];
  maxParticipantes: number;
  /** Só no mata-mata. */
  partidas: Partida[];
  /** Pontos corridos / interclasses: participante → pontuação. */
  placar: Record<string, number>;
  campeao?: string;
  capa: CapaCampeonato;
  /** Turmas que podem participar (vazio = toda a escola). */
  turmas: string[];
  criadoEm: number;
}

/* ───────────── Atividades do professor ───────────── */

export type TipoAtividade = "lista" | "quiz" | "leitura" | "entrega" | "projeto";
export type StatusEntrega = "pendente" | "entregue" | "corrigida";

export interface Entrega {
  alunoId: string;
  status: StatusEntrega;
  entregueEm?: number;
  resposta?: string;
  /** Arquivo real enviado pela aluna. */
  anexo?: Anexo;
  /** Nota de 0 a 10. */
  nota?: number;
  feedback?: string;
  pontos?: number;
  xp?: number;
}

export interface Atividade {
  id: string;
  titulo: string;
  descricao: string;
  tipo: TipoAtividade;
  disciplina: Disciplina;
  professorId: string;
  turma: string;
  criadaEm: number;
  prazo: number;
  /** Recompensa máxima (dada na correção, proporcional à nota). */
  pontos: number;
  xp: number;
  anexo?: Anexo;
  postId?: string;
  /** Uma entrega por aluno da turma. */
  entregas: Entrega[];
}

/* ───────────── Professor: turmas, bônus e moderação ───────────── */

/** Pontos/XP dados manualmente por um professor (histórico auditável). */
export interface Atribuicao {
  id: string;
  professorId: string;
  alunoId: string;
  pontos: number;
  xp: number;
  motivo: string;
  criadoEm: number;
  /** Veio da correção de uma atividade (a entrega já guarda pontos/XP: não contar duas vezes nos ganhos). */
  origem?: "correcao";
}

export type DecisaoModeracao = "aprovado" | "removido";

/** Registro persistido de uma decisão de moderação (quem, quando e por quê). */
export interface RegistroModeracao {
  id: string;
  postId: string;
  decisao: DecisaoModeracao;
  decididoPor: string;
  em: number;
  motivo?: string;
  autorId: string;
  /** Texto da publicação (a removida sai do feed; o histórico continua legível). */
  texto: string;
}

/* ───────────── Notificações ───────────── */

export type TipoNotificacao =
  | "pontos"
  | "atividade"
  | "correcao"
  | "entrega"
  | "campeonato"
  | "sala"
  | "moderacao"
  | "sistema";

export interface Notificacao {
  id: string;
  /** Destinatário (id da pessoa). */
  para: string;
  tipo: TipoNotificacao;
  titulo: string;
  texto?: string;
  href?: string;
  deId?: string;
  criadoEm: number;
  lida: boolean;
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
  /** Cartas próprias e caixas de repetição espaçada (opcional: padrão vazio). */
  flash?: EstadoFlashcards;
  relatos: Relato[];
  compras: Compra[];
  medalhas: Medalha[];
  desafiosConcluidos: Disciplina[];
  lembretes: string[];
  /** Lembretes com horário (opcional: estados antigos não têm). */
  lembretesAgendados?: LembreteAgendado[];
  materiaisAbertos: string[];
  espaco: EspacoId;

  /* v3 */
  estudos: EstadoEstudos;
  salas: SalaEstudo[];
  /** Sala coletiva em que a aluna está agora. */
  salaAtual: string | null;
  campeonatos: Campeonato[];
  atividades: Atividade[];
  atribuicoes: Atribuicao[];
  /** Bônus dados por professores a alunos que não são a aluna da demo (aparecem no painel e no ranking). */
  bonus: Record<string, { pontos: number; xp: number }>;
  notificacoes: Notificacao[];
  /** Decisões da moderação por post (US05/US06). */
  moderacao: Record<string, DecisaoModeracao>;
  /** Histórico completo das decisões de moderação (mais recente primeiro). */
  historicoModeracao?: RegistroModeracao[];
  /** Último lembrete do professor por aluno (id → timestamp). */
  lembradoEm?: Record<string, number>;
}
