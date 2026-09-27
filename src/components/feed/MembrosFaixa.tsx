"use client";

import { Avatar } from "@/components/ui/Avatar";
import { MEMBROS_DESTAQUE } from "@/data/pessoas";
import { cn } from "@/lib/cn";
import type { Pessoa } from "@/store/types";

/** Faixa de avatares: o toque filtra a timeline pelas publicações daquele autor. */
export function MembrosFaixa({
  pessoas,
  selecionado,
  onSelecionar,
}: {
  pessoas: Record<string, Pessoa>;
  selecionado: string | null;
  onSelecionar: (id: string | null) => void;
}) {
  return (
    <div role="toolbar" aria-label="Filtrar por membro da turma" className="sem-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 py-1">
      {MEMBROS_DESTAQUE.map((id) => {
        const p = pessoas[id];
        if (!p) return null;
        const ativo = selecionado === id;
        const apagado = selecionado !== null && !ativo;
        const curto = p.papel === "aluno" ? `${p.nome.split(" ")[0]} ${p.nome.split(" ")[1]?.[0] ?? ""}.` : p.nome.replace("Coordenação Pedagógica", "Coordenação").split(" ").slice(0, 2).join(" ");
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelecionar(ativo ? null : id)}
            aria-pressed={ativo}
            className={cn("flex w-16 shrink-0 flex-col items-center gap-1.5 transition-opacity duration-200 active:scale-95", apagado && "opacity-45")}
          >
            <span
              className={cn(
                "rounded-full p-[2.5px] transition-all duration-300",
                ativo ? "bg-linear-to-tr from-verde to-emerald-400" : p.papel === "professor" ? "bg-verde-2/70" : "bg-verde-suave",
              )}
            >
              <span className="block rounded-full bg-white p-[2px]">
                <Avatar nome={p.nome} iniciais={p.iniciais} tamanho="lg" />
              </span>
            </span>
            <span className={cn("w-full truncate text-center text-[11px]", ativo ? "font-bold text-verde" : "text-texto-2")}>{curto}</span>
          </button>
        );
      })}
    </div>
  );
}
