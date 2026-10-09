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
/** Cookie antigo (guarda por middleware): só é apagado, nunca mais gravado. */
const COOKIE_ANTIGO = "cepi_papel";
const CHAVE_SENHAS = "cepi-senhas";

let sessao: Sessao | null | undefined;
const ouvintes = new Set<() => void>();

let cookieLimpo = false;
function limparCookieAntigo() {
  if (cookieLimpo || typeof document === "undefined") return;
  cookieLimpo = true;
  try {
    if (document.cookie.split(";").some((c) => c.trim().startsWith(`${COOKIE_ANTIGO}=`))) {
      document.cookie = `${COOKIE_ANTIGO}=; Path=/; Max-Age=0; SameSite=Lax`;
    }
  } catch {
    /* sem acesso a cookies (file://, sandbox) */
  }
}

function ler(): Sessao | null {
  limparCookieAntigo();
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
  limparCookieAntigo();
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
  const entrada = new TextEncoder().encode(texto);
  // `crypto.subtle` só existe em contexto seguro (https, localhost, file://); em http://IP usa o SHA-256 em JS puro.
  const bytes = typeof crypto !== "undefined" && crypto.subtle ? new Uint8Array(await crypto.subtle.digest("SHA-256", entrada)) : sha256(entrada);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const K256 = Uint32Array.from(
  "428a2f98 71374491 b5c0fbcf e9b5dba5 3956c25b 59f111f1 923f82a4 ab1c5ed5 d807aa98 12835b01 243185be 550c7dc3 72be5d74 80deb1fe 9bdc06a7 c19bf174 e49b69c1 efbe4786 0fc19dc6 240ca1cc 2de92c6f 4a7484aa 5cb0a9dc 76f988da 983e5152 a831c66d b00327c8 bf597fc7 c6e00bf3 d5a79147 06ca6351 14292967 27b70a85 2e1b2138 4d2c6dfc 53380d13 650a7354 766a0abb 81c2c92e 92722c85 a2bfe8a1 a81a664b c24b8b70 c76c51a3 d192e819 d6990624 f40e3585 106aa070 19a4c116 1e376c08 2748774c 34b0bcb5 391c0cb3 4ed8aa4a 5b9cca4f 682e6ff3 748f82ee 78a5636f 84c87814 8cc70208 90befffa a4506ceb bef9a3f7 c67178f2"
    .split(" ")
    .map((h) => parseInt(h, 16)),
);

/** SHA-256 em JS puro (FIPS 180-4) — só o fallback para contextos sem `crypto.subtle`. */
function sha256(dados: Uint8Array): Uint8Array {
  const h = Uint32Array.of(0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19);
  const total = Math.ceil((dados.length + 9) / 64) * 64;
  const bloco = new Uint8Array(total);
  bloco.set(dados);
  bloco[dados.length] = 0x80;
  const visao = new DataView(bloco.buffer);
  visao.setUint32(total - 8, Math.floor((dados.length * 8) / 2 ** 32));
  visao.setUint32(total - 4, (dados.length * 8) >>> 0);
  const w = new Uint32Array(64);
  const rot = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  for (let i = 0; i < total; i += 64) {
    for (let t = 0; t < 16; t++) w[t] = visao.getUint32(i + t * 4);
    for (let t = 16; t < 64; t++) {
      const s0 = rot(w[t - 15], 7) ^ rot(w[t - 15], 18) ^ (w[t - 15] >>> 3);
      const s1 = rot(w[t - 2], 17) ^ rot(w[t - 2], 19) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let t = 0; t < 64; t++) {
      const t1 = (hh + (rot(e, 6) ^ rot(e, 11) ^ rot(e, 25)) + ((e & f) ^ (~e & g)) + K256[t] + w[t]) >>> 0;
      const t2 = ((rot(a, 2) ^ rot(a, 13) ^ rot(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    h[0] += a; h[1] += b; h[2] += c; h[3] += d; h[4] += e; h[5] += f; h[6] += g; h[7] += hh;
  }
  const saida = new Uint8Array(32);
  const v = new DataView(saida.buffer);
  h.forEach((x, i) => v.setUint32(i * 4, x));
  return saida;
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
  const norm = (t: string) => t.trim().toLowerCase().replace(/\s+/g, "");
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
