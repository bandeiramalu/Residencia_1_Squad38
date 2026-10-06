import { BookOpen, Bot, FlaskConical, GraduationCap, Sprout, Trophy, type LucideIcon } from "lucide-react";

/** Selos do CEPI (item "Selos do CEPI no perfil" da Loja), em ícones de linha. */
export const SELOS: { icone: LucideIcon; nome: string }[] = [
  { icone: GraduationCap, nome: "Aluno CEPI" },
  { icone: FlaskConical, nome: "Feira de Ciências" },
  { icone: Bot, nome: "Oficina de Robótica" },
  { icone: BookOpen, nome: "Clube de Leitura" },
  { icone: Trophy, nome: "Jogos Escolares" },
  { icone: Sprout, nome: "Horta da Escola" },
];
