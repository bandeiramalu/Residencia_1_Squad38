/**
 * Triagem de denúncias e moderação (EP03 — US05/US06) por regras de palavras-chave.
 *
 * Regra do épico: a IA NÃO decide se a denúncia é verdadeira e NÃO pune.
 * Ela só classifica (contando sinais no texto), prioriza e encaminha para revisão humana da coordenação.
 *
 * Os sinais casam por palavra ou expressão INTEIRA sobre o texto normalizado (sem acento, minúsculo) —
 * nunca por pedaço de palavra: "inferir de" não é "rir de", "armazenar" não é "arma", "excluir x = 2 do
 * domínio" não é bullying. Palavras que também existem em dúvidas legítimas ("lixo" urbano, "burro" de carga,
 * movimento "retardado", "perdedor" do duelo) só contam em expressões dirigidas a alguém ("um lixo,", "seu
 * burro", "você é retardado"). Em dúvida, o sistema NÃO retém: a denúncia manual continua disponível.
 */
import { normalizar } from "./format";

export const MOTIVOS_DENUNCIA = ["Bullying", "Ofensa", "Assédio", "Conteúdo inadequado", "Spam ou golpe", "Outro"] as const;
export type MotivoDenuncia = (typeof MOTIVOS_DENUNCIA)[number];

/* Peças das expressões dirigidas a alguém (texto já normalizado: "você é" → "voce e"). */
const VOCE = String.raw`(?:voce|vc|tu|ce)`;
const VOCES = String.raw`(?:voces|vcs)`;
const SER = String.raw`(?:e|eh|es|ta|esta|so)`;
const INTENSO = String.raw`(?:(?:muito|tao|bem|meio|super|mega|completamente|realmente) )?`;
const TERCEIRA = String.raw`(?:ele|ela|eles|elas|esse|essa|esses|essas|aquele|aquela|aqueles|aquelas)`;

/** "seu X", "sua X", "você é (muito) X", "vocês são X" e, se `terceira`, "ele/ela é X". */
function dirigido(palavra: string, terceira = false): RegExp[] {
  return [
    new RegExp(String.raw`\b(?:seu|sua) ${palavra}\b`),
    new RegExp(String.raw`\b${VOCE} ${SER} (?:um |uma )?${INTENSO}${palavra}\b`),
    new RegExp(String.raw`\b${VOCES} (?:sao|estao) ${INTENSO}${palavra}\b`),
    ...(terceira ? [new RegExp(String.raw`\b${TERCEIRA} (?:e|eh|sao|ta|esta|estao) (?:um |uma )?${INTENSO}${palavra}\b`)] : []),
  ];
}

const SINAIS: Record<Exclude<MotivoDenuncia, "Outro">, RegExp[]> = {
  Bullying: [
    /\bzo(?:ar|ando|aram|amos|ou) (?:de|da|do|com)\b/,
    /\bzo(?:ar|ando|aram|ou) (?:ele|ela|voce|vc|ti)\b/,
    /\bninguem (?:gosta d[eo]s? (?:voce|vc|ti|tu)|te (?:quer|suporta|aguenta)|quer (?:voce|vc))\b/,
    ...dirigido(String.raw`gord[oa]s?`),
    /\b(?:oi|ei|oh|fala) gord[oa]\b/,
    ...dirigido(String.raw`esquisit[oa]s?`),
    ...dirigido(String.raw`perdedor(?:a|es|as)?`),
    /\bri(?:r|ndo|ram|mos|u|em) da (?:sua |tua )?cara\b/,
    /\bri(?:r|ndo|ram|mos|u|em) d[eo] (?:voce|vc|ti|tu)\b/,
    /\b(?:vamos|vou|bora|vao) exclu(?:ir|ido) (?:ele|ela|voce|vc)\b/,
    /\bapelido (?:ridiculo|horrivel|feio|humilhante)\b/,
  ],
  Ofensa: [
    /\bidiotas?\b/,
    /\bimbecis?\b/,
    /\botari[oa]s?\b/,
    /\bcala(?:r|e)?(?: a)? boca\b/,
    /\b(?:seu|sua|oh|ei|ola) burr[oa]\b/,
    /\b(?:e|eh|sao|ser|ta|esta) (?:um |uma )?(?:(?:muito|tao|bem|meio|super|mega|completamente|realmente) )?burr[oa]s?(?! de carga)\b/,
    ...dirigido(String.raw`burr[oa]s?(?! de carga)`, true),
    ...dirigido(String.raw`ridicul[oa]s?`, true),
    ...dirigido(String.raw`retardad[oa]s?`),
    /\bretardad[oa]s? mental\b/,
    // "lixo" só como xingamento: "seu lixo", "você é um lixo", "é um lixo, ..." / "um lixo!" — nunca "lixo urbano/eletrônico".
    /\b(?:seu|sua) lixo\b/,
    new RegExp(String.raw`\b${VOCE} ${SER} (?:um |uma )?lixo\b`),
    /\bum lixo(?=\s*(?:[.,!;:]|$)|\s+(?:mesmo|total|completo)\b|\s+quem\b)/,
    /\blixo humano\b/,
  ],
  Assédio: [
    // "manda foto" sozinho ou pedindo a foto da pessoa; "manda foto da questão" é pedido de estudo e não retém.
    /\bmanda(?:r|e)? (?:uma )?fotos?(?=\s*(?:[.,!;:]|$)|\s+(?:sua|tua|de voce|de vc|pelad[oa]|sem roupa|intim[oa]|do corpo|no privado|pra mim|para mim)\b)/,
    /\bnudes?\b/,
    /\bme passa(?:r)? (?:seu|teu) (?:numero|whats|whatsapp|zap|insta|instagram|telefone|celular)\b/,
    /\b(?:vem|chama|me chama|fala) (?:no|pro|pra) (?:meu )?(?:privado|pv|inbox|direct)\b/,
    /\bque gostosa\b/,
    /\b(?:sua|seu|oi|ei|oh|fala) gostos[oa]\b/,
    new RegExp(String.raw`\b(?:${VOCE}|ela|ele) (?:e|eh|ta|esta) ${INTENSO}gostos[oa]\b`),
    /\bsegredo nosso\b/,
    /\bnosso segredinho\b/,
  ],
  "Conteúdo inadequado": [/\barmas?\b/, /\bdrogas?\b/, /\bbebidas?\b/, /\bcigarros?\b/, /\bviolencia\b/, /\bsangue\b/],
  "Spam ou golpe": [/\bpix\b/, /\bsorteios?\b/, /\bclique aqui\b/, /\blinks?\b/, /\bganhe\b/, /\bpromo(?:cao|coes)\b/, /\brenda extra\b/],
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
  const t = normalizar(texto).replace(/\s+/g, " ");
  const pontos = new Map<MotivoDenuncia, number>();
  for (const [motivo, padroes] of Object.entries(SINAIS) as [MotivoDenuncia, RegExp[]][]) {
    const hits = padroes.filter((padrao) => padrao.test(t)).length;
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
