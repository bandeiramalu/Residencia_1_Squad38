import type { Metadata } from "next";
import { Suspense } from "react";
import { AlunosView } from "@/components/professor/AlunosView";

export const metadata: Metadata = { title: "Alunos" };

export default function Pagina() {
  return (
    <Suspense fallback={null}>
      <AlunosView />
    </Suspense>
  );
}
