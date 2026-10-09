/**
 * Busca por semelhança (US02/US03), 100% local.
 *
 * Cada texto vira um vetor de palavras (com radicalização leve) mais "conceitos": um mapa de
 * assuntos por disciplina em que palavras diferentes ("reta", "coeficiente", "inclinação")
 * ativam o mesmo conceito. A semelhança é o cosseno entre os vetores, então dúvidas sobre o
 * mesmo assunto se encontram mesmo sem repetir termos. O mapa cobre as 8 disciplinas.
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
  /* Matemática (9º ano / EM) */
  geometria: {
    termos: ["triangulo", "pitagoras", "hipotenusa", "cateto", "area", "perimetro", "circulo", "circunferencia", "angulo", "semelhanca", "tales", "volume", "prisma", "cilindro", "teorema"],
    disciplina: "Matemática",
    tag: "geometria",
  },
  trigonometria: {
    termos: ["seno", "cosseno", "tangente", "trigonometria", "trigonometrica", "radiano", "hipotenusa", "angulo"],
    disciplina: "Matemática",
    tag: "trigonometria",
  },
  funcaoquadratica: {
    termos: ["quadratica", "parabola", "vertice", "discriminante", "delta", "bhaskara", "concavidade", "segundo", "grau"],
    disciplina: "Matemática",
    tag: "funcaoquadratica",
  },
  probabilidade: {
    termos: ["probabilidade", "chance", "combinacao", "permutacao", "arranjo", "fatorial", "media", "mediana", "moda", "estatistica", "porcentagem", "juros"],
    disciplina: "Matemática",
    tag: "probabilidade",
  },
  /* Biologia */
  genetica: {
    termos: ["genetica", "gene", "alelo", "dominante", "recessivo", "mendel", "dna", "rna", "heredograma", "fenotipo", "genotipo", "hereditariedade", "mutacao", "proteina"],
    disciplina: "Biologia",
    tag: "genetica",
  },
  ecologia: {
    termos: ["ecologia", "ecossistema", "cadeia", "alimentar", "produtor", "consumidor", "decompositor", "populacao", "habitat", "nicho", "fotossintese", "respiracao", "evolucao", "selecao", "natural"],
    disciplina: "Biologia",
    tag: "ecologia",
  },
  /* História */
  brasilhistoria: {
    termos: ["colonia", "colonial", "imperio", "republica", "escravidao", "abolicao", "independencia", "getulio", "vargas", "ditadura", "constituicao", "bandeirantes", "capitania"],
    disciplina: "História",
    tag: "brasilhistoria",
  },
  revolucoes: {
    termos: ["revolucao", "francesa", "industrial", "iluminismo", "absolutismo", "feudalismo", "renascimento", "guerra", "fria", "nazismo", "fascismo", "segunda", "holocausto"],
    disciplina: "História",
    tag: "revolucoes",
  },
  /* Português */
  gramatica: {
    termos: ["sujeito", "predicado", "verbo", "substantivo", "adjetivo", "oracao", "concordancia", "crase", "acentuacao", "pontuacao", "virgula", "regencia", "pronome", "sintaxe", "coordenada", "subordinada"],
    disciplina: "Português",
    tag: "gramatica",
  },
  redacao: {
    termos: ["redacao", "dissertacao", "argumentativa", "tese", "argumento", "coesao", "coerencia", "introducao", "conclusao", "enem", "proposta", "intervencao", "texto", "paragrafo"],
    disciplina: "Português",
    tag: "redacao",
  },
  literatura: {
    termos: ["literatura", "romantismo", "realismo", "modernismo", "machado", "assis", "poema", "poesia", "romance", "narrador", "personagem", "barroco", "naturalismo", "vidas", "secas"],
    disciplina: "Português",
    tag: "literatura",
  },
  /* Química */
  tabelaperiodica: {
    termos: ["tabela", "periodica", "elemento", "eletronegatividade", "ligacao", "ionica", "covalente", "metalica", "eletron", "proton", "neutron", "valencia", "distribuicao", "eletronica", "ion"],
    disciplina: "Química",
    tag: "tabelaperiodica",
  },
  solucoes: {
    termos: ["solucao", "concentracao", "molaridade", "soluto", "solvente", "diluicao", "ph", "titulacao", "estequiometria", "gas", "gases", "organica", "hidrocarboneto"],
    disciplina: "Química",
    tag: "solucoes",
  },
  /* Física */
  dinamica: {
    termos: ["inercia", "atrito", "peso", "massa", "tracao", "normal", "lei", "leis", "trabalho", "energia", "potencia", "cinetica", "potencial", "impulso", "momento", "queda", "gravidade"],
    disciplina: "Física",
    tag: "dinamica",
  },
  eletricidade: {
    termos: ["corrente", "tensao", "voltagem", "resistencia", "resistor", "ohm", "circuito", "carga", "eletrica", "potencia", "campo", "magnetico", "ima", "lampada", "serie", "paralelo"],
    disciplina: "Física",
    tag: "eletricidade",
  },
  ondulatoria: {
    termos: ["onda", "frequencia", "comprimento", "som", "luz", "refracao", "reflexao", "lente", "espelho", "optica", "calor", "temperatura", "termica", "dilatacao", "termodinamica"],
    disciplina: "Física",
    tag: "ondulatoria",
  },
  /* Geografia */
  geopolitica: {
    termos: ["geopolitica", "fronteira", "pais", "continente", "onu", "uniao", "europeia", "migracao", "imigrante", "refugiado", "capitalismo", "socialismo", "blocos", "economico", "comercio", "industrializacao"],
    disciplina: "Geografia",
    tag: "geopolitica",
  },
  ambiente: {
    termos: ["aquecimento", "global", "desmatamento", "poluicao", "sustentavel", "sustentabilidade", "amazonia", "cerrado", "pantanal", "agua", "hidrografia", "bacia", "rio", "clima", "chuva", "energia"],
    disciplina: "Geografia",
    tag: "meioambiente",
  },
  /* Inglês */
  gramaticaingles: {
    termos: ["will", "going", "would", "could", "should", "conditional", "if", "passive", "voice", "modal", "preposition", "article", "plural", "comparative", "superlative", "future", "continuous", "grammar"],
    disciplina: "Inglês",
    tag: "englishgrammar",
  },
  vocabularioingles: {
    termos: ["word", "meaning", "translate", "traducao", "phrasal", "idiom", "expression", "listening", "reading", "writing", "speaking", "pronunciation", "english"],
    disciplina: "Inglês",
    tag: "vocabulary",
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

export interface ResultadoPalavras extends ResultadoBusca {
  /** Quantas palavras da busca aparecem no texto ou nas tags. */
  casadas: number;
  /** Quantas palavras a busca tem (as que contam). */
  total: number;
}

/**
 * Plano B da busca por significado (tela 74): só palavras. Conta as palavras da consulta (≥ 3 letras,
 * sem acento nem caixa, fora as comuns como "para" e "como") que aparecem no texto ou nas tags;
 * ordena por quantas casaram e, no empate, pelo mais recente.
 */
export function buscarPorPalavras(consulta: string, posts: Post[], opcoes?: { limite?: number }): ResultadoPalavras[] {
  const palavras = [...new Set(normalizar(consulta).split(/[^a-z0-9]+/).filter((p) => p.length >= 3 && !STOPWORDS.has(p)))];
  if (!palavras.length) return [];
  const { limite = 8 } = opcoes ?? {};
  return posts
    .filter((p) => !p.emRevisao)
    .map((post) => {
      const alvo = normalizar(`${post.texto} ${post.tags.join(" ")}`);
      const casadas = palavras.filter((p) => alvo.includes(p)).length;
      return { post, casadas, total: palavras.length, score: casadas / palavras.length };
    })
    .filter((r) => r.casadas > 0)
    .sort((a, b) => b.casadas - a.casadas || b.post.criadoEm - a.post.criadoEm)
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
