import type { Metadata } from "next";
import { EstudosView } from "@/components/estudos/EstudosView";

export const metadata: Metadata = { title: "Sala de estudos" };

export default function Pagina() {
  return <EstudosView />;
}
