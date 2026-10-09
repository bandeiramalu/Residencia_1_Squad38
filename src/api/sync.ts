/**
 * Sincronização com o backend — a ponte entre o estado local e a API REST.
 *
 * Toda mudança de estado passa por `commit(acao)` (store/nucleo.ts), que chama `sincronizar(acao)`:
 *   1. `REGRAS[acao.type]` traduz a ação numa requisição — ou `null` quando ela é só visual, só da demo
 *      ou calculada pelo servidor (pontos, XP, medalhas, notificações NUNCA saem do cliente);
 *   2. a requisição entra na FILA DE SAÍDA (outbox) salva no localStorage: sobrevive a recarregar a página
 *      e a ficar sem internet;
 *   3. a fila envia em ordem, com o header `Idempotency-Key`. Rede/5xx → reenvio com espera exponencial
 *      (e na hora em que a conexão volta). Outros 4xx → descartada, registrada em "rejeitadas" e avisada
 *      pelo evento `cepi:sync-rejeitada` (a tela pode mostrar um toast).
 *
 * A tela já mudou antes (atualização otimista); o servidor confirma depois. No modo local nada disso roda
 * e nada aqui lança erro para o app. Explicação completa: docs/BACKEND.md.
 */
import { lerSessao, type PapelSessao } from "@/lib/auth";
import { lerArquivo } from "@/lib/arquivos";
import type { Acao } from "@/store/reducer";
import { obterEstado } from "@/store/store";
import type { Anexo, AppState, Campeonato } from "@/store/types";
import { ErroApi, MODO_API, api } from "./client";
import type { AnexoDTO } from "./dto";
import { ENDPOINTS as E, preparar, type PedidoPronto } from "./endpoints";

export interface Requisicao extends PedidoPronto {
  /** Vira o header `Idempotency-Key`: o servidor ignora repetições com a mesma chave. */
  chave: string;
  /**
   * Recurso de "estado desejado" (curtida, favorito, privacidade…): um pedido novo do mesmo recurso
   * substitui o que ainda está na fila — curtir → descurtir → curtir sem internet vira 1 PUT.
   */
  recurso?: string;
  /**
   * Arquivo real (guardado no IndexedDB) que precisa subir ANTES deste pedido: a fila faz
   * `POST /anexos`, põe o id devolvido em `corpo.anexoId` e só então envia o pedido.
   */
  arquivo?: { arquivoId: string; nome: string };
}

export interface Contexto {
  /** Estado DEPOIS da ação (o commit já rodou o reducer). */
  estado: AppState;
  eu: string;
  papel: PapelSessao;
}

type AcaoDo<T extends Acao["type"]> = Extract<Acao, { type: T }>;

/** Uma regra para CADA ação: se alguém criar uma ação nova, o TypeScript obriga a decidir aqui. */
type Regras = { [T in Acao["type"]]: (acao: AcaoDo<T>, ctx: Contexto) => Requisicao | null };

function novaChave() {
  try {
    return crypto.randomUUID();
  } catch {
    return `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }
}

/** Criação com id do cliente: chave fixa, então a mesma criação nunca é enviada duas vezes. */
const criar = (p: PedidoPronto, chave: string): Requisicao => ({ ...p, chave });
/** Fato novo a cada chamada (progresso, resposta de carta…). */
const evento = (p: PedidoPronto): Requisicao => ({ ...p, chave: novaChave() });
/** Estado desejado de um recurso (PUT/DELETE idempotentes): o mais novo vence. */
const desejado = (p: PedidoPronto, recurso: string): Requisicao => ({ ...p, chave: novaChave(), recurso });

function hoje() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** Anexa ao pedido o arquivo real (se houver) para o upload prévio da fila. */
const comArquivo = (req: Requisicao, anexo?: Anexo): Requisicao => (anexo?.arquivoId ? { ...req, arquivo: { arquivoId: anexo.arquivoId, nome: anexo.nome } } : req);

/** Atribuições automáticas da correção (acoes/atividades.ts): o servidor já credita em PUT …/correcao. */
const PREFIXO_CORRECAO = "Correção:";

function salvarTimer(estado: AppState) {
  const timer = estado.estudos.timer;
  return timer ? evento(preparar(E.estudos.salvarTimer, { corpo: timer })) : null;
}

/**
 * `atualizarCampeonato` carrega o campeonato INTEIRO — nunca o enviamos (o placar seria do cliente!).
 * Deduzimos a intenção e mandamos só ela, sempre de forma idempotente:
 * - aluno durante as inscrições → "quero estar inscrito" (PUT) ou "não quero" (DELETE);
 * - organizador → iniciar/encerrar (o servidor ignora se o campeonato já estiver nesse status);
 * - placar e chaveamento: o servidor calcula nos endpoints de duelo/rodada (chamados direto pela tela).
 */
function intencaoCampeonato(c: Campeonato, { eu, papel }: Contexto): Requisicao | null {
  const params = { id: c.id };
  if (c.status === "inscricoes") {
    if (papel !== "aluno" || c.formato === "interclasses") return null;
    const pedido = c.participantes.includes(eu) ? preparar(E.campeonatos.inscrever, { params }) : preparar(E.campeonatos.cancelarInscricao, { params });
    return desejado(pedido, `inscricao:${c.id}`);
  }
  const organizador = c.criadorId === eu || (papel === "professor" && c.oficial);
  if (!organizador) return null;
  const pedido = c.status === "andamento" ? preparar(E.campeonatos.iniciar, { params }) : preparar(E.campeonatos.encerrar, { params });
  return criar(pedido, `${c.status}:${c.id}`);
}

/** Entrega da própria aluna ou correção do professor. Só entregas reais sobem. */
function intencaoEntrega({ atividadeId, alunoId, dados }: AcaoDo<"atualizarEntrega">, { eu, papel }: Contexto): Requisicao | null {
  if (dados.status === "entregue" && alunoId === eu) {
    const pedido = criar(preparar(E.atividades.entregar, { params: { id: atividadeId }, corpo: { resposta: dados.resposta } }), `entrega:${atividadeId}:${dados.entregueEm ?? 0}`);
    return comArquivo(pedido, dados.anexo);
  }
  if (dados.status === "corrigida" && papel === "professor" && dados.nota !== undefined) {
    const pedido = preparar(E.atividades.corrigir, { params: { id: atividadeId, alunoId }, corpo: { nota: dados.nota, feedback: dados.feedback } });
    return desejado(pedido, `correcao:${atividadeId}:${alunoId}`);
  }
  return null;
}

const REGRAS: Regras = {
  /* ── Calculado pelo servidor: o cliente nunca envia pontos, XP, medalhas ou notificações ── */
  premiar: () => null,
  desbloquearMedalha: () => null,
  /**
   * Notificações são EFEITO de outra ação que já sobe: o servidor cria uma por destinatário ao processar
   * aviso, correção, atribuição, relato, lembrete, troca… `notificar`/`notificarVarios` só alimentam o sino
   * local até o evento `notificacao.nova` chegar (estado de UI, não fato a sincronizar).
   */
  notificar: () => null,
  notificarVarios: () => null,

  /* ── Só locais (não vão ao servidor) ── */
  resetar: () => null,
  simularAusencia: () => null,
  adiantarTimer: () => null,
  ajustarSaida: () => null,
  dispensarFocoPerdido: () => null,

  /* ── Só visual/local ── */
  selecionarEspaco: () => null,
  virarCarta: () => null,

  /* ── Efeitos locais de ações que já sobem por outra regra, ou que chegam por tempo real ── */
  /** A recompensa pela resposta útil é do servidor (marcarUtil). */
  respostaAjudou: () => null,
  /** Variante de tela da decisão do relato; a decisão sobe em `decidirRelato`. */
  validarRelato: () => null,
  /** A presença da sala chega por `sala.presenca`. */
  membrosSala: () => null,
  /** `moderarPost` + `registrarModeracao` são disparados juntos: só o segundo sobe (ver abaixo). */
  moderarPost: () => null,

  /* ── Feed ── */
  curtir: ({ postId }, { estado }) => {
    const post = estado.posts.find((p) => p.id === postId);
    if (!post) return null;
    const params = { id: postId };
    return desejado(post.curtido ? preparar(E.feed.curtir, { params }) : preparar(E.feed.descurtir, { params }), `curtida:${postId}`);
  },
  salvar: ({ postId }, { estado }) => {
    const post = estado.posts.find((p) => p.id === postId);
    if (!post) return null;
    const params = { id: postId };
    return desejado(post.salvo ? preparar(E.feed.salvar, { params }) : preparar(E.feed.removerSalvo, { params }), `salvo:${postId}`);
  },
  publicar: ({ post }, { eu }) => {
    if (post.autorId !== eu) return null;
    const { id, tipo, espaco, texto } = post;
    if (tipo === "aviso") return criar(preparar(E.professor.publicarAviso, { corpo: { id, texto, espaco } }), `post:${id}`);
    return comArquivo(criar(preparar(E.feed.publicar, { corpo: { id, tipo, espaco, texto, disciplina: post.disciplina, tags: post.tags } }), `post:${id}`), post.anexo);
  },
  responder: ({ postId, resposta }, { eu }) =>
    resposta.autorId === eu
      ? criar(preparar(E.feed.responder, { params: { id: postId }, corpo: { id: resposta.id, texto: resposta.texto } }), `resposta:${resposta.id}`)
      : null,
  marcarUtil: ({ postId, respostaId }) => criar(preparar(E.feed.marcarUtil, { params: { id: postId, respostaId } }), `util:${respostaId}`),
  denunciar: ({ postId, denuncia: d }) =>
    criar(preparar(E.feed.denunciar, { params: { id: postId }, corpo: { motivo: d.motivo, descricao: d.descricao, evidencia: d.evidencia } }), `denuncia:${postId}:${d.criadoEm}`),
  materialAberto: ({ postId }) => criar(preparar(E.feed.abrirMaterial, { params: { id: postId } }), `abertura:${postId}`),

  /* ── Missões, sequência, prática e ouvidoria ── */
  missaoProgresso: ({ id, delta }) => evento(preparar(E.missoes.progredir, { params: { id }, corpo: { delta } })),
  contribuirColetiva: ({ quantidade }) => evento(preparar(E.missoes.contribuirColetiva, { corpo: { quantidade } })),
  registrarEstudo: () => criar(preparar(E.missoes.registrarEstudo), `sequencia:${hoje()}`),
  recuperarSequencia: () => evento(preparar(E.missoes.recuperarSequencia)),
  recomecarSequencia: () => evento(preparar(E.missoes.recomecarSequencia)),
  responderCarta: ({ acertou }) => evento(preparar(E.missoes.responderCarta, { corpo: { acertou } })),
  reiniciarPratica: () => evento(preparar(E.missoes.reiniciarPratica)),
  /** Cartas próprias e início de rodada; a caixa de Leitner é atualizada pelo servidor em `responderCarta`. */
  flashcards: ({ op }) => {
    if (op.tipo === "iniciar") return evento(preparar(E.missoes.iniciarRodada, { corpo: { escolha: op.escolha, ids: op.ids } }));
    if (op.tipo === "salvar") {
      const { id, disciplina, pergunta, resposta } = op.carta;
      return desejado(preparar(E.missoes.salvarCarta, { params: { id }, corpo: { disciplina, pergunta, resposta } }), `carta:${id}`);
    }
    return desejado(preparar(E.missoes.apagarCarta, { params: { id: op.id } }), `carta:${op.id}`);
  },
  /** O servidor corrige o desafio: a tela chama `E.desafios.abrir/responder` direto (o gabarito não fica no cliente). */
  concluirDesafio: () => null,
  enviarRelato: ({ relato: r }) => criar(preparar(E.relatos.enviar, { corpo: { id: r.id, categoria: r.categoria, texto: r.texto } }), `relato:${r.id}`),

  /* ── Loja, perfil e calendário ── */
  entregarCompra: ({ id }, { papel }) => (papel === "professor" ? desejado(preparar(E.loja.entregar, { params: { id } }), `entrega-compra:${id}`) : null),
  comprar: ({ compra }) => criar(preparar(E.loja.comprar, { corpo: { id: compra.id, itemId: compra.itemId } }), `compra:${compra.id}`),
  equipar: ({ itemId, equipar }) => {
    const params = { itemId };
    return desejado(equipar ? preparar(E.perfil.equipar, { params }) : preparar(E.perfil.desequipar, { params }), `equipado:${itemId}`);
  },
  definirPrivacidade: ({ nivel }) => desejado(preparar(E.perfil.definirPrivacidade, { corpo: { nivel } }), "privacidade"),
  /** O servidor guarda o horário de disparo e é quem notifica; `disparado` volta no bootstrap. */
  definirLembretesAgendados: ({ itens }) =>
    desejado(
      preparar(E.calendario.definirLembretesAgendados, { corpo: { itens: itens.filter((i) => !i.disparado).map((i) => ({ eventoId: i.eventoId, disparoEm: i.disparoEm })) } }),
      "lembretes-agendados",
    ),
  editarPerfil: ({ dados }) =>
    desejado(
      preparar(E.perfil.editar, { corpo: { nome: dados.nome, iniciais: dados.iniciais, arroba: dados.arroba, bio: dados.bio, foto: dados.foto ?? null, selosExibidos: dados.selosExibidos } }),
      "perfil",
    ),
  alternarLembrete: ({ eventoId }, { estado }) => {
    const params = { eventoId };
    const ativo = estado.lembretes.includes(eventoId);
    return desejado(ativo ? preparar(E.calendario.ativarLembrete, { params }) : preparar(E.calendario.desativarLembrete, { params }), `lembrete:${eventoId}`);
  },

  /* ── Estudos (o timer no servidor é opcional: serve para continuar em outro aparelho) ── */
  iniciarTimer: (_, { estado }) => salvarTimer(estado),
  pausarTimer: (_, { estado }) => salvarTimer(estado),
  retomarTimer: (_, { estado }) => salvarTimer(estado),
  trocarFase: (_, { estado }) => salvarTimer(estado),
  encerrarTimer: () => evento(preparar(E.estudos.encerrarTimer)),
  sairDaTela: (_, { estado }) => salvarTimer(estado),
  perderFoco: () => evento(preparar(E.estudos.encerrarTimer)),
  registrarSessao: ({ sessao: s }) =>
    criar(
      preparar(E.estudos.registrarSessao, { corpo: { id: s.id, disciplina: s.disciplina, inicio: s.inicio, minutos: s.minutos, origem: s.origem, salaId: s.salaId } }),
      `sessao:${s.id}`,
    ),
  definirMetaDiaria: ({ minutos }) => desejado(preparar(E.estudos.definirMeta, { corpo: { minutos } }), "meta"),

  /* ── Salas coletivas ── */
  criarSala: ({ sala: s }, { eu }) => {
    if (s.criadorId !== eu) return null;
    const corpo = {
      id: s.id,
      nome: s.nome,
      descricao: s.descricao,
      disciplina: s.disciplina,
      focoMin: s.focoMin,
      pausaMin: s.pausaMin,
      privada: s.privada,
      tema: s.tema,
      capacidade: s.capacidade,
      turma: s.turma,
      agendadaPara: s.agendadaPara,
    };
    return criar(preparar(E.salas.criar, { corpo }), `sala:${s.id}`);
  },
  entrarSala: ({ salaId }) => evento(preparar(E.salas.entrar, { params: { id: salaId } })),
  sairSala: () => evento(preparar(E.salas.sair)),
  mensagemSala: ({ salaId, mensagem: m }, { eu }) => {
    // Mensagens de sistema ("fulano entrou") são geradas pelo servidor; as de outros chegam pelo tempo real.
    if (m.autorId !== eu || m.tipo === "sistema") return null;
    return criar(preparar(E.salas.enviarMensagem, { params: { id: salaId }, corpo: { id: m.id, texto: m.texto, tipo: m.tipo } }), `sala-msg:${m.id}`);
  },
  fecharSala: ({ salaId }) => criar(preparar(E.salas.fechar, { params: { id: salaId } }), `fechar-sala:${salaId}`),

  /* ── Campeonatos ── */
  criarCampeonato: ({ campeonato: c }, { eu }) => {
    if (c.criadorId !== eu) return null;
    const corpo = {
      id: c.id,
      nome: c.nome,
      descricao: c.descricao,
      formato: c.formato,
      metrica: c.metrica,
      disciplina: c.disciplina,
      inicio: c.inicio,
      fim: c.fim,
      premio: c.premio,
      maxParticipantes: c.maxParticipantes,
      capa: c.capa,
      turmas: c.turmas,
      participantes: c.participantes,
    };
    return criar(preparar(E.campeonatos.criar, { corpo }), `campeonato:${c.id}`);
  },
  atualizarCampeonato: ({ campeonato }, ctx) => intencaoCampeonato(campeonato, ctx),
  removerCampeonato: ({ id }) => criar(preparar(E.campeonatos.excluir, { params: { id } }), `excluir-campeonato:${id}`),

  /* ── Atividades ── */
  criarAtividade: ({ atividade: a }) => {
    const corpo = {
      id: a.id,
      titulo: a.titulo,
      descricao: a.descricao,
      tipo: a.tipo,
      disciplina: a.disciplina,
      turma: a.turma,
      prazo: a.prazo,
      pontos: a.pontos,
      xp: a.xp,
      anexoNome: a.anexo?.nome,
    };
    return comArquivo(criar(preparar(E.atividades.criar, { corpo }), `atividade:${a.id}`), a.anexo);
  },
  atualizarEntrega: (acao, ctx) => intencaoEntrega(acao, ctx),
  removerAtividade: ({ id }) => criar(preparar(E.atividades.excluir, { params: { id } }), `excluir-atividade:${id}`),

  /* ── Professor e moderação ── */
  atribuir: ({ atribuicao: t }, { papel }) => {
    if (papel !== "professor" || t.motivo.startsWith(PREFIXO_CORRECAO)) return null;
    const corpo = { itens: [{ id: t.id, alunoId: t.alunoId }], pontos: t.pontos, xp: t.xp, motivo: t.motivo };
    return criar(preparar(E.professor.atribuir, { corpo }), `atribuicao:${t.id}`);
  },
  /** A decisão sobe junto com o motivo (`observacao`); o servidor grava a auditoria e o histórico a partir dela. */
  registrarModeracao: ({ registro: r }) =>
    desejado(preparar(E.moderacao.decidirPost, { params: { postId: r.postId }, corpo: { decisao: r.decisao, observacao: r.motivo } }), `moderacao:${r.postId}`),
  /** Coordenação decide o relato; a recompensa (+30 pontos) é creditada pelo servidor, nunca pelo cliente. */
  decidirRelato: ({ id, aprovado }, { papel }) =>
    papel === "professor" ? desejado(preparar(E.moderacao.validarRelato, { params: { id }, corpo: { status: aprovado ? "validado" : "recusado" } }), `relato-decisao:${id}`) : null,
  lembrarAlunos: ({ ids, em }) => evento(preparar(E.professor.lembrarAlunos, { corpo: { alunoIds: ids, em } })),

  /* ── Notificações ── */
  lerNotificacao: ({ id }) => desejado(preparar(E.notificacoes.ler, { params: { id } }), `lida:${id}`),
  lerTodasNotificacoes: () => desejado(preparar(E.notificacoes.lerTodas), "lidas:todas"),
};

/** Tradução pura ação → requisição (exportada para testes). */
export function traduzirAcao(acao: Acao, ctx: Contexto): Requisicao | null {
  const regra = REGRAS[acao.type] as (a: Acao, c: Contexto) => Requisicao | null;
  return regra(acao, ctx);
}

/* ───────────── Fila de saída (outbox) ───────────── */

interface ItemFila extends Requisicao {
  /** Dono do pedido: se outra conta entrar no mesmo navegador, nada sai com o token errado. */
  usuarioId: string;
  acao: Acao["type"];
  criadoEm: number;
  tentativas: number;
  /** Erros 5xx seguidos: depois de `MAX_FALHAS_SERVIDOR` o pedido é descartado (não trava a fila para sempre). */
  falhasServidor: number;
  /** Não tentar antes deste instante (espera exponencial). */
  proximaEm: number;
}

type Resultado = { tipo: "ok" } | { tipo: "tentar"; servidor: boolean } | { tipo: "rejeitar"; status: number; codigo: string; mensagem: string };

const CHAVE_FILA = "cepi-api-fila";
const CHAVE_REJEITADAS = "cepi-api-rejeitadas";
const MAX_FILA = 500;
const MAX_REJEITADAS = 50;
const MAX_FALHAS_SERVIDOR = 8;
const VALIDADE_MS = 7 * 24 * 60 * 60 * 1000;
const TEMPO_LIMITE_MS = 15_000;
const UPLOAD_LIMITE_MS = 60_000;
const ESPERA_MAX_MS = 5 * 60 * 1000;

/** Cópia em memória para quando o localStorage não está disponível (aba anônima, cota cheia). */
let memoria: ItemFila[] = [];
let soMemoria = false;
let pendentes = 0;
let enviando = false;
let ligado = false;
let despertador: ReturnType<typeof setTimeout> | undefined;
const ouvintes = new Set<() => void>();

function lerFila(): ItemFila[] {
  if (soMemoria) return memoria;
  try {
    const bruto = localStorage.getItem(CHAVE_FILA);
    return bruto ? (JSON.parse(bruto) as ItemFila[]) : [];
  } catch {
    return memoria;
  }
}

function contar(fila: ItemFila[]) {
  pendentes = fila.length;
  ouvintes.forEach((o) => o());
}

function gravarFila(fila: ItemFila[]) {
  memoria = fila;
  if (!soMemoria) {
    try {
      localStorage.setItem(CHAVE_FILA, JSON.stringify(fila));
    } catch {
      soMemoria = true;
    }
  }
  contar(fila);
}

function avisar(nome: string, detalhe: unknown) {
  try {
    window.dispatchEvent(new CustomEvent(nome, { detail: detalhe }));
  } catch {
    /* sem window (testes) */
  }
}

/** Guarda as últimas recusas para depuração — SEM o corpo (pode ter mensagens pessoais: LGPD). */
function rejeitar(item: ItemFila, status: number, codigo: string, mensagem: string) {
  const registro = { acao: item.acao, metodo: item.metodo, caminho: item.caminho, chave: item.chave, status, codigo, mensagem, em: Date.now() };
  try {
    const antigas = JSON.parse(localStorage.getItem(CHAVE_REJEITADAS) ?? "[]") as unknown[];
    localStorage.setItem(CHAVE_REJEITADAS, JSON.stringify([registro, ...antigas].slice(0, MAX_REJEITADAS)));
  } catch {
    /* sem armazenamento: só o aviso */
  }
  console.warn(`[sync] ${item.metodo} ${item.caminho} recusado (${status} ${codigo}): ${mensagem}`);
  avisar("cepi:sync-rejeitada", registro);
}

function enfileirar(req: Requisicao, usuarioId: string, acao: Acao["type"]) {
  const fila = lerFila();
  if (fila.some((i) => i.chave === req.chave)) return;
  const semSubstituidos = req.recurso ? fila.filter((i) => i.recurso !== req.recurso || i.usuarioId !== usuarioId) : fila;
  const nova = [...semSubstituidos, { ...req, usuarioId, acao, criadoEm: Date.now(), tentativas: 0, falhasServidor: 0, proximaEm: 0 }];
  const excesso = nova.length - MAX_FILA;
  for (const item of nova.slice(0, Math.max(0, excesso))) rejeitar(item, 0, "fila_cheia", "Fila de sincronização cheia.");
  gravarFila(excesso > 0 ? nova.slice(excesso) : nova);
  acordar(0);
}

function remover(chave: string) {
  gravarFila(lerFila().filter((i) => i.chave !== chave));
}

function adiar(item: ItemFila, servidor: boolean) {
  const espera = Math.min(ESPERA_MAX_MS, 1000 * 2 ** item.tentativas) * (0.5 + Math.random() / 2);
  gravarFila(
    lerFila().map((i) =>
      i.chave === item.chave ? { ...i, tentativas: i.tentativas + 1, falhasServidor: servidor ? i.falhasServidor + 1 : 0, proximaEm: Date.now() + espera } : i,
    ),
  );
  acordar(espera);
}

function expurgarVencidos() {
  const fila = lerFila();
  const limite = Date.now() - VALIDADE_MS;
  const vencidos = fila.filter((i) => i.criadoEm < limite);
  if (!vencidos.length) return;
  for (const item of vencidos) rejeitar(item, 0, "expirado", "Ficou mais de 7 dias sem conseguir enviar.");
  gravarFila(fila.filter((i) => i.criadoEm >= limite));
}

async function enviar(item: ItemFila): Promise<Resultado> {
  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
  try {
    await api(item.metodo, item.caminho, item.corpo, controle.signal, { "Idempotency-Key": item.chave });
    return { tipo: "ok" };
  } catch (erro) {
    // Rede caiu ou tempo esgotado: tenta de novo sem limite (dentro da validade de 7 dias).
    if (!(erro instanceof ErroApi)) return { tipo: "tentar", servidor: false };
    if (erro.codigo === "ja_processado") return { tipo: "ok" };
    if (erro.status === 401) {
      avisar("cepi:sessao-expirada", { caminho: item.caminho });
      return { tipo: "tentar", servidor: false };
    }
    if (erro.status === 408 || erro.status === 429) return { tipo: "tentar", servidor: false };
    if (erro.status >= 500) {
      if (item.falhasServidor + 1 < MAX_FALHAS_SERVIDOR) return { tipo: "tentar", servidor: true };
    }
    return { tipo: "rejeitar", status: erro.status, codigo: erro.codigo, mensagem: erro.message };
  } finally {
    clearTimeout(limite);
  }
}

/**
 * Sobe o arquivo real do pedido (se houver) para `POST /anexos` e grava o id no corpo, na própria fila —
 * se o pedido falhar depois, o reenvio não repete o upload. Sem o arquivo (outro navegador) ou com recusa
 * definitiva do upload (413/415…), o pedido segue sem anexo e a recusa é registrada.
 * Devolve um `Resultado` só quando é preciso esperar/tentar de novo.
 */
async function subirAnexoPendente(item: ItemFila): Promise<Resultado | null> {
  if (!item.arquivo) return null;
  const { arquivoId, nome } = item.arquivo;
  let anexoId: string | undefined;
  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), UPLOAD_LIMITE_MS);
  try {
    const blob = await lerArquivo(arquivoId);
    if (blob) {
      const form = new FormData();
      form.append("arquivo", blob, nome);
      anexoId = (await api<AnexoDTO>("POST", "/anexos", form, controle.signal, { "Idempotency-Key": `${item.chave}:anexo` })).id;
    }
  } catch (erro) {
    if (!(erro instanceof ErroApi)) return { tipo: "tentar", servidor: false };
    if (erro.status === 401 || erro.status === 408 || erro.status === 429) return { tipo: "tentar", servidor: false };
    if (erro.status >= 500 && item.falhasServidor + 1 < MAX_FALHAS_SERVIDOR) return { tipo: "tentar", servidor: true };
    rejeitar({ ...item, caminho: "/anexos", metodo: "POST" }, erro.status, erro.codigo, `Anexo "${nome}" não subiu: ${erro.message}`);
  } finally {
    clearTimeout(limite);
  }
  gravarFila(
    lerFila().map((i) => {
      if (i.chave !== item.chave) return i;
      const { arquivo: _enviado, ...resto } = i;
      void _enviado;
      return anexoId && i.corpo && typeof i.corpo === "object" ? { ...resto, corpo: { ...i.corpo, anexoId } } : resto;
    }),
  );
  return null;
}

/** Envia os pedidos do usuário logado, um por vez e em ordem (um POST de criação vem antes da curtida nele). */
async function processar() {
  if (enviando) return;
  enviando = true;
  try {
    for (;;) {
      if (navigator.onLine === false) return;
      const sessao = lerSessao();
      if (!sessao || sessao.token === "demo") return;
      expurgarVencidos();
      const item = lerFila().find((i) => i.usuarioId === sessao.usuarioId);
      if (!item) return;
      const espera = item.proximaEm - Date.now();
      if (espera > 0) return acordar(espera);

      const falhaAnexo = await subirAnexoPendente(item);
      if (falhaAnexo?.tipo === "tentar") return adiar(item, falhaAnexo.servidor);
      const r = await enviar(lerFila().find((i) => i.chave === item.chave) ?? item);
      if (r.tipo === "tentar") return adiar(item, r.servidor);
      remover(item.chave);
      if (r.tipo === "rejeitar") rejeitar(item, r.status, r.codigo, r.mensagem);
    }
  } catch (erro) {
    console.warn("[sync] falha inesperada na fila", erro);
  } finally {
    enviando = false;
  }
}

/** Só uma aba envia por vez (Web Locks); as outras veem a fila mudar pelo evento `storage`. */
function acordar(ms: number) {
  clearTimeout(despertador);
  despertador = setTimeout(() => {
    const travas = typeof navigator !== "undefined" ? navigator.locks : undefined;
    if (!travas) return void processar();
    travas.request("cepi-api-fila", { ifAvailable: true }, (trava) => (trava ? processar() : undefined)).catch(() => undefined);
  }, Math.max(0, ms));
}

function ligar() {
  if (ligado) return;
  ligado = true;
  window.addEventListener("online", () => acordar(0));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") acordar(0);
  });
  window.addEventListener("storage", (e) => {
    if (e.key !== CHAVE_FILA) return;
    contar(lerFila());
    acordar(1000);
  });
  contar(lerFila());
  acordar(0);
}

// Modo http: retoma o que ficou na fila da última visita assim que o app abre.
if (MODO_API === "http" && typeof window !== "undefined") ligar();

/* ───────────── API pública ───────────── */

export function sincronizar(acao: Acao): void {
  if (MODO_API === "mock" || typeof window === "undefined") return;
  try {
    const sessao = lerSessao();
    if (!sessao || sessao.token === "demo") return;
    const req = traduzirAcao(acao, { estado: obterEstado(), eu: sessao.usuarioId, papel: sessao.papel });
    if (!req) return;
    ligar();
    enfileirar(req, sessao.usuarioId, acao.type);
  } catch (erro) {
    console.warn(`[sync] ação "${acao.type}" não entrou na fila`, erro);
  }
}

/** Pedidos esperando envio (indicador "sincronizando…"/"sem conexão"). Use com `useSyncExternalStore`. */
export function pendentesSincronizacao() {
  return pendentes;
}

export function assinarSincronizacao(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

/** Apaga a fila e as recusas (ex.: ao sair num computador compartilhado — o que não foi enviado se perde). */
export function limparFila() {
  gravarFila([]);
  try {
    localStorage.removeItem(CHAVE_REJEITADAS);
  } catch {
    /* nada a limpar */
  }
}
