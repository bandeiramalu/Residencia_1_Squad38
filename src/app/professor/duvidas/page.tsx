import type { Metadata } from "next";
import { Suspense } from "react";
import { DuvidasView } from "@/components/professor/DuvidasView";

export const metadata: Metadata = { title: "Dúvidas" };

export default function Pagina() {
  return (
    <Suspense fallback={null}>
      <DuvidasView />
    </Suspense>
  );
}
