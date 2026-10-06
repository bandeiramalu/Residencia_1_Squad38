"use client";

import { AnimatePresence, m as motion } from "motion/react";
import { Avatar } from "@/components/ui/Avatar";
import { LinkPessoa } from "@/components/ui/LinkPessoa";
import { cn } from "@/lib/cn";
import { primeiroNome } from "@/lib/format";
import { useSeletor } from "@/store/store";
import type { SalaEstudo, TimerAtivo } from "@/store/types";
import { statusMembro, useFaseDaSala, type StatusMembro } from "./comum";

/** Quantos avatares cabem antes do "+N" (a grade não cresce sem fim em salas cheias). */
const MAX_VISIVEIS = 17;

const ENTRADA = { duration: 0.18, ease: [0.2, 0, 0, 1] } as const;
const MOLA = { type: "spring", stiffness: 520, damping: 44 } as const;

type Status = StatusMembro | "pausado";

const ROTULO: Record<Status, string> = { foco: "focando", pausa: "na pausa", pausado: "pausado" };

function statusDoTimer(timer: TimerAtivo | null, salaId: string): Status {
  if (!timer || timer.salaId !== salaId) return "pausado";
  if (timer.pausado) return "pausado";
  return timer.fase;
}

/** Ponto de status no canto do avatar (verde = focando, âmbar = pausa, cinza = pausado). */
function Ponto({ status, fundo = "superficie" }: { status: Status; fundo?: "superficie" | "ativo" }) {
  return (
    <span
      className={cn(
        "absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2",
        fundo === "ativo" ? "ring-verde-mclaro" : "ring-superficie",
        status === "foco" ? "bg-verde" : status === "pausa" ? "bg-ambar" : "bg-texto-2/50",
      )}
      aria-hidden
    />
  );
}

/**
 * Grade de presença: quem está na sala e se está focando ou na pausa.
 * O status é derivado da fase da sala (determinístico), então só muda quando a fase vira.
 */
export function PresencaSala({ sala, professor, dentro }: { sala: SalaEstudo; professor: boolean; dentro: boolean }) {
  const { aberta, fase, ciclo } = useFaseDaSala(sala);
  const pessoas = useSeletor((e) => e.pessoas);
  const usuario = useSeletor((e) => e.usuario);
  const timer = useSeletor((e) => e.estudos.timer);
  // No modo monitoramento a aluna da demo aparece na grade como qualquer membro (o estado é compartilhado).
  const alunaNaSala = professor && dentro;
  const meuStatus = statusDoTimer(timer, sala.id);

  const membros = sala.membros.map((id) => ({ id, status: statusMembro(id, fase, ciclo) as Status, destaque: false }));
  if (alunaNaSala) membros.unshift({ id: usuario.id, status: meuStatus, destaque: true });
  const visiveis = membros.slice(0, MAX_VISIVEIS);
  const resto = membros.length - visiveis.length;
  const euNaGrade = !professor && dentro;
  const focando = membros.filter((m) => m.status === "foco").length + (euNaGrade && meuStatus === "foco" ? 1 : 0);
  const naPausa = membros.length + (euNaGrade ? 1 : 0) - focando;
  const total = membros.length + (euNaGrade ? 1 : 0);

  return (
    <section aria-labelledby="presenca-titulo" className="rounded-2xl border border-borda bg-superficie p-4 sm:p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 id="presenca-titulo" className="text-[15px] font-semibold text-tinta">
          Na sala agora {total > 0 && <span className="font-normal tabular-nums text-texto-2">· {total}</span>}
        </h2>
        {aberta && total > 0 && (
          <p className="flex shrink-0 items-center gap-3 text-[12px] tabular-nums text-texto-2">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-verde" aria-hidden />
              {focando} focando
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-ambar" aria-hidden />
              {naPausa} na pausa
            </span>
          </p>
        )}
      </div>

      <AnimatePresence initial={false}>
        {euNaGrade && (
          <motion.div key="voce" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={ENTRADA} className="overflow-hidden">
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-verde-claro bg-verde-mclaro px-3 py-2.5">
              <span className="relative">
                <LinkPessoa id={usuario.id} rotulo="Meu perfil" className="flex rounded-full">
                  <Avatar nome={usuario.nome} tamanho="sm" equipados={usuario.equipados} />
                </LinkPessoa>
                <Ponto status={meuStatus} fundo="ativo" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-medium text-tinta">Você</span>
                <span className="block truncate text-[12px] text-texto-2">
                  {!timer || timer.salaId !== sala.id
                    ? "Na sala, sem foco ativo"
                    : timer.pausado
                      ? "Pausou o próprio timer"
                      : timer.fase === "foco"
                        ? `Focando em ${timer.disciplina}`
                        : "Na pausa com a sala"}
                </span>
              </span>
              <span className="shrink-0 text-[12px] tabular-nums text-texto-2">
                {timer?.salaId === sala.id ? `${timer.ciclos} ${timer.ciclos === 1 ? "ciclo" : "ciclos"}` : ""}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {membros.length === 0 ? (
        <p className="rounded-xl bg-superficie-2 px-4 py-6 text-center text-[13px] text-texto-2">
          {!aberta
            ? "A presença aparece quando a sala abrir."
            : professor
              ? "Nenhum aluno entrou ainda."
              : dentro
                ? "Por enquanto é só você por aqui."
                : "Ninguém por aqui ainda."}
        </p>
      ) : (
        <ul className="relative grid grid-cols-4 gap-x-2 gap-y-4 min-[400px]:grid-cols-5 sm:grid-cols-6">
          {/* Na abertura da tela os avatares entram em cascata curta; depois, só quem chega ou sai anima. */}
          <AnimatePresence mode="popLayout">
            {visiveis.map((m, i) => {
              const p = pessoas[m.id];
              const nome = p?.nome ?? (m.id === usuario.id ? usuario.nome : "Colega");
              return (
                <motion.li
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  transition={{ ...ENTRADA, delay: Math.min(i, 12) * 0.015, layout: MOLA }}
                  className="flex min-w-0 flex-col items-center gap-1.5"
                  title={`${nome} · ${ROTULO[m.status]}`}
                >
                  <span className="relative">
                    <LinkPessoa id={m.id} rotulo={`Perfil de ${nome}`} className="flex rounded-full">
                      <Avatar nome={nome} iniciais={p?.iniciais} tamanho="md" ativo={m.destaque} equipados={m.destaque ? usuario.equipados : undefined} />
                    </LinkPessoa>
                    <Ponto status={m.status} />
                  </span>
                  <LinkPessoa id={m.id} className={cn("w-full truncate text-center text-[12px] hover:underline", m.destaque ? "font-medium text-acento" : "text-texto-2")}>
                    {primeiroNome(nome)}
                  </LinkPessoa>
                  <span className="sr-only">{ROTULO[m.status]}</span>
                </motion.li>
              );
            })}
            {resto > 0 && (
              <motion.li key="resto" layout transition={{ layout: MOLA }} className="flex flex-col items-center gap-1.5">
                <span className="grid size-10 place-items-center rounded-full bg-superficie-2 text-[12px] font-medium tabular-nums text-texto-2 ring-1 ring-inset ring-borda">+{resto}</span>
                <span className="text-[12px] text-texto-2">outros</span>
              </motion.li>
            )}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}
