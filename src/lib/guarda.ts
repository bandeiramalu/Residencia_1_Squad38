/**
 * Guarda de rotas única (Next e demonstração em HTML): decide, pela sessão da aba, se a
 * pessoa pode ficar na rota ou para onde ir. Função pura — quem chama faz o redirecionamento.
 * Em produção a validação de verdade (JWT) é do backend; isto só organiza a navegação.
 */
import type { PapelSessao } from "@/lib/auth";

export const HOME: Record<PapelSessao, string> = { aluno: "/feed", professor: "/professor" };

/** Rotas compartilhadas pelos dois papéis. */
const COMPARTILHADAS = ["/estudos/salas", "/campeonatos", "/pessoas"];

const comeca = (caminho: string, prefixo: string) => caminho === prefixo || caminho.startsWith(`${prefixo}/`);

/** O papel pode abrir este caminho (sem query)? */
export function rotaPermitida(caminho: string, papel: PapelSessao) {
  if (caminho === "/" || caminho === "/login") return false;
  if (COMPARTILHADAS.some((r) => comeca(caminho, r))) return true;
  return (papel === "professor") === comeca(caminho, "/professor");
}

/** Só caminhos internos (evita redirecionamento aberto). */
export function voltarSeguro(voltar: string | null | undefined): string | null {
  return voltar && voltar.startsWith("/") && !voltar.startsWith("//") && !voltar.startsWith("/\\") ? voltar : null;
}

/** Para onde ir depois de entrar: `voltar` se o papel puder abri-lo, senão a home do papel. */
export function destinoAposLogin(papel: PapelSessao, voltar?: string | null) {
  const v = voltarSeguro(voltar);
  return v && rotaPermitida(v.split(/[?#]/)[0].replace(/\/+$/, "") || "/", papel) ? v : HOME[papel];
}

/**
 * Destino do redirecionamento, ou `null` para ficar. `busca` é a query atual (sem "?"),
 * preservada em `voltar` quando falta sessão.
 */
export function destinoDaGuarda(caminho: string, papel: PapelSessao | null, busca = ""): string | null {
  if (caminho === "/login") return papel ? destinoAposLogin(papel, new URLSearchParams(busca).get("voltar")) : null;
  if (!papel) {
    if (caminho === "/") return "/login";
    return `/login?voltar=${encodeURIComponent(busca ? `${caminho}?${busca}` : caminho)}`;
  }
  if (caminho === "/") return HOME[papel];
  const professor = comeca(caminho, "/professor");
  if (COMPARTILHADAS.some((r) => comeca(caminho, r))) return null;
  if (papel === "aluno" && professor) return HOME.aluno;
  if (papel === "professor" && !professor) return HOME.professor;
  return null;
}
