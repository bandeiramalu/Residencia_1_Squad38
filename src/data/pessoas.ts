import type { Pessoa } from "@/store/types";

export const USUARIO_ID = "ana";

export const PESSOAS: Pessoa[] = [
  { id: "ana", nome: "Ana Beatriz Moura", iniciais: "AB", papel: "aluno", turma: "9º Ano A", xp: 890 },
  { id: "prof_ricardo", nome: "Prof. Ricardo Nogueira", iniciais: "R", papel: "professor", disciplina: "Matemática" },
  { id: "prof_denise", nome: "Profª. Denise Albuquerque", iniciais: "D", papel: "professor", disciplina: "Biologia" },
  { id: "prof_marcos", nome: "Prof. Marcos Vinícius", iniciais: "M", papel: "professor", disciplina: "História" },
  { id: "prof_claudia", nome: "Profª. Cláudia Reis", iniciais: "C", papel: "professor", disciplina: "Português" },
  { id: "prof_andre", nome: "Prof. André Sales", iniciais: "A", papel: "professor", disciplina: "Química" },
  { id: "prof_tiago", nome: "Prof. Tiago Lemos", iniciais: "T", papel: "professor", disciplina: "Física" },
  { id: "prof_renata", nome: "Profª. Renata Dias", iniciais: "RD", papel: "professor", disciplina: "Geografia" },
  { id: "prof_daniel", nome: "Teacher Daniel Martins", iniciais: "DM", papel: "professor", disciplina: "Inglês" },
  { id: "coord", nome: "Coordenação Pedagógica", iniciais: "CP", papel: "escola" },
  { id: "julia", nome: "Júlia Nakamura", iniciais: "JN", papel: "aluno", turma: "9º Ano A", xp: 760 },
  { id: "lucas", nome: "Lucas Ferreira", iniciais: "LF", papel: "aluno", turma: "9º Ano A", xp: 1240 },
  { id: "marina", nome: "Marina Coutinho", iniciais: "MC", papel: "aluno", turma: "9º Ano A", xp: 980 },
  { id: "sofia", nome: "Sofia Andrade", iniciais: "SA", papel: "aluno", turma: "9º Ano A", xp: 1460 },
  { id: "pedro", nome: "Pedro Henrique Alves", iniciais: "PH", papel: "aluno", turma: "9º Ano A", xp: 540 },
  { id: "otavio", nome: "Otávio Mendes", iniciais: "OM", papel: "aluno", turma: "9º Ano A", xp: 310 },
  { id: "rafael", nome: "Rafael Souza Lima", iniciais: "RS", papel: "aluno", turma: "9º Ano B", xp: 1105 },
  { id: "camila", nome: "Camila Rocha", iniciais: "CR", papel: "aluno", turma: "9º Ano B", xp: 655 },
  { id: "gustavo", nome: "Gustavo Teixeira", iniciais: "GT", papel: "aluno", turma: "1ª Série EM", xp: 1780 },
];

/** Faixa de avatares do Feed (filtro por membro). */
export const MEMBROS_DESTAQUE = ["prof_ricardo", "julia", "lucas", "marina", "sofia", "pedro", "prof_denise", "coord"];
