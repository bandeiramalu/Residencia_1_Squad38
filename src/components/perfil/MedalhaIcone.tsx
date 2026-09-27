import { Brain, Crown, FlaskConical, Flame, Lightbulb, Megaphone, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import type { IconeMedalha } from "@/data/medalhas";

const ICONES: Record<IconeMedalha, LucideIcon> = {
  users: Users,
  flask: FlaskConical,
  flame: Flame,
  shield: ShieldCheck,
  lightbulb: Lightbulb,
  brain: Brain,
  megaphone: Megaphone,
  crown: Crown,
};

export function MedalhaIcone({ icone, className }: { icone: IconeMedalha; className?: string }) {
  const Icone = ICONES[icone];
  return <Icone className={className} aria-hidden />;
}
