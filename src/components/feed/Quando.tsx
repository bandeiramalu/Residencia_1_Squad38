"use client";

import { useAgora } from "@/hooks/useAgora";
import { tempoRelativo } from "@/lib/tempo";

/**
 * "há 5 min" com relógio próprio: a cada 30 s só este texto re-renderiza,
 * não o feed inteiro nem os cards (o intervalo é compartilhado entre todos).
 */
export function Quando({ ts, className }: { ts: number; className?: string }) {
  const agora = useAgora(30_000);
  return (
    <time dateTime={new Date(ts).toISOString()} className={className}>
      {tempoRelativo(ts, agora)}
    </time>
  );
}
