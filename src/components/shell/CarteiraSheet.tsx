"use client";

import { Coins, Flame, ShoppingBag, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { Nota } from "@/components/ui/Blocos";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Sheet } from "@/components/ui/Sheet";
import { fmt } from "@/lib/format";
import { nivelDe } from "@/lib/gamificacao";
import { useEstado } from "@/store/store";

/** Explica as duas moedas: Pontos (gastáveis) e XP (permanente, define ranking). */
export function CarteiraSheet({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const { usuario, sequencia } = useEstado();
  const nivel = nivelDe(usuario.xp);

  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo="Seu saldo" subtitulo="Duas moedas, dois propósitos">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-borda bg-white p-4">
          <Coins className="size-5 text-verde" />
          <p className="mt-2 text-2xl font-extrabold text-tinta">{fmt(usuario.pontos)}</p>
          <p className="text-xs font-semibold text-texto-2">Pontos da Loja</p>
          <p className="mt-2 text-[12px] leading-snug text-texto-2">Vêm de participação e constância. Podem ser trocados no Marketplace.</p>
        </div>
        <div className="rounded-2xl border border-borda bg-white p-4">
          <Sparkles className="size-5 text-verde-2" />
          <p className="mt-2 text-2xl font-extrabold text-tinta">{fmt(usuario.xp)}</p>
          <p className="text-xs font-semibold text-texto-2">XP · Nível {nivel.n}</p>
          <p className="mt-2 text-[12px] leading-snug text-texto-2">Vem de mérito acadêmico. Nunca é gasto e define ranking e nível.</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-verde-mclaro p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-tinta">
            Nível {nivel.n} · {nivel.titulo}
          </span>
          <span className="text-texto-2">{nivel.proximo ? `faltam ${fmt(nivel.falta)} XP` : "nível máximo"}</span>
        </div>
        <ProgressBar valor={nivel.pct} className="mt-2" rotulo="Progresso para o próximo nível" />
        <p className="mt-3 flex items-center gap-1.5 text-xs text-texto-2">
          <Flame className="size-4 text-ambar" /> {sequencia.dias} dias seguidos de estudo
        </p>
      </div>

      <Nota icone={<Trophy />} className="mt-4">
        Gastar pontos na Loja <b className="text-tinta">não muda</b> seu XP nem sua posição no ranking.
      </Nota>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Link
          href="/loja"
          onClick={onFechar}
          className="flex items-center justify-center gap-2 rounded-xl bg-verde px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-verde-2 active:scale-[0.97]"
        >
          <ShoppingBag className="size-4" /> Ir para a Loja
        </Link>
        <Link
          href="/ranking"
          onClick={onFechar}
          className="flex items-center justify-center gap-2 rounded-xl border border-borda bg-white px-4 py-2.5 text-sm font-semibold text-verde transition-colors hover:bg-verde-mclaro active:scale-[0.97]"
        >
          <Trophy className="size-4" /> Ver ranking
        </Link>
      </div>
    </Sheet>
  );
}
