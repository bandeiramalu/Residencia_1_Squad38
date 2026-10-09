/**
 * PDFs dos anexos (materiais do feed, atividades e entregas). Implementação: equipe A5.
 * Assinaturas estáveis — outras telas já podem importar.
 */
import { ESCOLA } from "@/data/escola";
import { disciplinaDoNome, guiaDaDisciplina, MATERIAIS, type ConteudoMaterial } from "@/data/materiais";
import { abrirArquivo, baixarArquivoSalvo } from "./arquivos";
import { toast } from "@/store/ui";
import type { Anexo } from "@/store/types";
import { baixarArquivo, gerarPdfDocumento, type Bloco, type Documento, type PdfGerado } from "./pdf";

export interface ContextoAnexo {
  /** Título exibido no PDF quando não há conteúdo cadastrado para o arquivo. */
  titulo?: string;
  autor?: string;
  disciplina?: string;
  /** Texto livre (ex.: resposta do aluno numa entrega). Quando presente, gera o PDF da entrega. */
  texto?: string;
  /** Descrição da atividade (cabeçalho do PDF da entrega ou do anexo sem conteúdo cadastrado). */
  descricao?: string;
  /** Data já formatada exibida no subtítulo. */
  data?: string;
}

export interface PreviaAnexo {
  titulo: string;
  /** Títulos das seções do documento. */
  topicos: string[];
  /** Primeiro parágrafo do documento. */
  resumo: string;
}

function conteudoDe(nome: string): ConteudoMaterial | undefined {
  const fixo = MATERIAIS[nome];
  if (fixo) return fixo;
  const disciplina = disciplinaDoNome(nome);
  return disciplina ? guiaDaDisciplina(disciplina) : undefined;
}

function dataHoje() {
  return new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "");
}

function montar(nome: string, ctx: ContextoAnexo): Documento {
  const escola = `${ESCOLA.nome}`;
  const data = ctx.data ?? dataHoje();
  const partes = (...p: (string | undefined)[]) => p.filter(Boolean).join(" · ");

  if (ctx.texto !== undefined) {
    const respostas: Bloco[] = ctx.texto
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => ({ tipo: "paragrafo", texto: l }));
    return {
      escola,
      titulo: `Entrega: ${ctx.titulo ?? "Atividade"}`,
      subtitulo: partes(ctx.disciplina, ctx.autor, data),
      blocos: [
        ...(ctx.descricao ? ([{ tipo: "secao", texto: "Enunciado" }, { tipo: "paragrafo", texto: ctx.descricao }] as Bloco[]) : []),
        { tipo: "secao", texto: "Resposta do aluno" },
        ...(respostas.length ? respostas : [{ tipo: "paragrafo", texto: "Entrega enviada apenas com arquivo anexo." } as Bloco]),
        { tipo: "quadro", titulo: "Situação", texto: `Entregue pelo Portal do Aluno em ${data}. Aguardando correção do professor.` },
      ],
    };
  }

  const c = conteudoDe(nome);
  if (c) return { escola, titulo: c.titulo, subtitulo: partes(ctx.disciplina ?? c.disciplina, ctx.autor ?? c.autor, data), blocos: c.blocos };

  // Anexo sem conteúdo cadastrado (ex.: atividade criada pelo professor)
  const titulo = ctx.titulo ?? nome.replace(/\.pdf$/i, "").replace(/[-_]+/g, " ");
  return {
    escola,
    titulo,
    subtitulo: partes(ctx.disciplina, ctx.autor, data),
    blocos: [
      { tipo: "secao", texto: "Enunciado" },
      { tipo: "paragrafo", texto: ctx.descricao ?? "Material de apoio da atividade. Leia com atenção e resolva no caderno." },
      { tipo: "secao", texto: "Como estudar" },
      {
        tipo: "numerada",
        itens: [
          "Leia o enunciado duas vezes e sublinhe os dados importantes.",
          "Resolva primeiro as questões que você já domina.",
          "Registre o raciocínio completo, não apenas a resposta final.",
          "Anote as dúvidas e leve-as para o feed ou para a aula.",
        ],
      },
      { tipo: "quadro", titulo: "Lembre-se", texto: "Entregue dentro do prazo pelo Portal do Aluno para garantir pontos e XP." },
    ],
  };
}

const cache = new Map<string, PdfGerado>();

/** Gera o PDF do anexo (com cache para conteúdos fixos). */
export function gerarAnexo(nome: string, contexto: ContextoAnexo = {}): PdfGerado {
  const fixo = !!conteudoDe(nome) && contexto.texto === undefined;
  const chave = `${nome}|${contexto.disciplina ?? ""}|${contexto.autor ?? ""}`;
  if (fixo) {
    const guardado = cache.get(chave);
    if (guardado) return guardado;
  }
  const pdf = gerarPdfDocumento(montar(nome, contexto));
  if (fixo) cache.set(chave, pdf);
  return pdf;
}

/** Número de páginas e tamanho do PDF gerado (ex.: "34 KB"). */
export function infoDoAnexo(nome: string, contexto: ContextoAnexo = {}) {
  const { paginas, bytes } = gerarAnexo(nome, contexto);
  return { paginas, tamanho: bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1048576).toFixed(1).replace(".", ",")} MB` };
}

/** Título, tópicos e resumo do conteúdo, para a prévia antes de abrir o PDF. */
export function previaDoAnexo(nome: string, contexto: ContextoAnexo = {}): PreviaAnexo {
  const doc = montar(nome, { ...contexto, texto: undefined });
  return {
    titulo: doc.titulo,
    topicos: doc.blocos.flatMap((b) => (b.tipo === "secao" ? [b.texto] : b.tipo === "gabarito" ? [b.titulo ?? "Gabarito"] : [])),
    resumo: doc.blocos.find((b) => b.tipo === "paragrafo")?.texto ?? "",
  };
}

/** Baixa o PDF do anexo `nome` (ex.: "lista-7-funcoes-afins.pdf"). */
export function baixarAnexo(nome: string, contexto: ContextoAnexo = {}) {
  baixarArquivo(gerarAnexo(nome, contexto).blob, nome.toLowerCase().endsWith(".pdf") ? nome : `${nome}.pdf`);
}

/** Abre o PDF do anexo numa nova aba (visualizador do navegador); se bloqueado, baixa. */
export function abrirAnexo(nome: string, contexto: ContextoAnexo = {}) {
  const { blob } = gerarAnexo(nome, contexto);
  const url = URL.createObjectURL(blob);
  const aba = window.open(url, "_blank");
  if (!aba) {
    URL.revokeObjectURL(url);
    baixarAnexo(nome, contexto);
    return;
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/* ───────────── Anexos com arquivo real (IndexedDB) ou PDF gerado ───────────── */

const AVISO_SEM_ARQUIVO = { tipo: "alerta" as const, titulo: "Arquivo não encontrado", mensagem: "Ele foi enviado em outro navegador ou os dados do site foram limpos." };

/** Abre o anexo: o arquivo real quando houver `arquivoId`, senão o PDF gerado do conteúdo. */
export async function abrirAnexoDe(anexo: Anexo, contexto: ContextoAnexo = {}) {
  if (!anexo.arquivoId) return abrirAnexo(anexo.nome, contexto);
  if (!(await abrirArquivo(anexo.arquivoId, anexo.nome))) toast(AVISO_SEM_ARQUIVO, 3600);
}

/** Baixa o anexo: o arquivo real quando houver `arquivoId`, senão o PDF gerado do conteúdo. */
export async function baixarAnexoDe(anexo: Anexo, contexto: ContextoAnexo = {}) {
  if (!anexo.arquivoId) return baixarAnexo(anexo.nome, contexto);
  if (!(await baixarArquivoSalvo(anexo.arquivoId, anexo.nome))) toast(AVISO_SEM_ARQUIVO, 3600);
}

/** "PDF", "Imagem", "Documento"… para o rótulo do anexo. */
export function tipoDoAnexo(anexo: Pick<Anexo, "nome" | "mime">) {
  // A extensão manda (o `mime` vem do remetente): só ela libera a prévia embutida (iframe de PDF, <img>).
  const ext = /\.([a-z0-9]+)$/i.exec(anexo.nome)?.[1].toLowerCase();
  if (ext === "pdf") return "PDF";
  if (ext && ["png", "jpg", "jpeg", "webp", "heic"].includes(ext)) return "Imagem";
  if (ext) return ext.length <= 4 ? ext.toUpperCase() : "Arquivo";
  const m = anexo.mime ?? "";
  if (m === "application/pdf") return "PDF";
  if (m.startsWith("image/") && m !== "image/svg+xml") return "Imagem";
  return "Arquivo";
}

/** Resumo exibido: "PDF · 3 págs. · 212 KB" (páginas só quando conhecidas). */
export function resumoDoAnexo(anexo: Anexo, abreviar = false) {
  const tipo = tipoDoAnexo(anexo);
  const pag = tipo === "PDF" && anexo.paginas > 0 ? ` · ${anexo.paginas} ${anexo.paginas === 1 ? (abreviar ? "pág." : "página") : abreviar ? "págs." : "páginas"}` : "";
  return `${tipo}${pag} · ${anexo.tamanho}`;
}
