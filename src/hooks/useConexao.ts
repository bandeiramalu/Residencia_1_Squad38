"use client";

import { useSyncExternalStore } from "react";
import { assinarConexao, estaOnline } from "@/lib/conexao";
import { assinarSimulacoes, simulacaoAtiva, type Simulacao } from "@/lib/simulacoes";

/** `false` sem conexão (real ou simulada no modo apresentação). No servidor, `true`. */
export function useOnline(): boolean {
  return useSyncExternalStore(assinarConexao, estaOnline, () => true);
}

/** `true` quando a simulação está ligada (e o modo apresentação também). No servidor, `false`. */
export function useSimulacao(s: Simulacao): boolean {
  return useSyncExternalStore(
    assinarSimulacoes,
    () => simulacaoAtiva(s),
    () => false,
  );
}
