/** PDFs reais das atividades: correção (aluna) e relatório (professor). */
import { ESCOLA } from "@/data/escola";
import { baixarArquivo, gerarPdfDocumento, type Bloco } from "@/lib/pdf";
import { fmt } from "@/lib/format";
import { dataCurta } from "@/lib/tempo";
import type { Atividade, Entrega, Pessoa } from "@/store/types";
import { contarEntregas, fmtNota, lerResposta } from "./comum";

function abrirBlob(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  if (!window.open(url, "_blank")) {
    URL.revokeObjectURL(url);
    baixarArquivo(blob, nome);
    return;
  }
  setTimeout(() => URL.revokeObjectURL(url), 5 * 60_000);
}

function slugArq(t: string) {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40) || "atividade";
}

/** PDF da correção: nota, comentário do professor, enunciado e a resposta enviada. */
export function pdfCorrecao(a: Atividade, e: Entrega, aluno?: Pessoa, professor?: Pessoa) {
  const nota = e.nota ?? 0;
  const blocos: Bloco[] = [
    { tipo: "quadro", titulo: `Nota ${fmtNota(nota)} de 10`, texto: `+${fmt(e.pontos ?? Math.round((a.pontos * nota) / 10))} pontos e +${fmt(e.xp ?? Math.round((a.xp * nota) / 10))} XP, proporcionais à nota.` },
    { tipo: "secao", texto: "Comentário do professor" },
    { tipo: "paragrafo", texto: e.feedback?.trim() || "Corrigida sem comentário escrito." },
    { tipo: "secao", texto: "Descrição e orientações da atividade" },
    { tipo: "paragrafo", texto: a.descricao },
  ];
  const lida = lerResposta(e.resposta);
  const resposta = lida.texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  blocos.push({ tipo: "secao", texto: "Sua entrega" });
  if (resposta.length) resposta.forEach((l) => blocos.push({ tipo: "paragrafo", texto: l }));
  if (e.anexo) blocos.push({ tipo: "paragrafo", texto: `Arquivo enviado: ${e.anexo.nome} (${e.anexo.tamanho}).` });
  else if (lida.anexo) blocos.push({ tipo: "paragrafo", texto: `Arquivo enviado: ${lida.anexo}.` });
  if (!resposta.length && !e.anexo && !lida.anexo) {
    blocos.push({ tipo: "paragrafo", texto: e.entregueEm ? `Entrega registrada em ${dataCurta(e.entregueEm)}.` : "Entrega registrada pelo professor." });
  }
  return gerarPdfDocumento({
    escola: ESCOLA.nome,
    titulo: `Correção: ${a.titulo}`,
    subtitulo: [a.disciplina, aluno?.nome, professor?.nome, e.entregueEm ? `Entregue em ${dataCurta(e.entregueEm)}` : undefined].filter(Boolean).join(" · "),
    blocos,
  });
}

export function abrirCorrecao(a: Atividade, e: Entrega, aluno?: Pessoa, professor?: Pessoa) {
  abrirBlob(pdfCorrecao(a, e, aluno, professor).blob, `correcao-${slugArq(a.titulo)}.pdf`);
}

const SITUACAO: Record<Entrega["status"], string> = { pendente: "Pendente", entregue: "Aguardando nota", corrigida: "Corrigida" };

/** Relatório da atividade para o professor: totais, média e lista por aluno. */
export function baixarRelatorioAtividade(a: Atividade, pessoas: Record<string, Pessoa>) {
  const c = contarEntregas(a.entregas);
  const notas = a.entregas.filter((e) => e.status === "corrigida" && e.nota !== undefined).map((e) => e.nota as number);
  const media = notas.length ? fmtNota(Math.round((notas.reduce((s, n) => s + n, 0) / notas.length) * 10) / 10) : "—";
  const nome = (id: string) => pessoas[id]?.nome ?? "Aluno";
  const linhas = [...a.entregas]
    .sort((x, y) => nome(x.alunoId).localeCompare(nome(y.alunoId), "pt-BR"))
    .map((e) => [nome(e.alunoId), SITUACAO[e.status], e.entregueEm ? dataCurta(e.entregueEm) : "—", e.nota !== undefined ? fmtNota(e.nota) : "—"]);
  const { blob } = gerarPdfDocumento({
    escola: ESCOLA.nome,
    titulo: `Relatório: ${a.titulo}`,
    subtitulo: `${a.disciplina} · Turma ${a.turma} · prazo ${dataCurta(a.prazo)}`,
    blocos: [
      { tipo: "tabela", colunas: ["Entregues", "Corrigidas", "Pendentes", "Média"], linhas: [[String(c.enviadas), String(c.corrigidas), String(c.pendentes), media]] },
      { tipo: "secao", texto: "Situação por aluno" },
      { tipo: "tabela", colunas: ["Aluno", "Situação", "Entrega", "Nota"], linhas, larguras: [0.4, 0.26, 0.2, 0.14] },
    ],
  });
  baixarArquivo(blob, `relatorio-${slugArq(a.titulo)}.pdf`);
}

/** Planilha de notas (CSV). */
export function linhasDeNotas(a: Atividade, pessoas: Record<string, Pessoa>) {
  return [...a.entregas]
    .sort((x, y) => (pessoas[x.alunoId]?.nome ?? "").localeCompare(pessoas[y.alunoId]?.nome ?? "", "pt-BR"))
    .map((e) => [
      pessoas[e.alunoId]?.nome ?? "Aluno",
      a.turma,
      SITUACAO[e.status],
      e.entregueEm ? new Date(e.entregueEm).toLocaleString("pt-BR") : "",
      e.nota ?? "",
      e.pontos ?? "",
      e.xp ?? "",
      e.feedback ?? "",
    ]);
}
export const CABECALHO_NOTAS = ["Aluno", "Turma", "Situação", "Entregue em", "Nota", "Pontos", "XP", "Feedback"];
export { slugArq };
