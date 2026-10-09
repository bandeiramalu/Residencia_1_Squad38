"use client";

import { CircleCheck, FileText, Info, Megaphone, MessageCircleQuestionMark, Newspaper, Plus, Search, SearchX, ShieldAlert, Sparkles, X } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Avatar } from "@/components/ui/Avatar";
import { TituloPagina } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { LinkPessoa } from "@/components/ui/LinkPessoa";
import { TURMA_DO_ALUNO } from "@/data/escola";
import { TURMA_DO_ESPACO, TURMAS_DO_PROFESSOR } from "@/data/professor";
import { useAtor } from "@/hooks/useAtor";
import { useSimulacao } from "@/hooks/useConexao";
import { DESKTOP, useMidia } from "@/hooks/useMidia";
import { buscarPorPalavras, buscarSemelhantes } from "@/lib/busca";
import { cn } from "@/lib/cn";
import { executarIA } from "@/lib/ia";
import { duvidaRespondida } from "@/lib/turmas";
import { abrirMaterial } from "@/store/actions";
import { useEstado } from "@/store/store";
import type { Post } from "@/store/types";
import { focarPost, useUI } from "@/store/ui";
import { Abas } from "./Abas";
import { FeedLateral } from "./FeedLateral";
import { MembrosFaixa } from "./MembrosFaixa";
import type { TipoNovaPublicacao } from "./NovaPublicacaoSheet";
import { PostCard, type PedidoResposta } from "./PostCard";

// Modais só são baixados quando abertos pela primeira vez: o feed carrega mais leve.
const NovaPublicacaoSheet = dynamic(() => import("./NovaPublicacaoSheet").then((m) => m.NovaPublicacaoSheet));
const MaterialSheet = dynamic(() => import("./MaterialSheet").then((m) => m.MaterialSheet));
const DenunciaSheet = dynamic(() => import("./DenunciaSheet").then((m) => m.DenunciaSheet));
const RemoverPublicacaoSheet = dynamic(() => import("./RemoverPublicacaoSheet").then((m) => m.RemoverPublicacaoSheet));
const ContestarSheet = dynamic(() => import("./ContestarSheet").then((m) => m.ContestarSheet));

/** Antecipa o download do modal "Nova publicação" quando o dedo/mouse chega no composer. */
const preCarregarNova = () => void import("./NovaPublicacaoSheet");

/** A coluna lateral (widgets) só aparece em telas largas. */
const LARGO = "(min-width: 1280px)";
/** Altura do cabeçalho fixo do app: as abas grudam logo abaixo dele. */
const TOPO_ABAS = 56;

type Filtro = "tudo" | "duvidas" | "semresposta" | "materiais" | "avisos" | "turma";

const FILTROS_ALUNO: readonly { id: Filtro; rotulo: string }[] = [
  { id: "tudo", rotulo: "Tudo" },
  { id: "duvidas", rotulo: "Dúvidas" },
  { id: "materiais", rotulo: "Materiais" },
  { id: "avisos", rotulo: "Avisos" },
  { id: "turma", rotulo: "Minha turma" },
];

const FILTROS_PROFESSOR: readonly { id: Filtro; rotulo: string }[] = [
  { id: "tudo", rotulo: "Tudo" },
  { id: "duvidas", rotulo: "Dúvidas" },
  { id: "semresposta", rotulo: "Sem resposta" },
  { id: "materiais", rotulo: "Materiais" },
  { id: "avisos", rotulo: "Avisos" },
  { id: "turma", rotulo: "Minhas turmas" },
];

const TURMAS_DO_PROFESSOR_LISTA: readonly string[] = TURMAS_DO_PROFESSOR;

function passaFiltro(post: Post, filtro: Filtro, professor: boolean, turmaDoAutor?: string) {
  switch (filtro) {
    case "duvidas":
      return post.tipo === "duvida";
    case "semresposta":
      return post.tipo === "duvida" && !duvidaRespondida(post);
    case "materiais":
      return post.tipo === "material";
    case "avisos":
      return post.tipo === "aviso";
    case "turma":
      // Professor: espaços das turmas dele ou autor de uma delas. Aluna: o espaço da turma dela ou colegas de turma.
      return professor
        ? TURMA_DO_ESPACO[post.espaco] !== undefined || (!!turmaDoAutor && TURMAS_DO_PROFESSOR_LISTA.includes(turmaDoAutor))
        : post.espaco === "9A" || turmaDoAutor === TURMA_DO_ALUNO;
    default:
      return true;
  }
}

/** Resultado da busca: por significado (P02) ou, com a busca fora do ar, por palavras-chave. */
interface ResultadosBusca {
  modo: "significado" | "palavras";
  itens: { post: Post; detalhe: string }[];
}

/** Aba 1 — Feed: comunidade, dúvidas e materiais, para a aluna e para o professor (cada um com as ferramentas do papel). */
export function FeedView() {
  const ator = useAtor();
  const { posts, pessoas, espaco, usuario } = useEstado();
  const { focoPost } = useUI();
  const desktop = useMidia(DESKTOP);
  // A coluna lateral só monta quando cabe (menos trabalho e nenhum relógio a mais no celular).
  const largo = useMidia(LARGO);
  const buscaForaDoAr = useSimulacao("busca");

  const [filtro, setFiltro] = useState<Filtro>("tudo");
  const router = useRouter();
  // O filtro por autor vem da faixa de membros e do perfil público ("Ver publicações" → /feed?autor=id).
  const parametros = useSearchParams();
  const autor = parametros.get("autor");
  // Link compartilhado (#/feed?post=id): abre o feed e destaca a publicação.
  const postDoLink = parametros.get("post");
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [busca, setBusca] = useState("");
  const buscaAdiada = useDeferredValue(busca);
  // Modais: `null` = nunca aberto (nem montado nem baixado). Depois de aberto uma vez, o modal fica
  // montado e guarda o conteúdo enquanto fecha — a animação de saída não "esvazia" o painel.
  const [nova, setNova] = useState<{ aberto: boolean; tipo: TipoNovaPublicacao } | null>(null);
  const [material, setMaterial] = useState<{ id: string; aberto: boolean } | null>(null);
  const [denuncia, setDenuncia] = useState<{ post: Post; aberto: boolean } | null>(null);
  const [remocao, setRemocao] = useState<{ post: Post; aberto: boolean } | null>(null);
  const [contestacao, setContestacao] = useState<{ post: Post; aberto: boolean } | null>(null);
  const [pedidoResposta, setPedidoResposta] = useState<PedidoResposta | null>(null);
  const [composerVisivel, setComposerVisivel] = useState(true);
  const campoBusca = useRef<HTMLInputElement>(null);
  const composer = useRef<HTMLDivElement>(null);
  const timeline = useRef<HTMLElement>(null);
  /** Numera os pedidos de resposta: o mesmo card pode ser pedido de novo depois de fechar a caixa. */
  const contadorPedidos = useRef(0);

  const filtros = ator.professor ? FILTROS_PROFESSOR : FILTROS_ALUNO;
  const eu = pessoas[ator.id];

  // Quem vê o quê. Retidos pela triagem só aparecem para o autor; mensagens de sala nunca.
  // Aluna: com o seletor em "Toda a escola" vê tudo, menos o espaço de uma turma que não é a dela; com outro espaço,
  // só ele e o da escola. Professor: ignora o seletor da aluna e vê as turmas todas.
  const visiveis = useMemo(
    () =>
      posts.filter((p) => {
        if (p.origemSala) return false;
        if (p.emRevisao && p.autorId !== ator.id) return false;
        if (ator.professor) return true;
        if (espaco === "escola") {
          const turmaDoEspaco = TURMA_DO_ESPACO[p.espaco];
          return !turmaDoEspaco || turmaDoEspaco === usuario.turma;
        }
        return p.espaco === espaco || p.espaco === "escola";
      }),
    [posts, ator.id, ator.professor, espaco, usuario.turma],
  );

  const lista = visiveis
    .filter((p) => p.id === focoPost || (passaFiltro(p, filtro, ator.professor, pessoas[p.autorId]?.turma) && (!autor || p.autorId === autor)))
    .sort((a, b) => b.criadoEm - a.criadoEm);

  // Busca (P02): por significado; se a busca estiver fora do ar, por palavras-chave, com aviso.
  // Enquanto recalcula, o último resultado continua na tela (sem piscar).
  const consulta = buscaAdiada.trim();
  const buscaAtiva = consulta.length >= 3;
  const [achados, setAchados] = useState<ResultadosBusca | null>(null);
  useEffect(() => {
    if (!buscaAtiva) return;
    let cancelado = false;
    void (async () => {
      const r = await executarIA("P02", () => buscarSemelhantes(consulta, visiveis, { limite: 8, minimo: 0.12 }), { simulacao: "busca" });
      if (cancelado) return;
      if (r.ok) {
        setAchados({
          modo: "significado",
          itens: r.valor.map(({ post, score }) => ({
            post,
            detalhe: `${Math.round(score * 100)}% relevante${post.respostas.some((x) => x.oficial) ? " · com resposta oficial" : ""}`,
          })),
        });
      } else {
        setAchados({
          modo: "palavras",
          itens: buscarPorPalavras(consulta, visiveis, { limite: 8 }).map(({ post, casadas, total }) => ({
            post,
            detalhe: `${casadas} de ${total} ${total === 1 ? "palavra" : "palavras"} da busca`,
          })),
        });
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [buscaAtiva, consulta, visiveis, buscaForaDoAr]);
  const resultados = buscaAtiva ? (achados ?? { modo: "significado" as const, itens: [] }) : null;
  const aguardandoBusca = buscaAtiva && achados === null;

  const aguardandoRevisao = ator.professor ? posts.filter((p) => p.emRevisao || p.denuncia).length : 0;

  // Destaca a publicação pedida por outra tela (missão do professor, dúvida parecida…).
  useEffect(() => {
    if (!focoPost) return;
    const quadro = requestAnimationFrame(() => {
      document.getElementById(`post-${focoPost}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    const limpar = setTimeout(() => focarPost(null), 2600);
    return () => {
      cancelAnimationFrame(quadro);
      clearTimeout(limpar);
    };
  }, [focoPost]);

  useEffect(() => {
    if (postDoLink) focarPost(postDoLink);
  }, [postDoLink]);

  // O pedido de resposta vale só para o card que já está na tela; depois disso um card remontado não reabre a caixa.
  useEffect(() => {
    if (!pedidoResposta) return;
    const limpar = setTimeout(() => setPedidoResposta(null), 1500);
    return () => clearTimeout(limpar);
  }, [pedidoResposta]);

  useEffect(() => {
    if (buscaAberta) campoBusca.current?.focus();
  }, [buscaAberta]);

  // Celular: o botão "+" só aparece quando o composer do topo sai da tela.
  // (Durante a busca o composer sai do DOM; ao voltar, o observador é refeito.)
  const buscando = resultados !== null;
  useEffect(() => {
    const el = composer.current;
    if (!el || desktop) return;
    const observador = new IntersectionObserver(([e]) => setComposerVisivel(e.isIntersecting), { rootMargin: "-56px 0px 0px 0px" });
    observador.observe(el);
    return () => observador.disconnect();
  }, [desktop, buscando]);

  /** Tipo da publicação que o composer e o "+" abrem: o professor publica avisos; a aluna, publicações. */
  const tipoPadrao: TipoNovaPublicacao = ator.professor ? "aviso" : "publicacao";
  const abrirNova = (tipo: TipoNovaPublicacao) => setNova({ aberto: true, tipo });

  const abrirMaterialSheet = (post: Post) => {
    abrirMaterial(post.id);
    setMaterial({ id: post.id, aberto: true });
  };

  const fecharBusca = () => {
    setBusca("");
    setBuscaAberta(false);
  };

  const verPost = (id: string) => {
    setNova((n) => (n ? { ...n, aberto: false } : n));
    fecharBusca();
    focarPost(id);
  };

  /** "Responder" da coluna lateral: destaca a dúvida e abre a caixa de resposta dela. */
  const responderDaLateral = (id: string) => {
    fecharBusca();
    setFiltro("tudo");
    if (autor) router.replace("/feed");
    focarPost(id);
    contadorPedidos.current += 1;
    setPedidoResposta({ id, n: contadorPedidos.current });
  };

  /** Com as abas grudadas no topo, trocar o filtro volta ao começo da lista. */
  const voltarAoTopoDaLista = () => {
    const topo = timeline.current?.getBoundingClientRect().top;
    if (topo !== undefined && topo < TOPO_ABAS) window.scrollTo({ top: window.scrollY + topo - TOPO_ABAS - 12, behavior: "smooth" });
  };

  // Um filtro escolhido por quem usa vale mais que o destaque temporário.
  const trocarFiltro = (f: Filtro) => {
    focarPost(null);
    setFiltro(f);
    voltarAoTopoDaLista();
  };
  /** Toque na faixa de membros: filtra a lista pelas publicações da pessoa (de novo no mesmo, limpa). */
  const selecionarAutor = (id: string | null) => {
    focarPost(null);
    setFiltro("tudo");
    router.replace(id ? `/feed?autor=${encodeURIComponent(id)}` : "/feed");
  };

  const postMaterial = material ? (posts.find((p) => p.id === material.id) ?? null) : null;

  const cardProps = {
    ator,
    pessoas,
    alunaId: usuario.id,
    equipados: usuario.equipados,
    // Com um destaque pedido, todos os cards renderizam: a rolagem até ele cai no lugar certo.
    leve: !focoPost,
    pedidoResposta,
    onAbrirMaterial: abrirMaterialSheet,
    onDenunciar: (post: Post) => setDenuncia({ post, aberto: true }),
    onRemover: (post: Post) => setRemocao({ post, aberto: true }),
    onContestar: (post: Post) => setContestacao({ post, aberto: true }),
  };

  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start xl:gap-8">
      {/* Respiro extra no fim (celular): o último post não fica embaixo do botão "+". */}
      <div className="mx-auto min-w-0 max-w-[680px] space-y-4 pb-14 lg:pb-6 xl:mx-0">
        <TituloPagina
          titulo="Feed da escola"
          acao={
            <button
              type="button"
              onClick={() => (buscaAberta ? fecharBusca() : setBuscaAberta(true))}
              aria-label={buscaAberta ? "Fechar busca" : "Buscar no feed"}
              aria-expanded={buscaAberta}
              title="Buscar"
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-full border transition-colors duration-150 active:scale-95 max-sm:size-11",
                buscaAberta ? "border-borda bg-superficie-2 text-tinta" : "border-borda bg-superficie text-texto-2 hover:bg-superficie-2 hover:text-tinta",
              )}
            >
              {buscaAberta ? <X className="size-[18px]" /> : <Search className="size-[18px]" />}
            </button>
          }
        />

        {/* Busca: abre pela lupa */}
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-200 ease-suave",
            buscaAberta ? "grid-rows-[1fr] opacity-100" : "invisible -mt-4 grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="min-h-0 overflow-hidden p-px">
            <label className="flex h-11 items-center gap-2.5 rounded-xl border border-borda bg-superficie px-3.5 transition-[border-color,box-shadow] duration-150 focus-within:border-verde focus-within:ring-3 focus-within:ring-verde/15">
              <Search className="size-[18px] shrink-0 text-texto-2" />
              <input
                ref={campoBusca}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") fecharBusca();
                }}
                placeholder="Buscar dúvidas e resoluções…"
                aria-label="Buscar no feed"
                className="min-w-0 flex-1 bg-transparent text-[14.5px] text-tinta outline-none placeholder:text-texto-2"
              />
              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca("")}
                  aria-label="Limpar busca"
                  className="grid size-7 place-items-center rounded-full text-texto-2 transition-colors hover:bg-superficie-2 hover:text-tinta max-sm:size-11"
                >
                  <X className="size-4" />
                </button>
              )}
            </label>
          </div>
        </div>

        {/* Professor: publicações retidas ou denunciadas esperando decisão. */}
        {ator.professor && aguardandoRevisao > 0 && !resultados && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-xl border border-borda bg-superficie-2 px-3.5 py-2 text-[13px] text-texto">
            <ShieldAlert className="size-4 shrink-0 text-ouro" aria-hidden />
            <span className="tabular-nums">
              {aguardandoRevisao} {aguardandoRevisao === 1 ? "publicação aguardando revisão" : "publicações aguardando revisão"}
            </span>
            <span aria-hidden className="text-texto-2">
              ·
            </span>
            <Link href="/professor/moderacao" className="inline-flex min-h-11 items-center rounded-md font-medium text-tinta underline underline-offset-2 hover:text-acento sm:min-h-0">
              Abrir moderação
            </Link>
          </p>
        )}

        {!resultados && <MembrosFaixa pessoas={pessoas} posts={visiveis} selecionado={autor} onSelecionar={selecionarAutor} />}

        {/* Timeline: abas, composer e publicações num só card (no celular, de ponta a ponta). */}
        <section
          ref={timeline}
          aria-label={resultados ? "Resultados da busca" : "Publicações"}
          aria-busy={aguardandoBusca || undefined}
          className="-mx-4 border-y border-borda bg-superficie sm:mx-0 sm:rounded-2xl sm:border"
        >
          {resultados ? (
            <div className="border-b border-borda px-4 py-3 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 text-[13px] text-texto-2" title={resultados.modo === "significado" ? "Encontra dúvidas com o mesmo assunto, mesmo escritas com outras palavras." : undefined}>
                  <span className="font-medium text-tinta">
                    {resultados.itens.length} {resultados.itens.length === 1 ? "resultado" : "resultados"}
                  </span>
                  {resultados.modo === "significado" && " · busca por assunto"}
                </p>
                <button
                  type="button"
                  onClick={fecharBusca}
                  className="inline-flex shrink-0 items-center rounded-md text-[13px] font-medium text-texto-2 transition-colors hover:text-tinta max-sm:min-h-11 max-sm:px-2"
                >
                  Limpar
                </button>
              </div>
              {resultados.modo === "palavras" && (
                <p role="status" className="mt-1 flex items-start gap-1.5 text-[12.5px] leading-snug text-texto-2">
                  <Info className="mt-px size-3.5 shrink-0" aria-hidden />
                  Resultados por palavra-chave. A busca por significado está indisponível agora.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="vidro sticky top-14 z-10 sm:rounded-t-2xl">
                <Abas grupo="filtro-feed" rotulo="Filtrar publicações" opcoes={filtros} valor={filtro} onChange={trocarFiltro} className="px-1 sm:px-2" />
              </div>

              {/* Composer */}
              <div ref={composer} className="border-b border-borda px-4 pb-3 pt-3.5 sm:px-5" onPointerEnter={preCarregarNova}>
                <div className="flex items-center gap-3">
                  <Avatar nome={eu?.nome ?? usuario.nome} iniciais={eu?.iniciais} equipados={ator.id === usuario.id ? usuario.equipados : []} />
                  <button
                    type="button"
                    onClick={() => abrirNova(tipoPadrao)}
                    onFocus={preCarregarNova}
                    className="h-11 min-w-0 flex-1 truncate rounded-full border border-borda bg-superficie-2 px-4 text-left text-[14px] text-texto-2 transition-colors duration-150 hover:border-texto-2/30 hover:text-texto"
                  >
                    {ator.professor ? (
                      <>
                        <span className="sm:hidden">Compartilhe um aviso ou material…</span>
                        <span className="hidden sm:inline">Compartilhe um aviso ou material com a turma…</span>
                      </>
                    ) : (
                      <>
                        <span className="sm:hidden">Compartilhe uma dúvida ou material…</span>
                        <span className="hidden sm:inline">Compartilhe uma dúvida, material ou aviso…</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-1 sm:pl-[52px]">
                  {ator.professor ? (
                    <Atalho icone={<Megaphone />} onClick={() => abrirNova("aviso")}>
                      Aviso
                    </Atalho>
                  ) : (
                    <Atalho icone={<MessageCircleQuestionMark />} onClick={() => abrirNova("duvida")}>
                      Dúvida
                    </Atalho>
                  )}
                  <Atalho icone={<FileText />} onClick={() => abrirNova("material")}>
                    Material
                  </Atalho>
                  <Button tamanho="sm" className="ml-auto rounded-full px-4 max-sm:h-11" onClick={() => abrirNova(tipoPadrao)}>
                    Publicar
                  </Button>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {autor && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-2.5 border-b border-borda bg-superficie-2 px-4 py-2 text-[13px] toque:min-h-12 sm:px-5">
                      <LinkPessoa id={autor} rotulo={pessoas[autor]?.nome}>
                        <Avatar nome={pessoas[autor]?.nome ?? "?"} iniciais={pessoas[autor]?.iniciais} tamanho="xs" />
                      </LinkPessoa>
                      {/* O link é quem corta com reticências: um pai com `truncate` recortaria a área de toque de 44 px. */}
                      <span className="flex min-w-0 flex-1 items-center gap-1 text-texto-2">
                        <span className="shrink-0">Publicações de</span>
                        <LinkPessoa id={autor} className="min-w-0 truncate font-medium text-tinta hover:underline">
                          {pessoas[autor]?.nome ?? "membro do CEPI"}
                        </LinkPessoa>
                      </span>
                      <button
                        type="button"
                        onClick={() => selecionarAutor(null)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md font-medium text-texto-2 transition-colors hover:text-tinta max-sm:min-h-11 max-sm:px-1"
                      >
                        <X className="size-3.5" /> Limpar
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {resultados ? (
            resultados.itens.length === 0 ? (
              aguardandoBusca ? (
                <p className="px-6 py-14 text-center text-[13px] text-texto-2">Buscando…</p>
              ) : (
                <Vazio
                  icone={<SearchX />}
                  titulo="Nada parecido por aqui"
                  descricao={ator.professor ? "Tente outras palavras." : "Tente outras palavras ou publique sua dúvida."}
                  acao={
                    ator.professor ? (
                      <Button variante="secundario" onClick={fecharBusca}>
                        Limpar busca
                      </Button>
                    ) : (
                      <Button
                        variante="secundario"
                        onClick={() => {
                          fecharBusca();
                          abrirNova("duvida");
                        }}
                      >
                        Publicar dúvida
                      </Button>
                    )
                  }
                />
              )
            ) : (
              <div className="divide-y divide-borda">
                {resultados.itens.map(({ post, detalhe }) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    {...cardProps}
                    leve={false}
                    destacado={false}
                    contexto={
                      <>
                        <Sparkles aria-hidden />
                        <span className="tabular-nums">{detalhe}</span>
                      </>
                    }
                  />
                ))}
              </div>
            )
          ) : (
            <div className="divide-y divide-borda">
              <AnimatePresence mode="popLayout" initial={false}>
                {lista.map((post) => (
                  <PostCard key={post.id} post={post} {...cardProps} destacado={post.id === focoPost} />
                ))}
              </AnimatePresence>
              {lista.length === 0 &&
                (filtro === "semresposta" ? (
                  <Vazio icone={<CircleCheck />} titulo="Tudo respondido" descricao="Todas as dúvidas já têm resposta oficial." />
                ) : (
                  <Vazio
                    icone={<Newspaper />}
                    titulo="Nada por aqui ainda"
                    descricao="Quando alguém publicar neste filtro, aparece aqui."
                    acao={
                      <Button onClick={() => abrirNova(tipoPadrao)}>{ator.professor ? "Publicar aviso" : "Publicar"}</Button>
                    }
                  />
                ))}
            </div>
          )}
        </section>
      </div>

      {largo && (
        <aside aria-label="Atalhos do portal" className="sem-scrollbar hidden xl:sticky xl:top-[5.5rem] xl:block xl:max-h-[calc(100dvh-6.5rem)] xl:overflow-y-auto">
          <FeedLateral ator={ator} onNova={abrirNova} onResponder={responderDaLateral} />
        </aside>
      )}

      {!desktop && <BotaoNova visivel={!composerVisivel && !buscando} onClick={() => abrirNova(tipoPadrao)} />}

      {nova && (
        <NovaPublicacaoSheet
          aberto={nova.aberto}
          tipoInicial={nova.tipo}
          onFechar={() => setNova({ ...nova, aberto: false })}
          posts={visiveis}
          onPublicado={(id) => {
            setFiltro("tudo");
            if (autor) router.replace("/feed");
            window.scrollTo({ top: 0, behavior: "smooth" });
            focarPost(id);
          }}
          onVerPost={verPost}
        />
      )}
      {material && (
        <MaterialSheet
          aberto={material.aberto}
          post={postMaterial}
          autor={postMaterial ? pessoas[postMaterial.autorId] : undefined}
          onFechar={() => setMaterial({ ...material, aberto: false })}
        />
      )}
      {denuncia && <DenunciaSheet aberto={denuncia.aberto} post={denuncia.post} onFechar={() => setDenuncia({ ...denuncia, aberto: false })} />}
      {remocao && (
        <RemoverPublicacaoSheet
          aberto={remocao.aberto}
          post={remocao.post}
          nomeAutor={pessoas[remocao.post.autorId]?.nome}
          onFechar={() => setRemocao({ ...remocao, aberto: false })}
        />
      )}
      {contestacao && <ContestarSheet aberto={contestacao.aberto} post={contestacao.post} onFechar={() => setContestacao({ ...contestacao, aberto: false })} />}
    </div>
  );
}

function Atalho({ icone, onClick, children }: { icone: ReactNode; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium text-texto-2 transition-colors duration-150 hover:bg-superficie-2 hover:text-tinta active:scale-[0.97] max-sm:h-11 [&_svg]:size-4"
    >
      {icone}
      {children}
    </button>
  );
}

/** Estado vazio: ícone, frase curta do que vai aparecer e a ação para começar. */
function Vazio({ icone, titulo, descricao, acao }: { icone: ReactNode; titulo: string; descricao: string; acao?: ReactNode }) {
  return (
    <div className="px-6 py-12 text-center">
      <div className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-superficie-2 text-texto-2 [&_svg]:size-5" aria-hidden>
        {icone}
      </div>
      <p className="text-sm font-medium text-tinta">{titulo}</p>
      <p className="mx-auto mt-1 max-w-xs text-[13px] text-texto-2">{descricao}</p>
      {acao && <div className="mt-4 flex justify-center">{acao}</div>}
    </div>
  );
}

/**
 * Botão "+" do celular — redondo, sem texto, acima da barra inferior. Fica fora do fluxo
 * (portal) e só aparece quando o composer do topo já saiu da tela.
 */
function BotaoNova({ visivel, onClick }: { visivel: boolean; onClick: () => void }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="coluna-fixa pointer-events-none bottom-[calc(var(--base-inferior)+0.75rem)] z-30 flex justify-end px-4 sm:px-6">
      <AnimatePresence>
        {visivel && (
          <motion.button
            type="button"
            onClick={onClick}
            onPointerEnter={preCarregarNova}
            onFocus={preCarregarNova}
            aria-label="Nova publicação"
            initial={{ opacity: 0, scale: 0.9, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 6 }}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
            className="pointer-events-auto grid size-12 place-items-center rounded-full bg-acao text-white shadow-flutuante transition-colors duration-150 hover:bg-acao-2"
          >
            <Plus className="size-6" strokeWidth={2.2} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
