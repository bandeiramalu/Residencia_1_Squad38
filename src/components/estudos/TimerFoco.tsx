"use client";

import { ChevronRight, Coffee, EyeOff, FastForward, Maximize2, Minimize2, Pause, Play, SkipForward, Square, Target, Users } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Anel } from "@/components/ui/Anel";
import { Button } from "@/components/ui/Button";
import { Entrada } from "@/components/ui/Campo";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { DisciplinaIcon } from "@/components/ui/DisciplinaIcon";
import { Segmentado } from "@/components/ui/Segmentado";
import { DISCIPLINAS, type Disciplina } from "@/data/escola";
import { BONUS_CICLO, MODOS_TIMER, PONTOS_POR_MINUTO } from "@/data/estudos";
import { useAgora } from "@/hooks/useAgora";
import { useMidia } from "@/hooks/useMidia";
import { useModoApresentacao } from "@/lib/apresentacao";
import { cn } from "@/lib/cn";
import { formatarMinutos, formatarRelogio, lerTimer, minutosCumpridos, MIN } from "@/lib/estudos";
import { adiantarFoco, encerrarFoco, iniciarFoco, pausarFoco, pularPausa, retomarFoco, simularSaida } from "@/store/actions";
import { useSeletor } from "@/store/store";
import type { ModoTimer, TimerAtivo } from "@/store/types";

const HORA = 60 * MIN;
const ENTRADA = { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 }, transition: { duration: 0.18 } } as const;

/** Rótulos curtos: "Foco profundo" não cabe no segmentado estreito. */
const NOME_CURTO: Record<ModoTimer, string> = { pomodoro: "Pomodoro", profundo: "Profundo", livre: "Livre" };

/**
 * Card principal da Sala de Estudos: configura e conduz o timer de foco.
 * O relógio de 1 s vive em <Relogio> (e no resumo do "Encerrar"), então o resto
 * do card só re-renderiza quando o timer muda de estado.
 */
export function TimerFoco({ disciplinaSugerida, className }: { disciplinaSugerida: Disciplina; className?: string }) {
  const timer = useSeletor((e) => e.estudos.timer);
  const [imersivo, setImersivo] = useState(false);
  // Sessão encerrada (aqui ou em outra tela): o modo imersivo não reabre sozinho no próximo foco.
  if (!timer && imersivo) setImersivo(false);

  const abrirImersivo = () => {
    setImersivo(true);
    // Tela cheia de verdade quando o navegador permite (precisa do gesto do clique).
    document.documentElement.requestFullscreen?.()?.catch(() => {});
  };

  return (
    <section aria-label="Timer de foco" className={cn("rounded-2xl border border-borda bg-superficie", className)}>
      <AnimatePresence mode="wait" initial={false}>
        {timer ? <FocoAtivo key="ativo" timer={timer} onImersivo={abrirImersivo} /> : <ConfigurarFoco key="config" disciplinaSugerida={disciplinaSugerida} />}
      </AnimatePresence>
      <AnimatePresence>{imersivo && timer && <ModoImersivo key="imersivo" timer={timer} onSair={() => setImersivo(false)} />}</AnimatePresence>
    </section>
  );
}

/* ───────────── Sem timer: escolher disciplina, ritmo e intenção ───────────── */

function ConfigurarFoco({ disciplinaSugerida }: { disciplinaSugerida: Disciplina }) {
  const [disciplina, setDisciplina] = useState<Disciplina>(disciplinaSugerida);
  const [modo, setModo] = useState<ModoTimer>("pomodoro");
  const [intencao, setIntencao] = useState("");
  const preset = MODOS_TIMER.find((m) => m.id === modo) ?? MODOS_TIMER[0];

  const iniciar = () => iniciarFoco({ disciplina, modo, meta: intencao });

  return (
    <motion.div {...ENTRADA} className="p-5 sm:p-6">
      <h2 className="text-[15px] font-semibold text-tinta">Timer de foco</h2>

      <div className="py-6 text-center sm:py-7" aria-live="polite">
        <motion.p
          key={modo}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="text-[56px] font-extralight leading-none tracking-[-0.04em] text-tinta tabular-nums sm:text-[64px]"
        >
          {formatarRelogio(preset.focoMin * MIN)}
        </motion.p>
        <p className="mt-2 text-[13px] text-texto-2">{preset.focoMin ? `${preset.focoMin} min de foco, ${preset.pausaMin} de pausa` : "Cronômetro livre"}</p>
      </div>

      <div className="space-y-5">
        <div>
          <p className="mb-2 text-[13px] font-medium text-tinta">Disciplina</p>
          <ChipGroup
            grupo="disciplina-foco"
            rotulo="Disciplina"
            className="-mx-5 scroll-px-5 px-5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
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

        <div className="grid gap-5 sm:grid-cols-[18rem_minmax(0,1fr)]">
          <div>
            <p className="mb-2 text-[13px] font-medium text-tinta">Ritmo</p>
            <Segmentado
              grupo="modo-foco"
              rotulo="Ritmo do foco"
              opcoes={MODOS_TIMER.map((m) => ({ id: m.id, rotulo: NOME_CURTO[m.id], aria: m.nome }))}
              valor={modo}
              onChange={setModo}
            />
          </div>
          <label className="block">
            <span className="mb-2 block text-[13px] font-medium text-tinta">
              O que você vai estudar? <span className="font-normal text-texto-2">(opcional)</span>
            </span>
            <Entrada
              value={intencao}
              onChange={(e) => setIntencao(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && iniciar()}
              maxLength={80}
              placeholder="Ex.: Lista 7, itens a–d"
              icone={<Target />}
              className="h-12"
            />
          </label>
        </div>
      </div>

      <Button tamanho="lg" bloco onClick={iniciar} className="mt-6 h-12">
        <Play className="fill-current" aria-hidden />
        Iniciar foco
        <span className="font-normal text-white">· {preset.focoMin ? `${preset.focoMin} min` : "livre"}</span>
      </Button>
      <p className="mt-2.5 text-center text-[12px] text-texto-2">
        +{PONTOS_POR_MINUTO} ponto por minuto · +{BONUS_CICLO} por ciclo completo · sair da tela por mais de 5 min perde o ciclo
      </p>
    </motion.div>
  );
}

/* ───────────── Timer em andamento ───────────── */

function FocoAtivo({ timer, onImersivo }: { timer: TimerAtivo; onImersivo: () => void }) {
  const sala = useSeletor((e) => (timer.salaId ? e.salas.find((s) => s.id === timer.salaId) : undefined));
  const [confirmar, setConfirmar] = useState(false);
  const pausa = timer.fase === "pausa";
  const modo = MODOS_TIMER.find((m) => m.id === timer.modo);

  return (
    <motion.div {...ENTRADA} className="p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <FaseSelo timer={timer} />
        <Button variante="fantasma" tamanho="sm" onClick={onImersivo} className="-mr-2">
          <Maximize2 aria-hidden />
          Modo imersivo
        </Button>
      </div>

      <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
        <Relogio timer={timer} tamanho={208} />

        <div className="w-full min-w-0 flex-1 space-y-4 text-center sm:text-left">
          <div>
            <p className="inline-flex max-w-full items-center gap-2 text-[15px] font-medium text-tinta">
              <DisciplinaIcon disciplina={timer.disciplina} className="size-4 shrink-0 text-texto-2" />
              <span className="truncate">{timer.disciplina}</span>
              <span className="shrink-0 font-normal text-texto-2">· {modo?.nome}</span>
            </p>
            {timer.meta ? (
              <p className="mt-1 text-[14px] leading-snug text-texto">{timer.meta}</p>
            ) : (
              <p className="mt-1 text-[13px] text-texto-2">{pausa ? "Hora de levantar e beber água." : "Uma coisa de cada vez."}</p>
            )}
          </div>

          <dl className="grid grid-cols-2 divide-x divide-borda rounded-xl border border-borda text-left">
            <div className="px-3.5 py-2.5">
              <dt className="text-[12px] text-texto-2">Ciclos concluídos</dt>
              <dd className="mt-0.5 text-[17px] font-semibold text-tinta tabular-nums">{timer.focoMin ? timer.ciclos : "—"}</dd>
            </div>
            <div className="px-3.5 py-2.5">
              <dt className="text-[12px] text-texto-2">Registrados</dt>
              <dd className="mt-0.5 text-[17px] font-semibold text-tinta tabular-nums">{formatarMinutos(timer.minutosRegistrados)}</dd>
            </div>
          </dl>

          <AnimatePresence mode="wait" initial={false}>
            {confirmar ? (
              <motion.div
                key="confirmar"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="rounded-xl border border-borda bg-superficie-2 p-3.5 text-left"
                role="alertdialog"
                aria-label="Confirmar encerramento"
              >
                <p className="text-[14px] font-medium text-tinta">Encerrar a sessão?</p>
                <p className="mt-0.5 text-[13px] leading-snug text-texto-2">
                  <ResumoEncerrar timer={timer} />
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button variante="secundario" onClick={() => setConfirmar(false)}>
                    Continuar
                  </Button>
                  <Button onClick={() => encerrarFoco()}>Encerrar e salvar</Button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="acoes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="flex gap-2">
                <Button variante={timer.pausado ? "primario" : "escuro"} tamanho="lg" onClick={timer.pausado ? retomarFoco : pausarFoco} className="min-w-0 flex-1">
                  {timer.pausado ? <Play className="fill-current" aria-hidden /> : <Pause className="fill-current" aria-hidden />}
                  {timer.pausado ? "Retomar" : "Pausar"}
                </Button>
                {pausa && (
                  <Button variante="secundario" tamanho="lg" onClick={pularPausa} className="min-w-0 flex-1">
                    <SkipForward aria-hidden />
                    Pular pausa
                  </Button>
                )}
                <Button
                  variante="secundario"
                  tamanho="lg"
                  onClick={() => setConfirmar(true)}
                  className={cn(pausa && "w-11 px-0")}
                  aria-label="Encerrar sessão"
                  title="Encerrar sessão"
                >
                  <Square className="size-3.5! fill-current" aria-hidden />
                  {!pausa && "Encerrar"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {sala && (
        <Link
          href={`/estudos/salas/${sala.id}`}
          className="mt-5 flex items-center gap-3 rounded-xl border border-borda px-3.5 py-2.5 transition-colors duration-150 hover:bg-superficie-2"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-superficie-2 text-texto-2">
            <Users className="size-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1 text-[13px]">
            <span className="block text-texto-2">Focando na sala</span>
            <span className="block truncate font-medium text-tinta">{sala.nome}</span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-texto-2" aria-hidden />
        </Link>
      )}

      <div className="mt-4 flex justify-center border-t border-borda pt-3 sm:justify-start">
        <BotaoDemo />
      </div>
    </motion.div>
  );
}

function FaseSelo({ timer }: { timer: TimerAtivo }) {
  const pausa = timer.fase === "pausa";
  const tom = timer.pausado ? "bg-superficie-2 text-texto-2 ring-1 ring-inset ring-borda" : pausa ? "bg-superficie-2 text-texto ring-1 ring-inset ring-borda" : "bg-verde-mclaro text-acento ring-1 ring-inset ring-verde-claro";
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[12px] font-medium", tom)}>
      {pausa && !timer.pausado ? (
        <Coffee className="size-3.5" aria-hidden />
      ) : (
        <span className={cn("size-1.5 rounded-full", timer.pausado ? "bg-texto-2/60" : "animate-pulso bg-verde")} aria-hidden />
      )}
      {timer.pausado ? "Pausado" : pausa ? "Pausa" : "Focando"}
      {timer.focoMin > 0 && <span className="text-texto-2">· ciclo {timer.ciclos + (pausa ? 0 : 1)}</span>}
    </span>
  );
}

/** Atalho de apresentação: faz o tempo passar para mostrar o fim de um ciclo em segundos. */
function BotaoDemo() {
  const demo = useModoApresentacao();
  if (!demo) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-1">
      <Button variante="fantasma" tamanho="sm" onClick={() => adiantarFoco(5)} title="Demonstração: faz o tempo do timer passar 5 minutos">
        <FastForward aria-hidden />
        Avançar 5 min (demo)
      </Button>
      <Button variante="fantasma" tamanho="sm" onClick={simularSaida} title="Demonstração: age como se a aba tivesse ficado oculta">
        <EyeOff aria-hidden />
        Simular saída da tela (demo)
      </Button>
    </div>
  );
}

/** Quanto será salvo ao encerrar — relógio próprio para não re-renderizar o card. */
function ResumoEncerrar({ timer }: { timer: TimerAtivo }) {
  const agora = useAgora(1000);
  const bloco = minutosCumpridos(timer, agora);
  const total = timer.minutosRegistrados + bloco;
  if (!total) return <>Blocos com menos de 1 minuto não contam — nada será registrado.</>;
  return (
    <>
      Serão salvos <b className="font-medium text-tinta">{formatarMinutos(total)}</b> de foco{bloco ? ", incluindo o bloco atual" : ""}.
    </>
  );
}

/* ───────────── Relógio (único trecho que atualiza a cada segundo) ───────────── */

function Relogio({ timer, tamanho }: { timer: TimerAtivo; tamanho: number }) {
  const agora = useAgora(1000);
  const l = lerTimer(timer, agora);
  const pausa = timer.fase === "pausa";
  const livre = l.restanteMs === null;
  const texto = formatarRelogio(l.restanteMs ?? l.decorridoMs);
  // No modo livre o anel dá uma volta por hora.
  const progresso = l.progresso ?? (l.decorridoMs % HORA) / HORA;

  return (
    <Anel
      progresso={progresso}
      tamanho={tamanho}
      espessura={Math.max(4, Math.round(tamanho / 48))}
      cor={pausa ? "var(--color-texto-2)" : "var(--color-verde)"}
      animar={false}
      rotulo={pausa ? "Tempo de pausa" : "Tempo de foco"}
      // Pausado: só o anel esmaece (o texto continua com contraste de 4,5 : 1 ou mais).
      className={cn("[&>svg]:transition-opacity [&>svg]:duration-200", timer.pausado && "[&>svg]:opacity-50")}
    >
      <span
        className={cn("block font-extralight leading-none tracking-[-0.04em] tabular-nums", timer.pausado ? "text-texto-2" : "text-tinta")}
        style={{ fontSize: Math.round(tamanho * (texto.length > 5 ? 0.17 : 0.24)) }}
      >
        {texto}
      </span>
      <span className="mt-2 block text-[13px] text-texto-2">{livre ? "decorrido" : pausa ? "de pausa" : "restantes"}</span>
    </Anel>
  );
}

/* ───────────── Modo imersivo: tela cheia, só o timer ───────────── */

function ModoImersivo({ timer, onSair }: { timer: TimerAtivo; onSair: () => void }) {
  // O relógio cresce até onde a tela deixa (projetor 1366×768 cabe o médio sem rolar).
  const largo = useMidia("(min-width: 640px) and (min-height: 640px)");
  const enorme = useMidia("(min-width: 640px) and (min-height: 860px)");
  const botaoSair = useRef<HTMLButtonElement>(null);
  const sair = useRef(onSair);
  const pausa = timer.fase === "pausa";

  useEffect(() => {
    sair.current = onSair;
  }, [onSair]);

  // Uma vez por abertura: trava a rolagem, foca o "Sair" e escuta Esc / saída da tela cheia.
  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    botaoSair.current?.focus({ preventScroll: true });
    let telaCheia = !!document.fullscreenElement;

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") sair.current();
    };
    // Na tela cheia nativa o navegador consome o Esc: quando ela termina, o modo imersivo fecha junto.
    const aoMudarTela = () => {
      if (document.fullscreenElement) telaCheia = true;
      else if (telaCheia) sair.current();
    };
    document.addEventListener("keydown", aoTeclar);
    document.addEventListener("fullscreenchange", aoMudarTela);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.removeEventListener("fullscreenchange", aoMudarTela);
      document.body.style.overflow = overflow;
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Modo imersivo do timer de foco"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 isolate z-[55] flex flex-col overflow-y-auto bg-fundo text-texto"
    >
      <header className="flex items-center justify-between gap-3 p-4 sm:p-6">
        <FaseSelo timer={timer} />
        <button
          ref={botaoSair}
          type="button"
          onClick={onSair}
          className="alvo-toque inline-flex h-9 items-center gap-2 rounded-lg border border-borda bg-superficie px-3.5 text-[13px] font-medium text-tinta transition-colors duration-150 hover:bg-superficie-2"
        >
          <Minimize2 className="size-4" aria-hidden />
          Sair
          <kbd className="hidden rounded border border-borda bg-superficie-2 px-1.5 py-px font-sans text-[11px] text-texto-2 sm:inline">Esc</kbd>
        </button>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="flex flex-1 flex-col items-center justify-center gap-7 px-6 pb-8 text-center"
      >
        <Relogio timer={timer} tamanho={enorme ? 400 : largo ? 330 : 272} />
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-2 text-[16px] font-medium text-tinta">
            <DisciplinaIcon disciplina={timer.disciplina} className="size-4.5 text-texto-2" />
            {timer.disciplina}
          </p>
          {timer.meta && <p className="mt-1.5 text-[18px] leading-snug text-texto sm:text-[20px]">{timer.meta}</p>}
        </div>
        <div className="flex items-center gap-3">
          {pausa && (
            <Button variante="secundario" tamanho="lg" onClick={pularPausa} className="rounded-full">
              <SkipForward aria-hidden />
              Pular pausa
            </Button>
          )}
          <button
            type="button"
            onClick={timer.pausado ? retomarFoco : pausarFoco}
            aria-label={timer.pausado ? "Retomar foco" : "Pausar foco"}
            className={cn(
              "grid size-14 place-items-center rounded-full transition-[background-color,opacity,transform] duration-150 active:scale-95",
              timer.pausado ? "bg-acao text-white hover:bg-acao-2" : "bg-tinta text-superficie hover:opacity-90",
            )}
          >
            {timer.pausado ? <Play className="size-5 fill-current" aria-hidden /> : <Pause className="size-5 fill-current" aria-hidden />}
          </button>
        </div>
      </motion.div>

      <footer className="flex justify-center pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <BotaoDemo />
      </footer>
    </motion.div>,
    document.body,
  );
}
