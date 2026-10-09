/**
 * Catálogo tipado de TODOS os endpoints REST do Portal (espelho de docs/api/openapi.yaml).
 *
 * Cada entrada diz o método, o caminho (com `{params}`), quem pode chamar e — só para o TypeScript —
 * o tipo do corpo, da resposta e da query. Assim uma chamada errada não compila:
 *
 *   const post = await chamar(ENDPOINTS.feed.obter, { params: { id: "p1" } });          // post: Post
 *   await chamar(ENDPOINTS.feed.responder, { params: { id: "p1" }, corpo: { id, texto } });
 *   const r = await chamar(ENDPOINTS.ranking.liga, { query: { escopo: "turma" } });    // r: RankingLigaDTO
 *
 * O `sync.ts` usa `preparar()` (mesma checagem, sem enviar) para montar a fila de saída.
 */
import type {
  Atividade,
  Atribuicao,
  Campeonato,
  Compra,
  Entrega,
  MensagemSala,
  Missao,
  MissaoColetiva,
  Notificacao,
  Post,
  Pratica,
  Relato,
  Resposta,
  SalaEstudo,
  Sequencia,
  SessaoEstudo,
  TimerAtivo,
  Usuario,
} from "@/store/types";
import { api, type Metodo } from "./client";
import type {
  AlunoDetalheDTO,
  AlunoPainelDTO,
  AnexoDTO,
  AtribuicaoCorpo,
  AvisoCorpo,
  BootstrapDTO,
  CartaPropriaCorpo,
  CompraCorpo,
  CompraDTO,
  ContestacaoCorpo,
  ContribuicaoColetivaCorpo,
  CorrecaoCorpo,
  CorrecaoEmLoteDTO,
  CurtidaDTO,
  DecisaoCorpo,
  DenunciaCorpo,
  DenunciaRecebidaDTO,
  DesafioDTO,
  EdicaoAtividadeCorpo,
  EdicaoCampeonatoCorpo,
  EditarPerfilCorpo,
  EntregaCorpo,
  EstatisticasAlunoDTO,
  EstatisticasProfessorDTO,
  EventoCalendarioDTO,
  FlashcardsDTO,
  ItemLojaDTO,
  ItemModeracaoDTO,
  LembrarAlunosCorpo,
  LembreteEnviadoDTO,
  LembretesAgendadosCorpo,
  LoginCorpo,
  LoginResposta,
  MedalhaDTO,
  MensagemSalaCorpo,
  MensagemSalaRetidaDTO,
  MetaDiariaCorpo,
  MissoesDTO,
  NovaAtividadeCorpo,
  NovaRodadaCorpo,
  NovaRespostaCorpo,
  NovaSalaCorpo,
  NovaSessaoCorpo,
  NovoCampeonatoCorpo,
  NovoPostCorpo,
  NovoRelatoCorpo,
  Pagina,
  PessoaPublicaDTO,
  PraticaDTO,
  PrivacidadeCorpo,
  ProgressoMissaoCorpo,
  QueryAtividades,
  QueryAtribuicoes,
  QueryBusca,
  QueryCampeonatos,
  QueryEstatisticas,
  QueryMensagens,
  QueryPagina,
  QueryPeriodo,
  QueryPessoas,
  QueryPosts,
  QueryRankingFoco,
  QueryRankingLiga,
  QuerySalas,
  QuizAbertoDTO,
  RankingFocoDTO,
  RankingLigaDTO,
  RecuperarSenhaCorpo,
  RegistroModeracaoDTO,
  RespostaCartaCorpo,
  RespostasDesafioCorpo,
  RespostasQuizCorpo,
  ResultadoBuscaDTO,
  ResultadoDesafioDTO,
  ResultadoDueloDTO,
  ResultadoRodadaDTO,
  SessaoRegistradaDTO,
  TicketTempoRealDTO,
  TurmaDTO,
  UsuarioSessaoDTO,
  UtilProfessorCorpo,
  ValidacaoRelatoCorpo,
} from "./dto";

/**
 * Quem pode chamar. O backend SEMPRE confere no servidor (o front só esconde botões):
 * - "logado": qualquer papel; "aluno"/"professor": só esse papel;
 * - "coordenacao": professor com a flag de coordenação.
 * Regras finas (ex.: "só o autor", "só nas turmas do professor") estão no `resumo` e em docs/BACKEND.md.
 */
export type Acesso = "publico" | "logado" | "aluno" | "professor" | "coordenacao";

export interface Endpoint<C extends string = string, Corpo = unknown, Resposta = unknown, Query = unknown> {
  readonly metodo: Metodo;
  readonly caminho: C;
  readonly acesso: Acesso;
  readonly resumo: string;
  /** Só para o TypeScript (tipos "fantasmas"): nunca existe em tempo de execução. */
  readonly __tipos?: { corpo: Corpo; resposta: Resposta; query: Query };
}

/** `"/posts/{id}/respostas/{respostaId}"` → `"id" | "respostaId"`. */
type NomesParams<S extends string> = S extends `${string}{${infer P}}${infer R}` ? P | NomesParams<R> : never;
export type ParamsDe<S extends string> = { [K in NomesParams<S>]: string };

export type CorpoDe<E> = E extends Endpoint<string, infer B, unknown, unknown> ? B : never;
export type RespostaDe<E> = E extends Endpoint<string, unknown, infer R, unknown> ? R : never;
export type QueryDe<E> = E extends Endpoint<string, unknown, unknown, infer Q> ? Q : never;

type ParteParams<C extends string> = [NomesParams<C>] extends [never] ? { params?: undefined } : { params: ParamsDe<C> };
type ParteCorpo<B> = [B] extends [undefined] ? { corpo?: undefined } : { corpo: B };
type PartePesquisa<Q> = Partial<Q> extends Q ? { query?: Q } : { query: Q };

export type OpcoesDe<E> =
  E extends Endpoint<infer C extends string, infer B, unknown, infer Q> ? ParteParams<C> & ParteCorpo<B> & PartePesquisa<Q> : never;

interface Extras {
  sinal?: AbortSignal;
  /** Header `Idempotency-Key` (reenvios seguros de POST). */
  idempotencia?: string;
}

/** O objeto de opções só é obrigatório quando o endpoint exige params, corpo ou query. */
export type ArgsDe<E> = Partial<OpcoesDe<E>> extends OpcoesDe<E> ? [opcoes?: OpcoesDe<E> & Extras] : [opcoes: OpcoesDe<E> & Extras];

interface OpcoesSoltas extends Extras {
  params?: Record<string, string>;
  corpo?: unknown;
  query?: object;
}

function def<Corpo = undefined, Resposta = void, Query = undefined>() {
  return <C extends string>(metodo: Metodo, caminho: C, acesso: Acesso, resumo: string): Endpoint<C, Corpo, Resposta, Query> => ({
    metodo,
    caminho,
    acesso,
    resumo,
  });
}

export const ENDPOINTS = {
  auth: {
    login: def<LoginCorpo, LoginResposta>()("POST", "/auth/login", "publico", "Entra com e-mail e senha. Devolve o JWT de acesso e grava o refresh token em cookie httpOnly."),
    renovar: def<undefined, LoginResposta>()("POST", "/auth/renovar", "publico", "Troca o refresh token (cookie httpOnly) por um novo JWT de acesso."),
    sair: def()("POST", "/auth/sair", "logado", "Revoga o refresh token e apaga os cookies."),
    eu: def<undefined, UsuarioSessaoDTO>()("GET", "/auth/eu", "logado", "Quem está logado (usado para reabrir a sessão)."),
    recuperarSenha: def<RecuperarSenhaCorpo>()("POST", "/auth/recuperar-senha", "publico", "Envia o link de nova senha. Sempre responde 204 (não revela se o e-mail existe)."),
    ticketTempoReal: def<undefined, TicketTempoRealDTO>()("POST", "/auth/ticket-tempo-real", "logado", "Ticket de uso único (30 s) para autenticar o WebSocket."),
  },

  perfil: {
    bootstrap: def<undefined, BootstrapDTO>()("GET", "/me/bootstrap", "logado", "Estado inicial do app para quem está logado (substitui o seed do modo local)."),
    obter: def<undefined, Usuario>()("GET", "/me", "logado", "Perfil, saldo de pontos, XP, domínio e privacidade."),
    editar: def<EditarPerfilCorpo, Usuario>()("PUT", "/me", "logado", "Edita nome, @, bio, foto (dataURL JPEG ~256 px) e selos exibidos. Nome e iniciais valem para todo o portal."),
    estatisticas: def<undefined, EstatisticasAlunoDTO, QueryEstatisticas>()("GET", "/me/estatisticas", "aluno", "Estatísticas da aluna no período (foco, evolução, notas, duelos, medalhas); base da tela e do relatório PDF/CSV."),
    definirPrivacidade: def<PrivacidadeCorpo>()("PUT", "/me/privacidade", "aluno", "Público, anônimo ou Modo Sombra nos rankings."),
    equipar: def()("PUT", "/me/equipados/{itemId}", "aluno", "Equipa um item comprado (troca o do mesmo slot)."),
    desequipar: def()("DELETE", "/me/equipados/{itemId}", "aluno", "Remove um item do perfil."),
    medalhas: def<undefined, MedalhaDTO[]>()("GET", "/me/medalhas", "aluno", "Medalhas conquistadas e progresso das demais."),
    pessoas: def<undefined, PessoaPublicaDTO[], QueryPessoas>()("GET", "/pessoas", "logado", "Contatos visíveis para quem pergunta (colegas de turma, professores, coordenação)."),
    pessoa: def<undefined, PessoaPublicaDTO>()("GET", "/pessoas/{id}", "logado", "Perfil público de uma pessoa."),
  },

  calendario: {
    eventos: def<undefined, EventoCalendarioDTO[], QueryPeriodo>()("GET", "/calendario/eventos", "logado", "Provas, trabalhos e eventos da turma no período (US04)."),
    ativarLembrete: def()("PUT", "/me/lembretes/{eventoId}", "logado", "Ativa o lembrete de um evento."),
    desativarLembrete: def()("DELETE", "/me/lembretes/{eventoId}", "logado", "Desativa o lembrete de um evento."),
    definirLembretesAgendados: def<LembretesAgendadosCorpo>()("PUT", "/me/lembretes-agendados", "logado", "Horários de disparo dos lembretes ativos (substitui a lista). Quem notifica, na hora certa, é o servidor."),
  },

  feed: {
    listar: def<undefined, Pagina<Post>, QueryPosts>()("GET", "/posts", "logado", "Feed paginado do espaço (só espaços de que a pessoa participa)."),
    obter: def<undefined, Post>()("GET", "/posts/{id}", "logado", "Uma publicação com respostas."),
    publicar: def<NovoPostCorpo, Post>()("POST", "/posts", "logado", "Publica dúvida, material ou publicação. A triagem (US06) pode reter para revisão humana."),
    excluir: def()("DELETE", "/posts/{id}", "logado", "Só o autor (ou a moderação) exclui."),
    buscar: def<undefined, ResultadoBuscaDTO[], QueryBusca>()("GET", "/busca", "logado", "Busca semântica por conceitos (US03)."),
    responder: def<NovaRespostaCorpo, Resposta>()("POST", "/posts/{id}/respostas", "logado", "Responde/comenta. Resposta de professor numa dúvida vira resposta oficial."),
    marcarUtil: def()("POST", "/posts/{id}/respostas/{respostaId}/util", "logado", "Só o autor da dúvida marca; o autor da resposta ganha XP (1 vez)."),
    curtir: def<undefined, CurtidaDTO>()("PUT", "/posts/{id}/curtida", "logado", "Curte (idempotente)."),
    descurtir: def<undefined, CurtidaDTO>()("DELETE", "/posts/{id}/curtida", "logado", "Remove a curtida (idempotente)."),
    salvar: def()("PUT", "/posts/{id}/salvo", "logado", "Salva nos favoritos (idempotente)."),
    removerSalvo: def()("DELETE", "/posts/{id}/salvo", "logado", "Remove dos favoritos (idempotente)."),
    salvos: def<undefined, Pagina<Post>, QueryPagina>()("GET", "/me/salvos", "logado", "Publicações salvas."),
    abrirMaterial: def()("POST", "/posts/{id}/aberturas", "aluno", "Registra que o material foi aberto (conta para missões; 1 por dia)."),
    denunciar: def<DenunciaCorpo, DenunciaRecebidaDTO>()("POST", "/posts/{id}/denuncias", "logado", "Denúncia (US05). A IA só classifica e prioriza; quem decide é humano."),
    contestar: def<ContestacaoCorpo>()("POST", "/posts/{id}/contestacao", "logado", "Só o autor de publicação retida; uma vez; vai para a fila da coordenação."),
    enviarAnexo: def<FormData, AnexoDTO>()("POST", "/anexos", "logado", "Upload multipart (campo `arquivo`, até 10 MB): PDF, imagem ou documento da lista permitida (.pdf .png .jpg .jpeg .heic .webp .txt .doc .docx .odt .ppt .pptx .xls .xlsx). Use o id em posts, avisos e entregas."),
    obterAnexo: def<undefined, AnexoDTO>()("GET", "/anexos/{id}", "logado", "Metadados + URL assinada e temporária para download."),
  },

  missoes: {
    listar: def<undefined, MissoesDTO>()("GET", "/missoes", "aluno", "Missões do dia e missão coletiva da turma."),
    progredir: def<ProgressoMissaoCorpo, Missao>()("POST", "/missoes/{id}/progresso", "aluno", "Progresso declarado (só em missões manuais; as automáticas o servidor calcula)."),
    contribuirColetiva: def<ContribuicaoColetivaCorpo, MissaoColetiva>()("POST", "/missoes/coletiva/contribuicoes", "aluno", "Contribuição validada contra os flashcards realmente respondidos."),
    sequencia: def<undefined, Sequencia>()("GET", "/me/sequencia", "aluno", "Sequência de dias, congeladores e semana."),
    registrarEstudo: def<undefined, Sequencia>()("POST", "/me/sequencia/registro", "aluno", "Registra o estudo de hoje (idempotente por dia, fuso America/Maceio). Dá pontos, nunca XP."),
    recuperarSequencia: def<undefined, Sequencia>()("POST", "/me/sequencia/recuperacao", "aluno", "Recupera a sequência quebrada em até 48 h por 200 pontos."),
    recomecarSequencia: def<undefined, Sequencia>()("POST", "/me/sequencia/recomeco", "aluno", "Zera a sequência quebrada."),
    pratica: def<undefined, PraticaDTO>()("GET", "/pratica", "aluno", "Flashcards da rodada atual e o estado da prática."),
    responderCarta: def<RespostaCartaCorpo, Pratica>()("POST", "/pratica/respostas", "aluno", "Autoavaliação da carta da vez (acertei/errei)."),
    reiniciarPratica: def<undefined, Pratica>()("POST", "/pratica/reinicio", "aluno", "Nova rodada de flashcards."),
    iniciarRodada: def<NovaRodadaCorpo, Pratica>()("POST", "/pratica/rodadas", "aluno", "Começa uma rodada com as cartas escolhidas (disciplina, todas ou só as erradas)."),
    flashcards: def<undefined, FlashcardsDTO>()("GET", "/me/flashcards", "aluno", "Cartas próprias e caixas de Leitner (1–5). A caixa é atualizada pelo servidor em POST /pratica/respostas."),
    salvarCarta: def<CartaPropriaCorpo>()("PUT", "/me/flashcards/{id}", "aluno", "Cria ou edita uma carta própria (id do cliente; idempotente)."),
    apagarCarta: def()("DELETE", "/me/flashcards/{id}", "aluno", "Apaga uma carta própria."),
  },

  desafios: {
    abrir: def<undefined, DesafioDTO>()("POST", "/desafios/{disciplina}", "aluno", "Sorteia as questões do desafio personalizado (US09B), sem gabarito."),
    responder: def<RespostasDesafioCorpo, ResultadoDesafioDTO>()("POST", "/desafios/{disciplina}/respostas", "aluno", "Corrige no servidor e devolve gabarito, pontos, XP e novo domínio."),
  },

  relatos: {
    listar: def<undefined, Relato[]>()("GET", "/relatos", "aluno", "Relatos da ouvidoria enviados pelo aluno."),
    enviar: def<NovoRelatoCorpo, Relato>()("POST", "/relatos", "aluno", "Envia relato (status inicial \"em análise\")."),
  },

  loja: {
    itens: def<undefined, ItemLojaDTO[]>()("GET", "/loja/itens", "logado", "Catálogo da loja."),
    comprar: def<CompraCorpo, CompraDTO>()("POST", "/loja/compras", "aluno", "Compra atômica: confere saldo, debita pontos e gera voucher no servidor."),
    minhasCompras: def<undefined, Compra[]>()("GET", "/me/compras", "aluno", "Histórico de trocas e vouchers."),
    entregar: def<undefined, Compra>()("PUT", "/loja/compras/{id}/entrega", "professor", "Marca a recompensa como entregue (idempotente) e avisa a aluna. Só alunas das turmas do professor."),
  },

  ranking: {
    liga: def<undefined, RankingLigaDTO, QueryRankingLiga>()("GET", "/ranking/liga", "logado", "Ranking semanal de XP (liga, turma ou disciplina). Respeita anônimo e Modo Sombra."),
    foco: def<undefined, RankingFocoDTO, QueryRankingFoco>()("GET", "/ranking/foco", "logado", "Ranking de minutos de foco na semana (turma ou escola). Respeita anônimo e Modo Sombra."),
  },

  estudos: {
    sessoes: def<undefined, SessaoEstudo[], QueryPeriodo>()("GET", "/me/estudos/sessoes", "aluno", "Blocos de estudo do período (base das métricas)."),
    registrarSessao: def<NovaSessaoCorpo, SessaoRegistradaDTO>()("POST", "/me/estudos/sessoes", "aluno", "Registra um bloco (mínimo 1 min, teto diário, sem sobreposição). Manual não dá pontos."),
    definirMeta: def<MetaDiariaCorpo>()("PUT", "/me/estudos/meta", "aluno", "Meta diária em minutos (15–480)."),
    timer: def<undefined, TimerAtivo | null>()("GET", "/me/estudos/timer", "aluno", "Timer em andamento (opcional: continuar em outro aparelho)."),
    salvarTimer: def<TimerAtivo>()("PUT", "/me/estudos/timer", "aluno", "Grava o estado atual do timer (opcional)."),
    encerrarTimer: def()("DELETE", "/me/estudos/timer", "aluno", "Descarta o timer em andamento (opcional)."),
  },

  salas: {
    listar: def<undefined, SalaEstudo[], QuerySalas>()("GET", "/salas", "logado", "Salas públicas + salas da turma. Privadas só com código."),
    obter: def<undefined, SalaEstudo>()("GET", "/salas/{id}", "logado", "Uma sala com as mensagens recentes."),
    buscarPorCodigo: def<undefined, SalaEstudo>()("GET", "/salas/codigo/{codigo}", "logado", "Encontra sala privada pelo código de convite (404 se não existir)."),
    criar: def<NovaSalaCorpo, SalaEstudo>()("POST", "/salas", "logado", "Cria sala. Professor cria sala oficial; o servidor gera o código das privadas."),
    fechar: def()("DELETE", "/salas/{id}", "logado", "Só o criador ou um professor da turma."),
    entrar: def<undefined, SalaEstudo>()("POST", "/salas/{id}/entrar", "logado", "Entra (sai da anterior). Respeita capacidade e horário agendado."),
    sair: def()("POST", "/salas/sair", "logado", "Sai da sala em que está (o servidor sabe qual)."),
    mensagens: def<undefined, Pagina<MensagemSala>, QueryMensagens>()("GET", "/salas/{id}/mensagens", "logado", "Chat da sala (paginado)."),
    enviarMensagem: def<MensagemSalaCorpo, MensagemSala>()("POST", "/salas/{id}/mensagens", "logado", "Mensagem ou reação no chat (só quem está na sala; com triagem US06)."),
  },

  campeonatos: {
    listar: def<undefined, Campeonato[], QueryCampeonatos>()("GET", "/campeonatos", "logado", "Campeonatos visíveis (turmas elegíveis + amistosos em que participa)."),
    obter: def<undefined, Campeonato>()("GET", "/campeonatos/{id}", "logado", "Detalhe com chaveamento e placar."),
    criar: def<NovoCampeonatoCorpo, Campeonato>()("POST", "/campeonatos", "logado", "Professor cria oficial; aluno cria amistoso (prêmio sempre zerado pelo servidor)."),
    editar: def<EdicaoCampeonatoCorpo, Campeonato>()("PATCH", "/campeonatos/{id}", "logado", "Só o organizador e só durante as inscrições."),
    excluir: def()("DELETE", "/campeonatos/{id}", "logado", "Só o organizador (ou coordenação)."),
    inscrever: def<undefined, Campeonato>()("PUT", "/campeonatos/{id}/inscricao", "aluno", "Inscreve (idempotente). Confere turma elegível e vagas."),
    cancelarInscricao: def<undefined, Campeonato>()("DELETE", "/campeonatos/{id}/inscricao", "aluno", "Cancela a inscrição (só durante as inscrições)."),
    iniciar: def<undefined, Campeonato>()("POST", "/campeonatos/{id}/iniciar", "logado", "Organizador fecha inscrições; o servidor sorteia o chaveamento (idempotente)."),
    encerrar: def<undefined, Campeonato>()("POST", "/campeonatos/{id}/encerrar", "logado", "Organizador encerra; o servidor define o campeão e premia (idempotente)."),
    abrirDuelo: def<undefined, QuizAbertoDTO>()("POST", "/campeonatos/{id}/partidas/{partidaId}/duelo", "aluno", "Sorteia as perguntas do duelo no servidor (sem gabarito). Só os 2 jogadores da partida."),
    responderDuelo: def<RespostasQuizCorpo, ResultadoDueloDTO>()("POST", "/campeonatos/{id}/partidas/{partidaId}/duelo/respostas", "aluno", "Valida as respostas no servidor (1 tentativa, dentro do prazo) e atualiza o chaveamento."),
    abrirRodada: def<undefined, QuizAbertoDTO>()("POST", "/campeonatos/{id}/rodadas", "aluno", "Pontos corridos: sorteia uma rodada de quiz (limite diário)."),
    responderRodada: def<RespostasQuizCorpo, ResultadoRodadaDTO>()("POST", "/campeonatos/{id}/rodadas/{rodadaId}/respostas", "aluno", "Valida a rodada no servidor e soma na tabela."),
  },

  atividades: {
    listar: def<undefined, Atividade[], QueryAtividades>()("GET", "/atividades", "logado", "Aluno: as da sua turma (só a própria entrega). Professor: as que criou."),
    obter: def<undefined, Atividade>()("GET", "/atividades/{id}", "logado", "Detalhe (professor vê todas as entregas)."),
    criar: def<NovaAtividadeCorpo, Atividade>()("POST", "/atividades", "professor", "Publica para uma turma do professor e cria as entregas pendentes."),
    editar: def<EdicaoAtividadeCorpo, Atividade>()("PATCH", "/atividades/{id}", "professor", "Só o autor. Recompensa não muda depois da primeira correção."),
    excluir: def()("DELETE", "/atividades/{id}", "professor", "Só o autor; entregas corrigidas mantêm os pontos já dados."),
    entregar: def<EntregaCorpo, Entrega>()("POST", "/atividades/{id}/entrega", "aluno", "Entrega (ou reenvia antes da correção). Notifica o professor."),
    corrigir: def<CorrecaoCorpo, Entrega>()("PUT", "/atividades/{id}/entregas/{alunoId}/correcao", "professor", "Nota 0–10; pontos e XP proporcionais à nota calculados no servidor."),
    corrigirTodas: def<CorrecaoCorpo, CorrecaoEmLoteDTO>()("POST", "/atividades/{id}/correcoes", "professor", "Mesma nota para todas as entregas ainda não corrigidas."),
    lembrarPendentes: def<undefined, LembreteEnviadoDTO>()("POST", "/atividades/{id}/lembretes", "professor", "Notifica quem não entregou (no máximo 1 vez a cada 6 h)."),
  },

  professor: {
    turmas: def<undefined, TurmaDTO[]>()("GET", "/professor/turmas", "professor", "Turmas do professor com o resumo de engajamento."),
    alunos: def<undefined, AlunoPainelDTO[]>()("GET", "/professor/turmas/{turma}/alunos", "professor", "Alunos da turma com métricas (só turmas do professor)."),
    aluno: def<undefined, AlunoDetalheDTO>()("GET", "/professor/alunos/{alunoId}", "professor", "Detalhe de um aluno de uma das suas turmas."),
    atribuir: def<AtribuicaoCorpo, Atribuicao[]>()("POST", "/professor/atribuicoes", "professor", "Dá pontos/XP com motivo. Só a alunos das suas turmas, com limites por lançamento."),
    atribuicoes: def<undefined, Pagina<Atribuicao>, QueryAtribuicoes>()("GET", "/professor/atribuicoes", "professor", "Histórico auditável das atribuições."),
    publicarAviso: def<AvisoCorpo, Post>()("POST", "/professor/avisos", "professor", "Aviso oficial no feed da turma ou da escola."),
    marcarUtil: def<UtilProfessorCorpo>()("POST", "/professor/respostas/{respostaId}/util", "professor", "Professor reconhece a resposta de um aluno: marca útil e credita +25 pontos e +25 XP uma vez."),
    lembrarAlunos: def<LembrarAlunosCorpo, LembreteEnviadoDTO>()("POST", "/professor/lembretes", "professor", "Notifica alunos sem estudar. Trava de 6 h por aluno no servidor; devolve quantos foram avisados."),
    estatisticas: def<undefined, EstatisticasProfessorDTO, QueryEstatisticas>()("GET", "/professor/estatisticas", "professor", "Agregados da turma no período (engajamento, foco, desempenho, risco…); base da tela e do relatório."),
  },

  moderacao: {
    fila: def<undefined, ItemModeracaoDTO[]>()("GET", "/moderacao/posts", "professor", "Publicações sinalizadas pela triagem ou denunciadas, por prioridade."),
    decidirPost: def<DecisaoCorpo>()("PUT", "/moderacao/posts/{postId}", "professor", "Decisão humana (aprovar/remover). `observacao` = motivo (obrigatório ao remover); fica na auditoria e no histórico."),
    mensagensSala: def<undefined, MensagemSalaRetidaDTO[]>()("GET", "/moderacao/salas/mensagens", "professor", "Mensagens de chat de sala retidas pela triagem (US06), ainda sem decisão."),
    decidirMensagemSala: def<DecisaoCorpo>()("PUT", "/moderacao/salas/{salaId}/mensagens/{mensagemId}", "professor", "Decisão sobre mensagem de chat de sala retida pela triagem (mesmas regras do post)."),
    historico: def<undefined, Pagina<RegistroModeracaoDTO>, QueryPagina>()("GET", "/moderacao/historico", "professor", "Histórico das decisões (posts e chat de sala), mais novas primeiro."),
    relatos: def<undefined, Relato[]>()("GET", "/moderacao/relatos", "coordenacao", "Relatos da ouvidoria para análise."),
    validarRelato: def<ValidacaoRelatoCorpo, Relato>()("PUT", "/moderacao/relatos/{id}", "coordenacao", "Valida ou recusa o relato. Se validado, o servidor credita a recompensa (pontos, nunca XP) e notifica a aluna."),
  },

  notificacoes: {
    listar: def<undefined, Pagina<Notificacao>, QueryPagina>()("GET", "/notificacoes", "logado", "Notificações de quem está logado (mais novas primeiro)."),
    ler: def()("POST", "/notificacoes/{id}/leitura", "logado", "Marca uma como lida."),
    lerTodas: def()("POST", "/notificacoes/leitura", "logado", "Marca todas como lidas."),
  },
} as const;

/** Troca `{params}` pelos valores (codificados) e anexa a query sem campos vazios. */
export function montarCaminho(caminho: string, params: Record<string, string> = {}, query?: object) {
  let url = caminho.replace(/\{(\w+)\}/g, (_, nome: string) => encodeURIComponent(params[nome] ?? ""));
  if (query) {
    const busca = new URLSearchParams();
    for (const [chave, valor] of Object.entries(query)) if (valor !== undefined && valor !== null) busca.set(chave, String(valor));
    const texto = busca.toString();
    if (texto) url += `?${texto}`;
  }
  return url;
}

export interface PedidoPronto {
  metodo: Metodo;
  caminho: string;
  corpo?: unknown;
}

/** Monta método + caminho + corpo checados pelo tipo do endpoint, sem enviar (usado pela fila do sync). */
export function preparar<E extends Endpoint>(ep: E, ...[opcoes]: ArgsDe<E>): PedidoPronto {
  const o = (opcoes ?? {}) as OpcoesSoltas;
  return { metodo: ep.metodo, caminho: montarCaminho(ep.caminho, o.params, o.query), corpo: o.corpo };
}

/** Chamada tipada à API (lança `ErroApi` em 4xx/5xx — trate na tela). */
export function chamar<E extends Endpoint>(ep: E, ...args: ArgsDe<E>): Promise<RespostaDe<E>> {
  const pedido = preparar(ep, ...args);
  const o: Extras = args[0] ?? {};
  return api<RespostaDe<E>>(pedido.metodo, pedido.caminho, pedido.corpo, o.sinal, o.idempotencia ? { "Idempotency-Key": o.idempotencia } : undefined);
}
