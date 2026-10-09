/**
 * Store global do Portal do Aluno.
 *
 * Um "mini-Redux": o estado vive fora do React, muda só via `despachar(acao)`
 * (reducer puro em ./reducer.ts) e os componentes leem com `useEstado()`, que usa
 * o `useSyncExternalStore` do React. O estado é salvo no localStorage: o app continua
 * de onde parou ao recarregar e várias janelas compartilham os mesmos dados em tempo real.
 *
 * Duas janelas escrevem no mesmo estado, então cada gravação também troca uma "revisão" (`CHAVE_REV`, um
 * texto pequeno). Antes de reduzir uma ação, a janela confere a revisão: se outra gravou depois da última
 * leitura, relê o estado salvo e aplica a ação sobre ele — nenhuma ação sobrescreve a mudança da outra.
 */
import { useSyncExternalStore } from "react";
import { MODO_API } from "@/api/client";
import { tempoReal } from "@/api/realtime";
import { lerSessao } from "@/lib/auth";
import { diaDaSemana, inicioDoDia } from "@/lib/tempo";
import { reducer, type Acao } from "./reducer";
import { criarEstadoInicial, migrarEstado } from "./seed";
import type { AppState } from "./types";
import { TOAST_DA_NOTIFICACAO, toast } from "./ui";

const CHAVE = "cepi-portal-do-aluno";
const CHAVE_REV = `${CHAVE}-rev`;

let estado: AppState | null = null;
let estadoServidor: AppState | null = null;
/** Revisão do estado salvo que esta janela já leu ou gravou (`null` = ninguém gravou ainda, ou sem armazenamento). */
let revisaoVista: string | null = null;
const ouvintes = new Set<() => void>();

function lerRevisao(): string | null {
  try {
    return localStorage.getItem(CHAVE_REV);
  } catch {
    return null;
  }
}

/** Grava o estado e troca a revisão (conteúdo primeiro: quem vê a revisão nova já encontra o estado novo). */
function gravar(conteudo: AppState) {
  localStorage.setItem(CHAVE, JSON.stringify(conteudo));
  const revisao = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  localStorage.setItem(CHAVE_REV, revisao);
  revisaoVista = revisao;
}

/** Aplica a virada do dia ao estado que acabou de ser lido e persiste, para o próximo carregamento já vir virado. */
function comDiaAtual(dados: AppState): AppState {
  const agora = Date.now();
  const virado = reducer(dados, { type: "virarDia", dia: inicioDoDia(agora), diaSemana: diaDaSemana(agora) });
  if (virado !== dados) {
    try {
      gravar(virado);
    } catch {
      /* sem armazenamento: vale só nesta sessão */
    }
  }
  return virado;
}

function carregar(): AppState {
  try {
    // A revisão é lida ANTES do conteúdo: se outra janela gravar entre as duas leituras, a próxima ação relê.
    const revisao = lerRevisao();
    const salvo = localStorage.getItem(CHAVE);
    revisaoVista = revisao;
    if (salvo) {
      let dados: AppState | null = null;
      try {
        dados = migrarEstado(JSON.parse(salvo));
      } catch {
        dados = null;
      }
      if (dados) return comDiaAtual(dados);
      // Versão desconhecida ou JSON ilegível: o próximo salvamento sobrescreveria, então guarda uma cópia antes.
      guardarBackup(salvo);
    }
  } catch {
    // localStorage indisponível (aba anônima, bloqueio): segue com o estado inicial.
  }
  return criarEstadoInicial(Date.now());
}

function guardarBackup(conteudo: string) {
  try {
    localStorage.setItem(`${CHAVE}-backup-${new Date().toISOString().slice(0, 10)}`, conteudo);
  } catch {
    // Sem espaço para o backup: segue assim mesmo.
  }
}

let avisouCota = false;

function salvarAgora() {
  if (!estado) return;
  try {
    gravar(estado);
  } catch {
    // Sem armazenamento: o app funciona, só não persiste. Avisa uma única vez.
    if (!avisouCota) {
      avisouCota = true;
      toast({ tipo: "alerta", titulo: "Armazenamento do navegador cheio", mensagem: "Suas alterações continuam funcionando agora, mas não serão salvas ao recarregar a página." }, 7000);
    }
  }
}

/**
 * Grava na hora: só a aba que despachou a ação escreve; as outras reidratam pelo evento
 * `storage`. Sem atraso, duas janelas não sobrescrevem uma à outra com dado velho.
 */
function persistir() {
  salvarAgora();
}

function notificar() {
  ouvintes.forEach((ouvinte) => ouvinte());
}

export function obterEstado(): AppState {
  if (!estado) estado = carregar();
  return estado;
}

/**
 * Se outra janela gravou depois da última leitura desta, relê o estado salvo (devolve `true` quando relê).
 * Chamado antes de cada ação: sem gravação alheia só custa ler a revisão, nunca um `JSON.parse` do estado.
 * `incluirSemRevisao`: gravações de versões antigas do app não têm revisão — o evento `storage` as relê sempre.
 */
export function relerSeOutraJanelaGravou(incluirSemRevisao = false): boolean {
  const revisao = lerRevisao();
  if (revisao === null ? !incluirSemRevisao : revisao === revisaoVista) return false;
  try {
    const bruto = localStorage.getItem(CHAVE);
    const novo = bruto ? migrarEstado(JSON.parse(bruto)) : null;
    if (!novo) return false;
    revisaoVista = revisao;
    const antes = estado;
    estado = novo;
    avisarNovasNotificacoes(antes, novo);
    notificar();
    return true;
  } catch {
    return false; // dado corrompido: continua com o que tem em memória
  }
}

export function despachar(acao: Acao): AppState {
  obterEstado();
  relerSeOutraJanelaGravou();
  const anterior = obterEstado();
  const proximo = reducer(anterior, acao);
  if (proximo !== anterior) {
    estado = proximo;
    persistir();
    notificar();
  }
  return proximo;
}

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

if (typeof window !== "undefined") {
  // Tempo real entre janelas: quando outra aba grava, esta reidrata o estado inteiro.
  // Esta aba não grava de volta (só quem despacha grava), então não há laço. O estado e a revisão chegam em
  // eventos separados: qualquer um dos dois dispara a conferência, que só relê se a revisão for nova.
  window.addEventListener("storage", (e) => {
    if (e.key === CHAVE && e.newValue) relerSeOutraJanelaGravou(true);
    else if (e.key === CHAVE_REV) relerSeOutraJanelaGravou();
  });
}

/** Mostra como toast as notificações que chegaram de outra janela para quem está logado aqui. */
function avisarNovasNotificacoes(antes: AppState | null, depois: AppState) {
  const eu = lerSessao()?.usuarioId;
  if (!eu || !antes) return;
  const conhecidas = new Set(antes.notificacoes.map((n) => n.id));
  const novas = depois.notificacoes.filter((n) => n.para === eu && !n.lida && !conhecidas.has(n.id)).slice(0, 3);
  for (const n of novas) toast({ tipo: TOAST_DA_NOTIFICACAO[n.tipo], titulo: n.titulo, mensagem: n.texto, href: n.href }, 4200);
}

function obterEstadoServidor() {
  // Só é lido durante a hidratação; o <PortaDeHidratacao> não renderiza telas nesse momento.
  if (!estadoServidor) estadoServidor = criarEstadoInicial(0);
  return estadoServidor;
}

export function useEstado(): AppState {
  return useSyncExternalStore(assinar, obterEstado, obterEstadoServidor);
}

/**
 * Lê só uma fatia do estado: o componente re-renderiza apenas quando ESSA fatia muda.
 * O seletor deve devolver algo já existente no estado (não crie objetos novos aqui).
 */
export function useSeletor<T>(seletor: (estado: AppState) => T): T {
  return useSyncExternalStore(
    assinar,
    () => seletor(obterEstado()),
    () => seletor(obterEstadoServidor()),
  );
}

const assinarNada = () => () => {};

/** `false` no servidor e durante a hidratação; `true` depois, no navegador. */
export function useHidratado() {
  return useSyncExternalStore(
    assinarNada,
    () => true,
    () => false,
  );
}

/* ───────────── Tempo real (só com backend) ───────────── */

if (typeof window !== "undefined" && MODO_API === "http") {
  // Notificações do servidor entram com `despachar` (não `commit`): não voltam ao servidor pelo sync.
  tempoReal.on("notificacao.nova", ({ notificacao }) => {
    if (obterEstado().notificacoes.some((n) => n.id === notificacao.id)) return;
    despachar({ type: "notificar", notificacao });
    if (lerSessao()?.usuarioId === notificacao.para) {
      toast({ tipo: TOAST_DA_NOTIFICACAO[notificacao.tipo], titulo: notificacao.titulo, mensagem: notificacao.texto, href: notificacao.href }, 4200);
    }
  });
  window.addEventListener("cepi:sessao-iniciada", () => tempoReal.conectar());
  window.addEventListener("cepi:sessao-encerrada", () => tempoReal.desconectar());
  if (lerSessao()) tempoReal.conectar();
}
