/**
 * Infraestrutura comum das ações: commit (reducer + conquistas + sincronização),
 * eventos agendados da demo, premiação e notificações.
 */
import { sincronizar } from "@/api/sync";
import type { Disciplina } from "@/data/escola";
import { lerSessao } from "@/lib/auth";
import { gerarId } from "@/lib/format";
import { medalhasConquistadas, nivelDe } from "@/lib/gamificacao";
import type { Acao } from "./reducer";
import { despachar, obterEstado } from "./store";
import type { Notificacao } from "./types";
import { TOAST_DA_NOTIFICACAO, celebrar, toast } from "./ui";

/** Invalida eventos agendados quando a demonstração é reiniciada. */
let epoca = 0;

export function novaEpoca() {
  epoca++;
}

export function agendar(ms: number, fn: () => void) {
  const minhaEpoca = epoca;
  setTimeout(() => {
    if (minhaEpoca === epoca) fn();
  }, ms);
}

/** Quem está usando o app nesta aba (cada aba tem a sua sessão). */
export function papelAtual() {
  return lerSessao()?.papel ?? "aluno";
}

export function ehAluno() {
  return papelAtual() === "aluno";
}

export function commit(acao: Acao) {
  const antes = obterEstado();
  const depois = despachar(acao);
  if (depois !== antes) {
    sincronizar(acao);
    verificarConquistas(antes.usuario.xp, depois.usuario.xp);
  }
  return depois;
}

function verificarConquistas(xpAntes: number, xpDepois: number) {
  // Comemorações são da aluna: não aparecem na tela do professor.
  const mostrar = ehAluno();
  const nivelAntes = nivelDe(xpAntes);
  const nivelDepois = nivelDe(xpDepois);
  if (nivelDepois.n > nivelAntes.n && mostrar) {
    toast({ tipo: "nivel", titulo: `Você chegou ao nível ${nivelDepois.n} · ${nivelDepois.titulo}`, mensagem: "Nível só sobe com mérito acadêmico." }, 4200);
    celebrar();
  }
  for (const def of medalhasConquistadas(obterEstado())) {
    despachar({ type: "desbloquearMedalha", id: def.id, em: Date.now() });
    if (mostrar) {
      toast({ tipo: "medalha", titulo: `Medalha desbloqueada: ${def.nome}`, mensagem: def.criterio }, 4200);
      celebrar();
    }
  }
}

function descreverGanho(pontos: number, xp: number) {
  const partes: string[] = [];
  if (pontos > 0) partes.push(`+${pontos} pontos`);
  if (xp > 0) partes.push(`+${xp} XP`);
  return partes.join(" e ");
}

/** Dá pontos/XP à aluna. Com `silencioso`, não mostra toast (ex.: professor premiando). */
export function premiar(pontos: number, xp: number, motivo: string, disciplina?: Disciplina, silencioso = false) {
  if (pontos <= 0 && xp <= 0) return;
  commit({ type: "premiar", pontos, xp, disciplina });
  if (!silencioso && ehAluno()) toast({ tipo: xp > 0 && !pontos ? "xp" : "ganho", titulo: descreverGanho(pontos, xp), mensagem: motivo });
}

export function pessoa(id: string) {
  return obterEstado().pessoas[id];
}

/**
 * Cria uma notificação para `para`. Se essa pessoa é quem está logada agora,
 * ela também aparece como toast (tocável quando tem destino).
 */
export function notificar(para: string, n: Omit<Notificacao, "id" | "para" | "criadoEm" | "lida">, comToast = true) {
  commit({ type: "notificar", notificacao: { ...n, id: gerarId("n"), para, criadoEm: Date.now(), lida: false } });
  if (comToast && lerSessao()?.usuarioId === para) {
    toast({ tipo: TOAST_DA_NOTIFICACAO[n.tipo], titulo: n.titulo, mensagem: n.texto, href: n.href }, 4200);
  }
}
