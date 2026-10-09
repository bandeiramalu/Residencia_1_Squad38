/**
 * Simulações de falha para a apresentação (sem conexão, IA indisponível, busca indisponível,
 * falha ao salvar, falha ao carregar). Puro, sem React.
 *
 * Só existem com o modo apresentação ligado (Alt+Shift+D): com ele desligado,
 * `simulacaoAtiva` é sempre `false`, mesmo que algum valor tenha ficado guardado.
 * Quem consome nunca recebe exceção — leitura e gravação do armazenamento são protegidas.
 */

export type Simulacao = "offline" | "ia" | "busca" | "salvar" | "carregar";

export const SIMULACOES: { id: Simulacao; rotulo: string; descricao: string }[] = [
  { id: "offline", rotulo: "Sem conexão", descricao: "Aparece como faixa no topo e como selo “Aguardando envio” nas publicações." },
  { id: "ia", rotulo: "IA indisponível", descricao: "Aparece em Nova publicação (sugestões) e em Denúncia (triagem)." },
  { id: "busca", rotulo: "Busca por significado indisponível", descricao: "Aparece na lupa do feed: a busca cai para palavras-chave." },
  { id: "salvar", rotulo: "Falha ao salvar progresso", descricao: "Aparece em Missões: o avanço não é salvo e dá para tentar de novo." },
  { id: "carregar", rotulo: "Falha ao carregar tela", descricao: "Aparece na próxima tela que você abrir." },
];

/** Chave do modo apresentação (a mesma de `lib/apresentacao.ts`). */
export const CHAVE_APRESENTACAO = "cepi-apresentacao";
/** Chave das simulações ligadas (JSON `{ [simulacao]: true }`). */
export const CHAVE_SIMULACOES = "cepi-simulacoes";
/** Evento de janela disparado quando o modo apresentação muda nesta aba. */
export const EVENTO_APRESENTACAO = "cepi:apresentacao";

const IDS: Simulacao[] = SIMULACOES.map((s) => s.id);
const ouvintes = new Set<() => void>();

function modoLigado(): boolean {
  try {
    return localStorage.getItem(CHAVE_APRESENTACAO) === "1";
  } catch {
    return false;
  }
}

function tudo(v: boolean): Record<Simulacao, boolean> {
  return { offline: v, ia: v, busca: v, salvar: v, carregar: v };
}

const SEM_SIMULACAO = tudo(false);
let cacheBruto: string | null | undefined;
let cacheValor = SEM_SIMULACAO;

/** O que está guardado, independente do modo. Mesmo objeto enquanto nada mudar. */
function lerGuardadas(): Record<Simulacao, boolean> {
  let bruto: string | null = null;
  try {
    bruto = localStorage.getItem(CHAVE_SIMULACOES);
  } catch {
    return cacheValor;
  }
  if (bruto === cacheBruto) return cacheValor;
  cacheBruto = bruto;
  const valor = tudo(false);
  if (bruto) {
    try {
      const obj = JSON.parse(bruto) as Record<string, unknown> | null;
      if (obj && typeof obj === "object") for (const id of IDS) valor[id] = obj[id] === true;
    } catch {
      /* JSON inválido: tudo desligado */
    }
  }
  cacheValor = valor;
  return valor;
}

/** Quais simulações estão ligadas (todas `false` fora do modo apresentação). */
export function lerSimulacoes(): Record<Simulacao, boolean> {
  return modoLigado() ? lerGuardadas() : SEM_SIMULACAO;
}

/** `true` só se o modo apresentação estiver ligado E a simulação ligada. */
export function simulacaoAtiva(s: Simulacao): boolean {
  if (typeof localStorage === "undefined") return false;
  return lerSimulacoes()[s];
}

function avisar() {
  ouvintes.forEach((o) => o());
}

export function definirSimulacao(s: Simulacao, ativa: boolean): void {
  try {
    const atual = { ...lerGuardadas() };
    atual[s] = ativa;
    const ligadas = IDS.filter((id) => atual[id]);
    if (ligadas.length) localStorage.setItem(CHAVE_SIMULACOES, JSON.stringify(Object.fromEntries(ligadas.map((id) => [id, true]))));
    else localStorage.removeItem(CHAVE_SIMULACOES);
  } catch {
    /* sem armazenamento: nada é simulado */
  }
  avisar();
}

/** Desliga todas (usado ao sair do modo apresentação). */
export function limparSimulacoes(): void {
  try {
    localStorage.removeItem(CHAVE_SIMULACOES);
  } catch {
    /* sem armazenamento */
  }
  avisar();
}

/**
 * Avisa quando uma simulação ou o modo apresentação mudar — nesta aba (chamada direta e evento
 * `cepi:apresentacao`) ou em outra (evento `storage`).
 */
export function assinarSimulacoes(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  if (typeof window === "undefined") return () => void ouvintes.delete(ouvinte);
  const aoArmazenar = (e: StorageEvent) => {
    if (e.key === null || e.key === CHAVE_SIMULACOES || e.key === CHAVE_APRESENTACAO) ouvinte();
  };
  window.addEventListener("storage", aoArmazenar);
  window.addEventListener(EVENTO_APRESENTACAO, ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
    window.removeEventListener("storage", aoArmazenar);
    window.removeEventListener(EVENTO_APRESENTACAO, ouvinte);
  };
}
