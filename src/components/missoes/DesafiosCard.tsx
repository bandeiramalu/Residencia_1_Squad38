"use client";

import { Check, CircleCheck, X } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Nota, Vazio } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DisciplinaIcon } from "@/components/ui/DisciplinaIcon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { RodapeSheet } from "@/components/ui/RodapeSheet";
import { Sheet } from "@/components/ui/Sheet";
import { DESAFIOS } from "@/data/desafios";
import { DISCIPLINAS, type Disciplina } from "@/data/escola";
import { cn } from "@/lib/cn";
import { concluirDesafio } from "@/store/actions";
import { useEstado } from "@/store/store";

/**
 * Desafios personalizados (US09B): o sistema escolhe as disciplinas com menor
 * domínio no histórico da aluna e monta um desafio curto para cada uma.
 */
export function DesafiosCard() {
  const { usuario, desafiosConcluidos } = useEstado();
  const [ativo, setAtivo] = useState<Disciplina | null>(null);

  const recomendados = [...DISCIPLINAS]
    .filter((d) => !desafiosConcluidos.includes(d))
    .sort((a, b) => usuario.dominio[a] - usuario.dominio[b])
    .slice(0, 3);

  return (
    <>
      {recomendados.length === 0 ? (
        <Vazio icone={<CircleCheck />} titulo="Todos os desafios concluídos" descricao="Novos desafios chegam amanhã." />
      ) : (
        <Card semPadding>
          <ul className="divide-y divide-borda">
            <AnimatePresence initial={false}>
              {recomendados.map((d) => (
                <motion.li
                  key={d}
                  layout="position"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  transition={{ type: "spring", stiffness: 600, damping: 50 }}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-superficie-2 text-texto-2">
                    <DisciplinaIcon disciplina={d} className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-tinta">{d}</p>
                    <p className="truncate text-[12px] text-texto-2">{DESAFIOS[d].tema}</p>
                    <p className="text-[12px] text-texto-2">
                      Domínio <span className={cn("tabular-nums", usuario.dominio[d] < 50 && "font-medium text-ambar")}>{usuario.dominio[d]}%</span> · até +30 XP
                    </p>
                  </div>
                  <Button variante="secundario" tamanho="sm" onClick={() => setAtivo(d)}>
                    Começar
                  </Button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </Card>
      )}

      <Sheet aberto={!!ativo} onFechar={() => setAtivo(null)} titulo={ativo ? `Desafio de ${ativo}` : "Desafio"} subtitulo={ativo ? DESAFIOS[ativo].tema : undefined}>
        {ativo && <Quiz disciplina={ativo} onFechar={() => setAtivo(null)} />}
      </Sheet>
    </>
  );
}

function Quiz({ disciplina, onFechar }: { disciplina: Disciplina; onFechar: () => void }) {
  const { questoes } = DESAFIOS[disciplina];
  const [indice, setIndice] = useState(0);
  const [escolha, setEscolha] = useState<number | null>(null);
  const [acertos, setAcertos] = useState(0);
  const terminou = indice >= questoes.length;
  const q = questoes[Math.min(indice, questoes.length - 1)];

  const responder = (i: number) => {
    if (escolha !== null) return;
    setEscolha(i);
    if (i === q.correta) setAcertos((a) => a + 1);
  };

  if (terminou) {
    return (
      <div className="py-2 text-center">
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <CircleCheck className="mx-auto size-10 text-acento" aria-hidden />
        </motion.div>
        <p className="mt-3 text-xl font-semibold tabular-nums text-tinta">
          {acertos}/{questoes.length} acertos
        </p>
        <p className="mt-1 text-sm text-texto-2">
          {acertos === questoes.length ? "Mandou muito bem!" : acertos > 0 ? "Bom avanço — revise as explicações." : "Vale revisar o conteúdo com calma."}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Badge tom="neutro">+{acertos * 5} pontos</Badge>
          <Badge tom="neutro">+{acertos * 10} XP</Badge>
          <Badge tom="claro">domínio +{acertos * 4}%</Badge>
        </div>
        <RodapeSheet>
          <Button
            tamanho="lg"
            bloco
            onClick={() => {
              concluirDesafio(disciplina, acertos);
              onFechar();
            }}
          >
            Concluir desafio
          </Button>
        </RodapeSheet>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between text-[13px] text-texto-2">
        <span className="font-medium text-tinta">
          Questão {indice + 1} de {questoes.length}
        </span>
        <span>{acertos} acertos</span>
      </div>
      <ProgressBar valor={indice} max={questoes.length} fina className="mt-2" rotulo="Progresso do desafio" />

      <AnimatePresence mode="wait">
        <motion.div key={indice} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }}>
          <p className="mt-4 text-[16px] font-medium leading-snug text-tinta">{q.enunciado}</p>
          <div className="mt-4 space-y-2">
            {q.opcoes.map((op, i) => {
              const certa = escolha !== null && i === q.correta;
              const errada = escolha === i && i !== q.correta;
              return (
                <motion.button
                  key={op}
                  type="button"
                  onClick={() => responder(i)}
                  disabled={escolha !== null}
                  animate={errada ? { x: [0, -4, 4, -2, 2, 0] } : {}}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition-colors",
                    certa ? "border-verde bg-verde-mclaro text-tinta" : errada ? "border-red-200 bg-red-50 text-alerta" : "border-borda bg-superficie text-texto",
                    escolha === null && "hover:bg-superficie-2",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-medium",
                      certa ? "border-verde bg-verde text-white" : errada ? "border-alerta bg-alerta text-white" : "border-borda text-texto-2",
                    )}
                  >
                    {certa ? <Check className="size-3.5" /> : errada ? <X className="size-3.5" /> : String.fromCharCode(65 + i)}
                  </span>
                  {op}
                </motion.button>
              );
            })}
          </div>
          {escolha !== null && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
              <Nota className="mt-3">{q.explicacao}</Nota>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      <RodapeSheet>
        <Button
          tamanho="lg"
          bloco
          disabled={escolha === null}
          onClick={() => {
            setIndice((i) => i + 1);
            setEscolha(null);
          }}
        >
          {indice + 1 === questoes.length ? "Ver resultado" : "Próxima questão"}
        </Button>
      </RodapeSheet>
    </>
  );
}
