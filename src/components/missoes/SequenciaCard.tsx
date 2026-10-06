"use client";

import { Check, Flame, Snowflake } from "lucide-react";
import { m as motion } from "motion/react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Button } from "@/components/ui/Button";
import { useModoApresentacao } from "@/lib/apresentacao";
import { cn } from "@/lib/cn";
import { NOMES_DIAS } from "@/lib/tempo";
import { CUSTO_RECUPERACAO, recomecarSequencia, recuperarSequencia, registrarEstudo, simularAusencia } from "@/store/actions";
import { useSeletor } from "@/store/store";
import type { StatusDia } from "@/store/types";

const ESTILO_DIA: Record<StatusDia, string> = {
  estudou: "bg-ambar",
  congelado: "bg-sky-600",
  perdido: "bg-alerta",
  pendente: "ring-[1.5px] ring-inset ring-ambar",
  futuro: "bg-borda",
};

const ROTULO_DIA: Record<StatusDia, string> = {
  estudou: "estudou",
  congelado: "congelador usado",
  perdido: "perdido",
  pendente: "pendente",
  futuro: "ainda não chegou",
};

/** Sequência (streak): dias seguidos, semana em 7 bolinhas e congeladores. */
export function SequenciaCard() {
  const apresentacao = useModoApresentacao();
  const s = useSeletor((e) => e.sequencia);
  const pontos = useSeletor((e) => e.usuario.pontos);

  return (
    <div className="rounded-2xl border border-borda bg-superficie p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2">
            <Flame className={cn("size-5 shrink-0", s.quebrada ? "text-texto-2" : "text-ambar")} aria-hidden />
            <AnimatedNumber valor={s.dias} className="text-2xl font-semibold tabular-nums text-tinta" />
            <span className="text-[13px] text-texto-2">{s.dias === 1 ? "dia seguido" : "dias seguidos"}</span>
          </p>
        </div>
        <div className="shrink-0 text-right" title="Um congelador protege a sequência num dia sem estudo. Sequência não dá XP: presença não significa domínio.">
          <div className="flex justify-end gap-1" aria-label={`${s.congeladores} de ${s.congeladoresMax} congeladores disponíveis`}>
            {Array.from({ length: s.congeladoresMax }, (_, i) => (
              <Snowflake key={i} className={cn("size-4 transition-colors", i < s.congeladores ? "text-sky-600" : "text-borda")} aria-hidden />
            ))}
          </div>
          <p className="mt-1 text-[12px] text-texto-2">
            {s.congeladores}/{s.congeladoresMax} congeladores
          </p>
        </div>
      </div>

      <ol className="mt-4 grid grid-cols-7 gap-1" aria-label="Sequência desta semana">
        {NOMES_DIAS.map((nome, i) => {
          const status = s.semana[i];
          const hoje = i === s.hoje;
          return (
            <li key={nome} className="flex flex-col items-center gap-1.5" title={`${nome}: ${ROTULO_DIA[status]}`}>
              <motion.span
                key={status}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className={cn("size-2.5 rounded-full", ESTILO_DIA[status])}
              />
              <span className={cn("text-[11px]", hoje ? "font-medium text-tinta" : "text-texto-2")}>{hoje ? "Hoje" : nome}</span>
              <span className="sr-only">{ROTULO_DIA[status]}</span>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 border-t border-borda pt-4">
        {s.quebrada ? (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
            <p className="text-[14px] font-medium text-tinta">Sua sequência pode ser recuperada</p>
            <p className="mt-0.5 text-[13px] text-texto-2">
              Você tem 48 horas para recuperar os {s.dias} dias por {CUSTO_RECUPERACAO} pontos.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button tamanho="sm" disabled={pontos < CUSTO_RECUPERACAO} onClick={recuperarSequencia}>
                Recuperar · {CUSTO_RECUPERACAO} pontos
              </Button>
              <Button variante="secundario" tamanho="sm" onClick={recomecarSequencia}>
                Começar de novo
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button tamanho="sm" disabled={s.estudouHoje} onClick={registrarEstudo}>
              {s.estudouHoje ? (
                <>
                  <Check /> Estudo de hoje registrado
                </>
              ) : (
                "Registrar estudo de hoje"
              )}
            </Button>
            {apresentacao && (
              <Button variante="secundario" tamanho="sm" onClick={simularAusencia}>
                Simular ausência (demo)
              </Button>
            )}
          </div>
        )}
        <p className="mt-3 text-[12px] text-texto-2">
          Ciclos de foco também contam. A partir do dia 8, cada dia vale +50 pontos.
        </p>
      </div>
    </div>
  );
}
