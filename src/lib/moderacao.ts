/**
 * Triagem de denúncias e moderação (EP03 — US05/US06) por regras de palavras-chave.
 *
 * Regra do épico: a IA NÃO decide se a denúncia é verdadeira e NÃO pune.
 * Ela só classifica (contando sinais no texto), prioriza e encaminha para revisão humana da coordenação.
 */
import { normalizar } from "./format";

export const MOTIVOS_DENUNCIA = ["Bullying", "Ofensa", "Assédio", "Conteúdo inadequado", "Spam ou golpe", "Outro"] as const;
export type MotivoDenuncia = (typeof MOTIVOS_DENUNCIA)[number];

const SINAIS: Record<Exclude<MotivoDenuncia, "Outro">, string[]> = {
  Bullying: ["zoar", "zoando", "ninguem gosta", "excluir", "gordo", "gorda", "esquisito", "esquisita", "perdedor", "apelido", "rir de"],
  Ofensa: ["idiota", "burro", "burra", "otario", "otaria", "imbecil", "lixo", "cala a boca", "ridiculo", "ridicula", "retardado"],
  Assédio: ["manda foto", "me passa seu numero", "gostosa", "gostoso", "vem no privado", "segredo nosso"],
  "Conteúdo inadequado": ["arma", "droga", "bebida", "cigarro", "violencia", "sangue"],
  "Spam ou golpe": ["pix", "sorteio", "clique aqui", "link", "ganhe", "promocao", "renda extra"],
};

const PRIORIDADE: Record<MotivoDenuncia, "alta" | "média" | "baixa"> = {
  Assédio: "alta",
  Bullying: "alta",
  Ofensa: "média",
  "Conteúdo inadequado": "média",
  "Spam ou golpe": "baixa",
  Outro: "baixa",
};

function contarSinais(texto: string) {
  const t = normalizar(texto);
  const pontos = new Map<MotivoDenuncia, number>();
  for (const [motivo, termos] of Object.entries(SINAIS) as [MotivoDenuncia, string[]][]) {
    const hits = termos.filter((termo) => t.includes(termo)).length;
    if (hits) pontos.set(motivo, hits);
  }
  return pontos;
}

export interface Triagem {
  categoria: MotivoDenuncia;
  prioridade: "alta" | "média" | "baixa";
  confianca: number;
  fila: string;
}

/** Classifica a denúncia combinando o motivo escolhido com o texto analisado. */
export function triarDenuncia(motivoInformado: MotivoDenuncia, textoPost: string, descricao: string): Triagem {
  const sinais = contarSinais(`${textoPost} ${descricao}`);
  sinais.set(motivoInformado, (sinais.get(motivoInformado) ?? 0) + 1.5);
  const [categoria, peso] = [...sinais.entries()].sort((a, b) => b[1] - a[1])[0];
  const total = [...sinais.values()].reduce((a, b) => a + b, 0);
  const confianca = Math.min(0.96, 0.45 + (peso / total) * 0.35 + Math.min(peso, 3) * 0.05);
  return {
    categoria,
    prioridade: PRIORIDADE[categoria],
    confianca,
    fila: categoria === "Spam ou golpe" ? "Fila de conteúdo" : "Fila da coordenação pedagógica",
  };
}

/** US06 — sinaliza publicações potencialmente ofensivas antes de irem ao feed. */
export function verificarPublicacao(texto: string) {
  const sinais = contarSinais(texto);
  const graves = ["Ofensa", "Bullying", "Assédio"] as MotivoDenuncia[];
  const motivo = graves.find((m) => sinais.has(m));
  return motivo ? { sinalizado: true as const, motivo } : { sinalizado: false as const };
}
