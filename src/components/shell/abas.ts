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

/** Tela de conversa aberta: esconde cabeçalho e barra inferior. */
export function ehConversa(pathname: string) {
  return pathname.startsWith("/mensagens/");
}

/**
 * Ordem "espacial" das telas para a transição: as abas da esquerda para a
 * direita, depois Mensagens e, por último, uma conversa aberta.
 */
export function ordemDaRota(pathname: string) {
  if (ehConversa(pathname)) return ABAS.length + 1;
  if (pathname === "/mensagens") return ABAS.length;
  return indiceDaAba(pathname);
}
