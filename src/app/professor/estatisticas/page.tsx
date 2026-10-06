import type { Metadata } from "next";
import { EstatisticasView } from "@/components/professor/EstatisticasView";

export const metadata: Metadata = { title: "Estatísticas" };

export default function Pagina() {
  return <EstatisticasView />;
}
