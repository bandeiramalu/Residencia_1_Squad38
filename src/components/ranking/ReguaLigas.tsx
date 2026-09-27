"use client";

import { Gem, Medal, Shield, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { LIGA_DO_USUARIO, LIGAS, ZONA, type LigaId } from "@/data/ranking";
import { cn } from "@/lib/cn";

const ICONE: Record<LigaId, typeof Gem> = { bronze: Shield, prata: ShieldCheck, ouro: Medal, diamante: Gem };
const COR: Record<LigaId, string> = {
  bronze: "from-orange-300 to-amber-700",
  prata: "from-slate-200 to-slate-500",
  ouro: "from-amber-200 to-amber-500",
  diamante: "from-cyan-200 to-sky-600",
};

/** Régua de progressão das ligas: Bronze → Prata → Ouro → Diamante. */
export function ReguaLigas({ selecionada, onSelecionar }: { selecionada: LigaId; onSelecionar: (l: LigaId) => void }) {
  const indiceUsuario = LIGAS.findIndex((l) => l.id === LIGA_DO_USUARIO);

  return (
    <div className="rounded-2xl border border-borda bg-white p-3 shadow-card">
      <div className="relative grid grid-cols-4">
        <div className="absolute left-[12.5%] right-[12.5%] top-5 h-1 rounded-full bg-verde-claro" />
        <motion.div
          className="absolute left-[12.5%] top-5 h-1 rounded-full bg-verde-2"
          initial={false}
          animate={{ width: `${(indiceUsuario / (LIGAS.length - 1)) * 75}%` }}
        />
        {LIGAS.map((l) => {
          const Icone = ICONE[l.id];
          const ativa = l.id === selecionada;
          const minha = l.id === LIGA_DO_USUARIO;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => onSelecionar(l.id)}
              aria-pressed={ativa}
              className="relative flex flex-col items-center gap-1 rounded-xl py-1 transition-transform active:scale-95"
            >
              <span
                className={cn(
                  "grid size-11 place-items-center rounded-full bg-linear-to-br text-white shadow-sm ring-4 transition-all duration-300",
                  COR[l.id],
                  ativa ? "scale-110 ring-verde-claro" : "ring-white",
                )}
              >
                <Icone className="size-5 drop-shadow" />
              </span>
              <span className={cn("text-[12px]", ativa ? "font-extrabold text-tinta" : "font-medium text-texto-2")}>{l.nome}</span>
              <span className={cn("text-[10px]", minha ? "font-bold text-verde" : "text-texto-2/70")}>{minha ? "sua liga" : "ver"}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-borda pt-3 text-[11px] text-texto-2">
        <span className="flex items-center gap-1.5">
          <i className="size-3 rounded border border-verde-2/40 bg-verde-mclaro" /> Top {ZONA}: sobem de liga
        </span>
        <span className="flex items-center gap-1.5">
          <i className="size-3 rounded border border-dashed border-texto-2/50 bg-white" /> Últimos {ZONA}: descem
        </span>
        <span>Fechamento: domingo, 23:59</span>
      </div>
      {selecionada !== LIGA_DO_USUARIO && (
        <p className="mt-2 text-[11.5px] font-semibold text-verde-2">
          Você está vendo a liga {LIGAS.find((l) => l.id === selecionada)?.nome}. A sua é a {LIGAS[indiceUsuario].nome}.
        </p>
      )}
    </div>
  );
}
