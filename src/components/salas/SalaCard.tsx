"use client";

import { Lock, Power } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { LinkPessoa } from "@/components/ui/LinkPessoa";
import { Badge } from "@/components/ui/Badge";
import type { Pessoa, SalaEstudo } from "@/store/types";
import { FaseAoVivo, IconeSala, PilhaAvatares, rotuloRitmo } from "./comum";

interface Props {
  sala: SalaEstudo;
  pessoas: Record<string, Pessoa>;
  /** A aluna está nesta sala agora. */
  dentro: boolean;
  podeEncerrar: boolean;
  onEncerrar: (sala: SalaEstudo) => void;
}

/**
 * Card da lista de salas, no formato de "grupo/comunidade": ícone com a cor da sala,
 * nome, disciplina · ritmo, quem criou, quem está estudando e o ciclo ao vivo.
 * O link cobre o card inteiro; os botões internos ficam acima dele (`relative z-10`).
 */
export function SalaCard({ sala, pessoas, dentro, podeEncerrar, onEncerrar }: Props) {
  const criador = pessoas[sala.criadorId];
  const total = sala.membros.length + (dentro ? 1 : 0);

  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-borda bg-superficie p-4 transition-colors duration-150 hover:bg-superficie-2">
      <div className="flex items-start gap-3">
        <IconeSala sala={sala} />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[15px] font-medium leading-snug text-tinta">
            <Link
              href={`/estudos/salas/${sala.id}`}
              className="outline-none after:absolute after:inset-0 after:z-[1] after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-verde focus-visible:after:ring-offset-2 focus-visible:after:ring-offset-fundo"
            >
              {sala.nome}
            </Link>
          </h3>
          <p className="mt-0.5 truncate text-[13px] text-texto-2">
            {sala.disciplina ?? "Sala livre"} · {rotuloRitmo(sala)}
            {sala.turma ? ` · ${sala.turma.replace(" Ano ", " ")}` : ""}
          </p>
        </div>
        {podeEncerrar && (
          <button
            type="button"
            onClick={() => onEncerrar(sala)}
            aria-label={`Encerrar a sala ${sala.nome}`}
            title="Encerrar sala"
            className="relative z-10 -mr-1.5 -mt-1 grid size-8 shrink-0 place-items-center rounded-lg text-texto-2 transition-colors hover:bg-red-50 hover:text-alerta"
          >
            <Power className="size-4" aria-hidden />
          </button>
        )}
      </div>

      <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-texto-2">
        {criador && (
          <>
            <LinkPessoa id={sala.criadorId} rotulo={`Perfil de ${criador.nome}`} className="relative z-10 flex rounded-full">
              <Avatar nome={criador.nome} iniciais={criador.iniciais} tamanho="xs" />
            </LinkPessoa>
            <LinkPessoa id={sala.criadorId} className="relative z-10 truncate hover:underline">
              {criador.nome}
            </LinkPessoa>
          </>
        )}
        {sala.oficial && <Badge tom="neutro">Oficial</Badge>}
        {sala.privada && (
          <Badge tom="neutro">
            <Lock aria-hidden />
            Privada
          </Badge>
        )}
        {dentro && <Badge tom="claro">Você está aqui</Badge>}
      </div>

      <div className="mt-auto pt-3">
        <div className="flex items-center justify-between gap-3 border-t border-borda pt-3">
          <span className="flex min-w-0 items-center gap-2">
            <PilhaAvatares ids={sala.membros} pessoas={pessoas} max={3} />
            <span className="truncate text-[12px] text-texto-2">
              {total > 0 ? (
                <>
                  <span className="font-medium tabular-nums text-texto">{total}</span> estudando
                </>
              ) : (
                "Ninguém ainda"
              )}
            </span>
          </span>
          <FaseAoVivo sala={sala} className="shrink-0" />
        </div>
      </div>
    </article>
  );
}
