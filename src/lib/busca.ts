/**
 * Busca semântica simulada (US02/US03).
 *
 * No protótipo, a "semântica" vem de um mapa de conceitos: palavras diferentes
 * que falam do mesmo assunto ("reta", "coeficiente", "inclinação") ativam o
 * mesmo conceito, então dúvidas parecidas se encontram mesmo sem repetir termos.
 * Em produção, este módulo seria trocado por embeddings de um modelo de IA.
 */
import type { Disciplina } from "@/data/escola";
import type { Post } from "@/store/types";
import { normalizar } from "./format";

interface Conceito {
  termos: string[];
  disciplina: Disciplina;
  tag: string;
}

const CONCEITOS: Record<string, Conceito> = {
  funcaoafim: {
    termos: ["funcao", "afim", "reta", "coeficiente", "angular", "linear", "grafico", "inclinacao", "crescente", "decrescente", "desce", "sobe", "ponto", "pontos"],
    disciplina: "Matemática",
    tag: "funcaoafim",
  },
  equacoes: {
    termos: ["equacao", "incognita", "sistema", "isolar", "substituicao", "bhaskara", "raiz"],
    disciplina: "Matemática",
    tag: "equacoes",
  },
  divisaocelular: {
    termos: ["meiose", "mitose", "crossing", "over", "profase", "cromossomo", "homologo", "cromatide", "divisao", "gameta", "haploide", "diploide"],
    disciplina: "Biologia",
    tag: "meiose",
  },
  citologia: {
    termos: ["citologia", "organela", "membrana", "citoplasma", "mitocondria", "ribossomo", "nucleo", "celula", "golgi", "lisossomo"],
    disciplina: "Biologia",
    tag: "citologia",
  },
  primeiraguerra: {
    termos: ["guerra", "primeira", "sarajevo", "estopim", "alianca", "entente", "triplice", "imperialismo", "nacionalismo", "1914", "versalhes", "estrutural", "estruturais"],
    disciplina: "História",
    tag: "primeiraguerra",
  },
  figuras: {
    termos: ["metafora", "comparacao", "figura", "linguagem", "conectivo", "metonimia", "hiperbole", "ironia", "antitese"],
    disciplina: "Português",
    tag: "figurasdelinguagem",
  },
  reacoes: {
    termos: ["balancear", "balanceamento", "reacao", "reagente", "produto", "mol", "acido", "base", "neutralizacao", "formula", "sulfurico", "atomo", "h2o", "quimica"],
    disciplina: "Química",
    tag: "reacoesquimicas",
  },
  cinematica: {
    termos: ["velocidade", "media", "aceleracao", "movimento", "distancia", "deslocamento", "forca", "newton", "km"],
    disciplina: "Física",
    tag: "cinematica",
  },
  geografia: {
    termos: ["clima", "relevo", "urbanizacao", "populacao", "globalizacao", "bioma", "caatinga", "mapa", "escala", "restinga", "mangue"],
    disciplina: "Geografia",
    tag: "biomas",
  },
  ingles: {
    termos: ["present", "perfect", "past", "simple", "verb", "tense", "vocabulary", "ingles", "already", "yet", "ever"],
    disciplina: "Inglês",
    tag: "presentperfect",
  },
};

const STOPWORDS = new Set(
  "a o e de da do das dos em no na nos nas um uma uns umas que por para com sem se ou eu voce ele ela isso esse essa este esta como qual quais quando onde porque por que nao sim mais menos muito pouco ja tem ter ser estar foi era sao sua seu meu minha alguem sobre entre ate ao aos pra pro so tambem mas entao".split(
    " ",
  ),
);

function radical(palavra: string) {
  // Radicalização leve: "coeficientes" → "coeficiente", "reacoes" → "reaca".
  if (palavra.length > 4 && palavra.endsWith("oes")) return palavra.slice(0, -3) + "ao";
  if (palavra.length > 4 && palavra.endsWith("es")) return palavra.slice(0, -2);
  if (palavra.length > 3 && palavra.endsWith("s")) return palavra.slice(0, -1);
  return palavra;
}

export function tokenizar(texto: string) {
  return normalizar(texto)
    .replace(/[₀-₉]/g, (c) => String(c.charCodeAt(0) - 0x2080))
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length > 1 && !STOPWORDS.has(p))
    .map(radical);
}

function conceitosDe(tokens: string[]) {
  const achados = new Map<string, number>();
  for (const [id, c] of Object.entries(CONCEITOS)) {
    const termos = c.termos.map(radical);
    const hits = tokens.filter((t) => termos.includes(t)).length;
    if (hits) achados.set(id, hits);
  }
  return achados;
}

function vetor(texto: string) {
  const tokens = tokenizar(texto);
  const v = new Map<string, number>();
  for (const t of tokens) v.set(t, (v.get(t) ?? 0) + 1);
  // Conceitos pesam mais que palavras soltas: é o que aproxima frases diferentes.
  for (const [id, hits] of conceitosDe(tokens)) v.set(`#${id}`, 2 + hits);
  return v;
}

function cosseno(a: Map<string, number>, b: Map<string, number>) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const [k, x] of a) {
    na += x * x;
    const y = b.get(k);
    if (y) dot += x * y;
  }
  for (const y of b.values()) nb += y * y;
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

export interface ResultadoBusca {
  post: Post;
  score: number;
}

export function buscarSemelhantes(consulta: string, posts: Post[], opcoes?: { limite?: number; minimo?: number; tipo?: Post["tipo"] }) {
  const alvo = vetor(consulta);
  if (!alvo.size) return [];
  const { limite = 5, minimo = 0.18, tipo } = opcoes ?? {};
  return posts
    .filter((p) => !p.emRevisao && (!tipo || p.tipo === tipo))
    .map((post) => {
      const textoPost = [post.texto, post.disciplina ?? "", post.tags.join(" "), ...post.respostas.filter((r) => r.oficial).map((r) => r.texto)].join(" ");
      return { post, score: cosseno(alvo, vetor(textoPost)) };
    })
    .filter((r) => r.score >= minimo)
    .sort((a, b) => b.score - a.score)
    .slice(0, limite);
}

/** Sugere disciplina e tags a partir do texto (US02 — Recomendação). */
export function sugerirCategorias(texto: string) {
  const conceitos = [...conceitosDe(tokenizar(texto)).entries()].sort((a, b) => b[1] - a[1]);
  if (!conceitos.length) return null;
  const principal = CONCEITOS[conceitos[0][0]];
  return {
    disciplina: principal.disciplina,
    tags: conceitos.slice(0, 3).map(([id]) => CONCEITOS[id].tag),
  };
}

/** Extrai #tags digitadas pelo aluno. */
export function extrairTags(texto: string) {
  return [...new Set([...texto.matchAll(/#([\p{L}\d_]+)/gu)].map((m) => normalizar(m[1])))];
}
