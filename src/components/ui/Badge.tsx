import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TomBadge = "claro" | "verde" | "escuro" | "neutro" | "ambar" | "azul" | "alerta" | "contorno";

const TONS: Record<TomBadge, string> = {
  claro: "bg-verde-claro text-verde",
  verde: "bg-verde text-white",
  escuro: "bg-tinta text-white",
  neutro: "bg-fundo text-texto-2 ring-1 ring-inset ring-borda",
  ambar: "bg-amber-50 text-ambar ring-1 ring-inset ring-amber-200",
  azul: "bg-blue-50 text-cepi ring-1 ring-inset ring-blue-100",
  alerta: "bg-red-50 text-alerta ring-1 ring-inset ring-red-100",
  contorno: "bg-white text-verde ring-1 ring-inset ring-verde-suave",
};

/** Etiqueta pequena e arredondada (PERGUNTA, Nível 3 – Estudante, Raro...). */
export function Badge({
  tom = "claro",
  maiuscula,
  className,
  children,
}: {
  tom?: TomBadge;
  maiuscula?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4 [&_svg]:size-3",
        maiuscula && "text-[10px] uppercase tracking-wide",
        TONS[tom],
        className,
      )}
    >
      {children}
    </span>
  );
}
