/** Seletores puros sobre o estado (sem React): servem a telas, ações e à regra de sincronização. */
import { USUARIO_ID } from "@/data/pessoas";
import type { Post } from "./types";

/**
 * `pessoaId` curtiu a publicação? Com `curtidoPor` definido vale a lista; sem ele (estado legado)
 * o campo `curtido` é da aluna (`USUARIO_ID`) e de mais ninguém.
 */
export function curtiu(post: Post, pessoaId: string): boolean {
  return post.curtidoPor ? post.curtidoPor.includes(pessoaId) : pessoaId === USUARIO_ID && post.curtido;
}

/** `pessoaId` salvou a publicação? Mesma regra de `curtiu`, com `salvoPor`/`salvo`. */
export function salvou(post: Post, pessoaId: string): boolean {
  return post.salvoPor ? post.salvoPor.includes(pessoaId) : pessoaId === USUARIO_ID && post.salvo;
}
