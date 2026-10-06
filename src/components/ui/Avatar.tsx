import { BookOpen, Star } from "lucide-react";
import { itemPorId, type Slot } from "@/data/loja";
import { cn } from "@/lib/cn";
import { useSeletor } from "@/store/store";

type Tamanho = "xs" | "sm" | "md" | "lg" | "xl";

const TAMANHOS: Record<Tamanho, { caixa: string; texto: string; selo: string }> = {
  xs: { caixa: "size-6", texto: "text-[9px]", selo: "size-3 [&_svg]:size-2" },
  sm: { caixa: "size-8", texto: "text-[11px]", selo: "size-3.5 [&_svg]:size-2" },
  md: { caixa: "size-10", texto: "text-[13px]", selo: "size-4 [&_svg]:size-2.5" },
  lg: { caixa: "size-14", texto: "text-base", selo: "size-5 [&_svg]:size-3" },
  xl: { caixa: "size-20", texto: "text-2xl", selo: "size-6 [&_svg]:size-3.5" },
};

/** Tons suaves por pessoa (como em redes sociais): a cor ajuda a reconhecer quem é. */
const TONS = [
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300",
  "bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-300",
  "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
  "bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-300",
  "bg-violet-100 text-violet-800 dark:bg-violet-400/15 dark:text-violet-300",
  "bg-slate-200 text-slate-700 dark:bg-slate-400/15 dark:text-slate-300",
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Iniciais dos dois primeiros nomes: "Ana Beatriz Moura" → "AB", "Lucas Ferreira" → "LF". */
export function iniciaisDe(nome: string) {
  const partes = nome.replace(/^(Prof\.|Profª\.|Teacher)\s+/, "").split(" ").filter(Boolean);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase();
}

interface Props {
  nome: string;
  iniciais?: string;
  tamanho?: Tamanho;
  /** Itens da Loja equipados (só para o avatar da própria aluna). */
  equipados?: string[];
  ativo?: boolean;
  /** Foto (dataURL ou URL): substitui as iniciais, mantendo anel e selos. */
  foto?: string;
  className?: string;
}

export function Avatar({ nome, iniciais, tamanho = "md", equipados = [], ativo, foto, className }: Props) {
  // A foto que a aluna escolheu em "Editar perfil" aparece em todo lugar onde o nome dela aparece (inclusive para o professor).
  const fotoDoUsuario = useSeletor((e) => (e.usuario.nome === nome ? e.usuario.foto : undefined));
  foto = foto ?? fotoDoUsuario;
  const t = TAMANHOS[tamanho];
  const slots = new Set<Slot>(equipados.map((id) => itemPorId(id)?.slot).filter((s): s is Slot => !!s));
  const tom = slots.has("fundo") ? "bg-verde text-white" : TONS[hash(nome) % TONS.length];
  const anel = slots.has("efeito") ? "ring-2 ring-ouro" : slots.has("moldura") || ativo ? "ring-2 ring-verde" : "";

  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full font-semibold tracking-tight",
          t.caixa,
          t.texto,
          tom,
          anel && cn(anel, "ring-offset-2 ring-offset-superficie"),
        )}
        aria-hidden
      >
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element -- dataURL local, sem otimização possível
          <img src={foto} alt="" draggable={false} className="size-full rounded-full object-cover" />
        ) : (
          (iniciais ?? iniciaisDe(nome))
        )}
      </span>

      {slots.has("adesivo") && (
        <span className={cn("absolute -bottom-0.5 -right-0.5 grid place-items-center rounded-full bg-superficie text-acento ring-1 ring-borda", t.selo)} aria-hidden>
          <BookOpen strokeWidth={2.5} />
        </span>
      )}

      {slots.has("animado") && (
        <span className={cn("absolute -right-0.5 -top-0.5 grid place-items-center rounded-full bg-ouro text-white ring-2 ring-superficie", t.selo)} aria-hidden>
          <Star className="fill-current" />
        </span>
      )}
      <span className="sr-only">{nome}</span>
    </span>
  );
}
