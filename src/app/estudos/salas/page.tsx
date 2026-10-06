import type { Metadata } from "next";
import { SalasView } from "@/components/salas/SalasView";

export const metadata: Metadata = { title: "Salas de estudo" };

export default function Pagina() {
  return <SalasView />;
}
