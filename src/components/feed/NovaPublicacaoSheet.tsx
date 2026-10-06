"use client";

import { ChevronRight, FileText, Info, MessageCircle, MessageCircleQuestionMark, Sparkles } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import { useDeferredValue, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { RodapeSheet } from "@/components/ui/RodapeSheet";
import { Segmentado } from "@/components/ui/Segmentado";
import { Sheet } from "@/components/ui/Sheet";
import { DISCIPLINAS, type Disciplina } from "@/data/escola";
import { buscarSemelhantes, extrairTags, sugerirCategorias } from "@/lib/busca";
import type { ArquivoSalvo } from "@/lib/arquivos";
import { infoDoAnexo } from "@/lib/materiais";
import { publicar } from "@/store/actions";
import type { Anexo, Post } from "@/store/types";
import { SeletorArquivo } from "./SeletorArquivo";

const ACEITA_IMAGEM = ".png,.jpg,.jpeg,.heic";

function slugNome(texto: string) {
  return (
    texto
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/#/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 36) || "material"
  );
}

export type TipoNovaPublicacao = "publicacao" | "duvida" | "material";

const TIPOS: { id: TipoNovaPublicacao; rotulo: string; icone: typeof FileText; placeholder: string }[] = [
  { id: "publicacao", rotulo: "Publicação", icone: MessageCircle, placeholder: "O que você quer compartilhar com a turma?" },
  { id: "duvida", rotulo: "Dúvida", icone: MessageCircleQuestionMark, placeholder: "Onde você travou? Conte o que já tentou…" },
  { id: "material", rotulo: "Material", icone: FileText, placeholder: "Descreva o material que você está compartilhando…" },
];

/** Mínimo de caracteres para a busca de dúvidas parecidas (fluxo 3.2). */
const MIN_BUSCA = 15;
const SUAVE = [0.2, 0, 0, 1] as const;

interface Props {
  aberto: boolean;
  onFechar: () => void;
  /** Tipo já escolhido no composer do feed (Dúvida, Material…). */
  tipoInicial?: TipoNovaPublicacao;
  posts: Post[];
  onPublicado: (id: string) => void;
  onVerPost: (id: string) => void;
}

/** Modal "Nova publicação", aberto pelo composer do feed ou pelo botão "+" do celular. */
export function NovaPublicacaoSheet({ aberto, onFechar, ...resto }: Props) {
  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo="Nova publicação">
      <Formulario onFechar={onFechar} {...resto} />
    </Sheet>
  );
}

function Formulario({ onFechar, tipoInicial = "publicacao", posts, onPublicado, onVerPost }: Omit<Props, "aberto">) {
  // O formulário nasce a cada abertura do modal: o tipo inicial vale só para esta abertura.
  const [tipo, setTipo] = useState<TipoNovaPublicacao>(tipoInicial);
  const [disciplina, setDisciplina] = useState<Disciplina | null>(null);
  const [texto, setTexto] = useState("");
  const [arquivo, setArquivo] = useState<ArquivoSalvo | null>(null);
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
    let anexo: Anexo | undefined;
    if (arquivo) {
      anexo = { nome: arquivo.nome, paginas: arquivo.paginas ?? 0, tamanho: arquivo.tamanho, arquivoId: arquivo.id, mime: arquivo.mime, previa: arquivo.previa };
    } else if (tipo === "material") {
      // Sem arquivo: o PDF é gerado a partir do texto da publicação.
      const nome = `${slugNome(disciplina)}-${slugNome(texto.trim())}.pdf`;
      anexo = { nome, ...infoDoAnexo(nome, { titulo: texto.trim().slice(0, 70), descricao: texto.trim(), disciplina }) };
    }
    const dados = { tipo, disciplina, texto: texto.trim(), tags, anexo };
    const id = publicar(dados);
    onFechar();
    onPublicado(id);
  };

  return (
    <>
      <Segmentado
        grupo="tipo-publicacao"
        rotulo="Tipo de publicação"
        valor={tipo}
        onChange={(t) => {
          setTipo(t);
          if (arquivo && (t === "material" ? false : !arquivo.mime.startsWith("image/"))) setArquivo(null);
        }}
        opcoes={TIPOS.map((t) => {
          const Icone = t.icone;
          return {
            id: t.id,
            rotulo: (
              <>
                <Icone className="max-[400px]:hidden" /> {t.rotulo}
              </>
            ),
          };
        })}
      />

      <p className="mb-2 mt-5 text-[13px] font-medium text-tinta">
        Disciplina <span className="font-normal text-texto-2">· obrigatória</span>
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
          className="w-full resize-none rounded-xl border border-borda bg-superficie px-3.5 pb-7 pt-3 text-[15px] leading-relaxed text-tinta outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-texto-2/70 hover:border-texto-2/40 focus:border-verde focus:ring-3 focus:ring-verde/15"
        />
        <span className="pointer-events-none absolute bottom-3 right-3.5 text-[11.5px] tabular-nums text-texto-2">{texto.length}/600</span>
      </div>
      <p className="mt-1.5 text-[12px] text-texto-2">Use #tags para facilitar a busca (ex.: #funcaoafim).</p>

      <AnimatePresence mode="popLayout" initial={false}>
        {tipo === "material" && (
          <motion.div
            key="material"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: SUAVE }}
            className="mt-4"
          >
            <SeletorArquivo valor={arquivo} onChange={setArquivo} titulo="Anexar o material" />
            <p className="mt-2 flex items-start gap-1.5 text-[12px] leading-snug text-texto-2">
              <Info className="mt-px size-3.5 shrink-0" aria-hidden />
              {arquivo ? "O arquivo escolhido é o que a turma vai abrir e baixar." : "Sem arquivo, o Portal gera um PDF com o texto que você escreveu acima."}
            </p>
          </motion.div>
        )}

        {tipo !== "material" && (
          <motion.div
            key="imagem"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: SUAVE }}
            className="mt-4"
          >
            <SeletorArquivo valor={arquivo} onChange={setArquivo} titulo="Adicionar imagem (opcional)" dica="Foto do caderno ou print · até 10 MB" accept={ACEITA_IMAGEM} />
          </motion.div>
        )}

        {tipo === "duvida" && (
          <motion.div
            key="duvida"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: SUAVE }}
            className="mt-4 space-y-4"
          >
            {!analisar && (
              <p className="flex items-center gap-2 text-[12.5px] text-texto-2">
                <Sparkles className="size-4 shrink-0" />
                Com mais de {MIN_BUSCA} caracteres, mostramos dúvidas parecidas já respondidas.
              </p>
            )}

            {sugestao && (
              <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap items-center gap-x-2 gap-y-2 rounded-xl bg-superficie-2 px-3 py-2.5">
                <Sparkles className="size-4 shrink-0 text-texto-2" aria-hidden />
                <span className="text-[13px] text-texto">
                  Parece uma dúvida de <span className="font-medium text-tinta">{sugestao.disciplina}</span>
                </span>
                {tagsSugeridas.map((t) => (
                  <Badge key={t} tom="neutro">
                    #{t}
                  </Badge>
                ))}
                {disciplina !== sugestao.disciplina && (
                  <Button variante="secundario" tamanho="sm" className="ml-auto" onClick={() => setDisciplina(sugestao.disciplina)}>
                    Usar {sugestao.disciplina}
                  </Button>
                )}
              </motion.div>
            )}

            {analisar && (
              <section aria-label="Dúvidas parecidas já respondidas">
                <p className="mb-2 text-[13px] font-medium text-tinta">Dúvidas parecidas já respondidas</p>
                {semelhantes.length === 0 ? (
                  <p className="rounded-xl bg-superficie-2 px-3 py-2.5 text-[13px] text-texto-2">Nenhuma dúvida parecida por enquanto. Pode publicar.</p>
                ) : (
                  <ul className="divide-y divide-borda overflow-hidden rounded-xl border border-borda">
                    {semelhantes.map(({ post, score }) => {
                      const oficial = post.respostas.some((r) => r.oficial);
                      return (
                        <motion.li key={post.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <button
                            type="button"
                            onClick={() => onVerPost(post.id)}
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-superficie-2"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="line-clamp-2 text-[13.5px] leading-snug text-texto">{post.texto}</span>
                              <span className="mt-1 block text-[12px] text-texto-2">
                                <span className="tabular-nums">{Math.round(score * 100)}% parecida</span>
                                {post.disciplina && ` · ${post.disciplina}`} · {post.respostas.length}{" "}
                                {post.respostas.length === 1 ? "resposta" : "respostas"}
                                {oficial && <span className="text-acento"> · resposta oficial</span>}
                              </span>
                            </span>
                            <ChevronRight className="size-4 shrink-0 text-texto-2" />
                          </button>
                        </motion.li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}

            <p className="text-[12.5px] leading-relaxed text-texto-2">
              Você ganha <span className="font-medium text-texto">+10 pontos</span> quando alguém responder e{" "}
              <span className="font-medium text-texto">+20 pontos e +15 XP</span> com a resposta oficial.
            </p>
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
