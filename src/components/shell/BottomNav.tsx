"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PapelSessao } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { itemAtivo, NAV_MOBILE } from "./abas";

/** Barra de navegação inferior (celular/tablet): ícones com rótulo, item ativo em destaque. */
export function BottomNav({ papel }: { papel: PapelSessao }) {
  const caminho = usePathname();

  return (
    <nav aria-label="Navegação principal" className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-borda bg-superficie lg:hidden">
      <ul className="mx-auto grid h-14 max-w-[640px] grid-cols-5">
        {NAV_MOBILE[papel].map((aba) => {
          const Icone = aba.icone;
          const ativo = itemAtivo(aba, caminho);
          return (
            <li key={aba.href}>
              <Link
                href={aba.href}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5 transition-colors duration-150 active:scale-95",
                  ativo ? "text-tinta" : "text-texto-2 hover:text-tinta",
                )}
              >
                <Icone className="size-[22px]" strokeWidth={ativo ? 2.25 : 1.75} />
                <span className={cn("text-[10.5px] leading-none", ativo ? "font-semibold" : "font-medium")}>{aba.rotulo}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
