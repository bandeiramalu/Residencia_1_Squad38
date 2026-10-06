import { diaDaSemana, inicioDoDia, NOMES_DIAS, somarDias } from "@/lib/tempo";

/** "9º Ano A" → "9º A" (cabe em pílulas e placares). */
export function turmaCurta(turma: string) {
  return turma.replace(" Ano ", " ");
}

function mesCurto(ts: number) {
  return new Date(ts).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

/** "12 set" */
export function diaMes(ts: number) {
  return `${new Date(ts).getDate()} ${mesCurto(ts)}`;
}

/** "Seg, 12 set" */
export function diaSemanaMes(ts: number) {
  return `${NOMES_DIAS[diaDaSemana(ts)]}, ${diaMes(ts)}`;
}

/** "Hoje" · "Ontem" · "Sex, 25 set" — cabeçalho dos grupos de sessões. */
export function rotuloDoDia(ts: number, agora: number) {
  const dia = inicioDoDia(ts);
  const hoje = inicioDoDia(agora);
  if (dia === hoje) return "Hoje";
  if (dia === somarDias(hoje, -1)) return "Ontem";
  return diaSemanaMes(ts);
}

/** "14:05" */
export function horaMinuto(ts: number) {
  return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** "15h–16h" */
export function faixaHora(h: number) {
  return `${h}h–${(h + 1) % 24}h`;
}
