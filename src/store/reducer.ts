import type { Disciplina } from "@/data/escola";
import { FLASHCARDS } from "@/data/missoes";
import { itemPorId } from "@/data/loja";
import type { AppState, Compra, Denuncia, EspacoId, Post, Relato, Resposta, StatusDia } from "./types";

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
  | { type: "responderCarta"; acertou: boolean }
  | { type: "reiniciarPratica" }
  | { type: "contribuirColetiva"; quantidade: number }
  | { type: "enviarRelato"; relato: Relato }
  | { type: "validarRelato"; id: string }
  | { type: "comprar"; compra: Compra }
  | { type: "equipar"; itemId: string; equipar: boolean }
  | { type: "ocultarRanking"; valor: boolean }
  | { type: "desbloquearMedalha"; id: string; em: number }
  | { type: "concluirDesafio"; disciplina: Disciplina; acertos: number }
  | { type: "alternarLembrete"; eventoId: string }
  | { type: "selecionarEspaco"; espaco: EspacoId }
  | { type: "resetar"; estado: AppState };

/** Limite de cartas exibidas numa rodada de prática (inclui as revistas). */
export const MAX_CARTAS_RODADA = FLASHCARDS.length + 3;

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
      return {
        ...estado,
        pratica: {
          fila,
          virada: false,
          acertos: p.acertos + (acao.acertou ? 1 : 0),
          vistas,
          fim: fila.length === 0 || vistas >= MAX_CARTAS_RODADA,
        },
      };
    }

    case "reiniciarPratica":
      return { ...estado, pratica: { fila: FLASHCARDS.map((_, i) => i), virada: false, acertos: 0, vistas: 0, fim: false } };

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

    case "ocultarRanking":
      return { ...estado, usuario: { ...estado.usuario, ocultarRanking: acao.valor } };

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

    case "selecionarEspaco":
      return { ...estado, espaco: acao.espaco };

    case "resetar":
      return acao.estado;
  }
}
