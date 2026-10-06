"use client";

import { AnimatePresence, m as motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useSeletor } from "@/store/store";

/** A partir desta largura o ranking ganha a coluna lateral (300 px). */
export const LARGO = "(min-width: 1280px)";

/**
 * Observa a "sua" linha da tabela. Devolve `observar` (ref da linha), se ela está fora da tela
 * e como rolar até ela. `chave` identifica a lista atual: ao trocar de filtro o pino some
 * até o observador confirmar onde a nova linha está (sem "piscar").
 */
export function useLinhaForaDaTela<T extends HTMLElement>(chave: string) {
  const [alvo, setAlvo] = useState<T | null>(null);
  const [fora, setFora] = useState<string | null>(null);

  useEffect(() => {
    if (!alvo) return;
    const obs = new IntersectionObserver(([e]) => setFora(e.isIntersecting ? null : chave), { rootMargin: "-64px 0px -96px 0px" });
    obs.observe(alvo);
    return () => obs.disconnect();
  }, [alvo, chave]);

  const rolar = () => alvo?.scrollIntoView({ behavior: "smooth", block: "center" });
  return { observar: setAlvo, fora: !!alvo && fora === chave, rolar };
}

/**
 * Pino flutuante com a sua posição quando a sua linha sai da tela. Alinhado à coluna
 * da lista (em telas largas desconta a coluna lateral) e sobe se a pílula de foco estiver visível.
 */
export function PinoPosicao({ visivel, sombra, onClick, rotulo, children }: { visivel: boolean; sombra?: boolean; onClick: () => void; rotulo: string; children: ReactNode }) {
  const comFoco = useSeletor((e) => e.estudos.timer !== null);
  return (
    <div
      className={cn(
        "coluna-fixa pointer-events-none z-30 px-4 transition-[bottom] duration-200 ease-suave sm:px-6 lg:px-8",
        comFoco ? "bottom-[calc(var(--base-inferior)+4.5rem)]" : "bottom-[calc(var(--base-inferior)+0.75rem)]",
      )}
    >
      <div className="xl:pr-[calc(300px+1.5rem)]">
        <AnimatePresence>
          {visivel && (
            <motion.button
              type="button"
              onClick={onClick}
              aria-label={rotulo}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
              className={cn(
                "pointer-events-auto flex w-full items-center gap-2.5 rounded-xl border bg-superficie px-3 py-2.5 text-left shadow-flutuante transition-colors hover:bg-superficie-2 sm:gap-3 sm:px-4",
                sombra ? "border-dashed border-texto-2/40" : "border-borda",
              )}
            >
              {children}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
