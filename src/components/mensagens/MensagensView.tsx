"use client";

import { MessageCircleOff, Search, ShieldCheck, SquarePen } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Nota, TituloPagina, Vazio } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { useAgora } from "@/hooks/useAgora";
import { cn } from "@/lib/cn";
import { tituloDaConversa, ultimaMensagem } from "@/lib/conversas";
import { normalizar, primeiroNome } from "@/lib/format";
import { tempoRelativo } from "@/lib/tempo";
import { useEstado } from "@/store/store";
import { useUI } from "@/store/ui";
import { AvatarConversa } from "./AvatarConversa";
import { NovaConversaSheet } from "./NovaConversaSheet";

/** Lista de conversas (mensagens diretas e grupos). */
export function MensagensView() {
  const { conversas, pessoas, usuario } = useEstado();
  const { digitando } = useUI();
  const agora = useAgora(30_000);
  const [busca, setBusca] = useState("");
  const [nova, setNova] = useState(false);

  const lista = useMemo(() => {
    const termo = normalizar(busca.trim());
    return [...conversas]
      .filter((c) => {
        if (!termo) return true;
        const titulo = normalizar(tituloDaConversa(c, pessoas, usuario.id));
        return titulo.includes(termo) || c.mensagens.some((m) => normalizar(m.texto).includes(termo));
      })
      .sort((a, b) => (ultimaMensagem(b)?.criadoEm ?? 0) - (ultimaMensagem(a)?.criadoEm ?? 0));
  }, [conversas, pessoas, usuario.id, busca]);

  return (
    <div className="space-y-4">
      <TituloPagina
        titulo="Mensagens"
        descricao="Converse com colegas e professores do CEPI"
        acao={
          <Button tamanho="sm" onClick={() => setNova(true)}>
            <SquarePen /> Nova
          </Button>
        }
      />

      <label className="flex h-11 items-center gap-2 rounded-2xl border border-borda bg-white px-3 shadow-card focus-within:border-verde-2">
        <Search className="size-4 shrink-0 text-texto-2" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar conversas ou mensagens…"
          aria-label="Buscar conversas"
          className="min-w-0 flex-1 bg-transparent text-sm text-texto outline-none placeholder:text-texto-2/70"
        />
      </label>

      {lista.length === 0 ? (
        <Vazio icone={<MessageCircleOff />} titulo="Nenhuma conversa encontrada" descricao="Tente outro nome ou comece uma nova mensagem." />
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-borda bg-white shadow-card">
          <AnimatePresence initial={false}>
            {lista.map((c) => {
              const ultima = ultimaMensagem(c);
              const quemDigita = digitando[c.id];
              const minha = ultima?.autorId === usuario.id;
              const autorUltima = ultima ? pessoas[ultima.autorId] : undefined;
              const preview = !ultima
                ? "Comece a conversa"
                : ultima.retida
                  ? "Mensagem retida para revisão"
                  : `${minha ? "Você: " : c.titulo && autorUltima ? `${primeiroNome(autorUltima.nome)}: ` : ""}${ultima.texto}`;
              return (
                <motion.li key={c.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-borda last:border-b-0">
                  <Link
                    href={`/mensagens/${c.id}`}
                    className="flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-verde-mclaro active:bg-verde-claro"
                  >
                    <AvatarConversa conversa={c} pessoas={pessoas} usuarioId={usuario.id} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className={cn("truncate text-[14px] text-tinta", c.naoLidas ? "font-extrabold" : "font-semibold")}>
                          {tituloDaConversa(c, pessoas, usuario.id)}
                        </p>
                        {ultima && (
                          <span className={cn("shrink-0 text-[11px]", c.naoLidas ? "font-bold text-verde" : "text-texto-2")}>
                            {tempoRelativo(ultima.criadoEm, agora)}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        {quemDigita ? (
                          <p className="truncate text-[13px] font-semibold text-verde-2">
                            {c.titulo ? `${primeiroNome(pessoas[quemDigita]?.nome ?? "")} está digitando…` : "digitando…"}
                          </p>
                        ) : (
                          <p className={cn("truncate text-[13px]", c.naoLidas ? "font-semibold text-texto" : "text-texto-2", ultima?.retida && "text-ambar")}>
                            {preview}
                          </p>
                        )}
                        {c.naoLidas > 0 && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="grid min-w-5 shrink-0 place-items-center rounded-full bg-verde px-1.5 text-[11px] font-bold leading-5 text-white"
                          >
                            {c.naoLidas}
                          </motion.span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <Nota icone={<ShieldCheck />} tom="branco">
        Mensagens diretas ficam entre alunos e professores do CEPI. A triagem automática sinaliza conteúdo ofensivo para{" "}
        <b className="text-tinta">revisão humana</b> — nada é punido automaticamente.
      </Nota>

      <NovaConversaSheet aberto={nova} onFechar={() => setNova(false)} />
    </div>
  );
}
