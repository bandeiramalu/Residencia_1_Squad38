"use client";

import { ChevronRight, Users } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { plural } from "@/lib/format";
import { useSeletor } from "@/store/store";

/** Convite para as salas coletivas: quantas estão abertas e quanta gente está focando agora. */
export function SalasAoVivo({ agora, className }: { agora: number; className?: string }) {
  const salas = useSeletor((e) => e.salas);
  const salaAtual = useSeletor((e) => e.salaAtual);
  const abertas = salas.filter((s) => !s.agendadaPara || s.agendadaPara <= agora);
  const focando = abertas.reduce((n, s) => n + s.membros.length, 0) + (salaAtual ? 1 : 0);
  const cheia = abertas.reduce<(typeof abertas)[number] | undefined>((m, s) => (!m || s.membros.length > m.membros.length ? s : m), undefined);

  return (
    <Link
      href="/estudos/salas"
      className={cn("group block rounded-2xl border border-borda bg-superficie p-4 transition-colors duration-150 hover:bg-superficie-2", className)}
    >
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-superficie-2 text-texto-2 ring-1 ring-inset ring-borda">
          <Users className="size-[18px]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium text-tinta">Estudar com a turma</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-texto-2">
            {abertas.length ? (
              <>
                <span className="size-1.5 shrink-0 animate-pulso rounded-full bg-verde" aria-hidden />
                <span className="truncate">
                  {plural(abertas.length, "sala ao vivo", "salas ao vivo")} · {focando} focando
                </span>
              </>
            ) : (
              "Nenhuma sala aberta agora"
            )}
          </p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-texto-2 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
      </div>

      {cheia && <p className="mt-3 truncate border-t border-borda pt-3 text-[12px] text-texto-2">Mais cheia: <span className="font-medium text-texto">{cheia.nome}</span></p>}
    </Link>
  );
}
