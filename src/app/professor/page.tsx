import type { Metadata } from "next";
import { PainelView } from "@/components/professor/PainelView";

export const metadata: Metadata = { title: "Painel do professor" };

export default function Pagina() {
  return <PainelView />;
}
