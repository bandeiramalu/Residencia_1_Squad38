"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Linha de ação dos ajustes do perfil (link ou botão), com ícone, título e detalhe. */
export function LinhaAcao({
  icone,
  titulo,
  detalhe,
  href,
  onClick,
  perigo,
  extra,
}: {
  icone: ReactNode;
  titulo: string;
  detalhe?: ReactNode;
  href?: string;
  onClick?: () => void;
  perigo?: boolean;
  extra?: ReactNode;
}) {
  const conteudo = (
    <>
      <span className={cn("grid size-8 shrink-0 place-items-center [&_svg]:size-[18px]", perigo ? "text-alerta" : "text-texto-2")}>{icone}</span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-[14px] font-medium", perigo ? "text-alerta" : "text-tinta")}>{titulo}</span>
        {detalhe && <span className="block truncate text-[12px] text-texto-2">{detalhe}</span>}
      </span>
      {extra}
      <ChevronRight className="size-4 shrink-0 text-texto-2 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
    </>
  );
  const classe = "group flex min-h-11 w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-superficie-2 sm:px-4";
  return href ? (
    <Link href={href} className={classe}>
      {conteudo}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={classe}>
      {conteudo}
    </button>
  );
}
