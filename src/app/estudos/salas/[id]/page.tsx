import type { Metadata } from "next";
import { SalaView } from "@/components/salas/SalaView";

export const metadata: Metadata = { title: "Sala de estudo" };

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SalaView key={id} id={id} />;
}
