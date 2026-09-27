import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Tom = "branco" | "suave" | "destaque";

const TONS: Record<Tom, string> = {
  branco: "bg-white border-borda",
  suave: "bg-verde-mclaro border-verde-claro",
  destaque: "bg-verde-mclaro border-verde-2/40",
};

interface Props extends HTMLAttributes<HTMLDivElement> {
  tom?: Tom;
  semPadding?: boolean;
}

/** Card do Design System: fundo branco, borda fina, cantos arredondados. */
export function Card({ tom = "branco", semPadding, className, ...props }: Props) {
  return (
    <div
      className={cn("rounded-2xl border shadow-card", TONS[tom], !semPadding && "p-4", className)}
      {...props}
    />
  );
}
