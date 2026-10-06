/**
 * Atividades do professor: publicar, entregar (aluna), corrigir com nota,
 * pontos proporcionais e notificações nos dois sentidos.
 */
import { alunosDaTurma } from "@/data/turmas";
import type { Disciplina } from "@/data/escola";
import { lerSessao } from "@/lib/auth";
import { gerarId, primeiroNome } from "@/lib/format";
import { commit, ehAluno, notificar, premiar } from "../nucleo";
import { obterEstado } from "../store";
import type { Anexo, Atividade, TipoAtividade } from "../types";
import { toast } from "../ui";
import { lembrarAlunos } from "./professor";

function atividade(id: string) {
  return obterEstado().atividades.find((a) => a.id === id);
}

/** A aluna entrega a atividade (texto e/ou arquivo real). O professor é notificado. */
export function entregarAtividade(atividadeId: string, resposta: string, anexo?: Anexo) {
  const a = atividade(atividadeId);
  const { usuario } = obterEstado();
  if (!a) return;
  commit({ type: "atualizarEntrega", atividadeId, alunoId: usuario.id, dados: { status: "entregue", entregueEm: Date.now(), resposta: resposta.trim() || undefined, anexo } });
  toast({ tipo: "info", titulo: "Atividade entregue!", mensagem: `${a.titulo} · o professor vai corrigir e os pontos chegam com a nota.` }, 3600);
  notificar(a.professorId, {
    tipo: "entrega",
    titulo: `${primeiroNome(usuario.nome)} entregou uma atividade`,
    texto: a.titulo,
    href: `/professor/atividades/${a.id}`,
    deId: usuario.id,
  });
}

export interface NovaAtividade {
  titulo: string;
  descricao: string;
  tipo: TipoAtividade;
  disciplina: Disciplina;
  turma: string;
  prazo: number;
  pontos: number;
  xp: number;
  /** Arquivo real (ou PDF gerado da descrição) que os alunos baixam. */
  anexo?: Anexo;
}

/** Professor publica uma atividade para uma turma. As entregas chegam só quando os alunos entregam. */
export function criarAtividade(dados: NovaAtividade) {
  const professorId = lerSessao()?.usuarioId ?? "prof_ricardo";
  const alunos = alunosDaTurma(dados.turma);
  const nova: Atividade = {
    id: gerarId("at"),
    titulo: dados.titulo.trim(),
    descricao: dados.descricao.trim(),
    tipo: dados.tipo,
    disciplina: dados.disciplina,
    professorId,
    turma: dados.turma,
    criadaEm: Date.now(),
    prazo: dados.prazo,
    pontos: dados.pontos,
    xp: dados.xp,
    anexo: dados.anexo,
    entregas: alunos.map((al) => ({ alunoId: al.id, status: "pendente" as const })),
  };
  commit({ type: "criarAtividade", atividade: nova });
  toast({ tipo: "info", titulo: "Atividade publicada", mensagem: `${dados.turma} · ${alunos.length} alunos avisados.` }, 3200);

  const aluna = obterEstado().usuario;
  if (dados.turma === aluna.turma) {
    notificar(aluna.id, {
      tipo: "atividade",
      titulo: `Nova atividade de ${dados.disciplina}`,
      texto: `${obterEstado().pessoas[professorId]?.nome ?? "Seu professor"} publicou “${nova.titulo}”.`,
      href: "/missoes#atividades",
      deId: professorId,
    });
  }

  return nova.id;
}

/** Corrige uma entrega: nota 0–10, recompensa proporcional à nota e aviso ao aluno. */
export function corrigirEntrega(atividadeId: string, alunoId: string, nota: number, feedback: string) {
  const a = atividade(atividadeId);
  if (!a) return;
  const n = Math.max(0, Math.min(10, nota));
  const pontos = Math.round((a.pontos * n) / 10);
  const xp = Math.round((a.xp * n) / 10);
  commit({ type: "atualizarEntrega", atividadeId, alunoId, dados: { status: "corrigida", nota: n, feedback: feedback.trim() || undefined, pontos, xp } });

  const { usuario, pessoas } = obterEstado();
  if (alunoId === usuario.id) {
    premiar(pontos, xp, `nota ${n.toLocaleString("pt-BR")} em “${a.titulo}”`, a.disciplina, !ehAluno());
    notificar(usuario.id, {
      tipo: "correcao",
      titulo: `${a.titulo.split("—")[0].trim()} corrigida · nota ${n.toLocaleString("pt-BR")}`,
      texto: `+${pontos} pontos e +${xp} XP${feedback.trim() ? ` · “${feedback.trim()}”` : ""}`,
      href: "/missoes#atividades",
      deId: a.professorId,
    });
  } else {
    commit({ type: "atribuir", atribuicao: { id: gerarId("atr"), professorId: a.professorId, alunoId, pontos, xp, motivo: `Correção: ${a.titulo}`, criadoEm: Date.now() } });
  }
  if (!ehAluno()) toast({ tipo: "xp", titulo: `Nota ${n.toLocaleString("pt-BR")} enviada`, mensagem: `${pessoas[alunoId]?.nome ?? "Aluno"} recebe +${pontos} pontos e +${xp} XP.` }, 2800);
}

/** Corrige de uma vez todas as entregas ainda sem nota (útil na apresentação). */
export function corrigirTodas(atividadeId: string, nota: number, feedback = "") {
  const a = atividade(atividadeId);
  if (!a) return 0;
  const pendentes = a.entregas.filter((e) => e.status === "entregue");
  for (const e of pendentes) corrigirEntrega(atividadeId, e.alunoId, nota, feedback);
  return pendentes.length;
}

/** Lembra quem ainda não entregou. */
export function lembrarPendentes(atividadeId: string) {
  const a = atividade(atividadeId);
  if (!a) return;
  const pendentes = a.entregas.filter((e) => e.status === "pendente").map((e) => e.alunoId);
  if (!pendentes.length) {
    toast({ tipo: "info", titulo: "Ninguém pendente nesta atividade" }, 2200);
    return;
  }
  // Notificação real para cada aluno pendente (respeita a trava de 6 h por aluno).
  const enviados = lembrarAlunos(pendentes, { tipo: "atividade", titulo: "Lembrete de atividade", texto: `“${a.titulo}” ainda está pendente.`, href: "/missoes#atividades" });
  if (!enviados) toast({ tipo: "info", titulo: "Todos já foram lembrados nas últimas 6 horas" }, 2600);
}

export function excluirAtividade(id: string) {
  commit({ type: "removerAtividade", id });
  toast({ tipo: "info", titulo: "Atividade excluída" }, 2200);
}
