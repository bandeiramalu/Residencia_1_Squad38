"use client";

import { ArrowDown, Lock, LogIn, SendHorizontal, ShieldCheck } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { LinkPessoa } from "@/components/ui/LinkPessoa";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { primeiroNome } from "@/lib/format";
import { enviarMensagemSala, reagirSala } from "@/store/actions";
import { useSeletor } from "@/store/store";
import type { MensagemSala, Pessoa, SalaEstudo } from "@/store/types";
import { horaCurta, REACOES } from "./comum";

const ENTRADA = { duration: 0.18, ease: [0.2, 0, 0, 1] } as const;
/** Mensagens seguidas do mesmo autor em até 5 min viram um grupo (sem repetir avatar e nome). */
const JANELA_GRUPO = 5 * 60_000;
const LIMITE_TEXTO = 280;

/** Mesma altura do chat nos dois estados (aberto e bloqueado): no desktop acompanha a janela. */
const CAIXA = "flex h-[480px] flex-col overflow-hidden rounded-2xl border border-borda bg-superficie lg:h-[calc(100dvh-7.5rem)] lg:max-h-[720px] lg:min-h-[480px]";

interface Props {
  sala: SalaEstudo;
  usuarioId: string;
  /** Aluna fora da sala só lê; professor e quem está dentro conversam. */
  podeEnviar: boolean;
  /** Pessoas na sala agora (para o "online"). */
  online?: number;
  /** Troca o convite "entre na sala" (ex.: sala agendada ainda fechada). */
  aviso?: string;
  onEntrar?: () => void;
}

export function ChatSala({ sala, usuarioId, podeEnviar, online, aviso, onEntrar }: Props) {
  const pessoas = useSeletor((e) => e.pessoas);
  const usuario = useSeletor((e) => e.usuario);
  const lista = useRef<HTMLDivElement>(null);
  const [texto, setTexto] = useState("");
  const [noFim, setNoFim] = useState(true);
  const { mensagens } = sala;
  const ultima = mensagens.at(-1);
  const [vistaAte, setVistaAte] = useState(ultima?.id);
  const minhaUltima = ultima?.autorId === usuarioId;

  // Rola até o fim quando chega mensagem — se a pessoa já estava lá embaixo ou se foi ela que mandou.
  useEffect(() => {
    const el = lista.current;
    if (el && (noFim || minhaUltima)) el.scrollTop = el.scrollHeight;
  }, [ultima?.id, noFim, minhaUltima]);

  const aoRolar = () => {
    const el = lista.current;
    if (!el) return;
    const fim = el.scrollHeight - el.scrollTop - el.clientHeight < 72;
    setNoFim(fim);
    if (fim) setVistaAte(ultima?.id);
  };

  const irAoFim = () => lista.current?.scrollTo({ top: lista.current.scrollHeight, behavior: "smooth" });

  const indiceVisto = mensagens.findIndex((m) => m.id === vistaAte);
  const novas = !noFim && ultima && ultima.id !== vistaAte ? mensagens.length - 1 - indiceVisto : 0;

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!texto.trim()) return;
    enviarMensagemSala(sala.id, texto);
    setTexto("");
  };

  const nomeDe = (id: string) => pessoas[id]?.nome ?? (id === usuario.id ? usuario.nome : "Colega");

  return (
    <section aria-label="Chat da sala" className={CAIXA}>
      <CabecalhoChat online={online} />

      <div className="relative min-h-0 flex-1">
        <div ref={lista} onScroll={aoRolar} className="h-full overflow-y-auto overscroll-contain px-3 py-3" role="log" aria-live="polite" aria-relevant="additions">
          {mensagens.length === 0 && (
            <div className="grid h-full place-items-center px-6 text-center">
              <p className="text-[13px] text-texto-2">{podeEnviar ? "Nenhuma mensagem ainda. Diga oi para a sala." : "Nenhuma mensagem ainda."}</p>
            </div>
          )}
          <AnimatePresence initial={false}>
            {mensagens.map((m, i) => {
              const anterior = mensagens[i - 1];
              const agrupada = !!anterior && anterior.tipo === "mensagem" && m.tipo === "mensagem" && anterior.autorId === m.autorId && m.criadoEm - anterior.criadoEm < JANELA_GRUPO;
              return (
                <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={ENTRADA} className={agrupada ? "mt-0.5" : i > 0 ? "mt-3" : undefined}>
                  <ItemMensagem m={m} meu={m.autorId === usuarioId} nome={nomeDe(m.autorId)} autor={pessoas[m.autorId]} agrupada={agrupada} />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {novas > 0 && (
            <motion.button
              type="button"
              onClick={irAoFim}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={ENTRADA}
              className="absolute inset-x-0 bottom-3 mx-auto flex w-fit items-center gap-1.5 rounded-full border border-borda bg-superficie px-3 py-1.5 text-[12px] font-medium text-tinta shadow-flutuante transition-colors hover:bg-superficie-2"
            >
              <ArrowDown className="size-3.5" aria-hidden />
              {novas === 1 ? "1 nova mensagem" : `${novas} novas mensagens`}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-borda p-3">
        {podeEnviar ? (
          <>
            <div className="mb-2 flex items-center gap-0.5" role="group" aria-label="Reações rápidas">
              {REACOES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => reagirSala(sala.id, r)}
                  aria-label={`Reagir com ${r}`}
                  className="grid size-8 place-items-center rounded-lg text-[16px] transition-[background-color,transform] duration-150 hover:bg-superficie-2 active:scale-90"
                >
                  {r}
                </button>
              ))}
            </div>
            <form onSubmit={enviar} className="flex items-center gap-2">
              <input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                maxLength={LIMITE_TEXTO}
                placeholder="Mensagem para a sala"
                aria-label="Mensagem para a sala"
                autoComplete="off"
                className="h-10 min-w-0 flex-1 rounded-full border border-borda bg-superficie-2 px-4 text-[14px] text-tinta outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-texto-2/70 focus:border-verde focus:bg-superficie focus:ring-3 focus:ring-verde/15"
              />
              <button
                type="submit"
                disabled={!texto.trim()}
                aria-label="Enviar mensagem"
                className="grid size-10 shrink-0 place-items-center rounded-full bg-verde text-white transition-[background-color,opacity,transform] duration-150 hover:bg-verde-2 active:scale-95 disabled:opacity-40"
              >
                <SendHorizontal className="size-[18px]" aria-hidden />
              </button>
            </form>
          </>
        ) : (
          <div className="flex items-center gap-3 rounded-xl bg-superficie-2 px-3.5 py-2.5">
            <p className="min-w-0 flex-1 text-[13px] text-texto-2">{aviso ?? "Entre na sala para conversar."}</p>
            {onEntrar && (
              <Button tamanho="sm" onClick={onEntrar}>
                <LogIn />
                Entrar
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function CabecalhoChat({ online }: { online?: number }) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-borda px-4 py-3">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-tinta">Chat da sala</h2>
        <p className="flex items-center gap-1 text-[12px] text-texto-2" title="Mensagens ofensivas são retidas para revisão">
          <ShieldCheck className="size-3.5" aria-hidden />
          Moderado automaticamente
        </p>
      </div>
      {online !== undefined && (
        <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] tabular-nums text-texto-2">
          <span className="size-1.5 rounded-full bg-verde" aria-hidden />
          {online} online
        </span>
      )}
    </header>
  );
}

/** Chat de sala privada ainda não liberada. */
export function ChatBloqueado() {
  return (
    <section aria-label="Chat da sala" className={CAIXA}>
      <CabecalhoChat />
      <div className="grid flex-1 place-items-center px-8 text-center">
        <div>
          <span className="mx-auto grid size-10 place-items-center rounded-full bg-superficie-2 text-texto-2">
            <Lock className="size-5" aria-hidden />
          </span>
          <p className="mt-3 text-[14px] font-medium text-tinta">Conversa só para convidados</p>
          <p className="mt-1 text-[13px] text-texto-2">Digite o código de convite para participar.</p>
        </div>
      </div>
    </section>
  );
}

function ItemMensagem({ m, meu, nome, autor, agrupada }: { m: MensagemSala; meu: boolean; nome: string; autor?: Pessoa; agrupada: boolean }) {
  const hora = horaCurta(m.criadoEm);

  if (m.tipo === "sistema") {
    return (
      <p className="px-4 text-center text-[12px] text-texto-2">
        {m.texto} <span className="tabular-nums text-texto-2/70">· {hora}</span>
      </p>
    );
  }

  if (m.tipo === "reacao") {
    return (
      <div className={cn("flex items-center gap-2", meu ? "justify-end" : "pl-10")}>
        <span className="text-[22px] leading-none" role="img" aria-label={`Reação de ${meu ? "você" : nome}`}>
          {m.texto}
        </span>
        <span className="text-[12px] text-texto-2">
          {meu ? "Você" : primeiroNome(nome)} · <span className="tabular-nums">{hora}</span>
        </span>
      </div>
    );
  }

  const oficial = autor?.papel === "professor" || autor?.papel === "escola";
  return (
    <div className={cn("flex items-end gap-2", meu && "justify-end")}>
      {!meu && (agrupada ? <span className="w-8 shrink-0" aria-hidden /> : <LinkPessoa id={m.autorId} rotulo={`Perfil de ${nome}`} className="flex rounded-full"><Avatar nome={nome} iniciais={autor?.iniciais} tamanho="sm" /></LinkPessoa>)}
      <div className={cn("flex min-w-0 max-w-[80%] flex-col", meu ? "items-end" : "items-start")}>
        {!meu && !agrupada && (
          <p className="mb-1 ml-3 flex items-center gap-1.5 text-[12px] text-texto-2">
            <LinkPessoa id={m.autorId} className="truncate font-medium text-tinta hover:underline">{oficial ? nome : primeiroNome(nome)}</LinkPessoa>
            {oficial && <Badge tom="neutro">{autor?.papel === "escola" ? "Escola" : "Professor"}</Badge>}
          </p>
        )}
        <div
          className={cn(
            "rounded-[18px] px-3.5 py-2 text-[14px] leading-snug [overflow-wrap:anywhere]",
            meu ? "bg-verde text-white" : "bg-superficie-2 text-texto ring-1 ring-inset ring-borda",
            // Cantos "colados" dentro do grupo, como nos mensageiros.
            agrupada && (meu ? "rounded-tr-md" : "rounded-tl-md"),
          )}
        >
          {m.texto}
          <span className={cn("ml-2 inline-block translate-y-px text-[11px] tabular-nums", meu ? "text-white/75" : "text-texto-2")}>{hora}</span>
        </div>
      </div>
    </div>
  );
}
