"use client";

import { Award, Coins, Flame, Info, ShoppingBag, Sparkles, TrendingUp, TriangleAlert } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { removerToast, useUI, type TipoToast } from "@/store/ui";
import { cn } from "@/lib/cn";

const ICONES: Record<TipoToast, { icone: typeof Info; cor: string }> = {
  ganho: { icone: Coins, cor: "bg-verde-claro text-verde" },
  xp: { icone: Sparkles, cor: "bg-verde-claro text-verde" },
  gasto: { icone: ShoppingBag, cor: "bg-verde-claro text-verde" },
  info: { icone: Info, cor: "bg-verde-mclaro text-verde-2" },
  sequencia: { icone: Flame, cor: "bg-amber-50 text-ambar" },
  alerta: { icone: TriangleAlert, cor: "bg-red-50 text-alerta" },
  medalha: { icone: Award, cor: "bg-verde text-white" },
  nivel: { icone: TrendingUp, cor: "bg-verde text-white" },
};

/** Notificações empilhadas acima da barra inferior. Arraste para o lado para dispensar. */
export function Toaster() {
  const { toasts } = useUI();
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[60] mx-auto flex w-full max-w-[480px] flex-col items-stretch gap-2 px-4"
    >
      <AnimatePresence initial={false} mode="popLayout">
        {toasts.map((t) => {
          const { icone: Icone, cor } = ICONES[t.tipo];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.96, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 480, damping: 34 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(_, info) => {
                if (Math.abs(info.offset.x) > 80) removerToast(t.id);
              }}
              className="pointer-events-auto flex cursor-grab items-start gap-3 rounded-2xl border border-borda bg-white/95 p-3 shadow-flutuante backdrop-blur active:cursor-grabbing"
              role="status"
            >
              <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", cor)}>
                <Icone className="size-[18px]" />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-bold leading-tight text-tinta">{t.titulo}</p>
                {t.mensagem && <p className="mt-0.5 text-[13px] leading-snug text-texto-2">{t.mensagem}</p>}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
