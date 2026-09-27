import type { Conversa } from "@/store/types";

const MIN = 60_000;
const H = 60 * MIN;
const D = 24 * H;

/** Conversas iniciais da aluna (mensagens diretas — US01). */
export function criarConversas(agora: number): Conversa[] {
  const t = (ms: number) => agora - ms;
  return [
    {
      id: "c-lucas",
      participantes: ["ana", "lucas"],
      naoLidas: 1,
      mensagens: [
        { id: "m1", autorId: "ana", texto: "Lucas, você vai no grupo de estudos de quinta?", criadoEm: t(1 * H), lida: true },
        { id: "m2", autorId: "lucas", texto: "Vou sim! Levo a lista 7 impressa.", criadoEm: t(50 * MIN), lida: true },
        { id: "m3", autorId: "lucas", texto: "Você já fez o item b? Achei a explicação da Júlia bem boa 👀", criadoEm: t(18 * MIN), lida: false },
      ],
    },
    {
      id: "c-grupo-9a",
      participantes: ["ana", "lucas", "julia", "marina", "sofia"],
      titulo: "Estudos · 9º Ano A",
      naoLidas: 2,
      mensagens: [
        { id: "g1", autorId: "marina", texto: "Gente, a prova de História é na quinta ou na sexta?", criadoEm: t(3 * H), lida: true },
        { id: "g2", autorId: "sofia", texto: "Quinta, 9h20! Tá no calendário do portal.", criadoEm: t(2 * H + 40 * MIN), lida: true },
        { id: "g3", autorId: "ana", texto: "Eu fiz um resumo das causas da guerra, depois mando aqui.", criadoEm: t(2 * H), lida: true },
        { id: "g4", autorId: "julia", texto: "Manda sim, Ana! 🙏", criadoEm: t(40 * MIN), lida: false },
        { id: "g5", autorId: "lucas", texto: "Alguém bora revisar flashcards de Química hoje à noite? Falta pouco pra Maratona.", criadoEm: t(12 * MIN), lida: false },
      ],
    },
    {
      id: "c-prof-ricardo",
      participantes: ["ana", "prof_ricardo"],
      naoLidas: 0,
      mensagens: [
        {
          id: "r1",
          autorId: "ana",
          texto: "Professor, na lista 7, posso usar o gráfico para justificar o item b?",
          criadoEm: t(1 * D + 2 * H),
          lida: true,
        },
        {
          id: "r2",
          autorId: "prof_ricardo",
          texto: "Pode, Ana! Só indique dois pontos da reta e calcule o coeficiente angular. Boa pergunta.",
          criadoEm: t(1 * D + 1 * H),
          lida: true,
        },
      ],
    },
    {
      id: "c-julia",
      participantes: ["ana", "julia"],
      naoLidas: 0,
      mensagens: [
        { id: "j1", autorId: "julia", texto: "Te mandei o mapa mental de citologia pelo feed!", criadoEm: t(2 * D), lida: true },
        { id: "j2", autorId: "ana", texto: "Valeu, Júlia! Vou usar pra missão de revisão.", criadoEm: t(2 * D - 20 * MIN), lida: true },
      ],
    },
  ];
}

/** Respostas simuladas por contato, usadas em sequência quando a aluna escreve. */
export const RESPOSTAS_DM: Record<string, string[]> = {
  lucas: [
    "Boa! Quinta a gente resolve junto então.",
    "Fechou 👍 Vou levar minha tabela de sinais também.",
    "Kkkk verdade. Me chama se travar em alguma questão.",
    "Show! Depois me conta como foi.",
  ],
  julia: [
    "Imagina! Qualquer coisa me chama 😊",
    "Se quiser, faço um de meiose também.",
    "Boa sorte na prova! Você vai bem.",
  ],
  marina: ["Obrigada, Ana! Ajudou muito.", "Vou ler hoje à noite.", "Bora estudar juntas amanhã no intervalo?"],
  sofia: ["Tô dentro!", "Já fiz 15 flashcards hoje, falta pouco 💪", "Boa! Manda no grupo também."],
  pedro: ["Valeu! Tava precisando.", "Beleza, combinado.", "Kkkk verdade."],
  otavio: ["Opa, valeu!", "Beleza.", "Pode crer."],
  rafael: ["Fala, Ana! Tudo certo?", "Combinado.", "Valeu pela ajuda!"],
  camila: ["Oii! Pode sim.", "Obrigada 😊", "Combinado!"],
  gustavo: ["Opa! Se precisar de ajuda com o EM, é só chamar.", "Boa!", "Valeu!"],
  professor: [
    "Olá, Ana! Obrigado pela mensagem. Vou considerar isso na próxima aula.",
    "Ótima pergunta. Traga a dúvida para a aula e resolvemos juntos no quadro.",
    "Pode contar comigo. Se precisar, publique também no feed para ajudar a turma.",
  ],
  coord: [
    "Olá, Ana! A Coordenação Pedagógica recebeu sua mensagem e retorna em breve.",
    "Obrigada pelo contato. Vamos verificar e te damos um retorno.",
  ],
};

/** Sugestões rápidas exibidas acima do campo de mensagem. */
export const SUGESTOES_DM = ["Oi! Tudo bem?", "Pode me ajudar com uma dúvida?", "Obrigada! 😊", "Vamos estudar juntos?"];
