import type { Metadata } from "next";
import { ConversaView } from "@/components/mensagens/ConversaView";

export const metadata: Metadata = { title: "Conversa" };

export default async function ConversaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ConversaView id={id} />;
}
