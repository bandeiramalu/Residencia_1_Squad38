"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const ABAS = [
  { href: "/ranking", rotulo: "Ranking" },
  { href: "/campeonatos", rotulo: "Campeonatos" },
];

/** Abas Ranking ↔ Campeonatos (aluno), no estilo de abas com sublinhado. */
export function ArenaAbas({ className }: { className?: string }) {
  const caminho = usePathname();
  return (
    <nav aria-label="Ranking e campeonatos" className={cn("flex gap-6 border-b border-borda", className)}>
      {ABAS.map(({ href, rotulo }) => {
        const ativo = caminho === href || caminho.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 pb-2.5 text-[14px] transition-colors toque:pt-3 toque:pb-3",
              ativo ? "border-tinta font-semibold text-tinta" : "border-transparent text-texto-2 hover:text-tinta",
            )}
          >
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
