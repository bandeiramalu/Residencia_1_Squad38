import type { Metadata } from "next";
import { CampeonatosView } from "@/components/campeonatos/CampeonatosView";

export const metadata: Metadata = { title: "Campeonatos" };

export default function Pagina() {
  return <CampeonatosView />;
}
