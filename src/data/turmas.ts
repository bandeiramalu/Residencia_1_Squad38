import { entre, escolher, mulberry32 } from "@/lib/aleatorio";
import type { Pessoa } from "@/store/types";
import { DISCIPLINAS, type Disciplina } from "./escola";
import { PESSOAS } from "./pessoas";
import { TURMAS_DO_PROFESSOR } from "./professor";

/**
 * Alunos das turmas do professor da demonstração, com métricas de engajamento.
 * Os colegas nomeados (Lucas, Júlia…) vêm de `pessoas.ts`; o resto é gerado de forma
 * determinística para a turma ter tamanho real (~25 alunos).
 */
export interface AlunoTurma {
  id: string;
  nome: string;
  iniciais: string;
  turma: string;
  xp: number;
  xpSemana: number;
  pontos: number;
  /** Minutos de estudo registrados nesta semana. */
  minutosSemana: number;
  /** Minutos por dia nos últimos 7 dias (do mais antigo até hoje). */
  minutos7d: number[];
  sequencia: number;
  dominio: Record<Disciplina, number>;
  /** Minutos desde o último acesso ao portal. */
  ultimoAcessoHa: number;
  /** % de atividades entregues no prazo. */
  entregasNoPrazo: number;
}

const NOMES = ["Heitor", "Isadora", "Davi", "Elisa", "Felipe", "Gabriela", "Letícia", "Miguel", "Natália", "Paulo", "Raquel", "Samuel", "Tainá", "Valentina", "Wesley", "Yasmin", "Caio", "Dora", "Enzo", "Flávia", "Giovana", "Henrique", "Iara", "Joaquim", "Lorena", "Matheus", "Nicole", "Olívia", "Pietra", "Ravi", "Bianca", "Vitor", "Alice", "Bruno", "Cecília", "Teresa", "Ulisses", "Mirela", "Levi", "Maitê", "Benício", "Clara", "Arthur", "Luna", "Theo", "Helena", "Antônio", "Lívia", "Noah", "Esther"];
const SOBRENOMES = ["Ramos", "Cardoso", "Nunes", "Moreira", "Fontes", "Arantes", "Peixoto", "Vasconcelos", "Lemos", "Brito", "Moraes", "Tavares", "Bittencourt", "Rios", "Siqueira", "Marinho", "Cruz", "Camargo", "Farias", "Antunes", "Lins", "Rezende", "Sampaio", "Freitas", "Correia", "Batista", "Menezes", "Góis", "Prado", "Dantas"];

const TAMANHO: Record<string, number> = { "9º Ano A": 26, "9º Ano B": 24, "8º Ano A": 22 };

/** XP da semana dos colegas nomeados — igual ao ranking da liga. */
const XP_SEMANA_NOMEADOS: Record<string, number> = { lucas: 441, sofia: 402, rafael: 385, marina: 350, julia: 322, pedro: 290, camila: 270, otavio: 118, ana: 368 };

function iniciais(nome: string) {
  const p = nome.split(" ");
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase();
}

function gerar(): AlunoTurma[] {
  const rnd = mulberry32(2026);
  const usados = new Set(PESSOAS.map((p) => p.nome));
  const alunos: AlunoTurma[] = [];

  for (const turma of TURMAS_DO_PROFESSOR) {
    const nomeados = PESSOAS.filter((p) => p.papel === "aluno" && p.turma === turma);
    const total = TAMANHO[turma] ?? 24;

    const base: { id: string; nome: string; iniciais: string; xp: number }[] = nomeados.map((p) => ({
      id: p.id,
      nome: p.nome,
      iniciais: p.iniciais,
      xp: p.xp ?? 600,
    }));
    for (let i = base.length; i < total; i++) {
      let nome = "";
      do nome = `${escolher(NOMES, rnd)} ${escolher(SOBRENOMES, rnd)}`;
      while (usados.has(nome));
      usados.add(nome);
      base.push({ id: `al-${turma.replace(/\D/g, "")}${turma.slice(-1).toLowerCase()}-${i}`, nome, iniciais: iniciais(nome), xp: entre(180, 1500, rnd) });
    }

    for (const b of base) {
      // Perfis variados: alguns muito engajados, outros sumindo (alerta de risco no painel).
      const perfil = rnd();
      const engajamento = perfil < 0.12 ? 0.15 : perfil < 0.3 ? 0.5 : perfil < 0.85 ? 0.85 : 1.25;
      const minutos7d = Array.from({ length: 7 }, (_, d) => {
        const estudou = rnd() < 0.35 + engajamento * 0.5;
        return estudou ? Math.round(entre(15, 95, rnd) * engajamento * (d === 6 ? 0.45 : 1)) : 0;
      });
      const dominio = Object.fromEntries(DISCIPLINAS.map((d) => [d, Math.min(98, Math.round(entre(35, 88, rnd) * (0.7 + engajamento * 0.3)))])) as Record<Disciplina, number>;
      alunos.push({
        id: b.id,
        nome: b.nome,
        iniciais: b.iniciais,
        turma,
        xp: b.xp,
        xpSemana: Math.min(b.xp, XP_SEMANA_NOMEADOS[b.id] ?? Math.round(entre(60, 420, rnd) * engajamento)),
        pontos: entre(300, 3200, rnd),
        minutosSemana: minutos7d.reduce((a, m) => a + m, 0),
        minutos7d,
        sequencia: engajamento < 0.3 ? 0 : Math.round(entre(1, 24, rnd) * engajamento),
        dominio,
        ultimoAcessoHa: engajamento < 0.3 ? entre(3 * 1440, 9 * 1440, rnd) : entre(4, 1800, rnd),
        entregasNoPrazo: Math.min(100, Math.round(entre(40, 100, rnd) * (0.6 + engajamento * 0.35))),
      });
    }
  }
  return alunos;
}

export const ALUNOS_TURMAS: AlunoTurma[] = gerar();

export function alunosDaTurma(turma: string) {
  return ALUNOS_TURMAS.filter((a) => a.turma === turma);
}

/** Pessoas geradas (sem as já cadastradas) — entram no estado para nomes e avatares. */
export const PESSOAS_GERADAS: Pessoa[] = ALUNOS_TURMAS.filter((a) => !PESSOAS.some((p) => p.id === a.id)).map((a) => ({
  id: a.id,
  nome: a.nome,
  iniciais: a.iniciais,
  papel: "aluno",
  turma: a.turma,
  xp: a.xp,
}));

/** Média de minutos de estudo por semana de cada turma (usada em comparativos e interclasses). */
export const MEDIA_MINUTOS_TURMA: Record<string, number> = { "9º Ano A": 342, "9º Ano B": 318, "9º Ano C": 296, "8º Ano A": 275, "8º Ano B": 301, "1ª Série EM": 389 };
