"use client";

import { ArrowRight, Check, Hourglass, Layers, MessageCircleQuestion, NotebookText } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { DisciplinaIcon } from "@/components/ui/DisciplinaIcon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useModoApresentacao } from "@/lib/apresentacao";
import { cn } from "@/lib/cn";
import { avancarMissao, concluirMissao } from "@/store/actions";
import { useSeletor } from "@/store/store";
import type { Missao } from "@/store/types";
import { focarPost } from "@/store/ui";
import { irParaFlashcards } from "./irParaFlashcards";
import { ProgressoNaoSalvo } from "./ProgressoNaoSalvo";

/** Missão que só se conclui sozinha, ao fechar um ciclo de foco na Sala de Estudos. */
const MISSAO_FOCO = "d4";
/** Missão cumprida acertando flashcards de cartas vencidas na prática desta tela. */
const MISSAO_FLASHCARDS = "d2";

interface Tarefa {
  rotulo: string;
  icone: ReactNode;
  ir: () => void;
}

/**
 * Linha do checklist de missões diárias. O círculo é só um indicador: a missão avança fazendo a tarefa
 * (responder no feed, abrir o material, acertar flashcards, fechar um ciclo de foco). Com o modo
 * apresentação ligado, atalhos rotulados "(demonstração)" marcam o progresso sem a tarefa.
 */
export function MissaoItem({ missao: m }: { missao: Missao }) {
  const router = useRouter();
  const demo = useModoApresentacao();
  const pessoas = useSeletor((e) => e.pessoas);
  const multiplas = m.alvo > 1;
  const foco = m.id === MISSAO_FOCO;
  const professor = m.professorId ? pessoas[m.professorId] : undefined;

  const irParaFeed = (postId?: string) => {
    if (postId) focarPost(postId);
    router.push("/feed");
  };
  const tarefa: Tarefa | null = foco
    ? { rotulo: "Ir para a Sala de Estudos", icone: <Hourglass />, ir: () => router.push("/estudos") }
    : m.id === MISSAO_FLASHCARDS
      ? { rotulo: "Praticar flashcards", icone: <Layers />, ir: () => irParaFlashcards() }
      : m.postId
        ? { rotulo: "Abrir material", icone: <NotebookText />, ir: () => irParaFeed(m.postId) }
        : m.id === "d1"
          ? { rotulo: "Ver dúvidas no feed", icone: <MessageCircleQuestion />, ir: () => irParaFeed() }
          : null;

  const marcar = () => (multiplas ? avancarMissao(m.id, 1) : concluirMissao(m.id));
  const atalhoDemo = demo && !m.concluida && !foco;

  return (
    <motion.li layout="position" transition={{ type: "spring", stiffness: 600, damping: 50 }} className="flex gap-3 px-4 py-3.5">
      {foco && !m.concluida ? (
        <span
          className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-dashed border-texto-2/50 text-texto-2"
          title="Conclui sozinha quando um ciclo de foco termina"
          aria-hidden
        >
          <Hourglass className="size-3" />
        </span>
      ) : atalhoDemo ? (
        <button
          type="button"
          onClick={marcar}
          aria-label={multiplas ? "Registrar +1 de progresso (demonstração)" : "Marcar como feita (demonstração)"}
          title="Demonstração: marca o progresso sem fazer a tarefa"
          className="relative mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-texto-2/50 bg-superficie transition-colors duration-150 after:absolute after:-inset-3 after:content-[''] hover:border-verde hover:bg-verde-mclaro"
        />
      ) : (
        <span
          role="img"
          aria-label={m.concluida ? "Missão concluída" : "Missão pendente"}
          className={cn(
            "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-colors duration-150",
            m.concluida ? "border-acao bg-acao text-white" : "border-texto-2/50 bg-superficie",
          )}
        >
          <AnimatePresence>
            {m.concluida && (
              <motion.span initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 600, damping: 40 }}>
                <Check className="size-3" strokeWidth={3} aria-hidden />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className={cn("text-[14px] font-medium leading-snug transition-colors", m.concluida ? "text-texto-2 line-through decoration-texto-2/40" : "text-tinta")}>{m.titulo}</p>
        {!m.concluida && <p className="mt-0.5 text-[13px] leading-snug text-texto-2">{m.descricao}</p>}

        <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[12px] text-texto-2">
          <span className="tabular-nums">+{m.pontos} pontos</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">+{m.xp} XP</span>
          {m.disciplina && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <DisciplinaIcon disciplina={m.disciplina} className="size-3" /> {m.disciplina}
              </span>
            </>
          )}
          {professor && (
            <>
              <span aria-hidden>·</span>
              <span>{professor.nome}</span>
            </>
          )}
        </p>

        {multiplas && !m.concluida && (
          <div className="mt-2 flex items-center gap-2">
            <ProgressBar valor={m.progresso} max={m.alvo} fina className="max-w-48 flex-1" rotulo={`Progresso de ${m.titulo}`} />
            <span className="text-[12px] tabular-nums text-texto-2">
              {m.progresso}/{m.alvo}
            </span>
          </div>
        )}

        {!m.concluida && (tarefa || atalhoDemo) && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {tarefa && (
              <Button variante="secundario" tamanho="sm" onClick={tarefa.ir}>
                {tarefa.icone} {tarefa.rotulo} <ArrowRight />
              </Button>
            )}
            {atalhoDemo && (
              <Button variante="fantasma" tamanho="sm" onClick={marcar} title="Demonstração: marca o progresso sem fazer a tarefa">
                {multiplas ? "+1 progresso (demonstração)" : "Marcar como feita (demonstração)"}
              </Button>
            )}
          </div>
        )}

        <ProgressoNaoSalvo chaves={[m.id]} className="mt-2.5" />
      </div>
    </motion.li>
  );
}
