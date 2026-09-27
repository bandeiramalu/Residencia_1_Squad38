"use client";

import {
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronDown,
  Download,
  Ellipsis,
  Flag,
  Heart,
  MessageCircle,
  Pin,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DisciplinaIcon } from "@/components/ui/DisciplinaIcon";
import { USUARIO_ID } from "@/data/pessoas";
import { useFecharFora } from "@/hooks/useFecharFora";
import { cn } from "@/lib/cn";
import { fmt, primeiroNome } from "@/lib/format";
import { nivelDe } from "@/lib/gamificacao";
import { tempoRelativo } from "@/lib/tempo";
import { baixarMaterial, curtir, marcarUtil, responder, salvar } from "@/store/actions";
import type { Pessoa, Post, Resposta } from "@/store/types";

const ROTULO_TIPO: Record<Post["tipo"], string> = {
  duvida: "Pergunta",
  material: "Material",
  aviso: "Aviso",
  publicacao: "Publicação",
};

interface Props {
  post: Post;
  pessoas: Record<string, Pessoa>;
  agora: number;
  equipados: string[];
  destacado?: boolean;
  onAbrirMaterial: (post: Post) => void;
  onDenunciar: (post: Post) => void;
}

function TextoComTags({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(/(#[\p{L}\d_]+)/u).map((parte, i) =>
        parte.startsWith("#") ? (
          <span key={i} className="font-semibold text-verde-2">
            {parte}
          </span>
        ) : (
          parte
        ),
      )}
    </>
  );
}

function SeloPapel({ pessoa }: { pessoa?: Pessoa }) {
  if (!pessoa) return null;
  if (pessoa.papel === "professor") return <Badge tom="verde">Professor</Badge>;
  if (pessoa.papel === "escola") return <Badge tom="azul">Escola</Badge>;
  const nivel = nivelDe(pessoa.xp ?? 0);
  return <Badge tom="claro">{`Nível ${nivel.n} – ${nivel.titulo}`}</Badge>;
}

export function PostCard({ post, pessoas, agora, equipados, destacado, onAbrirMaterial, onDenunciar }: Props) {
  const autor = pessoas[post.autorId];
  const souAutor = post.autorId === USUARIO_ID;
  const ehDuvida = post.tipo === "duvida";
  const [abertas, setAbertas] = useState(false);
  const [respondendo, setRespondendo] = useState(false);
  const [menu, setMenu] = useState(false);
  const [texto, setTexto] = useState("");
  const campo = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fecharMenu = useCallback(() => setMenu(false), []);
  useFecharFora(menuRef, menu, fecharMenu);
  const respostasOrdenadas = [...post.respostas].sort((a, b) => Number(!!b.oficial) - Number(!!a.oficial));
  const mostrarRespostas = abertas || destacado;

  useEffect(() => {
    if (respondendo) campo.current?.focus({ preventScroll: true });
  }, [respondendo]);

  const enviar = () => {
    const t = texto.trim();
    if (!t) return;
    responder(post.id, t);
    setTexto("");
    setRespondendo(false);
    setAbertas(true);
  };

  return (
    <motion.article
      id={`post-${post.id}`}
      layout="position"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 380, damping: 34 }}
      className={cn(
        "relative scroll-mt-24 overflow-hidden rounded-2xl border bg-white shadow-card transition-[border-color,box-shadow] duration-500",
        ehDuvida && "border-l-[3px] border-l-verde",
        destacado ? "border-verde-2 ring-4 ring-verde-2/15" : "border-borda",
      )}
    >
      <div className="p-4">
        {/* Cabeçalho do card */}
        <div className="flex items-start gap-3">
          <Avatar nome={autor?.nome ?? "?"} iniciais={autor?.iniciais} equipados={souAutor ? equipados : []} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <span className="truncate text-sm font-bold text-tinta">{autor?.nome}</span>
              {souAutor && <Badge tom="verde" maiuscula>você</Badge>}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <SeloPapel pessoa={autor} />
              {post.disciplina && (
                <Badge tom="contorno">
                  <DisciplinaIcon disciplina={post.disciplina} />
                  {post.disciplina}
                </Badge>
              )}
              <span className="text-[11px] text-texto-2">{tempoRelativo(post.criadoEm, agora)}</span>
            </div>
          </div>

          {!souAutor && (
            <div ref={menuRef} className="relative -mr-1.5 -mt-1">
              <button
                type="button"
                onClick={() => setMenu((m) => !m)}
                aria-label="Mais opções"
                aria-expanded={menu}
                className="grid size-8 place-items-center rounded-full text-texto-2 transition-colors hover:bg-verde-mclaro hover:text-verde"
              >
                <Ellipsis className="size-4" />
              </button>
              <AnimatePresence>
                {menu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.14 }}
                    style={{ transformOrigin: "top right" }}
                    className="absolute right-0 top-full z-20 mt-1 w-52 rounded-xl border border-borda bg-white p-1 shadow-flutuante"
                  >
                    <button
                      type="button"
                      disabled={!!post.denuncia}
                      onClick={() => {
                        setMenu(false);
                        onDenunciar(post);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-alerta transition-colors hover:bg-red-50 disabled:text-texto-2 disabled:hover:bg-transparent"
                    >
                      <Flag className="size-4" />
                      {post.denuncia ? "Denúncia já enviada" : "Denunciar publicação"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge tom={ehDuvida ? "verde" : post.tipo === "aviso" ? "azul" : "claro"} maiuscula>
            {ROTULO_TIPO[post.tipo]}
          </Badge>
          {post.tags
            .filter((t) => !post.texto.toLowerCase().includes(`#${t}`))
            .slice(0, 3)
            .map((t) => (
            <Badge key={t} tom="neutro">
              #{t}
            </Badge>
          ))}
        </div>

        {post.emRevisao && (
          <div className="mt-3 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-ambar" />
            <span>
              <b>Em revisão pela coordenação.</b> A triagem automática sinalizou possíveis termos ofensivos. Só você vê esta publicação até a
              revisão humana — nenhuma punição é aplicada automaticamente.
            </span>
          </div>
        )}

        {post.denuncia && (
          <div className="mt-3 flex gap-2 rounded-xl border border-borda bg-fundo p-3 text-xs leading-relaxed text-texto-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-verde-2" />
            <span>
              Você denunciou esta publicação ({post.denuncia.motivo.toLowerCase()}). Triagem por IA:{" "}
              <b className="text-texto">{post.denuncia.categoriaIA}</b>, prioridade {post.denuncia.prioridade} — em análise pela coordenação.
            </span>
          </div>
        )}

        <p className="mt-3 whitespace-pre-line text-[14.5px] leading-relaxed text-texto">
          <TextoComTags texto={post.texto} />
        </p>

        {post.anexo && (
          <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-borda bg-verde-mclaro p-2.5 pr-2 transition-colors hover:border-verde-suave">
            <button
              type="button"
              onClick={() => onAbrirMaterial(post)}
              className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
              aria-label={`Abrir ${post.anexo.nome}`}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-linear-to-br from-verde-2 to-verde text-white shadow-sm">
                <DisciplinaIcon disciplina={post.disciplina} className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold text-tinta">{post.anexo.nome}</span>
                <span className="block truncate text-[11.5px] text-texto-2">
                  PDF · {post.anexo.paginas} {post.anexo.paginas === 1 ? "pág." : "págs."} · {post.anexo.tamanho}
                </span>
              </span>
            </button>
            <Button tamanho="sm" className="px-2.5" onClick={() => baixarMaterial(post)} aria-label={`Baixar ${post.anexo.nome}`}>
              <Download /> PDF · Baixar
            </Button>
          </div>
        )}
      </div>

      {/* Rodapé interativo */}
      <div className="flex items-center gap-0.5 border-t border-borda px-2 py-1.5">
        <button
          type="button"
          onClick={() => curtir(post.id)}
          aria-pressed={post.curtido}
          aria-label="Curtir"
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold transition-colors",
            post.curtido ? "text-rose-600" : "text-texto-2 hover:bg-verde-mclaro hover:text-verde",
          )}
        >
          <motion.span key={String(post.curtido)} initial={{ scale: post.curtido ? 0.5 : 1 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 600, damping: 12 }}>
            <Heart className={cn("size-[18px]", post.curtido && "fill-rose-500 text-rose-500")} />
          </motion.span>
          {fmt(post.curtidas)}
        </button>
        <button
          type="button"
          onClick={() => setAbertas((a) => !a)}
          aria-expanded={mostrarRespostas}
          aria-label={ehDuvida ? "Ver respostas" : "Ver comentários"}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-texto-2 transition-colors hover:bg-verde-mclaro hover:text-verde"
        >
          <MessageCircle className="size-[18px]" />
          {post.respostas.length}
        </button>
        <button
          type="button"
          onClick={() => salvar(post.id)}
          aria-pressed={post.salvo}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold transition-colors",
            post.salvo ? "text-verde" : "text-texto-2 hover:bg-verde-mclaro hover:text-verde",
          )}
        >
          {post.salvo ? <BookmarkCheck className="size-[18px] fill-verde-claro" /> : <Bookmark className="size-[18px]" />}
          {post.salvo ? "Salvo" : "Salvar"}
        </button>
        <div className="flex-1" />
        {!post.emRevisao && (
          <Button variante={respondendo ? "secundario" : "rapido"} tamanho="sm" onClick={() => setRespondendo((r) => !r)}>
            <MessageCircle /> {ehDuvida ? "Responder" : "Comentar"}
          </Button>
        )}
      </div>

      {/* Caixa de resposta */}
      <AnimatePresence initial={false}>
        {respondendo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 38 }}
            className="overflow-hidden"
          >
            <div className="border-t border-borda bg-white px-4 pb-4 pt-3">
              <textarea
                ref={campo}
                rows={3}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) enviar();
                }}
                placeholder={ehDuvida ? `Explique para ${primeiroNome(autor?.nome ?? "")} como você pensou…` : "Escreva um comentário…"}
                className="w-full resize-none rounded-xl border border-borda bg-verde-mclaro px-3 py-2.5 text-sm text-texto outline-none transition-colors placeholder:text-texto-2/70 focus:border-verde-2 focus:bg-white"
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[11.5px] text-texto-2">
                  {ehDuvida && !souAutor ? "+15 pontos e +10 XP por responder" : "Ctrl + Enter para enviar"}
                </span>
                <div className="flex gap-1.5">
                  <Button variante="fantasma" tamanho="sm" onClick={() => setRespondendo(false)}>
                    Cancelar
                  </Button>
                  <Button tamanho="sm" onClick={enviar} disabled={!texto.trim()}>
                    Enviar
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Respostas */}
      {post.respostas.length > 0 && (
        <div className="border-t border-borda bg-verde-mclaro/70">
          {!mostrarRespostas ? (
            <button
              type="button"
              onClick={() => setAbertas(true)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-[13px] font-semibold text-verde transition-colors hover:bg-verde-mclaro"
            >
              <span>
                Ver {post.respostas.length} {post.respostas.length === 1 ? (ehDuvida ? "resposta" : "comentário") : ehDuvida ? "respostas" : "comentários"}
                {post.respostas.some((r) => r.oficial) && <span className="ml-1.5 font-medium text-texto-2">· inclui resposta oficial</span>}
              </span>
              <ChevronDown className="size-4" />
            </button>
          ) : (
            <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 px-3 pb-3 pt-3">
              <AnimatePresence initial={false}>
                {respostasOrdenadas.map((r) => (
                  <RespostaItem key={r.id} resposta={r} pessoas={pessoas} agora={agora} post={post} equipados={equipados} />
                ))}
              </AnimatePresence>
              {souAutor && ehDuvida && (
                <li className="px-1 pt-1 text-[11.5px] leading-snug text-texto-2">
                  Só você, que publicou a dúvida, pode marcar respostas como úteis. O autor da resposta ganha +25 XP.
                </li>
              )}
              <li>
                <button
                  type="button"
                  onClick={() => setAbertas(false)}
                  className="w-full rounded-lg py-1.5 text-xs font-semibold text-texto-2 transition-colors hover:text-verde"
                >
                  Recolher
                </button>
              </li>
            </motion.ul>
          )}
        </div>
      )}
    </motion.article>
  );
}

function RespostaItem({
  resposta: r,
  pessoas,
  agora,
  post,
  equipados,
}: {
  resposta: Resposta;
  pessoas: Record<string, Pessoa>;
  agora: number;
  post: Post;
  equipados: string[];
}) {
  const autor = pessoas[r.autorId];
  const minha = r.autorId === USUARIO_ID;
  const podeMarcar = post.autorId === USUARIO_ID && post.tipo === "duvida" && !minha && !r.util;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border bg-white p-3",
        r.oficial ? "border-verde-2/50 ring-1 ring-verde-2/10" : minha ? "border-verde-suave" : "border-borda",
      )}
    >
      {r.oficial && (
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-verde">
          <Pin className="size-3.5" /> Resposta oficial fixada
        </p>
      )}
      <div className="flex items-start gap-2.5">
        <Avatar nome={autor?.nome ?? "?"} iniciais={autor?.iniciais} tamanho="sm" equipados={minha ? equipados : []} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[13px] font-bold text-tinta">{autor?.nome}</span>
            {minha && <Badge tom="verde" maiuscula>sua resposta</Badge>}
            {autor?.papel === "professor" && !r.oficial && <Badge tom="claro">Professor</Badge>}
            <span className="text-[11px] text-texto-2">{tempoRelativo(r.criadoEm, agora)}</span>
          </div>
          <p className="mt-1 text-[13.5px] leading-relaxed text-texto">{r.texto}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {podeMarcar && (
              <Button variante="rapido" tamanho="sm" onClick={() => marcarUtil(post.id, r.id)}>
                <Check /> Marcar como útil
              </Button>
            )}
            {r.util && (
              <Badge tom="claro">
                <Check /> Útil
              </Badge>
            )}
            {minha && !r.util && post.tipo === "duvida" && (
              <span className="text-[11px] text-texto-2">Aguardando {primeiroNome(pessoas[post.autorId]?.nome ?? "")} avaliar</span>
            )}
            {r.uteis > 0 && (
              <span className="text-[11px] text-texto-2">
                {r.uteis} {r.uteis === 1 ? "achou útil" : "acharam útil"}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.li>
  );
}
