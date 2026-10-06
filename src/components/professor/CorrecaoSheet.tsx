"use client";

import { ArrowRight, CheckCheck, Minus, Paperclip, Plus, Send } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import { useState } from "react";
import { fmtNota, lerResposta, recompensaDaNota } from "@/components/atividades/comum";
import { Avatar } from "@/components/ui/Avatar";
import { LinkPessoa } from "@/components/ui/LinkPessoa";
import { abrirAnexoDe, baixarAnexo, baixarAnexoDe } from "@/lib/materiais";
import { Button } from "@/components/ui/Button";
import { AreaTexto } from "@/components/ui/Campo";
import { RodapeSheet } from "@/components/ui/RodapeSheet";
import { Sheet } from "@/components/ui/Sheet";
import { useAgora } from "@/hooks/useAgora";
import { cn } from "@/lib/cn";
import { primeiroNome } from "@/lib/format";
import { tempoRelativo } from "@/lib/tempo";
import { corrigirEntrega, corrigirTodas } from "@/store/actions";
import { useSeletor } from "@/store/store";
import type { Atividade } from "@/store/types";

export const FRASES_FEEDBACK = [
  "Muito bem! Raciocínio claro e organizado.",
  "Ótima evolução em relação à última atividade.",
  "Revise a justificativa das últimas questões.",
  "Faltou mostrar o cálculo passo a passo.",
  "Excelente! Pode ajudar os colegas no feed.",
];

function corDaNota(nota: number) {
  return nota >= 7 ? "text-acento" : nota >= 5 ? "text-ambar" : "text-alerta";
}

const BOTAO_AJUSTE =
  "grid size-9 shrink-0 place-items-center rounded-lg border border-borda bg-superficie text-tinta transition-colors duration-150 hover:bg-superficie-2 active:scale-95 disabled:opacity-40";

/** Nota de 0 a 10 (passo 0,5): número, − / +, trilho deslizante e atalhos. */
export function NotaPicker({ nota, onChange }: { nota: number; onChange: (n: number) => void }) {
  const ajustar = (n: number) => onChange(Math.max(0, Math.min(10, Math.round(n * 2) / 2)));
  return (
    <div className="rounded-xl border border-borda bg-superficie p-4">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => ajustar(nota - 0.5)} disabled={nota <= 0} aria-label="Diminuir meio ponto" className={BOTAO_AJUSTE}>
          <Minus className="size-4" />
        </button>
        <div className="flex min-w-0 flex-1 items-baseline justify-center gap-1" aria-live="polite">
          <span className="relative inline-flex h-8 min-w-12 justify-center overflow-hidden">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={nota}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 600, damping: 45 }}
                className={cn("text-2xl font-semibold leading-8 tabular-nums", corDaNota(nota))}
              >
                {fmtNota(nota)}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="text-[13px] text-texto-2">de 10</span>
        </div>
        <button type="button" onClick={() => ajustar(nota + 0.5)} disabled={nota >= 10} aria-label="Aumentar meio ponto" className={BOTAO_AJUSTE}>
          <Plus className="size-4" />
        </button>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={0.5}
        value={nota}
        onChange={(e) => ajustar(Number(e.target.value))}
        aria-label="Nota"
        className="mt-3 h-2 w-full cursor-pointer accent-verde"
      />
      <div className="mt-2.5 flex gap-1.5">
        {[5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => ajustar(n)}
            aria-pressed={nota === n}
            className={cn(
              "h-8 min-w-0 flex-1 rounded-md text-[13px] font-medium tabular-nums transition-colors duration-150",
              nota === n ? "bg-tinta text-superficie" : "bg-superficie-2 text-texto-2 hover:text-tinta",
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Chips de frases prontas + texto livre. */
function Feedback({ texto, onChange }: { texto: string; onChange: (t: string) => void }) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-medium text-tinta">Feedback para o aluno</p>
      <div className="flex flex-wrap gap-1.5">
        {FRASES_FEEDBACK.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={texto === f}
            onClick={() => onChange(texto === f ? "" : f)}
            className={cn(
              "rounded-full px-3 py-1.5 text-left text-[12.5px] leading-snug transition-colors duration-150 active:scale-[0.98]",
              texto === f ? "bg-tinta text-superficie" : "bg-superficie text-texto ring-1 ring-inset ring-borda hover:bg-superficie-2",
            )}
          >
            {f}
          </button>
        ))}
      </div>
      <AreaTexto className="mt-2.5 min-h-20" value={texto} onChange={(e) => onChange(e.target.value)} placeholder="Escreva um comentário (opcional)…" maxLength={240} aria-label="Feedback" />
    </div>
  );
}

function Previa({ titulo, pontos, xp }: { titulo: string; pontos: number; xp: number }) {
  return (
    <div className="rounded-xl border border-borda bg-superficie-2 px-3.5 py-3 text-[13px] leading-snug">
      <p className="font-medium text-tinta">{titulo}</p>
      <p className="mt-0.5 text-texto-2">
        <span className="tabular-nums">
          +{pontos} pontos · +{xp} XP
        </span>{" "}
        · proporcional à nota
      </p>
    </div>
  );
}

/** Correção de uma entrega. `fila` são os próximos alunos a corrigir (botão "Enviar e próxima"). */
export function CorrecaoSheet({
  atividade,
  alunoId,
  fila,
  onFechar,
  onProxima,
}: {
  atividade: Atividade;
  alunoId: string | null;
  fila: string[];
  onFechar: () => void;
  onProxima: (alunoId: string) => void;
}) {
  const pessoas = useSeletor((e) => e.pessoas);
  const nome = alunoId ? (pessoas[alunoId]?.nome ?? "Aluno") : "";
  return (
    <Sheet aberto={!!alunoId} onFechar={onFechar} titulo={`Corrigir · ${primeiroNome(nome)}`} subtitulo={atividade.titulo}>
      {alunoId && <FormCorrecao key={alunoId} atividade={atividade} alunoId={alunoId} fila={fila} onFechar={onFechar} onProxima={onProxima} />}
    </Sheet>
  );
}

function FormCorrecao({
  atividade,
  alunoId,
  fila,
  onFechar,
  onProxima,
}: {
  atividade: Atividade;
  alunoId: string;
  fila: string[];
  onFechar: () => void;
  onProxima: (alunoId: string) => void;
}) {
  const agora = useAgora(30_000);
  const pessoas = useSeletor((e) => e.pessoas);
  const [nota, setNota] = useState(9);
  const [feedback, setFeedback] = useState("");
  const entrega = atividade.entregas.find((e) => e.alunoId === alunoId);
  const aluno = pessoas[alunoId];
  const nome = aluno?.nome ?? "Aluno";
  const { pontos, xp } = recompensaDaNota(atividade, nota);
  const { texto, anexo } = lerResposta(entrega?.resposta);
  const proximo = fila.find((id) => id !== alunoId);
  const atrasada = !!entrega?.entregueEm && entrega.entregueEm > atividade.prazo;

  const enviar = (seguir: boolean) => {
    corrigirEntrega(atividade.id, alunoId, nota, feedback);
    if (seguir && proximo) onProxima(proximo);
    else onFechar();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <LinkPessoa id={alunoId} rotulo={`Perfil de ${nome}`} className="shrink-0">
          <Avatar nome={nome} iniciais={aluno?.iniciais} tamanho="md" />
        </LinkPessoa>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-[14px] font-medium text-tinta">
            <LinkPessoa id={alunoId} className="hover:underline">
              {nome}
            </LinkPessoa>
          </p>
          <p className="text-[12px] text-texto-2">
            {entrega?.entregueEm ? `Entregou ${tempoRelativo(entrega.entregueEm, agora)}` : "Entrega registrada"}
            {atrasada ? <span className="text-alerta"> · com atraso</span> : " · no prazo"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-borda bg-superficie-2 p-3.5">
        <p className="text-[12px] font-medium text-texto-2">Resposta do aluno</p>
        <p className="mt-1 whitespace-pre-line text-[14px] leading-relaxed text-texto">{texto || "Entregou sem comentário escrito."}</p>
        {(entrega?.anexo || anexo) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {entrega?.anexo?.previa && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={entrega.anexo.previa} alt="" className="size-14 rounded-lg object-cover ring-1 ring-inset ring-borda" />
            )}
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-borda bg-superficie py-1 pl-2.5 pr-1 text-[12px] text-tinta">
              <Paperclip className="size-3.5 shrink-0 text-texto-2" />
              <span className="truncate">{entrega?.anexo?.nome ?? anexo}</span>
              {entrega?.anexo ? (
                <>
                  <button type="button" onClick={() => void abrirAnexoDe(entrega.anexo!, { titulo: atividade.titulo })} className="rounded px-2 py-1 font-medium text-acento transition-colors hover:bg-superficie-2 active:scale-95">
                    Abrir
                  </button>
                  <button type="button" onClick={() => void baixarAnexoDe(entrega.anexo!, { titulo: atividade.titulo })} className="rounded px-2 py-1 font-medium text-acento transition-colors hover:bg-superficie-2 active:scale-95">
                    Baixar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => baixarAnexo(anexo!, { titulo: atividade.titulo, autor: nome, disciplina: atividade.disciplina, texto })}
                  className="rounded px-2 py-1 font-medium text-acento transition-colors hover:bg-superficie-2 active:scale-95"
                >
                  Baixar
                </button>
              )}
            </span>
          </div>
        )}
      </div>

      <NotaPicker nota={nota} onChange={setNota} />
      <Feedback texto={feedback} onChange={setFeedback} />
      <Previa titulo={`${primeiroNome(nome)} recebe +${pontos} pontos e +${xp} XP`} pontos={pontos} xp={xp} />

      <RodapeSheet>
        <Button variante={proximo ? "secundario" : "primario"} className="flex-1" onClick={() => enviar(false)}>
          <Send /> Enviar<span className={cn(proximo && "max-sm:hidden")}> nota</span>
        </Button>
        {proximo && (
          <Button className="flex-[1.5]" onClick={() => enviar(true)}>
            Enviar e próxima <ArrowRight />
          </Button>
        )}
      </RodapeSheet>
    </div>
  );
}

/** Corrige de uma vez todas as entregas aguardando nota. */
export function CorrigirTodasSheet({ atividade, aberto, onFechar }: { atividade: Atividade; aberto: boolean; onFechar: () => void }) {
  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo="Corrigir todas as entregues" subtitulo="Mesma nota e feedback para quem já entregou">
      <FormTodas atividade={atividade} onFechar={onFechar} />
    </Sheet>
  );
}

function FormTodas({ atividade, onFechar }: { atividade: Atividade; onFechar: () => void }) {
  const [nota, setNota] = useState(8);
  const [feedback, setFeedback] = useState("");
  const qtd = atividade.entregas.filter((e) => e.status === "entregue").length;
  const { pontos, xp } = recompensaDaNota(atividade, nota);

  const aplicar = () => {
    corrigirTodas(atividade.id, nota, feedback);
    onFechar();
  };

  return (
    <div className="space-y-5">
      <NotaPicker nota={nota} onChange={setNota} />
      <Feedback texto={feedback} onChange={setFeedback} />
      <Previa titulo={`${qtd} ${qtd === 1 ? "entrega recebe" : "entregas recebem"} nota ${fmtNota(nota)}`} pontos={pontos} xp={xp} />
      <p className="text-[12px] leading-snug text-texto-2">Entregas que pedem um olhar individual podem ser corrigidas uma a uma.</p>
      <RodapeSheet>
        <Button variante="secundario" className="flex-1" onClick={onFechar}>
          Cancelar
        </Button>
        <Button className="flex-[2]" disabled={qtd === 0} onClick={aplicar}>
          <CheckCheck /> Corrigir {qtd} {qtd === 1 ? "entrega" : "entregas"}
        </Button>
      </RodapeSheet>
    </div>
  );
}
