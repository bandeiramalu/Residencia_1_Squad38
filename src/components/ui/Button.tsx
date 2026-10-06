import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Botões do Design System:
 * - primario: ação principal da tela (Publicar, Entregar, Iniciar foco)
 * - secundario: ações alternativas (Cancelar, Responder)
 * - rapido: ações pequenas dentro dos cards (+1 progresso, Salvar)
 * - escuro: ação neutra de alto contraste
 * - fantasma / perigo: ações discretas e destrutivas
 */
type Variante = "primario" | "secundario" | "rapido" | "escuro" | "fantasma" | "perigo";
type Tamanho = "sm" | "md" | "lg";

const VARIANTES: Record<Variante, string> = {
  primario: "bg-verde text-white hover:bg-verde-2 disabled:opacity-50",
  secundario: "border border-borda bg-superficie text-tinta hover:bg-superficie-2 disabled:text-texto-2/60",
  rapido: "bg-verde-mclaro text-acento hover:bg-verde-claro disabled:opacity-60",
  escuro: "bg-tinta text-superficie hover:opacity-90 disabled:opacity-50",
  fantasma: "text-texto-2 hover:bg-superficie-2 hover:text-tinta",
  perigo: "border border-borda bg-superficie text-alerta hover:bg-red-50",
};

const TAMANHOS: Record<Tamanho, string> = {
  sm: "h-8 gap-1.5 rounded-lg px-3 text-[13px]",
  md: "h-9 gap-2 rounded-lg px-4 text-sm",
  lg: "h-11 gap-2 rounded-xl px-5 text-[15px]",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamanho?: Tamanho;
  bloco?: boolean;
  /** Mostra um indicador de carregamento e desabilita o botão. */
  carregando?: boolean;
}

export function Button({ variante = "primario", tamanho = "md", bloco, carregando, className, type = "button", disabled, children, ...props }: Props) {
  return (
    <button
      type={type}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center font-medium transition-[background-color,border-color,color,opacity,transform] duration-100 active:scale-[0.97] disabled:active:scale-100 [&_svg]:size-4 [&_svg]:shrink-0",
        VARIANTES[variante],
        TAMANHOS[tamanho],
        bloco && "w-full min-w-0 shrink",
        className,
      )}
      {...props}
    >
      {carregando ? <LoaderCircle className="animate-spin" /> : null}
      {children}
    </button>
  );
}
