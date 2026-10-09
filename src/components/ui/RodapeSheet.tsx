import type { ReactNode } from "react";

/**
 * Rodapé fixo dentro do conteúdo de um Sheet (Cancelar / ação principal).
 * `-bottom-4` compensa o padding do contêiner de rolagem, que o sticky respeita.
 * Cada botão tem largura mínima do próprio rótulo (`min-w-fit`): se os dois não cabem lado a lado (celular estreito),
 * empilham em duas linhas de botão inteiro (como os rodapés com `bloco`) em vez de quebrar o texto do rótulo.
 */
export function RodapeSheet({ children }: { children: ReactNode }) {
  return (
    <div className="sticky -bottom-4 z-10 -mx-5 -mb-4 mt-5 flex flex-wrap gap-2.5 border-t border-borda bg-superficie/95 px-5 py-3.5 backdrop-blur [&>*]:min-w-fit">
      {children}
    </div>
  );
}
