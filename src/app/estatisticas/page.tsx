import type { Metadata } from "next";
import { Suspense } from "react";
import { EstatisticasAlunoView } from "@/components/estatisticas/EstatisticasAlunoView";

export const metadata: Metadata = { title: "Estatísticas" };

export default function Pagina() {
  // useSearchParams (filtros na URL) exige limite de Suspense no build estático.
  return (
    <Suspense fallback={null}>
      <EstatisticasAlunoView />
    </Suspense>
  );
}
