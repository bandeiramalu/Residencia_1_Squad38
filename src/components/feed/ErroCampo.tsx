import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

/** Erro de campo (DS §18): ao lado do campo, com ícone e texto, anunciado a leitores de tela. Ligue o `id` ao campo por `aria-describedby`. */
export function ErroCampo({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 text-[12.5px] font-medium leading-snug text-alerta">
      <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
