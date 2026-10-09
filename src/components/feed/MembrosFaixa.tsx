"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { MEMBROS_DESTAQUE } from "@/data/pessoas";
import { useAgora } from "@/hooks/useAgora";
import { cn } from "@/lib/cn";
import type { Pessoa, Post } from "@/store/types";

/** Publicou nas últimas horas e quem olha ainda não abriu: anel verde fino, como "stories". */
const JANELA_NOVIDADE = 6 * 3_600_000;

function nomeCurto(p: Pessoa) {
  if (p.papel === "aluno") return `${p.nome.split(" ")[0]} ${p.nome.split(" ")[1]?.[0] ?? ""}.`;
  return p.nome.replace("Coordenação Pedagógica", "Coordenação").split(" ").slice(0, 2).join(" ");
}

interface Props {
  pessoas: Record<string, Pessoa>;
  posts: Post[];
  /** Membro cujo filtro está ativo (`?autor=`). */
  selecionado: string | null;
  /** O toque filtra a timeline por esse membro; tocar de novo no mesmo limpa o filtro. */
  onSelecionar: (id: string | null) => void;
}

/**
 * Faixa de membros (estilo "stories"): o toque filtra o feed pelas publicações da pessoa.
 * O perfil dela continua a um toque, pelo nome na faixa "Publicações de …" que aparece sobre a lista.
 */
export function MembrosFaixa({ pessoas, posts, selecionado, onSelecionar }: Props) {
  const agora = useAgora(60_000);
  const [vistos, setVistos] = useState<string[]>([]);
  const recentes = new Set(posts.filter((p) => agora - p.criadoEm < JANELA_NOVIDADE).map((p) => p.autorId));

  return (
    <nav aria-label="Membros da escola" className="sem-scrollbar -mx-4 flex gap-1 overflow-x-auto px-3 py-1 sm:-mx-6 sm:px-5 lg:mx-0 lg:-ml-1 lg:px-0">
      {MEMBROS_DESTAQUE.map((id) => {
        const p = pessoas[id];
        if (!p) return null;
        const ativo = selecionado === id;
        const novidade = recentes.has(id) && !vistos.includes(id);
        return (
          <button
            key={id}
            type="button"
            aria-pressed={ativo}
            aria-label={`${ativo ? "Parar de filtrar por" : "Ver publicações de"} ${p.nome}${novidade ? ", publicou recentemente" : ""}`}
            onClick={() => {
              if (!vistos.includes(id)) setVistos((v) => [...v, id]);
              onSelecionar(ativo ? null : id);
            }}
            className="group flex w-[76px] shrink-0 flex-col items-center gap-1.5 rounded-xl px-1 pb-1 pt-1.5 transition-opacity hover:opacity-80 active:scale-[0.97]"
          >
            <span
              className={cn(
                "rounded-full p-[3px] transition-[box-shadow] duration-200",
                ativo ? "ring-2 ring-tinta" : novidade ? "ring-[1.5px] ring-verde" : "ring-1 ring-borda group-hover:ring-texto-2/40",
              )}
            >
              <Avatar nome={p.nome} iniciais={p.iniciais} tamanho="lg" className="[&>span:first-child]:size-[50px]" />
            </span>
            <span className={cn("w-full truncate text-center text-[12px] leading-4 transition-colors duration-150", ativo ? "font-medium text-tinta" : "text-texto-2 group-hover:text-tinta")}>
              {nomeCurto(p)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
