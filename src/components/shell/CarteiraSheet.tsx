"use client";

import { Coins, Flame, ShoppingBag, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { classesDoBotao } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Sheet } from "@/components/ui/Sheet";
import { fmt } from "@/lib/format";
import { nivelDe } from "@/lib/gamificacao";
import { useSeletor } from "@/store/store";

/** Explica as duas moedas: Pontos (gastáveis) e XP (permanente, define ranking). */
export function CarteiraSheet({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo="Seu saldo" subtitulo="Pontos para trocar, XP para evoluir">
      <Conteudo onFechar={onFechar} />
    </Sheet>
  );
}

/** Só existe com o modal aberto: fechado, o cabeçalho não re-renderiza a carteira a cada ponto ganho. */
function Conteudo({ onFechar }: { onFechar: () => void }) {
  const usuario = useSeletor((e) => e.usuario);
  const dias = useSeletor((e) => e.sequencia.dias);
  const nivel = nivelDe(usuario.xp);

  return (
    <>
      <div className="grid grid-cols-2 divide-x divide-borda rounded-2xl border border-borda">
        <Moeda icone={<Coins className="text-ambar" />} valor={usuario.pontos} rotulo="Pontos" texto="Vêm de participação. Trocados na Loja." />
        <Moeda icone={<Sparkles className="text-acento" />} valor={usuario.xp} rotulo="XP" texto="Vem de mérito. Nunca é gasto." />
      </div>

      <div className="mt-4 rounded-2xl border border-borda p-4">
        <div className="flex items-baseline justify-between gap-2 text-[13px]">
          <span className="font-medium text-tinta">
            Nível {nivel.n} · {nivel.titulo}
          </span>
          <span className="tabular-nums text-texto-2">{nivel.proximo ? `faltam ${fmt(nivel.falta)} XP` : "nível máximo"}</span>
        </div>
        <ProgressBar valor={nivel.pct} fina className="mt-2.5" rotulo="Progresso para o próximo nível" />
        <p className="mt-3 flex items-center gap-1.5 text-[13px] text-texto-2">
          <Flame className="size-4 text-ambar" aria-hidden /> <span className="font-medium tabular-nums text-tinta">{dias}</span> dias seguidos de estudo
        </p>
      </div>

      <p className="mt-3 text-[12.5px] text-texto-2">Gastar pontos na Loja não muda seu XP nem sua posição no ranking.</p>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Link href="/loja" onClick={onFechar} className={classesDoBotao({ variante: "primario", tamanho: "lg", bloco: true })}>
          <ShoppingBag className="size-4" /> Ir para a Loja
        </Link>
        <Link href="/ranking" onClick={onFechar} className={classesDoBotao({ variante: "secundario", tamanho: "lg", bloco: true })}>
          <Trophy className="size-4 text-texto-2" /> Ver ranking
        </Link>
      </div>
    </>
  );
}

function Moeda({ icone, valor, rotulo, texto }: { icone: ReactNode; valor: number; rotulo: string; texto: string }) {
  return (
    <div className="min-w-0 p-4">
      <p className="flex items-center gap-1.5 text-[13px] text-texto-2 [&_svg]:size-4">
        {icone}
        {rotulo}
      </p>
      <AnimatedNumber valor={valor} className="mt-1.5 block text-2xl font-semibold tabular-nums text-tinta" />
      <p className="mt-1 text-[12.5px] leading-snug text-texto-2">{texto}</p>
    </div>
  );
}
