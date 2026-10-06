import type { Metadata } from "next";
import { AtividadesView } from "@/components/professor/AtividadesView";

export const metadata: Metadata = { title: "Atividades" };

export default function Pagina() {
  return <AtividadesView />;
}
