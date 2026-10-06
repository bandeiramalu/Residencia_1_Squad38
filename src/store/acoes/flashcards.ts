/**
 * Flashcards: rodada por disciplina, cartas próprias e repetição espaçada (caixas de Leitner).
 * Acertou sobe de caixa; errou volta para a 1. A rodada prioriza as cartas vencidas.
 */
import { CARTAS_POR_RODADA, FLASHCARDS, type Flashcard } from "@/data/missoes";
import { DISCIPLINAS, type Disciplina } from "@/data/escola";
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
  const ids = montarRodada(estadoFlash(), escolha, Date.now());
  if (!ids.length) {
    toast({ tipo: "info", titulo: escolha === "Erradas" ? "Nenhuma carta errada" : "Nenhuma carta nesta disciplina" }, 2400);
    return;
  }
  commit({ type: "flashcards", op: { tipo: "iniciar", ids, escolha } });
}

/** Volta à escolha da disciplina (encerra a rodada atual sem premiar). */
export function sairDaRodada() {
  commit({ type: "reiniciarPratica" });
}

export function responderFlashcard(acertou: boolean) {
  const antes = obterEstado().pratica;
  if (antes.fim || !antes.ids) return;
  const depois = commit({ type: "responderCarta", acertou, em: Date.now() }).pratica;
  if (acertou) {
    avancarMissao("d2", 1);
    contribuirColetiva(1, true);
  }
  if (depois.fim) {
    const escolha = depois.escolha;
    const disciplina = escolha && escolha !== "Todas" && escolha !== "Erradas" ? escolha : undefined;
    const rotulo = disciplina ?? (escolha === "Erradas" ? "revisão das erradas" : "todas as disciplinas");
    premiar(10, 15, `rodada de flashcards (${rotulo}) concluída: ${depois.acertos} acertos`, disciplina);
  }
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
