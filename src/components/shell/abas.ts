import {
  BookOpenCheck,
  ChartColumn,
  CircleHelp,
  ClipboardList,
  Hourglass,
  House,
  LayoutDashboard,
  ShieldAlert,
  ShoppingBag,
  Swords,
  Target,
  Trophy,
  User,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { PapelSessao } from "@/lib/auth";

export interface ItemNav {
  href: string;
  rotulo: string;
  icone: LucideIcon;
  /** Prefixos que deixam o item ativo (padrão: o próprio href). */
  prefixos?: string[];
  /** Prefixos que NÃO ativam o item (ex.: /estudos/salas no item Estudos da barra lateral). */
  exceto?: string[];
  /** Ativo só na rota exata. */
  exato?: boolean;
}

export interface GrupoNav {
  titulo: string;
  itens: ItemNav[];
}

/** Barra inferior do celular — 5 abas por papel. */
export const NAV_MOBILE: Record<PapelSessao, ItemNav[]> = {
  aluno: [
    { href: "/feed", rotulo: "Início", icone: House },
    { href: "/estudos", rotulo: "Estudos", icone: Hourglass },
    { href: "/missoes", rotulo: "Missões", icone: Target },
    { href: "/ranking", rotulo: "Ranking", icone: Trophy, prefixos: ["/ranking", "/campeonatos"] },
    { href: "/perfil", rotulo: "Perfil", icone: User, prefixos: ["/perfil", "/loja", "/estatisticas"] },
  ],
  professor: [
    { href: "/professor", rotulo: "Painel", icone: LayoutDashboard, exato: true },
    { href: "/professor/alunos", rotulo: "Alunos", icone: UsersRound },
    { href: "/professor/atividades", rotulo: "Atividades", icone: ClipboardList },
    { href: "/professor/estatisticas", rotulo: "Estatísticas", icone: ChartColumn },
    { href: "/campeonatos", rotulo: "Campeonatos", icone: Swords },
  ],
};

/** Barra lateral do desktop — todas as áreas, agrupadas. */
export const NAV_LATERAL: Record<PapelSessao, GrupoNav[]> = {
  aluno: [
    {
      titulo: "Aprender",
      itens: [
        { href: "/feed", rotulo: "Início", icone: House },
        { href: "/estudos", rotulo: "Sala de estudos", icone: Hourglass, exceto: ["/estudos/salas"] },
        { href: "/estudos/salas", rotulo: "Salas coletivas", icone: Users },
        { href: "/missoes", rotulo: "Missões", icone: Target },
      ],
    },
    {
      titulo: "Competir",
      itens: [
        { href: "/ranking", rotulo: "Ranking", icone: Trophy },
        { href: "/campeonatos", rotulo: "Campeonatos", icone: Swords },
      ],
    },
    {
      titulo: "Você",
      itens: [
        { href: "/loja", rotulo: "Loja", icone: ShoppingBag },
        { href: "/estatisticas", rotulo: "Estatísticas", icone: ChartColumn },
        { href: "/perfil", rotulo: "Perfil", icone: User },
      ],
    },
  ],
  professor: [
    {
      titulo: "Turmas",
      itens: [
        { href: "/professor", rotulo: "Painel", icone: LayoutDashboard, exato: true },
        { href: "/professor/alunos", rotulo: "Alunos", icone: UsersRound },
        { href: "/professor/atividades", rotulo: "Atividades", icone: ClipboardList },
        { href: "/professor/duvidas", rotulo: "Dúvidas", icone: CircleHelp },
        { href: "/professor/estatisticas", rotulo: "Estatísticas", icone: ChartColumn },
      ],
    },
    {
      titulo: "Engajamento",
      itens: [
        { href: "/estudos/salas", rotulo: "Salas de estudo", icone: BookOpenCheck },
        { href: "/campeonatos", rotulo: "Campeonatos", icone: Swords },
      ],
    },
    {
      titulo: "Comunidade",
      itens: [{ href: "/professor/moderacao", rotulo: "Moderação", icone: ShieldAlert }],
    },
  ],
};

function casa(caminho: string, prefixo: string) {
  return caminho === prefixo || caminho.startsWith(`${prefixo}/`);
}

export function itemAtivo(item: ItemNav, caminho: string) {
  if (item.exato) return caminho === item.href;
  if (item.exceto?.some((p) => casa(caminho, p))) return false;
  return (item.prefixos ?? [item.href]).some((p) => casa(caminho, p));
}

/**
 * Ordem "espacial" das telas para a transição: abas da esquerda para a direita;
 * telas internas (detalhes) vêm depois da aba a que pertencem.
 */
export function ordemDaRota(caminho: string, papel: PapelSessao) {
  const abas = NAV_MOBILE[papel];
  const i = abas.findIndex((a) => itemAtivo(a, caminho));
  if (i < 0) return -1;
  const profundidade = caminho.split("/").filter(Boolean).length - abas[i].href.split("/").filter(Boolean).length;
  return i + Math.max(0, profundidade) * 0.1;
}
