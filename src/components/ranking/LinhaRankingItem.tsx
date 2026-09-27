"use client";

import { ArrowDown, ArrowUp, Crown, EyeOff, Minus } from "lucide-react";
import { motion } from "motion/react";
import type { Ref } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/format";
import type { LinhaRanking } from "@/lib/gamificacao";

export function Variacao({ linha }: { linha: LinhaRanking }) {
  const { tendencia, variacao } = linha;
  return (
    <span className="flex w-[3.25rem] shrink-0 flex-col items-end gap-0.5">
      <Badge tom={tendencia === "sobe" ? "verde" : tendencia === "desce" ? "neutro" : "claro"} maiuscula className="px-1.5">
        {tendencia === "sobe" ? "Sobe" : tendencia === "desce" ? "Desce" : "Manteve"}
      </Badge>
      <span
        className={cn(
          "flex items-center text-[11px] font-bold tabular-nums",
          tendencia === "sobe" ? "text-verde" : tendencia === "desce" ? "text-texto-2" : "text-texto-2/70",
        )}
      >
        {tendencia === "sobe" ? <ArrowUp className="size-3" /> : tendencia === "desce" ? <ArrowDown className="size-3" /> : <Minus className="size-3" />}
        {Math.abs(variacao)}
      </span>
    </span>
  );
}

interface Props {
  linha: LinhaRanking;
  oculto: boolean;
  equipados: string[];
  divisorAntes?: string;
  ref?: Ref<HTMLLIElement>;
}

/** Linha da tabela: posição, avatar, nome, série, SOBE/DESCE/MANTEVE e XP da semana. */
export function LinhaRankingItem({ linha: l, oculto, equipados, divisorAntes, ref }: Props) {
  return (
    <>
      {divisorAntes && (
        <li aria-hidden className="flex items-center gap-2 px-1 pb-0.5 pt-2 text-[10px] font-bold uppercase tracking-[0.1em] text-texto-2">
          <span className="h-px flex-1 bg-borda" />
          {divisorAntes}
          <span className="h-px flex-1 bg-borda" />
        </li>
      )}
      <motion.li
        ref={ref}
        layout
        transition={{ type: "spring", stiffness: 380, damping: 36 }}
        className={cn(
          "flex items-center gap-2 rounded-2xl border px-2 py-2.5",
          l.eu
            ? "z-10 border-verde bg-verde-claro shadow-card"
            : l.zona === "promocao"
              ? "border-verde-2/35 bg-verde-mclaro"
              : l.zona === "rebaixamento"
                ? "border-dashed border-texto-2/35 bg-white"
                : "border-borda bg-white",
        )}
      >
        <span className={cn("grid w-7 shrink-0 place-items-center text-sm font-extrabold tabular-nums", l.posicao <= 3 ? "text-verde" : "text-texto-2")}>
          {l.posicao === 1 ? <Crown className="size-5 fill-amber-300 text-ambar" aria-label="1º" /> : `${l.posicao}º`}
        </span>
        {oculto ? (
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-texto-2 ring-1 ring-borda">
            <EyeOff className="size-4" />
          </span>
        ) : (
          <Avatar nome={l.nome} tamanho="sm" equipados={equipados} />
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5">
            <span className={cn("truncate text-[13.5px] font-semibold", l.eu ? "text-tinta" : "text-texto")}>
              {oculto ? "Aluno anônimo" : l.nome}
            </span>
            {l.eu && (
              <Badge tom="verde" maiuscula>
                você
              </Badge>
            )}
          </p>
          <p className="text-[11.5px] text-texto-2">{l.turma}</p>
        </div>
        <Variacao linha={l} />
        <span className="w-16 shrink-0 text-right text-[13px] font-extrabold tabular-nums text-verde">
          {fmt(l.xp)} <span className="text-[10px] font-semibold text-texto-2">XP</span>
        </span>
      </motion.li>
    </>
  );
}
