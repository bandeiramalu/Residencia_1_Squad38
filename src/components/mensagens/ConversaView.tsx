"use client";

import { ArrowLeft, Check, CheckCheck, SendHorizontal, ShieldAlert, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Vazio } from "@/components/ui/Blocos";
import { SUGESTOES_DM } from "@/data/conversas";
import { useAgora } from "@/hooks/useAgora";
import { cn } from "@/lib/cn";
import { ehGrupo, horaCurta, subtituloDaConversa, tituloDaConversa } from "@/lib/conversas";
import { primeiroNome } from "@/lib/format";
import { inicioDoDia } from "@/lib/tempo";
import { abrirConversa, enviarMensagem } from "@/store/actions";
import { useEstado } from "@/store/store";
import type { Mensagem, Pessoa } from "@/store/types";
import { definirConversaAberta, useUI } from "@/store/ui";
import { AvatarConversa } from "./AvatarConversa";

const DIA = 86_400_000;

function rotuloDoDia(dia: number, hoje: number) {
  if (dia === hoje) return "Hoje";
  if (dia === hoje - DIA) return "Ontem";
  return new Date(dia).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

/** Tela de conversa: mensagens diretas e grupos (US01). */
export function ConversaView({ id }: { id: string }) {
  const { conversas, pessoas, usuario } = useEstado();
  const { digitando } = useUI();
  const conversa = conversas.find((c) => c.id === id);
  const quemDigita = digitando[id];
  const total = conversa?.mensagens.length ?? 0;
  const fim = useRef<HTMLDivElement>(null);
  const primeiraRolagem = useRef(true);
  const agora = useAgora(60_000);

  // Marca a conversa como aberta: respostas que chegarem já entram como lidas.
  useEffect(() => {
    definirConversaAberta(id);
    return () => definirConversaAberta(null);
  }, [id]);

  useEffect(() => {
    if (total) abrirConversa(id);
  }, [id, total]);

  // Rola até a última mensagem (sem animação na primeira vez).
  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end", behavior: primeiraRolagem.current ? "instant" : "smooth" });
    primeiraRolagem.current = false;
  }, [total, quemDigita]);

  if (!conversa) {
    return (
      <div className="px-4 pt-6">
        <Vazio titulo="Conversa não encontrada" descricao="Ela pode ter sido apagada ao reiniciar a demonstração." />
        <Link href="/mensagens" className="mt-4 block text-center text-sm font-semibold text-verde hover:underline">
          Voltar para Mensagens
        </Link>
      </div>
    );
  }

  const grupo = ehGrupo(conversa);
  const hoje = inicioDoDia(agora);
  const msgs = conversa.mensagens;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b border-borda bg-white/92 px-2 backdrop-blur-md">
        <Link
          href="/mensagens"
          aria-label="Voltar para Mensagens"
          className="grid size-10 shrink-0 place-items-center rounded-full text-texto transition-colors hover:bg-verde-mclaro hover:text-verde active:scale-90"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <AvatarConversa conversa={conversa} pessoas={pessoas} usuarioId={usuario.id} />
        <div className="min-w-0 flex-1 pl-1">
          <p className="truncate text-[15px] font-bold leading-tight text-tinta">{tituloDaConversa(conversa, pessoas, usuario.id)}</p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={quemDigita ? "digitando" : "sub"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className={cn("truncate text-xs", quemDigita ? "font-semibold text-verde-2" : "text-texto-2")}
            >
              {quemDigita
                ? grupo
                  ? `${primeiroNome(pessoas[quemDigita]?.nome ?? "")} está digitando…`
                  : "digitando…"
                : subtituloDaConversa(conversa, pessoas, usuario.id)}
            </motion.p>
          </AnimatePresence>
        </div>
      </header>

      <div className="flex-1 px-3 pb-40 pt-3">
        <p className="mx-auto mb-3 flex max-w-[320px] items-start gap-1.5 rounded-xl bg-verde-mclaro px-3 py-2 text-center text-[11.5px] leading-snug text-texto-2">
          <ShieldCheck className="mt-px size-3.5 shrink-0 text-verde-2" />
          Conversa privada entre membros do CEPI. Conteúdo ofensivo é retido para revisão da coordenação.
        </p>

        {msgs.length === 0 && (
          <p className="py-10 text-center text-sm text-texto-2">Nenhuma mensagem ainda. Diga oi! 👋</p>
        )}

        <ol className="space-y-0.5" aria-label="Mensagens">
          {msgs.map((m, i) => {
            const anterior = msgs[i - 1];
            const proxima = msgs[i + 1];
            const dia = inicioDoDia(m.criadoEm);
            const novoDia = !anterior || inicioDoDia(anterior.criadoEm) !== dia;
            const inicioGrupo = novoDia || anterior?.autorId !== m.autorId;
            const fimGrupo = !proxima || proxima.autorId !== m.autorId || inicioDoDia(proxima.criadoEm) !== dia;
            return (
              <Fragment key={m.id}>
                {novoDia && (
                  <li className="flex justify-center py-3">
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold capitalize text-texto-2 shadow-card ring-1 ring-borda">
                      {rotuloDoDia(dia, hoje)}
                    </span>
                  </li>
                )}
                <Bolha
                  mensagem={m}
                  minha={m.autorId === usuario.id}
                  autor={pessoas[m.autorId]}
                  mostrarNome={grupo && inicioGrupo && m.autorId !== usuario.id}
                  mostrarAvatar={fimGrupo}
                  espacoAntes={inicioGrupo && !novoDia}
                />
              </Fragment>
            );
          })}
          <AnimatePresence>{quemDigita && <Digitando key="digitando" autor={pessoas[quemDigita]} />}</AnimatePresence>
        </ol>
        <div ref={fim} className="h-px scroll-mb-40" />
      </div>

      <Composer conversaId={id} vazia={msgs.length === 0} />
    </div>
  );
}

function Bolha({
  mensagem: m,
  minha,
  autor,
  mostrarNome,
  mostrarAvatar,
  espacoAntes,
}: {
  mensagem: Mensagem;
  minha: boolean;
  autor?: Pessoa;
  mostrarNome: boolean;
  mostrarAvatar: boolean;
  espacoAntes: boolean;
}) {
  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 10, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 520, damping: 34 }}
      style={{ transformOrigin: minha ? "bottom right" : "bottom left" }}
      className={cn("flex items-end gap-2", minha ? "justify-end" : "justify-start", espacoAntes && "pt-2.5")}
    >
      {!minha && (
        <span className="w-8 shrink-0">{mostrarAvatar && <Avatar nome={autor?.nome ?? "?"} iniciais={autor?.iniciais} tamanho="sm" />}</span>
      )}
      <div className={cn("flex max-w-[78%] flex-col", minha ? "items-end" : "items-start")}>
        {mostrarNome && <span className="mb-0.5 ml-3 text-[11px] font-bold text-verde-2">{primeiroNome(autor?.nome ?? "")}</span>}
        <div
          className={cn(
            "rounded-[20px] px-3.5 py-2 text-[14.5px] leading-snug shadow-sm",
            minha
              ? m.retida
                ? "border border-amber-300 bg-amber-50 text-amber-950"
                : "bg-linear-to-br from-verde-2 to-verde text-white"
              : "border border-borda bg-white text-texto",
            mostrarAvatar && (minha ? "rounded-br-md" : "rounded-bl-md"),
          )}
        >
          {m.retida && (
            <span className="mb-1 flex items-center gap-1 text-[11px] font-bold text-ambar">
              <ShieldAlert className="size-3.5" /> Retida para revisão
            </span>
          )}
          <span className="whitespace-pre-wrap break-words">{m.texto}</span>
          <span
            className={cn(
              "float-right ml-2 mt-1.5 flex translate-y-0.5 items-center gap-0.5 text-[10.5px] leading-none",
              minha && !m.retida ? "text-white/75" : "text-texto-2",
            )}
          >
            {horaCurta(m.criadoEm)}
            {minha &&
              !m.retida &&
              (m.lida ? <CheckCheck className="size-3.5 text-emerald-200" aria-label="Lida" /> : <Check className="size-3.5" aria-label="Enviada" />)}
          </span>
        </div>
      </div>
    </motion.li>
  );
}

function Digitando({ autor }: { autor?: Pessoa }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 8, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.12 } }}
      style={{ transformOrigin: "bottom left" }}
      className="flex items-end gap-2 pt-2.5"
      aria-label={`${autor?.nome ?? "Alguém"} está digitando`}
    >
      <span className="w-8 shrink-0">
        <Avatar nome={autor?.nome ?? "?"} iniciais={autor?.iniciais} tamanho="sm" />
      </span>
      <span className="flex items-center gap-1 rounded-[20px] rounded-bl-md border border-borda bg-white px-4 py-3.5 shadow-sm">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-2 rounded-full bg-verde-2/60"
            animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
          />
        ))}
      </span>
    </motion.li>
  );
}

/** Campo de mensagem fixo no rodapé (portal: fica fora da transição da página). */
function Composer({ conversaId, vazia }: { conversaId: string; vazia: boolean }) {
  const [texto, setTexto] = useState("");
  const campo = useRef<HTMLTextAreaElement>(null);
  const linhas = Math.min(4, Math.max(1, texto.split("\n").length, Math.ceil(texto.length / 34)));

  const enviar = (valor = texto) => {
    if (!valor.trim()) return;
    enviarMensagem(conversaId, valor);
    setTexto("");
    campo.current?.focus();
  };

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[480px] border-t border-borda bg-white/95 backdrop-blur-md">
      <AnimatePresence initial={false}>
        {!texto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="sem-scrollbar flex gap-2 overflow-x-auto px-3 pt-2.5" role="list" aria-label="Sugestões de mensagem">
              {(vazia ? SUGESTOES_DM : SUGESTOES_DM.slice(1)).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="listitem"
                  onClick={() => enviar(s)}
                  className="shrink-0 rounded-full border border-verde-suave bg-verde-mclaro px-3 py-1.5 text-xs font-semibold text-verde transition-colors hover:bg-verde-claro active:scale-95"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <form
        className="flex items-end gap-2 px-3 py-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
      >
        <textarea
          ref={campo}
          rows={linhas}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              enviar();
            }
          }}
          placeholder="Escreva uma mensagem…"
          aria-label="Mensagem"
          maxLength={500}
          className="max-h-32 min-w-0 flex-1 resize-none rounded-3xl border border-borda bg-verde-mclaro px-4 py-2.5 text-[15px] leading-snug text-texto outline-none transition-colors placeholder:text-texto-2/70 focus:border-verde-2 focus:bg-white"
        />
        <motion.button
          type="submit"
          aria-label="Enviar mensagem"
          disabled={!texto.trim()}
          animate={{ scale: texto.trim() ? 1 : 0.88, opacity: texto.trim() ? 1 : 0.5 }}
          whileTap={{ scale: 0.85 }}
          transition={{ type: "spring", stiffness: 600, damping: 26 }}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-verde text-white shadow-sm hover:bg-verde-2 disabled:bg-verde-suave"
        >
          <SendHorizontal className="size-5" />
        </motion.button>
      </form>
    </div>,
    document.body,
  );
}
