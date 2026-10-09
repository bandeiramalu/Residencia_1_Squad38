/**
 * Flashcards: rodada por disciplina, cartas próprias e repetição espaçada (caixas de Leitner).
 * Acertou sobe de caixa; errou volta para a 1. A rodada prioriza as cartas vencidas.
 */
import { CARTAS_POR_RODADA, FLASHCARDS, type Flashcard } from "@/data/missoes";
import { DISCIPLINAS, type Disciplina } from "@/data/escola";
import { inicioDoDia } from "@/lib/estudos";
import { gerarId } from "@/lib/format";
import { avancarMissao, contribuirColetiva } from "../actions";
import { commit, premiar } from "../nucleo";
import { obterEstado } from "../store";
import type { CaixaLeitner, EstadoFlashcards } from "../types";
import { toast } from "../ui";

export type EscolhaRodada = Disciplina | "Todas" | "Erradas";

const VAZIO: EstadoFlashcards = { minhas: [], caixas: {}, erradas: [] };

/** Estado dos flashcards com padrão vazio (campo opcional no store). */
export function estadoFlash(): EstadoFlashcards {
  return obterEstado().flash ?? VAZIO;
}

/** Banco da escola + cartas próprias. */
export function todasAsCartas(minhas: Flashcard[]): Flashcard[] {
  return [...FLASHCARDS, ...minhas];
}

export function cartaPorId(id: string, minhas: Flashcard[]) {
  return todasAsCartas(minhas).find((c) => c.id === id);
}

export function estaVencida(caixa: CaixaLeitner | undefined, agora: number) {
  return !caixa || caixa.proxima <= agora;
}

/** Quantas cartas de cada escolha estão vencidas agora (novas contam como vencidas). */
export function contarVencidas(flash: EstadoFlashcards, escolha: EscolhaRodada, agora: number) {
  return cartasDaEscolha(flash, escolha).filter((c) => estaVencida(flash.caixas[c.id], agora)).length;
}

export function cartasDaEscolha(flash: EstadoFlashcards, escolha: EscolhaRodada): Flashcard[] {
  const todas = todasAsCartas(flash.minhas);
  if (escolha === "Todas") return todas;
  if (escolha === "Erradas") return todas.filter((c) => flash.erradas.includes(c.id));
  return todas.filter((c) => c.disciplina === escolha);
}

/**
 * Monta a rodada: primeiro as vencidas (caixa menor e vencimento mais antigo antes; novas entram na caixa 1);
 * se faltar, completa com as que vencem mais cedo. Sem sorteio: a ordem é sempre explicada pela caixa.
 */
export function montarRodada(flash: EstadoFlashcards, escolha: EscolhaRodada, agora: number, tamanho = CARTAS_POR_RODADA): string[] {
  const cartas = cartasDaEscolha(flash, escolha);
  const info = (c: Flashcard) => flash.caixas[c.id] ?? { caixa: 1, proxima: 0 };
  const ordenadas = [...cartas].sort((a, b) => {
    const ia = info(a);
    const ib = info(b);
    const va = ia.proxima <= agora ? 0 : 1;
    const vb = ib.proxima <= agora ? 0 : 1;
    return va - vb || ia.caixa - ib.caixa || ia.proxima - ib.proxima || a.id.localeCompare(b.id);
  });
  return ordenadas.slice(0, escolha === "Erradas" ? Math.max(tamanho, ordenadas.length) : tamanho).map((c) => c.id);
}

export function iniciarRodada(escolha: EscolhaRodada) {
  const agora = Date.now();
  const flash = estadoFlash();
  const ids = montarRodada(flash, escolha, agora);
  if (!ids.length) {
    toast({ tipo: "info", titulo: escolha === "Erradas" ? "Nenhuma carta errada" : "Nenhuma carta nesta disciplina" }, 2400);
    return;
  }
  // As vencidas no início da rodada são as únicas que valem para a missão "Acertar 5 flashcards" e para a Maratona.
  const vencidas = ids.filter((id) => estaVencida(flash.caixas[id], agora));
  commit({ type: "flashcards", op: { tipo: "iniciar", ids, escolha, vencidas } });
}

/** Começa uma rodada de "Todas" só se não houver uma em andamento (atalho da missão coletiva). */
export function iniciarRodadaSeLivre(escolha: EscolhaRodada = "Todas") {
  const p = obterEstado().pratica;
  if (p.ids && !p.fim) return;
  iniciarRodada(escolha);
}

/** Volta à escolha da disciplina (encerra a rodada atual sem premiar). */
export function sairDaRodada() {
  commit({ type: "reiniciarPratica" });
}

const ROTULO_JA_PREMIADA: Record<string, string> = {
  Todas: "de todas as disciplinas",
  Erradas: "da revisão das erradas",
};

export function responderFlashcard(acertou: boolean) {
  const antes = obterEstado().pratica;
  if (antes.fim || !antes.ids) return;
  const agora = Date.now();
  const cartaId = antes.ids[antes.fila[0]];
  // Rodada salva antes de existir `vencidas`: vale o vencimento da carta no momento da resposta.
  const vencida = !cartaId ? false : antes.vencidas ? antes.vencidas.includes(cartaId) : estaVencida(estadoFlash().caixas[cartaId], agora);
  const depois = commit({ type: "responderCarta", acertou, em: agora }).pratica;
  // Acertar uma carta que ainda não venceu não conta para a missão nem para a Maratona (evita "farm" de rodadas).
  if (acertou && vencida) {
    avancarMissao("d2", 1);
    contribuirColetiva(1, true);
  }
  if (depois.fim) premiarRodada(depois.escolha ?? "Todas", depois.acertos);
}

/** Recompensa da rodada: só com pelo menos 1 acerto e uma vez por dia para cada escolha (disciplina, todas, erradas). */
function premiarRodada(escolha: EscolhaRodada, acertos: number) {
  const dia = inicioDoDia(Date.now());
  const disciplina = escolha !== "Todas" && escolha !== "Erradas" ? escolha : undefined;
  if (acertos < 1) {
    toast({ tipo: "info", titulo: "Rodada concluída", mensagem: "Sem acertos desta vez, então sem recompensa. Revise as cartas e tente de novo." }, 3600);
    return;
  }
  if (estadoFlash().premiadas?.[escolha] === dia) {
    const de = disciplina ? "desta disciplina" : ROTULO_JA_PREMIADA[escolha];
    toast({ tipo: "info", titulo: `Rodada concluída · a recompensa de hoje ${de} já foi dada`, mensagem: "Você pode continuar praticando; novos pontos voltam amanhã." }, 4200);
    return;
  }
  commit({ type: "flashcards", op: { tipo: "premiada", escolha, dia } });
  const rotulo = disciplina ?? (escolha === "Erradas" ? "revisão das erradas" : "todas as disciplinas");
  premiar(10, 15, `rodada de flashcards (${rotulo}) concluída: ${acertos} ${acertos === 1 ? "acerto" : "acertos"}`, disciplina);
}

export interface DadosCarta {
  id?: string;
  disciplina: Disciplina;
  pergunta: string;
  resposta: string;
}

/** Cria ou edita uma carta própria. Devolve false se frente/verso estiverem vazios. */
export function salvarCarta(dados: DadosCarta) {
  const pergunta = dados.pergunta.trim();
  const resposta = dados.resposta.trim();
  if (!pergunta || !resposta || !DISCIPLINAS.includes(dados.disciplina)) return false;
  const carta: Flashcard = { id: dados.id ?? gerarId("meu"), disciplina: dados.disciplina, pergunta, resposta, minha: true };
  commit({ type: "flashcards", op: { tipo: "salvar", carta } });
  toast({ tipo: "info", titulo: dados.id ? "Carta atualizada" : "Carta criada", mensagem: `${carta.disciplina} · entra nas suas próximas rodadas.` }, 2200);
  return true;
}

export function apagarCarta(id: string) {
  commit({ type: "flashcards", op: { tipo: "apagar", id } });
  toast({ tipo: "info", titulo: "Carta apagada" }, 1800);
}
