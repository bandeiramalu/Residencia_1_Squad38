"use client";

import Link from "next/link";
import { classesDoBotao } from "@/components/ui/Button";
import { useSessao } from "@/lib/auth";
import { HOME } from "@/lib/guarda";

export default function NaoEncontrado() {
  const papel = useSessao()?.papel ?? "aluno";
  return (
    <div className="py-16 text-center">
      <p className="text-5xl font-extrabold text-verde-suave" aria-hidden>
        404
      </p>
      <h1 className="mt-2 text-lg font-bold text-tinta">Página não encontrada</h1>
      <p className="mt-1 text-sm text-texto-2">Esse endereço não existe no Portal do Aluno.</p>
      <Link href={HOME[papel]} className={`${classesDoBotao({ variante: "primario", tamanho: "lg" })} mt-6`}>
        {papel === "professor" ? "Voltar ao Painel" : "Voltar ao Início"}
      </Link>
    </div>
  );
}
