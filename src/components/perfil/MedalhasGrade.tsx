"use client";

import { Lock } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Nota } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { RodapeSheet } from "@/components/ui/RodapeSheet";
import { Sheet } from "@/components/ui/Sheet";
import { MEDALHAS, type MedalhaDef } from "@/data/medalhas";
import { cn } from "@/lib/cn";
import { progressoMedalha } from "@/lib/gamificacao";
import { dataCurta } from "@/lib/tempo";
import { useEstado } from "@/store/store";
import { MedalhaIcone } from "./MedalhaIcone";

/** Galeria de medalhas desbloqueáveis; o toque abre o progresso (fluxo 3.5). */
export function MedalhasGrade() {
  const estado = useEstado();
  const [aberta, setAberta] = useState<MedalhaDef | null>(null);
  const desbloqueio = (id: string) => estado.medalhas.find((m) => m.id === id)?.desbloqueadaEm;

  return (
    <>
      <ul className="grid grid-cols-4 gap-2">
        {MEDALHAS.map((m, i) => {
          const em = desbloqueio(m.id);
          const prog = progressoMedalha(m, estado);
          return (
            <motion.li key={m.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04, type: "spring", stiffness: 400, damping: 22 }}>
              <button
                type="button"
                onClick={() => setAberta(m)}
                aria-label={`Medalha ${m.nome}${em ? ", conquistada" : ", bloqueada"}`}
                className={cn(
                  "flex h-full w-full flex-col items-center gap-1.5 rounded-2xl border px-1 py-2.5 text-center transition-all duration-200 hover:-translate-y-0.5 active:scale-95",
                  em ? "border-verde-claro bg-verde-mclaro" : "border-dashed border-verde-suave bg-white",
                )}
              >
                <span
                  className={cn(
                    "relative grid size-11 place-items-center rounded-full",
                    em ? "bg-linear-to-br from-verde-2 to-verde text-white shadow-sm" : "bg-fundo text-texto-2/60",
                  )}
                >
                  <MedalhaIcone icone={m.icone} className="size-5" />
                  {!em && (
                    <span className="absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-white ring-1 ring-borda">
                      <Lock className="size-2.5 text-texto-2" />
                    </span>
                  )}
                </span>
                <span className={cn("text-[10.5px] font-semibold leading-tight", em ? "text-tinta" : "text-texto-2")}>{m.nome}</span>
                {!em && <ProgressBar valor={prog.pct} fina className="mx-auto w-10" rotulo={`Progresso de ${m.nome}`} />}
              </button>
            </motion.li>
          );
        })}
      </ul>

      <Sheet aberto={!!aberta} onFechar={() => setAberta(null)} titulo={aberta?.nome ?? "Medalha"} subtitulo={aberta?.criterio}>
        {aberta &&
          (() => {
            const em = desbloqueio(aberta.id);
            const prog = progressoMedalha(aberta, estado);
            return (
              <>
                <motion.div
                  initial={{ scale: 0.5, rotate: -20, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 14 }}
                  className={cn(
                    "mx-auto grid size-24 place-items-center rounded-[28px]",
                    em ? "bg-linear-to-br from-verde-2 to-tinta text-white shadow-flutuante" : "border-2 border-dashed border-verde-suave bg-fundo text-texto-2/60",
                  )}
                >
                  <MedalhaIcone icone={aberta.icone} className="size-11" />
                </motion.div>
                <p className="mt-3 text-center text-sm font-semibold text-tinta">{em ? "Conquistada!" : "Ainda bloqueada"}</p>

                <div className="mt-4 rounded-2xl bg-verde-mclaro p-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-texto-2">{em ? "Conquistada em" : "Progresso atual"}</span>
                    <b className="text-tinta">{em ? dataCurta(em) : prog.texto}</b>
                  </div>
                  <ProgressBar valor={em ? 100 : prog.pct} className="mt-2" rotulo="Progresso de desbloqueio" />
                  <p className="mt-2 text-[12px] text-texto-2">
                    <b className="text-texto">Critério:</b> {aberta.criterio}.
                  </p>
                </div>

                <Nota icone={<Lock />} tom="branco" className="mt-3">
                  Medalhas são registradas por mérito e ficam no seu perfil para sempre. Não podem ser compradas com pontos.
                </Nota>

                <RodapeSheet>
                  <Button tamanho="lg" bloco onClick={() => setAberta(null)}>
                    Fechar
                  </Button>
                </RodapeSheet>
              </>
            );
          })()}
      </Sheet>
    </>
  );
}
