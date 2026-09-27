"use client";

import { Leaf, Sprout } from "lucide-react";
import { motion } from "motion/react";
import { itemPorId, type Slot } from "@/data/loja";
import { cn } from "@/lib/cn";

type Tamanho = "xs" | "sm" | "md" | "lg" | "xl";

const TAMANHOS: Record<Tamanho, { caixa: string; texto: string; enfeite: string }> = {
  xs: { caixa: "size-6", texto: "text-[9px]", enfeite: "size-3 text-[8px]" },
  sm: { caixa: "size-8", texto: "text-[11px]", enfeite: "size-3.5 text-[9px]" },
  md: { caixa: "size-10", texto: "text-xs", enfeite: "size-4 text-[10px]" },
  lg: { caixa: "size-14", texto: "text-base", enfeite: "size-5 text-xs" },
  xl: { caixa: "size-20", texto: "text-2xl", enfeite: "size-7 text-base" },
};

/** Tons determinísticos por pessoa, sempre dentro da paleta verde do DS. */
const TONS = [
  "bg-verde-claro text-verde",
  "bg-verde-suave text-tinta",
  "bg-linear-to-br from-verde-2 to-verde text-white",
  "bg-linear-to-br from-verde to-tinta text-white",
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Iniciais dos dois primeiros nomes: "Ana Beatriz Moura" → "AB", "Lucas Ferreira" → "LF". */
export function iniciaisDe(nome: string) {
  const partes = nome.replace(/^(Prof\.|Profª\.|Teacher)\s+/, "").split(" ").filter(Boolean);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase();
}

interface Props {
  nome: string;
  iniciais?: string;
  tamanho?: Tamanho;
  /** Itens da Loja equipados (só para o avatar da própria aluna). */
  equipados?: string[];
  ativo?: boolean;
  className?: string;
}

export function Avatar({ nome, iniciais, tamanho = "md", equipados = [], ativo, className }: Props) {
  const t = TAMANHOS[tamanho];
  const slots = new Set<Slot>(equipados.map((id) => itemPorId(id)?.slot).filter((s): s is Slot => !!s));
  const tom = slots.has("fundo") ? "bg-linear-to-br from-emerald-300 via-verde-2 to-verde text-white" : TONS[hash(nome) % TONS.length];

  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full font-bold tracking-tight",
          t.caixa,
          t.texto,
          tom,
          slots.has("moldura") && "ring-2 ring-verde-2 ring-offset-2 ring-offset-white",
          ativo && !slots.has("moldura") && "ring-2 ring-verde ring-offset-2 ring-offset-white",
          slots.has("efeito") && "animate-brilho",
        )}
        aria-hidden
      >
        {iniciais ?? iniciaisDe(nome)}
      </span>

      {slots.has("moldura") && (
        <>
          <Leaf className="absolute -left-1 -top-1 size-3.5 -rotate-45 fill-verde-claro text-verde-2" aria-hidden />
          <Leaf className="absolute -bottom-1 -right-1 size-3.5 rotate-[135deg] fill-verde-claro text-verde-2" aria-hidden />
        </>
      )}

      {slots.has("adesivo") && (
        <span
          className={cn(
            "absolute -bottom-1 -right-1.5 grid place-items-center rounded-full bg-white shadow ring-1 ring-borda",
            t.enfeite,
          )}
          aria-hidden
        >
          🦉
        </span>
      )}

      {slots.has("animado") && (
        <motion.span
          className="absolute -top-2 left-1/2 -translate-x-1/2 text-verde-2"
          initial={{ scale: 0.4, y: 6, opacity: 0 }}
          animate={{ scale: [0.6, 1.05, 1], y: [6, -2, 0], opacity: 1, rotate: [0, -8, 6, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.6, ease: "easeOut" }}
          aria-hidden
        >
          <Sprout className={cn(tamanho === "xl" ? "size-6" : "size-3.5", "drop-shadow-sm")} />
        </motion.span>
      )}
      <span className="sr-only">{nome}</span>
    </span>
  );
}
