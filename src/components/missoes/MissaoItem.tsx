"use client";

import { ArrowRight, Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DisciplinaIcon } from "@/components/ui/DisciplinaIcon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/cn";
import { avancarMissao, concluirMissao } from "@/store/actions";
import { useEstado } from "@/store/store";
import type { Missao } from "@/store/types";
import { focarPost } from "@/store/ui";

/** Item de missão (diária ou do professor) com recompensa, progresso e ações. */
export function MissaoItem({ missao: m }: { missao: Missao }) {
  const router = useRouter();
  const { pessoas } = useEstado();
  const multiplas = m.alvo > 1;
  const professor = m.professorId ? pessoas[m.professorId] : undefined;

  const abrirAtividade = () => {
    if (m.postId) focarPost(m.postId);
    router.push("/feed");
  };

  return (
    <motion.li
      layout
      className={cn(
        "flex gap-3 rounded-2xl border p-3.5 transition-colors duration-300",
        m.concluida ? "border-verde-claro bg-verde-mclaro" : "border-borda bg-white shadow-card",
      )}
    >
      <button
        type="button"
        onClick={() => (multiplas ? avancarMissao(m.id, 1) : concluirMissao(m.id))}
        disabled={m.concluida}
        aria-label={m.concluida ? "Missão concluída" : multiplas ? "Registrar +1 de progresso" : "Marcar como feita"}
        className={cn(
          "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border-2 transition-all duration-300",
          m.concluida ? "border-verde bg-verde text-white" : "border-verde-suave bg-white hover:border-verde-2 active:scale-90",
        )}
      >
        <AnimatePresence>
          {m.concluida && (
            <motion.span initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 600, damping: 15 }}>
              <Check className="size-4" strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn("text-[14px] font-semibold leading-snug", m.concluida ? "text-texto-2 line-through decoration-verde-suave" : "text-tinta")}>
          {m.titulo}
        </p>
        <p className="mt-0.5 text-[12px] leading-snug text-texto-2">{m.descricao}</p>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {m.disciplina && (
            <Badge tom="contorno">
              <DisciplinaIcon disciplina={m.disciplina} /> {m.disciplina}
            </Badge>
          )}
          <Badge tom="claro">+{m.pontos} Pontos</Badge>
          <Badge tom="claro">+{m.xp} XP</Badge>
          {professor && <span className="text-[11px] text-texto-2">{professor.nome}</span>}
          {m.concluida && (
            <Badge tom="verde" maiuscula>
              Concluído
            </Badge>
          )}
        </div>

        {multiplas && (
          <div className="mt-2.5 flex items-center gap-2">
            <ProgressBar valor={m.progresso} max={m.alvo} fina className="flex-1" rotulo={`Progresso de ${m.titulo}`} />
            <span className="text-[11.5px] font-bold tabular-nums text-tinta">
              {m.progresso}/{m.alvo}
            </span>
          </div>
        )}

        {!m.concluida && (
          <div className="mt-3 flex flex-wrap gap-2">
            {multiplas ? (
              <Button variante="rapido" tamanho="sm" onClick={() => avancarMissao(m.id, 1)}>
                +1 progresso
              </Button>
            ) : (
              <Button tamanho="sm" onClick={() => concluirMissao(m.id)}>
                <Check /> Marcar como feita
              </Button>
            )}
            {(m.postId || m.id === "d1") && (
              <Button variante="secundario" tamanho="sm" onClick={abrirAtividade}>
                {m.id === "d1" ? "Ver dúvidas no feed" : "Abrir atividade"} <ArrowRight />
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.li>
  );
}
