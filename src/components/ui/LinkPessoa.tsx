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
 * (pode ficar dentro de cards que também são clicáveis). No celular a área de toque chega a 44 × 44 px, desde que nenhum
 * pai recorte o conteúdo (`truncate`/`overflow-hidden`): quem precisa de reticências passa o `truncate` no próprio link.
 */
export function LinkPessoa({ id, children, className, rotulo }: Props) {
  const sessao = useSessao();
  const href = sessao?.papel === "aluno" && sessao.usuarioId === id ? "/perfil" : hrefPessoa(id);
  const parar = (e: MouseEvent) => e.stopPropagation();
  // Alvo de toque de 44 px (avatar de 24–40 px, nome de 20 px). Nome que corta com reticências (`truncate` = overflow hidden)
  // não aceita `::after`: ganha o mesmo tamanho por preenchimento, com margem negativa para o layout não mudar.
  // Só vale quando é o PRÓPRIO link que corta: dentro de um pai com `truncate`/`overflow-hidden`, o pai recorta o `::after`
  // (e o preenchimento) e a área de toque cai para ~20 px. Nesses casos o link recebe o `truncate` e o texto que o antecede
  // fica num irmão `shrink-0` (veja "Criada por" em salas/SalaView.tsx).
  const recorta = /(^|\s)(truncate|overflow-hidden)(\s|$)/.test(className ?? "");
  return (
    <Link
      href={href}
      onClick={parar}
      aria-label={rotulo}
      className={cn("rounded-md outline-offset-2 transition-opacity hover:opacity-80 active:opacity-70", recorta ? "relative toque:-my-3.5 toque:min-w-11 toque:py-3.5" : "alvo-toque", className)}
    >
      {children}
    </Link>
  );
}
