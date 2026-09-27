import type { Disciplina } from "./escola";

export interface Questao {
  enunciado: string;
  opcoes: string[];
  correta: number;
  explicacao: string;
}

/** Banco de questões usado pelos desafios personalizados (US09B). */
export const DESAFIOS: Record<Disciplina, { tema: string; questoes: Questao[] }> = {
  História: {
    tema: "Primeira Guerra Mundial",
    questoes: [
      {
        enunciado: "Qual evento é considerado o estopim da Primeira Guerra Mundial?",
        opcoes: ["A Revolução Russa", "O atentado de Sarajevo", "O Tratado de Versalhes", "A queda da Bastilha"],
        correta: 1,
        explicacao: "O assassinato do arquiduque Francisco Ferdinando em Sarajevo (1914) disparou o conflito.",
      },
      {
        enunciado: "Qual destas é uma causa ESTRUTURAL da guerra?",
        opcoes: ["O atentado de 1914", "A corrida imperialista", "A trégua de Natal", "A gripe espanhola"],
        correta: 1,
        explicacao: "Imperialismo, nacionalismo e corrida armamentista vinham se acumulando havia décadas.",
      },
      {
        enunciado: "Quais países formavam a Tríplice Entente?",
        opcoes: ["Alemanha, Áustria-Hungria e Itália", "Reino Unido, França e Rússia", "EUA, Japão e China", "Brasil, Portugal e Espanha"],
        correta: 1,
        explicacao: "Reino Unido, França e Rússia formavam a Entente.",
      },
    ],
  },
  Biologia: {
    tema: "Divisão celular",
    questoes: [
      {
        enunciado: "Em que fase ocorre o crossing-over?",
        opcoes: ["Prófase I", "Prófase II", "Anáfase da mitose", "Telófase II"],
        correta: 0,
        explicacao: "Os homólogos pareiam e trocam segmentos na prófase I da meiose.",
      },
      {
        enunciado: "Quantas células a meiose produz a partir de uma célula?",
        opcoes: ["Duas", "Três", "Quatro", "Oito"],
        correta: 2,
        explicacao: "São quatro células haploides (n).",
      },
      {
        enunciado: "Qual organela produz energia (ATP) para a célula?",
        opcoes: ["Ribossomo", "Mitocôndria", "Complexo golgiense", "Lisossomo"],
        correta: 1,
        explicacao: "A respiração celular acontece na mitocôndria.",
      },
    ],
  },
  Geografia: {
    tema: "Biomas brasileiros",
    questoes: [
      {
        enunciado: "Qual bioma é exclusivamente brasileiro e predomina no interior de Sergipe?",
        opcoes: ["Pampa", "Caatinga", "Pantanal", "Amazônia"],
        correta: 1,
        explicacao: "A Caatinga só existe no Brasil e ocupa boa parte do Nordeste.",
      },
      {
        enunciado: "O que a escala 1:100.000 indica num mapa?",
        opcoes: ["1 cm = 1 km", "1 cm = 100 m", "1 cm = 10 km", "1 cm = 1 km²"],
        correta: 0,
        explicacao: "100.000 cm = 1 km.",
      },
      {
        enunciado: "Qual bioma costeiro aparece no litoral de Aracaju?",
        opcoes: ["Mata Atlântica e restinga", "Cerrado", "Pampa", "Mata de Araucárias"],
        correta: 0,
        explicacao: "O litoral sergipano tem restingas e manguezais associados à Mata Atlântica.",
      },
    ],
  },
  Física: {
    tema: "Cinemática",
    questoes: [
      {
        enunciado: "Um carro percorre 120 km em 2 h. Qual é a velocidade média?",
        opcoes: ["40 km/h", "60 km/h", "80 km/h", "240 km/h"],
        correta: 1,
        explicacao: "120 km ÷ 2 h = 60 km/h.",
      },
      {
        enunciado: "Qual unidade mede aceleração no SI?",
        opcoes: ["m/s", "m/s²", "N", "km/h"],
        correta: 1,
        explicacao: "Aceleração é variação de velocidade por tempo: m/s².",
      },
      {
        enunciado: "Se a velocidade é constante, a aceleração é…",
        opcoes: ["Positiva", "Negativa", "Zero", "Infinita"],
        correta: 2,
        explicacao: "Sem variação de velocidade, a aceleração é zero.",
      },
    ],
  },
  Matemática: {
    tema: "Função afim",
    questoes: [
      {
        enunciado: "Na função f(x) = −2x + 5, a reta é…",
        opcoes: ["Crescente", "Decrescente", "Constante", "Uma parábola"],
        correta: 1,
        explicacao: "Coeficiente angular negativo → reta decrescente.",
      },
      {
        enunciado: "Qual o coeficiente angular da reta que passa por (1, 3) e (3, 7)?",
        opcoes: ["1", "2", "3", "4"],
        correta: 1,
        explicacao: "(7 − 3) ÷ (3 − 1) = 2.",
      },
      {
        enunciado: "Em f(x) = 3x + 1, quanto vale f(2)?",
        opcoes: ["5", "6", "7", "9"],
        correta: 2,
        explicacao: "3·2 + 1 = 7.",
      },
    ],
  },
  Português: {
    tema: "Figuras de linguagem",
    questoes: [
      {
        enunciado: '"Seus olhos são duas luas" é um exemplo de…',
        opcoes: ["Comparação", "Metáfora", "Hipérbole", "Metonímia"],
        correta: 1,
        explicacao: "Semelhança implícita, sem conectivo: metáfora.",
      },
      {
        enunciado: '"Já te disse um milhão de vezes" é…',
        opcoes: ["Hipérbole", "Eufemismo", "Ironia", "Antítese"],
        correta: 0,
        explicacao: "Exagero intencional: hipérbole.",
      },
      {
        enunciado: '"Li Machado de Assis nas férias" é…',
        opcoes: ["Metáfora", "Metonímia", "Prosopopeia", "Pleonasmo"],
        correta: 1,
        explicacao: "O autor está no lugar da obra: metonímia.",
      },
    ],
  },
  Química: {
    tema: "Reações químicas",
    questoes: [
      {
        enunciado: "Como fica balanceada a reação H₂ + O₂ → H₂O?",
        opcoes: ["H₂ + O₂ → H₂O", "2 H₂ + O₂ → 2 H₂O", "H₂ + 2 O₂ → H₂O", "2 H₂ + 2 O₂ → H₂O"],
        correta: 1,
        explicacao: "4 H e 2 O dos dois lados.",
      },
      {
        enunciado: "Ácido + base produz…",
        opcoes: ["Sal + água", "Óxido + gás", "Somente água", "Um novo ácido"],
        correta: 0,
        explicacao: "É a reação de neutralização.",
      },
      {
        enunciado: "Qual é a fórmula do ácido sulfúrico?",
        opcoes: ["HCl", "H₂SO₄", "HNO₃", "NaOH"],
        correta: 1,
        explicacao: "H₂SO₄.",
      },
    ],
  },
  Inglês: {
    tema: "Present Perfect",
    questoes: [
      {
        enunciado: 'Complete: "I ___ already finished my homework."',
        opcoes: ["has", "have", "had been", "am"],
        correta: 1,
        explicacao: "I/you/we/they + have + particípio.",
      },
      {
        enunciado: '"Have you ever ___ to Aracaju?"',
        opcoes: ["go", "went", "been", "going"],
        correta: 2,
        explicacao: '"Have you ever been…" é a forma usual.',
      },
      {
        enunciado: 'Qual palavra usamos em negativas: "She hasn\'t arrived ___."',
        opcoes: ["already", "yet", "ever", "since"],
        correta: 1,
        explicacao: '"Yet" aparece em negativas e perguntas.',
      },
    ],
  },
};
