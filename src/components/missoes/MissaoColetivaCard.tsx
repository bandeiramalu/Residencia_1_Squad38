"use client";

import { Check } from "lucide-react";
import { m as motion } from "motion/react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Avatar } from "@/components/ui/Avatar";
import { LinkPessoa } from "@/components/ui/LinkPessoa";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { contribuirColetiva } from "@/store/actions";
import { useEstado } from "@/store/store";

/** Missão coletiva da semana: toda a turma coopera por uma meta comum. */
export function MissaoColetivaCard() {
  const { coletiva: c, pessoas, usuario } = useEstado();
  const pct = Math.min(100, Math.round((c.progresso / Math.max(1, c.alvo)) * 100));

  return (
    <div className="rounded-2xl border border-borda bg-superficie p-4">
      <p className="text-[15px] font-semibold leading-snug text-tinta">{c.titulo}</p>
      <p className="mt-0.5 text-[13px] leading-snug text-texto-2">{c.descricao}</p>

      <div className="mt-4 flex items-baseline justify-between gap-3">
        <p className="flex items-baseline gap-1.5">
          <AnimatedNumber valor={c.progresso} className="text-2xl font-semibold tabular-nums text-tinta" />
          <span className="text-[13px] text-texto-2">/ {c.alvo} flashcards</span>
        </p>
        <span className="text-[13px] font-medium tabular-nums text-texto">{pct}%</span>
      </div>
      <ProgressBar valor={c.progresso} max={c.alvo} fina className="mt-2" rotulo="Progresso da missão coletiva" />

      <div className="mt-4 flex items-center gap-2.5">
        <div className="flex -space-x-2">
          {c.participantes.map((id) => (
            <span key={id} className="rounded-full ring-2 ring-superficie">
              <LinkPessoa id={id} rotulo={`Perfil de ${pessoas[id]?.nome ?? id}`}>
                <Avatar nome={pessoas[id]?.nome ?? id} iniciais={pessoas[id]?.iniciais} tamanho="xs" equipados={id === usuario.id ? usuario.equipados : []} />
              </LinkPessoa>
            </span>
          ))}
        </div>
        <span className="text-[12px] text-texto-2">{c.participantes.length} participando</span>
      </div>

      <p className="mt-3 text-[12px] text-texto-2">
        Recompensa: {c.pontosTotal} pontos divididos · +{c.xp} XP para cada
      </p>

      {c.concluida ? (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-3 flex items-center gap-2 rounded-lg bg-verde-mclaro px-3 py-2 text-[13px] font-medium text-acento"
        >
          <Check className="size-4" aria-hidden /> Missão concluída pela turma
        </motion.p>
      ) : (
        <Button variante="secundario" bloco tamanho="sm" className="mt-3" onClick={() => contribuirColetiva(10)}>
          Contribuir com 10 flashcards
        </Button>
      )}
    </div>
  );
}
