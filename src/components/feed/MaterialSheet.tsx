"use client";

import { Bookmark, BookmarkCheck, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DisciplinaIcon } from "@/components/ui/DisciplinaIcon";
import { RodapeSheet } from "@/components/ui/RodapeSheet";
import { Sheet } from "@/components/ui/Sheet";
import { dataCurta } from "@/lib/tempo";
import { baixarMaterial, salvar } from "@/store/actions";
import type { Pessoa, Post } from "@/store/types";

/** Pré-visualização de um material (PDF) antes de baixar. */
export function MaterialSheet({ post, autor, onFechar }: { post: Post | null; autor?: Pessoa; onFechar: () => void }) {
  return (
    <Sheet aberto={!!post?.anexo} onFechar={onFechar} titulo="Material da turma" subtitulo={autor?.nome}>
      {post?.anexo && (
        <>
          <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-verde-2 via-verde to-tinta p-5 text-white">
            <DisciplinaIcon disciplina={post.disciplina} className="absolute -right-4 -top-4 size-28 opacity-10" />
            <DisciplinaIcon disciplina={post.disciplina} className="size-7" />
            <p className="mt-3 break-all text-base font-bold">{post.anexo.nome}</p>
            <p className="mt-1 text-xs text-white/80">
              {post.disciplina} · PDF · {post.anexo.paginas} páginas · {post.anexo.tamanho} · {dataCurta(post.criadoEm)}
            </p>
          </div>

          {/* Miniaturas das páginas */}
          <div className="sem-scrollbar -mx-5 mt-4 flex gap-2.5 overflow-x-auto px-5">
            {Array.from({ length: Math.min(post.anexo.paginas, 6) }, (_, i) => (
              <div key={i} className="flex h-28 w-20 shrink-0 flex-col gap-1.5 rounded-lg border border-borda bg-white p-2 shadow-card">
                <div className="h-2 w-3/4 rounded-full bg-verde-suave" />
                {Array.from({ length: 6 }, (_, j) => (
                  <div key={j} className="h-1 rounded-full bg-fundo" style={{ width: `${60 + ((i * 7 + j * 13) % 40)}%` }} />
                ))}
                <span className="mt-auto text-right text-[9px] text-texto-2">{i + 1}</span>
              </div>
            ))}
          </div>

          <p className="mt-4 text-[14px] leading-relaxed text-texto">{post.texto}</p>

          <RodapeSheet>
            <Button variante="secundario" tamanho="lg" className="flex-1" onClick={() => salvar(post.id)}>
              {post.salvo ? <BookmarkCheck /> : <Bookmark />} {post.salvo ? "Salvo" : "Salvar"}
            </Button>
            <Button tamanho="lg" className="flex-1" onClick={() => baixarMaterial(post)}>
              <Download /> Baixar PDF
            </Button>
          </RodapeSheet>
        </>
      )}
    </Sheet>
  );
}
