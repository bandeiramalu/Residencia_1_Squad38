/**
 * Ações do Portal do Aluno: cada função é um fluxo de usuário completo
 * (muda o estado, mostra toasts e cria notificações para quem é afetado).
 * Os componentes chamam estas funções — nunca o reducer direto.
 */
import { type Disciplina } from "@/data/escola";
import { pontosDaSequencia } from "@/data/missoes";
import { itemPorId } from "@/data/loja";
import { USUARIO_ID } from "@/data/pessoas";
import { gerarId, gerarVoucher, primeiroNome } from "@/lib/format";
import { lerSessao } from "@/lib/auth";
import { buscarSemelhantes } from "@/lib/busca";
import { triarDenuncia, verificarPublicacao, type MotivoDenuncia } from "@/lib/moderacao";
import { baixarAnexoDe } from "@/lib/materiais";
import { dataCurta } from "@/lib/tempo";
import { commit, ehAluno, notificar, novaEpoca, pessoa, premiar } from "./nucleo";
import { criarEstadoInicial } from "./seed";
import { despachar, obterEstado } from "./store";
import type { Anexo, EspacoId, Post, Privacidade, Resposta, TipoPost } from "./types";

export { premiar } from "./nucleo";
import { celebrar, toast } from "./ui";

function professorDe(disciplina: Disciplina) {
  return Object.values(obterEstado().pessoas).find((p) => p.papel === "professor" && p.disciplina === disciplina);
}

function acharPost(id: string) {
  return obterEstado().posts.find((p) => p.id === id);
}

/* ───────────── Feed ───────────── */

export function curtir(postId: string) {
  commit({ type: "curtir", postId });
}

export function salvar(postId: string) {
  const depois = commit({ type: "salvar", postId });
  const salvo = depois.posts.find((p) => p.id === postId)?.salvo;
  toast({ tipo: "info", titulo: salvo ? "Salvo nos seus favoritos" : "Removido dos favoritos" }, 2200);
}

export function abrirMaterial(postId: string) {
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

interface NovaPublicacao {
  tipo: Exclude<TipoPost, "aviso">;
  disciplina: Disciplina;
  texto: string;
  tags: string[];
  /** Arquivo real escolhido na tela. Sem anexo e tipo material: gera o PDF a partir do conteúdo. */
  anexo?: Anexo;
}

/** Quem está agindo nesta aba (a sessão), com a aluna como padrão. */
function atorId() {
  return lerSessao()?.usuarioId ?? USUARIO_ID;
}

function slug(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function publicar({ tipo, disciplina, texto, tags, anexo }: NovaPublicacao) {
  const estado = obterEstado();
  const autorId = atorId();
  const moderacao = verificarPublicacao(texto);
  const espaco: EspacoId = estado.espaco === "escola" ? "9A" : estado.espaco;
  const qtdMateriais = estado.posts.filter((p) => p.autorId === autorId && p.tipo === "material").length;

  // Sugestão do Portal: dúvidas já respondidas e materiais parecidos com o texto.
  const sugestoes =
    tipo === "duvida"
      ? buscarSemelhantes(texto, estado.posts, { limite: 12 })
          .filter((r) => r.post.autorId !== autorId && (r.post.tipo === "material" || (r.post.tipo === "duvida" && r.post.respostas.length > 0)))
          .slice(0, 3)
          .map((r) => r.post.id)
      : [];

  const post: Post = {
    id: gerarId("p"),
    tipo,
    autorId,
    espaco,
    disciplina,
    texto,
    tags,
    criadoEm: Date.now(),
    curtidas: 0,
    curtido: false,
    salvo: false,
    respostas: [],
    anexo: anexo ?? (tipo === "material" ? { nome: `${slug(disciplina)}-material-${qtdMateriais + 1}.pdf`, paginas: 1, tamanho: "5 KB" } : undefined),
    emRevisao: moderacao.sinalizado || undefined,
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
    return post.id;
  }

  if (tipo === "material") {
    if (ehAluno()) {
      commit({ type: "premiar", pontos: 10, xp: 0 });
      toast({ tipo: "ganho", titulo: "Material compartilhado", mensagem: "+10 pontos por colaborar com a turma" });
    } else {
      toast({ tipo: "info", titulo: "Material compartilhado", mensagem: "Sua turma já pode abrir no feed." });
    }
  } else if (tipo === "duvida") {
    toast({
      tipo: "info",
      titulo: `Dúvida publicada em ${disciplina}`,
      mensagem: sugestoes.length ? "Veja a Sugestão do Portal e aguarde uma resposta." : "Aguardando resposta. Você será avisada quando alguém responder.",
    });
    const professor = professorDe(disciplina);
    if (professor && professor.id !== autorId) {
      notificar(professor.id, {
        tipo: "sistema",
        titulo: "Nova dúvida",
        texto: `${primeiroNome(pessoa(autorId)?.nome ?? "Aluno")} em ${disciplina}: ${texto.length > 90 ? texto.slice(0, 87) + "…" : texto}`,
        href: "/professor/duvidas",
        deId: autorId,
      });
    }
  } else {
    toast({ tipo: "info", titulo: "Publicação enviada", mensagem: "Sua turma já pode ver no feed." });
  }
  return post.id;
}

interface OpcoesResposta {
  autorId: string;
  /** Resposta oficial do professor da disciplina. */
  oficial?: boolean;
}

/**
 * Publica uma resposta/comentário em `postId` em nome de `autorId` e notifica o autor do post.
 * O professor usa isto na tela "Dúvidas" (com `oficial: true`). Devolve o id da resposta (ou null).
 */
export function responderPost(postId: string, texto: string, { autorId, oficial }: OpcoesResposta) {
  const post = acharPost(postId);
  const conteudo = texto.trim();
  if (!post || !conteudo) return null;
  const resposta: Resposta = { id: gerarId("r"), autorId, texto: conteudo, criadoEm: Date.now(), uteis: 0, util: false, ...(oficial ? { oficial: true } : {}) };
  commit({ type: "responder", postId, resposta });

  const ehDuvida = post.tipo === "duvida";
  const nomeAutor = primeiroNome(pessoa(autorId)?.nome ?? "Alguém");
  if (post.autorId !== autorId) {
    const recompensa = oficial && ehDuvida && post.autorId === USUARIO_ID;
    if (recompensa) premiar(20, 15, "resposta oficial do professor", post.disciplina, true);
    notificar(post.autorId, {
      tipo: "sistema",
      titulo: ehDuvida ? (oficial ? "Resposta oficial na sua dúvida" : "Sua dúvida foi respondida") : "Novo comentário na sua publicação",
      texto: `${nomeAutor}: ${conteudo.length > 90 ? conteudo.slice(0, 87) + "…" : conteudo}${recompensa ? " · +20 pontos e +15 XP" : ""}`,
      href: "/feed",
      deId: autorId,
    });
  }
  return resposta.id;
}

export function responder(postId: string, texto: string) {
  const post = acharPost(postId);
  if (!post) return;
  const autorId = atorId();
  const professor = lerSessao()?.papel === "professor";
  const id = responderPost(postId, texto, { autorId, oficial: professor && post.tipo === "duvida" && post.autorId !== autorId });
  if (!id) return;

  const ehDuvidaDeColega = post.tipo === "duvida" && post.autorId !== autorId;
  if (!ehDuvidaDeColega) {
    toast({ tipo: "info", titulo: "Comentário publicado" }, 2200);
    return;
  }
  if (autorId === USUARIO_ID) {
    premiar(15, 10, `você respondeu a dúvida de ${primeiroNome(pessoa(post.autorId)?.nome ?? "colega")}`, post.disciplina);
    avancarMissao("d1", 1);
  } else {
    toast({ tipo: "info", titulo: "Resposta enviada", mensagem: `${primeiroNome(pessoa(post.autorId)?.nome ?? "O aluno")} foi avisado.` }, 2600);
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
  toast({ tipo: "info", titulo: "Resposta marcada como útil", mensagem: nome ? `${nome} foi avisado.` : undefined }, 2400);
}

export function denunciar(postId: string, motivo: MotivoDenuncia, descricao: string, evidencia: boolean) {
  const post = acharPost(postId);
  if (!post) return;
  const triagem = triarDenuncia(motivo, post.texto, descricao);
  commit({
    type: "denunciar",
    postId,
    denuncia: { motivo, descricao, evidencia, categoriaIA: triagem.categoria, prioridade: triagem.prioridade, criadoEm: Date.now() },
  });
  toast(
    { tipo: "info", titulo: "Denúncia enviada à coordenação", mensagem: `Triagem: ${triagem.categoria} · prioridade ${triagem.prioridade}` },
    4200,
  );
}

export function selecionarEspaco(espaco: EspacoId) {
  commit({ type: "selecionarEspaco", espaco });
}

/* ───────────── Missões ───────────── */

export function avancarMissao(id: string, delta: number) {
  const antes = obterEstado().missoes.find((m) => m.id === id);
  if (!antes || antes.concluida) return;
  const depois = commit({ type: "missaoProgresso", id, delta }).missoes.find((m) => m.id === id);
  if (depois?.concluida) premiar(depois.pontos, depois.xp, `missão concluída: ${depois.titulo}`, depois.disciplina);
}

export function concluirMissao(id: string) {
  const missao = obterEstado().missoes.find((m) => m.id === id);
  if (missao) avancarMissao(id, missao.alvo - missao.progresso);
}

export function registrarEstudo() {
  const s = obterEstado().sequencia;
  if (s.estudouHoje || s.quebrada) return;
  const pontos = pontosDaSequencia(s.dias + 1);
  commit({ type: "registrarEstudo" });
  commit({ type: "premiar", pontos, xp: 0 });
  toast({ tipo: "sequencia", titulo: `${s.dias + 1} dias seguidos!`, mensagem: `+${pontos} pontos. Sequência não dá XP: presença não é domínio.` });
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

export function responderCarta(acertou: boolean) {
  const antes = obterEstado().pratica;
  if (antes.fim) return;
  const depois = commit({ type: "responderCarta", acertou }).pratica;
  if (acertou) contribuirColetiva(1, true);
  if (depois.fim) premiar(10, 15, `rodada de flashcards de Química concluída (${depois.acertos} acertos)`, "Química");
}

export function reiniciarPratica() {
  commit({ type: "reiniciarPratica" });
}

export function contribuirColetiva(quantidade: number, silencioso = false) {
  const antes = obterEstado().coletiva;
  if (antes.concluida) return;
  const depois = commit({ type: "contribuirColetiva", quantidade }).coletiva;
  if (depois.concluida) {
    premiar(Math.round(depois.pontosTotal / depois.participantes.length), depois.xp, "a Maratona da Turma foi concluída — sua parte dos 100 pontos");
    celebrar();
  } else if (!silencioso) {
    toast({ tipo: "info", titulo: `+${quantidade} flashcards para a turma`, mensagem: `${depois.progresso}/${depois.alvo} na Maratona da Turma` }, 2400);
  }
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
}

/* ───────────── Loja ───────────── */

export function comprar(itemId: string) {
  const item = itemPorId(itemId);
  const estado = obterEstado();
  if (!item) return false;
  if (estado.compras.some((c) => c.itemId === itemId)) {
    toast({ tipo: "info", titulo: `Você já tem ${item.nome}` });
    return false;
  }
  if (estado.usuario.pontos < item.custo) {
    toast({ tipo: "info", titulo: "Saldo insuficiente", mensagem: `Faltam ${item.custo - estado.usuario.pontos} pontos.` });
    return false;
  }
  const voucher = item.slot === "voucher" ? gerarVoucher() : undefined;
  commit({ type: "comprar", compra: { id: gerarId("c"), itemId, custo: item.custo, criadoEm: Date.now(), voucher } });
  if (!voucher) commit({ type: "equipar", itemId, equipar: true });
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

export function resetarDemonstracao() {
  novaEpoca();
  despachar({ type: "resetar", estado: criarEstadoInicial(Date.now()) });
  toast({ tipo: "info", titulo: "Dados reiniciados", mensagem: "Tudo voltou ao estado inicial." });
}

/* ───────────── Novos módulos (v3) ───────────── */

export * from "./acoes/estudos";
export * from "./acoes/salas";
export * from "./acoes/campeonatos";
export * from "./acoes/atividades";
export * from "./acoes/professor";
export * from "./acoes/notificacoes";
