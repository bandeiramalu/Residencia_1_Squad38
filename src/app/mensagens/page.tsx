import type { Metadata } from "next";
import { MensagensView } from "@/components/mensagens/MensagensView";

export const metadata: Metadata = { title: "Mensagens" };

export default function MensagensPage() {
  return <MensagensView />;
}
