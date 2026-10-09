import type { Disciplina } from "@/data/escola";
import type { Flashcard } from "@/data/missoes";
import { FLASHCARDS } from "@/data/missoes";
import { itemPorId } from "@/data/loja";
import type {
  AppState,
  Atividade,
  Atribuicao,
  Campeonato,
  Compra,
  DecisaoModeracao,
  Denuncia,
  Entrega,
  EspacoId,
  FaseTimer,
  FocoPerdido,
  LembreteAgendado,
  MensagemSala,
  Notificacao,
  Post,
  Privacidade,
  RegistroModeracao,
  Relato,
  Resposta,
  SalaEstudo,
  SessaoEstudo,
  StatusDia,
  TimerAtivo,
} from "./types";

export interface DadosPerfil {
  nome: string;
  iniciais: string;
  arroba?: string;
  bio?: string;
  foto?: string;
  selosExibidos?: string[];
}

/** Operações dos flashcards (rodada, cartas próprias). A repetição espaçada é aplicada em "responderCarta". */
export type OpFlashcards =
  | { tipo: "iniciar"; ids: string[]; escolha: "Todas" | "Erradas" | Disciplina }
  | { tipo: "salvar"; carta: Flashcard }
  | { tipo: "apagar"; id: string };

/** Dias até a carta voltar a vencer, por caixa de Leitner. */
export const INTERVALO_CAIXA_DIAS: Record<number, number> = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 15 };

export type Acao =
  | { type: "premiar"; pontos: number; xp: number; disciplina?: Disciplina }
  | { type: "curtir"; postId: string }
  | { type: "salvar"; postId: string }
  | { type: "publicar"; post: Post }
  | { type: "responder"; postId: string; resposta: Resposta }
  | { type: "marcarUtil"; postId: string; respostaId: string }
  | { type: "respostaAjudou"; postId: string; respostaId: string; quantidade: number }
  | { type: "denunciar"; postId: string; denuncia: Denuncia }
  | { type: "missaoProgresso"; id: string; delta: number }
  | { type: "materialAberto"; postId: string }
  | { type: "registrarEstudo" }
  | { type: "simularAusencia" }
  | { type: "recuperarSequencia"; custo: number }
  | { type: "recomecarSequencia" }
  | { type: "virarCarta" }
  | { type: "responderCarta"; acertou: boolean; em?: number }
  | { type: "flashcards"; op: OpFlashcards }
  | { type: "reiniciarPratica" }
  | { type: "contribuirColetiva"; quantidade: number }
  | { type: "enviarRelato"; relato: Relato }
  | { type: "validarRelato"; id: string }
  | { type: "comprar"; compra: Compra }
  | { type: "equipar"; itemId: string; equipar: boolean }
  | { type: "definirPrivacidade"; nivel: Privacidade }
  | { type: "desbloquearMedalha"; id: string; em: number }
  | { type: "concluirDesafio"; disciplina: Disciplina; acertos: number }
  | { type: "alternarLembrete"; eventoId: string }
  | { type: "definirLembretesAgendados"; itens: LembreteAgendado[] }
  | { type: "editarPerfil"; dados: DadosPerfil }
  | { type: "selecionarEspaco"; espaco: EspacoId }
  | { type: "resetar"; estado: AppState }
  /* Sala de estudos */
  | { type: "iniciarTimer"; timer: TimerAtivo }
  | { type: "sairDaTela"; em: number }
  | { type: "ajustarSaida"; ms: number }
  | { type: "perderFoco"; perdido: FocoPerdido }
  | { type: "dispensarFocoPerdido" }
  | { type: "pausarTimer"; em: number }
  | { type: "retomarTimer"; em: number }
  | { type: "trocarFase"; fase: FaseTimer; em: number }
  | { type: "adiantarTimer"; ms: number }
  | { type: "encerrarTimer" }
  | { type: "registrarSessao"; sessao: SessaoEstudo; turma: string }
  | { type: "definirMetaDiaria"; minutos: number }
  /* Salas coletivas */
  | { type: "criarSala"; sala: SalaEstudo }
  | { type: "entrarSala"; salaId: string; mensagem: MensagemSala }
  | { type: "sairSala"; mensagem?: MensagemSala }
  | { type: "mensagemSala"; salaId: string; mensagem: MensagemSala }
  | { type: "membrosSala"; salaId: string; membros: string[] }
  | { type: "fecharSala"; salaId: string }
  /* Campeonatos */
  | { type: "criarCampeonato"; campeonato: Campeonato }
  | { type: "atualizarCampeonato"; campeonato: Campeonato }
  | { type: "removerCampeonato"; id: string }
  /* Atividades */
  | { type: "criarAtividade"; atividade: Atividade }
  | { type: "atualizarEntrega"; atividadeId: string; alunoId: string; dados: Partial<Entrega> }
  | { type: "removerAtividade"; id: string }
  /* Professor */
  | { type: "atribuir"; atribuicao: Atribuicao }
  | { type: "moderarPost"; postId: string; decisao: DecisaoModeracao }
  | { type: "registrarModeracao"; registro: RegistroModeracao }
  | { type: "decidirRelato"; id: string; aprovado: boolean; em: number; por: string }
  | { type: "entregarCompra"; id: string; em: number }
  | { type: "lembrarAlunos"; ids: string[]; em: number }
  | { type: "notificarVarios"; notificacoes: Notificacao[] }
  /* Notificações */
  | { type: "notificar"; notificacao: Notificacao }
  | { type: "lerNotificacao"; id: string }
  | { type: "lerTodasNotificacoes"; para: string };

/** Limite de cartas exibidas numa rodada de prática (inclui as revistas). */
export const MAX_CARTAS_RODADA = FLASHCARDS.length + 3;

/** Notificações guardadas por destinatário: as 120 mais recentes de cada pessoa; as não lidas nunca saem. */
export const MAX_NOTIFICACOES_POR_PESSOA = 120;

function limitarNotificacoes(lista: Notificacao[]): Notificacao[] {
  const contagem = new Map<string, number>();
  let cortou = false;
  const mantidas = lista.filter((n) => {
    const qtd = (contagem.get(n.para) ?? 0) + 1;
    contagem.set(n.para, qtd);
    if (qtd <= MAX_NOTIFICACOES_POR_PESSOA || !n.lida) return true;
    cortou = true;
    return false;
  });
  return cortou ? mantidas : lista;
}

function mapPost(estado: AppState, postId: string, fn: (p: Post) => Post): AppState {
  return { ...estado, posts: estado.posts.map((p) => (p.id === postId ? fn(p) : p)) };
}

function mapResposta(post: Post, respostaId: string, fn: (r: Resposta) => Resposta): Post {
  return { ...post, respostas: post.respostas.map((r) => (r.id === respostaId ? fn(r) : r)) };
}

export function reducer(estado: AppState, acao: Acao): AppState {
  switch (acao.type) {
    case "premiar": {
      const u = estado.usuario;
      const xpSemanaDisc = { ...u.xpSemanaDisc };
      if (acao.disciplina) xpSemanaDisc[acao.disciplina] = (xpSemanaDisc[acao.disciplina] ?? 0) + acao.xp;
      const xp = u.xp + acao.xp;
      return {
        ...estado,
        usuario: { ...u, pontos: u.pontos + acao.pontos, xp, xpSemana: u.xpSemana + acao.xp, xpSemanaDisc },
        pessoas: { ...estado.pessoas, [u.id]: { ...estado.pessoas[u.id], xp } },
        // XP ganho durante um campeonato de XP em andamento entra no placar da aluna.
        campeonatos:
          acao.xp > 0
            ? estado.campeonatos.map((c) =>
                c.status === "andamento" && c.metrica === "xp" && c.participantes.includes(u.id)
                  ? { ...c, placar: { ...c.placar, [u.id]: (c.placar[u.id] ?? 0) + acao.xp } }
                  : c,
              )
            : estado.campeonatos,
      };
    }

    case "curtir":
      return mapPost(estado, acao.postId, (p) => ({ ...p, curtido: !p.curtido, curtidas: p.curtidas + (p.curtido ? -1 : 1) }));

    case "salvar":
      return mapPost(estado, acao.postId, (p) => ({ ...p, salvo: !p.salvo }));

    case "publicar":
      return { ...estado, posts: [acao.post, ...estado.posts] };

    case "responder":
      return mapPost(estado, acao.postId, (p) => ({ ...p, respostas: [...p.respostas, acao.resposta] }));

    case "marcarUtil":
      return mapPost(estado, acao.postId, (p) => mapResposta(p, acao.respostaId, (r) => ({ ...r, util: true, uteis: r.uteis + 1 })));

    case "respostaAjudou": {
      const comUtil = mapPost(estado, acao.postId, (p) =>
        mapResposta(p, acao.respostaId, (r) => ({ ...r, util: true, uteis: r.uteis + acao.quantidade })),
      );
      return { ...comUtil, usuario: { ...comUtil.usuario, respostasUteis: comUtil.usuario.respostasUteis + 1 } };
    }

    case "denunciar":
      return mapPost(estado, acao.postId, (p) => ({ ...p, denuncia: acao.denuncia }));

    case "missaoProgresso":
      return {
        ...estado,
        missoes: estado.missoes.map((m) => {
          if (m.id !== acao.id || m.concluida) return m;
          const progresso = Math.min(m.alvo, Math.max(0, m.progresso + acao.delta));
          return { ...m, progresso, concluida: progresso >= m.alvo };
        }),
      };

    case "materialAberto":
      return estado.materiaisAbertos.includes(acao.postId)
        ? estado
        : { ...estado, materiaisAbertos: [...estado.materiaisAbertos, acao.postId] };

    case "registrarEstudo": {
      const s = estado.sequencia;
      if (s.estudouHoje || s.quebrada) return estado;
      const semana = [...s.semana];
      semana[s.hoje] = "estudou";
      return {
        ...estado,
        sequencia: { ...s, dias: s.dias + 1, diasSemCongelador: s.diasSemCongelador + 1, estudouHoje: true, semana },
      };
    }

    case "simularAusencia": {
      const s = estado.sequencia;
      if (s.quebrada) return estado;
      let semana: StatusDia[] = [...s.semana];
      let hoje = s.hoje;
      const avancarDia = () => {
        hoje += 1;
        if (hoje > 6) {
          semana = Array(7).fill("futuro");
          hoje = 0;
        }
        semana[hoje] = "pendente";
      };
      // Se hoje já foi estudado, o dia perdido é o seguinte.
      if (s.estudouHoje) avancarDia();
      const usaCongelador = s.congeladores > 0;
      semana[hoje] = usaCongelador ? "congelado" : "perdido";
      avancarDia();
      return {
        ...estado,
        sequencia: {
          ...s,
          semana,
          hoje,
          estudouHoje: false,
          congeladores: usaCongelador ? s.congeladores - 1 : 0,
          diasSemCongelador: usaCongelador ? 0 : s.diasSemCongelador,
          quebrada: !usaCongelador,
        },
      };
    }

    case "recuperarSequencia": {
      const s = estado.sequencia;
      if (!s.quebrada || estado.usuario.pontos < acao.custo) return estado;
      const ultimoPerdido = s.semana.lastIndexOf("perdido");
      const semana = s.semana.map((d, i) => (i === ultimoPerdido ? ("congelado" as StatusDia) : d));
      return {
        ...estado,
        usuario: { ...estado.usuario, pontos: estado.usuario.pontos - acao.custo },
        sequencia: { ...s, quebrada: false, semana },
      };
    }

    case "recomecarSequencia":
      return { ...estado, sequencia: { ...estado.sequencia, dias: 0, diasSemCongelador: 0, quebrada: false } };

    case "virarCarta":
      return { ...estado, pratica: { ...estado.pratica, virada: true } };

    case "responderCarta": {
      const p = estado.pratica;
      if (p.fim || !p.fila.length) return estado;
      const [atual, ...resto] = p.fila;
      const fila = acao.acertou ? resto : [...resto, atual];
      const vistas = p.vistas + 1;
      const cartaId = p.ids?.[atual];
      let flash = estado.flash;
      if (cartaId) {
        const base = flash ?? { minhas: [], caixas: {}, erradas: [] };
        const atualCaixa = base.caixas[cartaId]?.caixa ?? 1;
        const caixa = acao.acertou ? Math.min(5, atualCaixa + 1) : 1;
        const em = acao.em ?? 0;
        flash = {
          ...base,
          caixas: { ...base.caixas, [cartaId]: { caixa, proxima: em + (INTERVALO_CAIXA_DIAS[caixa] ?? 0) * 86_400_000 } },
          erradas: acao.acertou ? base.erradas.filter((x) => x !== cartaId) : base.erradas.includes(cartaId) ? base.erradas : [...base.erradas, cartaId],
        };
      }
      return {
        ...estado,
        flash,
        pratica: {
          ...p,
          fila,
          virada: false,
          acertos: p.acertos + (acao.acertou ? 1 : 0),
          vistas,
          fim: fila.length === 0 || vistas >= (p.ids?.length ?? FLASHCARDS.length) + 3,
        },
      };
    }

    case "reiniciarPratica":
      return { ...estado, pratica: { fila: [], virada: false, acertos: 0, vistas: 0, fim: false } };

    case "flashcards": {
      const op = acao.op;
      const base = estado.flash ?? { minhas: [], caixas: {}, erradas: [] };
      if (op.tipo === "iniciar") {
        return { ...estado, pratica: { fila: op.ids.map((_, i) => i), ids: op.ids, escolha: op.escolha, virada: false, acertos: 0, vistas: 0, fim: op.ids.length === 0 } };
      }
      if (op.tipo === "salvar") {
        const existe = base.minhas.some((c) => c.id === op.carta.id);
        const minhas = existe ? base.minhas.map((c) => (c.id === op.carta.id ? op.carta : c)) : [op.carta, ...base.minhas];
        return { ...estado, flash: { ...base, minhas } };
      }
      const caixas = Object.fromEntries(Object.entries(base.caixas).filter(([id]) => id !== op.id));
      return { ...estado, flash: { minhas: base.minhas.filter((c) => c.id !== op.id), caixas, erradas: base.erradas.filter((x) => x !== op.id) } };
    }

    case "contribuirColetiva": {
      const c = estado.coletiva;
      if (c.concluida) return estado;
      const progresso = Math.min(c.alvo, c.progresso + acao.quantidade);
      return { ...estado, coletiva: { ...c, progresso, concluida: progresso >= c.alvo } };
    }

    case "enviarRelato":
      return { ...estado, relatos: [acao.relato, ...estado.relatos] };

    case "validarRelato":
      return {
        ...estado,
        relatos: estado.relatos.map((r) => (r.id === acao.id ? { ...r, status: "validado" } : r)),
        usuario: { ...estado.usuario, relatosValidados: estado.usuario.relatosValidados + 1 },
      };

    case "comprar": {
      const u = estado.usuario;
      if (u.pontos < acao.compra.custo || estado.compras.some((c) => c.itemId === acao.compra.itemId)) return estado;
      return { ...estado, usuario: { ...u, pontos: u.pontos - acao.compra.custo }, compras: [acao.compra, ...estado.compras] };
    }

    case "equipar": {
      const item = itemPorId(acao.itemId);
      if (!item || item.slot === "voucher") return estado;
      const semMesmoSlot = estado.usuario.equipados.filter((id) => itemPorId(id)?.slot !== item.slot);
      return {
        ...estado,
        usuario: { ...estado.usuario, equipados: acao.equipar ? [...semMesmoSlot, item.id] : semMesmoSlot },
      };
    }

    case "definirPrivacidade":
      return { ...estado, usuario: { ...estado.usuario, privacidade: acao.nivel } };

    case "desbloquearMedalha":
      return estado.medalhas.some((m) => m.id === acao.id)
        ? estado
        : { ...estado, medalhas: [...estado.medalhas, { id: acao.id, desbloqueadaEm: acao.em }] };

    case "concluirDesafio": {
      const u = estado.usuario;
      const dominio = { ...u.dominio, [acao.disciplina]: Math.min(100, u.dominio[acao.disciplina] + acao.acertos * 4) };
      return {
        ...estado,
        usuario: { ...u, dominio },
        desafiosConcluidos: [...estado.desafiosConcluidos, acao.disciplina],
      };
    }

    case "alternarLembrete":
      return {
        ...estado,
        lembretes: estado.lembretes.includes(acao.eventoId)
          ? estado.lembretes.filter((id) => id !== acao.eventoId)
          : [...estado.lembretes, acao.eventoId],
      };

    case "definirLembretesAgendados":
      return { ...estado, lembretesAgendados: acao.itens };

    case "editarPerfil": {
      const { nome, iniciais, ...resto } = acao.dados;
      const atual = estado.pessoas[estado.usuario.id];
      return {
        ...estado,
        usuario: { ...estado.usuario, nome, ...resto },
        pessoas: atual ? { ...estado.pessoas, [atual.id]: { ...atual, nome, iniciais } } : estado.pessoas,
      };
    }

    case "selecionarEspaco":
      return { ...estado, espaco: acao.espaco };

    case "resetar":
      return acao.estado;

    /* ───────────── Sala de estudos ───────────── */

    case "iniciarTimer":
      return { ...estado, estudos: { ...estado.estudos, timer: acao.timer, focoPerdido: null } };

    case "sairDaTela":
      // Só conta como saída se o foco estava rodando (pausa manual ou intervalo não contam).
      return mapTimer(estado, (t) =>
        t.pausado || t.fase !== "foco" ? t : { ...t, pausado: true, saiuEm: acao.em, acumuladoMs: t.acumuladoMs + Math.max(0, acao.em - t.faseInicio) },
      );

    case "ajustarSaida":
      // Só para a apresentação: faz o tempo fora da tela passar sem esperar.
      return mapTimer(estado, (t) => (t.saiuEm ? { ...t, saiuEm: t.saiuEm - acao.ms } : t));

    case "perderFoco":
      return { ...estado, estudos: { ...estado.estudos, timer: null, focoPerdido: acao.perdido } };

    case "dispensarFocoPerdido":
      return estado.estudos.focoPerdido ? { ...estado, estudos: { ...estado.estudos, focoPerdido: null } } : estado;

    case "pausarTimer":
      return mapTimer(estado, (t) => (t.pausado ? t : { ...t, pausado: true, acumuladoMs: t.acumuladoMs + Math.max(0, acao.em - t.faseInicio) }));

    case "retomarTimer":
      return mapTimer(estado, (t) => (t.pausado ? { ...t, pausado: false, faseInicio: acao.em, saiuEm: undefined } : t));

    case "trocarFase":
      return mapTimer(estado, (t) => ({
        ...t,
        fase: acao.fase,
        faseInicio: acao.em,
        acumuladoMs: 0,
        pausado: false,
        saiuEm: undefined,
        ciclos: t.ciclos + (t.fase === "foco" && acao.fase === "pausa" ? 1 : 0),
      }));

    case "adiantarTimer":
      // Só para a apresentação: faz o tempo passar sem esperar.
      return mapTimer(estado, (t) => (t.pausado ? { ...t, acumuladoMs: t.acumuladoMs + acao.ms } : { ...t, faseInicio: t.faseInicio - acao.ms }));

    case "encerrarTimer":
      return estado.estudos.timer ? { ...estado, estudos: { ...estado.estudos, timer: null } } : estado;

    case "registrarSessao": {
      const { sessao } = acao;
      const timer = estado.estudos.timer;
      return {
        ...estado,
        estudos: {
          ...estado.estudos,
          sessoes: [...estado.estudos.sessoes, sessao],
          timer: timer ? { ...timer, minutosRegistrados: timer.minutosRegistrados + sessao.minutos } : null,
        },
        salas: sessao.salaId
          ? estado.salas.map((s) => (s.id === sessao.salaId ? { ...s, focoHojeMin: s.focoHojeMin + sessao.minutos } : s))
          : estado.salas,
        // Minutos de foco contam nos campeonatos de foco em andamento (da turma ou da aluna inscrita).
        campeonatos: estado.campeonatos.map((c) => {
          // Registro manual não vale em disputa (anti-"farm"): só foco cronometrado.
          if (c.status !== "andamento" || c.metrica !== "foco" || sessao.origem === "manual") return c;
          const chave = c.formato === "interclasses" ? acao.turma : estado.usuario.id;
          if (!c.participantes.includes(chave)) return c;
          return { ...c, placar: { ...c.placar, [chave]: (c.placar[chave] ?? 0) + sessao.minutos } };
        }),
      };
    }

    case "definirMetaDiaria":
      return { ...estado, estudos: { ...estado.estudos, metaDiariaMin: acao.minutos } };

    /* ───────────── Salas coletivas ───────────── */

    case "criarSala":
      return { ...estado, salas: [acao.sala, ...estado.salas] };

    case "entrarSala":
      return {
        ...mapSala(estado, acao.salaId, (s) => ({ ...s, mensagens: [...s.mensagens, acao.mensagem] })),
        salaAtual: acao.salaId,
      };

    case "sairSala": {
      if (!estado.salaAtual) return estado;
      const { mensagem } = acao;
      const comMensagem = mensagem ? mapSala(estado, estado.salaAtual, (s) => ({ ...s, mensagens: [...s.mensagens, mensagem] })) : estado;
      return { ...comMensagem, salaAtual: null };
    }

    case "mensagemSala":
      // Guarda só as 60 mensagens mais recentes por sala.
      return mapSala(estado, acao.salaId, (s) => ({ ...s, mensagens: [...s.mensagens, acao.mensagem].slice(-60) }));

    case "membrosSala":
      return mapSala(estado, acao.salaId, (s) => ({ ...s, membros: acao.membros }));

    case "fecharSala":
      return {
        ...estado,
        salas: estado.salas.filter((s) => s.id !== acao.salaId),
        salaAtual: estado.salaAtual === acao.salaId ? null : estado.salaAtual,
      };

    /* ───────────── Campeonatos ───────────── */

    case "criarCampeonato":
      return { ...estado, campeonatos: [acao.campeonato, ...estado.campeonatos] };

    case "atualizarCampeonato":
      return { ...estado, campeonatos: estado.campeonatos.map((c) => (c.id === acao.campeonato.id ? acao.campeonato : c)) };

    case "removerCampeonato":
      return { ...estado, campeonatos: estado.campeonatos.filter((c) => c.id !== acao.id) };

    /* ───────────── Atividades ───────────── */

    case "criarAtividade":
      return { ...estado, atividades: [acao.atividade, ...estado.atividades] };

    case "atualizarEntrega":
      return {
        ...estado,
        atividades: estado.atividades.map((a) =>
          a.id !== acao.atividadeId
            ? a
            : { ...a, entregas: a.entregas.map((e) => (e.alunoId === acao.alunoId ? { ...e, ...acao.dados } : e)) },
        ),
      };

    case "removerAtividade":
      return { ...estado, atividades: estado.atividades.filter((a) => a.id !== acao.id) };

    /* ───────────── Professor ───────────── */

    case "atribuir": {
      const { atribuicao: a } = acao;
      const atribuicoes = [a, ...estado.atribuicoes];
      // Para a aluna da demo o saldo muda via "premiar"; para os demais, fica no bônus.
      if (a.alunoId === estado.usuario.id) return { ...estado, atribuicoes };
      const atual = estado.bonus[a.alunoId] ?? { pontos: 0, xp: 0 };
      return {
        ...estado,
        atribuicoes,
        bonus: { ...estado.bonus, [a.alunoId]: { pontos: atual.pontos + a.pontos, xp: atual.xp + a.xp } },
      };
    }

    case "moderarPost": {
      const moderacao = { ...estado.moderacao, [acao.postId]: acao.decisao };
      if (acao.decisao === "removido") return { ...estado, moderacao, posts: estado.posts.filter((p) => p.id !== acao.postId) };
      const retida = estado.posts.find((p) => p.id === acao.postId);
      if (retida?.origemSala) {
        // Mensagem de chat liberada: publica na sala (com o horário original) e sai da fila.
        const { salaId, mensagem } = retida.origemSala;
        const publicada: MensagemSala = { id: `sm-${retida.id}`, autorId: retida.autorId, texto: mensagem, criadoEm: retida.criadoEm, tipo: "mensagem" };
        const comSala = mapSala(estado, salaId, (s) => ({ ...s, mensagens: [...s.mensagens, publicada].slice(-60) }));
        return { ...comSala, moderacao, posts: estado.posts.filter((p) => p.id !== acao.postId) };
      }
      return { ...mapPost(estado, acao.postId, (p) => ({ ...p, emRevisao: undefined, denuncia: undefined })), moderacao };
    }

    /* ───────────── Notificações ───────────── */

    case "registrarModeracao":
      return { ...estado, historicoModeracao: [acao.registro, ...(estado.historicoModeracao ?? [])].slice(0, 300) };

    case "decidirRelato": {
      const pendente = estado.relatos.some((r) => r.id === acao.id && r.status === "em análise");
      if (!pendente) return estado;
      return {
        ...estado,
        relatos: estado.relatos.map((r) => (r.id === acao.id ? { ...r, status: acao.aprovado ? "validado" : "recusado", decididoEm: acao.em, decididoPor: acao.por } : r)),
        usuario: acao.aprovado ? { ...estado.usuario, relatosValidados: estado.usuario.relatosValidados + 1 } : estado.usuario,
      };
    }

    case "entregarCompra":
      return { ...estado, compras: estado.compras.map((c) => (c.id === acao.id && !c.entregueEm ? { ...c, entregueEm: acao.em } : c)) };

    case "lembrarAlunos": {
      const lembradoEm = { ...(estado.lembradoEm ?? {}) };
      for (const id of acao.ids) lembradoEm[id] = acao.em;
      return { ...estado, lembradoEm };
    }

    case "notificarVarios":
      return acao.notificacoes.length ? { ...estado, notificacoes: limitarNotificacoes([...acao.notificacoes, ...estado.notificacoes]) } : estado;

    case "notificar":
      return { ...estado, notificacoes: limitarNotificacoes([acao.notificacao, ...estado.notificacoes]) };

    case "lerNotificacao":
      return {
        ...estado,
        notificacoes: estado.notificacoes.map((n) => (n.id === acao.id && !n.lida ? { ...n, lida: true } : n)),
      };

    case "lerTodasNotificacoes":
      return estado.notificacoes.some((n) => n.para === acao.para && !n.lida)
        ? { ...estado, notificacoes: estado.notificacoes.map((n) => (n.para === acao.para && !n.lida ? { ...n, lida: true } : n)) }
        : estado;
  }
}

function mapTimer(estado: AppState, fn: (t: TimerAtivo) => TimerAtivo): AppState {
  const t = estado.estudos.timer;
  return t ? { ...estado, estudos: { ...estado.estudos, timer: fn(t) } } : estado;
}

function mapSala(estado: AppState, salaId: string, fn: (s: SalaEstudo) => SalaEstudo): AppState {
  return { ...estado, salas: estado.salas.map((s) => (s.id === salaId ? fn(s) : s)) };
}
