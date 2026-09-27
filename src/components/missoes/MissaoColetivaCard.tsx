"use client";

import { PartyPopper, Users } from "lucide-react";
import { motion } from "motion/react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { contribuirColetiva } from "@/store/actions";
import { useEstado } from "@/store/store";

/** Missão coletiva da semana: toda a turma coopera por uma meta comum. */
export function MissaoColetivaCard() {
  const { coletiva: c, pessoas, usuario } = useEstado();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-verde-2/30 bg-linear-to-br from-verde-mclaro via-white to-verde-claro p-4 shadow-card">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-verde text-white shadow-sm">
          <Users className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-extrabold leading-snug text-tinta">{c.titulo}</p>
          <p className="mt-1 text-[12.5px] leading-snug text-texto-2">{c.descricao}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2.5">
        <div className="flex -space-x-2.5">
          {c.participantes.map((id) => (
            <span key={id} className="rounded-full ring-2 ring-white">
              <Avatar nome={pessoas[id]?.nome ?? id} iniciais={pessoas[id]?.iniciais} tamanho="sm" equipados={id === usuario.id ? usuario.equipados : []} />
            </span>
          ))}
        </div>
        <span className="text-[12px] text-texto-2">{c.participantes.length} participantes ativos</span>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-texto-2">Progresso do grupo</span>
          <b className="text-tinta">
            <AnimatedNumber valor={c.progresso} />/{c.alvo} flashcards
          </b>
        </div>
        <ProgressBar valor={c.progresso} max={c.alvo} rotulo="Progresso da missão coletiva" />
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl bg-white/80 px-3 py-2 text-[12px]">
        <span className="text-texto-2">Recompensa</span>
        <b className="text-verde">
          {c.pontosTotal} pontos divididos · +{c.xp} XP cada
        </b>
      </div>

      {c.concluida ? (
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-verde py-2.5 text-sm font-bold text-white"
        >
          <PartyPopper className="size-4" /> Missão coletiva concluída pela turma!
        </motion.p>
      ) : (
        <Button variante="secundario" bloco className="mt-3" onClick={() => contribuirColetiva(10)}>
          Contribuição com 10 flashcards
        </Button>
      )}
    </div>
  );
}
