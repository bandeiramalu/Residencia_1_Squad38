const MIN = 60_000;
const H = 60 * MIN;
const D = 24 * H;

export function tempoRelativo(ts: number, agora: number) {
  const diff = Math.max(0, agora - ts);
  if (diff < MIN) return "agora";
  if (diff < H) return `há ${Math.floor(diff / MIN)} min`;
  if (diff < D) return `há ${Math.floor(diff / H)} h`;
  const dias = Math.floor(diff / D);
  if (dias === 1) return "ontem";
  if (dias < 7) return `há ${dias} dias`;
  return dataCurta(ts);
}

export function dataCurta(ts: number) {
  return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function inicioDoDia(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function somarDias(ts: number, dias: number) {
  const d = new Date(ts);
  d.setDate(d.getDate() + dias);
  return d.getTime();
}

/** Índice do dia da semana começando na segunda (0) até domingo (6). */
export function diaDaSemana(ts: number) {
  return (new Date(ts).getDay() + 6) % 7;
}

/** Próximo domingo às 23:59:59 — fechamento semanal das ligas. */
export function fechamentoDaSemana(agora: number) {
  const d = new Date(agora);
  const faltam = (7 - d.getDay()) % 7;
  d.setDate(d.getDate() + faltam);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export function contagemRegressiva(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const dias = Math.floor(total / 86400);
  const horas = Math.floor((total % 86400) / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundos = total % 60;
  return { dias, horas, minutos, segundos };
}

export const NOMES_DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
