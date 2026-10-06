"use client";

import { Clock, History, Info, PenLine, Timer, Users, type LucideIcon } from "lucide-react";
import { useId, useState } from "react";
import { Nota, TituloSecao, Vazio } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { Campo, Entrada } from "@/components/ui/Campo";
import { Card } from "@/components/ui/Card";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { DisciplinaIcon } from "@/components/ui/DisciplinaIcon";
import { RodapeSheet } from "@/components/ui/RodapeSheet";
import { Sheet } from "@/components/ui/Sheet";
import { DISCIPLINAS, type Disciplina } from "@/data/escola";
import { cn } from "@/lib/cn";
import { formatarMinutos, minutosEntre } from "@/lib/estudos";
import { inicioDoDia, somarDias } from "@/lib/tempo";
import { registrarEstudoManual } from "@/store/actions";
import { useSeletor } from "@/store/store";
import type { SessaoEstudo } from "@/store/types";
import { horaMinuto, rotuloDoDia } from "./formato";

const ORIGEM: Record<SessaoEstudo["origem"], { rotulo: string; icone: LucideIcon }> = {
  timer: { rotulo: "Timer de foco", icone: Timer },
  sala: { rotulo: "Sala coletiva", icone: Users },
  manual: { rotulo: "Manual · sem pontos", icone: PenLine },
};

const PRESETS_MIN = [15, 25, 30, 45, 60, 90];
const LIMITE_MIN = 300;

/** Últimas sessões agrupadas por dia + registro manual (entra nas métricas, não vale pontos). */
export function SessoesRecentes({ agora, disciplinaSugerida, className }: { agora: number; disciplinaSugerida: Disciplina; className?: string }) {
  const sessoes = useSeletor((e) => e.estudos.sessoes);
  const salas = useSeletor((e) => e.salas);
  const [registrando, setRegistrando] = useState(false);
  const [todas, setTodas] = useState(false);

  const ordenadas = [...sessoes].sort((a, b) => b.inicio - a.inicio);
  const recentes = ordenadas.slice(0, todas ? 12 : 4);
  const grupos: { dia: number; itens: SessaoEstudo[] }[] = [];
  for (const s of recentes) {
    const dia = inicioDoDia(s.inicio);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo?.dia === dia) ultimo.itens.push(s);
    else grupos.push({ dia, itens: [s] });
  }

  return (
    <Card semPadding className={cn("p-5", className)}>
      <TituloSecao className="mb-0" extra={sessoes.length > 0 ? <span className="tabular-nums">{sessoes.length} no total</span> : undefined}>
        Sessões recentes
      </TituloSecao>

      {grupos.length ? (
        <div className="mt-3 space-y-4">
          {grupos.map((g) => (
            <section key={g.dia} aria-label={rotuloDoDia(g.dia, agora)}>
              <p className="flex items-center justify-between text-[12px] font-medium text-texto-2">
                <span>{rotuloDoDia(g.dia, agora)}</span>
                {/* Total do dia inteiro (não só das sessões listadas). */}
                <span className="tabular-nums">{formatarMinutos(minutosEntre(sessoes, g.dia, somarDias(g.dia, 1)))}</span>
              </p>
              <ul className="divide-y divide-borda">
                {g.itens.map((s) => (
                  <ItemSessao key={s.id} sessao={s} nomeSala={s.salaId ? salas.find((x) => x.id === s.salaId)?.nome : undefined} />
                ))}
              </ul>
            </section>
          ))}
          {ordenadas.length > 4 && (
            <button
              type="button"
              onClick={() => setTodas((v) => !v)}
              className="text-[13px] font-medium text-acento transition-opacity hover:opacity-80 active:opacity-70"
            >
              {todas ? "Mostrar menos" : "Mostrar mais sessões"}
            </button>
          )}
        </div>
      ) : (
        <div className="mt-3">
          <Vazio icone={<History />} titulo="Nenhuma sessão ainda" descricao="Seus blocos de foco aparecem aqui." />
        </div>
      )}

      <Button variante="secundario" bloco className="mt-4" onClick={() => setRegistrando(true)}>
        <PenLine aria-hidden />
        Registrar estudo manual
      </Button>

      <Sheet aberto={registrando} onFechar={() => setRegistrando(false)} titulo="Registrar estudo manual" subtitulo="Para estudos feitos fora do app.">
        <FormManual sugerida={disciplinaSugerida} onFechar={() => setRegistrando(false)} />
      </Sheet>
    </Card>
  );
}

function ItemSessao({ sessao, nomeSala }: { sessao: SessaoEstudo; nomeSala?: string }) {
  const origem = ORIGEM[sessao.origem];
  const Icone = origem.icone;
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-superficie-2 text-texto-2 ring-1 ring-inset ring-borda">
        <DisciplinaIcon disciplina={sessao.disciplina} className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-tinta">{sessao.disciplina}</p>
        <p className="flex min-w-0 items-center gap-1 text-[12px] text-texto-2">
          <span className="shrink-0 tabular-nums">{horaMinuto(sessao.inicio)}</span>
          <span aria-hidden>·</span>
          <Icone className="size-3 shrink-0" aria-hidden />
          <span className="truncate">{sessao.origem === "sala" && nomeSala ? nomeSala : origem.rotulo}</span>
        </p>
      </div>
      <span className="shrink-0 text-[13px] font-medium text-tinta tabular-nums">{formatarMinutos(sessao.minutos)}</span>
    </li>
  );
}

/** Montado só com o Sheet aberto: o formulário recomeça limpo a cada abertura. */
function FormManual({ sugerida, onFechar }: { sugerida: Disciplina; onFechar: () => void }) {
  const idMinutos = useId();
  const [disciplina, setDisciplina] = useState<Disciplina>(sugerida);
  const [minutos, setMinutos] = useState("30");
  const n = Number(minutos);
  const valido = minutos.trim() !== "" && Number.isInteger(n) && n >= 1 && n <= LIMITE_MIN;

  const registrar = () => {
    if (!valido) return;
    registrarEstudoManual(disciplina, n);
    onFechar();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        registrar();
      }}
      className="space-y-5"
    >
      <div className="space-y-2">
        <p className="text-[13px] font-medium text-tinta">Disciplina</p>
        <ChipGroup
          quebrar
          grupo="disciplina-manual"
          rotulo="Disciplina estudada"
          opcoes={DISCIPLINAS.map((d) => ({
            id: d,
            rotulo: (
              <>
                <DisciplinaIcon disciplina={d} />
                {d}
              </>
            ),
          }))}
          valor={disciplina}
          onChange={setDisciplina}
        />
      </div>

      <Campo rotulo="Quanto tempo?" htmlFor={idMinutos} erro={minutos !== "" && !valido ? `Informe um número inteiro de 1 a ${LIMITE_MIN} minutos.` : undefined} dica="Em minutos. O registro fica com o horário de agora.">
        <div className="flex flex-wrap gap-2 pb-1">
          {PRESETS_MIN.map((p) => {
            const ativo = n === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setMinutos(String(p))}
                aria-pressed={ativo}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-[13px] font-medium tabular-nums transition-colors duration-150 active:scale-[0.97]",
                  ativo ? "bg-tinta text-superficie" : "bg-superficie text-texto ring-1 ring-inset ring-borda hover:bg-superficie-2",
                )}
              >
                {formatarMinutos(p)}
              </button>
            );
          })}
        </div>
        <Entrada id={idMinutos} type="number" inputMode="numeric" min={1} max={LIMITE_MIN} step={1} value={minutos} onChange={(e) => setMinutos(e.target.value)} icone={<Clock />} />
      </Campo>

      <Nota icone={<Info />}>
        Entra nas suas métricas, mas <b className="font-medium text-tinta">não vale pontos</b> — pontos vêm só do timer.
      </Nota>

      <RodapeSheet>
        <Button variante="secundario" className="flex-1" onClick={onFechar}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-[2]" disabled={!valido}>
          Registrar{valido ? ` ${formatarMinutos(n)}` : ""}
        </Button>
      </RodapeSheet>
    </form>
  );
}
