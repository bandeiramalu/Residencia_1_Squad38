import { DISCIPLINAS, type Disciplina } from "./escola";

export type LigaId = "bronze" | "prata" | "ouro" | "diamante";

export const LIGAS: { id: LigaId; nome: string }[] = [
  { id: "bronze", nome: "Bronze" },
  { id: "prata", nome: "Prata" },
  { id: "ouro", nome: "Ouro" },
  { id: "diamante", nome: "Diamante" },
];

export const LIGA_DO_USUARIO: LigaId = "prata";

/** Quantos alunos sobem/descem de liga no fechamento semanal. */
export const ZONA = 3;

export interface AlunoRanking {
  id: string;
  nome: string;
  turma: string;
  liga: LigaId;
  xpSemana: number;
  /** Variação de posição desde o último fechamento (antes das ações da sessão). */
  variacaoBase: number;
  xpDisc: Record<Disciplina, number>;
}

const NOMES = ["Heitor", "Isadora", "Davi", "Elisa", "Felipe", "Gabriela", "Letícia", "Miguel", "Natália", "Paulo", "Raquel", "Samuel", "Tainá", "Valentina", "Wesley", "Yasmin", "Caio", "Dora", "Enzo", "Flávia", "Giovana", "Henrique", "Iara", "Joaquim", "Lorena", "Matheus", "Nicole", "Olívia", "Pietra", "Ravi", "Bianca", "Vitor", "Alice", "Bruno", "Cecília", "Teresa", "Ulisses", "Mirela", "Levi", "Maitê", "Benício", "Clara", "Arthur", "Luna", "Theo", "Helena", "Antônio", "Lívia", "Noah", "Esther", "Bernardo", "Sarah", "Gael", "Aurora", "Rafaela", "Emanuel", "Laura", "Murilo", "Melissa", "Otávio", "Eloá", "Pietro", "Cauã", "Ayla", "Ian"];
const SOBRENOMES = ["Ramos", "Cardoso", "Nunes", "Moreira", "Fontes", "Arantes", "Peixoto", "Vasconcelos", "Lemos", "Brito", "Moraes", "Tavares", "Bittencourt", "Rios", "Siqueira", "Marinho", "Cruz", "Camargo", "Farias", "Antunes", "Lins", "Rezende", "Sampaio", "Freitas", "Correia", "Batista", "Nascimento", "Menezes", "Góis", "Prado"];
const TURMAS = ["9º Ano B", "9º Ano C", "8º Ano A", "8º Ano B", "1ª Série EM", "2ª Série EM", "7º Ano A", "9º Ano A"];

/** Gerador pseudoaleatório determinístico: a mesma lista em todo acesso. */
function mulberry32(semente: number) {
  let a = semente;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function distribuirPorDisciplina(total: number, aleatorio: () => number): Record<Disciplina, number> {
  const pesos = DISCIPLINAS.map(() => 0.4 + aleatorio());
  const soma = pesos.reduce((a, b) => a + b, 0);
  const out = {} as Record<Disciplina, number>;
  DISCIPLINAS.forEach((d, i) => (out[d] = Math.round((total * pesos[i]) / soma)));
  return out;
}

const NOMEADOS: Omit<AlunoRanking, "xpDisc" | "variacaoBase">[] = [
  { id: "lucas", nome: "Lucas Ferreira", turma: "9º Ano A", liga: "prata", xpSemana: 441 },
  { id: "sofia", nome: "Sofia Andrade", turma: "9º Ano A", liga: "prata", xpSemana: 402 },
  { id: "rafael", nome: "Rafael Souza Lima", turma: "9º Ano B", liga: "prata", xpSemana: 385 },
  { id: "marina", nome: "Marina Coutinho", turma: "9º Ano A", liga: "prata", xpSemana: 350 },
  { id: "julia", nome: "Júlia Nakamura", turma: "9º Ano A", liga: "prata", xpSemana: 322 },
  { id: "pedro", nome: "Pedro Henrique Alves", turma: "9º Ano A", liga: "prata", xpSemana: 290 },
  { id: "camila", nome: "Camila Rocha", turma: "9º Ano B", liga: "prata", xpSemana: 270 },
  { id: "otavio", nome: "Otávio Mendes", turma: "9º Ano A", liga: "bronze", xpSemana: 118 },
  { id: "gustavo", nome: "Gustavo Teixeira", turma: "1ª Série EM", liga: "diamante", xpSemana: 812 },
];

/** Faixas de XP semanal e quantidade de alunos gerados por liga. */
const FAIXAS: Record<LigaId, { min: number; max: number; gerar: number }> = {
  bronze: { min: 40, max: 230, gerar: 15 },
  prata: { min: 150, max: 458, gerar: 12 },
  ouro: { min: 300, max: 690, gerar: 18 },
  diamante: { min: 520, max: 980, gerar: 14 },
};

function gerarAlunos(): AlunoRanking[] {
  const rnd = mulberry32(38);
  const usados = new Set(NOMEADOS.map((n) => n.nome));
  const alunos: AlunoRanking[] = NOMEADOS.map((n) => ({
    ...n,
    variacaoBase: Math.round(rnd() * 9) - 4,
    xpDisc: distribuirPorDisciplina(n.xpSemana, rnd),
  }));

  let k = 0;
  for (const liga of LIGAS) {
    const faixa = FAIXAS[liga.id];
    for (let i = 0; i < faixa.gerar; i++) {
      let nome = "";
      do {
        nome = `${NOMES[Math.floor(rnd() * NOMES.length)]} ${SOBRENOMES[Math.floor(rnd() * SOBRENOMES.length)]}`;
      } while (usados.has(nome));
      usados.add(nome);
      // O primeiro gerado da Prata é o líder da liga (458 XP) — alcançável na demonstração.
      const xp =
        i === 0
          ? faixa.max
          : Math.round(faixa.max - (faixa.max - faixa.min) * ((i + 0.5 + rnd() * 0.6) / faixa.gerar));
      alunos.push({
        id: `g-${liga.id}-${i}`,
        nome,
        turma: TURMAS[k % TURMAS.length],
        liga: liga.id,
        xpSemana: xp,
        variacaoBase: Math.round(rnd() * 11) - 5,
        xpDisc: distribuirPorDisciplina(xp, rnd),
      });
      k++;
    }
  }
  return alunos;
}

export const ALUNOS_RANKING = gerarAlunos();

export const USUARIO_RANKING = {
  liga: LIGA_DO_USUARIO,
  variacaoBase: 2,
};
