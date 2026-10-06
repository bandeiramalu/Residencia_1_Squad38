import { ChevronDown } from "lucide-react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const BASE =
  "w-full rounded-lg border border-borda bg-superficie px-3 text-[14px] text-tinta outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-texto-2/70 hover:border-texto-2/40 focus:border-verde focus:ring-3 focus:ring-verde/15 disabled:opacity-60";

/** Rótulo + controle + dica/erro. Envolve Entrada, AreaTexto ou Seletor. */
export function Campo({ rotulo, dica, erro, children, className, htmlFor }: { rotulo: ReactNode; dica?: ReactNode; erro?: ReactNode; children: ReactNode; className?: string; htmlFor?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-tinta">
        {rotulo}
      </label>
      {children}
      {erro ? <p className="text-[12px] font-medium text-alerta">{erro}</p> : dica ? <p className="text-[12px] text-texto-2">{dica}</p> : null}
    </div>
  );
}

export function Entrada({ className, icone, ...props }: InputHTMLAttributes<HTMLInputElement> & { icone?: ReactNode }) {
  if (!icone) return <input className={cn(BASE, "h-10", className)} {...props} />;
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-texto-2 [&_svg]:size-4">{icone}</span>
      <input className={cn(BASE, "h-10 pl-9", className)} {...props} />
    </div>
  );
}

export function AreaTexto({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(BASE, "min-h-24 resize-y py-3 leading-relaxed", className)} {...props} />;
}

export function Seletor({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(BASE, "h-10 appearance-none pr-9", className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-texto-2" aria-hidden />
    </div>
  );
}
