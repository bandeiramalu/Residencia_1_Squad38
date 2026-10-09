/**
 * Funções "de IA" do portal com tempo-limite e plano B (Arquitetura §04). Puro, sem React.
 *
 * Hoje as funções (sugestão de disciplina, dúvidas parecidas, triagem de denúncia…) rodam no próprio
 * navegador, mas o contrato é o de um serviço remoto: cada uma tem um tempo máximo e, se falhar,
 * demorar ou devolver algo inválido, a tela segue por um caminho manual — nunca trava nem lança exceção.
 */
import { simulacaoAtiva } from "./simulacoes";

/** P01 sugestão de disciplina · P02 busca semântica · P04 triagem de denúncia · P05 e P07 reservadas (chat, desafios). */
export type FuncaoIA = "P01" | "P02" | "P04" | "P05" | "P07";

const ESGOTOU = Symbol("tempo-esgotado");

/** Tempo máximo de espera por função, em milissegundos. */
export const TEMPO_LIMITE_IA: Record<FuncaoIA, number> = { P01: 2000, P02: 2500, P04: 2000, P05: 1000, P07: 3000 };

export type ResultadoIA<T> = { ok: true; valor: T } | { ok: false; motivo: "indisponivel" | "tempo" | "invalida" };

/**
 * Roda a função "de IA" com tempo-limite e plano B; nunca lança.
 * - `simulacao`: com essa simulação ligada (só no modo apresentação) falha como "indisponivel".
 * - `validar`: devolve `false` para um resultado que não serve ("invalida").
 */
export async function executarIA<T>(
  funcao: FuncaoIA,
  fn: () => T | Promise<T>,
  opcoes?: { simulacao?: "ia" | "busca"; validar?: (valor: T) => boolean },
): Promise<ResultadoIA<T>> {
  if (opcoes?.simulacao && simulacaoAtiva(opcoes.simulacao)) return { ok: false, motivo: "indisponivel" };

  let relogio: ReturnType<typeof setTimeout> | undefined;
  const limite = new Promise<typeof ESGOTOU>((resolver) => {
    relogio = setTimeout(() => resolver(ESGOTOU), TEMPO_LIMITE_IA[funcao]);
  });

  try {
    const resposta = await Promise.race([Promise.resolve().then(fn), limite]);
    if (resposta === ESGOTOU) return { ok: false, motivo: "tempo" };
    const valor = resposta as T;
    if (opcoes?.validar) {
      let serve = false;
      try {
        serve = opcoes.validar(valor);
      } catch {
        serve = false;
      }
      if (!serve) return { ok: false, motivo: "invalida" };
    }
    return { ok: true, valor };
  } catch {
    return { ok: false, motivo: "indisponivel" };
  } finally {
    if (relogio !== undefined) clearTimeout(relogio);
  }
}
