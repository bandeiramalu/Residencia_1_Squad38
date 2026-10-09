"use client";

import { ArrowRight } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import Link from "next/link";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Badge } from "@/components/ui/Badge";
import { TituloSecao } from "@/components/ui/Blocos";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { useDesempate } from "@/components/campeonatos/comum";
import { classificacao } from "@/lib/campeonatos";
import { formatarMinutos } from "@/lib/estudos";
import { contagemRegressiva } from "@/lib/tempo";
import { useSeletor } from "@/store/store";
import { turmaCurta } from "./formato";

const ID = "interclasses-foco";
const MOLA = { type: "spring", stiffness: 500, damping: 45 } as const;

/**
 * A disputa do Interclasses do Foco ao vivo. Cada ciclo concluído soma na turma
 * (no reducer); aqui a tabela se reordena quando o 9º A vira o jogo.
 */
export function InterclassesFoco({ agora, className }: { agora: number; className?: string }) {
  const camp = useSeletor((e) => e.campeonatos.find((c) => c.id === ID));
  const turma = useSeletor((e) => e.usuario.turma);
  const nivelDe = useDesempate(camp?.disciplina);
  if (!camp || !camp.participantes.includes(turma)) return null;

  const tabela = classificacao(camp, nivelDe);
  const indice = tabela.findIndex((l) => l.id === turma);
  const minha = tabela[indice];
  const acima = indice > 0 ? tabela[indice - 1] : undefined;
  const segundo = indice === 0 ? tabela[1] : undefined;
  const maior = Math.max(1, tabela[0]?.pontos ?? 0);
  const tc = turmaCurta(turma);
  const encerrado = camp.status === "encerrado";
  const falta = acima ? acima.pontos - minha.pontos + 1 : 0;

  const frase = encerrado
    ? camp.campeao
      ? `${turmaCurta(camp.campeao)} é a turma campeã`
      : "Campeonato encerrado"
    : acima
      ? `Faltam ${formatarMinutos(falta)} para o ${tc} passar o ${turmaCurta(acima.id)}`
      : segundo && segundo.pontos === minha.pontos
        ? `Empate na liderança com o ${turmaCurta(segundo.id)}`
        : segundo
          ? `O ${tc} lidera por ${formatarMinutos(minha.pontos - segundo.pontos)}`
          : `O ${tc} lidera`;

  const { dias, horas } = contagemRegressiva(camp.fim - agora);
  const prazo = encerrado ? "Encerrado" : camp.status === "inscricoes" ? "Começa em breve" : dias ? `Termina em ${dias}d ${horas}h` : `Termina em ${horas}h`;

  return (
    <Card semPadding className={cn("p-5", className)}>
      <TituloSecao
        className="mb-1"
        extra={
          camp.status === "andamento" ? (
            <Badge tom="neutro">
              <span className="size-1.5 animate-pulso rounded-full bg-verde" aria-hidden />
              Ao vivo
            </Badge>
          ) : undefined
        }
      >
        Interclasses do Foco
      </TituloSecao>

      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={frase}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="text-[14px] font-medium leading-snug text-tinta"
          aria-live="polite"
        >
          {frase}
        </motion.p>
      </AnimatePresence>

      <ol className="mt-4 space-y-3" aria-label="Classificação por minutos de foco">
        {tabela.map((l) => {
          const minhaTurma = l.id === turma;
          return (
            <motion.li key={l.id} layout="position" transition={MOLA} className="grid grid-cols-[1rem_3.5rem_minmax(0,1fr)_auto] items-center gap-2.5 text-[13px]">
              <span className="text-center text-texto-2 tabular-nums">{l.posicao}</span>
              <span className={cn("truncate", minhaTurma ? "font-medium text-tinta" : "text-texto")}>{turmaCurta(l.id)}</span>
              <span className="h-1.5 overflow-hidden rounded-full bg-superficie-2 ring-1 ring-inset ring-borda">
                <motion.span
                  className={cn("block h-full rounded-full", minhaTurma ? "bg-verde" : "bg-texto-2/45")}
                  initial={false}
                  animate={{ width: `${(l.pontos / maior) * 100}%` }}
                  transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
                />
              </span>
              <span className={cn("min-w-14 text-right tabular-nums", minhaTurma ? "font-medium text-tinta" : "text-texto-2")}>
                <AnimatedNumber valor={l.pontos} /> min
              </span>
            </motion.li>
          );
        })}
      </ol>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-borda pt-3 text-[12px] text-texto-2">
        <span className="min-w-0 leading-snug">
          {prazo}
          {camp.premio.pontos > 0 && ` · ${camp.premio.pontos} pts por aluno`}
        </span>
        <Link href={`/campeonatos/${ID}`} className="group alvo-toque inline-flex shrink-0 items-center gap-1 rounded text-[13px] font-medium text-acento hover:underline">
          Ver campeonato
          <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>
    </Card>
  );
}
