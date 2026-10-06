"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ROTULO_FORMATO, ROTULO_METRICA } from "@/data/campeonatos";
import { cn } from "@/lib/cn";
import type { Campeonato, Pessoa } from "@/store/types";
import { COR_SITUACAO, ICONE_FORMATO, PilhaAvatares, PontoCapa, Prazo, textoPremio, turmaCurta, type Situacao } from "./comum";

interface Props {
  c: Campeonato;
  pessoas: Record<string, Pessoa>;
  situacao: Situacao | null;
  /** Turma da aluna (destaca a turma no interclasses). */
  turma?: string;
}

/** Cartão de campeonato: ponto da capa, nome, badges neutros, prazo, participantes, prêmio e a situação da aluna. */
export function CartaoCampeonato({ c, pessoas, situacao, turma }: Props) {
  const IconeFormato = ICONE_FORMATO[c.formato];

  return (
    <Link
      href={`/campeonatos/${c.id}`}
      className="group flex h-full flex-col gap-3 rounded-2xl border border-borda bg-superficie p-4 transition-colors duration-150 hover:bg-superficie-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <PontoCapa capa={c.capa} />
          <h3 className="min-w-0 flex-1 truncate text-[15px] font-semibold text-tinta">{c.nome}</h3>
        </div>
        <p className="mt-1 text-[13px] text-texto-2">
          <Prazo c={c} />
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge tom="neutro">
          <IconeFormato aria-hidden />
          {ROTULO_FORMATO[c.formato]}
        </Badge>
        <Badge tom="neutro">{ROTULO_METRICA[c.metrica].nome}</Badge>
        <Badge tom="neutro">{c.oficial ? "Oficial" : "Amistoso"}</Badge>
        {c.disciplina && <Badge tom="contorno">{c.disciplina}</Badge>}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 text-[12px] text-texto-2">
        {c.formato === "interclasses" ? (
          <span className="flex min-w-0 flex-wrap gap-x-2 gap-y-0.5">
            {c.participantes.slice(0, 4).map((t) => (
              <span key={t} className={cn("tabular-nums", t === turma ? "font-medium text-tinta" : "text-texto-2")}>
                {turmaCurta(t)}
              </span>
            ))}
            {c.participantes.length > 4 && <span>+{c.participantes.length - 4}</span>}
          </span>
        ) : (
          <span className="flex min-w-0 items-center gap-2">
            {c.participantes.length > 0 && <PilhaAvatares ids={c.participantes} pessoas={pessoas} />}
            <span className="truncate tabular-nums">
              {c.participantes.length}/{c.maxParticipantes}
            </span>
          </span>
        )}
        <span className="min-w-0 truncate text-right" title="Prêmio do campeão">
          {textoPremio(c.premio)}
        </span>
      </div>

      {situacao && (
        <p className={cn("-mx-4 -mb-4 flex items-center gap-1.5 border-t border-borda px-4 py-2.5 text-[13px] font-medium", COR_SITUACAO[situacao.tom])}>
          <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
          {situacao.texto}
        </p>
      )}
    </Link>
  );
}
