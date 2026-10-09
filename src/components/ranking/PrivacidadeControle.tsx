"use client";

import { EyeOff, UserRound } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import { Avatar } from "@/components/ui/Avatar";
import { Segmentado } from "@/components/ui/Segmentado";
import { cn } from "@/lib/cn";
import { definirPrivacidade } from "@/store/actions";
import { useSeletor } from "@/store/store";
import type { Privacidade } from "@/store/types";

const OPCOES = [
  { id: "publico", rotulo: "Público" },
  { id: "anonimo", rotulo: "Anônimo" },
  { id: "sombra", rotulo: "Invisível" },
] as const;

const EXPLICACAO: Record<Privacidade, { titulo: string; texto: string }> = {
  publico: { titulo: "Público", texto: "Colegas veem seu nome e avatar nos rankings." },
  anonimo: { titulo: "Anônimo", texto: "Sua posição aparece, mas como “Aluno anônimo”." },
  sombra: { titulo: "Modo invisível", texto: "Você não aparece nos rankings; só você vê sua posição." },
};

/** Visibilidade nos rankings em 3 níveis (Público · Anônimo · Invisível), com prévia de como os colegas veem a sua linha. */
export function PrivacidadeControle({ grupo, id, className }: { grupo: string; id?: string; className?: string }) {
  const usuario = useSeletor((e) => e.usuario);
  const nivel = usuario.privacidade;
  const info = EXPLICACAO[nivel];

  return (
    <section id={id} aria-label="Visibilidade no ranking" className={cn("scroll-mt-24 rounded-2xl border border-borda bg-superficie p-4", className)}>
      <h3 className="text-[15px] font-semibold text-tinta">Visibilidade no ranking</h3>
      <p className="mt-0.5 text-[13px] text-texto-2">XP, pontos e medalhas continuam valendo em qualquer opção.</p>
      <p className="mt-1 text-[13px] text-texto-2">Nos campeonatos em que você se inscreve, seu nome aparece para os participantes.</p>

      <Segmentado grupo={grupo} rotulo="Visibilidade no ranking" opcoes={OPCOES} valor={nivel} onChange={definirPrivacidade} className="mt-3" />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={nivel} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }} className="mt-3">
          <p className="text-[13px] font-medium text-tinta">{info.titulo}</p>
          <p className="text-[13px] text-texto-2">{info.texto}</p>

          <div
            aria-label="Como os colegas te veem"
            className={cn("mt-3 flex h-11 items-center gap-2.5 rounded-xl border px-3", nivel === "sombra" ? "border-dashed border-borda" : "border-borda bg-superficie-2")}
          >
            {nivel === "publico" && (
              <>
                <Avatar nome={usuario.nome} tamanho="xs" equipados={usuario.equipados} />
                <span className="truncate text-[13px] font-medium text-tinta">{usuario.nome}</span>
              </>
            )}
            {nivel === "anonimo" && (
              <>
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-superficie text-texto-2 ring-1 ring-inset ring-borda">
                  <UserRound className="size-3.5" aria-hidden />
                </span>
                <span className="truncate text-[13px] font-medium text-tinta">Aluno anônimo</span>
              </>
            )}
            {nivel === "sombra" && (
              <span className="flex min-w-0 items-center gap-2 text-[13px] text-texto-2">
                <EyeOff className="size-4 shrink-0" aria-hidden />
                <span className="truncate">Ninguém vê sua linha</span>
              </span>
            )}
            <span className="ml-auto shrink-0 text-[12px] text-texto-2">prévia</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
