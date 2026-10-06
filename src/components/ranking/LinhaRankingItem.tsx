"use client";

import { ArrowDown, ArrowUp, EyeOff, Minus, UserRound } from "lucide-react";
import { m as motion } from "motion/react";
import type { ReactNode, Ref } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { LinkPessoa } from "@/components/ui/LinkPessoa";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/format";
import type { LinhaRanking, Tendencia } from "@/lib/gamificacao";

const ROTULO: Record<Tendencia, string> = { sobe: "Sobe", desce: "Desce", manteve: "Manteve" };

/** Mola sem "quique" para as linhas que trocam de lugar. */
export const MOLA_LINHA = { type: "spring", stiffness: 600, damping: 50 } as const;

/** SOBE / DESCE / MANTEVE: seta pequena colorida + quantas posições mudaram desde o último fechamento. */
export function Variacao({ tendencia, variacao, className }: { tendencia: Tendencia; variacao: number; className?: string }) {
  const Icone = tendencia === "sobe" ? ArrowUp : tendencia === "desce" ? ArrowDown : Minus;
  const n = Math.abs(variacao);
  const descricao = tendencia === "manteve" ? "Manteve a posição desde o último fechamento" : `${ROTULO[tendencia]} ${n} ${n === 1 ? "posição" : "posições"} desde o último fechamento`;
  return (
    <span
      title={descricao}
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 text-[12px] font-medium tabular-nums",
        tendencia === "sobe" ? "text-acento" : tendencia === "desce" ? "text-alerta" : "text-texto-2",
        className,
      )}
    >
      <Icone className="size-3" strokeWidth={2.5} aria-hidden />
      {tendencia !== "manteve" && <span aria-hidden>{n}</span>}
      <span className="sr-only">{descricao}</span>
    </span>
  );
}

/** Posição na tabela. Só o 1º lugar ganha a cor de pódio; 2º e 3º ficam num círculo neutro. */
export function Posicao({ n }: { n: number }) {
  if (n <= 3) {
    return (
      <span className="grid w-7 shrink-0 place-items-center">
        <span
          aria-label={`${n}º lugar`}
          className={cn(
            "grid size-6 place-items-center rounded-full text-[12px] font-semibold tabular-nums",
            n === 1 ? "bg-ouro-claro text-ouro" : "bg-superficie-2 text-tinta ring-1 ring-inset ring-borda",
          )}
        >
          {n}
        </span>
      </span>
    );
  }
  return <span className="w-7 shrink-0 text-center text-[13px] tabular-nums text-texto-2">{n}º</span>;
}

/** Avatar neutro de quem está anônimo no ranking. */
export function AvatarAnonimo() {
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-superficie-2 text-texto-2 ring-1 ring-inset ring-borda">
      <UserRound className="size-4" aria-hidden />
    </span>
  );
}

/** Barra de 3 px à esquerda: a sua linha (verde) ou as zonas de promoção/rebaixamento (tom suave). */
export function FaixaDestaque({ tom = "eu" }: { tom?: "eu" | "promocao" | "rebaixamento" }) {
  return (
    <span
      aria-hidden
      className={cn("absolute inset-y-0 left-0 w-[3px]", tom === "eu" ? "bg-verde" : tom === "promocao" ? "bg-verde/35" : "bg-alerta/30")}
    />
  );
}

interface Props {
  linha: LinhaRanking;
  oculto: boolean;
  equipados: string[];
  ref?: Ref<HTMLLIElement>;
}

/** Linha da tabela: posição, avatar, nome, turma, variação e XP da semana. */
export function LinhaRankingItem({ linha: l, oculto, equipados, ref }: Props) {
  return (
    <motion.li
      ref={ref}
      layout="position"
      transition={MOLA_LINHA}
      className={cn("relative flex items-center gap-2.5 px-3 py-2.5 sm:gap-3 sm:px-4", l.eu && "bg-verde-mclaro")}
    >
      {l.eu ? <FaixaDestaque /> : l.zona && <FaixaDestaque tom={l.zona} />}
      <Posicao n={l.posicao} />
      {oculto ? (
        <AvatarAnonimo />
      ) : (
        <LinkPessoa id={l.id} rotulo={`Perfil de ${l.nome}`} className="shrink-0">
          <Avatar nome={l.nome} tamanho="sm" equipados={equipados} />
        </LinkPessoa>
      )}
      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 items-baseline gap-1.5">
          {oculto ? (
            <span className="truncate text-[14px] font-semibold text-tinta">Aluno anônimo</span>
          ) : (
            <LinkPessoa id={l.id} className={cn("truncate text-[14px] text-tinta", l.eu ? "font-semibold" : "font-medium")}>
              {l.nome}
            </LinkPessoa>
          )}
          {l.eu && <span className="shrink-0 text-[12px] font-medium text-acento">você</span>}
        </p>
        <p className="truncate text-[12px] text-texto-2">{l.turma}</p>
      </div>
      <Variacao tendencia={l.tendencia} variacao={l.variacao} className="w-10 justify-end sm:w-16" />
      <span className="w-14 shrink-0 text-right text-[14px] font-medium tabular-nums text-tinta">{fmt(l.xp)}</span>
    </motion.li>
  );
}

/**
 * Modo invisível: a aluna saiu da lista pública, mas vê uma linha tracejada
 * exatamente onde estaria. Só ela enxerga esta linha.
 */
export function LinhaFantasma({ posicao, valor, ref }: { posicao: number; valor: ReactNode; ref?: Ref<HTMLLIElement> }) {
  return (
    <motion.li
      ref={ref}
      layout="position"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...MOLA_LINHA, opacity: { duration: 0.18 } }}
      className="px-1.5 py-1.5 sm:px-2.5"
    >
      <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-borda px-1.5 py-2 sm:gap-3 sm:px-1.5">
        <span className="w-7 shrink-0 text-center text-[13px] tabular-nums text-texto-2">{posicao}º</span>
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-superficie-2 text-texto-2">
          <EyeOff className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-tinta">Você estaria em {posicao}º</p>
          <p className="truncate text-[12px] text-texto-2">Modo invisível · só você vê</p>
        </div>
        <span className="shrink-0 text-right text-[14px] tabular-nums text-texto-2">{valor}</span>
      </div>
    </motion.li>
  );
}
