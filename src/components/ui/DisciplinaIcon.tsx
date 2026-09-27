import { Atom, BookOpenText, Dna, Earth, FlaskConical, Landmark, Languages, Sigma, type LucideIcon } from "lucide-react";
import type { Disciplina } from "@/data/escola";

const ICONES: Record<Disciplina, LucideIcon> = {
  Matemática: Sigma,
  Biologia: Dna,
  História: Landmark,
  Português: BookOpenText,
  Química: FlaskConical,
  Física: Atom,
  Geografia: Earth,
  Inglês: Languages,
};

export function DisciplinaIcon({ disciplina, className }: { disciplina?: Disciplina; className?: string }) {
  const Icone = disciplina ? ICONES[disciplina] : BookOpenText;
  return <Icone className={className} aria-hidden />;
}
