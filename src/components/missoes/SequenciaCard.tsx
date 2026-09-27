"use client";

import { Check, Flame, Snowflake, X } from "lucide-react";
import { motion } from "motion/react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/cn";
import { NOMES_DIAS } from "@/lib/tempo";
import { CUSTO_RECUPERACAO, recomecarSequencia, recuperarSequencia, registrarEstudo, simularAusencia } from "@/store/actions";
import { useEstado } from "@/store/store";
import type { StatusDia } from "@/store/types";

const ESTILO_DIA: Record<StatusDia, string> = {
  estudou: "bg-linear-to-b from-amber-400 to-ambar text-white shadow-sm",
  congelado: "bg-sky-100 text-sky-600 ring-1 ring-inset ring-sky-200",
  perdido: "bg-red-50 text-alerta ring-1 ring-inset ring-red-200",
  pendente: "border-2 border-dashed border-amber-300 bg-white text-ambar",
  futuro: "bg-fundo text-texto-2/50",
};

function IconeDia({ status }: { status: StatusDia }) {
  if (status === "estudou") return <Flame className="size-4 fill-white/30" />;
  if (status === "congelado") return <Snowflake className="size-4" />;
  if (status === "perdido") return <X className="size-4" />;
  if (status === "pendente") return <Flame className="size-4" />;
  return <span className="size-1.5 rounded-full bg-current" />;
}

/** Card de Sequência (streak) com calendário semanal e congeladores. */
export function SequenciaCard({ feitasHoje, totalHoje }: { feitasHoje: number; totalHoje: number }) {
  const { sequencia: s, usuario } = useEstado();

  return (
    <Card className="overflow-hidden p-0">
      <div className="bg-linear-to-br from-amber-50 via-white to-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-texto-2">Sua sequência</p>
            <div className="mt-1 flex items-center gap-2">
              <motion.span
                key={s.dias}
                initial={{ scale: 0.6, rotate: -12 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 14 }}
              >
                <Flame className={cn("size-9", s.quebrada ? "text-texto-2/40" : "fill-amber-400 text-ambar")} />
              </motion.span>
              <AnimatedNumber valor={s.dias} className="text-4xl font-extrabold tracking-tight text-ambar" />
              <span className="mt-2 whitespace-nowrap text-sm font-semibold text-texto-2">dias seguidos</span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex justify-end gap-1">
              {Array.from({ length: s.congeladoresMax }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "grid size-7 place-items-center rounded-lg transition-colors",
                    i < s.congeladores ? "bg-sky-100 text-sky-600" : "bg-fundo text-texto-2/40",
                  )}
                >
                  <Snowflake className="size-4" />
                </span>
              ))}
            </div>
            <p className="mt-1 whitespace-nowrap text-[11px] leading-tight text-texto-2">
              {s.congeladores}/{s.congeladoresMax} congeladores
              <br />
              no mês
            </p>
          </div>
        </div>

        {/* Semana atual */}
        <ol className="mt-4 grid grid-cols-7 gap-1.5" aria-label="Sequência desta semana">
          {NOMES_DIAS.map((nome, i) => {
            const status = s.semana[i];
            const hoje = i === s.hoje;
            return (
              <li key={nome} className="flex flex-col items-center gap-1">
                <motion.span
                  layout
                  key={status}
                  initial={{ scale: 0.7, opacity: 0.4 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  className={cn("grid size-9 place-items-center rounded-full", ESTILO_DIA[status])}
                  title={status}
                >
                  <IconeDia status={status} />
                </motion.span>
                <span className={cn("text-[10.5px]", hoje ? "font-bold text-ambar" : "text-texto-2")}>{hoje ? "Hoje" : nome}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="border-t border-borda p-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-texto-2">Progresso de hoje</span>
          <b className="text-tinta">
            {feitasHoje}/{totalHoje} missões diárias
          </b>
        </div>
        <ProgressBar valor={feitasHoje} max={totalHoje} rotulo="Missões diárias concluídas" />

        {s.quebrada ? (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-xl border border-red-100 bg-red-50/60 p-3">
            <p className="text-sm font-bold text-tinta">Sua sequência pode ser recuperada</p>
            <p className="mt-1 text-[12.5px] leading-snug text-texto-2">
              Você tem 48 horas para recuperar os {s.dias} dias por {CUSTO_RECUPERACAO} pontos.
            </p>
            <div className="mt-3 flex gap-2">
              <Button className="flex-1" disabled={usuario.pontos < CUSTO_RECUPERACAO} onClick={recuperarSequencia}>
                Recuperar · {CUSTO_RECUPERACAO} pontos
              </Button>
              <Button variante="secundario" onClick={recomecarSequencia}>
                Começar de novo
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="mt-4 grid gap-2">
            <Button className="whitespace-nowrap" disabled={s.estudouHoje} onClick={registrarEstudo}>
              {s.estudouHoje ? (
                <>
                  <Check /> Estudo de hoje registrado
                </>
              ) : (
                <>
                  <Flame /> Registrar estudo de hoje
                </>
              )}
            </Button>
            <Button variante="secundario" className="whitespace-nowrap" onClick={simularAusencia}>
              Simular ausência
            </Button>
          </div>
        )}
        <p className="mt-3 text-[11.5px] leading-snug text-texto-2">
          A partir do dia 8, cada dia vale +50 pontos. Sequência não dá XP: presença não significa domínio.
        </p>
      </div>
    </Card>
  );
}
