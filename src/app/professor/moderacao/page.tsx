import type { Metadata } from "next";
import { ModeracaoView } from "@/components/professor/ModeracaoView";

export const metadata: Metadata = { title: "Moderação" };

export default function Pagina() {
  return <ModeracaoView />;
}
