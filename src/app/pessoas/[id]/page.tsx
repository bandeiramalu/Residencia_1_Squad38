import type { Metadata } from "next";
import { PessoaView } from "@/components/pessoas/PessoaView";

export const metadata: Metadata = { title: "Perfil" };

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PessoaView key={id} id={id} />;
}
