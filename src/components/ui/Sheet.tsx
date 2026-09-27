"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion, useDragControls, type PanInfo } from "motion/react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

interface Props {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
  rodape?: ReactNode;
  className?: string;
}

/**
 * Modal inferior (DS §13): aparece sobre a tela, fundo branco, cantos superiores
 * arredondados. Fecha no X, no fundo escurecido, com Esc ou arrastando para baixo.
 */
export function Sheet(props: Props) {
  if (typeof document === "undefined") return null;
  return createPortal(<AnimatePresence>{props.aberto && <SheetPainel {...props} />}</AnimatePresence>, document.body);
}

function SheetPainel({ onFechar, titulo, subtitulo, children, rodape, className }: Props) {
  const idTitulo = useId();
  const painel = useRef<HTMLDivElement>(null);
  const arrastar = useDragControls();
  const fechar = useRef(onFechar);

  useEffect(() => {
    fechar.current = onFechar;
  }, [onFechar]);

  // Roda uma vez por abertura: trava o scroll da página, foca o modal e escuta o Esc.
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    painel.current?.focus({ preventScroll: true });

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar.current();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflow;
      anterior?.focus?.({ preventScroll: true });
    };
  }, []);

  const aoSoltar = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 550) onFechar();
  };

  return (
    <div className="fixed inset-0 z-50">
      <motion.div
        className="absolute inset-0 bg-tinta/45 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
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
          "absolute inset-x-0 bottom-0 mx-auto flex max-h-[90dvh] w-full max-w-[480px] flex-col rounded-t-[28px] bg-white shadow-flutuante outline-none",
          className,
        )}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 420, damping: 40, mass: 0.9 }}
        drag="y"
        dragListener={false}
        dragControls={arrastar}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.04, bottom: 0.7 }}
        onDragEnd={aoSoltar}
      >
        <div
          className="shrink-0 cursor-grab touch-none active:cursor-grabbing"
          onPointerDown={(e) => arrastar.start(e)}
        >
          <div className="mx-auto mb-1 mt-2.5 h-1.5 w-10 rounded-full bg-verde-suave" />
          <div className="flex items-start gap-3 border-b border-borda px-5 pb-3.5 pt-2">
            <div className="min-w-0 flex-1">
              <h2 id={idTitulo} className="text-base font-bold text-tinta">
                {titulo}
              </h2>
              {subtitulo && <p className="mt-0.5 text-[13px] leading-snug text-texto-2">{subtitulo}</p>}
            </div>
            <button
              type="button"
              onClick={onFechar}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="Fechar"
              className="-mr-1.5 grid size-9 shrink-0 place-items-center rounded-full text-texto-2 transition-colors hover:bg-verde-mclaro hover:text-verde active:scale-90"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>

        {rodape && (
          <div className="safe-bottom shrink-0 border-t border-borda bg-white px-5 pt-3.5">
            <div className="flex gap-2.5 pb-3.5">{rodape}</div>
          </div>
        )}
        {!rodape && <div className="safe-bottom" />}
      </motion.div>
    </div>
  );
}
