"use client";

import { CircleCheck, RotateCcw, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FLASHCARDS } from "@/data/missoes";
import { reiniciarPratica, responderCarta, virarCarta } from "@/store/actions";
import { useEstado } from "@/store/store";

/** Widget de prática rápida com flashcards que viram em 3D. */
export function Flashcards() {
  const { pratica: p } = useEstado();
  const total = p.vistas + p.fila.length;
  const carta = FLASHCARDS[p.fila[0] ?? 0];

  if (p.fim) {
    return (
      <Card className="text-center">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 400, damping: 18 }}>
          <CircleCheck className="mx-auto size-12 fill-verde-claro text-verde" />
        </motion.div>
        <p className="mt-3 text-base font-bold text-tinta">Rodada concluída!</p>
        <p className="mt-1 text-sm text-texto-2">
          Você acertou {p.acertos} de {FLASHCARDS.length} cartas de Química. Cada acerto também conta para a Maratona da Turma.
        </p>
        <Button variante="secundario" className="mt-4" onClick={reiniciarPratica}>
          <RotateCcw /> Praticar de novo
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-tinta">
          Carta {p.vistas + 1} de {total}
        </span>
        <span className="text-texto-2">
          {p.acertos} {p.acertos === 1 ? "acerto" : "acertos"}
        </span>
      </div>
      <ProgressBar valor={p.vistas} max={total} fina className="mt-2" rotulo="Progresso do baralho" />

      <div className="relative mt-4 h-40 [perspective:1200px]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.button
            key={p.vistas}
            type="button"
            onClick={() => !p.virada && virarCarta()}
            aria-label={p.virada ? "Resposta exibida" : "Virar carta"}
            initial={{ x: 60, opacity: 0, rotate: 4 }}
            animate={{ x: 0, opacity: 1, rotate: 0 }}
            exit={{ x: -80, opacity: 0, rotate: -6, transition: { duration: 0.22 } }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="absolute inset-0 w-full [transform-style:preserve-3d]"
          >
            <motion.div
              className="relative h-full w-full [transform-style:preserve-3d]"
              animate={{ rotateY: p.virada ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-verde-claro bg-linear-to-br from-verde-mclaro to-verde-claro p-5 text-center [backface-visibility:hidden]">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-verde-2">Pergunta</span>
                <p className="mt-2 text-[16px] font-bold leading-snug text-tinta">{carta.pergunta}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-[11px] text-texto-2">
                  <RefreshCw className="size-3" /> toque para virar
                </span>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-linear-to-br from-verde-2 to-verde p-5 text-center text-white [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/80">Resposta</span>
                <p className="mt-2 text-[16px] font-bold leading-snug">{carta.resposta}</p>
              </div>
            </motion.div>
          </motion.button>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex gap-2">
        {p.virada ? (
          <>
            <Button variante="secundario" className="flex-1" onClick={() => responderCarta(false)}>
              Rever depois
            </Button>
            <Button className="flex-1" onClick={() => responderCarta(true)}>
              Acertei
            </Button>
          </>
        ) : (
          <Button bloco onClick={virarCarta}>
            <RefreshCw /> Virar carta
          </Button>
        )}
      </div>
    </Card>
  );
}
