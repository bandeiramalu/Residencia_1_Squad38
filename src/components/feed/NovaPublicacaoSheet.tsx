"use client";

import { ChevronRight, FileText, Info, Megaphone, MessageCircle, MessageCircleQuestionMark, Sparkles, type LucideIcon } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import { useDeferredValue, useEffect, useId, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { RodapeSheet } from "@/components/ui/RodapeSheet";
import { Segmentado } from "@/components/ui/Segmentado";
import { useRascunho } from "@/components/ui/rascunhos";
import { Sheet } from "@/components/ui/Sheet";
import { DESTINOS_PROFESSOR, type DestinoProfessor } from "@/data/professor";
import { DISCIPLINAS, type Disciplina } from "@/data/escola";
import { useSimulacao } from "@/hooks/useConexao";
import { useAtor } from "@/hooks/useAtor";
import { buscarSemelhantes, extrairTags, sugerirCategorias, type ResultadoBusca } from "@/lib/busca";
import type { ArquivoSalvo } from "@/lib/arquivos";
import { cn } from "@/lib/cn";
import { executarIA } from "@/lib/ia";
import { infoDoAnexo } from "@/lib/materiais";
import { simulacaoAtiva } from "@/lib/simulacoes";
import { publicar } from "@/store/actions";
import { useSeletor } from "@/store/store";
import type { Anexo, Post, TipoPost } from "@/store/types";
import { ErroCampo } from "./ErroCampo";
import { SeletorArquivo } from "./SeletorArquivo";

const ACEITA_IMAGEM = ".png,.jpg,.jpeg,.heic";
const MAX_NOME_SLUG = 40;

/** Nome de arquivo legível: corta em fronteira de palavra (nunca no meio dela) e não deixa hífen sobrando. */
function slugNome(texto: string, max = MAX_NOME_SLUG) {
  const slug = texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/#/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  if (slug.length <= max) return slug || "material";
  // Uma letra a mais que o limite mostra se o corte cai exatamente numa fronteira.
  const janela = slug.slice(0, max + 1);
  const fronteira = janela.lastIndexOf("-");
  const corte = fronteira > 0 ? janela.slice(0, fronteira) : slug.slice(0, max);
  return corte.replace(/-+$/, "") || "material";
}

export type TipoNovaPublicacao = TipoPost;

interface Tipo {
  id: TipoNovaPublicacao;
  rotulo: string;
  icone: LucideIcon;
  placeholder: string;
}

const PUBLICACAO: Tipo = { id: "publicacao", rotulo: "Publicação", icone: MessageCircle, placeholder: "O que você quer compartilhar com a turma?" };
const DUVIDA: Tipo = { id: "duvida", rotulo: "Dúvida", icone: MessageCircleQuestionMark, placeholder: "Onde você travou? Conte o que já tentou…" };
const MATERIAL: Tipo = { id: "material", rotulo: "Material", icone: FileText, placeholder: "Descreva o material que você está compartilhando…" };
const AVISO: Tipo = { id: "aviso", rotulo: "Aviso", icone: Megaphone, placeholder: "Escreva o aviso para a turma…" };

/** A aluna publica Publicação, Dúvida e Material; o professor, Aviso, Material e Publicação (sem Dúvida). */
const TIPOS_ALUNO = [PUBLICACAO, DUVIDA, MATERIAL];
const TIPOS_PROFESSOR = [AVISO, MATERIAL, PUBLICACAO];

/** Mínimo de caracteres para a análise de dúvidas parecidas (fluxo 3.2). */
const MIN_BUSCA = 15;
const MAX_DESCRICAO_IMAGEM = 200;
const SUAVE = [0.2, 0, 0, 1] as const;

type Analise = { ok: true; sugestao: ReturnType<typeof sugerirCategorias>; semelhantes: ResultadoBusca[] } | { ok: false };

interface Props {
  aberto: boolean;
  onFechar: () => void;
  /** Tipo já escolhido no composer do feed (Dúvida, Material, Aviso…). */
  tipoInicial?: TipoNovaPublicacao;
  /** Publicações visíveis para quem está publicando (base das "parecidas"). */
  posts: Post[];
  onPublicado: (id: string) => void;
  onVerPost: (id: string) => void;
}

/** Modal "Nova publicação", aberto pelo composer do feed, pelo botão "+" do celular ou pela coluna lateral. */
export function NovaPublicacaoSheet({ aberto, onFechar, ...resto }: Props) {
  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo="Nova publicação">
      <Formulario onFechar={onFechar} {...resto} />
    </Sheet>
  );
}

function Formulario({ onFechar, tipoInicial, posts, onPublicado, onVerPost }: Omit<Props, "aberto">) {
  const ator = useAtor();
  const tipos = ator.professor ? TIPOS_PROFESSOR : TIPOS_ALUNO;
  const disciplinaDoProfessor = useSeletor((e) => e.pessoas[ator.id]?.disciplina);

  // O formulário nasce a cada abertura do modal: o tipo inicial vale só para esta abertura.
  const [tipo, setTipo] = useState<TipoNovaPublicacao>(tipos.find((t) => t.id === tipoInicial)?.id ?? tipos[0].id);
  const [disciplina, setDisciplina] = useState<Disciplina | null>(null);
  const [destino, setDestino] = useState<DestinoProfessor | null>(null);
  const [texto, setTexto] = useRascunho(ator.professor ? "nova-publicacao-professor" : "nova-publicacao");
  const [arquivo, setArquivo] = useState<ArquivoSalvo | null>(null);
  const [descricaoImagem, setDescricaoImagem] = useState("");
  const [tentou, setTentou] = useState(false);
  const [recusada, setRecusada] = useState(false);
  const enviando = useRef(false);
  const refDestino = useRef<HTMLDivElement>(null);
  const refDisciplina = useRef<HTMLDivElement>(null);
  const refTexto = useRef<HTMLTextAreaElement>(null);
  const id = useId();
  const idErroDestino = `${id}-destino`;
  const idErroTexto = `${id}-texto`;
  const idErroDisciplina = `${id}-disciplina`;
  const idDescricao = `${id}-descricao`;

  const config = tipos.find((t) => t.id === tipo)!;
  const limite = tipo === "aviso" ? 280 : 600;
  const minimo = tipo === "duvida" ? 15 : 5;
  const tamanho = texto.trim().length;
  const exigeDisciplina = !ator.professor || tipo === "material";
  const imagemEscolhida = !!arquivo?.mime.startsWith("image/");

  // Erros de campo: só aparecem depois da primeira tentativa de publicar e somem ao corrigir.
  const erroDestino = ator.professor && !destino ? "Escolha onde publicar." : undefined;
  const erroDisciplina = exigeDisciplina && !disciplina ? "Escolha uma disciplina." : undefined;
  const erroTexto =
    tamanho < minimo
      ? `Escreva pelo menos ${minimo} caracteres (faltam ${minimo - tamanho}).`
      : texto.length > limite
        ? `Reduza o texto para ${limite} caracteres (passou ${texto.length - limite}).`
        : undefined;
  const mostrarDestino = tentou ? erroDestino : undefined;
  const mostrarDisciplina = tentou ? erroDisciplina : undefined;
  const mostrarTexto = tentou ? erroTexto : undefined;

  // Dúvida: sugestão de disciplina (P01) e dúvidas parecidas (P02). Com a IA fora do ar o fluxo segue manual.
  // Enquanto recalcula, o último resultado continua na tela (sem piscar).
  const textoAdiado = useDeferredValue(texto);
  const iaSimulada = useSimulacao("ia");
  const analisar = tipo === "duvida" && textoAdiado.trim().length >= MIN_BUSCA;
  const [analise, setAnalise] = useState<Analise | null>(null);
  useEffect(() => {
    if (!analisar) return;
    let cancelado = false;
    void (async () => {
      const [categorias, parecidas] = await Promise.all([
        executarIA("P01", () => sugerirCategorias(textoAdiado), { simulacao: "ia" }),
        executarIA("P02", () => buscarSemelhantes(textoAdiado, posts, { tipo: "duvida", limite: 6 }), { simulacao: "ia" }),
      ]);
      if (cancelado) return;
      if (!categorias.ok || !parecidas.ok) {
        setAnalise({ ok: false });
        return;
      }
      // Só dúvidas que já têm resposta, e nunca a do próprio autor.
      const semelhantes = parecidas.valor.filter((r) => r.post.respostas.length > 0 && r.post.autorId !== ator.id).slice(0, 3);
      setAnalise({ ok: true, sugestao: categorias.valor, semelhantes });
    })();
    return () => {
      cancelado = true;
    };
  }, [analisar, textoAdiado, posts, ator.id, iaSimulada]);
  const analiseAtual = analisar ? analise : null;
  const sugestao = analiseAtual?.ok ? analiseAtual.sugestao : null;
  const semelhantes = analiseAtual?.ok ? analiseAtual.semelhantes : [];

  const tagsDigitadas = extrairTags(texto);
  const tagsSugeridas = (sugestao?.tags ?? []).filter((t) => !tagsDigitadas.includes(t));

  const trocarTipo = (novo: TipoNovaPublicacao) => {
    setTipo(novo);
    if (arquivo && (novo === "material" ? false : !arquivo.mime.startsWith("image/"))) setArquivo(null);
  };

  const enviar = () => {
    if (enviando.current) return;
    if (erroDestino || erroTexto || erroDisciplina) {
      setTentou(true);
      // Foco no primeiro campo inválido, na ordem em que aparecem na tela.
      const alvo = erroDestino
        ? refDestino.current?.querySelector<HTMLElement>("button")
        : erroTexto
          ? refTexto.current
          : refDisciplina.current?.querySelector<HTMLElement>("button");
      alvo?.focus();
      return;
    }

    enviando.current = true;
    const limpo = texto.trim();
    const materia = ator.professor && tipo !== "material" ? disciplinaDoProfessor : (disciplina ?? undefined);
    const tags = [...new Set([...tagsDigitadas, ...(tipo === "duvida" ? tagsSugeridas.slice(0, 1) : [])])];

    let anexo: Anexo | undefined;
    if (arquivo) {
      const descricao = imagemEscolhida ? descricaoImagem.trim() : "";
      anexo = {
        nome: arquivo.nome,
        paginas: arquivo.paginas ?? 0,
        tamanho: arquivo.tamanho,
        arquivoId: arquivo.id,
        mime: arquivo.mime,
        previa: arquivo.previa,
        ...(descricao ? { descricao } : {}),
      };
    } else if (tipo === "material") {
      // Sem arquivo: o PDF é gerado a partir do texto da publicação.
      const nome = `${slugNome(materia ?? "material")}-${slugNome(limpo)}.pdf`;
      anexo = { nome, ...infoDoAnexo(nome, { titulo: limpo.slice(0, 70), descricao: limpo, disciplina: materia }) };
    }

    const semSugestoes = tipo === "duvida" && (analiseAtual?.ok === false || simulacaoAtiva("ia"));
    const publicada = publicar({
      tipo,
      disciplina: materia,
      texto: limpo,
      tags,
      anexo,
      ...(ator.professor ? { destino: destino ?? undefined } : {}),
      ...(semSugestoes ? { semSugestoes: true } : {}),
    });
    if (!publicada) {
      enviando.current = false;
      setRecusada(true);
      return;
    }
    // Zera o formulário: um segundo clique durante a animação de saída não publica de novo.
    setTexto("");
    onFechar();
    onPublicado(publicada);
  };

  return (
    <>
      <Segmentado
        grupo="tipo-publicacao"
        rotulo="Tipo de publicação"
        valor={tipo}
        onChange={trocarTipo}
        opcoes={tipos.map((t) => {
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

      {ator.professor && (
        <div className="mt-5">
          <p className="mb-2 text-[13px] font-medium text-tinta">
            Publicar para <span className="font-normal text-texto-2">· obrigatório</span>
          </p>
          <div ref={refDestino} role="group" aria-label="Destino da publicação" aria-describedby={mostrarDestino ? idErroDestino : undefined}>
            <ChipGroup
              grupo="nova-destino"
              rotulo="Destino da publicação"
              quebrar
                  opcoes={DESTINOS_PROFESSOR.map((d) => ({ id: d.id, rotulo: d.nome }))}
              valor={destino}
              onChange={setDestino}
            />
          </div>
          {mostrarDestino && <ErroCampo id={idErroDestino}>{mostrarDestino}</ErroCampo>}
          {destino && <p className="mt-1.5 text-[12px] text-texto-2">{DESTINOS_PROFESSOR.find((d) => d.id === destino)?.descricao}</p>}
        </div>
      )}

      <div className="relative mt-5">
        <textarea
          ref={refTexto}
          rows={5}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={config.placeholder}
          maxLength={limite}
          aria-label="Texto da publicação"
          aria-invalid={mostrarTexto ? true : undefined}
          aria-describedby={mostrarTexto ? idErroTexto : undefined}
          className={cn(
            "w-full resize-none rounded-xl border bg-superficie px-3.5 pb-7 pt-3 text-[15px] leading-relaxed text-tinta outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-texto-2 focus:ring-3",
            mostrarTexto ? "border-alerta focus:border-alerta focus:ring-alerta/15" : "border-borda hover:border-texto-2/40 focus:border-verde focus:ring-verde/15",
          )}
        />
        <span className={cn("pointer-events-none absolute bottom-3 right-3.5 text-[11.5px] tabular-nums", texto.length > limite ? "text-alerta" : "text-texto-2")}>
          {texto.length}/{limite}
        </span>
      </div>
      {mostrarTexto && <ErroCampo id={idErroTexto}>{mostrarTexto}</ErroCampo>}
      <p className="mt-1.5 text-[12px] text-texto-2">Use #tags para facilitar a busca (ex.: #funcaoafim).</p>

      <AnimatePresence mode="popLayout" initial={false}>
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
                A partir de {MIN_BUSCA} caracteres, mostramos dúvidas parecidas já respondidas.
              </p>
            )}

            {analiseAtual?.ok === false && (
              <p role="status" className="flex items-start gap-2 rounded-xl bg-superficie-2 px-3 py-2.5 text-[13px] leading-snug text-texto">
                <Info className="mt-px size-4 shrink-0 text-texto-2" aria-hidden />
                Sugestões indisponíveis no momento. Escolha a disciplina abaixo.
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
                  <Button variante="secundario" tamanho="sm" className="ml-auto max-sm:min-h-11" onClick={() => setDisciplina(sugestao.disciplina)}>
                    Usar {sugestao.disciplina}
                  </Button>
                )}
              </motion.div>
            )}

            {analiseAtual?.ok && (
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
                            className="flex min-h-11 w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-superficie-2"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="line-clamp-2 text-[13.5px] leading-snug text-texto">{post.texto}</span>
                              <span className="mt-1 block text-[12px] text-texto-2">
                                <span className="tabular-nums">{Math.round(score * 100)}% parecida</span>
                                {post.disciplina && ` · ${post.disciplina}`} · {post.respostas.length} {post.respostas.length === 1 ? "resposta" : "respostas"}
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
              Você ganha <span className="font-medium text-texto">+10 pontos</span> quando um colega responder e{" "}
              <span className="font-medium text-texto">+20 pontos e +15 XP</span> com a resposta oficial.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {exigeDisciplina ? (
        <div className="mt-5">
          <p className="mb-2 text-[13px] font-medium text-tinta">
            Disciplina <span className="font-normal text-texto-2">· obrigatória</span>
          </p>
          <div ref={refDisciplina} role="group" aria-label="Disciplina" aria-describedby={mostrarDisciplina ? idErroDisciplina : undefined}>
            <ChipGroup
              grupo="nova-disciplina"
              rotulo="Disciplina"
              quebrar
                  opcoes={DISCIPLINAS.map((d) => ({ id: d, rotulo: d }))}
              valor={disciplina}
              onChange={setDisciplina}
            />
          </div>
          {mostrarDisciplina && <ErroCampo id={idErroDisciplina}>{mostrarDisciplina}</ErroCampo>}
        </div>
      ) : (
        disciplinaDoProfessor && (
          <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-texto-2">
            <span className="font-medium text-tinta">Disciplina</span>
            <Badge tom="neutro">{disciplinaDoProfessor}</Badge>
            <span>a sua disciplina</span>
          </p>
        )
      )}

      <AnimatePresence mode="popLayout" initial={false}>
        {tipo === "material" ? (
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
        ) : (
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
      </AnimatePresence>

      {imagemEscolhida && (
        <div className="mt-3">
          <label htmlFor={idDescricao} className="block text-[13px] font-medium text-tinta">
            Descrição da imagem (opcional)
          </label>
          <input
            id={idDescricao}
            type="text"
            value={descricaoImagem}
            maxLength={MAX_DESCRICAO_IMAGEM}
            onChange={(e) => setDescricaoImagem(e.target.value)}
            placeholder="Ex.: gráfico de uma reta que desce, desenhado no caderno"
            className="mt-1.5 h-11 w-full rounded-xl border border-borda bg-superficie px-3.5 text-[14px] text-tinta outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-texto-2 hover:border-texto-2/40 focus:border-verde focus:ring-3 focus:ring-verde/15"
          />
          <p className="mt-1 flex items-center justify-between gap-2 text-[12px] text-texto-2">
            <span>Ajuda quem usa leitor de tela a entender a imagem.</span>
            <span className="tabular-nums">
              {descricaoImagem.length}/{MAX_DESCRICAO_IMAGEM}
            </span>
          </p>
        </div>
      )}

      {recusada && <ErroCampo id={`${id}-recusada`}>Não foi possível publicar agora. Confira os campos e tente de novo.</ErroCampo>}

      <RodapeSheet>
        <Button variante="secundario" tamanho="lg" className="flex-1" onClick={onFechar}>
          Cancelar
        </Button>
        <Button tamanho="lg" className="flex-1" onClick={enviar}>
          Publicar
        </Button>
      </RodapeSheet>
    </>
  );
}
