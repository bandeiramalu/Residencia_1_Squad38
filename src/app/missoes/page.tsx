import type { Metadata } from "next";
import { MissoesView } from "@/components/missoes/MissoesView";

export const metadata: Metadata = { title: "Missões" };

export default function MissoesPage() {
  return <MissoesView />;
}
