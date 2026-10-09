"use client";

import { FastForward, Pause, Play, TimerOff } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Anel } from "@/components/ui/Anel";
import { Button } from "@/components/ui/Button";
import { useAgora } from "@/hooks/useAgora";
import { useModoApresentacao } from "@/lib/apresentacao";
import { formatarRelogio, LIMITE_SAIDA_MS, lerTimer, MIN, restanteDaSaidaMs } from "@/lib/estudos";
import { avisarFaltaUmMinuto, dispensarFocoPerdido, pausarFoco, pularSaidaDemo, recomecarFoco, registrarSaida, retomarFoco, retomarSeRecarregou, tickFoco, verificarSalasAgendadas } from "@/store/actions";
import { useSeletor } from "@/store/store";

/**
 * Motor do timer: enquanto houver foco em andamento, avança as fases a cada segundo
 * (em qualquer tela) e mostra o tempo no título da aba. Não renderiza nada.
 */
export function MotorEstudos() {
  const timer = useSeletor((e) => e.estudos.timer);
  const saiuEm = timer?.saiuEm;
  const ativo = !!timer && (!timer.pausado || !!saiuEm);
  const comTimer = !!timer;

  // Salas agendadas abrem sozinhas; com lembrete ativo, avisa na abertura.
  useEffect(() => {
    verificarSalasAgendadas();
    const id = setInterval(verificarSalasAgendadas, 10_000);
    return () => clearInterval(id);
  }, []);

  // F5 com o foco rodando: o `pagehide` congelou o timer; recarregar a página retoma sem a contagem de saída.
  useEffect(() => {
    retomarSeRecarregou();
  }, []);

  // Saiu da tela com o foco rodando: congela no instante da saída (a ação ignora pausa manual e intervalo).
  useEffect(() => {
    if (!comTimer) return;
    const aoSair = () => registrarSaida();
    const aoOcultar = () => document.visibilityState === "hidden" && registrarSaida();
    document.addEventListener("visibilitychange", aoOcultar);
    window.addEventListener("pagehide", aoSair);
    return () => {
      document.removeEventListener("visibilitychange", aoOcultar);
      window.removeEventListener("pagehide", aoSair);
    };
  }, [comTimer]);

  // Aviso de "falta 1 min" e perda aos 5 min (setTimeout pode atrasar em aba oculta; o tick resolve ao voltar).
  useEffect(() => {
    if (!saiuEm) return;
    const aviso = setTimeout(avisarFaltaUmMinuto, Math.max(0, saiuEm + LIMITE_SAIDA_MS - MIN - Date.now()));
    const perda = setTimeout(() => tickFoco(), Math.max(0, saiuEm + LIMITE_SAIDA_MS - Date.now()) + 50);
    return () => {
      clearTimeout(aviso);
      clearTimeout(perda);
    };
  }, [saiuEm]);

  useEffect(() => {
    if (!ativo) return;
    tickFoco();
    const id = setInterval(() => tickFoco(), 1000);
    // Ao voltar para a aba, alcança o tempo que passou em segundo plano.
    const aoVoltar = () => document.visibilityState === "visible" && tickFoco();
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [ativo]);

  return timer ? <TituloDaAba /> : null;
}

/** Prefixo que o timer põe no título da aba ("⏱ 12:34 · "). */
const PREFIXO_TITULO = /^[⏸⏱☕] [^·]+· /;

/**
 * Mostra o tempo no título da aba. A cada segundo parte do título ATUAL sem o prefixo: quando a aluna
 * troca de tela, o título novo da página é preservado. O título original só é restaurado quando o timer acaba.
 */
function TituloDaAba() {
  const timer = useSeletor((e) => e.estudos.timer);
  const agora = useAgora(1000);

  useEffect(() => {
    if (!timer) return;
    const base = document.title.replace(PREFIXO_TITULO, "");
    const l = lerTimer(timer, agora);
    const tempo = formatarRelogio(l.restanteMs ?? l.decorridoMs);
    const icone = timer.pausado ? "⏸" : timer.fase === "pausa" ? "☕" : "⏱";
    const novo = `${icone} ${tempo} · ${base}`;
    if (document.title !== novo) document.title = novo;
  }, [timer, agora]);

  // Sem timer (acabou ou foi encerrado), este componente sai de cena: tira o prefixo do título que estiver na aba.
  useEffect(
    () => () => {
      document.title = document.title.replace(PREFIXO_TITULO, "");
    },
    [],
  );

  return null;
}

/**
 * Pílula flutuante: o foco continua visível em qualquer tela.
 * Toque para voltar à Sala de Estudos.
 */
export function FocoAoVivo() {
  const timer = useSeletor((e) => e.estudos.timer);
  const caminho = usePathname();
  const destino = timer?.salaId ? `/estudos/salas/${timer.salaId}` : "/estudos";
  const visivel = !!timer && !timer.saiuEm && caminho !== destino && !caminho.startsWith("/login");

  return (
    <>
      <AvisoSaida />
      <div className="coluna-fixa pointer-events-none bottom-[calc(var(--base-inferior)+0.75rem)] z-30 flex px-4 sm:px-6 lg:px-8">
      <AnimatePresence>{visivel && timer && <Pilula destino={destino} />}</AnimatePresence>
    </div>
    </>
  );
}

function fmt(ms: number) {
  return formatarRelogio(ms);
}

/**
 * Aviso global da regra de saída da tela: foco pausado com a contagem dos 5 min,
 * ou foco perdido. Fica acima de tudo para a aluna entender na hora o que fazer.
 */
function AvisoSaida() {
  const saiuEm = useSeletor((e) => e.estudos.timer?.saiuEm);
  const perdido = useSeletor((e) => e.estudos.focoPerdido ?? null);
  const caminho = usePathname();
  if (caminho.startsWith("/login")) return null;
  return (
    <AnimatePresence>
      {saiuEm ? <CartaoSaida key={saiuEm} saiuEm={saiuEm} /> : perdido ? <CartaoPerdido key="perdido" /> : null}
    </AnimatePresence>
  );
}

const CARTAO = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 16 },
  transition: { duration: 0.2, ease: [0.2, 0, 0, 1] },
} as const;

function Moldura({ children, rotulo }: { children: React.ReactNode; rotulo: string }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <motion.div
        {...CARTAO}
        role="alertdialog"
        aria-label={rotulo}
        className="pointer-events-auto w-full max-w-md rounded-2xl border border-borda bg-superficie p-5 shadow-flutuante"
      >
        {children}
      </motion.div>
    </div>
  );
}

function CartaoSaida({ saiuEm }: { saiuEm: number }) {
  const demo = useModoApresentacao();
  const agora = useAgora(1000);
  // "Saiu por" congela no instante em que a aluna voltou à tela.
  const [voltouEm, setVoltouEm] = useState<number | null>(() => (typeof document === "undefined" || document.visibilityState === "hidden" ? null : Date.now()));
  useEffect(() => {
    const aoVoltar = () => document.visibilityState === "visible" && setVoltouEm((v) => v ?? Date.now());
    document.addEventListener("visibilitychange", aoVoltar);
    return () => document.removeEventListener("visibilitychange", aoVoltar);
  }, []);
  const restante = restanteDaSaidaMs(saiuEm, agora);
  const saiuPor = Math.min(agora, voltouEm ?? agora) - saiuEm;

  return (
    <Moldura rotulo="Foco pausado">
      <p className="text-[16px] font-semibold text-tinta">Você saiu por {fmt(Math.max(0, saiuPor))}</p>
      <p className="mt-0.5 text-[14px] text-texto-2">Seu foco está pausado. Retome em até</p>
      <p className="mt-2 text-[40px] font-extralight leading-none tracking-[-0.04em] text-tinta tabular-nums" aria-live="off">
        {fmt(restante)}
      </p>
      <Button tamanho="lg" bloco onClick={retomarFoco} className="mt-4 h-12">
        <Play className="fill-current" aria-hidden />
        Retomar foco
      </Button>
      {demo && (
        <Button variante="fantasma" tamanho="sm" onClick={pularSaidaDemo} className="mt-2 w-full" title="Demonstração: faz passar 5 minutos fora da tela">
          <FastForward aria-hidden />
          Pular 5 min (demo)
        </Button>
      )}
    </Moldura>
  );
}

function CartaoPerdido() {
  return (
    <Moldura rotulo="Foco perdido">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-superficie-2 text-texto-2">
          <TimerOff className="size-4.5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[16px] font-semibold text-tinta">Foco perdido</p>
          <p className="mt-0.5 text-[14px] leading-snug text-texto-2">Você ficou mais de 5 min fora. Esse ciclo não conta, mas sua sequência de dias continua.</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variante="secundario" onClick={dispensarFocoPerdido}>
          Agora não
        </Button>
        <Button onClick={recomecarFoco}>Começar de novo</Button>
      </div>
    </Moldura>
  );
}

function Pilula({ destino }: { destino: string }) {
  const timer = useSeletor((e) => e.estudos.timer)!;
  const agora = useAgora(1000);
  const l = lerTimer(timer, agora);
  const pausa = timer.fase === "pausa";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.18 }}
      className="pointer-events-auto flex items-center gap-1 rounded-full border border-borda bg-superficie py-1 pl-1 pr-1 shadow-flutuante"
    >
      <Link href={destino} className="flex items-center gap-2.5 pr-1" aria-label="Abrir o timer de foco">
        <Anel progresso={l.progresso ?? (l.decorridoMs % 3_600_000) / 3_600_000} tamanho={32} espessura={3} cor={pausa ? "var(--color-texto-2)" : "var(--color-verde)"} animar={false}>
          <span className={`block size-1.5 rounded-full ${timer.pausado ? "bg-texto-2/50" : pausa ? "bg-texto-2" : "animate-pulso bg-verde"}`} />
        </Anel>
        <span className="leading-tight">
          <span className="block font-mono text-[14px] font-medium tabular-nums text-tinta">{formatarRelogio(l.restanteMs ?? l.decorridoMs)}</span>
          <span className="block max-w-[9.5rem] truncate text-[11px] text-texto-2">
            {timer.pausado ? "Pausado" : pausa ? "Pausa" : "Foco"} · {timer.disciplina}
          </span>
        </span>
      </Link>
      <button
        type="button"
        onClick={timer.pausado ? retomarFoco : pausarFoco}
        aria-label={timer.pausado ? "Retomar foco" : "Pausar foco"}
        className="alvo-toque grid size-8 place-items-center rounded-full text-texto transition-colors hover:bg-superficie-2 active:scale-95"
      >
        {timer.pausado ? <Play className="size-3.5 fill-current" /> : <Pause className="size-3.5 fill-current" />}
      </button>
    </motion.div>
  );
}
