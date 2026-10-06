import {
  Bot,
  CupSoda,
  BadgeCheck,
  BookOpen,
  CircleDot,
  ImageIcon,
  Star,
  Gem,
  Music,
  NotebookPen,
  Palette,
  Shirt,
  Tag,
  Type,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import type { TomBadge } from "@/components/ui/Badge";
import type { IconeItem, ItemLoja, Raridade, Slot } from "@/data/loja";
import { cn } from "@/lib/cn";

export const ICONES_ITEM: Record<IconeItem, LucideIcon> = {
  leaf: CircleDot,
  palette: Palette,
  sticker: BookOpen,
  gem: Gem,
  sprout: Star,
  tag: Tag,
  trees: ImageIcon,
  notebook: NotebookPen,
  type: Type,
  grin: BadgeCheck,
  utensils: Utensils,
  cup: CupSoda,
  music: Music,
  shirt: Shirt,
  bot: Bot,
};

/** Onde o item aparece no perfil — ou "Voucher", para retirar na escola. */
export const ROTULO_SLOT: Record<Slot, string> = {
  moldura: "Moldura",
  fundo: "Fundo",
  adesivo: "Selo",
  efeito: "Moldura",
  animado: "Selo",
  placa: "Placa",
  tema: "Capa",
  capa: "Capa",
  fonte: "Fonte",
  figurinhas: "Selos",
  voucher: "Voucher",
};

/**
 * Raridade vira só texto pequeno (sem degradês nem estrelas). O tom do Badge fica
 * disponível para quem quiser uma etiqueta; o destaque dourado é reservado ao Exclusivo.
 */
export const ESTILO_RARIDADE: Record<Raridade, { badge: TomBadge; texto: string }> = {
  Comum: { badge: "neutro", texto: "text-texto-2" },
  Incomum: { badge: "neutro", texto: "text-texto-2" },
  Raro: { badge: "contorno", texto: "text-texto" },
  Especial: { badge: "contorno", texto: "text-texto" },
  Exclusivo: { badge: "ouro", texto: "text-ouro" },
};

const SLOTS_AVATAR = new Set<Slot>(["moldura", "fundo", "adesivo", "efeito", "animado"]);

/** Ícone do item num quadro neutro (histórico de trocas, perfil). */
export function ItemVisual({ icone, raridade, className, tamanhoIcone = "size-10" }: { icone: IconeItem; raridade: Raridade; className?: string; tamanhoIcone?: string }) {
  const Icone = ICONES_ITEM[icone];
  return (
    <div data-raridade={raridade} className={cn("grid place-items-center bg-superficie-2 text-texto-2 ring-1 ring-inset ring-borda", className)}>
      <Icone className={tamanhoIcone} strokeWidth={1.75} aria-hidden />
    </div>
  );
}

/**
 * Prévia do que o item faz de verdade: itens de avatar aparecem no avatar da aluna
 * (anel, fundo, selo), itens de perfil mostram a capa/placa/fonte e vouchers, o ícone.
 */
export function PreviaItem({ item, nome, compacta }: { item: ItemLoja; nome: string; compacta?: boolean }) {
  if (SLOTS_AVATAR.has(item.slot)) return <Avatar nome={nome} tamanho={compacta ? "lg" : "xl"} equipados={[item.id]} />;

  switch (item.slot) {
    case "placa":
      return (
        <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-blue-50 font-medium text-cepi", compacta ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-[13px]")}>
          <Tag className={compacta ? "size-3" : "size-3.5"} aria-hidden /> Turma 9º A
        </span>
      );
    case "tema":
    case "capa":
      return (
        <span
          className={cn(
            "relative block overflow-hidden rounded-lg border border-borda bg-superficie",
            compacta ? "h-11 w-16" : "h-16 w-28",
          )}
          aria-hidden
        >
          <span className={cn("absolute inset-x-0 top-0", compacta ? "h-6" : "h-9", item.slot === "tema" ? "tema-bosque" : "capa-pautada")} />
          <span className={cn("absolute rounded-full bg-superficie-2 ring-2 ring-superficie", compacta ? "left-1.5 top-3.5 size-5" : "left-2.5 top-5 size-8")} />
        </span>
      );
    case "fonte":
      return <span className={cn("font-manuscrita leading-none text-tinta", compacta ? "text-[22px]" : "text-[32px]")}>{nome.split(" ")[0]}</span>;
    case "figurinhas":
      return (
        <span className="flex -space-x-1.5" aria-hidden>
          {[BadgeCheck, Star, BookOpen].map((Icone, i) => (
            <span key={i} className={cn("grid place-items-center rounded-full bg-superficie text-texto-2 ring-1 ring-borda", compacta ? "size-7" : "size-10")}>
              <Icone className={compacta ? "size-3.5" : "size-[18px]"} strokeWidth={1.75} />
            </span>
          ))}
        </span>
      );
    default: {
      const Icone = ICONES_ITEM[item.icone];
      return (
        <span className={cn("grid place-items-center rounded-full bg-superficie text-texto-2 ring-1 ring-borda", compacta ? "size-11" : "size-14")} aria-hidden>
          <Icone className={compacta ? "size-5" : "size-6"} strokeWidth={1.75} />
        </span>
      );
    }
  }
}
