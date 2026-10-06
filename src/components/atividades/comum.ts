/**
 * Utilidades das atividades usadas nos dois lados da demo (professor e aluna):
 * ícone por tipo, texto de prazo, nota em pt-BR e recompensa proporcional.
 */
import { BookOpen, FileUp, ListChecks, Rocket, Zap, type LucideIcon } from "lucide-react";
import { inicioDoDia } from "@/lib/tempo";
import type { Atividade, Entrega, TipoAtividade } from "@/store/types";

export const ICONE_ATIVIDADE: Record<TipoAtividade, LucideIcon> = {
  lista: ListChecks,
  quiz: Zap,
  leitura: BookOpen,
  entrega: FileUp,
  projeto: Rocket,
};

const DIA = 86_400_000;

/** Dias de calendário até o prazo (0 = hoje; negativo = já passou). */
export function diasAtePrazo(prazo: number, agora: number) {
  return Math.round((inicioDoDia(prazo) - inicioDoDia(agora)) / DIA);
}

export function prazoEncerrado(prazo: number, agora: number) {
  return prazo < agora;
}

/** "vence em 2 dias" · "vence amanhã" · "encerrada ontem" (professor) · "atrasada há 3 dias" (aluna). */
export function textoPrazo(prazo: number, agora: number, visao: "professor" | "aluno" = "professor") {
  const dias = diasAtePrazo(prazo, agora);
  if (prazo < agora) {
    if (visao === "aluno") return dias >= 0 ? "prazo encerrou hoje" : dias === -1 ? "atrasada desde ontem" : `atrasada há ${-dias} dias`;
    return dias >= 0 ? "encerrada hoje" : dias === -1 ? "encerrada ontem" : `encerrada há ${-dias} dias`;
  }
  if (dias <= 0) return "vence hoje";
  if (dias === 1) return "vence amanhã";
  return `vence em ${dias} dias`;
}

/** Prazo curto: falta um dia ou menos. */
export function prazoUrgente(prazo: number, agora: number) {
  return prazo >= agora && diasAtePrazo(prazo, agora) <= 1;
}

/** 9,5 · 8 · 10 */
export function fmtNota(nota: number) {
  return nota.toLocaleString("pt-BR", { minimumFractionDigits: nota % 1 ? 1 : 0, maximumFractionDigits: 1 });
}

/** Mesma regra de `corrigirEntrega`: recompensa proporcional à nota. */
export function recompensaDaNota(atividade: Pick<Atividade, "pontos" | "xp">, nota: number) {
  return { pontos: Math.round((atividade.pontos * nota) / 10), xp: Math.round((atividade.xp * nota) / 10) };
}

export function contarEntregas(entregas: Entrega[]) {
  let entregues = 0;
  let corrigidas = 0;
  let pendentes = 0;
  for (const e of entregas) {
    if (e.status === "pendente") pendentes++;
    else if (e.status === "entregue") entregues++;
    else corrigidas++;
  }
  return { total: entregas.length, paraCorrigir: entregues, corrigidas, pendentes, enviadas: entregues + corrigidas };
}

/** Prefixo usado para registrar o arquivo anexado junto com a resposta da entrega. */
export const PREFIXO_ANEXO = "Anexo: ";

/** Separa a resposta em texto e nome do arquivo anexado (quando houver). */
export function lerResposta(resposta?: string) {
  if (!resposta) return { texto: "", anexo: undefined as string | undefined };
  const linhas = resposta.split("\n");
  const anexo = linhas.find((l) => l.startsWith(PREFIXO_ANEXO))?.slice(PREFIXO_ANEXO.length);
  const texto = linhas.filter((l) => !l.startsWith(PREFIXO_ANEXO)).join("\n").trim();
  return { texto, anexo };
}
