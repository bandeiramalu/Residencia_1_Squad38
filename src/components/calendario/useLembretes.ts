"use client";

import { useEffect } from "react";
import { EVENTOS, inicioDoEvento } from "@/data/calendario";
import { inicioDoDia } from "@/lib/tempo";
import { reconciliarLembretes, verificarLembretes } from "@/store/acoes/aluno";

/**
 * Motor dos lembretes do calendário (monte uma vez, na tela da aluna): ao abrir o app dispara
 * os lembretes vencidos e, enquanto estiver aberto, confere a cada 15 s e ao voltar para a aba.
 */
export function useLembretes(ativo = true) {
  useEffect(() => {
    if (!ativo) return;
    const hoje = inicioDoDia(Date.now());
    reconciliarLembretes(EVENTOS.map((e) => ({ id: e.id, titulo: e.titulo, inicio: inicioDoEvento(e, hoje) })));
    verificarLembretes();
    const intervalo = setInterval(verificarLembretes, 15_000);
    const aoVoltar = () => {
      if (document.visibilityState === "visible") verificarLembretes();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [ativo]);
}
