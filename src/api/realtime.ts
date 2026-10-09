/**
 * Tempo real (WebSocket): presença, chat e ciclo das salas coletivas, notificações, campeonatos,
 * entregas de atividades e chat das salas coletivas.
 *
 * LIGADO SÓ NO MODO HTTP (com `NEXT_PUBLIC_API_URL`): `store/store.ts` chama `tempoReal.conectar()` quando há sessão
 * (`cepi:sessao-iniciada` ou sessão já gravada ao abrir), `desconectar()` ao sair (`cepi:sessao-encerrada`) e ouve
 * `notificacao.nova` → `despachar({ type: "notificar", … })`. No modo local `WS_URL` é vazio e nada conecta — a
 * sincronização entre janelas usa o evento `storage` do navegador. Ainda NÃO assinam: presença/chat/fase das salas
 * (`assinarSala`), `campeonato.atualizado` e `atividade.entregue` (pendência: as telas leem o estado local;
 * docs/BACKEND.md § Tempo real). Exemplo de uso completo:
 *
 *   tempoReal.conectar();                       // depois do login
 *   const sair = tempoReal.assinarSala(id, {
 *     mensagem: ({ mensagem }) => despachar({ type: "mensagemSala", salaId: id, mensagem }),
 *     presenca: ({ membros }) => despachar({ type: "membrosSala", salaId: id, membros }),
 *   });
 *   tempoReal.on("notificacao.nova", ({ notificacao }) => despachar({ type: "notificar", notificacao }));
 *
 * Eventos do servidor entram com `despachar` (store.ts), NÃO com `commit`: assim não voltam ao servidor pelo sync.
 *
 * Protocolo — um JSON por frame:
 *   cliente → servidor: {tipo:"autenticar", token} · {tipo:"sala.assinar", salaId} · {tipo:"sala.cancelar", salaId} · {tipo:"ping"}
 *   servidor → cliente: {tipo:"pronto"} · {tipo:"pong"} · {tipo:"erro", codigo, mensagem} · {tipo:<evento>, id, em, dados}
 *   Fechamentos: 4401 token inválido/expirado · 4403 sem permissão (o cliente não insiste); outros → reconecta.
 */
import { lerSessao } from "@/lib/auth";
import type { Campeonato, Entrega, FaseTimer, MensagemSala, Notificacao } from "@/store/types";
import { API_URL } from "./client";

/** `NEXT_PUBLIC_WS_URL` ou, se ausente, a API com ws(s):// + /ws. Vazio no modo local = nunca conecta. */
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL?.replace(/\/$/, "") || (API_URL ? `${API_URL.replace(/^http/, "ws")}/ws` : "");

export interface EventosTempoReal {
  /** Lista COMPLETA de quem está na sala (o cliente só substitui) + quem entrou/saiu agora. */
  "sala.presenca": { salaId: string; membros: string[]; entrou?: string; saiu?: string };
  "sala.mensagem": { salaId: string; mensagem: MensagemSala };
  /** O ciclo sincronizado da sala mudou de fase (foco ↔ pausa) ou foi reconfigurado. */
  "sala.fase": { salaId: string; fase: FaseTimer; faseInicio: number; cicloInicio: number; focoMin: number; pausaMin: number };
  "notificacao.nova": { notificacao: Notificacao };
  /** Inscrição, início, duelo decidido, encerramento… sempre com o campeonato inteiro (visão de quem recebe). */
  "campeonato.atualizado": { campeonato: Campeonato };
  /** Para o professor: um aluno entregou. */
  "atividade.entregue": { atividadeId: string; alunoId: string; entrega: Entrega };
}

export type TipoEvento = keyof EventosTempoReal;

/** Envelope de todo evento: `id` único (o cliente ignora repetidos depois de reconectar) e `em` (ms do servidor). */
export type EventoServidor = { [T in TipoEvento]: { tipo: T; id: string; em: number; dados: EventosTempoReal[T] } }[TipoEvento];

type MensagemServidor = EventoServidor | { tipo: "pronto" } | { tipo: "pong" } | { tipo: "erro"; codigo: string; mensagem: string };

export type ComandoCliente =
  | { tipo: "autenticar"; token: string }
  | { tipo: "sala.assinar"; salaId: string }
  | { tipo: "sala.cancelar"; salaId: string }
  | { tipo: "ping" };

export interface HandlersSala {
  presenca?: (dados: EventosTempoReal["sala.presenca"]) => void;
  mensagem?: (dados: EventosTempoReal["sala.mensagem"]) => void;
  fase?: (dados: EventosTempoReal["sala.fase"]) => void;
}

export type EstadoConexao = "desligado" | "conectando" | "conectado" | "reconectando";

export interface OpcoesTempoReal {
  url?: string;
  /**
   * Token enviado no 1º frame (nunca na URL, que vai parar em logs). Padrão: o JWT da sessão.
   * Alternativa mais segura: `() => chamar(ENDPOINTS.auth.ticketTempoReal).then((t) => t.ticket)`.
   */
  obterToken?: () => string | undefined | Promise<string | undefined>;
}

const BATIMENTO_MS = 20_000;
/** Sem nenhum frame por esse tempo = conexão "zumbi" (Wi-Fi da escola caiu sem avisar): fecha e reconecta. */
const SILENCIO_MAX_MS = 45_000;
const ESPERA_MAX_MS = 30_000;
const MAX_VISTOS = 200;

function seguro(fn: () => void) {
  try {
    fn();
  } catch (erro) {
    console.warn("[tempo real] erro num handler", erro);
  }
}

export function criarTempoReal({ url = WS_URL, obterToken = () => lerSessao()?.token }: OpcoesTempoReal = {}) {
  let ws: WebSocket | null = null;
  let estado: EstadoConexao = "desligado";
  let querConectado = false;
  let tentativas = 0;
  let ultimoSinal = 0;
  let reconexao: ReturnType<typeof setTimeout> | undefined;
  let batimento: ReturnType<typeof setInterval> | undefined;
  const salas = new Map<string, Set<HandlersSala>>();
  const ouvintes = new Map<TipoEvento, Set<(dados: never) => void>>();
  const ouvintesEstado = new Set<(e: EstadoConexao) => void>();
  const vistos: string[] = [];

  function mudar(novo: EstadoConexao) {
    if (estado === novo) return;
    estado = novo;
    ouvintesEstado.forEach((o) => seguro(() => o(novo)));
  }

  /** Comandos só depois do "pronto" (autenticado); o "autenticar" vai direto no onopen. */
  function enviar(comando: ComandoCliente) {
    if (estado === "conectado" && ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(comando));
  }

  function pararBatimento() {
    clearInterval(batimento);
    batimento = undefined;
  }

  function iniciarBatimento() {
    pararBatimento();
    batimento = setInterval(() => {
      if (Date.now() - ultimoSinal > SILENCIO_MAX_MS) ws?.close(4000, "sem sinal");
      else enviar({ tipo: "ping" });
    }, BATIMENTO_MS);
  }

  function agendarReconexao() {
    clearTimeout(reconexao);
    mudar("reconectando");
    const espera = Math.min(ESPERA_MAX_MS, 1000 * 2 ** tentativas) * (0.5 + Math.random() / 2);
    tentativas++;
    reconexao = setTimeout(() => void abrir(), espera);
  }

  function distribuir(ev: EventoServidor) {
    ouvintes.get(ev.tipo)?.forEach((fn) => seguro(() => (fn as (d: EventoServidor["dados"]) => void)(ev.dados)));
    switch (ev.tipo) {
      case "sala.presenca": {
        const dados = ev.dados;
        salas.get(dados.salaId)?.forEach((h) => seguro(() => h.presenca?.(dados)));
        break;
      }
      case "sala.mensagem": {
        const dados = ev.dados;
        salas.get(dados.salaId)?.forEach((h) => seguro(() => h.mensagem?.(dados)));
        break;
      }
      case "sala.fase": {
        const dados = ev.dados;
        salas.get(dados.salaId)?.forEach((h) => seguro(() => h.fase?.(dados)));
        break;
      }
    }
  }

  function receber(bruto: unknown) {
    ultimoSinal = Date.now();
    let msg: MensagemServidor;
    try {
      msg = JSON.parse(String(bruto)) as MensagemServidor;
    } catch {
      return;
    }
    if (msg.tipo === "pong") return;
    if (msg.tipo === "erro") {
      console.warn(`[tempo real] ${msg.codigo}: ${msg.mensagem}`);
      return;
    }
    if (msg.tipo === "pronto") {
      tentativas = 0;
      mudar("conectado");
      for (const salaId of salas.keys()) enviar({ tipo: "sala.assinar", salaId });
      iniciarBatimento();
      return;
    }
    if (vistos.includes(msg.id)) return;
    vistos.push(msg.id);
    if (vistos.length > MAX_VISTOS) vistos.shift();
    distribuir(msg);
  }

  async function abrir() {
    if (!querConectado || ws || !url || typeof WebSocket === "undefined") return;
    mudar(tentativas ? "reconectando" : "conectando");
    let token: string | undefined;
    try {
      token = await obterToken();
    } catch {
      token = undefined;
    }
    if (!querConectado || ws) return;
    if (!token || token === "demo") return mudar("desligado");

    let socket: WebSocket;
    try {
      socket = new WebSocket(url);
    } catch {
      return agendarReconexao();
    }
    ws = socket;
    socket.onopen = () => {
      ultimoSinal = Date.now();
      socket.send(JSON.stringify({ tipo: "autenticar", token } satisfies ComandoCliente));
    };
    socket.onmessage = (e) => receber(e.data);
    socket.onerror = () => socket.close();
    socket.onclose = (e) => {
      if (ws !== socket) return;
      ws = null;
      pararBatimento();
      if (e.code === 4401 || e.code === 4403) {
        querConectado = false;
        return mudar("desligado");
      }
      if (querConectado) agendarReconexao();
      else mudar("desligado");
    };
  }

  const aoVoltarConexao = () => {
    if (!querConectado || ws) return;
    clearTimeout(reconexao);
    tentativas = 0;
    void abrir();
  };
  const aoCairConexao = () => ws?.close(4000, "offline");
  const aoVoltarAba = () => {
    if (document.visibilityState === "visible") aoVoltarConexao();
  };

  return {
    /** Conecta (e reconecta sozinho até `desconectar()`). No modo local não faz nada. */
    conectar() {
      if (querConectado || !url || typeof window === "undefined") return;
      querConectado = true;
      tentativas = 0;
      window.addEventListener("online", aoVoltarConexao);
      window.addEventListener("offline", aoCairConexao);
      document.addEventListener("visibilitychange", aoVoltarAba);
      void abrir();
    },

    /** Fecha de vez (logout). As assinaturas continuam guardadas para um próximo `conectar()`. */
    desconectar() {
      querConectado = false;
      clearTimeout(reconexao);
      pararBatimento();
      if (typeof window !== "undefined") {
        window.removeEventListener("online", aoVoltarConexao);
        window.removeEventListener("offline", aoCairConexao);
        document.removeEventListener("visibilitychange", aoVoltarAba);
      }
      const socket = ws;
      ws = null;
      socket?.close(1000, "logout");
      mudar("desligado");
    },

    /** Recebe presença, chat e fases de uma sala. Devolve a função que cancela a assinatura. */
    assinarSala(salaId: string, handlers: HandlersSala) {
      let grupo = salas.get(salaId);
      if (!grupo) {
        grupo = new Set();
        salas.set(salaId, grupo);
        enviar({ tipo: "sala.assinar", salaId });
      }
      grupo.add(handlers);
      const meuGrupo = grupo;
      return () => {
        meuGrupo.delete(handlers);
        if (meuGrupo.size || salas.get(salaId) !== meuGrupo) return;
        salas.delete(salaId);
        enviar({ tipo: "sala.cancelar", salaId });
      };
    },

    /** Ouve um tipo de evento (qualquer sala/campeonato). Devolve a função que para de ouvir. */
    on<T extends TipoEvento>(tipo: T, fn: (dados: EventosTempoReal[T]) => void) {
      let grupo = ouvintes.get(tipo);
      if (!grupo) {
        grupo = new Set();
        ouvintes.set(tipo, grupo);
      }
      grupo.add(fn);
      return () => {
        ouvintes.get(tipo)?.delete(fn);
      };
    },

    estado: () => estado,

    /** Para um indicador de conexão (compatível com `useSyncExternalStore` junto com `estado`). */
    assinarEstado(fn: (e: EstadoConexao) => void) {
      ouvintesEstado.add(fn);
      return () => {
        ouvintesEstado.delete(fn);
      };
    },
  };
}

export type ClienteTempoReal = ReturnType<typeof criarTempoReal>;

/** Instância única do app (não conecta sozinha). */
export const tempoReal = criarTempoReal();
