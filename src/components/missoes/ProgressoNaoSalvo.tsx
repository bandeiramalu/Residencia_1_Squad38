"use client";

import { CloudOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { tentarSalvarDeNovo } from "@/store/actions";
import { useUI } from "@/store/ui";

/**
 * Wireframe 76 — "Não conseguimos salvar seu progresso". Aparece na linha da missão (ou da Maratona)
 * enquanto houver falha registrada para alguma das `chaves` (id da missão ou "coletiva").
 * Ícone + texto + ação: a informação não depende só da cor.
 */
export function ProgressoNaoSalvo({ chaves, className }: { chaves: string[]; className?: string }) {
  const falhas = useUI().falhasProgresso;
  const ativas = chaves.filter((c) => falhas?.[c]);
  if (!ativas.length) return null;

  return (
    <div role="status" className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-borda bg-superficie-2 px-3 py-2", className)}>
      <span className="inline-flex min-w-0 flex-1 items-center gap-2 text-[13px] font-medium text-ouro">
        <CloudOff className="size-4 shrink-0" aria-hidden />
        Progresso não salvo
      </span>
      <Button variante="secundario" tamanho="sm" onClick={() => ativas.forEach((c) => tentarSalvarDeNovo(c))}>
        <RefreshCw aria-hidden />
        Tentar novamente
      </Button>
    </div>
  );
}
