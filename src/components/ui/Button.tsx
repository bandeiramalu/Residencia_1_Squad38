import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Botões do Design System:
 * - primario: ações importantes (Concluir, Comprar, Registrar estudo)
 * - secundario: ações alternativas (Cancelar, Responder, Simular ausência)
 * - rapido: ações pequenas dentro dos cards (Marcar como útil, +1 progresso, Salvar)
 */
type Variante = "primario" | "secundario" | "rapido" | "fantasma" | "perigo";
type Tamanho = "sm" | "md" | "lg";

const VARIANTES: Record<Variante, string> = {
  primario: "bg-verde text-white shadow-sm hover:bg-verde-2 disabled:bg-verde-suave disabled:text-white",
  secundario: "border border-borda bg-white text-verde hover:border-verde-2 hover:bg-verde-mclaro disabled:text-texto-2/60",
  rapido: "bg-verde-claro text-verde hover:bg-verde-suave/70 disabled:opacity-60",
  fantasma: "text-texto-2 hover:bg-verde-mclaro hover:text-verde",
  perigo: "border border-alerta/30 bg-white text-alerta hover:bg-red-50",
};

const TAMANHOS: Record<Tamanho, string> = {
  sm: "h-8 gap-1.5 rounded-lg px-3 text-xs",
  md: "h-10 gap-2 rounded-xl px-4 text-sm",
  lg: "h-12 gap-2 rounded-xl px-5 text-[15px]",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamanho?: Tamanho;
  bloco?: boolean;
}

export function Button({ variante = "primario", tamanho = "md", bloco, className, type = "button", ...props }: Props) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center font-semibold transition-[background-color,border-color,color,transform,box-shadow] duration-200 ease-out active:scale-[0.97] disabled:active:scale-100 [&_svg]:size-4 [&_svg]:shrink-0",
        VARIANTES[variante],
        TAMANHOS[tamanho],
        bloco && "w-full",
        className,
      )}
      {...props}
    />
  );
}
