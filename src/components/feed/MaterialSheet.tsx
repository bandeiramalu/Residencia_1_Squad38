"use client";

import { Bookmark, Download, ExternalLink, FileText } from "lucide-react";
import { useMemo } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { RodapeSheet } from "@/components/ui/RodapeSheet";
import { Sheet } from "@/components/ui/Sheet";
import { useAtor } from "@/hooks/useAtor";
import { cn } from "@/lib/cn";
import { useUrlArquivo } from "@/lib/arquivos";
import { previaDoAnexo, resumoDoAnexo, tipoDoAnexo } from "@/lib/materiais";
import { dataCurta } from "@/lib/tempo";
import { salvar } from "@/store/actions";
import { salvou } from "@/store/seletores";
import type { Pessoa, Post } from "@/store/types";
import { abrirDoPost, baixarDoPost } from "./anexo";

/** Pré-visualização de um material (PDF) antes de baixar. */
export function MaterialSheet({ aberto, post, autor, onFechar }: { aberto: boolean; post: Post | null; autor?: Pessoa; onFechar: () => void }) {
  const ator = useAtor();
  const guardado = post ? salvou(post, ator.id) : false;
  const nomeAnexo = post?.anexo?.nome;
  const disciplina = post?.disciplina;
  const arquivoId = post?.anexo?.arquivoId;
  const url = useUrlArquivo(arquivoId);
  const tipo = post?.anexo ? tipoDoAnexo(post.anexo) : "";
  const previa = useMemo(() => (nomeAnexo && !arquivoId ? previaDoAnexo(nomeAnexo, { disciplina }) : null), [nomeAnexo, arquivoId, disciplina]);
  return (
    <Sheet aberto={aberto && !!post?.anexo} onFechar={onFechar} titulo="Material">
      {post?.anexo && (
        <>
          <div className="flex items-start gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-superficie-2 text-texto-2 ring-1 ring-inset ring-borda">
              <FileText className="size-6" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="break-all text-[16px] font-semibold leading-snug text-tinta">{post.anexo.nome}</p>
              <p className="mt-0.5 text-[13px] tabular-nums text-texto-2">
                {post.disciplina ? `${post.disciplina} · ` : ""}
                {resumoDoAnexo(post.anexo)}
              </p>
            </div>
          </div>

          {arquivoId && url && tipo === "PDF" && (
            <iframe src={url} title={`Prévia de ${post.anexo.nome}`} className="mt-4 h-[52vh] min-h-72 w-full rounded-xl border border-borda bg-superficie-2" />
          )}
          {arquivoId && url && tipo === "Imagem" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={post.anexo.descricao || `Imagem enviada por ${autor?.nome ?? "um membro do CEPI"}`} className="mt-4 max-h-[52vh] w-full rounded-xl border border-borda bg-superficie-2 object-contain" />
          )}
          {arquivoId && !url && <p className="mt-4 rounded-xl bg-superficie-2 px-3.5 py-3 text-[13px] text-texto-2">Carregando o arquivo…</p>}

          {previa && (
            <div className="mt-4 rounded-xl border border-borda bg-superficie p-3.5" aria-label="Prévia do conteúdo">
              <p className="text-[14px] font-semibold text-tinta">{previa.titulo}</p>
              {previa.resumo && <p className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-texto-2">{previa.resumo}</p>}
              {previa.topicos.length > 0 && (
                <ol className="mt-2.5 space-y-1 border-t border-borda pt-2.5">
                  {previa.topicos.slice(0, 6).map((t, i) => (
                    <li key={t} className="flex gap-2 text-[13px] text-texto">
                      <span className="w-4 shrink-0 tabular-nums text-texto-2">{i + 1}</span>
                      <span className="min-w-0 truncate">{t}</span>
                    </li>
                  ))}
                  {previa.topicos.length > 6 && <li className="pl-6 text-[12px] text-texto-2">e mais {previa.topicos.length - 6} no PDF</li>}
                </ol>
              )}
            </div>
          )}

          <div className="mt-4 flex items-center gap-2.5 border-t border-borda pt-4">
            <Avatar nome={autor?.nome ?? "?"} iniciais={autor?.iniciais} tamanho="sm" />
            <p className="min-w-0 truncate text-[13px] text-texto-2">
              <span className="font-medium text-tinta">{autor?.nome ?? "Membro do CEPI"}</span> · {dataCurta(post.criadoEm)}
            </p>
          </div>
          <p className="mt-2.5 text-[14.5px] leading-relaxed text-texto">{post.texto}</p>

          <RodapeSheet>
            <Button variante="secundario" tamanho="lg" className="px-4" onClick={() => salvar(post.id)} aria-pressed={guardado} aria-label={guardado ? "Remover dos salvos" : "Salvar"}>
              <Bookmark className={cn(guardado && "fill-current")} />
            </Button>
            <Button
              variante="secundario"
              tamanho="lg"
              className="flex-1"
              onClick={() => abrirDoPost(post, autor)}
            >
              <ExternalLink /> {tipo === "PDF" ? "Abrir PDF" : "Abrir arquivo"}
            </Button>
            <Button tamanho="lg" className="flex-1" onClick={() => baixarDoPost(post, autor)}>
              <Download /> Baixar
            </Button>
          </RodapeSheet>
        </>
      )}
    </Sheet>
  );
}
