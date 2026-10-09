"use client";

import { WifiOff } from "lucide-react";
import { useOnline } from "@/hooks/useConexao";
import { usePendentesEnvio } from "@/store/actions";

/**
 * Faixa "Sem conexão. Tentando retransmitir…" (tela 71), logo abaixo do cabeçalho: aparece enquanto a conexão
 * (real, ou simulada no modo apresentação) estiver fora e some sozinha quando voltar. Com publicações
 * guardadas no aparelho, diz quantas esperam envio. Âmbar + ícone + texto: aviso, não erro.
 *
 * A região `role="status"` fica sempre na página (vazia quando online), para o leitor de tela anunciar a mudança.
 */
export function FaixaConexao() {
  const online = useOnline();
  const pendentes = usePendentesEnvio();
  return (
    <div role="status" className="empty:hidden">
      {!online && (
        <div className="border-b border-amber-200 bg-amber-50">
          <p className="coluna flex items-start gap-2 px-4 py-2 text-[13px] font-medium leading-snug text-amber-900 sm:px-6 lg:px-8">
            <WifiOff className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span className="min-w-0">
              Sem conexão. Tentando retransmitir…
              {pendentes > 0 && ` · ${pendentes} ${pendentes === 1 ? "publicação aguardando" : "publicações aguardando"} envio`}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
