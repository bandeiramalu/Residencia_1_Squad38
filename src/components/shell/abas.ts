import { House, ShoppingBag, Target, Trophy, User, type LucideIcon } from "lucide-react";

export interface Aba {
  href: string;
  rotulo: string;
  icone: LucideIcon;
}

/** As 5 abas da barra inferior fixa (documento "Navegação e fluxos"). */
export const ABAS: Aba[] = [
  { href: "/feed", rotulo: "Feed", icone: House },
  { href: "/missoes", rotulo: "Missões", icone: Target },
  { href: "/ranking", rotulo: "Ranking", icone: Trophy },
  { href: "/loja", rotulo: "Loja", icone: ShoppingBag },
  { href: "/perfil", rotulo: "Perfil", icone: User },
];

export function indiceDaAba(pathname: string) {
  return ABAS.findIndex((a) => pathname === a.href || pathname.startsWith(`${a.href}/`));
}
