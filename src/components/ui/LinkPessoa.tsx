"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { useSessao } from "@/lib/auth";
import { cn } from "@/lib/cn";

/** Rota do perfil público de uma pessoa (aluno, professor ou coordenação). */
export function hrefPessoa(id: string) {
  return `/pessoas/${id}`;
}

interface Props {
  id: string;
  children: ReactNode;
  className?: string;
  /** Texto para leitores de tela quando o conteúdo é só o avatar. */
  rotulo?: string;
}

/**
 * Envolve avatar e/ou nome de uma pessoa e abre o perfil dela.
 * O próprio perfil da aluna logada vai para /perfil. Não propaga o clique
 * (pode ficar dentro de cards que também são clicáveis).
 */
export function LinkPessoa({ id, children, className, rotulo }: Props) {
  const sessao = useSessao();
  const href = sessao?.papel === "aluno" && sessao.usuarioId === id ? "/perfil" : hrefPessoa(id);
  const parar = (e: MouseEvent) => e.stopPropagation();
  return (
    <Link
      href={href}
      onClick={parar}
      aria-label={rotulo}
      className={cn("rounded-md outline-offset-2 transition-opacity hover:opacity-80 active:opacity-70", className)}
    >
      {children}
    </Link>
  );
}
