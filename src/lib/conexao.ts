/** Estado da conexão: a real (`navigator.onLine`) ou a simulada no modo apresentação. Puro, sem React. */
import { assinarSimulacoes, simulacaoAtiva } from "./simulacoes";

/** `true` sem navegador. Offline de verdade ou simulação "offline" ligada → `false`. */
export function estaOnline(): boolean {
  return typeof navigator === "undefined" || (navigator.onLine !== false && !simulacaoAtiva("offline"));
}

/** Avisa quando a conexão (real ou simulada) mudar. */
export function assinarConexao(ouvinte: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("online", ouvinte);
  window.addEventListener("offline", ouvinte);
  const parar = assinarSimulacoes(ouvinte);
  return () => {
    window.removeEventListener("online", ouvinte);
    window.removeEventListener("offline", ouvinte);
    parar();
  };
}
