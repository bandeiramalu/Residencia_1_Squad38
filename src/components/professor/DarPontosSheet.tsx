"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { AreaTexto } from "@/components/ui/Campo";
import { RodapeSheet } from "@/components/ui/RodapeSheet";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";
import { fmt, primeiroNome } from "@/lib/format";
import { atribuirPontos } from "@/store/actions";
import { Stepper } from "./comum";

export interface AlvoPontos {
  id: string;
  nome: string;
  iniciais?: string;
}

export const MOTIVOS_PONTOS = ["Participação em aula", "Ajudou colegas", "Entrega caprichada", "Evolução na semana"] as const;

/** Conteúdo do "Dar pontos/XP" — usado sozinho num Sheet ou dentro da ficha do aluno. */
export function DarPontosForm({ alunos, onConcluir, onCancelar }: { alunos: AlvoPontos[]; onConcluir: () => void; onCancelar: () => void }) {
  const [pontos, setPontos] = useState(50);
  const [xp, setXp] = useState(0);
  const [motivo, setMotivo] = useState<string | null>(MOTIVOS_PONTOS[0]);
  const [texto, setTexto] = useState("");

  const um = alunos.length === 1;
  const quem = um ? primeiroNome(alunos[0].nome) : `${alunos.length} alunos`;
  const partes = [pontos > 0 && `+${fmt(pontos)} pontos`, xp > 0 && `+${fmt(xp)} XP`].filter(Boolean).join(" e ");
  const valido = alunos.length > 0 && (pontos > 0 || xp > 0) && (!!motivo || texto.trim().length > 2);
  const motivoFinal = [motivo, texto.trim()].filter(Boolean).join(" — ");

  const enviar = () => {
    if (!valido) return;
    atribuirPontos(
      alunos.map((a) => a.id),
      pontos,
      xp,
      motivoFinal,
    );
    onConcluir();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          {alunos.slice(0, 5).map((a) => (
            <Avatar key={a.id} nome={a.nome} iniciais={a.iniciais} tamanho="sm" className="rounded-full ring-2 ring-superficie" />
          ))}
        </div>
        <p className="min-w-0 text-[13px] leading-snug text-texto-2">
          {um ? (
            <>
              Para <span className="font-medium text-tinta">{alunos[0].nome}</span>
            </>
          ) : (
            <>
              Para <span className="font-medium text-tinta">{alunos.length} alunos</span>
              {alunos.length > 5 && ` (${alunos.slice(0, 2).map((a) => primeiroNome(a.nome)).join(", ")} e mais ${alunos.length - 2})`}
            </>
          )}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-[13px] font-medium text-tinta" title="Pontos são gastos na Loja">
            Pontos
          </p>
          <Stepper valor={pontos} onChange={setPontos} passo={5} max={300} rotulo="pontos" sufixo="gastáveis na Loja" atalhos={[10, 25, 50, 100]} />
        </div>
        <div>
          <p className="mb-1.5 text-[13px] font-medium text-tinta" title="XP é mérito acadêmico: nunca é gasto e define nível e liga">
            XP
          </p>
          <Stepper valor={xp} onChange={setXp} passo={5} max={200} rotulo="XP" sufixo="nível e liga" atalhos={[0, 10, 20, 50]} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-[13px] font-medium text-tinta">Motivo</p>
        <div className="flex flex-wrap gap-1.5">
          {MOTIVOS_PONTOS.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={motivo === m}
              onClick={() => setMotivo(motivo === m ? null : m)}
              className={cn(
                "rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 active:scale-[0.97]",
                motivo === m ? "bg-tinta text-superficie" : "bg-superficie text-texto ring-1 ring-inset ring-borda hover:bg-superficie-2",
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <AreaTexto
          className="mt-2.5 min-h-16"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Detalhe opcional (o aluno vê esta mensagem)…"
          maxLength={140}
          aria-label="Detalhe do motivo"
        />
      </div>

      <div className="rounded-xl border border-borda bg-superficie-2 px-3.5 py-3 text-[13px] leading-snug">
        <p className="font-medium text-tinta">
          {partes ? (
            <>
              {quem} {um ? "recebe" : "recebem"} {partes}
              {!um && " cada"}
            </>
          ) : (
            "Escolha pontos ou XP"
          )}
        </p>
        <p className="mt-0.5 text-texto-2">
          {motivoFinal ? `“${motivoFinal}”` : "Escolha um motivo — fica registrado no histórico."}
          {!um && pontos > 0 && ` · ${fmt(pontos * alunos.length)} pontos no total`}
        </p>
      </div>

      <p className="text-[12px] leading-snug text-texto-2">Pontos são gastos na Loja. XP é mérito: nunca é gasto e define nível e liga.</p>

      <RodapeSheet>
        <Button variante="secundario" className="flex-1" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button className="flex-[2]" disabled={!valido} onClick={enviar}>
          <Send /> Enviar
          {partes && <span className="hidden sm:inline">{partes}</span>}
        </Button>
      </RodapeSheet>
    </div>
  );
}

/** Sheet "Dar pontos/XP" para um ou mais alunos. */
export function DarPontosSheet({ alunos, onFechar, onConcluir }: { alunos: AlvoPontos[] | null; onFechar: () => void; onConcluir?: () => void }) {
  return (
    <Sheet aberto={!!alunos && alunos.length > 0} onFechar={onFechar} titulo="Dar pontos e XP" subtitulo="Fica registrado no histórico do aluno">
      {alunos && (
        <DarPontosForm
          key={alunos.map((a) => a.id).join()}
          alunos={alunos}
          onCancelar={onFechar}
          onConcluir={() => {
            onConcluir?.();
            onFechar();
          }}
        />
      )}
    </Sheet>
  );
}
