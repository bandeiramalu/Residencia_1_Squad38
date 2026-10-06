"use client";

import { Gem, Medal, Shield, ShieldCheck, type LucideIcon } from "lucide-react";
import { m as motion } from "motion/react";
import { LIGA_DO_USUARIO, LIGAS, ZONA, type LigaId } from "@/data/ranking";
import { cn } from "@/lib/cn";

const ICONE: Record<LigaId, LucideIcon> = { bronze: Shield, prata: ShieldCheck, ouro: Medal, diamante: Gem };

export const nomeDaLiga = (id: LigaId) => LIGAS.find((l) => l.id === id)?.nome ?? id;

/** Emblema da liga: ícone de linha num círculo neutro. */
export function EmblemaLiga({ liga, className }: { liga: LigaId; className?: string }) {
  const Icone = ICONE[liga];
  return (
    <span className={cn("grid size-9 shrink-0 place-items-center rounded-full bg-superficie-2 text-texto-2 ring-1 ring-inset ring-borda [&_svg]:size-[18px]", className)}>
      <Icone aria-hidden />
    </span>
  );
}

interface Props {
  selecionada: LigaId;
  onSelecionar: (l: LigaId) => void;
  /** `false` quando a tabela está em outro escopo (turma/disciplina): nenhuma liga fica marcada. */
  ativa?: boolean;
  className?: string;
}

/** Régua de progressão das ligas: Bronze → Prata → Ouro → Diamante. Toque para ver outra liga. */
export function ReguaLigas({ selecionada, onSelecionar, ativa = true, className }: Props) {
  const indiceUsuario = LIGAS.findIndex((l) => l.id === LIGA_DO_USUARIO);

  return (
    <div className={cn("rounded-2xl border border-borda bg-superficie p-4", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-[15px] font-semibold text-tinta">Ligas</h3>
        <span className="text-[12px] text-texto-2">Toque para ver outra liga</span>
      </div>

      <div className="relative mt-3 grid grid-cols-4">
        <div aria-hidden className="absolute left-[12.5%] right-[12.5%] top-[22px] h-px bg-borda" />
        <motion.div
          aria-hidden
          className="absolute left-[12.5%] top-[22px] h-px bg-verde"
          initial={false}
          animate={{ width: `${(indiceUsuario / (LIGAS.length - 1)) * 75}%` }}
          transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
        />
        {LIGAS.map((l) => {
          const marcada = ativa && l.id === selecionada;
          const minha = l.id === LIGA_DO_USUARIO;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => onSelecionar(l.id)}
              aria-pressed={marcada}
              aria-label={`Ver a liga ${l.nome}${minha ? " (sua liga)" : ""}`}
              className="group relative flex flex-col items-center gap-1 rounded-xl py-1 transition-colors hover:bg-superficie-2"
            >
              <EmblemaLiga
                liga={l.id}
                className={cn("transition-colors duration-150", marcada ? "bg-tinta text-superficie ring-tinta" : "bg-superficie group-hover:text-tinta")}
              />
              <span className={cn("text-[12px]", marcada ? "font-medium text-tinta" : "text-texto-2")}>{l.nome}</span>
              <span className={cn("text-[11px] leading-none", minha ? "font-medium text-acento" : "text-transparent")}>{minha ? "sua liga" : "·"}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 border-t border-borda pt-3 text-[12px] text-texto-2">
        Top {ZONA} sobem · últimos {ZONA} descem · fecha domingo, 23:59
      </p>
      {ativa && selecionada !== LIGA_DO_USUARIO && (
        <p className="mt-1.5 text-[12px] text-texto-2">
          Vendo a Liga {nomeDaLiga(selecionada)}.{" "}
          <button type="button" onClick={() => onSelecionar(LIGA_DO_USUARIO)} className="font-medium text-acento hover:underline">
            Voltar para a {LIGAS[indiceUsuario].nome}
          </button>
        </p>
      )}
    </div>
  );
}
