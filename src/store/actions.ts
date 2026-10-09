/**
 * Ações do Portal do Aluno: cada função é um fluxo de usuário completo
 * (muda o estado, mostra toasts e cria notificações para quem é afetado).
 * Os componentes chamam estas funções — nunca o reducer direto.
 */
import { useSyncExternalStore } from "react";
import { MODO_API } from "@/api/client";
import { assinarSincronizacao, naFila, pendentesDoUsuario } from "@/api/sync";
import { rotuloDoEspaco, type Disciplina } from "@/data/escola";
import { pontosDaSequencia } from "@/data/missoes";
import { itemPorId } from "@/data/loja";
import { USUARIO_ID } from "@/data/pessoas";
import { DESTINOS_PROFESSOR } from "@/data/professor";
import { apagarTodosArquivos } from "@/lib/arquivos";
import { lerSessao, useSessao } from "@/lib/auth";
import { buscarSemelhantes } from "@/lib/busca";
import { assinarConexao, estaOnline } from "@/lib/conexao";
import { fmt, gerarId, gerarVoucher, primeiroNome } from "@/lib/format";
import { triarDenuncia, verificarPublicacao, type MotivoDenuncia } from "@/lib/moderacao";
import { baixarAnexoDe } from "@/lib/materiais";
import { simulacaoAtiva } from "@/lib/simulacoes";
import { dataCurta, diaDaSemana, inicioDoDia } from "@/lib/tempo";
import { publicarAviso } from "./acoes/professor";
import { commit, ehAluno, MODERADOR_ID, notificar, novaEpoca, papelAtual, pessoa, premiar } from "./nucleo";
import { criarEstadoInicial } from "./seed";
import { salvou } from "./seletores";
import { despachar, obterEstado, relerSeOutraJanelaGravou, useSeletor } from "./store";
import type { Anexo, EspacoId, Post, Privacidade, Resposta, TipoPost } from "./types";

export { premiar } from "./nucleo";
import { celebrar, falhaDeProgresso, limparFalhaProgresso, registrarFalhaProgresso, renovarFalhaProgresso, toast } from "./ui";

function professorDe(disciplina: Disciplina) {
  return Object.values(obterEstado().pessoas).find((p) => p.papel === "professor" && p.disciplina === disciplina);
}

function acharPost(id: string) {
  return obterEstado().posts.find((p) => p.id === id);
}

/** Quem está agindo nesta aba (a sessão), com a aluna como padrão. */
function atorId() {
  return lerSessao()?.usuarioId ?? USUARIO_ID;
}

/* ───────────── Feed ───────────── */

/** Curtir é por pessoa: o gesto vale para quem usa esta aba (a aluna e o professor não se afetam). */
export function curtir(postId: string) {
  commit({ type: "curtir", postId, por: atorId() });
}

export function salvar(postId: string) {
  const por = atorId();
  const post = commit({ type: "salvar", postId, por }).posts.find((p) => p.id === postId);
  if (!post) return;
  toast({ tipo: "info", titulo: salvou(post, por) ? "Salvo nos seus favoritos" : "Removido dos favoritos" }, 2200);
}

/** Só a aluna abre material "para missão": o professor lendo o que publicou não registra nada nem avança a missão dela. */
export function abrirMaterial(postId: string) {
  if (!ehAluno()) return;
  commit({ type: "materialAberto", postId });
  const missao = obterEstado().missoes.find((m) => m.postId === postId && m.tipo === "diaria" && !m.concluida);
  if (missao) avancarMissao(missao.id, 1);
}

export function baixarMaterial(post: Post) {
  if (!post.anexo) return;
  void baixarAnexoDe(post.anexo, {
    titulo: post.anexo.nome.replace(/\.pdf$/i, ""),
    descricao: post.texto,
    disciplina: post.disciplina,
    autor: pessoa(post.autorId)?.nome,
    data: dataCurta(post.criadoEm),
  });
  abrirMaterial(post.id);
  toast({ tipo: "info", titulo: "Download iniciado", mensagem: post.anexo.nome }, 2400);
}

export interface NovaPublicacao {
  tipo: TipoPost;
  /** Aluna: obrigatória. Professor: obrigatória em material; nos demais, a disciplina dele por padrão. */
  disciplina?: Disciplina;
  texto: string;
  tags: string[];
  /** Arquivo real escolhido na tela. Sem anexo e tipo material: gera o PDF a partir do conteúdo. */
  anexo?: Anexo;
  /** Professor: para onde publica (obrigatório). A aluna publica no espaço escolhido no seletor do cabeçalho. */
  destino?: EspacoId;
  /** Não calcula as "dúvidas parecidas" (a sugestão por IA está indisponível, tela 73). */
  semSugestoes?: boolean;
}

function slug(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Publica no feed e devolve o id (ou `null` = recusado, nada foi publicado).
 * - Aluna: publicação, dúvida ou material (disciplina obrigatória) no espaço escolhido no seletor; aviso é recusado.
 * - Professor: aviso, material ou publicação para um destino (obrigatório); dúvida é recusada. O aviso segue a regra
 *   única de `publicarAviso`. Sem pontos para o professor.
 * A triagem automática vale para os dois papéis. Sem conexão, o post fica salvo com `aguardandoEnvio`.
 */
export function publicar({ tipo, disciplina, texto, tags, anexo, destino, semSugestoes }: NovaPublicacao): string | null {
  const limpo = texto.trim();
  if (!limpo) return null;
  const estado = obterEstado();
  const autorId = atorId();
  const professor = papelAtual() === "professor";

  let espaco: EspacoId;
  let disc = disciplina;
  if (professor) {
    if (tipo === "duvida" || !destino || !DESTINOS_PROFESSOR.some((d) => d.id === destino)) return null;
    disc ??= tipo === "material" ? undefined : estado.pessoas[autorId]?.disciplina;
    if (tipo === "aviso") return publicarAviso(limpo, destino, { anexo, tags, disciplina: disc });
    espaco = destino;
  } else {
    if (tipo === "aviso") return null;
    espaco = estado.espaco === "escola" ? "9A" : estado.espaco;
  }
  if (!disc) return null;

  const moderacao = verificarPublicacao(limpo);
  const qtdMateriais = estado.posts.filter((p) => p.autorId === autorId && p.tipo === "material").length;
  const offline = !estaOnline();

  // Sugestão do Portal (só em dúvida): materiais e dúvidas que JÁ têm resposta, parecidos com o texto — nunca os do
  // próprio autor nem dúvida sem resposta (não ajudam). Com a IA indisponível a tela manda `semSugestoes`.
  const sugestoes =
    tipo === "duvida" && !semSugestoes
      ? buscarSemelhantes(limpo, estado.posts, { limite: 12 })
          .filter((r) => r.post.autorId !== autorId && (r.post.tipo === "material" || (r.post.tipo === "duvida" && r.post.respostas.length > 0)))
          .slice(0, 3)
          .map((r) => r.post.id)
      : [];

  const post: Post = {
    id: gerarId("p"),
    tipo,
    autorId,
    espaco,
    disciplina: disc,
    texto: limpo,
    tags,
    criadoEm: Date.now(),
    curtidas: 0,
    curtido: false,
    salvo: false,
    respostas: [],
    anexo: anexo ?? (tipo === "material" ? { nome: `${slug(disc)}-material-${qtdMateriais + 1}.pdf`, paginas: 1, tamanho: "5 KB" } : undefined),
    emRevisao: moderacao.sinalizado || undefined,
    aguardandoEnvio: offline || undefined,
    sugestoes: sugestoes.length ? sugestoes : undefined,
  };
  commit({ type: "publicar", post });

  if (moderacao.sinalizado) {
    toast(
      {
        tipo: "alerta",
        titulo: "Publicação enviada para revisão",
        mensagem: `A triagem automática sinalizou possível ${moderacao.motivo.toLowerCase()}. Um coordenador vai revisar — nada é punido automaticamente.`,
      },
      5200,
    );
    if (autorId !== MODERADOR_ID) {
      notificar(MODERADOR_ID, {
        tipo: "moderacao",
        titulo: "Publicação retida para revisão",
        texto: `${primeiroNome(pessoa(autorId)?.nome ?? "Aluno")} · possível ${moderacao.motivo.toLowerCase()}`,
        href: "/professor/moderacao",
        deId: autorId,
      });
    }
    return post.id;
  }

  if (offline) {
    toast({ tipo: "info", titulo: "Publicação salva neste aparelho", mensagem: "Sem conexão. Ela é enviada assim que a internet voltar." }, 4200);
  }

  if (professor) {
    if (!offline) {
      const destinoTexto = rotuloDoEspaco(espaco);
      toast({ tipo: "info", titulo: tipo === "material" ? `Material publicado para ${destinoTexto}` : `Publicação enviada para ${destinoTexto}` }, 3000);
    }
    return post.id;
  }

  if (tipo === "material") {
    commit({ type: "premiar", pontos: 10, xp: 0 });
    if (!offline) toast({ tipo: "ganho", titulo: "Material compartilhado", mensagem: "+10 pontos por colaborar com a turma" });
  } else if (tipo === "duvida") {
    if (!offline) {
      toast({
        tipo: "info",
        titulo: `Dúvida publicada em ${disc}`,
        mensagem: sugestoes.length ? "Veja a Sugestão do Portal e aguarde uma resposta." : "Aguardando resposta. Você será avisada quando alguém responder.",
      });
    }
    const prof = professorDe(disc);
    if (prof && prof.id !== autorId) {
      notificar(prof.id, {
        tipo: "sistema",
        titulo: "Nova dúvida",
        texto: `${primeiroNome(pessoa(autorId)?.nome ?? "Aluno")} em ${disc}: ${limpo.length > 90 ? limpo.slice(0, 87) + "…" : limpo}`,
        href: "/professor/duvidas",
        deId: autorId,
      });
    }
  } else if (!offline) {
    toast({ tipo: "info", titulo: "Publicação enviada", mensagem: "Sua turma já pode ver no feed." });
  }
  return post.id;
}

/* ── Publicações sem conexão (tela 71) ── */

function quantosPendentesDoAutor(autor: string) {
  return obterEstado().posts.filter((p) => p.aguardandoEnvio && p.autorId === autor).length;
}

/**
 * Quantas publicações do usuário desta aba ainda não foram enviadas. Com backend (modo http): pedidos dele na fila de
 * saída; no modo local: os posts dele marcados com `aguardandoEnvio`.
 */
export function usePendentesEnvio(): number {
  const eu = useSessao()?.usuarioId ?? USUARIO_ID;
  const locais = useSeletor((e) => e.posts.reduce((n, p) => (p.aguardandoEnvio && p.autorId === eu ? n + 1 : n), 0));
  const naFilaDeSaida = useSyncExternalStore(
    assinarSincronizacao,
    () => pendentesDoUsuario(eu),
    () => 0,
  );
  return MODO_API === "http" ? naFilaDeSaida : locais;
}

/**
 * Quando a conexão volta, limpa o "aguardando envio" dos posts do usuário desta aba e avisa. Com backend, só os que já
 * saíram da fila de saída. Devolve a função que para o monitor. Rode uma vez no shell (a primeira conferência já roda
 * ao iniciar: publicações salvas antes de recarregar a página também são confirmadas).
 */
export function iniciarMonitorDeEnvio(): () => void {
  const confirmar = () => {
    if (!estaOnline()) return;
    const eu = atorId();
    if (!quantosPendentesDoAutor(eu)) return;
    const ids = obterEstado()
      .posts.filter((p) => p.aguardandoEnvio && p.autorId === eu && (MODO_API !== "http" || !naFila(`post:${p.id}`)))
      .map((p) => p.id);
    if (!ids.length) return;
    commit({ type: "confirmarEnvio", ids });
    toast({ tipo: "info", titulo: ids.length === 1 ? "Publicação enviada" : `${ids.length} publicações enviadas` }, 3000);
  };
  confirmar();
  const parar = [assinarConexao(confirmar)];
  if (MODO_API === "http") parar.push(assinarSincronizacao(confirmar));
  return () => parar.forEach((f) => f());
}

/** Janela em que uma resposta idêntica do mesmo autor conta como envio duplicado. */
const JANELA_DUPLO_ENVIO_MS = 3000;

interface OpcoesResposta {
  autorId: string;
  /** Resposta oficial do professor da disciplina. */
  oficial?: boolean;
}

/**
 * Publica uma resposta/comentário em `postId` em nome de `autorId` e notifica o autor do post.
 * O professor usa isto na tela "Dúvidas" (com `oficial: true`). Devolve o id da resposta (ou null).
 *
 * Recompensas da aluna autora da dúvida (quem responde nunca ganha por aqui além do que `responder` já dá à aluna):
 * - resposta oficial do professor: +20 pontos e +15 XP, uma vez (a primeira oficial);
 * - primeira resposta de um colega aluno: +10 pontos, uma vez.
 * Ambas são silenciosas (o toast sai pela notificação, só na aba dela).
 */
export function responderPost(postId: string, texto: string, { autorId, oficial }: OpcoesResposta) {
  const post = acharPost(postId);
  const conteudo = texto.trim();
  if (!post || !conteudo) return null;
  const agora = Date.now();
  // Segunda chamada em instantes (duplo clique, Ctrl+Enter repetido): a mesma resposta do mesmo autor não vale de novo.
  if (post.respostas.some((r) => r.autorId === autorId && r.texto === conteudo && agora - r.criadoEm < JANELA_DUPLO_ENVIO_MS)) return null;
  const resposta: Resposta = { id: gerarId("r"), autorId, texto: conteudo, criadoEm: agora, uteis: 0, util: false, ...(oficial ? { oficial: true } : {}) };
  commit({ type: "responder", postId, resposta });

  const ehDuvida = post.tipo === "duvida";
  const nomeAutor = primeiroNome(pessoa(autorId)?.nome ?? "Alguém");
  if (post.autorId !== autorId) {
    const daAluna = ehDuvida && post.autorId === USUARIO_ID;
    const recompensa = oficial && daAluna && !post.respostas.some((r) => r.oficial);
    const jaTinhaColega = post.respostas.some((r) => r.autorId !== post.autorId && pessoa(r.autorId)?.papel === "aluno");
    const bonusColega = !oficial && daAluna && pessoa(autorId)?.papel === "aluno" && !jaTinhaColega;
    if (recompensa) premiar(20, 15, "resposta oficial do professor", post.disciplina, true);
    else if (bonusColega) premiar(10, 0, "um colega respondeu a sua dúvida", undefined, true);
    notificar(post.autorId, {
      tipo: "sistema",
      titulo: ehDuvida ? (oficial ? "Resposta oficial na sua dúvida" : "Sua dúvida foi respondida") : "Novo comentário na sua publicação",
      texto: `${nomeAutor}: ${conteudo.length > 90 ? conteudo.slice(0, 87) + "…" : conteudo}${recompensa ? " · +20 pontos e +15 XP" : bonusColega ? " · +10 pontos" : ""}`,
      href: `/feed?post=${postId}`,
      deId: autorId,
    });
  }
  return resposta.id;
}

export function responder(postId: string, texto: string) {
  const post = acharPost(postId);
  if (!post) return;
  const autorId = atorId();
  const professor = papelAtual() === "professor";
  const ehDuvidaDeColega = post.tipo === "duvida" && post.autorId !== autorId;
  // Professor em dúvida de aluno = resposta oficial.
  const id = responderPost(postId, texto, { autorId, oficial: professor && ehDuvidaDeColega });
  if (!id) return;

  if (!ehDuvidaDeColega) {
    toast({ tipo: "info", titulo: "Comentário publicado" }, 2200);
    return;
  }
  const nomeAutor = primeiroNome(pessoa(post.autorId)?.nome ?? "");
  if (professor) {
    toast({ tipo: "info", titulo: "Resposta oficial publicada", mensagem: nomeAutor ? `Notificação enviada para ${nomeAutor}.` : undefined }, 2600);
  } else if (autorId === USUARIO_ID) {
    premiar(15, 10, `você respondeu a dúvida de ${primeiroNome(pessoa(post.autorId)?.nome ?? "colega")}`, post.disciplina);
    avancarMissao("d1", 1);
  } else {
    toast({ tipo: "info", titulo: "Resposta enviada", mensagem: `Notificação enviada para ${nomeAutor || "o autor"}.` }, 2600);
  }
}

export function marcarUtil(postId: string, respostaId: string) {
  const resposta = acharPost(postId)?.respostas.find((r) => r.id === respostaId);
  if (!resposta || resposta.util) return;
  const daAluna = resposta.autorId === USUARIO_ID;
  commit(daAluna ? { type: "respostaAjudou", postId, respostaId, quantidade: 1 } : { type: "marcarUtil", postId, respostaId });
  const nome = primeiroNome(pessoa(resposta.autorId)?.nome ?? "");
  if (daAluna) {
    premiar(25, 25, "sua resposta foi marcada como útil", acharPost(postId)?.disciplina, true);
    notificar(USUARIO_ID, { tipo: "pontos", titulo: "Sua resposta foi marcada como útil", texto: "+25 pontos e +25 XP", href: "/feed", deId: atorId() });
  } else if (resposta.autorId !== atorId()) {
    notificar(resposta.autorId, { tipo: "sistema", titulo: "Sua resposta foi marcada como útil", href: "/feed", deId: atorId() });
  }
  toast({ tipo: "info", titulo: "Resposta marcada como útil", mensagem: nome ? `Notificação enviada para ${nome}.` : undefined }, 2400);
}

/**
 * Denúncia à coordenação. Com `semTriagem` (a triagem por IA está indisponível) vale o motivo informado: a categoria
 * é o próprio motivo e a prioridade é média.
 */
export function denunciar(postId: string, motivo: MotivoDenuncia, descricao: string, evidencia: boolean, opcoes?: { semTriagem?: boolean }) {
  const post = acharPost(postId);
  if (!post) return;
  const semTriagem = opcoes?.semTriagem === true;
  const triagem = semTriagem ? undefined : triarDenuncia(motivo, post.texto, descricao);
  commit({
    type: "denunciar",
    postId,
    denuncia: {
      motivo,
      descricao,
      evidencia,
      categoriaIA: triagem?.categoria ?? motivo,
      prioridade: triagem?.prioridade ?? "média",
      criadoEm: Date.now(),
      ...(semTriagem ? { semTriagem: true } : {}),
    },
  });
  toast(
    triagem
      ? { tipo: "info", titulo: "Denúncia enviada à coordenação", mensagem: `Triagem: ${triagem.categoria} · prioridade ${triagem.prioridade}` }
      : { tipo: "info", titulo: "Denúncia enviada à coordenação", mensagem: "Triagem indisponível, vale o motivo informado" },
    4200,
  );
}

/**
 * O autor de uma publicação retida pela triagem pede revisão ("Isso foi um engano?", tela 75): só ele, só em post
 * `emRevisao` e só uma vez. A coordenação é notificada.
 */
export function contestarRetencao(postId: string, texto?: string) {
  const post = acharPost(postId);
  const autorId = atorId();
  if (!post || !post.emRevisao || post.contestacao || post.autorId !== autorId) return;
  const limpo = texto?.trim().slice(0, 300) || undefined;
  commit({ type: "contestar", postId, contestacao: { em: Date.now(), ...(limpo ? { texto: limpo } : {}) } });
  if (autorId !== MODERADOR_ID) {
    notificar(MODERADOR_ID, {
      tipo: "moderacao",
      titulo: "Contestação de publicação retida",
      texto: `${primeiroNome(pessoa(autorId)?.nome ?? "Aluno")} pede nova revisão${limpo ? `: ${limpo.length > 70 ? limpo.slice(0, 67) + "…" : limpo}` : "."}`,
      href: "/professor/moderacao",
      deId: autorId,
    });
  }
  toast({ tipo: "info", titulo: "Contestação enviada à coordenação" }, 3000);
}

export function selecionarEspaco(espaco: EspacoId) {
  commit({ type: "selecionarEspaco", espaco });
}

/* ───────────── Missões ───────────── */

/** Simulação "salvar" (modo apresentação): o avanço não é gravado, fica registrado na UI e dá para tentar de novo. */
function recusarSalvamento(chave: string, quantidade: number) {
  registrarFalhaProgresso(chave, quantidade);
  toast({ tipo: "alerta", titulo: "Não conseguimos salvar seu progresso", mensagem: "O contador só avança quando o servidor confirmar." }, 4200);
}

/**
 * Avança a missão `id`. Devolve `false` quando o avanço NÃO foi salvo (simulação "salvar" ligada, ou missão inexistente);
 * missão já concluída não tem o que salvar e devolve `true`.
 */
export function avancarMissao(id: string, delta: number): boolean {
  const antes = obterEstado().missoes.find((m) => m.id === id);
  if (!antes) return false;
  if (antes.concluida) return true;
  if (simulacaoAtiva("salvar")) {
    recusarSalvamento(id, delta);
    return false;
  }
  const depois = commit({ type: "missaoProgresso", id, delta }).missoes.find((m) => m.id === id);
  if (depois?.concluida) premiar(depois.pontos, depois.xp, `missão concluída: ${depois.titulo}`, depois.disciplina);
  return true;
}

export function concluirMissao(id: string): boolean {
  const missao = obterEstado().missoes.find((m) => m.id === id);
  return missao ? avancarMissao(id, missao.alvo - missao.progresso) : false;
}

/** Repete um avanço que não foi salvo: `chave` é o id da missão ou "coletiva". Sucesso limpa a falha. */
export function tentarSalvarDeNovo(chave: string) {
  const falha = falhaDeProgresso(chave);
  if (!falha) return;
  if (simulacaoAtiva("salvar")) {
    renovarFalhaProgresso(chave);
    toast({ tipo: "alerta", titulo: "Não conseguimos salvar seu progresso", mensagem: "O contador só avança quando o servidor confirmar." }, 4200);
    return;
  }
  limparFalhaProgresso(chave);
  if (chave === "coletiva") contribuirColetiva(falha.quantidade);
  else avancarMissao(chave, falha.quantidade);
}

export function registrarEstudo() {
  virarDiaSeNecessario(); // o dia pode ter virado há menos de um minuto, antes da conferência periódica do shell
  const s = obterEstado().sequencia;
  if (s.estudouHoje || s.quebrada) return;
  const pontos = pontosDaSequencia(s.dias + 1);
  commit({ type: "registrarEstudo" });
  commit({ type: "premiar", pontos, xp: 0 });
  toast({ tipo: "sequencia", titulo: `${s.dias + 1} dias seguidos!`, mensagem: `+${pontos} pontos. Sequência não dá XP: presença não é domínio.` });
}

/**
 * Vira o dia da sequência e das missões diárias se `agora` já é outro dia (ver a ação `virarDia`). Estado antigo, sem
 * dia de referência, só ganha a referência (nada é punido). O shell chama na montagem, a cada minuto e ao voltar à aba.
 * Quando a virada gasta congelador ou quebra a sequência, a aluna recebe uma notificação.
 */
export function virarDiaSeNecessario(agora: number = Date.now()) {
  relerSeOutraJanelaGravou();
  const antes = obterEstado();
  const dia = inicioDoDia(agora);
  if (antes.diaRef !== undefined && antes.diaRef >= dia) return;
  const depois = commit({ type: "virarDia", dia, diaSemana: diaDaSemana(agora) });
  if (depois === antes || antes.diaRef === undefined) return;
  const antesSeq = antes.sequencia;
  const depoisSeq = depois.sequencia;
  if (!antesSeq.quebrada && depoisSeq.quebrada) {
    notificar(depois.usuario.id, {
      tipo: "sistema",
      titulo: "Sua sequência foi interrompida",
      texto: "Sem congeladores. Recupere em até 48 horas por 200 pontos.",
      href: "/missoes",
    });
  } else if (antesSeq.diasSemCongelador > 0 && depoisSeq.diasSemCongelador === 0 && !depoisSeq.quebrada) {
    notificar(depois.usuario.id, {
      tipo: "sistema",
      titulo: "Sua sequência está protegida",
      texto: `Um congelador foi usado — ${depoisSeq.congeladores === 1 ? "resta 1" : `restam ${depoisSeq.congeladores}`} neste mês. Seus ${depoisSeq.dias} dias continuam valendo.`,
      href: "/missoes",
    });
  }
}

export function simularAusencia() {
  const antes = obterEstado().sequencia;
  if (antes.quebrada) return;
  const depois = commit({ type: "simularAusencia" }).sequencia;
  if (!depois.quebrada) {
    toast({
      tipo: "sequencia",
      titulo: "Sua sequência está protegida",
      mensagem: `1 congelador usado — ${depois.congeladores === 1 ? "resta 1" : `restam ${depois.congeladores}`} neste mês. Seus ${depois.dias} dias continuam valendo.`,
    }, 4200);
  } else {
    toast({ tipo: "alerta", titulo: "Sequência interrompida", mensagem: "Sem congeladores. Recupere em até 48 horas por 200 pontos." }, 4200);
  }
}

export const CUSTO_RECUPERACAO = 200;

export function recuperarSequencia() {
  const estado = obterEstado();
  if (estado.usuario.pontos < CUSTO_RECUPERACAO) {
    toast({ tipo: "info", titulo: "Pontos insuficientes", mensagem: `Faltam ${CUSTO_RECUPERACAO - estado.usuario.pontos} pontos.` });
    return;
  }
  commit({ type: "recuperarSequencia", custo: CUSTO_RECUPERACAO });
  toast({ tipo: "gasto", titulo: `−${CUSTO_RECUPERACAO} pontos`, mensagem: `Sequência de ${estado.sequencia.dias} dias recuperada — nada foi perdido.` });
}

export function recomecarSequencia() {
  commit({ type: "recomecarSequencia" });
  toast({ tipo: "info", titulo: "Nova sequência iniciada", mensagem: "Registre o estudo de hoje para começar a contar." });
}

export function virarCarta() {
  commit({ type: "virarCarta" });
}

/**
 * Soma à Maratona da Turma. Devolve `false` quando NÃO foi salvo (simulação "salvar"); Maratona já concluída
 * não tem o que salvar e devolve `true`. A falha fica em `useUI().falhasProgresso["coletiva"]`.
 */
export function contribuirColetiva(quantidade: number, silencioso = false): boolean {
  const antes = obterEstado().coletiva;
  if (antes.concluida) return true;
  if (simulacaoAtiva("salvar")) {
    recusarSalvamento("coletiva", quantidade);
    return false;
  }
  const depois = commit({ type: "contribuirColetiva", quantidade }).coletiva;
  if (depois.concluida) {
    premiar(Math.round(depois.pontosTotal / depois.participantes.length), depois.xp, "a Maratona da Turma foi concluída — sua parte dos 100 pontos");
    celebrar();
  } else if (!silencioso) {
    toast({ tipo: "info", titulo: `+${quantidade} flashcards para a turma`, mensagem: `${depois.progresso}/${depois.alvo} na Maratona da Turma` }, 2400);
  }
  return true;
}

export function concluirDesafio(disciplina: Disciplina, acertos: number) {
  commit({ type: "concluirDesafio", disciplina, acertos });
  if (acertos > 0) premiar(acertos * 5, acertos * 10, `desafio de ${disciplina}: ${acertos}/3 acertos · domínio +${acertos * 4}%`, disciplina);
  else toast({ tipo: "info", titulo: "Desafio registrado", mensagem: "Revise o conteúdo e tente outro desafio." });
}

export function enviarRelato(categoria: string, texto: string) {
  const id = gerarId("rel");
  commit({ type: "enviarRelato", relato: { id, categoria, texto, status: "em análise", criadoEm: Date.now() } });
  toast({ tipo: "info", titulo: "Relato enviado para a coordenação", mensagem: "Fica em análise até a coordenação validar." });
  const autorId = atorId();
  if (autorId !== MODERADOR_ID) {
    notificar(MODERADOR_ID, {
      tipo: "moderacao",
      titulo: "Novo relato para a coordenação",
      texto: `${primeiroNome(pessoa(autorId)?.nome ?? "Aluno")} · ${categoria}`,
      href: "/professor/moderacao",
      deId: autorId,
    });
  }
}

/* ───────────── Loja ───────────── */

/** Troca pontos por um item. Itens de avatar e perfil são únicos; vouchers (recompensas físicas) podem ser trocados de novo. */
export function comprar(itemId: string) {
  const item = itemPorId(itemId);
  const estado = obterEstado();
  if (!item) return false;
  const voucher = item.slot === "voucher" ? gerarVoucher() : undefined;
  if (!voucher && estado.compras.some((c) => c.itemId === itemId)) {
    toast({ tipo: "info", titulo: `Você já tem ${item.nome}` });
    return false;
  }
  if (estado.usuario.pontos < item.custo) {
    toast({ tipo: "info", titulo: `Saldo insuficiente: você possui ${fmt(estado.usuario.pontos)} pontos e este item requer ${fmt(item.custo)} pontos.` }, 4200);
    return false;
  }
  commit({ type: "comprar", compra: { id: gerarId("c"), itemId, custo: item.custo, criadoEm: Date.now(), voucher } });
  if (!voucher) commit({ type: "equipar", itemId, equipar: true });
  else if (atorId() !== MODERADOR_ID) {
    notificar(MODERADOR_ID, {
      tipo: "sistema",
      titulo: "Troca para entregar",
      texto: `${primeiroNome(pessoa(atorId())?.nome ?? "Aluno")} trocou pontos por “${item.nome}”.`,
      href: "/professor",
      deId: atorId(),
    });
  }
  toast(
    {
      tipo: "gasto",
      titulo: `−${item.custo} pontos · ${item.nome}`,
      mensagem: voucher ? `Código ${voucher}: apresente na secretaria.` : "Já equipado no seu perfil. XP e ranking não mudam.",
    },
    4200,
  );
  return true;
}

export function equipar(itemId: string, valor: boolean) {
  commit({ type: "equipar", itemId, equipar: valor });
  toast({ tipo: "info", titulo: valor ? "Equipado no seu perfil" : "Removido do seu perfil", mensagem: itemPorId(itemId)?.nome }, 2200);
}

/* ───────────── Perfil e preferências ───────────── */

const MSG_PRIVACIDADE: Record<Privacidade, { titulo: string; mensagem: string }> = {
  publico: { titulo: "Você voltou a aparecer nos rankings", mensagem: "Seu nome e avatar ficam visíveis para os colegas." },
  anonimo: { titulo: "Modo anônimo ativado", mensagem: "Os colegas veem “Aluno anônimo” no seu lugar." },
  sombra: { titulo: "Modo invisível ativado", mensagem: "Você não aparece nos rankings. Só você vê sua posição." },
};

/** Visibilidade nos rankings: público, anônimo ou Modo Sombra. */
export function definirPrivacidade(nivel: Privacidade) {
  if (obterEstado().usuario.privacidade === nivel) return;
  commit({ type: "definirPrivacidade", nivel });
  toast({ tipo: "info", ...MSG_PRIVACIDADE[nivel] }, 3200);
}

export function alternarLembrete(eventoId: string, titulo: string) {
  const ativo = !obterEstado().lembretes.includes(eventoId);
  commit({ type: "alternarLembrete", eventoId });
  toast({ tipo: "info", titulo: ativo ? "Lembrete ativado" : "Lembrete desativado", mensagem: titulo }, 2400);
}

/** Volta tudo ao estado inicial: estado, falhas de progresso simuladas, arquivos enviados e rascunhos. */
export function resetarDemonstracao() {
  novaEpoca();
  despachar({ type: "resetar", estado: criarEstadoInicial(Date.now()) });
  limparFalhaProgresso();
  void apagarTodosArquivos().catch(() => undefined);
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("cepi:dados-apagados"));
  toast({ tipo: "info", titulo: "Dados reiniciados", mensagem: "Tudo voltou ao estado inicial." });
}

/* ───────────── Novos módulos (v3) ───────────── */

export * from "./acoes/estudos";
export * from "./acoes/salas";
export * from "./acoes/campeonatos";
export * from "./acoes/atividades";
export * from "./acoes/professor";
export * from "./acoes/notificacoes";
