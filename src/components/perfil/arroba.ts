import { normalizar } from "@/lib/format";

/** "Ana Beatriz Moura" → "@ana.moura". */
export function arrobaPadrao(nome: string) {
  const partes = normalizar(nome)
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  return `@${partes[0] ?? "aluno"}${partes.length > 1 ? `.${partes[partes.length - 1]}` : ""}`;
}
