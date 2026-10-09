/**
 * Ações exclusivas do professor: pontos, avisos, lembretes, dúvidas, moderação,
 * relatos à coordenação e trocas da loja. Tudo vira estado persistido e notificação real.
 */
import { MODO_API } from "@/api/client";
import { rotuloDoEspaco, type Disciplina } from "@/data/escola";
import { TURMA_DO_ESPACO } from "@/data/professor";
import { ALUNOS_TURMAS } from "@/data/turmas";
import { lerSessao } from "@/lib/auth";
import { estaOnline } from "@/lib/conexao";
import { gerarId, primeiroNome } from "@/lib/format";
import { verificarPublicacao } from "@/lib/moderacao";
import { responderPost } from "../actions";
import { commit, ehAluno, notificar, papelAtual, premiar } from "../nucleo";
import { obterEstado, relerSeOutraJanelaGravou } from "../store";
import type { Anexo, DecisaoModeracao, EspacoId, Notificacao, Post, RegistroModeracao } from "../types";
import { toast } from "../ui";

function professorId() {
  return lerSessao()?.usuarioId ?? "prof_ricardo";
}

function nomeDoProfessor() {
  return obterEstado().pessoas[professorId()]?.nome ?? "Seu professor";
}

/** Notificações para vários destinatários (sem toast: quem publica é o professor). */
function notificarTodos(ids: string[], n: Omit<Notificacao, "id" | "para" | "criadoEm" | "lida">) {
  const agora = Date.now();
  const notificacoes = [...new Set(ids)].map((para, i) => ({ ...n, id: `${gerarId("n")}${i}`, para, criadoEm: agora, lida: false }));
  commit({ type: "notificarVarios", notificacoes });
}

/** Dá pontos (Loja) e/ou XP (mérito) a um ou mais alunos, com motivo registrado. */
export function atribuirPontos(alunoIds: string[], pontos: number, xp: number, motivo: string) {
  if (!alunoIds.length || (pontos <= 0 && xp <= 0)) return;
  const prof = professorId();
  const { usuario, pessoas } = obterEstado();
  const texto = motivo.trim() || "Reconhecimento do professor";
  for (const alunoId of alunoIds) {
    commit({ type: "atribuir", atribuicao: { id: gerarId("atr"), professorId: prof, alunoId, pontos, xp, motivo: texto, criadoEm: Date.now() } });
    if (alunoId === usuario.id) premiar(pontos, xp, texto, undefined, !ehAluno());
    const partes = [pontos > 0 && `+${pontos} pontos`, xp > 0 && `+${xp} XP`].filter(Boolean).join(" e ");
    notificar(alunoId, { tipo: "pontos", titulo: `${pessoas[prof]?.nome ?? "Seu professor"} te deu ${partes}`, texto, href: "/perfil", deId: prof });
  }
  const nome = alunoIds.length === 1 ? primeiroNome(pessoas[alunoIds[0]]?.nome ?? "") : `${alunoIds.length} alunos`;
  toast({ tipo: "ganho", titulo: `Enviado para ${nome}`, mensagem: [pontos > 0 && `+${pontos} pontos`, xp > 0 && `+${xp} XP`, `· ${texto}`].filter(Boolean).join(" ") }, 3000);
}

/* ───────────── Avisos ───────────── */

/**
 * Ids dos alunos que recebem um aviso publicado neste espaço: "escola" = todos; uma turma (9A, 9B, 8A) = os alunos
 * nomeados dela mais os gerados da turma (`ALUNOS_TURMAS`); clube e bilíngue (já não são destino do professor) = só a aluna.
 */
export function alunosDoEspaco(espaco: EspacoId) {
  const { pessoas, usuario } = obterEstado();
  const nomeados = Object.values(pessoas).filter((p) => p.papel === "aluno");
  if (espaco === "escola") return [...new Set([...nomeados.map((p) => p.id), ...ALUNOS_TURMAS.map((a) => a.id)])];
  const turma = TURMA_DO_ESPACO[espaco];
  if (turma) return [...new Set([...nomeados.filter((p) => p.turma === turma).map((p) => p.id), ...ALUNOS_TURMAS.filter((a) => a.turma === turma).map((a) => a.id)])];
  return [usuario.id];
}

/** Notifica os alunos do destino de um aviso publicado (o texto vem do post). Devolve quantos foram notificados. */
function notificarAviso(post: Post) {
  const alunos = alunosDoEspaco(post.espaco);
  const nome = obterEstado().pessoas[post.autorId]?.nome ?? "Seu professor";
  notificarTodos(alunos, { tipo: "sistema", titulo: `Aviso de ${nome}`, texto: post.texto.slice(0, 90), href: `/feed?post=${post.id}`, deId: post.autorId });
  return alunos.length;
}

/**
 * Aviso oficial no feed e notificação para cada aluno do destino. É a regra ÚNICA do aviso: o Painel e o feed usam esta.
 * O post leva a disciplina do professor (ou a informada). Devolve o id do post, ou `null` se foi recusado (não é professor, texto vazio). A triagem automática vale também
 * aqui: aviso sinalizado fica retido para revisão e só notifica os alunos quando for liberado (ver `moderarPost`).
 * Sem conexão, o post fica com `aguardandoEnvio`.
 */
export function publicarAviso(texto: string, destino: EspacoId, opcoes?: { anexo?: Anexo; tags?: string[]; disciplina?: Disciplina }): string | null {
  if (papelAtual() !== "professor") return null;
  const limpo = texto.trim();
  if (!limpo) return null;
  const triagem = verificarPublicacao(limpo);
  const autorId = professorId();
  const post: Post = {
    id: gerarId("p"),
    tipo: "aviso",
    autorId,
    espaco: destino,
    // O aviso leva a disciplina do professor (informação no card), no feed e no Painel.
    disciplina: opcoes?.disciplina ?? obterEstado().pessoas[autorId]?.disciplina,
    texto: limpo,
    tags: opcoes?.tags ?? [],
    anexo: opcoes?.anexo,
    criadoEm: Date.now(),
    curtidas: 0,
    curtido: false,
    salvo: false,
    respostas: [],
    emRevisao: triagem.sinalizado || undefined,
    aguardandoEnvio: !estaOnline() || undefined,
  };
  commit({ type: "publicar", post });
  if (triagem.sinalizado) {
    toast(
      {
        tipo: "alerta",
        titulo: "Aviso enviado para revisão",
        mensagem: `A triagem automática sinalizou possível ${triagem.motivo.toLowerCase()}. Os alunos só são avisados quando você liberar na Moderação.`,
      },
      5200,
    );
    return post.id;
  }
  const quantos = notificarAviso(post);
  toast({ tipo: "info", titulo: `Aviso publicado para ${rotuloDoEspaco(destino)}`, mensagem: `${quantos} ${quantos === 1 ? "aluno notificado" : "alunos notificados"}` }, 3000);
  return post.id;
}

/* ───────────── Lembretes ───────────── */

export const INTERVALO_LEMBRETE_MS = 6 * 60 * 60 * 1000;

/** Quanto falta para o aluno poder receber outro lembrete (0 = já pode). */
/** Chave da trava de 6 h: lembrete de estudos usa o id do aluno; o de atividade tem trava própria. */
export function chaveLembrete(alunoId: string, tipo?: Notificacao["tipo"]) {
  return tipo === "atividade" ? `atividade:${alunoId}` : alunoId;
}

export function liberaLembreteEm(lembradoEm: number | undefined, agora: number) {
  return lembradoEm ? Math.max(0, lembradoEm + INTERVALO_LEMBRETE_MS - agora) : 0;
}

export interface OpcoesLembrete {
  titulo?: string;
  texto?: string;
  href?: string;
  tipo?: Notificacao["tipo"];
  /** Ignora a trava de 6 h. */
  forcar?: boolean;
  /** Lembrete de uma atividade: com backend sobe pelo endpoint da atividade (o servidor acha os pendentes). */
  atividadeId?: string;
}

/** Lembrete real: notificação persistida para o aluno + `lembradoEm`. Devolve quantos foram enviados. */
export function lembrarAlunos(alunoIds: string[], op: OpcoesLembrete = {}) {
  const agora = Date.now();
  const { lembradoEm = {}, pessoas } = obterEstado();
  const prof = professorId();
  const alvo = [...new Set(alunoIds)].filter((id) => op.forcar || liberaLembreteEm(lembradoEm[chaveLembrete(id, op.tipo)], agora) === 0);
  if (!alvo.length) return 0;
  notificarTodos(alvo, {
    tipo: op.tipo ?? "sistema",
    titulo: op.titulo ?? `${nomeDoProfessor()} sente sua falta nos estudos`,
    texto: op.texto ?? "Que tal uma sessão de foco hoje? Entre na Sala de estudos.",
    href: op.href ?? "/estudos",
    deId: prof,
  });
  // `ids` = chaves da trava de 6 h; `alunoIds` (ids puros) e `atividadeId` são o que vai à API.
  commit({ type: "lembrarAlunos", ids: alvo.map((id) => chaveLembrete(id, op.tipo)), em: agora, alunoIds: alvo, atividadeId: op.atividadeId });
  const nome = alvo.length === 1 ? primeiroNome(pessoas[alvo[0]]?.nome ?? "") : `${alvo.length} alunos`;
  toast({ tipo: "info", titulo: `Lembrete enviado para ${nome}`, mensagem: "Chega como notificação no portal." }, 2600);
  return alvo.length;
}

/* ───────────── Dúvidas ───────────── */

/** Resposta oficial do professor a uma dúvida: mesma regra do feed (`responderPost`: pontos, XP e notificação). */
export function responderDuvida(postId: string, texto: string) {
  const post = obterEstado().posts.find((p) => p.id === postId);
  if (!post || !texto.trim()) return false;
  const id = responderPost(postId, texto, { autorId: professorId(), oficial: true });
  if (!id) return false;
  const nome = primeiroNome(obterEstado().pessoas[post.autorId]?.nome ?? "");
  toast({ tipo: "info", titulo: "Resposta oficial publicada", mensagem: nome ? `Notificação enviada para ${nome}.` : "O autor recebeu a notificação." }, 2400);
  return true;
}

/** Professor marca a resposta de um aluno como útil: o autor ganha pontos e XP e é notificado. */
export function marcarRespostaUtil(postId: string, respostaId: string) {
  const estado = obterEstado();
  const post = estado.posts.find((p) => p.id === postId);
  const resposta = post?.respostas.find((r) => r.id === respostaId);
  if (!post || !resposta || resposta.util) return;
  const prof = professorId();
  const motivo = "Resposta marcada como útil pelo professor";
  if (resposta.autorId === estado.usuario.id) commit({ type: "respostaAjudou", postId, respostaId, quantidade: 1 });
  else commit({ type: "marcarUtil", postId, respostaId });
  // `origem: "util"`: o servidor credita +25/+25 em "marcar útil"; a atribuição é só o histórico local (não sobe).
  commit({ type: "atribuir", atribuicao: { id: gerarId("atr"), professorId: prof, alunoId: resposta.autorId, pontos: 25, xp: 25, motivo, criadoEm: Date.now(), origem: "util" } });
  if (resposta.autorId === estado.usuario.id) premiar(25, 25, motivo, post.disciplina, !ehAluno());
  notificar(resposta.autorId, { tipo: "pontos", titulo: `${nomeDoProfessor()} marcou sua resposta como útil`, texto: "+25 pontos e +25 XP", href: `/feed?post=${postId}`, deId: prof });
  toast({ tipo: "ganho", titulo: `+25 pontos e +25 XP para ${primeiroNome(estado.pessoas[resposta.autorId]?.nome ?? "")}`, mensagem: motivo }, 2800);
}

/* ───────────── Moderação ───────────── */

export const MOTIVOS_REMOCAO = ["Bullying ou ofensa", "Assédio", "Conteúdo inadequado", "Spam ou golpe", "Fora do contexto escolar", "Outro"] as const;

/**
 * Decisão humana sobre uma publicação sinalizada ou denunciada. Remover exige motivo.
 * `origem` registra onde a decisão foi tomada: na fila da Moderação (padrão) ou direto no feed (`removerPublicacao`).
 */
export function moderarPost(postId: string, decisao: DecisaoModeracao, motivo?: string, origem: NonNullable<RegistroModeracao["origem"]> = "fila") {
  relerSeOutraJanelaGravou();
  const post = obterEstado().posts.find((p) => p.id === postId);
  if (!post) return;
  // Pela fila, só decide o que ainda aguarda revisão: o 2º clique (ou a outra aba) não registra outra decisão.
  if (origem === "fila" && !post.emRevisao && !post.denuncia) return;
  const limpo = motivo?.trim();
  if (decisao === "removido" && !limpo) return;
  const prof = professorId();
  const sala = post.origemSala;
  commit({ type: "moderarPost", postId, decisao });
  commit({
    type: "registrarModeracao",
    registro: {
      id: gerarId("mod"),
      postId,
      decisao,
      decididoPor: prof,
      em: Date.now(),
      motivo: limpo,
      autorId: post.autorId,
      texto: post.texto,
      origem,
      ...(sala ? { salaId: sala.salaId } : {}),
    },
  });
  // Aviso retido que foi liberado: só agora os alunos do destino são notificados (a publicação normal já notifica).
  if (decisao === "aprovado" && post.tipo === "aviso" && post.emRevisao && !sala) notificarAviso(post);
  if (post.autorId !== prof) {
    const removido = decisao === "removido";
    notificar(post.autorId, {
      tipo: "moderacao",
      titulo: sala ? (removido ? "Sua mensagem na sala foi removida" : "Sua mensagem na sala foi liberada") : removido ? "Sua publicação foi removida" : "Sua publicação foi liberada",
      texto: removido ? `Motivo: ${limpo}` : sala ? `Depois da revisão, ela foi publicada na sala “${sala.salaNome}”.` : "Depois da revisão, ela voltou a aparecer no feed.",
      href: removido ? undefined : sala ? `/estudos/salas/${sala.salaId}` : "/feed",
      deId: prof,
    });
  }
  const alvo = sala ? "Mensagem" : "Publicação";
  toast(
    decisao === "aprovado"
      ? { tipo: "info", titulo: `${alvo} liberada`, mensagem: sala ? "Ela foi publicada na sala e o autor recebeu a notificação." : "Ela volta a aparecer no feed e o autor recebeu a notificação." }
      : { tipo: "alerta", titulo: `${alvo} removida`, mensagem: "O autor recebeu a notificação com o motivo." },
    2800,
  );
}

/**
 * Professor remove do feed a publicação de um aluno (menu "Remover publicação"): é a mesma decisão da Moderação
 * (`moderarPost` "removido", o autor é notificado com o motivo) registrada com `origem: "feed"`. Posts de professor e da
 * coordenação não se removem por aqui.
 */
export function removerPublicacao(postId: string, motivo: string) {
  if (papelAtual() !== "professor") return;
  const { posts, pessoas } = obterEstado();
  const post = posts.find((p) => p.id === postId);
  if (!post || pessoas[post.autorId]?.papel !== "aluno") return;
  moderarPost(postId, "removido", motivo, "feed");
}

/** Coordenação valida ou recusa um relato; a aluna recebe a recompensa e a notificação. */
export function validarRelato(id: string, aprovado: boolean) {
  const estado = obterEstado();
  const relato = estado.relatos.find((r) => r.id === id);
  if (!relato || relato.status !== "em análise") return;
  const prof = professorId();
  commit({ type: "decidirRelato", id, aprovado, em: Date.now(), por: prof });
  // Com backend, os +30 pontos são creditados pelo servidor (PUT /moderacao/relatos/{id}).
  if (aprovado && MODO_API === "mock") premiar(30, 0, "seu relato foi validado pela coordenação", undefined, !ehAluno());
  notificar(estado.usuario.id, {
    tipo: "moderacao",
    titulo: aprovado ? "Seu relato foi validado" : "Seu relato não foi aceito",
    texto: aprovado ? "A coordenação validou: +30 pontos." : `A coordenação analisou o relato (${relato.categoria}) e não o validou.`,
    href: "/missoes",
    deId: prof,
  });
  toast(aprovado ? { tipo: "ganho", titulo: "Relato validado", mensagem: "+30 pontos para a aluna." } : { tipo: "info", titulo: "Relato recusado", mensagem: "O resultado foi enviado como notificação." }, 2600);
}

/* ───────────── Trocas da loja ───────────── */

/** Marca a recompensa como entregue e avisa a aluna. */
export function marcarTrocaEntregue(compraId: string, nomeItem: string) {
  const estado = obterEstado();
  const compra = estado.compras.find((c) => c.id === compraId);
  if (!compra || compra.entregueEm) return;
  commit({ type: "entregarCompra", id: compraId, em: Date.now() });
  notificar(estado.usuario.id, { tipo: "sistema", titulo: "Recompensa entregue", texto: `${nomeItem} foi entregue. Aproveite!`, href: "/loja", deId: professorId() });
  toast({ tipo: "info", titulo: "Marcada como entregue", mensagem: `Notificação enviada para ${primeiroNome(estado.usuario.nome)}.` }, 2400);
}
