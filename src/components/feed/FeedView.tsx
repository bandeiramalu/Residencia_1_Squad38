"use client";

import { FileText, MessageCircleQuestionMark, Plus, Search, Sparkles, X } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Avatar } from "@/components/ui/Avatar";
import { TituloPagina } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { LinkPessoa } from "@/components/ui/LinkPessoa";
import { TURMA_DO_ALUNO } from "@/data/escola";
import { USUARIO_ID } from "@/data/pessoas";
import { DESKTOP, useMidia } from "@/hooks/useMidia";
import { buscarSemelhantes } from "@/lib/busca";
import { cn } from "@/lib/cn";
import { abrirMaterial } from "@/store/actions";
import { useEstado } from "@/store/store";
import type { Post } from "@/store/types";
import { focarPost, useUI } from "@/store/ui";
import { Abas } from "./Abas";
import { FeedLateral } from "./FeedLateral";
import { MembrosFaixa } from "./MembrosFaixa";
import type { TipoNovaPublicacao } from "./NovaPublicacaoSheet";
import { PostCard } from "./PostCard";

// Modais só são baixados quando abertos pela primeira vez: o feed carrega mais leve.
const NovaPublicacaoSheet = dynamic(() => import("./NovaPublicacaoSheet").then((m) => m.NovaPublicacaoSheet));
const MaterialSheet = dynamic(() => import("./MaterialSheet").then((m) => m.MaterialSheet));
const DenunciaSheet = dynamic(() => import("./DenunciaSheet").then((m) => m.DenunciaSheet));

/** Antecipa o download do modal "Nova publicação" quando o dedo/mouse chega no composer. */
const preCarregarNova = () => void import("./NovaPublicacaoSheet");

/** A coluna lateral (widgets) só aparece em telas largas. */
const LARGO = "(min-width: 1280px)";
/** Altura do cabeçalho fixo do app: as abas grudam logo abaixo dele. */
const TOPO_ABAS = 56;

const FILTROS = [
  { id: "tudo", rotulo: "Tudo" },
  { id: "duvidas", rotulo: "Dúvidas" },
  { id: "materiais", rotulo: "Materiais" },
  { id: "avisos", rotulo: "Avisos" },
  { id: "turma", rotulo: "Minha turma" },
] as const;

type Filtro = (typeof FILTROS)[number]["id"];

function passaFiltro(post: Post, filtro: Filtro, turmaDoAutor?: string) {
  switch (filtro) {
    case "duvidas":
      return post.tipo === "duvida";
    case "materiais":
      return post.tipo === "material";
    case "avisos":
      return post.tipo === "aviso";
    case "turma":
      return post.espaco === "9A" || turmaDoAutor === TURMA_DO_ALUNO;
    default:
      return true;
  }
}

/** Aba 1 — Feed: comunidade, dúvidas e materiais. Em telas largas ganha uma coluna lateral de atalhos. */
export function FeedView() {
  const { posts, pessoas, espaco, usuario } = useEstado();
  const { focoPost } = useUI();
  const desktop = useMidia(DESKTOP);
  // A coluna lateral só monta quando cabe (menos trabalho e nenhum relógio a mais no celular).
  const largo = useMidia(LARGO);

  const [filtro, setFiltro] = useState<Filtro>("tudo");
  const router = useRouter();
  // O filtro por autor vem do perfil público ("Ver publicações" → /feed?autor=id).
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
  const [composerVisivel, setComposerVisivel] = useState(true);
  const campoBusca = useRef<HTMLInputElement>(null);
  const composer = useRef<HTMLDivElement>(null);
  const timeline = useRef<HTMLElement>(null);

  // Publicações em revisão só aparecem para quem escreveu.
  const visiveis = posts.filter(
    (p) => (!p.emRevisao || p.autorId === USUARIO_ID) && (espaco === "escola" || p.espaco === espaco || p.espaco === "escola"),
  );

  const lista = visiveis
    .filter((p) => p.id === focoPost || (passaFiltro(p, filtro, pessoas[p.autorId]?.turma) && (!autor || p.autorId === autor)))
    .sort((a, b) => b.criadoEm - a.criadoEm);

  const resultados = buscaAdiada.trim().length >= 3 ? buscarSemelhantes(buscaAdiada, visiveis, { limite: 8, minimo: 0.12 }) : null;

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

  /** Com as abas grudadas no topo, trocar o filtro volta ao começo da lista. */
  const voltarAoTopoDaLista = () => {
    const topo = timeline.current?.getBoundingClientRect().top;
    if (topo !== undefined && topo < TOPO_ABAS) window.scrollTo({ top: window.scrollY + topo - TOPO_ABAS - 12, behavior: "smooth" });
  };

  // Um filtro escolhido pelo aluno vale mais que o destaque temporário.
  const trocarFiltro = (f: Filtro) => {
    focarPost(null);
    setFiltro(f);
    voltarAoTopoDaLista();
  };
  const limparAutor = () => {
    focarPost(null);
    router.replace("/feed");
  };

  const postMaterial = material ? (posts.find((p) => p.id === material.id) ?? null) : null;

  const cardProps = {
    pessoas,
    equipados: usuario.equipados,
    // Com um destaque pedido, todos os cards renderizam: a rolagem até ele cai no lugar certo.
    leve: !focoPost,
    onAbrirMaterial: abrirMaterialSheet,
    onDenunciar: (post: Post) => setDenuncia({ post, aberto: true }),
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
                "grid size-9 shrink-0 place-items-center rounded-full border transition-colors duration-150 active:scale-95",
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
                className="min-w-0 flex-1 bg-transparent text-[14.5px] text-tinta outline-none placeholder:text-texto-2/70"
              />
              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca("")}
                  aria-label="Limpar busca"
                  className="grid size-7 place-items-center rounded-full text-texto-2 transition-colors hover:bg-superficie-2 hover:text-tinta"
                >
                  <X className="size-4" />
                </button>
              )}
            </label>
          </div>
        </div>

        {!resultados && <MembrosFaixa pessoas={pessoas} posts={visiveis} />}

        {/* Timeline: abas, composer e publicações num só card (no celular, de ponta a ponta). */}
        <section
          ref={timeline}
          aria-label={resultados ? "Resultados da busca" : "Publicações"}
          className="-mx-4 border-y border-borda bg-superficie sm:mx-0 sm:rounded-2xl sm:border"
        >
          {resultados ? (
            <div className="flex items-center justify-between gap-3 border-b border-borda px-4 py-3 sm:px-5">
              <p className="min-w-0 text-[13px] text-texto-2" title="Encontra dúvidas com o mesmo assunto, mesmo escritas com outras palavras.">
                <span className="font-medium text-tinta">
                  {resultados.length} {resultados.length === 1 ? "resultado" : "resultados"}
                </span>{" "}
                · busca por assunto
              </p>
              <button type="button" onClick={fecharBusca} className="shrink-0 rounded-md text-[13px] font-medium text-texto-2 transition-colors hover:text-tinta">
                Limpar
              </button>
            </div>
          ) : (
            <>
              <div className="vidro sticky top-14 z-10 sm:rounded-t-2xl">
                <Abas grupo="filtro-feed" rotulo="Filtrar publicações" opcoes={FILTROS} valor={filtro} onChange={trocarFiltro} className="px-1 sm:px-2" />
              </div>

              {/* Composer */}
              <div ref={composer} className="border-b border-borda px-4 pb-3 pt-3.5 sm:px-5" onPointerEnter={preCarregarNova}>
                <div className="flex items-center gap-3">
                  <Avatar nome={usuario.nome} equipados={usuario.equipados} />
                  <button
                    type="button"
                    onClick={() => abrirNova("publicacao")}
                    onFocus={preCarregarNova}
                    className="h-10 min-w-0 flex-1 truncate rounded-full border border-borda bg-superficie-2 px-4 text-left text-[14px] text-texto-2 transition-colors duration-150 hover:border-texto-2/30 hover:text-texto"
                  >
                    <span className="sm:hidden">Compartilhe uma dúvida ou material…</span>
                    <span className="hidden sm:inline">Compartilhe uma dúvida, material ou aviso…</span>
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-1 pl-[52px]">
                  <Atalho icone={<MessageCircleQuestionMark />} onClick={() => abrirNova("duvida")}>
                    Dúvida
                  </Atalho>
                  <Atalho icone={<FileText />} onClick={() => abrirNova("material")}>
                    Material
                  </Atalho>
                  <Button tamanho="sm" className="ml-auto rounded-full px-4" onClick={() => abrirNova("publicacao")}>
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
                    <div className="flex items-center gap-2.5 border-b border-borda bg-superficie-2 px-4 py-2 text-[13px] sm:px-5">
                      <LinkPessoa id={autor} rotulo={pessoas[autor]?.nome}>
                        <Avatar nome={pessoas[autor]?.nome ?? "?"} iniciais={pessoas[autor]?.iniciais} tamanho="xs" />
                      </LinkPessoa>
                      <span className="min-w-0 flex-1 truncate text-texto-2">
                        Publicações de{" "}
                        <LinkPessoa id={autor} className="font-medium text-tinta hover:underline">
                          {pessoas[autor]?.nome ?? "membro do CEPI"}
                        </LinkPessoa>
                      </span>
                      <button
                        type="button"
                        onClick={limparAutor}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md font-medium text-texto-2 transition-colors hover:text-tinta"
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
            resultados.length === 0 ? (
              <Vazio titulo="Nada parecido por aqui" descricao="Tente outras palavras ou publique sua dúvida." />
            ) : (
              <div className="divide-y divide-borda">
                {resultados.map(({ post, score }) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    {...cardProps}
                    leve={false}
                    destacado={false}
                    contexto={
                      <>
                        <Sparkles aria-hidden />
                        <span className="tabular-nums">{Math.round(score * 100)}% relevante</span>
                        {post.respostas.some((r) => r.oficial) && <span>· com resposta oficial</span>}
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
              {lista.length === 0 && <Vazio titulo="Nada por aqui ainda" descricao="Quando alguém publicar neste filtro, aparece aqui." />}
            </div>
          )}
        </section>
      </div>

      {largo && (
        <aside aria-label="Atalhos do portal" className="sem-scrollbar hidden xl:sticky xl:top-[5.5rem] xl:block xl:max-h-[calc(100dvh-6.5rem)] xl:overflow-y-auto">
          <FeedLateral />
        </aside>
      )}

      {!desktop && <BotaoNova visivel={!composerVisivel && !buscando} onClick={() => abrirNova("publicacao")} />}

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
    </div>
  );
}

function Atalho({ icone, onClick, children }: { icone: ReactNode; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium text-texto-2 transition-colors duration-150 hover:bg-superficie-2 hover:text-tinta active:scale-[0.97] [&_svg]:size-4"
    >
      {icone}
      {children}
    </button>
  );
}

function Vazio({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="text-sm font-medium text-tinta">{titulo}</p>
      <p className="mx-auto mt-1 max-w-xs text-[13px] text-texto-2">{descricao}</p>
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
            className="pointer-events-auto grid size-12 place-items-center rounded-full bg-verde text-white shadow-flutuante transition-colors duration-150 hover:bg-verde-2"
          >
            <Plus className="size-6" strokeWidth={2.2} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
