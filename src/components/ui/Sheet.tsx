"use client";

import { X } from "lucide-react";
import { AnimatePresence, m as motion, useDragControls, useMotionValue, useTransform, type PanInfo } from "motion/react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { DESKTOP, useMidia } from "@/hooks/useMidia";
import { cn } from "@/lib/cn";

interface Props {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
  rodape?: ReactNode;
  className?: string;
  /** Largura no desktop: "md" (560 px, padrão) ou "lg" (760 px, formulários grandes). */
  largura?: "md" | "lg";
}

/**
 * Modal do DS §13. No celular é um modal inferior (bottom sheet) que fecha arrastando
 * para baixo; no desktop vira um diálogo centralizado. Fecha no X, no fundo e com Esc.
 */
export function Sheet(props: Props) {
  if (typeof document === "undefined") return null;
  return createPortal(<AnimatePresence>{props.aberto && <SheetPainel {...props} />}</AnimatePresence>, document.body);
}

/**
 * Contador de modais abertos: com dois modais trocando no mesmo clique (um fecha
 * enquanto o outro abre), a rolagem só volta quando o último fechar.
 */
let modaisAbertos = 0;

function travarRolagem() {
  if (modaisAbertos++ === 0) document.body.style.overflow = "hidden";
}

function liberarRolagem() {
  modaisAbertos = Math.max(0, modaisAbertos - 1);
  if (modaisAbertos === 0) document.body.style.overflow = "";
}

/** Quantos modais mantêm cada elemento da página inerte (sheets empilhadas). */
const inertizados = new Map<Element, number>();

/** Deixa inerte tudo no body, exceto o modal `raiz`; devolve a função que desfaz. */
function inertizarFundo(raiz: Element) {
  const alvos = Array.from(document.body.children).filter((el) => el !== raiz && !el.contains(raiz) && el.tagName !== "SCRIPT");
  for (const el of alvos) {
    const n = inertizados.get(el) ?? 0;
    if (n === 0) el.setAttribute("inert", "");
    inertizados.set(el, n + 1);
  }
  return () => {
    for (const el of alvos) {
      const n = (inertizados.get(el) ?? 1) - 1;
      if (n <= 0) {
        inertizados.delete(el);
        el.removeAttribute("inert");
      } else inertizados.set(el, n);
    }
  };
}

const FOCAVEL = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function SheetPainel({ onFechar, titulo, subtitulo, children, rodape, className, largura = "md" }: Props) {
  const idTitulo = useId();
  const painel = useRef<HTMLDivElement>(null);
  const arrastar = useDragControls();
  const fechar = useRef(onFechar);
  const desktop = useMidia(DESKTOP);
  const arrasto = useMotionValue(0);
  const opacidadeFundo = useTransform(arrasto, [0, 320], [1, 0.15]);

  useEffect(() => {
    fechar.current = onFechar;
  }, [onFechar]);

  // Roda uma vez por abertura: trava o scroll da página, foca o modal e escuta o Esc.
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    travarRolagem();
    const raiz = painel.current?.parentElement;
    const desinertizar = raiz ? inertizarFundo(raiz) : undefined;
    painel.current?.focus({ preventScroll: true });

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar.current();
      if (e.key !== "Tab" || !painel.current) return;
      // Laço de Tab dentro do painel (só o modal do topo, o que contém o foco).
      const el = painel.current;
      const ativo = document.activeElement;
      if (ativo && !el.contains(ativo)) return;
      const itens = Array.from(el.querySelectorAll<HTMLElement>(FOCAVEL)).filter((i) => i.offsetParent !== null);
      if (itens.length === 0) {
        e.preventDefault();
        return;
      }
      const primeiro = itens[0];
      const ultimo = itens[itens.length - 1];
      if (e.shiftKey && (ativo === primeiro || ativo === el)) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && ativo === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    };
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      desinertizar?.();
      liberarRolagem();
      anterior?.focus?.({ preventScroll: true });
    };
  }, []);

  const aoSoltar = (_: unknown, info: PanInfo) => {
    // Projeta onde o painel pararia com a velocidade do dedo: arrasto rápido fecha, curto volta.
    const projetado = info.offset.y + info.velocity.y * 0.2;
    const altura = painel.current?.offsetHeight ?? 400;
    if (projetado > Math.min(160, altura * 0.35)) onFechar();
    else arrasto.set(0);
  };

  const animacao = desktop
    ? { initial: { opacity: 0, scale: 0.96, y: 14 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.97, y: 8 } }
    : { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } };

  return (
    <div className={cn("fixed inset-0 z-50", desktop && "grid place-items-center p-6")}>
      <motion.div
        className="absolute inset-0 bg-slate-950/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
        style={desktop ? undefined : { opacity: opacidadeFundo }}
        onClick={onFechar}
        aria-hidden
      />
      <motion.div
        ref={painel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        className={cn(
          "flex w-full flex-col border-borda bg-superficie shadow-flutuante outline-none will-change-transform",
          desktop
            ? cn("relative max-h-[86dvh] rounded-2xl border", largura === "lg" ? "max-w-[760px]" : "max-w-[560px]")
            : "absolute inset-x-0 bottom-0 mx-auto max-h-[92dvh] max-w-[640px] rounded-t-2xl border-t",
          className,
        )}
        {...animacao}
        transition={desktop ? { type: "spring", stiffness: 520, damping: 46, mass: 1 } : { type: "spring", stiffness: 420, damping: 41, mass: 1 }}
        drag={desktop ? false : "y"}
        dragListener={false}
        dragControls={arrastar}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.02, bottom: 0.6 }}
        dragMomentum={false}
        onDrag={(_, info) => arrasto.set(Math.max(0, info.offset.y))}
        onDragEnd={aoSoltar}
      >
        <div className={cn("shrink-0", !desktop && "cursor-grab touch-none active:cursor-grabbing")} onPointerDown={(e) => !desktop && arrastar.start(e)}>
          {!desktop && <div className="mx-auto mb-1 mt-2.5 h-1 w-9 rounded-full bg-borda" />}
          <div className={cn("flex items-start gap-3 border-b border-borda px-5 pb-3.5", desktop ? "pt-5" : "pt-2")}>
            <div className="min-w-0 flex-1">
              <h2 id={idTitulo} className="text-base font-semibold text-tinta">
                {titulo}
              </h2>
              {subtitulo && <p className="mt-0.5 text-[13px] leading-snug text-texto-2">{subtitulo}</p>}
            </div>
            <button
              type="button"
              onClick={onFechar}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="Fechar"
              className="-mr-1.5 grid size-9 shrink-0 place-items-center rounded-full text-texto-2 transition-colors hover:bg-verde-mclaro hover:text-acento active:scale-90 touch-manipulation"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>

        {rodape && (
          <div className="safe-bottom shrink-0 border-t border-borda bg-superficie px-5 pt-3.5">
            <div className="flex gap-2.5 pb-3.5">{rodape}</div>
          </div>
        )}
        {!rodape && <div className="safe-bottom" />}
      </motion.div>
    </div>
  );
}
