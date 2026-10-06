import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Props {
  rotulo: string;
  valor: ReactNode;
  icone?: ReactNode;
  /** Linha de apoio abaixo do número ("média da turma: 5h 42"). */
  detalhe?: ReactNode;
  /** Variação em fração (0.12 = +12%). */
  variacao?: number;
  /** Classe de cor do ícone (ex.: "bg-amber-50 text-ambar"). */
  tom?: string;
  className?: string;
}

/** Bloco de métrica (stat tile): ícone, número grande, rótulo e variação. */
export function Metrica({ rotulo, valor, icone, detalhe, variacao, tom, className }: Props) {
  const sobe = (variacao ?? 0) >= 0;
  return (
    <div className={cn("rounded-2xl border border-borda bg-superficie p-4", className)}>
      <div className="flex items-center justify-between gap-2">
        {icone && <span className={cn("grid size-8 place-items-center rounded-lg bg-superficie-2 text-texto-2 [&_svg]:size-4", tom)}>{icone}</span>}
        {variacao !== undefined && Number.isFinite(variacao) && (
          <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10.5px] font-bold tabular-nums", sobe ? "bg-verde-claro text-acento" : "bg-red-50 text-alerta")}>
            {sobe ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(Math.round(variacao * 100))}%
          </span>
        )}
      </div>
      <div className="mt-3 text-[22px] font-semibold leading-none tracking-tight text-tinta tabular-nums">{valor}</div>
      <p className="mt-1.5 text-[12.5px] text-texto-2">{rotulo}</p>
      {detalhe && <div className="mt-1.5 text-[11px] leading-snug text-texto-2/90">{detalhe}</div>}
    </div>
  );
}
