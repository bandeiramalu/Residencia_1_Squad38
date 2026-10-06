/**
 * Autenticação do portal (aluno × professor).
 *
 * Modo local (padrão): as contas abaixo são validadas no navegador; a senha pode ser
 * redefinida (fica como hash SHA-256 no localStorage).
 * Modo http (NEXT_PUBLIC_API_URL definido): `entrar()` chama POST /auth/login e guarda o token.
 *
 * A sessão fica no sessionStorage: cada aba/janela tem o seu login (dá para abrir uma aba como
 * aluna e outra como professor) e recarregar mantém. O papel também vai num cookie `cepi_papel`
 * (lido pelo `src/proxy.ts`). Em produção o backend emite um cookie httpOnly assinado (JWT).
 */
import { useSyncExternalStore } from "react";
import { MODO_API, api } from "@/api/client";
import { limparFila } from "@/api/sync";

export type PapelSessao = "aluno" | "professor";

export interface Sessao {
  papel: PapelSessao;
  usuarioId: string;
  nome: string;
  email: string;
  /** Token de acesso (JWT no backend real; "demo" no modo local). */
  token: string;
  entrouEm: number;
}

export const CONTAS_DEMO: Record<PapelSessao, { email: string; senha: string; matricula: string; usuarioId: string; nome: string; descricao: string }> = {
  aluno: {
    email: "ana.moura@aluno.cepi.edu.br",
    senha: "cepi2026",
    matricula: "2026-09A-014",
    usuarioId: "ana",
    nome: "Ana Beatriz Moura",
    descricao: "9º Ano A · Ensino Fundamental II",
  },
  professor: {
    email: "ricardo.nogueira@cepi.edu.br",
    senha: "cepi2026",
    matricula: "D-0231",
    usuarioId: "prof_ricardo",
    nome: "Prof. Ricardo Nogueira",
    descricao: "Matemática · 9º A, 9º B e 8º A",
  },
};

export const HOME_DO_PAPEL: Record<PapelSessao, string> = { aluno: "/feed", professor: "/professor" };

const CHAVE = "cepi-sessao";
const COOKIE = "cepi_papel";
const CHAVE_SENHAS = "cepi-senhas";

let sessao: Sessao | null | undefined;
const ouvintes = new Set<() => void>();

function ler(): Sessao | null {
  if (sessao !== undefined) return sessao;
  try {
    const salvo = sessionStorage.getItem(CHAVE);
    sessao = salvo ? (JSON.parse(salvo) as Sessao) : null;
  } catch {
    sessao = null;
  }
  return sessao;
}

function gravar(nova: Sessao | null) {
  sessao = nova;
  try {
    if (nova) sessionStorage.setItem(CHAVE, JSON.stringify(nova));
    else sessionStorage.removeItem(CHAVE);
  } catch {
    /* sem armazenamento: a sessão dura até recarregar */
  }
  const maxAge = nova ? 60 * 60 * 24 * 30 : 0;
  document.cookie = `${COOKIE}=${nova?.papel ?? ""}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  ouvintes.forEach((o) => o());
}

export class ErroLogin extends Error {}

/** Valida as credenciais e abre a sessão. Devolve a rota inicial do papel. */
export async function entrar(email: string, senha: string, papel: PapelSessao): Promise<string> {
  if (MODO_API === "http") {
    const r = await api<{ token: string; usuario: { id: string; nome: string; papel: PapelSessao } }>("POST", "/auth/login", { email, senha });
    gravar({ papel: r.usuario.papel, usuarioId: r.usuario.id, nome: r.usuario.nome, email, token: r.token, entrouEm: Date.now() });
    return HOME_DO_PAPEL[r.usuario.papel];
  }

  const conta = CONTAS_DEMO[papel];
  const okSenha = (await hashSenha(senha)) === (await hashAtual(papel));
  if (email.trim().toLowerCase() !== conta.email || !okSenha) {
    throw new ErroLogin("E-mail ou senha incorretos.");
  }
  gravar({ papel, usuarioId: conta.usuarioId, nome: conta.nome, email: conta.email, token: "demo", entrouEm: Date.now() });
  return HOME_DO_PAPEL[papel];
}

async function hashSenha(texto: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function lerSenhas(): Partial<Record<PapelSessao, string>> {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_SENHAS) ?? "{}");
  } catch {
    return {};
  }
}

/** Hash da senha vigente: a redefinida pela pessoa ou, se nunca mudou, a da conta. */
async function hashAtual(papel: PapelSessao) {
  return lerSenhas()[papel] ?? (await hashSenha(CONTAS_DEMO[papel].senha));
}

/** Passo 1 do "Esqueci a senha": confere e-mail e matrícula da conta. */
export function confirmarMatricula(papel: PapelSessao, email: string, matricula: string) {
  const conta = CONTAS_DEMO[papel];
  const norm = (t: string) => t.trim().toLowerCase().replace(/s+/g, "");
  return norm(email) === conta.email && norm(matricula) === norm(conta.matricula);
}

/** Passo 2: grava a nova senha (hash SHA-256); o login passa a aceitá-la. */
export async function redefinirSenha(papel: PapelSessao, novaSenha: string) {
  if (novaSenha.length < 6) throw new ErroLogin("A senha precisa ter pelo menos 6 caracteres.");
  const senhas = { ...lerSenhas(), [papel]: await hashSenha(novaSenha) };
  try {
    localStorage.setItem(CHAVE_SENHAS, JSON.stringify(senhas));
  } catch {
    throw new ErroLogin("Não foi possível salvar a nova senha neste navegador.");
  }
}

/** Entrada direta pelos atalhos de conta de teste. */
export function entrarComoDemo(papel: PapelSessao) {
  const conta = CONTAS_DEMO[papel];
  gravar({ papel, usuarioId: conta.usuarioId, nome: conta.nome, email: conta.email, token: "demo", entrouEm: Date.now() });
  return HOME_DO_PAPEL[papel];
}

export function sair() {
  limparFila();
  gravar(null);
}

/** Leitura fora do React (ações, cliente da API). */
export function lerSessao() {
  return typeof window === "undefined" ? null : ler();
}

function assinar(o: () => void) {
  ouvintes.add(o);
  return () => {
    ouvintes.delete(o);
  };
}

export function useSessao(): Sessao | null {
  return useSyncExternalStore(assinar, ler, () => null);
}
