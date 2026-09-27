"use client";

import { Bot, Check, CircleCheck, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Nota } from "@/components/ui/Blocos";
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
    <Card>
      <p className="flex items-center gap-1.5 text-[12px] text-texto-2">
        <Bot className="size-4 text-verde-2" /> Escolhidos pelas suas dúvidas e pelo seu domínio em cada disciplina.
      </p>
      {recomendados.length === 0 ? (
        <p className="mt-3 rounded-xl bg-verde-mclaro p-3 text-sm text-texto-2">Você concluiu todos os desafios disponíveis. Novos desafios chegam amanhã!</p>
      ) : (
        <ul className="mt-3 space-y-2">
          <AnimatePresence initial={false}>
            {recomendados.map((d) => (
              <motion.li
                key={d}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="flex items-center gap-3 rounded-xl border border-borda p-3"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-verde-claro text-verde">
                  <DisciplinaIcon disciplina={d} className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-bold text-tinta">
                    {d} <span className="font-medium text-texto-2">· {DESAFIOS[d].tema}</span>
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <ProgressBar valor={usuario.dominio[d]} fina tom={usuario.dominio[d] < 50 ? "ambar" : "suave"} className="w-20" rotulo={`Domínio em ${d}`} />
                    <span className="text-[11px] text-texto-2">{usuario.dominio[d]}% · 3 questões · até +30 XP</span>
                  </div>
                </div>
                <Button tamanho="sm" onClick={() => setAtivo(d)}>
                  Começar
                </Button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <Sheet aberto={!!ativo} onFechar={() => setAtivo(null)} titulo={ativo ? `Desafio de ${ativo}` : "Desafio"} subtitulo={ativo ? DESAFIOS[ativo].tema : undefined}>
        {ativo && <Quiz disciplina={ativo} onFechar={() => setAtivo(null)} />}
      </Sheet>
    </Card>
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
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 400, damping: 16 }}>
          <CircleCheck className="mx-auto size-14 fill-verde-claro text-verde" />
        </motion.div>
        <p className="mt-3 text-lg font-extrabold text-tinta">
          {acertos}/{questoes.length} acertos
        </p>
        <p className="mt-1 text-sm text-texto-2">
          {acertos === questoes.length ? "Mandou muito bem!" : acertos > 0 ? "Bom avanço — revise as explicações." : "Vale revisar o conteúdo com calma."}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Badge tom="claro">+{acertos * 5} pontos</Badge>
          <Badge tom="claro">+{acertos * 10} XP</Badge>
          <Badge tom="verde">domínio +{acertos * 4}%</Badge>
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
      <div className="flex items-center justify-between text-xs text-texto-2">
        <span className="font-semibold text-tinta">
          Questão {indice + 1} de {questoes.length}
        </span>
        <span>{acertos} acertos</span>
      </div>
      <ProgressBar valor={indice} max={questoes.length} fina className="mt-2" rotulo="Progresso do desafio" />

      <AnimatePresence mode="wait">
        <motion.div key={indice} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
          <p className="mt-4 text-[16px] font-bold leading-snug text-tinta">{q.enunciado}</p>
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
                  animate={errada ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                  transition={{ duration: 0.35 }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm font-medium transition-colors",
                    certa ? "border-verde bg-verde-claro text-verde" : errada ? "border-red-200 bg-red-50 text-alerta" : "border-borda bg-white text-texto",
                    escolha === null && "hover:border-verde-suave hover:bg-verde-mclaro",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-bold",
                      certa ? "border-verde bg-verde text-white" : errada ? "border-alerta bg-alerta text-white" : "border-verde-suave text-texto-2",
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
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
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
