import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Título de página (DS §3 — "Títulos principais"). */
export function TituloPagina({ titulo, descricao, acao }: { titulo: string; descricao?: ReactNode; acao?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[22px] font-extrabold leading-tight tracking-tight text-tinta">{titulo}</h1>
        {descricao && <p className="mt-1 text-[13px] leading-snug text-texto-2">{descricao}</p>}
      </div>
      {acao}
    </header>
  );
}

/** Subtítulo de seção (DS §3 — pequeno, semibold, caixa alta, verde). */
export function TituloSecao({ children, extra, className }: { children: ReactNode; extra?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-3", className)}>
      <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-verde">{children}</h2>
      {extra && <span className="text-right text-[11px] leading-tight text-texto-2">{extra}</span>}
    </div>
  );
}

/** Caixa informativa. */
export function Nota({ icone, children, tom = "verde", className }: { icone?: ReactNode; children: ReactNode; tom?: "verde" | "branco" | "azul"; className?: string }) {
  return (
    <div
      className={cn(
        "flex gap-2.5 rounded-xl border p-3 text-[12.5px] leading-relaxed text-texto-2 [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0",
        tom === "verde" && "border-verde-claro bg-verde-mclaro [&_svg]:text-verde-2",
        tom === "branco" && "border-borda bg-white [&_svg]:text-verde-2",
        tom === "azul" && "border-blue-100 bg-blue-50/60 [&_svg]:text-cepi",
        className,
      )}
    >
      {icone}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Vazio({ titulo, descricao, icone }: { titulo: string; descricao?: string; icone?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-verde-suave bg-verde-mclaro px-6 py-8 text-center">
      {icone && <div className="mx-auto mb-2 grid size-11 place-items-center rounded-full bg-white text-verde-2 [&_svg]:size-5">{icone}</div>}
      <p className="text-sm font-bold text-tinta">{titulo}</p>
      {descricao && <p className="mt-1 text-[13px] text-texto-2">{descricao}</p>}
    </div>
  );
}
