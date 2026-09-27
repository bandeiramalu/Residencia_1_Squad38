"use client";

import { Plus, Search, SearchX, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Badge } from "@/components/ui/Badge";
import { Vazio } from "@/components/ui/Blocos";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { USUARIO_ID } from "@/data/pessoas";
import { TURMA_DO_ALUNO } from "@/data/escola";
import { useAgora } from "@/hooks/useAgora";
import { buscarSemelhantes } from "@/lib/busca";
import { abrirMaterial } from "@/store/actions";
import { useEstado } from "@/store/store";
import type { Post } from "@/store/types";
import { focarPost, useUI } from "@/store/ui";
import { DenunciaSheet } from "./DenunciaSheet";
import { MaterialSheet } from "./MaterialSheet";
import { MembrosFaixa } from "./MembrosFaixa";
import { NovaPublicacaoSheet } from "./NovaPublicacaoSheet";
import { PostCard } from "./PostCard";

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

/** Aba 1 — Feed: comunidade, dúvidas e materiais. */
export function FeedView() {
  const { posts, pessoas, espaco, usuario } = useEstado();
  const { focoPost } = useUI();
  const agora = useAgora(30_000);

  const [filtro, setFiltro] = useState<Filtro>("tudo");
  const [autor, setAutor] = useState<string | null>(null);
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [busca, setBusca] = useState("");
  const buscaAdiada = useDeferredValue(busca);
  const [novaAberta, setNovaAberta] = useState(false);
  const [material, setMaterial] = useState<Post | null>(null);
  const [denuncia, setDenuncia] = useState<Post | null>(null);
  const campoBusca = useRef<HTMLInputElement>(null);

  // Publicações em revisão só aparecem para quem escreveu.
  const visiveis = useMemo(
    () =>
      posts.filter(
        (p) => (!p.emRevisao || p.autorId === USUARIO_ID) && (espaco === "escola" || p.espaco === espaco || p.espaco === "escola"),
      ),
    [posts, espaco],
  );

  const lista = useMemo(
    () =>
      visiveis
        .filter((p) => p.id === focoPost || (passaFiltro(p, filtro, pessoas[p.autorId]?.turma) && (!autor || p.autorId === autor)))
        .sort((a, b) => b.criadoEm - a.criadoEm),
    [visiveis, filtro, autor, pessoas, focoPost],
  );

  const resultados = useMemo(
    () => (buscaAdiada.trim().length >= 3 ? buscarSemelhantes(buscaAdiada, visiveis, { limite: 8, minimo: 0.12 }) : null),
    [buscaAdiada, visiveis],
  );

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
    if (buscaAberta) campoBusca.current?.focus();
  }, [buscaAberta]);

  const abrirMaterialSheet = useCallback((post: Post) => {
    abrirMaterial(post.id);
    setMaterial(post);
  }, []);

  const verPost = useCallback((id: string) => {
    setNovaAberta(false);
    setBuscaAberta(false);
    setBusca("");
    focarPost(id);
  }, []);

  // Um filtro escolhido pelo aluno vale mais que o destaque temporário.
  const trocarFiltro = (f: Filtro) => {
    focarPost(null);
    setFiltro(f);
  };
  const trocarAutor = (id: string | null) => {
    focarPost(null);
    setAutor(id);
  };

  const postMaterial = material ? (posts.find((p) => p.id === material.id) ?? null) : null;

  const cardProps = {
    pessoas,
    agora,
    equipados: usuario.equipados,
    onAbrirMaterial: abrirMaterialSheet,
    onDenunciar: setDenuncia,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {buscaAberta ? (
            <motion.div
              key="busca"
              initial={{ opacity: 0, width: "40%" }}
              animate={{ opacity: 1, width: "100%" }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
              className="flex h-11 items-center gap-2 rounded-2xl border border-verde-2 bg-white px-3 shadow-card"
            >
              <Search className="size-4 shrink-0 text-verde-2" />
              <input
                ref={campoBusca}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar dúvidas e resoluções…"
                aria-label="Buscar no feed"
                className="min-w-0 flex-1 bg-transparent text-sm text-texto outline-none placeholder:text-texto-2/70"
              />
              <button
                type="button"
                onClick={() => {
                  setBusca("");
                  setBuscaAberta(false);
                }}
                aria-label="Fechar busca"
                className="grid size-7 place-items-center rounded-full text-texto-2 hover:bg-verde-mclaro"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          ) : (
            <motion.div key="titulo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex w-full items-center justify-between">
              <div>
                <h1 className="text-[22px] font-extrabold leading-tight tracking-tight text-tinta">Feed da escola</h1>
                <p className="text-[13px] text-texto-2">Dúvidas, materiais e avisos da comunidade</p>
              </div>
              <button
                type="button"
                onClick={() => setBuscaAberta(true)}
                aria-label="Buscar dúvidas"
                className="grid size-11 shrink-0 place-items-center rounded-2xl border border-borda bg-white text-texto shadow-card transition-colors hover:text-verde active:scale-95"
              >
                <Search className="size-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {resultados ? (
        <section aria-label="Resultados da busca" className="space-y-3">
          <p className="text-[12.5px] text-texto-2">
            <b className="text-tinta">Busca semântica:</b> encontra dúvidas com o mesmo assunto, mesmo escritas com outras palavras.
          </p>
          {resultados.length === 0 ? (
            <Vazio icone={<SearchX />} titulo="Nada parecido por aqui" descricao="Tente outras palavras ou publique sua dúvida no +." />
          ) : (
            resultados.map(({ post, score }) => (
              <div key={post.id} className="space-y-1.5">
                <div className="flex items-center gap-1.5 px-1">
                  <Badge tom="claro">{Math.round(score * 100)}% relevante</Badge>
                  {post.respostas.some((r) => r.oficial) && <Badge tom="verde">Resposta oficial fixada</Badge>}
                </div>
                <PostCard post={post} {...cardProps} destacado={false} />
              </div>
            ))
          )}
        </section>
      ) : (
        <>
          <ChipGroup grupo="filtro-feed" rotulo="Filtrar publicações" opcoes={FILTROS} valor={filtro} onChange={trocarFiltro} />
          <MembrosFaixa pessoas={pessoas} selecionado={autor} onSelecionar={trocarAutor} />

          <AnimatePresence>
            {autor && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center justify-between rounded-xl bg-verde-claro px-3 py-2 text-[13px] text-verde">
                  <span>
                    Mostrando publicações de <b>{pessoas[autor]?.nome}</b>
                  </span>
                  <button type="button" onClick={() => setAutor(null)} className="font-semibold hover:underline">
                    Limpar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <section aria-label="Publicações" className="space-y-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {lista.map((post) => (
                <PostCard key={post.id} post={post} {...cardProps} destacado={post.id === focoPost} />
              ))}
            </AnimatePresence>
            {lista.length === 0 && <Vazio titulo="Nada por aqui ainda" descricao="Quando alguém publicar neste filtro, aparece aqui." />}
          </section>
        </>
      )}

      <BotaoFlutuante onClick={() => setNovaAberta(true)} />

      <NovaPublicacaoSheet
        aberto={novaAberta}
        onFechar={() => setNovaAberta(false)}
        posts={visiveis}
        onPublicado={(id) => {
          setFiltro("tudo");
          setAutor(null);
          window.scrollTo({ top: 0, behavior: "smooth" });
          focarPost(id);
        }}
        onVerPost={verPost}
      />
      <MaterialSheet post={postMaterial} autor={postMaterial ? pessoas[postMaterial.autorId] : undefined} onFechar={() => setMaterial(null)} />
      <DenunciaSheet post={denuncia} onFechar={() => setDenuncia(null)} />
    </div>
  );
}

/** FAB "+" — fica fora do fluxo da página (portal) para não ser afetado pelas transições. */
function BotaoFlutuante({ onClick }: { onClick: () => void }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-30 mx-auto flex w-full max-w-[480px] justify-end px-4">
      <motion.button
        type="button"
        onClick={onClick}
        aria-label="Nova publicação"
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 500, damping: 26 }}
        className="pointer-events-auto grid size-14 place-items-center rounded-2xl bg-verde text-white shadow-[0_12px_28px_-8px_rgb(30_113_73/0.65)] hover:bg-verde-2"
      >
        <Plus className="size-7" strokeWidth={2.4} />
      </motion.button>
    </div>,
    document.body,
  );
}
