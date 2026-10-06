import type { Metadata } from "next";
import { CampeonatoView } from "@/components/campeonatos/CampeonatoView";

export const metadata: Metadata = { title: "Campeonato" };

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CampeonatoView id={id} />;
}
