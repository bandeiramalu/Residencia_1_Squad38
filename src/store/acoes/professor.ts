/**
 * Ações exclusivas do professor: pontos, avisos, lembretes, dúvidas, moderação,
 * relatos à coordenação e trocas da loja. Tudo vira estado persistido e notificação real.
 */
import { ALUNOS_TURMAS } from "@/data/turmas";
import { lerSessao } from "@/lib/auth";
import { gerarId, primeiroNome } from "@/lib/format";
import { commit, ehAluno, notificar, premiar } from "../nucleo";
import { obterEstado } from "../store";
import type { DecisaoModeracao, EspacoId, Notificacao } from "../types";
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

/** Ids dos alunos que recebem um aviso publicado neste espaço. */
export function alunosDoEspaco(espaco: EspacoId) {
  const { pessoas, usuario } = obterEstado();
  const nomeados = Object.values(pessoas).filter((p) => p.papel === "aluno");
  if (espaco === "escola") return [...new Set([...nomeados.map((p) => p.id), ...ALUNOS_TURMAS.map((a) => a.id)])];
  if (espaco === "9A") return [...new Set([...nomeados.filter((p) => p.turma === "9º Ano A").map((p) => p.id), ...ALUNOS_TURMAS.filter((a) => a.turma === "9º Ano A").map((a) => a.id)])];
  return [usuario.id];
}

/** Aviso oficial no feed (fixo como "Aviso") e notificação para cada aluno do espaço. */
export function publicarAviso(texto: string, espaco: EspacoId) {
  const prof = professorId();
  const limpo = texto.trim();
  if (!limpo) return;
  const id = gerarId("p");
  commit({
    type: "publicar",
    post: { id, tipo: "aviso", autorId: prof, espaco, texto: limpo, tags: [], criadoEm: Date.now(), curtidas: 0, curtido: false, salvo: false, respostas: [] },
  });
  const alunos = alunosDoEspaco(espaco);
  notificarTodos(alunos, { tipo: "sistema", titulo: `Aviso de ${nomeDoProfessor()}`, texto: limpo.slice(0, 90), href: `/feed?post=${id}`, deId: prof });
  toast({ tipo: "info", titulo: "Aviso publicado no feed", mensagem: `${alunos.length} ${alunos.length === 1 ? "aluno notificado" : "alunos notificados"}` }, 2600);
}

/* ───────────── Lembretes ───────────── */

export const INTERVALO_LEMBRETE_MS = 6 * 60 * 60 * 1000;

/** Quanto falta para o aluno poder receber outro lembrete (0 = já pode). */
export function liberaLembreteEm(lembradoEm: number | undefined, agora: number) {
  return lembradoEm ? Math.max(0, lembradoEm + INTERVALO_LEMBRETE_MS - agora) : 0;
}

interface OpcoesLembrete {
  titulo?: string;
  texto?: string;
  href?: string;
  tipo?: Notificacao["tipo"];
  /** Ignora a trava de 6 h. */
  forcar?: boolean;
}

/** Lembrete real: notificação persistida para o aluno + `lembradoEm`. Devolve quantos foram enviados. */
export function lembrarAlunos(alunoIds: string[], op: OpcoesLembrete = {}) {
  const agora = Date.now();
  const { lembradoEm = {}, pessoas } = obterEstado();
  const prof = professorId();
  const alvo = [...new Set(alunoIds)].filter((id) => op.forcar || liberaLembreteEm(lembradoEm[id], agora) === 0);
  if (!alvo.length) return 0;
  notificarTodos(alvo, {
    tipo: op.tipo ?? "sistema",
    titulo: op.titulo ?? `${nomeDoProfessor()} sente sua falta nos estudos`,
    texto: op.texto ?? "Que tal uma sessão de foco hoje? Entre na Sala de estudos.",
    href: op.href ?? "/estudos",
    deId: prof,
  });
  commit({ type: "lembrarAlunos", ids: alvo, em: agora });
  const nome = alvo.length === 1 ? primeiroNome(pessoas[alvo[0]]?.nome ?? "") : `${alvo.length} alunos`;
  toast({ tipo: "info", titulo: `Lembrete enviado para ${nome}`, mensagem: "Chega como notificação no portal." }, 2600);
  return alvo.length;
}

/* ───────────── Dúvidas ───────────── */

/** Resposta oficial do professor a uma dúvida; o autor é notificado. */
export function responderDuvida(postId: string, texto: string) {
  const post = obterEstado().posts.find((p) => p.id === postId);
  const limpo = texto.trim();
  if (!post || !limpo) return false;
  const prof = professorId();
  commit({ type: "responder", postId, resposta: { id: gerarId("r"), autorId: prof, texto: limpo, criadoEm: Date.now(), uteis: 0, util: false, oficial: true } });
  if (post.autorId !== prof) {
    notificar(post.autorId, { tipo: "sistema", titulo: `${nomeDoProfessor()} respondeu sua dúvida`, texto: limpo.slice(0, 90), href: `/feed?post=${postId}`, deId: prof });
  }
  toast({ tipo: "info", titulo: "Resposta publicada", mensagem: `${primeiroNome(obterEstado().pessoas[post.autorId]?.nome ?? "O aluno")} foi avisado.` }, 2400);
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
  commit({ type: "atribuir", atribuicao: { id: gerarId("atr"), professorId: prof, alunoId: resposta.autorId, pontos: 25, xp: 25, motivo, criadoEm: Date.now() } });
  if (resposta.autorId === estado.usuario.id) premiar(25, 25, motivo, post.disciplina, !ehAluno());
  notificar(resposta.autorId, { tipo: "pontos", titulo: `${nomeDoProfessor()} marcou sua resposta como útil`, texto: "+25 pontos e +25 XP", href: `/feed?post=${postId}`, deId: prof });
  toast({ tipo: "ganho", titulo: `+25 pontos e +25 XP para ${primeiroNome(estado.pessoas[resposta.autorId]?.nome ?? "")}`, mensagem: motivo }, 2800);
}

/* ───────────── Moderação ───────────── */

export const MOTIVOS_REMOCAO = ["Bullying ou ofensa", "Assédio", "Conteúdo inadequado", "Spam ou golpe", "Fora do contexto escolar", "Outro"] as const;

/** Decisão humana sobre uma publicação sinalizada ou denunciada. Remover exige motivo. */
export function moderarPost(postId: string, decisao: DecisaoModeracao, motivo?: string) {
  const post = obterEstado().posts.find((p) => p.id === postId);
  if (!post) return;
  const limpo = motivo?.trim();
  if (decisao === "removido" && !limpo) return;
  const prof = professorId();
  commit({ type: "moderarPost", postId, decisao });
  commit({
    type: "registrarModeracao",
    registro: { id: gerarId("mod"), postId, decisao, decididoPor: prof, em: Date.now(), motivo: limpo, autorId: post.autorId, texto: post.texto },
  });
  if (post.autorId !== prof) {
    notificar(post.autorId, {
      tipo: "moderacao",
      titulo: decisao === "removido" ? "Sua publicação foi removida" : "Sua publicação foi liberada",
      texto: decisao === "removido" ? `Motivo: ${limpo}` : "Depois da revisão, ela voltou a aparecer no feed.",
      href: decisao === "removido" ? undefined : "/feed",
      deId: prof,
    });
  }
  toast(
    decisao === "aprovado"
      ? { tipo: "info", titulo: "Publicação liberada", mensagem: "Ela volta a aparecer no feed e o autor foi avisado." }
      : { tipo: "alerta", titulo: "Publicação removida", mensagem: "O autor foi avisado com o motivo." },
    2800,
  );
}

/** Coordenação valida ou recusa um relato; a aluna recebe a recompensa e a notificação. */
export function validarRelato(id: string, aprovado: boolean) {
  const estado = obterEstado();
  const relato = estado.relatos.find((r) => r.id === id);
  if (!relato || relato.status !== "em análise") return;
  const prof = professorId();
  commit({ type: "decidirRelato", id, aprovado, em: Date.now(), por: prof });
  if (aprovado) premiar(30, 0, "seu relato foi validado pela coordenação", undefined, !ehAluno());
  notificar(estado.usuario.id, {
    tipo: "moderacao",
    titulo: aprovado ? "Seu relato foi validado" : "Seu relato não foi aceito",
    texto: aprovado ? "A coordenação validou: +30 pontos." : `A coordenação analisou o relato (${relato.categoria}) e não o validou.`,
    href: "/missoes",
    deId: prof,
  });
  toast(aprovado ? { tipo: "ganho", titulo: "Relato validado", mensagem: "+30 pontos para a aluna." } : { tipo: "info", titulo: "Relato recusado", mensagem: "A aluna foi avisada." }, 2600);
}

/* ───────────── Trocas da loja ───────────── */

/** Marca a recompensa como entregue e avisa a aluna. */
export function marcarTrocaEntregue(compraId: string, nomeItem: string) {
  const estado = obterEstado();
  const compra = estado.compras.find((c) => c.id === compraId);
  if (!compra || compra.entregueEm) return;
  commit({ type: "entregarCompra", id: compraId, em: Date.now() });
  notificar(estado.usuario.id, { tipo: "sistema", titulo: "Recompensa entregue", texto: `${nomeItem} foi entregue. Aproveite!`, href: "/loja", deId: professorId() });
  toast({ tipo: "info", titulo: "Marcada como entregue", mensagem: `${primeiroNome(estado.usuario.nome)} foi avisada.` }, 2400);
}
