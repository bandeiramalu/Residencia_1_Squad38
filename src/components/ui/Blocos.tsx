import { Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Título de página. `sobre` é aceito por compatibilidade, mas não é exibido (sem rótulos decorativos). */
export function TituloPagina({ titulo, descricao, acao }: { titulo: ReactNode; descricao?: ReactNode; acao?: ReactNode; sobre?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold tracking-tight text-tinta">{titulo}</h1>
        {descricao && <p className="mt-1 max-w-prose text-sm text-texto-2">{descricao}</p>}
      </div>
      {acao}
    </header>
  );
}

/** Título de seção: curto, em texto normal. */
export function TituloSecao({ children, extra, className }: { children: ReactNode; extra?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-3 flex items-baseline justify-between gap-3", className)}>
      <h2 className="text-[15px] font-semibold text-tinta">{children}</h2>
      {extra && <span className="text-right text-xs text-texto-2">{extra}</span>}
    </div>
  );
}

/** Caixa informativa discreta. */
export function Nota({ icone, children, tom = "verde", className }: { icone?: ReactNode; children: ReactNode; tom?: "verde" | "branco" | "azul"; className?: string }) {
  return (
    <div
      className={cn(
        "flex gap-2.5 rounded-xl border p-3 text-[13px] leading-relaxed text-texto-2 [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0",
        tom === "verde" && "border-borda bg-superficie-2 [&_svg]:text-texto-2",
        tom === "branco" && "border-borda bg-superficie [&_svg]:text-texto-2",
        tom === "azul" && "border-blue-100 bg-blue-50/60 [&_svg]:text-cepi",
        className,
      )}
    >
      {icone}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/**
 * Estado vazio padrão (DS §18, tela 79): ícone + frase do que vai aparecer + ação para começar (quando houver).
 * Sem `icone`, usa uma caixa de entrada vazia — nunca fica só texto.
 */
export function Vazio({ titulo, descricao, icone, acao }: { titulo: string; descricao?: string; icone?: ReactNode; acao?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-borda px-6 py-10 text-center">
      <div className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-superficie-2 text-texto-2 [&_svg]:size-5" aria-hidden>
        {icone ?? <Inbox />}
      </div>
      <p className="text-sm font-medium text-tinta">{titulo}</p>
      {descricao && <p className="mx-auto mt-1 max-w-xs text-[13px] text-texto-2">{descricao}</p>}
      {acao && <div className="mt-4 flex justify-center">{acao}</div>}
    </div>
  );
}
