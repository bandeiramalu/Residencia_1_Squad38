import { lerSessao } from "@/lib/auth";
import { commit } from "../nucleo";
import { obterEstado } from "../store";

export function lerNotificacao(id: string) {
  commit({ type: "lerNotificacao", id });
}

/** Marca como lidas todas as notificações de quem está logado. */
export function lerTodasNotificacoes() {
  const para = lerSessao()?.usuarioId ?? obterEstado().usuario.id;
  commit({ type: "lerTodasNotificacoes", para });
}
