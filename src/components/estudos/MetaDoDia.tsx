"use client";

import { Check, Flame } from "lucide-react";
import { m as motion } from "motion/react";
import { useState } from "react";
import { Anel } from "@/components/ui/Anel";
import { TituloSecao } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RodapeSheet } from "@/components/ui/RodapeSheet";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";
import { formatarMinutos, type ResumoEstudos } from "@/lib/estudos";
import { plural } from "@/lib/format";
import { definirMetaDiaria } from "@/store/actions";

const PRESETS = [
  { min: 30, rotulo: "Para começar" },
  { min: 60, rotulo: "Constante" },
  { min: 90, rotulo: "Recomendada" },
  { min: 120, rotulo: "Puxada" },
  { min: 180, rotulo: "Reta final" },
];

/** Anel da meta diária + sequência de dias com estudo; a meta é editável num Sheet. */
export function MetaDoDia({ resumo, meta, className }: { resumo: ResumoEstudos; meta: number; className?: string }) {
  const [editando, setEditando] = useState(false);
  const pct = Math.round(resumo.metaPct * 100);
  const batida = resumo.hojeMin >= meta;
  const falta = Math.max(0, meta - resumo.hojeMin);
  const pomodoros = Math.ceil(falta / 25);
  const { diasSeguidos } = resumo;

  return (
    <Card semPadding className={cn("p-5", className)}>
      <TituloSecao
        extra={
          <button type="button" onClick={() => setEditando(true)} className="alvo-toque rounded font-medium text-acento hover:underline">
            Editar
          </button>
        }
      >
        Meta do dia
      </TituloSecao>

      <div className="flex items-center gap-4">
        <Anel progresso={resumo.metaPct} tamanho={88} espessura={6} rotulo={`${pct}% da meta diária`}>
          <span className="block text-[17px] font-semibold leading-none text-tinta tabular-nums">{pct}%</span>
        </Anel>
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-semibold leading-tight tracking-tight text-tinta tabular-nums">
            {formatarMinutos(resumo.hojeMin)}
            <span className="ml-1.5 text-[13px] font-normal tracking-normal text-texto-2">de {formatarMinutos(meta)}</span>
          </p>
          <p className={cn("mt-1 flex items-center gap-1 text-[13px]", batida ? "font-medium text-acento" : "text-texto-2")}>
            {batida ? (
              <>
                <Check className="size-3.5" aria-hidden /> Meta concluída
              </>
            ) : (
              `Faltam ${formatarMinutos(falta)} · ${plural(pomodoros, "Pomodoro", "Pomodoros")}`
            )}
          </p>
        </div>
      </div>

      <p className="mt-4 flex items-center gap-2 border-t border-borda pt-3 text-[13px] text-texto-2">
        <Flame className={cn("size-4 shrink-0", diasSeguidos ? "text-ambar" : "text-texto-2")} aria-hidden />
        {diasSeguidos ? (
          <span>
            <b className="font-medium text-tinta">{plural(diasSeguidos, "dia seguido", "dias seguidos")}</b> com estudo
            {resumo.hojeMin === 0 && <> · estude hoje para chegar a {diasSeguidos + 1}</>}
          </span>
        ) : (
          <span>Nenhuma sequência ativa</span>
        )}
      </p>

      <Sheet aberto={editando} onFechar={() => setEditando(false)} titulo="Meta diária de estudo" subtitulo="Quanto tempo você quer estudar por dia.">
        <FormMeta atual={meta} onFechar={() => setEditando(false)} />
      </Sheet>
    </Card>
  );
}

/** Montado só com o Sheet aberto: a escolha recomeça da meta atual a cada abertura. */
function FormMeta({ atual, onFechar }: { atual: number; onFechar: () => void }) {
  const [escolha, setEscolha] = useState(atual);

  const salvar = () => {
    if (escolha !== atual) definirMetaDiaria(escolha);
    onFechar();
  };

  return (
    <>
      <div role="radiogroup" aria-label="Minutos por dia" className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {PRESETS.map((p) => {
          const ativo = p.min === escolha;
          return (
            <button
              key={p.min}
              type="button"
              role="radio"
              aria-checked={ativo}
              onClick={() => setEscolha(p.min)}
              className={cn(
                "relative rounded-xl border px-3 py-3 text-left transition-colors duration-150 sm:text-center",
                ativo ? "border-verde" : "border-borda bg-superficie hover:bg-superficie-2",
              )}
            >
              {ativo && <motion.span layoutId="meta-escolhida" className="absolute inset-0 rounded-[11px] bg-verde-mclaro" transition={{ type: "spring", stiffness: 600, damping: 45 }} />}
              <span className="relative block text-lg font-semibold leading-none text-tinta tabular-nums">{formatarMinutos(p.min)}</span>
              <span className="relative mt-1 block text-[12px] text-texto-2">{p.rotulo}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-[13px] text-texto-2">
        Com <b className="font-medium text-tinta">{formatarMinutos(escolha)}</b> por dia você fecha <b className="font-medium text-tinta">{formatarMinutos(escolha * 7)}</b> por semana.
        {!PRESETS.some((p) => p.min === atual) && <> Sua meta atual é {formatarMinutos(atual)}.</>}
      </p>

      <RodapeSheet>
        <Button variante="secundario" className="flex-1" onClick={onFechar}>
          Cancelar
        </Button>
        <Button className="flex-[2]" onClick={salvar}>
          Salvar meta
        </Button>
      </RodapeSheet>
    </>
  );
}
