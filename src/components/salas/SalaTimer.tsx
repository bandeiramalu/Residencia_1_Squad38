"use client";

import { CalendarClock, Check, Eye, FastForward, Lock, LogIn, Pause, Play } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Anel } from "@/components/ui/Anel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Entrada } from "@/components/ui/Campo";
import { useAgora } from "@/hooks/useAgora";
import { useModoApresentacao } from "@/lib/apresentacao";
import { cn } from "@/lib/cn";
import { faseDaSala, formatarMinutos, formatarRelogio, lerTimer } from "@/lib/estudos";
import { primeiroNome } from "@/lib/format";
import { adiantarFoco, buscarSalaPorCodigo, pausarFoco, retomarFoco } from "@/store/actions";
import { useSeletor } from "@/store/store";
import type { SalaEstudo } from "@/store/types";
import { BotaoLembrar, ContagemAbertura, COR_FOCO, COR_PAUSA, COR_PAUSADO, horaCurta, liberarSala, quandoAbre, TRILHO, useFaseDaSala } from "./comum";

const ANEL = 200;
const ESPESSURA = 5;

interface Props {
  sala: SalaEstudo;
  professor: boolean;
  /** A aluna está nesta sala (salaAtual). */
  dentro: boolean;
  /** Sala privada já liberada (código, criadora ou professor). */
  liberada: boolean;
  nomeCriador?: string;
  onEntrar: () => void;
}

/** Card do timer sincronizado: o foco da aluna (se ela está na sala) ou o ciclo da sala. */
export function PainelTimer({ sala, professor, dentro, liberada, nomeCriador, onEntrar }: Props) {
  const timer = useSeletor((e) => e.estudos.timer);
  const demo = useModoApresentacao();
  const { aberta, fase } = useFaseDaSala(sala);
  const meu = !professor && timer?.salaId === sala.id ? timer : null;
  const estado = !aberta && sala.agendadaPara ? "agendada" : !liberada ? "bloqueada" : meu ? "focando" : professor ? "monitorando" : "fora";
  const aoVivo = estado === "focando" || estado === "fora" || estado === "monitorando";

  return (
    <section aria-labelledby="timer-titulo" className="overflow-hidden rounded-2xl border border-borda bg-superficie">
      <h2 id="timer-titulo" className="px-4 pt-4 text-[15px] font-semibold text-tinta sm:px-5">
        {estado === "focando" ? "Seu foco" : "Timer da sala"}
      </h2>

      <div className="px-4 pb-5 pt-3 sm:px-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={estado}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
          >
            {estado === "agendada" && <Agendada sala={sala} />}
            {estado === "bloqueada" && <Bloqueada sala={sala} nomeCriador={nomeCriador} />}
            {estado === "focando" && meu && (
              <>
                <div className="grid place-items-center">
                  <RelogioPessoal sala={sala} />
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                  <Button tamanho="lg" variante={meu.pausado ? "primario" : "secundario"} onClick={meu.pausado ? retomarFoco : pausarFoco} className="min-w-32">
                    {meu.pausado ? <Play /> : <Pause />}
                    {meu.pausado ? "Retomar" : "Pausar"}
                  </Button>
                  {demo && (
                    <Button tamanho="lg" variante="fantasma" onClick={() => adiantarFoco(5)} title="Demonstração: faz o tempo passar 5 minutos">
                      <FastForward />
                      Avançar 5 min
                      <Badge tom="neutro">demo</Badge>
                    </Button>
                  )}
                </div>
              </>
            )}
            {(estado === "fora" || estado === "monitorando") && (
              <>
                <div className="grid place-items-center">
                  <RelogioSala sala={sala} />
                </div>
                {estado === "monitorando" ? (
                  <p className="mx-auto mt-5 flex max-w-sm items-center justify-center gap-2 text-center text-[13px] text-texto-2">
                    <Eye className="size-4 shrink-0" aria-hidden />
                    Você acompanha o ciclo, a presença e o chat.
                  </p>
                ) : (
                  <ChamadaEntrar sala={sala} dentro={dentro} fase={fase} temOutroFoco={!!timer && timer.salaId !== sala.id} outraDisciplina={timer?.disciplina} onEntrar={onEntrar} />
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {aoVivo && <EstatisticasSala sala={sala} dentro={dentro} />}
    </section>
  );
}

function ChamadaEntrar({
  sala,
  dentro,
  fase,
  temOutroFoco,
  outraDisciplina,
  onEntrar,
}: {
  sala: SalaEstudo;
  dentro: boolean;
  fase: "foco" | "pausa";
  temOutroFoco: boolean;
  outraDisciplina?: string;
  onEntrar: () => void;
}) {
  const lotada = !dentro && sala.membros.length >= sala.capacidade;
  const dica = lotada
    ? "Sala lotada. Assim que alguém sair, a vaga é sua."
    : temOutroFoco
      ? `Seu foco atual (${outraDisciplina}) será encerrado e registrado.`
      : fase === "pausa"
        ? "A sala está na pausa: seu foco começa no próximo ciclo."
        : "Seu timer começa sincronizado com a sala.";
  return (
    <div className="mt-5 grid place-items-center gap-2 text-center">
      <Button tamanho="lg" onClick={onEntrar} disabled={lotada}>
        <LogIn />
        {dentro ? "Voltar a focar" : "Entrar e focar"}
      </Button>
      <p className="max-w-xs text-[12px] text-texto-2">{dica}</p>
    </div>
  );
}

/** "● Em foco" dentro do anel. O ponto verde é o "ao vivo" (único elemento que pulsa). */
function RotuloFase({ texto, tom }: { texto: string; tom: "foco" | "pausa" | "pausado" }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-texto-2">
      <span className={cn("size-1.5 rounded-full", tom === "foco" ? "animate-pulso bg-verde" : tom === "pausa" ? "bg-ambar" : "bg-texto-2/60")} aria-hidden />
      {texto}
    </span>
  );
}

function Relogio({ ms, apagado }: { ms: number; apagado?: boolean }) {
  return <span className={cn("mt-1.5 block text-[46px] font-light leading-none tabular-nums tracking-tight", apagado ? "text-texto-2" : "text-tinta")}>{formatarRelogio(ms)}</span>;
}

/** Ciclo da sala (quem ainda não entrou e o professor). Isolado: re-renderiza a cada segundo. */
function RelogioSala({ sala }: { sala: SalaEstudo }) {
  const agora = useAgora(1000);
  const f = faseDaSala(sala, agora);
  const pausa = f.fase === "pausa";
  return (
    <Anel
      progresso={f.progresso}
      tamanho={ANEL}
      espessura={ESPESSURA}
      cor={pausa ? COR_PAUSA : COR_FOCO}
      trilho={TRILHO}
      animar={false}
      rotulo={`Ciclo da sala: ${pausa ? "pausa" : "foco"}, faltam ${formatarRelogio(f.restanteMs)}`}
    >
      <RotuloFase texto={pausa ? "Pausa" : "Em foco"} tom={pausa ? "pausa" : "foco"} />
      <Relogio ms={f.restanteMs} />
      <span className="mt-2 block text-[12px] tabular-nums text-texto-2">
        Ciclo {f.ciclo} · {pausa ? "foco" : "pausa"} às {horaCurta(agora + f.restanteMs)}
      </span>
    </Anel>
  );
}

/** Foco da aluna dentro da sala (lerTimer). Mostra se está sincronizada com o ciclo coletivo. */
function RelogioPessoal({ sala }: { sala: SalaEstudo }) {
  const timer = useSeletor((e) => e.estudos.timer);
  const agora = useAgora(1000);
  if (!timer) return null;
  const l = lerTimer(timer, agora);
  const f = faseDaSala(sala, agora);
  const pausa = timer.fase === "pausa";
  const sincronizado = !timer.pausado && timer.fase === f.fase && Math.abs((l.restanteMs ?? 0) - f.restanteMs) < 3000;

  return (
    <Anel
      progresso={l.progresso ?? 0}
      tamanho={ANEL}
      espessura={ESPESSURA}
      cor={timer.pausado ? COR_PAUSADO : pausa ? COR_PAUSA : COR_FOCO}
      trilho={TRILHO}
      animar={false}
      rotulo={`Seu foco: ${timer.pausado ? "pausado" : pausa ? "pausa" : "foco"}`}
    >
      <RotuloFase texto={timer.pausado ? "Pausado" : pausa ? "Pausa" : timer.disciplina} tom={timer.pausado ? "pausado" : pausa ? "pausa" : "foco"} />
      <Relogio ms={l.restanteMs ?? l.decorridoMs} apagado={timer.pausado} />
      <span className="mt-2 inline-flex items-center gap-1 text-[12px] text-texto-2">
        {sincronizado ? (
          <>
            <Check className="size-3.5 text-acento" aria-hidden />
            Sincronizado com a sala
          </>
        ) : timer.pausado ? (
          "A sala segue no ciclo"
        ) : (
          `${timer.ciclos} ${timer.ciclos === 1 ? "ciclo feito" : "ciclos feitos"}`
        )}
      </span>
    </Anel>
  );
}

function Agendada({ sala }: { sala: SalaEstudo }) {
  const agora = useAgora(60_000);
  return (
    <div className="grid place-items-center py-2 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-superficie-2 text-texto-2">
        <CalendarClock className="size-5" aria-hidden />
      </span>
      <p className="mt-3 text-[13px] text-texto-2">A sala abre em</p>
      <ContagemAbertura ate={sala.agendadaPara!} className="mt-2.5" />
      <p className="mt-3 text-[14px] font-medium text-tinta">{quandoAbre(sala.agendadaPara!, agora)}</p>
      <BotaoLembrar sala={sala} className="mt-4 h-9 px-4" />
    </div>
  );
}

function Bloqueada({ sala, nomeCriador }: { sala: SalaEstudo; nomeCriador?: string }) {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!codigo.trim()) return;
    const id = buscarSalaPorCodigo(codigo);
    if (!id) return;
    liberarSala(id);
    if (id !== sala.id) router.push(`/estudos/salas/${id}`);
  };
  return (
    <div className="grid place-items-center py-2 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-superficie-2 text-texto-2">
        <Lock className="size-5" aria-hidden />
      </span>
      <p className="mt-3 text-[15px] font-semibold text-tinta">Sala privada</p>
      <p className="mt-1 max-w-xs text-[13px] text-texto-2">
        Digite o código de convite{nomeCriador ? ` que ${primeiroNome(nomeCriador)} compartilhou` : ""}.
      </p>
      <form onSubmit={enviar} className="mt-4 flex w-full max-w-xs gap-2">
        <div className="min-w-0 flex-1">
          <Entrada
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="Código"
            aria-label="Código de convite"
            maxLength={16}
            autoComplete="off"
            spellCheck={false}
            className="font-mono tracking-wide placeholder:font-sans placeholder:tracking-normal"
          />
        </div>
        <Button type="submit" className="h-10" disabled={!codigo.trim()}>
          Liberar
        </Button>
      </form>
    </div>
  );
}

/** Minutos focados hoje, ciclo atual e lotação — muda só quando a fase vira ou alguém entra/sai. */
function EstatisticasSala({ sala, dentro }: { sala: SalaEstudo; dentro: boolean }) {
  const { aberta, ciclo } = useFaseDaSala(sala);
  const ocupacao = sala.membros.length + (dentro ? 1 : 0);
  const itens = [
    { rotulo: "Focados hoje", valor: formatarMinutos(sala.focoHojeMin), dica: "Minutos de foco somados pela sala hoje" },
    { rotulo: "Ciclo atual", valor: aberta ? String(ciclo) : "—", dica: `Ciclos de ${sala.focoMin} min de foco e ${sala.pausaMin} de pausa` },
    { rotulo: "Lotação", valor: `${ocupacao}/${sala.capacidade}`, dica: "Pessoas na sala agora / capacidade" },
  ];
  return (
    <dl className="grid grid-cols-3 divide-x divide-borda border-t border-borda">
      {itens.map((i) => (
        <div key={i.rotulo} className="flex flex-col-reverse items-center px-2 py-3 text-center" title={i.dica}>
          <dt className="text-[12px] text-texto-2">{i.rotulo}</dt>
          <dd className="text-[15px] font-semibold tabular-nums text-tinta">{i.valor}</dd>
        </div>
      ))}
    </dl>
  );
}
