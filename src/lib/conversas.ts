import type { Conversa, Pessoa } from "@/store/types";
import { primeiroNome } from "./format";

export function outrosParticipantes(conversa: Conversa, usuarioId: string) {
  return conversa.participantes.filter((id) => id !== usuarioId);
}

export function ehGrupo(conversa: Conversa) {
  return !!conversa.titulo || conversa.participantes.length > 2;
}

export function tituloDaConversa(conversa: Conversa, pessoas: Record<string, Pessoa>, usuarioId: string) {
  if (conversa.titulo) return conversa.titulo;
  return pessoas[outrosParticipantes(conversa, usuarioId)[0]]?.nome ?? "Conversa";
}

/** Linha de apoio abaixo do nome: papel/turma do contato ou membros do grupo. */
export function subtituloDaConversa(conversa: Conversa, pessoas: Record<string, Pessoa>, usuarioId: string) {
  const outros = outrosParticipantes(conversa, usuarioId);
  if (ehGrupo(conversa)) return ["Você", ...outros.map((id) => primeiroNome(pessoas[id]?.nome ?? ""))].join(", ");
  const p = pessoas[outros[0]];
  if (!p) return "";
  if (p.papel === "professor") return `Professor · ${p.disciplina}`;
  if (p.papel === "escola") return "Coordenação Pedagógica";
  return p.turma ?? "Aluno";
}

export function ultimaMensagem(conversa: Conversa) {
  return conversa.mensagens[conversa.mensagens.length - 1];
}

export function horaCurta(ts: number) {
  return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
