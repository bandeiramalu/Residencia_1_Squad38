"use client";

import { Award, ChevronRight, Coins, Flame, Info, ShoppingBag, Sparkles, TrendingUp, TriangleAlert } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import { useRouter } from "next/navigation";
import { removerToast, useUI, type TipoToast } from "@/store/ui";
import { cn } from "@/lib/cn";

const ICONES: Record<TipoToast, { icone: typeof Info; cor: string }> = {
  ganho: { icone: Coins, cor: "text-acento" },
  xp: { icone: Sparkles, cor: "text-acento" },
  gasto: { icone: ShoppingBag, cor: "text-texto-2" },
  info: { icone: Info, cor: "text-texto-2" },
  sequencia: { icone: Flame, cor: "text-ambar" },
  alerta: { icone: TriangleAlert, cor: "text-alerta" },
  medalha: { icone: Award, cor: "text-ouro" },
  nivel: { icone: TrendingUp, cor: "text-acento" },
};

/**
 * Notificações empilhadas acima da barra inferior. Arraste para o lado para
 * dispensar; as que têm destino abrem a tela ao toque.
 */
export function Toaster() {
  const { toasts } = useUI();
  const router = useRouter();

  return (
    <div
      aria-live="polite"
      className="coluna-fixa pointer-events-none bottom-[calc(var(--base-inferior)+0.75rem)] z-[60] flex flex-col items-stretch gap-2 px-4 lg:items-end"
    >
      <AnimatePresence initial={false} mode="popLayout">
        {toasts.map((t) => {
          const { icone: Icone, cor } = ICONES[t.tipo];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 48, transition: { duration: 0.16 } }}
              transition={{ type: "spring", stiffness: 420, damping: 41 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(_, info) => {
                if (Math.abs(info.offset.x) > 80) removerToast(t.id);
              }}
              onTap={() => {
                if (!t.href) return;
                removerToast(t.id);
                router.push(t.href);
              }}
              className={cn(
                "pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-borda bg-superficie p-3 shadow-flutuante lg:max-w-[380px]",
                t.href ? "cursor-pointer" : "cursor-grab active:cursor-grabbing",
              )}
              role="status"
            >
              <span className={cn("grid size-8 shrink-0 place-items-center rounded-full bg-superficie-2", cor)}>
                <Icone className="size-[18px]" />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-medium leading-tight text-tinta">{t.titulo}</p>
                {t.mensagem && <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-texto-2">{t.mensagem}</p>}
              </div>
              {t.href && <ChevronRight className="mt-2 size-4 shrink-0 text-texto-2" />}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
