"use client";

import { USUARIO_ID } from "@/data/pessoas";
import { useSessao, type PapelSessao } from "@/lib/auth";

export interface Ator {
  id: string;
  papel: PapelSessao;
  professor: boolean;
}

/** Quem usa esta aba (sessão por aba). Sem sessão: a aluna. */
export function useAtor(): Ator {
  const s = useSessao();
  const papel: PapelSessao = s?.papel ?? "aluno";
  return { id: s?.usuarioId ?? USUARIO_ID, papel, professor: papel === "professor" };
}
