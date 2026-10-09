import type { Missao, MissaoColetiva } from "@/store/types";
import { DISCIPLINAS, type Disciplina } from "./escola";

/** Missões diárias (renovadas a cada 24 h). As tarefas do professor viraram Atividades (`data/atividades.ts`). */
export const MISSOES: Missao[] = [
  {
    id: "d1",
    tipo: "diaria",
    titulo: "Responder 2 dúvidas de colegas",
    descricao: "O feed tem dúvidas abertas de Matemática, Biologia e História.",
    alvo: 2,
    progresso: 1,
    pontos: 25,
    xp: 10,
    concluida: false,
  },
  {
    id: "d2",
    tipo: "diaria",
    titulo: "Acertar 5 flashcards",
    descricao: "Qualquer disciplina, na prática rápida desta tela: contam os acertos em cartas vencidas. Revisar em intervalos fixa melhor que reler.",
    alvo: 5,
    progresso: 0,
    pontos: 25,
    xp: 10,
    concluida: false,
  },
  {
    id: "d3",
    tipo: "diaria",
    titulo: "Revisar o mapa mental de Citologia",
    descricao: "Abra o material publicado pela Profª. Denise no feed.",
    disciplina: "Biologia",
    postId: "p4",
    alvo: 1,
    progresso: 0,
    pontos: 20,
    xp: 10,
    concluida: false,
  },
  {
    id: "d4",
    tipo: "diaria",
    titulo: "Completar um ciclo de foco na Sala de Estudos",
    descricao: "25 minutos sem distrações rendem mais que duas horas picotadas.",
    alvo: 1,
    progresso: 0,
    pontos: 20,
    xp: 5,
    concluida: false,
  },
];

export const COLETIVA: MissaoColetiva = {
  titulo: "Maratona da Turma · 200 flashcards",
  descricao:
    "O 9º Ano A precisa concluir 200 flashcards até domingo. Os 100 pontos são divididos entre os participantes e cada um garante +30 XP.",
  alvo: 200,
  progresso: 163,
  pontosTotal: 100,
  xp: 30,
  participantes: ["ana", "lucas", "julia", "pedro", "marina", "sofia"],
  concluida: false,
};

export interface Flashcard {
  id: string;
  disciplina: Disciplina;
  pergunta: string;
  resposta: string;
  /** Carta criada pela aluna (não vem do banco da escola). */
  minha?: boolean;
}

type Par = readonly [string, string];

/** Banco de flashcards: 10 cartas por disciplina (9º ano / Ensino Médio). Frente curta, verso claro. */
const BANCO: Record<Disciplina, Par[]> = {
  Matemática: [
    ["Qual é a forma geral da função afim?", "f(x) = ax + b, com a ≠ 0."],
    ["O que o coeficiente angular (a) indica?", "A inclinação da reta: a > 0 cresce, a < 0 decresce."],
    ["O que o coeficiente linear (b) indica?", "Onde a reta corta o eixo y: o ponto (0, b)."],
    ["Como achar o zero de f(x) = ax + b?", "Resolva ax + b = 0 → x = −b/a."],
    ["Qual é a fórmula de Bhaskara?", "x = (−b ± √Δ) / 2a, com Δ = b² − 4ac."],
    ["O que diz o Teorema de Pitágoras?", "No triângulo retângulo, a² = b² + c² (a é a hipotenusa)."],
    ["Quanto mede a soma dos ângulos internos de um triângulo?", "180°."],
    ["Como se calcula a área de um círculo?", "A = π · r²."],
    ["Quanto é 20% de 150?", "30 (150 × 0,20)."],
    ["O que é a média aritmética?", "A soma dos valores dividida pela quantidade deles."],
  ],
  Biologia: [
    ["Qual organela produz ATP na célula?", "A mitocôndria (respiração celular)."],
    ["Onde acontece a fotossíntese?", "Nos cloroplastos, graças à clorofila."],
    ["Quais são as bases nitrogenadas do DNA?", "Adenina, timina, citosina e guanina."],
    ["O que é a mitose?", "Divisão que gera 2 células idênticas à célula-mãe."],
    ["Quantas células a meiose produz?", "Quatro células haploides (n)."],
    ["Qual a diferença entre célula procarionte e eucarionte?", "A procarionte não tem núcleo organizado; a eucarionte tem."],
    ["O que são seres autótrofos?", "Os que produzem o próprio alimento, como as plantas."],
    ["Qual é a função dos ribossomos?", "Sintetizar proteínas."],
    ["O que é um gene?", "Trecho de DNA com a informação para uma característica."],
    ["Qual é o papel das hemácias?", "Transportar oxigênio pelo sangue, por meio da hemoglobina."],
  ],
  História: [
    ["Qual foi o estopim da Primeira Guerra Mundial?", "O assassinato do arquiduque Francisco Ferdinando, em Sarajevo (1914)."],
    ["Quais países formavam a Tríplice Entente?", "Reino Unido, França e Rússia."],
    ["Em que ano foi assinado o Tratado de Versalhes?", "1919."],
    ["O que foi a Revolução Francesa?", "Revolta de 1789 contra o absolutismo: Liberdade, Igualdade e Fraternidade."],
    ["Quando foi proclamada a Independência do Brasil?", "7 de setembro de 1822, por D. Pedro I."],
    ["Que lei aboliu a escravidão no Brasil?", "A Lei Áurea, de 13 de maio de 1888."],
    ["Quando foi proclamada a República no Brasil?", "15 de novembro de 1889, por Deodoro da Fonseca."],
    ["Onde começou a Revolução Industrial?", "Na Inglaterra, no século XVIII."],
    ["Quem foi Tiradentes?", "Líder da Inconfidência Mineira (1789), executado em 1792."],
    ["O que foi a Era Vargas?", "Governo de Getúlio Vargas (1930–1945), com leis trabalhistas e o Estado Novo."],
  ],
  Português: [
    ["O que é uma metáfora?", "Comparação implícita, sem conectivo: “Seus olhos são luas”."],
    ["O que é uma hipérbole?", "Exagero intencional: “Já falei mil vezes”."],
    ["O que é metonímia?", "Troca de um termo por outro próximo: “Li Machado de Assis” (a obra)."],
    ["O que é prosopopeia?", "Atribuir ações humanas a seres não humanos: “O vento sussurrava”."],
    ["O que é um eufemismo?", "Suavizar uma ideia dura: “Ele partiu desta para melhor”."],
    ["Quando usar “mas” e quando usar “mais”?", "“Mas” indica oposição (porém); “mais” indica quantidade."],
    ["Por que “fácil” é acentuada?", "É paroxítona terminada em L."],
    ["Qual é o plural de “cidadão”?", "Cidadãos."],
    ["O que é sujeito inexistente?", "Oração sem sujeito, como nos verbos de fenômeno da natureza: “Choveu”."],
    ["Para que servem os conectivos?", "Ligam orações e ideias, dando coesão ao texto."],
  ],
  Química: [
    ["Qual é a fórmula do ácido sulfúrico?", "H₂SO₄, ácido forte."],
    ["Qual critério organiza a tabela periódica?", "O número atômico crescente (prótons)."],
    ["Qual o nome do composto NaCl?", "Cloreto de sódio, o sal de cozinha."],
    ["O que é uma reação de neutralização?", "Ácido + base → sal + água."],
    ["Quantos elétrons de valência tem o oxigênio?", "Seis (família 16)."],
    ["O que diz a Lei de Lavoisier?", "Em sistema fechado, a massa total se conserva numa reação."],
    ["O que o número atômico (Z) indica?", "A quantidade de prótons do átomo."],
    ["Que produtos formam a combustão completa do metano?", "CO₂ e H₂O (CH₄ + 2 O₂ → CO₂ + 2 H₂O)."],
    ["Como interpretar o pH?", "Abaixo de 7 é ácido; 7 neutro; acima de 7 básico."],
    ["O que são os gases nobres?", "Elementos da família 18 (He, Ne, Ar…), muito estáveis."],
  ],
  Física: [
    ["Qual é a fórmula da velocidade média?", "v = Δs / Δt (distância percorrida ÷ tempo)."],
    ["Qual a unidade de aceleração no SI?", "m/s²."],
    ["O que diz a Primeira Lei de Newton?", "Sem força resultante, o corpo mantém repouso ou movimento retilíneo uniforme (inércia)."],
    ["O que diz a Segunda Lei de Newton?", "F = m · a: força resultante = massa × aceleração."],
    ["O que diz a Terceira Lei de Newton?", "A toda ação corresponde uma reação de mesma intensidade e sentido oposto."],
    ["Qual é a unidade de força no SI?", "O newton (N): 1 N = 1 kg·m/s²."],
    ["Qual é a fórmula da energia cinética?", "Ec = ½ · m · v²."],
    ["Qual é a lei de Ohm?", "U = R · i (tensão = resistência × corrente)."],
    ["Quanto vale, aproximadamente, a gravidade na Terra?", "9,8 m/s² (costuma-se usar 10 m/s²)."],
    ["Qual a velocidade da luz no vácuo?", "Cerca de 300 000 km/s."],
  ],
  Geografia: [
    ["Qual bioma é exclusivamente brasileiro?", "A Caatinga."],
    ["O que a escala 1:100.000 indica?", "1 cm no mapa = 100.000 cm (1 km) no terreno."],
    ["O que a linha do Equador divide?", "A Terra em hemisférios Norte e Sul (latitude 0°)."],
    ["Quantos graus de longitude tem cada fuso horário?", "15° (360° ÷ 24 h)."],
    ["Qual é o maior bioma brasileiro?", "A Amazônia."],
    ["Qual é a região mais populosa do Brasil?", "O Sudeste."],
    ["Qual o clima do interior do Nordeste?", "Semiárido: pouca chuva, mal distribuída."],
    ["Onde ocorrem mais terremotos?", "Nos limites entre placas tectônicas."],
    ["Que rio banha Aracaju?", "O Rio Sergipe, que forma um estuário na capital."],
    ["O que são paralelos e meridianos?", "Paralelos medem a latitude; meridianos medem a longitude."],
  ],
  Inglês: [
    ["Como se forma o Present Perfect?", "have/has + particípio passado: I have studied."],
    ["Passado e particípio de “go”?", "went / gone."],
    ["Passado e particípio de “write”?", "wrote / written."],
    ["Quando usar “yet”?", "Em negativas e perguntas: She hasn’t arrived yet."],
    ["Quando usar “already”?", "Em afirmativas, para algo que já aconteceu: I have already finished."],
    ["Plural de “child”?", "Children."],
    ["Quando usar “there is” e “there are”?", "Is com singular; are com plural."],
    ["Como se forma o Present Continuous?", "am/is/are + verbo com -ing: I am studying."],
    ["Qual é o passado simples de “have”?", "Had."],
    ["Qual a diferença entre “since” e “for”?", "Since marca o início (since 2020); for marca a duração (for two years)."],
  ],
};

const SLUG: Record<Disciplina, string> = {
  Matemática: "mat",
  Biologia: "bio",
  História: "his",
  Português: "por",
  Química: "qui",
  Física: "fis",
  Geografia: "geo",
  Inglês: "ing",
};

export const FLASHCARDS: Flashcard[] = DISCIPLINAS.flatMap((d) =>
  BANCO[d].map(([pergunta, resposta], i) => ({ id: `${SLUG[d]}-${i + 1}`, disciplina: d, pergunta, resposta })),
);

/** Cartas por rodada de prática. */
export const CARTAS_POR_RODADA = 10;

/** Recompensa por dia de sequência: dias 1–7 crescem; a partir do dia 8, +50. */
export function pontosDaSequencia(dia: number) {
  const escala = [10, 15, 20, 25, 30, 40, 50];
  return dia >= 8 ? 50 : escala[Math.max(0, dia - 1)];
}

export const CATEGORIAS_RELATO = ["Estrutura", "Biblioteca", "Merenda", "Tecnologia", "Convivência", "Outro"];
