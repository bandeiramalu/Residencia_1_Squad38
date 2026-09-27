"use client";

import { FileText, Info, MessageCircle, MessageCircleQuestionMark, Paperclip, Sparkles, Wand } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useDeferredValue, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Nota } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { RodapeSheet } from "@/components/ui/RodapeSheet";
import { Sheet } from "@/components/ui/Sheet";
import { DISCIPLINAS, type Disciplina } from "@/data/escola";
import { buscarSemelhantes, extrairTags, sugerirCategorias } from "@/lib/busca";
import { cn } from "@/lib/cn";
import { publicar } from "@/store/actions";
import type { Post } from "@/store/types";

type Tipo = "publicacao" | "duvida" | "material";

const TIPOS: { id: Tipo; rotulo: string; icone: typeof FileText; placeholder: string }[] = [
  { id: "publicacao", rotulo: "Publicação", icone: MessageCircle, placeholder: "Escreva sua publicação para a turma..." },
  { id: "duvida", rotulo: "Dúvida", icone: MessageCircleQuestionMark, placeholder: "Descreva sua dúvida: onde você travou e o que tentou..." },
  { id: "material", rotulo: "Material", icone: FileText, placeholder: "Descreva o material que você está compartilhando..." },
];

/** Mínimo de caracteres para a busca de dúvidas parecidas (fluxo 3.2). */
const MIN_BUSCA = 15;

interface Props {
  aberto: boolean;
  onFechar: () => void;
  posts: Post[];
  onPublicado: (id: string) => void;
  onVerPost: (id: string) => void;
}

/** Modal do botão flutuante "+" — Nova publicação (seção 2 do documento de navegação). */
export function NovaPublicacaoSheet({ aberto, onFechar, ...resto }: Props) {
  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo="Nova publicação" subtitulo="Compartilhe com a turma ou peça ajuda em uma disciplina">
      <Formulario onFechar={onFechar} {...resto} />
    </Sheet>
  );
}

function Formulario({ onFechar, posts, onPublicado, onVerPost }: Omit<Props, "aberto">) {
  const [tipo, setTipo] = useState<Tipo>("publicacao");
  const [disciplina, setDisciplina] = useState<Disciplina | null>(null);
  const [texto, setTexto] = useState("");
  const textoAdiado = useDeferredValue(texto);
  const config = TIPOS.find((t) => t.id === tipo)!;
  const pronto = !!disciplina && texto.trim().length > 0;

  const analisar = tipo === "duvida" && textoAdiado.trim().length > MIN_BUSCA;
  const sugestao = useMemo(() => (analisar ? sugerirCategorias(textoAdiado) : null), [analisar, textoAdiado]);
  const semelhantes = useMemo(
    () => (analisar ? buscarSemelhantes(textoAdiado, posts, { tipo: "duvida", limite: 3 }).filter((r) => r.post.respostas.length > 0) : []),
    [analisar, textoAdiado, posts],
  );
  const tagsDigitadas = extrairTags(texto);
  const tagsSugeridas = (sugestao?.tags ?? []).filter((t) => !tagsDigitadas.includes(t));

  const enviar = () => {
    if (!disciplina || !texto.trim()) return;
    const tags = [...new Set([...tagsDigitadas, ...(tipo === "duvida" ? tagsSugeridas.slice(0, 1) : [])])];
    const id = publicar({ tipo, disciplina, texto: texto.trim(), tags });
    onFechar();
    onPublicado(id);
  };

  return (
    <>
      {/* Seletor de tipo (3 abas) */}
      <div role="tablist" aria-label="Tipo de publicação" className="grid grid-cols-3 gap-1 rounded-2xl bg-fundo p-1">
        {TIPOS.map((t) => {
          const ativo = t.id === tipo;
          const Icone = t.icone;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={ativo}
              onClick={() => setTipo(t.id)}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-xl py-2.5 text-xs font-semibold transition-colors",
                ativo ? "text-verde" : "text-texto-2 hover:text-verde-2",
              )}
            >
              {ativo && (
                <motion.span
                  layoutId="tipo-publicacao"
                  className="absolute inset-0 rounded-xl bg-white shadow-sm ring-1 ring-borda"
                  transition={{ type: "spring", stiffness: 520, damping: 38 }}
                />
              )}
              <Icone className="relative size-5" />
              <span className="relative">{t.rotulo}</span>
            </button>
          );
        })}
      </div>

      <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-[0.08em] text-verde">
        Disciplina <span className="font-medium normal-case tracking-normal text-texto-2">· obrigatória</span>
      </p>
      <ChipGroup
        grupo="nova-disciplina"
        rotulo="Disciplina"
        quebrar
        opcoes={DISCIPLINAS.map((d) => ({ id: d, rotulo: d }))}
        valor={disciplina}
        onChange={setDisciplina}
      />

      <div className="relative mt-5">
        <textarea
          rows={5}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={config.placeholder}
          maxLength={600}
          aria-label="Texto da publicação"
          className="w-full resize-none rounded-2xl border border-borda bg-verde-mclaro px-4 py-3 text-[15px] leading-relaxed text-texto outline-none transition-colors placeholder:text-texto-2/70 focus:border-verde-2 focus:bg-white"
        />
        <span className="pointer-events-none absolute bottom-2.5 right-3 text-[11px] text-texto-2">{texto.length}/600</span>
      </div>
      <p className="mt-1.5 text-[11.5px] text-texto-2">Dica: use #tags para facilitar a busca (ex.: #funcaoafim).</p>

      <AnimatePresence mode="popLayout" initial={false}>
        {tipo === "material" && (
          <motion.div key="material" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 space-y-3">
            <Nota icone={<Info />}>Um anexo de exemplo é criado junto com a publicação para simular o envio de arquivo.</Nota>
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-verde-suave bg-white p-3">
              <span className="grid size-10 place-items-center rounded-xl bg-verde-claro text-verde">
                <Paperclip className="size-5" />
              </span>
              <div className="min-w-0 text-[13px]">
                <p className="font-semibold text-tinta">{disciplina ? `${disciplina.toLowerCase()}-material.pdf` : "material.pdf"}</p>
                <p className="text-[11.5px] text-texto-2">PDF · 2 páginas · 96 KB (exemplo)</p>
              </div>
            </div>
          </motion.div>
        )}

        {tipo === "duvida" && (
          <motion.div key="duvida" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 space-y-3">
            {!analisar && (
              <p className="flex items-center gap-2 text-[12px] text-texto-2">
                <Sparkles className="size-4 text-verde-2" />
                Digite mais de {MIN_BUSCA} caracteres para ver dúvidas parecidas já respondidas.
              </p>
            )}

            {sugestao && (
              <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-verde-claro bg-verde-mclaro p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-verde">
                  <Wand className="size-3.5" /> Sugestão da IA
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[13px] text-texto">Parece uma dúvida de</span>
                  <Badge tom="verde">{sugestao.disciplina}</Badge>
                  {tagsSugeridas.map((t) => (
                    <Badge key={t} tom="neutro">
                      #{t}
                    </Badge>
                  ))}
                </div>
                {disciplina !== sugestao.disciplina && (
                  <Button variante="rapido" tamanho="sm" className="mt-2.5" onClick={() => setDisciplina(sugestao.disciplina)}>
                    Usar {sugestao.disciplina}
                  </Button>
                )}
              </motion.div>
            )}

            {analisar && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-verde">Dúvidas parecidas já respondidas</p>
                {semelhantes.length === 0 ? (
                  <p className="rounded-xl bg-fundo p-3 text-[13px] text-texto-2">Nenhuma dúvida parecida por enquanto. Pode publicar!</p>
                ) : (
                  <ul className="space-y-2">
                    {semelhantes.map(({ post, score }) => {
                      const oficial = post.respostas.find((r) => r.oficial);
                      return (
                        <motion.li key={post.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                          <button
                            type="button"
                            onClick={() => onVerPost(post.id)}
                            className="w-full rounded-xl border border-borda bg-white p-3 text-left transition-colors hover:border-verde-suave hover:bg-verde-mclaro"
                          >
                            <div className="flex items-center gap-1.5">
                              <Badge tom="claro">{Math.round(score * 100)}% parecida</Badge>
                              {post.disciplina && <Badge tom="contorno">{post.disciplina}</Badge>}
                              {oficial && <Badge tom="verde">Resposta oficial</Badge>}
                            </div>
                            <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-texto">{post.texto}</p>
                            <p className="mt-1 text-xs font-semibold text-verde-2">
                              Ver {post.respostas.length} {post.respostas.length === 1 ? "resposta" : "respostas"} →
                            </p>
                          </button>
                        </motion.li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            <Nota icone={<Info />} tom="branco">
              Enviar dúvida não dá XP. Você recebe <b className="text-tinta">+10 pontos</b> quando alguém responder e{" "}
              <b className="text-tinta">+20 pontos e +15 XP</b> quando o professor der a resposta oficial.
            </Nota>
          </motion.div>
        )}
      </AnimatePresence>

      <RodapeSheet>
        <Button variante="secundario" tamanho="lg" className="flex-1" onClick={onFechar}>
          Cancelar
        </Button>
        <Button tamanho="lg" className="flex-1" disabled={!pronto} onClick={enviar}>
          Publicar
        </Button>
      </RodapeSheet>
      {!pronto && (
        <p className="sr-only" aria-live="polite">
          {!disciplina ? "Selecione uma disciplina para publicar." : "Escreva o texto para publicar."}
        </p>
      )}
    </>
  );
}
