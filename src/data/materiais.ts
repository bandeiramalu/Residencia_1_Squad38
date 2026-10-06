/**
 * Conteúdo real dos PDFs de material (feed, atividades e materiais criados no app).
 * Cada entrada vira um PDF de várias páginas em `src/lib/pdf.ts`.
 */
import type { Bloco } from "@/lib/pdf";
import type { Disciplina } from "./escola";

export interface ConteudoMaterial {
  titulo: string;
  disciplina: Disciplina;
  autor: string;
  blocos: Bloco[];
}

const LISTA_7: ConteudoMaterial = {
  titulo: "Lista 7 — Funções afins",
  disciplina: "Matemática",
  autor: "Prof. Ricardo Nogueira",
  blocos: [
    { tipo: "paragrafo", texto: "Lista de 10 exercícios do 9º ano sobre função afim, com gabarito comentado ao final. Resolva no caderno, mostrando o raciocínio, e só depois confira o gabarito." },
    { tipo: "secao", texto: "Revisão rápida" },
    {
      tipo: "paragrafo",
      texto:
        "Uma função afim tem lei f(x) = ax + b, com a e b números reais e a diferente de zero. O gráfico é sempre uma reta. O coeficiente angular (a) indica a inclinação da reta; o coeficiente linear (b) é o valor de f(0), isto é, o ponto onde a reta corta o eixo y.",
    },
    {
      tipo: "quadro",
      titulo: "Lembre-se",
      texto: [
        "Se a > 0, a função é crescente; se a < 0, é decrescente.",
        "O zero da função é o valor de x para o qual f(x) = 0, ou seja, x = -b / a.",
        "Dados dois pontos (x1, y1) e (x2, y2), o coeficiente angular é a = (y2 - y1) / (x2 - x1).",
      ],
    },
    { tipo: "paragrafo", texto: "Exemplo de tabela para f(x) = 2x - 1:" },
    {
      tipo: "tabela",
      colunas: ["x", "Cálculo", "f(x)"],
      linhas: [
        ["-2", "2 · (-2) - 1", "-5"],
        ["-1", "2 · (-1) - 1", "-3"],
        ["0", "2 · 0 - 1", "-1"],
        ["1", "2 · 1 - 1", "1"],
        ["2", "2 · 2 - 1", "3"],
      ],
    },
    { tipo: "secao", texto: "Exercícios" },
    {
      tipo: "numerada",
      itens: [
        "Dada a função f(x) = 3x - 5, calcule f(0), f(2) e f(-1).",
        "Determine o zero da função f(x) = 2x + 8.",
        "Classifique cada função como crescente ou decrescente: a) f(x) = 5x - 1; b) g(x) = -2x + 7; c) h(x) = 0,5x + 3.",
        "O gráfico de uma função afim passa pelos pontos A(1, 3) e B(3, 7). Determine o coeficiente angular e a lei da função.",
        "Uma função f(x) = ax + b é tal que f(0) = 4 e f(2) = 10. Encontre a e b.",
        "Uma corrida de táxi custa R$ 6,00 de bandeirada mais R$ 2,50 por quilômetro rodado. Escreva a função que dá o preço C em função da distância x (em km) e calcule o preço de uma corrida de 12 km.",
        "Um plano de celular cobra R$ 30,00 fixos por mês mais R$ 0,50 por GB excedente. Em um mês, a fatura foi de R$ 42,00. Quantos GB excedentes foram usados?",
        "Determine os pontos em que o gráfico de f(x) = -x + 6 corta o eixo y e o eixo x.",
        "Para que valores de k a função f(x) = (k - 2)x + 5 é crescente? E decrescente? E constante?",
        "Uma loja A aluga bicicletas por R$ 20,00 de taxa fixa mais R$ 4,00 por hora. A loja B cobra R$ 8,00 por hora, sem taxa. A partir de quantas horas a loja A fica mais barata que a B?",
      ],
    },
    {
      tipo: "gabarito",
      titulo: "Gabarito comentado",
      itens: [
        "f(0) = 3 · 0 - 5 = -5; f(2) = 3 · 2 - 5 = 1; f(-1) = 3 · (-1) - 5 = -8.",
        "Faça 2x + 8 = 0, então 2x = -8 e x = -4. O zero da função é -4.",
        "O sinal de a decide: a) a = 5 > 0, crescente; b) a = -2 < 0, decrescente; c) a = 0,5 > 0, crescente.",
        "a = (7 - 3) / (3 - 1) = 2. Substituindo A(1, 3) em y = 2x + b: 3 = 2 + b, logo b = 1. A lei é f(x) = 2x + 1.",
        "f(0) = b = 4. Em f(2) = 2a + 4 = 10, temos 2a = 6 e a = 3. Resposta: a = 3 e b = 4, ou seja, f(x) = 3x + 4.",
        "C(x) = 6 + 2,5x. Para 12 km: C(12) = 6 + 2,5 · 12 = 6 + 30 = R$ 36,00.",
        "A fatura é 30 + 0,5x = 42. Então 0,5x = 12 e x = 24. Foram usados 24 GB excedentes.",
        "No eixo y, x = 0 e f(0) = 6, ponto (0, 6). No eixo x, f(x) = 0 e -x + 6 = 0, logo x = 6, ponto (6, 0).",
        "Crescente quando k - 2 > 0, isto é, k > 2. Decrescente quando k - 2 < 0, isto é, k < 2. Constante quando k = 2 (nesse caso a função deixa de ser afim).",
        "Queremos 20 + 4x < 8x. Então 20 < 4x e x > 5. Com 5 horas os preços são iguais (R$ 40,00); a loja A é mais barata a partir de mais de 5 horas.",
      ],
    },
  ],
};

const CITOLOGIA: ConteudoMaterial = {
  titulo: "Aula 12 — Citologia: mapa mental",
  disciplina: "Biologia",
  autor: "Profª. Denise Albuquerque",
  blocos: [
    { tipo: "paragrafo", texto: "Resumo estruturado da aula 12, no formato de mapa mental em tópicos. Use-o para revisar antes do relatório da aula prática." },
    { tipo: "secao", texto: "1. A célula e a teoria celular" },
    {
      tipo: "marcadores",
      itens: [
        "Todos os seres vivos são formados por uma ou mais células.",
        "A célula é a unidade básica da estrutura e do funcionamento dos seres vivos.",
        "Toda célula se origina de outra célula pré-existente.",
        "Seres unicelulares (bactérias, protozoários) têm uma só célula; pluricelulares (plantas, animais) têm muitas.",
      ],
    },
    { tipo: "secao", texto: "2. Membrana plasmática" },
    {
      tipo: "paragrafo",
      texto:
        "Envolve todas as células e controla o que entra e o que sai. É formada por uma camada dupla de fosfolipídios com proteínas inseridas (modelo mosaico fluido). Tem permeabilidade seletiva.",
    },
    {
      tipo: "tabela",
      colunas: ["Transporte", "Gasta energia?", "Como acontece"],
      larguras: [1.3, 1, 2.5],
      linhas: [
        ["Difusão simples", "Não", "Substâncias passam a favor do gradiente de concentração (do mais para o menos concentrado)."],
        ["Osmose", "Não", "Passagem de água através da membrana, do meio menos concentrado para o mais concentrado em solutos."],
        ["Difusão facilitada", "Não", "Usa proteínas transportadoras, também a favor do gradiente."],
        ["Transporte ativo", "Sim (ATP)", "Contra o gradiente de concentração, como a bomba de sódio e potássio."],
        ["Endocitose e exocitose", "Sim", "Entrada (fagocitose, pinocitose) e saída de partículas grandes em vesículas."],
      ],
    },
    {
      tipo: "quadro",
      titulo: "Lembre-se",
      texto: "Fora da membrana, algumas células têm parede celular: celulose nas plantas, quitina nos fungos e peptideoglicano nas bactérias. A parede dá sustentação, mas não controla a entrada de substâncias como a membrana.",
    },
    { tipo: "secao", texto: "3. Citoplasma e organelas" },
    {
      tipo: "paragrafo",
      texto: "O citoplasma é o espaço entre a membrana e o núcleo. Contém o citosol (líquido com água, sais e proteínas), o citoesqueleto (rede de fibras que dá forma e movimento) e as organelas.",
    },
    {
      tipo: "tabela",
      colunas: ["Organela", "Presente em", "Função"],
      larguras: [1.4, 1.3, 3],
      linhas: [
        ["Mitocôndria", "Eucariontes", "Respiração celular: converte a energia dos nutrientes em ATP."],
        ["Ribossomo", "Todas as células", "Síntese de proteínas. Não tem membrana."],
        ["Retículo endoplasmático rugoso", "Eucariontes", "Possui ribossomos; produz e transporta proteínas."],
        ["Retículo endoplasmático liso", "Eucariontes", "Produz lipídios e desintoxica a célula."],
        ["Complexo golgiense", "Eucariontes", "Modifica, empacota e envia proteínas em vesículas."],
        ["Lisossomo", "Células animais", "Digestão intracelular, com enzimas digestivas."],
        ["Peroxissomo", "Eucariontes", "Decompõe a água oxigenada e lipídios."],
        ["Centríolos", "Animais e alguns protistas", "Participam da divisão celular."],
        ["Cloroplasto", "Plantas e algas", "Fotossíntese: produz glicose usando luz, água e gás carbônico."],
        ["Vacúolo", "Mais desenvolvido nas plantas", "Armazena água e substâncias; ajuda a manter a turgidez."],
      ],
    },
    { tipo: "secao", texto: "4. Núcleo" },
    {
      tipo: "marcadores",
      itens: [
        "Envoltório nuclear: dupla membrana com poros que controlam a troca com o citoplasma.",
        "Cromatina: DNA associado a proteínas. Ao se condensar na divisão celular, forma os cromossomos.",
        "Nucléolo: região onde se produz o RNA dos ribossomos.",
        "Função: guardar o material genético e comandar as atividades da célula.",
      ],
    },
    { tipo: "secao", texto: "5. Procarionte × eucarionte" },
    {
      tipo: "tabela",
      colunas: ["Característica", "Procarionte", "Eucarionte"],
      larguras: [1.4, 2, 2],
      linhas: [
        ["Núcleo", "Ausente: DNA solto no citoplasma (nucleoide)", "Presente, delimitado por envoltório nuclear"],
        ["Organelas com membrana", "Ausentes (só ribossomos)", "Presentes"],
        ["Tamanho", "Em geral menor (1 a 10 micrômetros)", "Em geral maior (10 a 100 micrômetros)"],
        ["Exemplos", "Bactérias e arqueas", "Animais, plantas, fungos e protistas"],
      ],
    },
    { tipo: "secao", texto: "6. Célula animal × célula vegetal" },
    {
      tipo: "tabela",
      colunas: ["Característica", "Célula animal", "Célula vegetal"],
      larguras: [1.4, 2, 2],
      linhas: [
        ["Parede celular", "Ausente", "Presente (celulose)"],
        ["Cloroplastos", "Ausentes", "Presentes nas partes verdes"],
        ["Vacúolo", "Pequenos e numerosos", "Um grande vacúolo central"],
        ["Centríolos", "Presentes", "Ausentes (nas plantas com flores)"],
        ["Forma", "Variável, arredondada", "Mais fixa, geralmente retangular"],
      ],
    },
    { tipo: "secao", texto: "Revisão rápida" },
    {
      tipo: "numerada",
      itens: [
        "Qual organela é a principal responsável pela produção de ATP?",
        "Cite duas diferenças entre uma célula animal e uma célula vegetal.",
        "Por que a bactéria é chamada de procarionte?",
        "A osmose gasta energia? Explique.",
      ],
    },
    {
      tipo: "gabarito",
      itens: [
        "A mitocôndria, por meio da respiração celular.",
        "Por exemplo: a célula vegetal tem parede celular e cloroplastos; a animal tem centríolos e não tem parede.",
        "Porque seu DNA não fica dentro de um núcleo delimitado por membrana (não há núcleo verdadeiro).",
        "Não. É um transporte passivo: a água passa a favor do gradiente, sem gasto de ATP.",
      ],
    },
  ],
};

const PRESENT_PERFECT: ConteudoMaterial = {
  titulo: "Unit 5 — Present Perfect",
  disciplina: "Inglês",
  autor: "Teacher Daniel Martins",
  blocos: [
    { tipo: "paragrafo", texto: "Material de apoio da Unit 5 (Programa Bilíngue). Explicações em português, exemplos em inglês, exercícios e answer key." },
    { tipo: "secao", texto: "Como formar" },
    {
      tipo: "paragrafo",
      texto: "O Present Perfect usa o verbo auxiliar have (ou has, na 3ª pessoa do singular: he, she, it) mais o past participle do verbo principal.",
    },
    {
      tipo: "tabela",
      colunas: ["Forma", "Estrutura", "Exemplo"],
      larguras: [1, 2, 2.2],
      linhas: [
        ["Afirmativa", "Sujeito + have/has + participle", "She has visited London."],
        ["Negativa", "Sujeito + haven't/hasn't + participle", "They haven't finished."],
        ["Pergunta", "Have/Has + sujeito + participle?", "Have you ever eaten sushi?"],
        ["Resposta curta", "Yes, I have. / No, he hasn't.", "Has she called? No, she hasn't."],
      ],
    },
    { tipo: "secao", texto: "Quando usar" },
    {
      tipo: "numerada",
      itens: [
        "Experiências de vida, sem dizer quando: I have been to Salvador.",
        "Ações recentes com resultado no presente: I have lost my keys (e ainda não os encontrei).",
        "Situações que começaram no passado e continuam, com for (duração) e since (ponto de início): We have lived here since 2020. He has studied English for five years.",
      ],
    },
    {
      tipo: "quadro",
      titulo: "Lembre-se",
      texto: "Com o Present Perfect não se diz quando a ação aconteceu. Se houver tempo definido (yesterday, last week, in 2019), use o Simple Past: I saw that movie yesterday.",
    },
    { tipo: "secao", texto: "Ever, never, already, yet, just" },
    {
      tipo: "tabela",
      colunas: ["Palavra", "Significado", "Posição e exemplo"],
      larguras: [0.9, 1.6, 3],
      linhas: [
        ["ever", "alguma vez", "Em perguntas, antes do participle: Have you ever been to Rio?"],
        ["never", "nunca", "Em frases afirmativas com sentido negativo: I have never travelled by plane."],
        ["already", "já", "Em afirmativas, antes do participle ou no fim: He has already written the report."],
        ["yet", "ainda / já", "No fim de negativas e perguntas: They haven't arrived yet. Have you finished yet?"],
        ["just", "acabou de", "Antes do participle: The bus has just arrived."],
      ],
    },
    { tipo: "secao", texto: "Past participles úteis" },
    {
      tipo: "tabela",
      colunas: ["Base form", "Simple Past", "Past participle", "Tradução"],
      larguras: [1.2, 1.2, 1.4, 1.4],
      linhas: [
        ["be", "was / were", "been", "ser / estar"],
        ["go", "went", "gone", "ir"],
        ["do", "did", "done", "fazer"],
        ["see", "saw", "seen", "ver"],
        ["eat", "ate", "eaten", "comer"],
        ["write", "wrote", "written", "escrever"],
        ["take", "took", "taken", "levar / pegar"],
        ["make", "made", "made", "fazer / criar"],
        ["buy", "bought", "bought", "comprar"],
        ["have", "had", "had", "ter"],
        ["read", "read", "read", "ler"],
        ["visit", "visited", "visited", "visitar (regular: + ed)"],
      ],
    },
    {
      tipo: "quadro",
      titulo: "Been × gone",
      texto: [
        "She has been to Paris: ela foi e já voltou.",
        "She has gone to Paris: ela foi e ainda está lá.",
      ],
    },
    { tipo: "secao", texto: "Exercises" },
    {
      tipo: "numerada",
      itens: [
        "Complete with have or has: She ___ visited London twice.",
        "Complete the negative sentence: They ___ (not / finish) their homework yet.",
        "Make the question: ___ you ever ___ (eat) sushi?",
        "Complete: He has already ___ (write) the report.",
        "Choose the correct word (ever / never): Have you ___ been to Salvador?",
        "Correct the mistake: I have saw that movie.",
        "Put the words in order: just / has / arrived / the bus.",
        "Translate to English: Eu nunca viajei de avião.",
        "Complete with for or since: We have lived here ___ 2020.",
        "Complete with for or since: He has studied English ___ five years.",
      ],
    },
    {
      tipo: "gabarito",
      titulo: "Answer key",
      itens: [
        "has (She é 3ª pessoa do singular).",
        "haven't finished.",
        "Have ... eaten.",
        "written.",
        "ever (em perguntas usa-se ever).",
        "I have seen that movie. (participle de see é seen, não saw).",
        "The bus has just arrived.",
        "I have never travelled by plane. (também aceito: traveled).",
        "since (since marca o ponto de início: 2020).",
        "for (for marca a duração: five years).",
      ],
    },
  ],
};

/** Conteúdo cadastrado por nome de arquivo. */
export const MATERIAIS: Record<string, ConteudoMaterial> = {
  "lista-7-funcoes-afins.pdf": LISTA_7,
  "aula-12-citologia-mapa-mental.pdf": CITOLOGIA,
  "unit-5-present-perfect.pdf": PRESENT_PERFECT,
};

/* ───────────── Guias de estudo (materiais criados no app) ───────────── */

type Guia = { autor: string; intro: string; secoes: Bloco[]; lembrete: string[]; perguntas: string[]; respostas: string[] };

const GUIAS: Record<Disciplina, Guia> = {
  Matemática: {
    autor: "Equipe de Matemática",
    intro: "Guia de estudo com os conceitos que mais aparecem nas provas do 9º ano: função afim, equação do 2º grau e proporcionalidade.",
    secoes: [
      { tipo: "secao", texto: "Função afim" },
      { tipo: "paragrafo", texto: "Lei f(x) = ax + b. O gráfico é uma reta; a é o coeficiente angular e b é onde a reta corta o eixo y. O zero da função é x = -b / a." },
      { tipo: "secao", texto: "Equação do 2º grau" },
      { tipo: "paragrafo", texto: "Forma ax² + bx + c = 0. Calcule o discriminante delta = b² - 4ac. Se delta > 0 há duas raízes reais; se delta = 0, uma; se delta < 0, nenhuma real. As raízes são x = (-b ± raiz de delta) / 2a." },
      { tipo: "secao", texto: "Regra de três simples" },
      { tipo: "paragrafo", texto: "Monte a proporção entre grandezas diretamente proporcionais e multiplique em cruz. Se uma grandeza aumenta quando a outra diminui, a proporção é inversa: inverta uma das razões antes de multiplicar." },
    ],
    lembrete: ["Confira sempre a resposta substituindo na equação original.", "Em problemas, escreva primeiro o que é a incógnita."],
    perguntas: ["Qual o zero de f(x) = 4x - 12?", "Resolva x² - 5x + 6 = 0.", "Se 3 cadernos custam R$ 18,00, quanto custam 7?"],
    respostas: ["4x - 12 = 0, logo x = 3.", "delta = 25 - 24 = 1; x = (5 ± 1) / 2, então x = 3 ou x = 2.", "Cada caderno custa R$ 6,00; 7 cadernos custam R$ 42,00."],
  },
  Biologia: {
    autor: "Equipe de Biologia",
    intro: "Guia de revisão de Biologia: células, DNA e ecologia básica.",
    secoes: [
      { tipo: "secao", texto: "Célula" },
      { tipo: "paragrafo", texto: "Unidade básica dos seres vivos. Procariontes não têm núcleo delimitado; eucariontes têm núcleo e organelas com membrana, como a mitocôndria (produz ATP) e o cloroplasto (fotossíntese, só em plantas e algas)." },
      { tipo: "secao", texto: "DNA e hereditariedade" },
      { tipo: "paragrafo", texto: "O DNA guarda a informação genética em sequências de bases (A, T, C e G). Genes são trechos de DNA que codificam proteínas. Alelos são versões diferentes de um mesmo gene; o dominante se manifesta mesmo em dose única." },
      { tipo: "secao", texto: "Ecologia" },
      { tipo: "paragrafo", texto: "Cadeia alimentar: produtores (plantas) → consumidores → decompositores. A energia diminui a cada nível; a matéria é reciclada." },
    ],
    lembrete: ["Mitocôndria produz energia; cloroplasto produz alimento.", "Na cadeia alimentar, a seta aponta para quem recebe a energia."],
    perguntas: ["Que organela faz a respiração celular?", "Qual a diferença entre gene e alelo?", "Qual o papel dos decompositores?"],
    respostas: ["A mitocôndria.", "Gene é o trecho de DNA; alelos são as variações desse gene.", "Degradam matéria orgânica morta e devolvem nutrientes ao ambiente."],
  },
  História: {
    autor: "Equipe de História",
    intro: "Guia de estudo de História: como separar causas estruturais e estopim de um evento, com exemplos do século XVIII ao XX.",
    secoes: [
      { tipo: "secao", texto: "Causas estruturais e estopim" },
      { tipo: "paragrafo", texto: "Causas estruturais são as condições profundas e de longo prazo (economia, política, sociedade). O estopim é o fato imediato que desencadeia o evento. Separe as duas coisas ao analisar qualquer processo histórico." },
      { tipo: "secao", texto: "Primeira Guerra Mundial (1914-1918)" },
      { tipo: "paragrafo", texto: "Causas estruturais: rivalidade imperialista, corrida armamentista, nacionalismos e alianças militares (Tríplice Entente e Tríplice Aliança). Estopim: o assassinato do arquiduque Francisco Ferdinando, em Sarajevo, em 1914." },
      { tipo: "secao", texto: "Revolução Francesa (1789)" },
      { tipo: "paragrafo", texto: "Crise financeira do Estado, desigualdade entre os três estados e ideais iluministas levaram à queda da monarquia absolutista e à Declaração dos Direitos do Homem e do Cidadão." },
    ],
    lembrete: ["Use uma linha do tempo para ordenar os fatos.", "Pergunte sempre: quem ganhou e quem perdeu com esse evento?"],
    perguntas: ["Qual foi o estopim da Primeira Guerra?", "Cite uma causa estrutural da Revolução Francesa."],
    respostas: ["O assassinato do arquiduque Francisco Ferdinando, em Sarajevo.", "Por exemplo, a crise financeira do Estado ou a desigualdade entre os três estados."],
  },
  Português: {
    autor: "Equipe de Português",
    intro: "Guia de estudo de Português: figuras de linguagem, tipos de texto e dicas de redação.",
    secoes: [
      { tipo: "secao", texto: "Comparação e metáfora" },
      { tipo: "paragrafo", texto: "Na comparação há conectivo (como, tal qual, feito): \"Seus olhos são como o mar\". Na metáfora, a identificação é direta: \"Seus olhos são o mar\"." },
      { tipo: "secao", texto: "Tipos de texto" },
      { tipo: "marcadores", itens: ["Narrativo: conta uma sequência de fatos, com personagens, tempo e espaço.", "Dissertativo-argumentativo: defende um ponto de vista com argumentos.", "Descritivo: apresenta características de pessoas, lugares ou objetos."] },
      { tipo: "secao", texto: "Estrutura da redação" },
      { tipo: "paragrafo", texto: "Introdução com a tese, dois parágrafos de desenvolvimento (cada um com um argumento e exemplo) e conclusão que retoma a tese e propõe uma solução." },
    ],
    lembrete: ["Leia o texto duas vezes antes de responder.", "Releia a redação procurando repetições e erros de concordância."],
    perguntas: ["\"Ela é uma flor\" é comparação ou metáfora?", "Qual a função da conclusão numa redação?"],
    respostas: ["Metáfora: não há conectivo comparativo.", "Retomar a tese e propor uma solução ou fechamento."],
  },
  Química: {
    autor: "Equipe de Química",
    intro: "Guia de estudo de Química: modelos atômicos, tabela periódica e ligações.",
    secoes: [
      { tipo: "secao", texto: "Átomo" },
      { tipo: "paragrafo", texto: "O átomo tem prótons (carga positiva) e nêutrons no núcleo, e elétrons (carga negativa) na eletrosfera. O número atômico (Z) é o número de prótons; o número de massa (A) é prótons mais nêutrons." },
      { tipo: "secao", texto: "Ligações químicas" },
      { tipo: "tabela", colunas: ["Ligação", "Entre", "Característica"], larguras: [1, 1.6, 2.5], linhas: [["Iônica", "Metal e ametal", "Transferência de elétrons; forma íons."], ["Covalente", "Ametais", "Compartilhamento de elétrons."], ["Metálica", "Metais", "Mar de elétrons livres; conduz eletricidade."]] },
      { tipo: "secao", texto: "Tabela periódica" },
      { tipo: "paragrafo", texto: "Elementos de uma mesma coluna (família) têm propriedades parecidas, pois possuem o mesmo número de elétrons na última camada." },
    ],
    lembrete: ["Número de nêutrons = A - Z.", "Átomos tendem a ficar com 8 elétrons na última camada (regra do octeto)."],
    perguntas: ["Um átomo tem Z = 11 e A = 23. Quantos nêutrons ele tem?", "Que ligação ocorre entre sódio e cloro?"],
    respostas: ["23 - 11 = 12 nêutrons.", "Ligação iônica (metal com ametal)."],
  },
  Física: {
    autor: "Equipe de Física",
    intro: "Guia de estudo de Física: movimento uniforme, velocidade média e leis de Newton.",
    secoes: [
      { tipo: "secao", texto: "Velocidade média" },
      { tipo: "paragrafo", texto: "vm = distância percorrida / tempo gasto. Para converter km/h em m/s, divida por 3,6." },
      { tipo: "secao", texto: "Leis de Newton" },
      { tipo: "numerada", itens: ["Inércia: sem força resultante, o corpo mantém repouso ou movimento retilíneo uniforme.", "F = m · a: a força resultante é a massa vezes a aceleração.", "Ação e reação: forças que dois corpos exercem um no outro têm mesmo módulo e sentidos opostos."] },
      { tipo: "secao", texto: "Dica de resolução" },
      { tipo: "paragrafo", texto: "Monte uma tabela com distância e tempo de cada trecho antes de calcular, e confira as unidades." },
    ],
    lembrete: ["As forças de ação e reação atuam em corpos diferentes.", "72 km/h equivale a 20 m/s."],
    perguntas: ["Um carro percorre 150 km em 2 h. Qual a velocidade média?", "Que força resultante acelera 5 kg a 3 m/s²?"],
    respostas: ["150 / 2 = 75 km/h.", "F = 5 · 3 = 15 N."],
  },
  Geografia: {
    autor: "Equipe de Geografia",
    intro: "Guia de estudo de Geografia: coordenadas, clima e população.",
    secoes: [
      { tipo: "secao", texto: "Coordenadas geográficas" },
      { tipo: "paragrafo", texto: "Latitude mede a distância ao Equador (0° a 90°, norte ou sul); longitude mede a distância ao Meridiano de Greenwich (0° a 180°, leste ou oeste). O Brasil está majoritariamente na zona intertropical." },
      { tipo: "secao", texto: "Clima e tempo" },
      { tipo: "paragrafo", texto: "Tempo é o estado da atmosfera num momento; clima é o padrão médio observado durante muitos anos. Fatores do clima: latitude, altitude, massas de ar, correntes marítimas e continentalidade." },
      { tipo: "secao", texto: "População" },
      { tipo: "paragrafo", texto: "Densidade demográfica é a população dividida pela área (hab./km²). Taxa de natalidade e mortalidade determinam o crescimento natural." },
    ],
    lembrete: ["Quanto maior a altitude, menor a temperatura.", "Densidade demográfica não diz como a população se distribui dentro do território."],
    perguntas: ["Qual a diferença entre tempo e clima?", "Um país tem 200 milhões de habitantes em 8 milhões de km². Qual a densidade?"],
    respostas: ["Tempo é momentâneo; clima é o padrão de longo prazo.", "200 / 8 = 25 hab./km²."],
  },
  Inglês: {
    autor: "Equipe de Inglês",
    intro: "Study guide: Simple Present, Simple Past and useful vocabulary.",
    secoes: [
      { tipo: "secao", texto: "Simple Present" },
      { tipo: "paragrafo", texto: "Usado para rotinas e fatos. Na 3ª pessoa do singular (he, she, it) o verbo leva s: She studies at night. Negativa e pergunta usam do/does: He doesn't work. Does she live here?" },
      { tipo: "secao", texto: "Simple Past" },
      { tipo: "paragrafo", texto: "Ações terminadas no passado. Verbos regulares: + ed (walked). Irregulares mudam: go - went, see - saw. Negativa e pergunta usam did + verbo base: I didn't go. Did you see it?" },
      { tipo: "secao", texto: "Vocabulary" },
      { tipo: "tabela", colunas: ["English", "Português"], linhas: [["homework", "dever de casa"], ["schedule", "horário"], ["to borrow", "pegar emprestado"], ["to improve", "melhorar"]] },
    ],
    lembrete: ["Depois de does/did, o verbo volta para a forma base.", "Leia em voz alta para fixar a pronúncia."],
    perguntas: ["Complete: She ___ (study) every day.", "Make it negative: I went to school."],
    respostas: ["studies.", "I didn't go to school."],
  },
};

const SLUG_DISCIPLINA: Record<string, Disciplina> = {
  matematica: "Matemática",
  biologia: "Biologia",
  historia: "História",
  portugues: "Português",
  quimica: "Química",
  fisica: "Física",
  geografia: "Geografia",
  ingles: "Inglês",
};

/** Guia de estudo de uma disciplina, no mesmo formato dos demais conteúdos. */
export function guiaDaDisciplina(disciplina: Disciplina): ConteudoMaterial {
  const g = GUIAS[disciplina];
  return {
    titulo: `Guia de estudo — ${disciplina}`,
    disciplina,
    autor: g.autor,
    blocos: [
      { tipo: "paragrafo", texto: g.intro },
      ...g.secoes,
      { tipo: "quadro", titulo: "Lembre-se", texto: g.lembrete },
      { tipo: "secao", texto: "Para praticar" },
      { tipo: "numerada", itens: g.perguntas },
      { tipo: "gabarito", itens: g.respostas },
    ],
  };
}

/** Nome de arquivo criado pelo app: `<disciplina>-material-N.pdf`. */
export function disciplinaDoNome(nome: string): Disciplina | undefined {
  const m = /^([a-z]+)-material(?:-\d+)?\.pdf$/i.exec(nome);
  return m ? SLUG_DISCIPLINA[m[1].toLowerCase()] : undefined;
}
