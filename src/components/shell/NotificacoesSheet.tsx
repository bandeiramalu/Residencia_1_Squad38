"use client";

import { Award, BellOff, BookOpenCheck, CheckCheck, ClipboardCheck, ClipboardList, Coins, Info, ShieldAlert, Swords, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Vazio } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { LinkPessoa } from "@/components/ui/LinkPessoa";
import { Sheet } from "@/components/ui/Sheet";
import { useAgora } from "@/hooks/useAgora";
import { useSessao } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { tempoRelativo } from "@/lib/tempo";
import { lerNotificacao, lerTodasNotificacoes } from "@/store/actions";
import { useSeletor } from "@/store/store";
import type { Notificacao, TipoNotificacao } from "@/store/types";

const ICONE: Record<TipoNotificacao, { icone: typeof Info; cor: string }> = {
  pontos: { icone: Coins, cor: "text-ambar" },
  atividade: { icone: ClipboardList, cor: "text-texto-2" },
  correcao: { icone: ClipboardCheck, cor: "text-acento" },
  entrega: { icone: BookOpenCheck, cor: "text-texto-2" },
  campeonato: { icone: Swords, cor: "text-texto-2" },
  sala: { icone: Users, cor: "text-texto-2" },
  moderacao: { icone: ShieldAlert, cor: "text-alerta" },
  sistema: { icone: Award, cor: "text-texto-2" },
};

/** Para onde levar quando a notificação não traz destino próprio. */
const DESTINO_PADRAO: Partial<Record<TipoNotificacao, string>> = {
  pontos: "/loja",
  atividade: "/missoes#atividades",
  correcao: "/missoes#atividades",
  campeonato: "/campeonatos",
  sala: "/estudos/salas",
  sistema: "/perfil",
};

/** Central de notificações de quem está logado (aluno ou professor). */
export function NotificacoesSheet({ aberto, onFechar, notificacoes: todas }: { aberto: boolean; onFechar: () => void; notificacoes: Notificacao[] }) {
  const router = useRouter();
  const pessoas = useSeletor((e) => e.pessoas);
  const usuarioEu = useSeletor((e) => e.usuario);
  const notificacoes = todas;
  const professor = useSessao()?.papel === "professor";
  const agora = useAgora(30_000);
  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  const abrir = (n: Notificacao) => {
    lerNotificacao(n.id);
    onFechar();
    const destino = n.href ?? DESTINO_PADRAO[n.tipo];
    if (n.tipo === "sistema" && n.titulo.startsWith("Lembrete:")) window.dispatchEvent(new Event("cepi:abrir-calendario"));
    else if (destino) router.push(destino);
  };

  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo="Notificações" subtitulo={naoLidas ? `${naoLidas} não ${naoLidas === 1 ? "lida" : "lidas"}` : "Tudo em dia"}>
      {notificacoes.length === 0 ? (
        <Vazio
          icone={<BellOff />}
          titulo="Nenhuma notificação por enquanto"
          descricao={
            professor
              ? "Aqui aparecem entregas dos alunos, dúvidas das turmas e publicações para revisar."
              : "Aqui aparecem correções, avisos dos professores, lembretes e convites para salas e campeonatos."
          }
        />
      ) : (
        <>
          {naoLidas > 0 && (
            <div className="-mt-1 mb-2 flex justify-end">
              <Button variante="fantasma" tamanho="sm" onClick={() => lerTodasNotificacoes()}>
                <CheckCheck /> Marcar todas como lidas
              </Button>
            </div>
          )}
          <ul className="-mx-2 space-y-0.5">
            {notificacoes.map((n) => {
              const { icone: Icone, cor } = ICONE[n.tipo];
              return (
                <li key={n.id} className={cn("flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-superficie-2 active:bg-superficie-2", n.lida ? "" : "bg-verde-mclaro/60")}>
                  {n.deId && pessoas[n.deId] ? (
                    <span onClickCapture={onFechar} className="shrink-0">
                      <LinkPessoa id={n.deId} rotulo={pessoas[n.deId].nome}>
                        <Avatar nome={pessoas[n.deId].nome} iniciais={pessoas[n.deId].iniciais} foto={n.deId === usuarioEu.id ? usuarioEu.foto : undefined} tamanho="md" />
                      </LinkPessoa>
                    </span>
                  ) : (
                    <span className={cn("grid size-10 shrink-0 place-items-center rounded-full bg-superficie-2", cor)}>
                      <Icone className="size-[18px]" />
                    </span>
                  )}
                  <button type="button" onClick={() => abrir(n)} className="min-w-0 flex-1 text-left">
                    <span className="flex items-start justify-between gap-2">
                      <span className={cn("text-[13.5px] leading-snug text-tinta", n.lida ? "font-normal" : "font-medium")}>{n.titulo}</span>
                      <span className="shrink-0 pt-0.5 text-[10.5px] text-texto-2">{tempoRelativo(n.criadoEm, agora)}</span>
                    </span>
                    {n.texto && <span className="mt-0.5 line-clamp-2 block text-[12.5px] leading-snug text-texto-2">{n.texto}</span>}
                  </button>
                  {!n.lida && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-verde" aria-label="não lida" />}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Sheet>
  );
}
