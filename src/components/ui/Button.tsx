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
  // Texto branco sobre --color-acao (#15803D, 5,0:1) e --color-acao-2 (#166534, 7,1:1) nos dois temas.
  primario: "bg-acao text-white hover:bg-acao-2 disabled:opacity-50",
  secundario: "border border-borda bg-superficie text-tinta hover:bg-superficie-2 disabled:text-texto-2/60",
  rapido: "bg-verde-mclaro text-acento hover:bg-verde-claro disabled:opacity-60",
  escuro: "bg-tinta text-superficie hover:opacity-90 disabled:opacity-50",
  fantasma: "text-texto-2 hover:bg-superficie-2 hover:text-tinta",
  perigo: "border border-borda bg-superficie text-red-700 hover:bg-red-50 dark:text-alerta",
};

/** No celular a área de toque chega a 44 × 44 px (`alvo-toque`: `::after` invisível + largura mínima), sem mudar o visual. */
const TAMANHOS: Record<Tamanho, string> = {
  sm: "alvo-toque h-8 gap-1.5 rounded-lg px-3 text-[13px] toque:min-w-11",
  md: "alvo-toque h-9 gap-2 rounded-lg px-4 text-sm toque:min-w-11",
  lg: "h-11 gap-2 rounded-xl px-5 text-[15px]",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamanho?: Tamanho;
  bloco?: boolean;
  /** Mostra um indicador de carregamento e desabilita o botão. */
  carregando?: boolean;
}

const BASE =
  "relative inline-flex shrink-0 select-none items-center justify-center font-medium transition-[background-color,border-color,color,opacity,transform] duration-100 active:scale-[0.97] disabled:active:scale-100 [&_svg]:size-4 [&_svg]:shrink-0";

/**
 * Classes de um botão do DS para elementos que não são `<button>` (ex.: `<Link>` estilizado como botão),
 * assim a cor, a área de toque e o contraste são os mesmos do `Button`.
 */
export function classesDoBotao({ variante = "primario", tamanho = "md", bloco }: { variante?: Variante; tamanho?: Tamanho; bloco?: boolean } = {}) {
  return cn(BASE, VARIANTES[variante], TAMANHOS[tamanho], bloco && "w-full min-w-0 shrink");
}

export function Button({ variante = "primario", tamanho = "md", bloco, carregando, className, type = "button", disabled, children, ...props }: Props) {
  return (
    <button
      type={type}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      className={cn(classesDoBotao({ variante, tamanho, bloco }), className)}
      {...props}
    >
      {carregando ? <LoaderCircle className="animate-spin" /> : null}
      {children}
    </button>
  );
}
