import { entre, mulberry32 } from "@/lib/aleatorio";
import type { Atividade, Entrega, Notificacao, TipoAtividade } from "@/store/types";
import { alunosDaTurma } from "./turmas";

const MIN = 60_000;
const H = 60 * MIN;
const D = 24 * H;

export const ROTULO_ATIVIDADE: Record<TipoAtividade, string> = {
  lista: "Lista de exercícios",
  quiz: "Quiz",
  leitura: "Leitura",
  entrega: "Entrega",
  projeto: "Projeto",
};

const FEEDBACKS = [
  "Muito bem! Raciocínio claro e organizado.",
  "Bom trabalho. Revise a justificativa do item c.",
  "Ótima evolução em relação à última lista.",
  "Faltou mostrar o cálculo do coeficiente angular.",
  "Excelente! Pode ajudar os colegas no feed.",
];

/**
 * Gera as entregas da turma: `taxa` entregaram, parte já corrigida.
 * A aluna da demo ("ana") recebe o status indicado em `ana`.
 */
function entregasDaTurma(turma: string, semente: number, taxa: number, corrigidas: number, agora: number, ana?: Partial<Entrega>): Entrega[] {
  const rnd = mulberry32(semente);
  return alunosDaTurma(turma).map((aluno) => {
    if (aluno.id === "ana") return { alunoId: "ana", status: "pendente", ...ana };
    if (rnd() > taxa) return { alunoId: aluno.id, status: "pendente" };
    const entregueEm = agora - entre(20, 60 * 40, rnd) * MIN;
    if (rnd() < corrigidas) {
      const nota = Math.round((5.5 + rnd() * 4.5) * 2) / 2;
      return { alunoId: aluno.id, status: "corrigida", entregueEm, nota, feedback: FEEDBACKS[Math.floor(rnd() * FEEDBACKS.length)] };
    }
    return { alunoId: aluno.id, status: "entregue", entregueEm, resposta: "Resolução enviada pelo portal." };
  });
}

/** Semente e taxas da Lista 7 (a mesma geração alimenta a atividade e a notificação do professor). */
function entregasDaLista7(agora: number) {
  return entregasDaTurma("9º Ano A", 71, 0.55, 0.35, agora);
}

export function criarAtividades(agora: number): Atividade[] {
  const hoje = new Date(agora);
  hoje.setHours(23, 59, 0, 0);
  const prazo = (dias: number) => hoje.getTime() + dias * D;

  return [
    {
      id: "at-lista7",
      titulo: "Lista 7 — Funções afins (10 questões)",
      descricao: "Resolva as 10 questões e envie as respostas com o raciocínio. Vale a participação prevista no plano de aula da semana.",
      tipo: "lista",
      disciplina: "Matemática",
      professorId: "prof_ricardo",
      turma: "9º Ano A",
      criadaEm: agora - 15 * MIN,
      prazo: prazo(2),
      pontos: 40,
      xp: 30,
      postId: "p1",
      anexo: { nome: "lista-7-funcoes-afins.pdf", paginas: 2, tamanho: "10 KB" },
      entregas: entregasDaLista7(agora),
    },
    {
      id: "at-citologia",
      titulo: "Relatório da aula prática de Citologia",
      descricao: "Use o modelo do material da aula 12. Inclua os desenhos das células observadas no microscópio.",
      tipo: "entrega",
      disciplina: "Biologia",
      professorId: "prof_denise",
      turma: "9º Ano A",
      criadaEm: agora - 2 * D,
      prazo: prazo(3),
      pontos: 40,
      xp: 30,
      postId: "p4",
      entregas: entregasDaTurma("9º Ano A", 72, 0.3, 0.1, agora),
    },
    {
      id: "at-leitura-graficos",
      titulo: "Leitura: capítulo 4 — Gráficos de funções",
      descricao: "Leia as páginas 88 a 97 e responda às 3 perguntas de fixação ao final.",
      tipo: "leitura",
      disciplina: "Matemática",
      professorId: "prof_ricardo",
      turma: "9º Ano A",
      criadaEm: agora - 9 * D,
      prazo: prazo(-3),
      pontos: 20,
      xp: 15,
      entregas: entregasDaTurma("9º Ano A", 73, 0.92, 0.95, agora, {
        status: "corrigida",
        entregueEm: agora - 4 * D,
        nota: 9.5,
        feedback: "Excelente leitura, Ana! Suas respostas mostram que você entendeu a inclinação da reta.",
        pontos: 19,
        xp: 14,
      }),
    },
    {
      id: "at-quiz-coef",
      titulo: "Quiz: coeficiente angular",
      descricao: "5 questões rápidas para fixar o cálculo do coeficiente a partir de dois pontos.",
      tipo: "quiz",
      disciplina: "Matemática",
      professorId: "prof_ricardo",
      turma: "9º Ano B",
      criadaEm: agora - 1 * D,
      prazo: prazo(1),
      pontos: 25,
      xp: 20,
      entregas: entregasDaTurma("9º Ano B", 74, 0.7, 0.6, agora),
    },
    {
      id: "at-projeto-8a",
      titulo: "Projeto: a função afim no dia a dia",
      descricao: "Em grupos, encontrem uma situação real (conta de luz, táxi, celular) e modelem com uma função afim. Apresentação de 5 minutos.",
      tipo: "projeto",
      disciplina: "Matemática",
      professorId: "prof_ricardo",
      turma: "8º Ano A",
      criadaEm: agora - 3 * D,
      prazo: prazo(10),
      pontos: 80,
      xp: 60,
      entregas: entregasDaTurma("8º Ano A", 75, 0.12, 0, agora),
    },
  ];
}

export function criarNotificacoes(agora: number): Notificacao[] {
  const t = (ms: number) => agora - ms;
  // Os textos do professor saem dos mesmos dados que o Painel mostra (nada de número fixo que contradiga a tela).
  const lista7 = entregasDaLista7(agora);
  const entregues = lista7.filter((e) => e.status !== "pendente").length;
  const aCorrigir = lista7.filter((e) => e.status === "entregue").length;
  const semAcesso = alunosDaTurma("9º Ano A").filter((a) => a.ultimoAcessoHa > 3 * 24 * 60).length; // `ultimoAcessoHa` em minutos
  return [
    { id: "n1", para: "ana", tipo: "atividade", titulo: "Nova atividade de Matemática", texto: "Prof. Ricardo publicou a Lista 7 — prazo em 2 dias.", href: "/missoes#atividades", deId: "prof_ricardo", criadoEm: t(14 * MIN), lida: false },
    { id: "n2", para: "ana", tipo: "campeonato", titulo: "Sua semifinal está liberada!", texto: "Copa CEPI de Matemática: você enfrenta Sofia Andrade.", href: "/campeonatos/copa-matematica", deId: "prof_ricardo", criadoEm: t(40 * MIN), lida: false },
    { id: "n3", para: "ana", tipo: "sala", titulo: "Sala de revisão aberta", texto: "“Revisão para a prova de Matemática” está com 11 colegas focando agora.", href: "/estudos/salas/sala-revisao-mat", deId: "prof_ricardo", criadoEm: t(2 * H), lida: false },
    { id: "n4", para: "ana", tipo: "correcao", titulo: "Leitura corrigida · nota 9,5", texto: "+19 pontos e +14 XP em “Capítulo 4 — Gráficos de funções”.", href: "/missoes#atividades", deId: "prof_ricardo", criadoEm: t(3 * D), lida: true },
    { id: "n5", para: "prof_ricardo", tipo: "entrega", titulo: `${entregues} ${entregues === 1 ? "entrega" : "entregas"} na Lista 7`, texto: `9º Ano A · ${aCorrigir} aguardando correção.`, href: "/professor/atividades/at-lista7", criadoEm: t(10 * MIN), lida: false },
    { id: "n6", para: "prof_ricardo", tipo: "moderacao", titulo: "2 publicações aguardando revisão", texto: "A triagem automática sinalizou possível ofensa e spam.", href: "/professor/moderacao", criadoEm: t(1 * H), lida: false },
    { id: "n7", para: "prof_ricardo", tipo: "sistema", titulo: `${semAcesso} ${semAcesso === 1 ? "aluno sem acessar" : "alunos sem acessar"} há mais de 3 dias`, texto: "9º Ano A · veja o alerta de engajamento no painel da turma.", href: "/professor/alunos", criadoEm: t(5 * H), lida: true },
  ];
}
