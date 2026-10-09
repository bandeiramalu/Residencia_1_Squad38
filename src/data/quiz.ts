import { hashTexto, mulberry32 } from "@/lib/aleatorio";
import type { Questao } from "./desafios";
import { DESAFIOS } from "./desafios";
import { DISCIPLINAS, type Disciplina } from "./escola";

/**
 * Banco de perguntas dos duelos e rodadas de quiz dos campeonatos.
 * Matemática e Química são as disciplinas dos campeonatos da demonstração, por isso têm mais perguntas;
 * as demais reaproveitam os desafios personalizados e ganham algumas extras para fechar um duelo de 5.
 */
const EXTRAS: Record<Disciplina, Questao[]> = {
  Matemática: [
    {
      enunciado: "Em que ponto a reta y = 2x − 6 corta o eixo x?",
      opcoes: ["x = −6", "x = 3", "x = 2", "x = 6"],
      correta: 1,
      explicacao: "No eixo x, y = 0: 2x − 6 = 0 → x = 3.",
    },
    {
      enunciado: "Qual é o coeficiente linear de f(x) = 4x − 9?",
      opcoes: ["4", "−9", "9", "−4"],
      correta: 1,
      explicacao: "É o termo independente (b): o ponto em que a reta corta o eixo y.",
    },
    {
      enunciado: "Qual destas funções tem gráfico passando pela origem (0, 0)?",
      opcoes: ["f(x) = 2x + 1", "f(x) = 5x", "f(x) = x − 3", "f(x) = 7"],
      correta: 1,
      explicacao: "Com b = 0 a função é linear: f(0) = 0.",
    },
    {
      enunciado: "Um táxi cobra R$ 5 fixos mais R$ 2 por km. Qual lei descreve o preço?",
      opcoes: ["f(x) = 5x + 2", "f(x) = 2x + 5", "f(x) = 7x", "f(x) = 2x − 5"],
      correta: 1,
      explicacao: "O valor por km é o coeficiente angular (2) e a bandeirada é o coeficiente linear (5).",
    },
    {
      enunciado: "Um táxi cobra R$ 5 fixos mais R$ 2 por km. Quanto custa uma corrida de 8 km?",
      opcoes: ["R$ 16", "R$ 21", "R$ 42", "R$ 13"],
      correta: 1,
      explicacao: "f(8) = 2·8 + 5 = 21.",
    },
    {
      enunciado: "Qual é o zero da função f(x) = 3x − 12?",
      opcoes: ["x = −4", "x = 3", "x = 4", "x = 12"],
      correta: 2,
      explicacao: "3x − 12 = 0 → x = 4.",
    },
    {
      enunciado: "Se o coeficiente angular de uma função afim é zero, o gráfico é…",
      opcoes: ["Uma reta vertical", "Uma reta horizontal", "Uma parábola", "Uma reta crescente"],
      correta: 1,
      explicacao: "f(x) = b é constante: a reta é paralela ao eixo x.",
    },
    {
      enunciado: "Duas retas paralelas (e distintas) têm…",
      opcoes: ["O mesmo coeficiente linear", "O mesmo coeficiente angular", "Coeficientes angulares opostos", "Os dois coeficientes iguais"],
      correta: 1,
      explicacao: "Mesma inclinação (a) e interceptos diferentes (b).",
    },
    {
      enunciado: "Qual é a lei da reta que passa por (0, 2) e (2, 0)?",
      opcoes: ["f(x) = x + 2", "f(x) = −x + 2", "f(x) = 2x", "f(x) = −2x + 2"],
      correta: 1,
      explicacao: "a = (0 − 2) ÷ (2 − 0) = −1 e b = 2 (corta o eixo y em 2).",
    },
    {
      enunciado: "Em f(x) = ax + b, se a > 0, a função é…",
      opcoes: ["Decrescente", "Constante", "Crescente", "Sempre negativa"],
      correta: 2,
      explicacao: "Coeficiente angular positivo: quando x aumenta, f(x) aumenta.",
    },
    {
      enunciado: "Qual ponto pertence ao gráfico de f(x) = 2x + 1?",
      opcoes: ["(1, 2)", "(2, 4)", "(3, 7)", "(0, 2)"],
      correta: 2,
      explicacao: "f(3) = 2·3 + 1 = 7.",
    },
    {
      enunciado: "A tabela x = 0, 1, 2 → y = 3, 5, 7 representa qual função?",
      opcoes: ["f(x) = 3x + 2", "f(x) = 2x + 3", "f(x) = x + 3", "f(x) = 5x"],
      correta: 1,
      explicacao: "y sobe 2 a cada unidade de x (a = 2) e vale 3 em x = 0 (b = 3).",
    },
  ],
  Química: [
    {
      enunciado: "Qual é o símbolo químico do sódio?",
      opcoes: ["S", "So", "Na", "Sd"],
      correta: 2,
      explicacao: "Na vem do latim natrium.",
    },
    {
      enunciado: "Elementos da mesma família (coluna) da tabela periódica têm…",
      opcoes: ["O mesmo número de nêutrons", "Propriedades químicas semelhantes", "A mesma massa", "O mesmo número de camadas"],
      correta: 1,
      explicacao: "Mesmo número de elétrons na camada de valência → comportamento químico parecido.",
    },
    {
      enunciado: "Qual destes elementos é um gás nobre?",
      opcoes: ["Oxigênio", "Nitrogênio", "Neônio", "Cloro"],
      correta: 2,
      explicacao: "O neônio (Ne) está na família 18, a dos gases nobres.",
    },
    {
      enunciado: "O número atômico (Z) de um elemento indica…",
      opcoes: ["O número de nêutrons", "O número de prótons", "A massa do átomo", "O número de camadas"],
      correta: 1,
      explicacao: "Z é a quantidade de prótons no núcleo — a identidade do elemento.",
    },
    {
      enunciado: "Quais coeficientes balanceiam N₂ + H₂ → NH₃?",
      opcoes: ["1, 1, 2", "1, 3, 2", "2, 3, 1", "1, 2, 3"],
      correta: 1,
      explicacao: "N₂ + 3 H₂ → 2 NH₃: 2 N e 6 H dos dois lados.",
    },
    {
      enunciado: "Qual destas é uma evidência de reação química?",
      opcoes: ["Gelo derretendo", "Açúcar dissolvendo na água", "Liberação de gás e mudança de cor", "Água fervendo"],
      correta: 2,
      explicacao: "Gás, mudança de cor, precipitado ou calor indicam novas substâncias. As outras são mudanças físicas.",
    },
    {
      enunciado: "Na combustão completa do metano (CH₄), formam-se…",
      opcoes: ["CO₂ e H₂O", "CO e H₂", "C e H₂O", "O₂ e H₂"],
      correta: 0,
      explicacao: "CH₄ + 2 O₂ → CO₂ + 2 H₂O.",
    },
    {
      enunciado: "O que diz a Lei de Lavoisier?",
      opcoes: ["A massa se conserva numa reação em sistema fechado", "A massa sempre aumenta", "Os volumes dos gases se somam", "Toda reação libera energia"],
      correta: 0,
      explicacao: "“Na natureza nada se cria, nada se perde, tudo se transforma.”",
    },
    {
      enunciado: "Qual equação está balanceada?",
      opcoes: ["2 Fe + O₂ → Fe₂O₃", "4 Fe + 3 O₂ → 2 Fe₂O₃", "Fe + 3 O₂ → Fe₂O₃", "3 Fe + 2 O₂ → Fe₂O₃"],
      correta: 1,
      explicacao: "4 Fe e 6 O de cada lado.",
    },
    {
      enunciado: "Os metais alcalinos ficam em qual família da tabela periódica?",
      opcoes: ["Família 1", "Família 17", "Família 18", "Família 2"],
      correta: 0,
      explicacao: "Li, Na, K… estão na família 1 (1A). A 2 é a dos alcalinoterrosos.",
    },
    {
      enunciado: "Uma solução com pH 3 é…",
      opcoes: ["Neutra", "Básica", "Ácida", "Salina"],
      correta: 2,
      explicacao: "Abaixo de 7 a solução é ácida; 7 é neutra; acima, básica.",
    },
    {
      enunciado: "Qual gás é liberado em Zn + 2 HCl → ZnCl₂ + H₂?",
      opcoes: ["Cloro", "Hidrogênio", "Oxigênio", "Gás carbônico"],
      correta: 1,
      explicacao: "O zinco desloca o hidrogênio do ácido: sai H₂.",
    },
  ],
  História: [
    {
      enunciado: "Em que ano foi assinado o Tratado de Versalhes?",
      opcoes: ["1914", "1917", "1919", "1945"],
      correta: 2,
      explicacao: "Em 1919, encerrando formalmente a guerra com a Alemanha.",
    },
    {
      enunciado: "Que tipo de combate marcou a frente ocidental da Primeira Guerra?",
      opcoes: ["Guerra de trincheiras", "Guerra relâmpago", "Guerrilha urbana", "Só batalhas navais"],
      correta: 0,
      explicacao: "As trincheiras travaram o avanço dos dois lados por anos.",
    },
  ],
  Biologia: [
    {
      enunciado: "Onde fica o material genético nas células eucariontes?",
      opcoes: ["Na parede celular", "No núcleo", "No ribossomo", "No vacúolo"],
      correta: 1,
      explicacao: "O DNA fica protegido dentro do núcleo, envolto pela carioteca.",
    },
    {
      enunciado: "A mitose produz células…",
      opcoes: ["Haploides e diferentes", "Idênticas à célula-mãe", "Sem núcleo", "Somente gametas"],
      correta: 1,
      explicacao: "São duas células diploides geneticamente iguais à original.",
    },
  ],
  Geografia: [
    {
      enunciado: "Qual rio banha Aracaju e dá nome ao estado?",
      opcoes: ["Rio São Francisco", "Rio Sergipe", "Rio Vaza-Barris", "Rio Real"],
      correta: 1,
      explicacao: "Aracaju fica no estuário do Rio Sergipe.",
    },
    {
      enunciado: "Qual é o maior bioma brasileiro em área?",
      opcoes: ["Cerrado", "Amazônia", "Mata Atlântica", "Caatinga"],
      correta: 1,
      explicacao: "A Amazônia ocupa quase metade do território nacional.",
    },
  ],
  Física: [
    {
      enunciado: "Qual é a unidade de força no SI?",
      opcoes: ["Joule", "Watt", "Newton", "Pascal"],
      correta: 2,
      explicacao: "1 N é a força que acelera 1 kg a 1 m/s².",
    },
    {
      enunciado: "Sem resistência do ar, um objeto em queda livre acelera cerca de…",
      opcoes: ["1 m/s²", "10 m/s²", "100 m/s²", "0 m/s²"],
      correta: 1,
      explicacao: "A gravidade na superfície da Terra é de aproximadamente 9,8 m/s².",
    },
  ],
  Português: [
    {
      enunciado: '"O vento sussurrava segredos" é um exemplo de…',
      opcoes: ["Prosopopeia", "Hipérbole", "Metonímia", "Antítese"],
      correta: 0,
      explicacao: "Ação humana atribuída a um ser inanimado: prosopopeia (personificação).",
    },
    {
      enunciado: '"Ele partiu desta para melhor" é…',
      opcoes: ["Eufemismo", "Pleonasmo", "Ironia", "Metáfora"],
      correta: 0,
      explicacao: "Suaviza uma ideia dura (a morte): eufemismo.",
    },
  ],
  Inglês: [
    {
      enunciado: 'Complete: "She ___ lived here since 2020."',
      opcoes: ["have", "has", "is", "was"],
      correta: 1,
      explicacao: "He/she/it + has + particípio.",
    },
    {
      enunciado: 'Qual é o particípio passado de "write"?',
      opcoes: ["wrote", "writed", "written", "writing"],
      correta: 2,
      explicacao: "write → wrote → written.",
    },
  ],
};

/** Perguntas complementares: fecham pelo menos 10 por disciplina (desafios + extras + estas). */
const MAIS: Partial<Record<Disciplina, Questao[]>> = {
  História: [
    { enunciado: "Quem proclamou a Independência do Brasil, em 7 de setembro de 1822?", opcoes: ["D. João VI", "D. Pedro I", "Tiradentes", "Marechal Deodoro"], correta: 1, explicacao: "D. Pedro I declarou a independência às margens do riacho do Ipiranga." },
    { enunciado: "Qual lei aboliu a escravidão no Brasil, em 1888?", opcoes: ["Lei do Ventre Livre", "Lei Eusébio de Queirós", "Lei Áurea", "Lei dos Sexagenários"], correta: 2, explicacao: "A Lei Áurea, assinada pela princesa Isabel em 13 de maio de 1888, extinguiu a escravidão." },
    { enunciado: "Qual era o lema da Revolução Francesa (1789)?", opcoes: ["Ordem e Progresso", "Liberdade, Igualdade e Fraternidade", "Deus, Pátria e Família", "Paz, Pão e Terra"], correta: 1, explicacao: "“Liberdade, Igualdade e Fraternidade” resumia os ideais iluministas da revolução." },
    { enunciado: "Que regime de governo foi implantado no Brasil em 15 de novembro de 1889?", opcoes: ["Monarquia", "República", "Ditadura militar", "Regência"], correta: 1, explicacao: "O marechal Deodoro da Fonseca proclamou a República, pondo fim ao Império." },
    { enunciado: "Em que país começou a Revolução Industrial, no século XVIII?", opcoes: ["Estados Unidos", "França", "Inglaterra", "Alemanha"], correta: 2, explicacao: "A Inglaterra reunia carvão, ferro, capital e mercado consumidor; a máquina a vapor impulsionou as fábricas." },
  ],
  Biologia: [
    { enunciado: "Na molécula de DNA, a adenina (A) se emparelha com…", opcoes: ["Citosina", "Guanina", "Timina", "Uracila"], correta: 2, explicacao: "A pareia com T e C pareia com G. A uracila aparece no RNA, no lugar da timina." },
    { enunciado: "Em que organela ocorre a fotossíntese?", opcoes: ["Mitocôndria", "Cloroplasto", "Ribossomo", "Lisossomo"], correta: 1, explicacao: "Os cloroplastos têm clorofila, que capta a luz para produzir glicose." },
    { enunciado: "Qual célula do sangue transporta oxigênio?", opcoes: ["Leucócito", "Plaqueta", "Hemácia", "Linfócito"], correta: 2, explicacao: "As hemácias contêm hemoglobina, que se liga ao oxigênio." },
    { enunciado: "Numa cadeia alimentar, os produtores são…", opcoes: ["Animais herbívoros", "Seres autótrofos, como as plantas", "Decompositores", "Carnívoros de topo"], correta: 1, explicacao: "Produzem o próprio alimento (fotossíntese) e sustentam os demais níveis." },
    { enunciado: "No cruzamento Aa × Aa (dominância completa), que proporção de descendentes tem o fenótipo dominante?", opcoes: ["1/4", "1/2", "3/4", "100%"], correta: 2, explicacao: "AA, Aa e Aa mostram o fenótipo dominante (3 de 4); só aa mostra o recessivo." },
  ],
  Geografia: [
    { enunciado: "A linha do Equador divide a Terra em…", opcoes: ["Leste e Oeste", "Hemisfério Norte e Hemisfério Sul", "Trópicos e polos", "Oriente e Ocidente"], correta: 1, explicacao: "O Equador (latitude 0°) separa os hemisférios Norte e Sul." },
    { enunciado: "Qual é a região mais populosa do Brasil?", opcoes: ["Nordeste", "Sul", "Sudeste", "Centro-Oeste"], correta: 2, explicacao: "O Sudeste concentra cerca de 40% dos habitantes do país." },
    { enunciado: "A Terra gira 360° em 24 horas. Quantos graus de longitude tem cada fuso horário?", opcoes: ["10°", "15°", "24°", "30°"], correta: 1, explicacao: "360° ÷ 24 h = 15° por hora (por fuso)." },
    { enunciado: "Qual é o clima predominante no interior do Nordeste, onde está a Caatinga?", opcoes: ["Equatorial", "Semiárido", "Subtropical", "Polar"], correta: 1, explicacao: "O semiárido tem chuvas escassas e irregulares." },
    { enunciado: "Onde os terremotos são mais frequentes?", opcoes: ["No centro das placas tectônicas", "Nos limites entre placas tectônicas", "Só nos desertos", "Só no hemisfério Sul"], correta: 1, explicacao: "O atrito e o choque entre placas liberam energia nas bordas." },
  ],
  Física: [
    { enunciado: "A Primeira Lei de Newton é também chamada de lei da…", opcoes: ["Ação e reação", "Inércia", "Gravitação", "Conservação da energia"], correta: 1, explicacao: "Um corpo mantém o repouso ou o movimento retilíneo uniforme se a força resultante é nula." },
    { enunciado: "Uma força resultante acelera um corpo de 2 kg a 3 m/s². Qual é o valor da força?", opcoes: ["1,5 N", "5 N", "6 N", "9 N"], correta: 2, explicacao: "F = m · a = 2 · 3 = 6 N." },
    { enunciado: "Qual é, aproximadamente, a velocidade da luz no vácuo?", opcoes: ["300 km/s", "3 000 km/s", "300 000 km/s", "3 000 000 km/s"], correta: 2, explicacao: "Cerca de 3 × 10⁸ m/s, ou 300 000 km/s." },
    { enunciado: "A energia cinética de um corpo depende…", opcoes: ["Só da altura", "Da massa e da velocidade", "Só da temperatura", "Da cor do corpo"], correta: 1, explicacao: "Ec = ½ · m · v²." },
    { enunciado: "Um resistor de 10 Ω é percorrido por 2 A. Qual é a tensão sobre ele?", opcoes: ["5 V", "12 V", "20 V", "0,2 V"], correta: 2, explicacao: "Lei de Ohm: U = R · i = 10 · 2 = 20 V." },
  ],
  Português: [
    { enunciado: 'Na frase "Choveu muito ontem", o sujeito é…', opcoes: ["Simples", "Composto", "Oculto", "Inexistente (oração sem sujeito)"], correta: 3, explicacao: "Verbos que indicam fenômenos da natureza não têm sujeito." },
    { enunciado: "Qual é o plural de “cidadão”?", opcoes: ["Cidadões", "Cidadães", "Cidadãos", "Cidadans"], correta: 2, explicacao: "O plural de cidadão é cidadãos (como mão → mãos)." },
    { enunciado: 'Complete: "Estudei muito, ___ não consegui terminar."', opcoes: ["mais", "mas", "más", "mal"], correta: 1, explicacao: "“Mas” indica oposição (equivale a “porém”). “Mais” indica quantidade." },
    { enunciado: "Por que “fácil” recebe acento?", opcoes: ["É oxítona terminada em L", "É paroxítona terminada em L", "É proparoxítona", "Tem hiato"], correta: 1, explicacao: "Paroxítonas terminadas em L são acentuadas: fá-cil, di-fí-cil, mís-sil." },
    { enunciado: "Qual é o antônimo de “efêmero”?", opcoes: ["Passageiro", "Breve", "Duradouro", "Veloz"], correta: 2, explicacao: "Efêmero é o que dura pouco; o oposto é duradouro." },
  ],
  Inglês: [
    { enunciado: 'Qual é o passado simples de "go"?', opcoes: ["goed", "went", "gone", "going"], correta: 1, explicacao: 'Go → went → gone (verbo irregular).' },
    { enunciado: 'Complete: "There ___ two books on the table."', opcoes: ["is", "are", "be", "am"], correta: 1, explicacao: "Com plural (two books) usa-se “there are”." },
    { enunciado: 'Qual é o plural de "child"?', opcoes: ["childs", "childes", "children", "childrens"], correta: 2, explicacao: "Child → children (plural irregular)." },
    { enunciado: 'Complete: "I ___ studying English now."', opcoes: ["is", "are", "am", "be"], correta: 2, explicacao: 'Com "I" usa-se "am": I am studying.' },
  ],
};

/** Banco completo por disciplina (desafios + extras + complementares): pelo menos 10 perguntas cada. */
export const QUIZ: Record<Disciplina, Questao[]> = Object.fromEntries(
  DISCIPLINAS.map((d) => [d, [...DESAFIOS[d].questoes, ...EXTRAS[d], ...(MAIS[d] ?? [])]]),
) as Record<Disciplina, Questao[]>;

function embaralhar<T>(lista: readonly T[], rnd: () => number) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/**
 * Perguntas de um duelo/rodada. A mesma semente (ex.: id da partida) sempre gera as mesmas perguntas,
 * na mesma ordem e com as alternativas embaralhadas — os dois lados de um duelo respondem a mesma prova.
 * Sem disciplina (ou com banco pequeno), completa com perguntas das outras matérias.
 */
export function perguntasDoDuelo(disciplina: Disciplina | undefined, semente: string, qtd = 5): Questao[] {
  const rnd = mulberry32(hashTexto(`${disciplina ?? "geral"}:${semente}`));
  const principal = disciplina ? embaralhar(QUIZ[disciplina], rnd) : [];
  const resto = embaralhar(
    DISCIPLINAS.filter((d) => d !== disciplina).flatMap((d) => QUIZ[d]),
    rnd,
  );
  return [...principal, ...resto].slice(0, qtd).map((q) => {
    const ordem = embaralhar(
      q.opcoes.map((_, i) => i),
      rnd,
    );
    return { ...q, opcoes: ordem.map((i) => q.opcoes[i]), correta: ordem.indexOf(q.correta) };
  });
}
