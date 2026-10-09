"use client";

import { ArrowUpRight, CalendarClock, CheckCircle2, FileText, Paperclip, Send } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { TituloSecao, Vazio } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { ROTULO_ATIVIDADE } from "@/data/atividades";
import { useAgora } from "@/hooks/useAgora";
import { cn } from "@/lib/cn";
import { abrirAnexo, abrirAnexoDe, baixarAnexoDe } from "@/lib/materiais";
import { dataCurta, tempoRelativo } from "@/lib/tempo";
import { useSeletor } from "@/store/store";
import type { Atividade, Entrega, Pessoa } from "@/store/types";
import { focarPost } from "@/store/ui";
import { EntregaSheet } from "./EntregaSheet";
import { ICONE_ATIVIDADE, fmtNota, lerResposta, prazoUrgente, textoPrazo } from "./comum";
import { abrirCorrecao } from "./pdfs";

function contextoDe(a: Atividade, professor?: Pessoa) {
  return { titulo: a.titulo, disciplina: a.disciplina, autor: professor?.nome, descricao: a.descricao };
}

const ORDEM_STATUS: Record<Entrega["status"], number> = { pendente: 0, entregue: 1, corrigida: 2 };

/**
 * Atividades publicadas pelos professores para a turma da aluna — o outro lado
 * da tela do professor: o que ele publica e corrige aparece aqui ao vivo.
 */
export function AtividadesAluno() {
  const atividades = useSeletor((e) => e.atividades);
  const usuarioId = useSeletor((e) => e.usuario.id);
  const turma = useSeletor((e) => e.usuario.turma);
  const pessoas = useSeletor((e) => e.pessoas);
  const agora = useAgora(60_000);
  const router = useRouter();
  const [entregando, setEntregando] = useState<Atividade | null>(null);

  const minhas = atividades
    .filter((a) => a.turma === turma)
    .map((a) => ({ atividade: a, entrega: a.entregas.find((e) => e.alunoId === usuarioId) ?? { alunoId: usuarioId, status: "pendente" as const } }))
    .sort((x, y) => {
      const s = ORDEM_STATUS[x.entrega.status] - ORDEM_STATUS[y.entrega.status];
      if (s) return s;
      if (x.entrega.status === "pendente") return x.atividade.prazo - y.atividade.prazo;
      return (y.entrega.entregueEm ?? y.atividade.prazo) - (x.entrega.entregueEm ?? x.atividade.prazo);
    });
  const pendentes = minhas.filter((m) => m.entrega.status === "pendente").length;

  const abrirMaterial = (postId: string) => {
    focarPost(postId);
    router.push("/feed");
  };

  return (
    <section id="atividades" className="scroll-mt-24">
      <TituloSecao extra={pendentes ? `${pendentes} ${pendentes === 1 ? "pendente" : "pendentes"}` : "Tudo entregue"}>Atividades do professor</TituloSecao>

      {minhas.length === 0 ? (
        <Vazio icone={<CheckCircle2 />} titulo="Nenhuma atividade por enquanto" descricao="Quando um professor publicar algo para a sua turma, aparece aqui." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-borda bg-superficie">
          <ul className="divide-y divide-borda">
            <AnimatePresence initial={false}>
              {minhas.map(({ atividade, entrega }) => (
                <ItemAtividade
                  key={atividade.id}
                  atividade={atividade}
                  entrega={entrega}
                  professor={pessoas[atividade.professorId]}
                  aluna={pessoas[usuarioId]}
                  agora={agora}
                  onEntregar={() => setEntregando(atividade)}
                  onMaterial={abrirMaterial}
                />
              ))}
            </AnimatePresence>
          </ul>
        </div>
      )}

      <EntregaSheet atividade={entregando} onFechar={() => setEntregando(null)} />
    </section>
  );
}

function ItemAtividade({
  atividade: a,
  entrega,
  professor,
  aluna,
  agora,
  onEntregar,
  onMaterial,
}: {
  atividade: Atividade;
  entrega: Entrega;
  professor?: Pessoa;
  aluna?: Pessoa;
  agora: number;
  onEntregar: () => void;
  onMaterial: (postId: string) => void;
}) {
  const Icone = ICONE_ATIVIDADE[a.tipo];
  const pendente = entrega.status === "pendente";
  const atrasada = pendente && a.prazo < agora;
  const urgente = pendente && prazoUrgente(a.prazo, agora);
  const corrigida = entrega.status === "corrigida" && entrega.nota !== undefined;

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 500, damping: 42 }}
      className="flex gap-3 px-4 py-4 sm:px-5"
    >
      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-superficie-2 text-texto-2 ring-1 ring-inset ring-borda">
        <Icone className="size-4" aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[14.5px] font-medium leading-snug text-tinta">{a.titulo}</h3>
            <p className="mt-0.5 truncate text-[12px] text-texto-2">
              {a.disciplina} · {ROTULO_ATIVIDADE[a.tipo]} · {professor?.nome ?? "Professor"}
            </p>
          </div>
          <Status entrega={entrega} atrasada={atrasada} />
        </div>

        {pendente && <p className="mt-2 line-clamp-2 text-[13.5px] leading-relaxed text-texto">{a.descricao}</p>}

        {!pendente && (
          <div className="mt-2 text-[13px] text-texto-2">
            <p>
              Entregue{entrega.entregueEm ? ` ${tempoRelativo(entrega.entregueEm, agora)}` : ""}
              {entrega.status === "entregue" && " · os pontos chegam com a nota."}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
              {entrega.anexo && (
                <span className="inline-flex min-w-0 items-center gap-2">
                  <Paperclip className="size-3.5 shrink-0" aria-hidden />
                  <span className="max-w-48 truncate text-tinta">{entrega.anexo.nome}</span>
                  <button type="button" onClick={() => void abrirAnexoDe(entrega.anexo!, contextoDe(a, professor))} className="alvo-toque font-medium text-acento underline-offset-2 hover:underline">
                    Abrir
                  </button>
                  <button type="button" onClick={() => void baixarAnexoDe(entrega.anexo!, contextoDe(a, professor))} className="alvo-toque font-medium text-acento underline-offset-2 hover:underline">
                    Baixar
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={() => abrirAnexo(`entrega-${a.id}.pdf`, { ...contextoDe(a, professor), autor: "Você", texto: lerResposta(entrega.resposta).texto || (entrega.anexo || lerResposta(entrega.resposta).anexo ? "" : `Entrega registrada${entrega.entregueEm ? ` em ${dataCurta(entrega.entregueEm)}` : ""}.`) })}
                className="alvo-toque inline-flex items-center gap-1 font-medium text-acento underline-offset-2 hover:underline"
              >
                <FileText className="size-3.5" aria-hidden /> Ver minha entrega (PDF)
              </button>
            </div>
          </div>
        )}

        {corrigida && (
          <div className="mt-2.5 rounded-xl bg-superficie-2 px-3.5 py-3 ring-1 ring-inset ring-borda">
            <p className="flex flex-wrap items-baseline gap-x-2 text-[13px] text-texto-2">
              <span className="text-[15px] font-semibold tabular-nums text-acento">Nota {fmtNota(entrega.nota as number)}</span>
              <span className="tabular-nums">
                +{entrega.pontos ?? Math.round((a.pontos * (entrega.nota as number)) / 10)} pontos · +{entrega.xp ?? Math.round((a.xp * (entrega.nota as number)) / 10)} XP
              </span>
            </p>
            <p className="mt-1 text-[13px] leading-snug text-texto">{entrega.feedback ? `“${entrega.feedback}”` : <span className="text-texto-2">Corrigida sem comentário.</span>}</p>
            <button
              type="button"
              onClick={() => abrirCorrecao(a, entrega, aluna, professor)}
              className="alvo-toque mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-acento underline-offset-2 hover:underline"
            >
              <FileText className="size-3.5" aria-hidden /> Correção (PDF)
            </button>
          </div>
        )}

        {(pendente || a.postId || a.anexo) && (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            {pendente && (
              <p className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-texto-2">
                <span className={cn("inline-flex items-center gap-1", atrasada ? "text-alerta" : urgente && "text-ouro")}>
                  <CalendarClock className="size-3.5" aria-hidden />
                  {textoPrazo(a.prazo, agora, "aluno")}
                </span>
                <span className="tabular-nums">
                  até +{a.pontos} pontos e +{a.xp} XP
                </span>
              </p>
            )}
            <div className="ml-auto flex flex-wrap gap-2">
              {a.anexo && (
                <>
                  <Button variante="secundario" tamanho="sm" onClick={() => void abrirAnexoDe(a.anexo!, contextoDe(a, professor))} aria-label={`Abrir ${a.anexo.nome}`}>
                    <Paperclip /> Abrir anexo
                  </Button>
                  <Button variante="fantasma" tamanho="sm" onClick={() => void baixarAnexoDe(a.anexo!, contextoDe(a, professor))} aria-label={`Baixar ${a.anexo.nome}`}>
                    Baixar
                  </Button>
                </>
              )}
              {a.postId && (
                <Button variante="secundario" tamanho="sm" onClick={() => a.postId && onMaterial(a.postId)}>
                  Abrir material <ArrowUpRight />
                </Button>
              )}
              {pendente && (
                <Button tamanho="sm" onClick={onEntregar}>
                  <Send /> Entregar
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.li>
  );
}

function Status({ entrega, atrasada }: { entrega: Entrega; atrasada: boolean }) {
  if (entrega.status === "corrigida") return <Badge tom="claro" className="shrink-0">Corrigida</Badge>;
  if (entrega.status === "entregue") return <Badge tom="neutro" className="shrink-0">Entregue</Badge>;
  if (atrasada) return <Badge tom="alerta" className="shrink-0">Atrasada</Badge>;
  return <Badge tom="contorno" className="shrink-0">Pendente</Badge>;
}
