import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Tom = "branco" | "suave" | "destaque" | "escuro";

const TONS: Record<Tom, string> = {
  branco: "bg-superficie border-borda",
  suave: "bg-superficie-2 border-borda",
  destaque: "bg-verde-mclaro border-verde-claro",
  escuro: "bg-tinta border-transparent text-superficie",
};

interface Props extends HTMLAttributes<HTMLDivElement> {
  tom?: Tom;
  semPadding?: boolean;
}

/** Card do Design System: superfície branca, borda fina, cantos de 16 px, sem sombra. */
export function Card({ tom = "branco", semPadding, className, ...props }: Props) {
  const clicavel = typeof props.onClick === "function";
  return (
    <div
      className={cn("rounded-2xl border", TONS[tom], !semPadding && "p-4", clicavel && "cursor-pointer transition-transform duration-100 active:scale-[0.99]", className)}
      {...props}
    />
  );
}
