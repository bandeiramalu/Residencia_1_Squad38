import type { Metadata } from "next";
import { LojaView } from "@/components/loja/LojaView";

export const metadata: Metadata = { title: "Loja" };

export default function LojaPage() {
  return <LojaView />;
}
