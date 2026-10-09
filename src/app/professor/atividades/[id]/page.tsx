import type { Metadata } from "next";
import { AtividadeView } from "@/components/professor/AtividadeView";

export const metadata: Metadata = { title: "Atividade" };

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AtividadeView key={id} id={id} />;
}
