import type { SalaEstudo, TemaSala } from "@/store/types";
import { PESSOAS_GERADAS } from "./turmas";

const MIN = 60_000;
const H = 60 * MIN;
const D = 24 * H;

const gerados = (inicio: number, qtd: number) => PESSOAS_GERADAS.slice(inicio, inicio + qtd).map((p) => p.id);

/**
 * Cor de identificação de cada sala (um ponto/faixa discreta no card).
 * `gradiente` é um fundo bem suave para o topo do card; `cor` é a cor sólida do marcador.
 */
export const TEMAS_SALA: Record<TemaSala, { nome: string; gradiente: string; cor: string }> = {
  esmeralda: { nome: "Verde", gradiente: "from-emerald-50 to-transparent dark:from-emerald-400/10", cor: "#16a34a" },
  oceano: { nome: "Azul", gradiente: "from-sky-50 to-transparent dark:from-sky-400/10", cor: "#0284c7" },
  ambar: { nome: "Âmbar", gradiente: "from-amber-50 to-transparent dark:from-amber-400/10", cor: "#d97706" },
  rubi: { nome: "Rosa", gradiente: "from-rose-50 to-transparent dark:from-rose-400/10", cor: "#e11d48" },
  noite: { nome: "Grafite", gradiente: "from-slate-100 to-transparent dark:from-slate-400/10", cor: "#475569" },
};

export function criarSalas(agora: number): SalaEstudo[] {
  const t = (ms: number) => agora - ms;
  return [
    {
      id: "sala-revisao-mat",
      nome: "Revisão para a prova de Matemática",
      descricao: "Funções afins — lista 7 e exercícios extras. Dúvidas no chat, eu passo aqui durante a pausa.",
      disciplina: "Matemática",
      criadorId: "prof_ricardo",
      oficial: true,
      privada: false,
      focoMin: 25,
      pausaMin: 5,
      cicloInicio: t(11 * MIN),
      membros: ["lucas", "sofia", "julia", "pedro", ...gerados(0, 7)],
      capacidade: 30,
      tema: "esmeralda",
      turma: "9º Ano A",
      focoHojeMin: 1840,
      criadaEm: t(3 * H),
      mensagens: [
        { id: "sm1", autorId: "prof_ricardo", texto: "Sala aberta até às 22h. Comecem pela questão 4, é a que mais cai na prova.", criadoEm: t(2 * H), tipo: "mensagem" },
        { id: "sm2", autorId: "sofia", texto: "Professor, na 6 a gente usa dois pontos do gráfico né?", criadoEm: t(50 * MIN), tipo: "mensagem" },
        { id: "sm3", autorId: "prof_ricardo", texto: "Isso, Sofia! a = (y₂ − y₁) ÷ (x₂ − x₁).", criadoEm: t(46 * MIN), tipo: "mensagem" },
        { id: "sm4", autorId: "lucas", texto: "🔥", criadoEm: t(20 * MIN), tipo: "reacao" },
      ],
    },
    {
      id: "sala-biblioteca",
      nome: "Biblioteca silenciosa",
      descricao: "Sala livre para qualquer disciplina. Câmera desligada, microfone mudo, só foco.",
      criadorId: "coord",
      oficial: true,
      privada: false,
      focoMin: 50,
      pausaMin: 10,
      cicloInicio: t(34 * MIN),
      membros: ["gustavo", "camila", "rafael", ...gerados(7, 11)],
      capacidade: 60,
      tema: "noite",
      focoHojeMin: 5120,
      criadaEm: t(40 * D),
      mensagens: [
        { id: "sb1", autorId: "coord", texto: "Bem-vindos à Biblioteca silenciosa. Respeitem o foco dos colegas.", criadoEm: t(6 * H), tipo: "mensagem" },
        { id: "sb2", autorId: "gustavo", texto: "Terceiro ciclo hoje. Bora!", criadoEm: t(35 * MIN), tipo: "mensagem" },
      ],
    },
    {
      id: "sala-quimica",
      nome: "Maratona de Química",
      descricao: "Flashcards e balanceamento até a Maratona da Turma fechar. Quem chegar, soma!",
      disciplina: "Química",
      criadorId: "sofia",
      oficial: false,
      privada: false,
      focoMin: 25,
      pausaMin: 5,
      cicloInicio: t(27 * MIN),
      membros: ["sofia", "otavio", ...gerados(18, 3)],
      capacidade: 12,
      tema: "ambar",
      turma: "9º Ano A",
      focoHojeMin: 610,
      criadaEm: t(5 * H),
      mensagens: [
        { id: "sq1", autorId: "sofia", texto: "Criei a sala pra gente fechar os 200 flashcards", criadoEm: t(5 * H), tipo: "mensagem" },
        { id: "sq2", autorId: "otavio", texto: "Tô dentro, travei no balanceamento", criadoEm: t(2 * H), tipo: "mensagem" },
      ],
    },
    {
      id: "sala-vidas-secas",
      nome: "Clube do livro · Vidas Secas",
      descricao: "Leitura guiada dos capítulos 5 a 8 para a redação de Português.",
      disciplina: "Português",
      criadorId: "marina",
      oficial: false,
      privada: false,
      focoMin: 50,
      pausaMin: 10,
      cicloInicio: t(8 * MIN),
      membros: ["marina", ...gerados(21, 3)],
      capacidade: 10,
      tema: "rubi",
      focoHojeMin: 240,
      criadaEm: t(1 * D),
      mensagens: [{ id: "sv1", autorId: "marina", texto: "Hoje: capítulo 6, “Inverno”. Anotem as metáforas!", criadoEm: t(1 * H), tipo: "mensagem" }],
    },
    {
      id: "sala-grupo-9a",
      nome: "Grupo de estudos 9º A",
      descricao: "Nosso grupo fechado de quinta. Código com o Lucas.",
      criadorId: "lucas",
      oficial: false,
      privada: true,
      codigo: "9A-FOCO",
      focoMin: 25,
      pausaMin: 5,
      cicloInicio: t(3 * MIN),
      membros: ["lucas", "julia", "pedro"],
      capacidade: 8,
      tema: "oceano",
      turma: "9º Ano A",
      focoHojeMin: 150,
      criadaEm: t(9 * D),
      mensagens: [{ id: "sg1", autorId: "lucas", texto: "Quem entrar, avisa aqui", criadoEm: t(30 * MIN), tipo: "mensagem" }],
    },
    {
      id: "sala-ingles",
      nome: "Speaking practice · Unit 5",
      descricao: "Present Perfect na prática antes do simulado da Cultura Inglesa.",
      disciplina: "Inglês",
      criadorId: "prof_daniel",
      oficial: true,
      privada: false,
      focoMin: 25,
      pausaMin: 5,
      cicloInicio: agora + 1 * D,
      agendadaPara: new Date(new Date(agora + D).setHours(19, 0, 0, 0)).getTime(),
      membros: [],
      capacidade: 25,
      tema: "oceano",
      focoHojeMin: 0,
      criadaEm: t(2 * D),
      mensagens: [],
    },
  ];
}
