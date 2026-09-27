import {
  Bot,
  CupSoda,
  FaceGrinning,
  Gem,
  Leaf,
  Music,
  NotebookPen,
  Palette,
  Shirt,
  Sprout,
  Sticker,
  Tag,
  Trees,
  Type,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import type { TomBadge } from "@/components/ui/Badge";
import type { IconeItem, Raridade } from "@/data/loja";
import { cn } from "@/lib/cn";

export const ICONES_ITEM: Record<IconeItem, LucideIcon> = {
  leaf: Leaf,
  palette: Palette,
  sticker: Sticker,
  gem: Gem,
  sprout: Sprout,
  tag: Tag,
  trees: Trees,
  notebook: NotebookPen,
  type: Type,
  grin: FaceGrinning,
  utensils: Utensils,
  cup: CupSoda,
  music: Music,
  shirt: Shirt,
  bot: Bot,
};

/** Quanto maior a raridade, maior o destaque visual (DS §12). */
export const ESTILO_RARIDADE: Record<Raridade, { fundo: string; badge: TomBadge; card: string; estrelas: number }> = {
  Comum: { fundo: "bg-verde-mclaro text-verde", badge: "neutro", card: "border-borda", estrelas: 1 },
  Incomum: { fundo: "bg-linear-to-br from-verde-claro to-verde-suave text-verde", badge: "claro", card: "border-borda", estrelas: 2 },
  Raro: { fundo: "bg-linear-to-br from-verde-2 to-verde text-white", badge: "verde", card: "border-verde-2/40", estrelas: 3 },
  Especial: { fundo: "bg-linear-to-br from-verde to-tinta text-white", badge: "escuro", card: "border-verde/50 ring-1 ring-verde/10", estrelas: 4 },
  Exclusivo: {
    fundo: "bg-linear-to-br from-tinta via-verde to-cepi text-amber-200",
    badge: "ambar",
    card: "border-amber-300 ring-2 ring-amber-200/60",
    estrelas: 5,
  },
};

export function ItemVisual({ icone, raridade, className, tamanhoIcone = "size-10" }: { icone: IconeItem; raridade: Raridade; className?: string; tamanhoIcone?: string }) {
  const Icone = ICONES_ITEM[icone];
  const brilha = raridade === "Especial" || raridade === "Exclusivo";
  return (
    <div className={cn("relative grid place-items-center overflow-hidden", ESTILO_RARIDADE[raridade].fundo, className)}>
      {brilha && (
        <span className="absolute inset-0 animate-shimmer bg-[linear-gradient(110deg,transparent_30%,rgb(255_255_255/0.28)_50%,transparent_70%)] bg-[length:200%_100%]" />
      )}
      <Icone className={cn("relative drop-shadow-sm", tamanhoIcone)} strokeWidth={1.8} />
    </div>
  );
}
