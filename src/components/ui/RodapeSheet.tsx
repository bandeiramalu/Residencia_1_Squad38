import type { ReactNode } from "react";

/**
 * Rodapé fixo dentro do conteúdo de um Sheet (Cancelar / ação principal).
 * `-bottom-4` compensa o padding do contêiner de rolagem, que o sticky respeita.
 */
export function RodapeSheet({ children }: { children: ReactNode }) {
  return (
    <div className="sticky -bottom-4 z-10 -mx-5 -mb-4 mt-5 flex gap-2.5 border-t border-borda bg-white/95 px-5 py-3.5 backdrop-blur">
      {children}
    </div>
  );
}
