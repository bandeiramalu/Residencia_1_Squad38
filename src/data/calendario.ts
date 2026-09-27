import type { Disciplina } from "./escola";

export type TipoEvento = "prova" | "trabalho" | "prazo" | "evento";

export interface EventoBase {
  id: string;
  titulo: string;
  tipo: TipoEvento;
  disciplina?: Disciplina;
  /** Dias a partir de hoje — o calendário sempre mostra a semana corrente. */
  emDias: number;
  hora: string;
  local?: string;
}

export const EVENTOS: EventoBase[] = [
  { id: "e1", titulo: "Oficina de Robótica: seguidor de linha", tipo: "evento", emDias: 1, hora: "14:00", local: "Laboratório maker" },
  { id: "e2", titulo: "Prova de Matemática — Funções afins", tipo: "prova", disciplina: "Matemática", emDias: 2, hora: "07:30", local: "Sala 9º A" },
  { id: "e3", titulo: "Entrega do relatório de Citologia", tipo: "trabalho", disciplina: "Biologia", emDias: 3, hora: "23:59", local: "Portal do Aluno" },
  { id: "e4", titulo: "Prova de História — 1ª Guerra Mundial", tipo: "prova", disciplina: "História", emDias: 4, hora: "09:20", local: "Sala 9º A" },
  { id: "e5", titulo: "Inscrições da Feira de Ciências", tipo: "prazo", emDias: 4, hora: "17:00", local: "Secretaria" },
  { id: "e6", titulo: "Passeio ciclístico — Semana da Criança", tipo: "evento", emDias: 5, hora: "08:00", local: "Pátio do CEPI" },
  { id: "e7", titulo: "Simulado Cultura Inglesa — Unit 5", tipo: "prova", disciplina: "Inglês", emDias: 6, hora: "10:10", local: "Sala bilíngue" },
  { id: "e8", titulo: "Redação: crônica sobre Aracaju", tipo: "trabalho", disciplina: "Português", emDias: 9, hora: "23:59", local: "Portal do Aluno" },
  { id: "e9", titulo: "Aula prática de Química — neutralização", tipo: "evento", disciplina: "Química", emDias: 12, hora: "13:30", local: "Laboratório" },
];

export const ROTULO_EVENTO: Record<TipoEvento, string> = {
  prova: "Prova",
  trabalho: "Trabalho",
  prazo: "Prazo",
  evento: "Evento",
};

/** Regra determinística (US04): 3+ avaliações/entregas em 7 dias disparam alerta. */
export const LIMITE_SEMANA_CHEIA = 3;
