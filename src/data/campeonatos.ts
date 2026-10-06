import type { Campeonato, CapaCampeonato, FormatoCampeonato, MetricaCampeonato } from "@/store/types";
import { PESSOAS_GERADAS } from "./turmas";

const H = 3_600_000;
const D = 24 * H;

export const ROTULO_FORMATO: Record<FormatoCampeonato, string> = {
  "mata-mata": "Mata-mata",
  "pontos-corridos": "Pontos corridos",
  interclasses: "Interclasses",
};

export const ROTULO_METRICA: Record<MetricaCampeonato, { nome: string; unidade: string; descricao: string }> = {
  quiz: { nome: "Duelos de quiz", unidade: "pts", descricao: "Perguntas da disciplina com tempo — quem acerta mais vence." },
  foco: { nome: "Tempo de foco", unidade: "min", descricao: "Minutos de estudo registrados na Sala de Estudos." },
  xp: { nome: "XP no período", unidade: "XP", descricao: "XP de mérito acadêmico ganho durante o campeonato." },
};

/**
 * Cor de identificação de cada campeonato. `gradiente` é um fundo bem suave;
 * `brilho` (nome mantido por compatibilidade) é a cor sólida de destaque.
 */
export const CAPAS_CAMPEONATO: Record<CapaCampeonato, { gradiente: string; brilho: string }> = {
  ouro: { gradiente: "from-amber-50 to-transparent dark:from-amber-400/10", brilho: "#d97706" },
  esmeralda: { gradiente: "from-emerald-50 to-transparent dark:from-emerald-400/10", brilho: "#16a34a" },
  oceano: { gradiente: "from-sky-50 to-transparent dark:from-sky-400/10", brilho: "#0284c7" },
  rubi: { gradiente: "from-rose-50 to-transparent dark:from-rose-400/10", brilho: "#e11d48" },
  noite: { gradiente: "from-slate-100 to-transparent dark:from-slate-400/10", brilho: "#475569" },
};

/** Nomes das rodadas do mata-mata a partir do número de rodadas restantes. */
export function nomeDaRodada(rodada: number, totalRodadas: number) {
  const faltam = totalRodadas - rodada;
  if (faltam === 1) return "Final";
  if (faltam === 2) return "Semifinal";
  if (faltam === 3) return "Quartas de final";
  if (faltam === 4) return "Oitavas de final";
  return `Rodada ${rodada + 1}`;
}

const gerados = (inicio: number, qtd: number) => PESSOAS_GERADAS.slice(inicio, inicio + qtd).map((p) => p.id);

export function criarCampeonatos(agora: number): Campeonato[] {
  const hoje = new Date(agora);
  hoje.setHours(0, 0, 0, 0);
  const dia = (n: number) => hoje.getTime() + n * D;

  const interclassesTurmas = ["9º Ano A", "9º Ano B", "9º Ano C", "8º Ano A"];
  const quimica = ["sofia", "otavio", "julia", "marina", ...gerados(30, 8)];

  return [
    {
      id: "copa-matematica",
      nome: "Copa CEPI de Matemática",
      descricao: "Mata-mata de duelos de quiz sobre funções afins. Cada duelo tem 5 perguntas com 20 segundos cada.",
      formato: "mata-mata",
      metrica: "quiz",
      disciplina: "Matemática",
      criadorId: "prof_ricardo",
      oficial: true,
      status: "andamento",
      inicio: dia(-5),
      fim: dia(4) + 23 * H,
      premio: { pontos: 300, xp: 120, titulo: "Campeã(o) da Copa de Matemática" },
      participantes: ["ana", "otavio", "sofia", "camila", "lucas", "pedro", "marina", "julia"],
      maxParticipantes: 8,
      partidas: [
        { id: "q1", rodada: 0, a: "ana", b: "otavio", placarA: 4, placarB: 2, vencedor: "ana", status: "encerrada" },
        { id: "q2", rodada: 0, a: "sofia", b: "camila", placarA: 5, placarB: 3, vencedor: "sofia", status: "encerrada" },
        { id: "q3", rodada: 0, a: "lucas", b: "pedro", placarA: 4, placarB: 3, vencedor: "lucas", status: "encerrada" },
        { id: "q4", rodada: 0, a: "marina", b: "julia", placarA: 3, placarB: 5, vencedor: "julia", status: "encerrada" },
        { id: "s1", rodada: 1, a: "ana", b: "sofia", status: "disponivel" },
        { id: "s2", rodada: 1, a: "lucas", b: "julia", status: "disponivel" },
        { id: "f1", rodada: 2, a: null, b: null, status: "aguardando" },
      ],
      placar: {},
      capa: "ouro",
      turmas: ["9º Ano A", "9º Ano B"],
      criadoEm: dia(-8),
    },
    {
      id: "interclasses-foco",
      nome: "Interclasses do Foco · Outubro",
      descricao: "Qual turma estuda mais? Cada minuto de foco na Sala de Estudos soma para a sua turma. A turma campeã ganha 150 pontos por aluno.",
      formato: "interclasses",
      metrica: "foco",
      criadorId: "coord",
      oficial: true,
      status: "andamento",
      inicio: dia(-9),
      fim: dia(4) + 23 * H + 59 * 60_000,
      premio: { pontos: 150, xp: 0, titulo: "Turma mais focada do CEPI" },
      participantes: interclassesTurmas,
      maxParticipantes: 8,
      partidas: [],
      // O 9º A está 19 minutos atrás do 9º B: um ciclo de foco da aluna vira o jogo.
      placar: { "9º Ano A": 6712, "9º Ano B": 6731, "9º Ano C": 5530, "8º Ano A": 4984 },
      capa: "esmeralda",
      turmas: [],
      criadoEm: dia(-12),
    },
    {
      id: "relampago-quimica",
      nome: "Desafio Relâmpago de Química",
      descricao: "Pontos corridos: jogue rodadas de 5 perguntas sobre reações químicas. Cada acerto vale 10 pontos na tabela.",
      formato: "pontos-corridos",
      metrica: "quiz",
      disciplina: "Química",
      criadorId: "prof_andre",
      oficial: true,
      status: "inscricoes",
      inicio: dia(1) + 7 * H,
      fim: dia(8) + 23 * H,
      premio: { pontos: 200, xp: 80, titulo: "Mestre das Reações" },
      participantes: quimica,
      maxParticipantes: 30,
      partidas: [],
      placar: Object.fromEntries(quimica.map((id) => [id, 0])),
      capa: "rubi",
      turmas: ["9º Ano A", "9º Ano B", "9º Ano C"],
      criadoEm: dia(-1),
    },
    {
      id: "amistoso-fundao",
      nome: "Amistoso: Turma do Fundão",
      descricao: "Quem estuda mais nesta semana? Quem perder paga o açaí no sábado.",
      formato: "pontos-corridos",
      metrica: "foco",
      criadorId: "pedro",
      oficial: false,
      status: "andamento",
      inicio: dia(-3),
      fim: dia(3) + 23 * H,
      premio: { pontos: 0, xp: 0, titulo: "Rei(nha) do Fundão" },
      participantes: ["pedro", "ana", "lucas", "otavio"],
      maxParticipantes: 6,
      partidas: [],
      placar: { pedro: 185, ana: 160, lucas: 210, otavio: 75 },
      capa: "oceano",
      turmas: ["9º Ano A"],
      criadoEm: dia(-3),
    },
    {
      id: "liga-xp-setembro",
      nome: "Liga do XP · Setembro",
      descricao: "Quem ganhou mais XP de mérito acadêmico no mês de setembro.",
      formato: "pontos-corridos",
      metrica: "xp",
      criadorId: "coord",
      oficial: true,
      status: "encerrado",
      inicio: dia(-40),
      fim: dia(-10),
      premio: { pontos: 250, xp: 0, titulo: "Destaque de Setembro" },
      participantes: ["lucas", "sofia", "ana", "marina", "julia", "pedro", "rafael", "camila", "gustavo"],
      maxParticipantes: 40,
      partidas: [],
      placar: { gustavo: 1690, lucas: 1422, sofia: 1380, ana: 1215, marina: 1104, rafael: 1010, julia: 960, camila: 720, pedro: 655 },
      campeao: "gustavo",
      capa: "noite",
      turmas: [],
      criadoEm: dia(-45),
    },
  ];
}
