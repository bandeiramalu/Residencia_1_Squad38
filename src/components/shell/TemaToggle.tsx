"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { Segmentado } from "@/components/ui/Segmentado";
import { cn } from "@/lib/cn";
import { useTema, type PreferenciaTema } from "@/lib/tema";

const OPCOES = [
  { id: "claro", rotulo: <Sun />, aria: "Tema claro" },
  { id: "escuro", rotulo: <Moon />, aria: "Tema escuro" },
  { id: "sistema", rotulo: <Monitor />, aria: "Seguir o sistema" },
] as const;

const OPCOES_COM_TEXTO = [
  { id: "claro", rotulo: <><Sun /> Claro</> },
  { id: "escuro", rotulo: <><Moon /> Escuro</> },
  { id: "sistema", rotulo: <><Monitor /> Sistema</> },
] as const;

/** Seletor de aparência: claro, escuro ou seguir o sistema. */
export function TemaSegmentado({ comTexto, grupo = "tema", className }: { comTexto?: boolean; grupo?: string; className?: string }) {
  const { preferencia, definir } = useTema();
  return (
    <Segmentado
      grupo={grupo}
      rotulo="Aparência"
      tamanho={comTexto ? "md" : "sm"}
      opcoes={comTexto ? OPCOES_COM_TEXTO : OPCOES}
      valor={preferencia}
      onChange={(v) => definir(v as PreferenciaTema)}
      className={className}
    />
  );
}

/** Botão redondo que alterna claro/escuro. */
export function BotaoTema({ className }: { className?: string }) {
  const { tema, alternar } = useTema();
  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={tema === "escuro" ? "Usar tema claro" : "Usar tema escuro"}
      className={cn("grid size-9 place-items-center rounded-full text-texto transition-colors hover:bg-verde-mclaro hover:text-acento active:scale-90", className)}
    >
      {tema === "escuro" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  );
}
