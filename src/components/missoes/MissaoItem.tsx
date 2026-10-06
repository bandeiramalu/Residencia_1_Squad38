"use client";

import { ArrowRight, Check, Hourglass } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { DisciplinaIcon } from "@/components/ui/DisciplinaIcon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/cn";
import { avancarMissao, concluirMissao } from "@/store/actions";
import { useSeletor } from "@/store/store";
import type { Missao } from "@/store/types";
import { focarPost } from "@/store/ui";

/** Missão que só se conclui sozinha, ao fechar um ciclo de foco na Sala de Estudos. */
const MISSAO_FOCO = "d4";

/** Linha do checklist de missões diárias: caixa de seleção, título, recompensa e ações. */
export function MissaoItem({ missao: m }: { missao: Missao }) {
  const router = useRouter();
  const pessoas = useSeletor((e) => e.pessoas);
  const multiplas = m.alvo > 1;
  const foco = m.id === MISSAO_FOCO;
  const professor = m.professorId ? pessoas[m.professorId] : undefined;
  const irParaFeed = !!m.postId || m.id === "d1";

  const marcar = () => (multiplas ? avancarMissao(m.id, 1) : concluirMissao(m.id));
  const abrirNoFeed = () => {
    if (m.postId) focarPost(m.postId);
    router.push("/feed");
  };

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
      ) : (
        <button
          type="button"
          onClick={marcar}
          disabled={m.concluida}
          aria-label={m.concluida ? "Missão concluída" : multiplas ? "Registrar +1 de progresso" : "Marcar como feita"}
          className={cn(
            "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-colors duration-150",
            m.concluida ? "border-verde bg-verde text-white" : "border-texto-2/50 bg-superficie hover:border-verde hover:bg-verde-mclaro",
          )}
        >
          <AnimatePresence>
            {m.concluida && (
              <motion.span initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 600, damping: 40 }}>
                <Check className="size-3" strokeWidth={3} />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
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

        {!m.concluida && (foco || multiplas || irParaFeed) && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {foco && (
              <Button variante="secundario" tamanho="sm" onClick={() => router.push("/estudos")}>
                <Hourglass /> Ir para a Sala de Estudos
              </Button>
            )}
            {multiplas && (
              <Button variante="secundario" tamanho="sm" onClick={marcar}>
                +1 progresso
              </Button>
            )}
            {irParaFeed && (
              <Button variante="fantasma" tamanho="sm" onClick={abrirNoFeed}>
                {m.id === "d1" ? "Ver dúvidas no feed" : "Abrir material"} <ArrowRight />
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.li>
  );
}
