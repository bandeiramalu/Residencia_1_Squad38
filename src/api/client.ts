/**
 * Cliente HTTP do Portal — ponto único de contato com o backend.
 *
 * - Sem `NEXT_PUBLIC_API_URL`: modo local — o app roda 100% no navegador, com dados no localStorage.
 * - Com `NEXT_PUBLIC_API_URL`: modo "http" — login e sincronização usam a API real.
 *
 * Veja docs/BACKEND.md para o contrato completo (docs/api/openapi.yaml).
 * Para chamadas tipadas use `chamar(ENDPOINTS.x.y, {...})` de `./endpoints`.
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
export const MODO_API: "mock" | "http" = API_URL ? "http" : "mock";

export type Metodo = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class ErroApi extends Error {
  constructor(
    public status: number,
    public codigo: string,
    mensagem: string,
  ) {
    super(mensagem);
  }
}

function lerToken() {
  try {
    const bruto = localStorage.getItem("cepi-sessao");
    return bruto ? (JSON.parse(bruto) as { token?: string }).token : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Requisição JSON autenticada (Bearer + cookie). Lança `ErroApi` com o corpo `{ codigo, mensagem }` do backend.
 * `FormData` (upload de anexos) vai como multipart — o navegador monta o cabeçalho sozinho.
 */
export async function api<T>(
  metodo: Metodo,
  caminho: string,
  corpo?: unknown,
  sinal?: AbortSignal,
  cabecalhos?: Record<string, string>,
): Promise<T> {
  const token = lerToken();
  const multipart = typeof FormData !== "undefined" && corpo instanceof FormData;
  const resposta = await fetch(`${API_URL}${caminho}`, {
    method: metodo,
    headers: {
      Accept: "application/json",
      ...(corpo !== undefined && !multipart ? { "Content-Type": "application/json" } : {}),
      ...(token && token !== "demo" ? { Authorization: `Bearer ${token}` } : {}),
      ...cabecalhos,
    },
    body: corpo === undefined ? undefined : multipart ? (corpo as FormData) : JSON.stringify(corpo),
    credentials: "include",
    signal: sinal,
  });
  if (!resposta.ok) {
    const erro = (await resposta.json().catch(() => ({}))) as { codigo?: string; mensagem?: string };
    throw new ErroApi(resposta.status, erro.codigo ?? "erro_desconhecido", erro.mensagem ?? resposta.statusText);
  }
  if (resposta.status === 204 || resposta.headers.get("Content-Length") === "0") return undefined as T;
  return (await resposta.json()) as T;
}
