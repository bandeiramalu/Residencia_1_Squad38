"use client";

import { LogOut, MoreHorizontal, Presentation, Repeat2, UserRound } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { ESCOLA } from "@/data/escola";
import { useFecharFora } from "@/hooks/useFecharFora";
import { useModoApresentacao } from "@/lib/apresentacao";
import { entrarComoDemo, sair, type PapelSessao, type Sessao } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { useSeletor } from "@/store/store";
import { itemAtivo, NAV_LATERAL } from "./abas";
import { TemaSegmentado } from "./TemaToggle";

const RoteiroSheet = dynamic(() => import("./RoteiroSheet").then((m) => m.RoteiroSheet));

/** Barra lateral do desktop (≥ 1024 px): marca, navegação e conta — no padrão de rede social. */
export function Sidebar({ papel, sessao }: { papel: PapelSessao; sessao: Sessao | null }) {
  const caminho = usePathname();
  const [roteiro, setRoteiro] = useState(false);
  const apresentacao = useModoApresentacao();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-(--sidebar) flex-col border-r border-borda bg-superficie lg:flex">
      <Link href={papel === "professor" ? "/professor" : "/feed"} className="flex items-center gap-2.5 px-5 pb-4 pt-5">
        <Image src="/cepi-logo.png" alt={ESCOLA.nome} width={32} height={32} className="size-8 rounded-lg bg-white object-contain ring-1 ring-borda" priority />
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[14px] font-semibold text-tinta">{papel === "professor" ? "Portal do Professor" : "Portal do Aluno"}</span>
          <span className="block truncate text-[12px] text-texto-2">{ESCOLA.curto}</span>
        </span>
      </Link>

      <nav aria-label="Navegação principal" className="sem-scrollbar flex-1 overflow-y-auto px-3 py-1">
        {NAV_LATERAL[papel].map((grupo, g) => (
          <ul key={grupo.titulo} className={cn("space-y-0.5", g > 0 && "mt-2 border-t border-borda pt-2")}>
            {grupo.itens.map((item) => {
              const ativo = itemAtivo(item, caminho);
              const Icone = item.icone;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={ativo ? "page" : undefined}
                    className={cn(
                      "relative flex h-10 items-center gap-3 rounded-lg px-3 text-[14px] transition-colors duration-150",
                      ativo ? "font-semibold text-tinta" : "text-texto hover:bg-superficie-2 hover:text-tinta",
                    )}
                  >
                    {ativo && (
                      <motion.span layoutId="lateral-ativa" className="absolute inset-0 rounded-lg bg-superficie-2" transition={{ type: "spring", stiffness: 600, damping: 45 }} />
                    )}
                    <Icone className="relative size-[19px]" strokeWidth={ativo ? 2.25 : 1.75} />
                    <span className="relative flex-1 truncate">{item.rotulo}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ))}
      </nav>

      {sessao && <Conta papel={papel} sessao={sessao} apresentacao={apresentacao} onRoteiro={() => setRoteiro(true)} />}
      {apresentacao && <RoteiroSheet aberto={roteiro} onFechar={() => setRoteiro(false)} />}
    </aside>
  );
}

/** Linha da conta no rodapé da barra lateral, com menu (aparência, roteiro, trocar de perfil, sair). */
function Conta({ papel, sessao, apresentacao, onRoteiro }: { papel: PapelSessao; sessao: Sessao; apresentacao: boolean; onRoteiro: () => void }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const equipados = useSeletor((e) => e.usuario.equipados);
  const nomeAluna = useSeletor((e) => e.usuario.nome);
  const foto = useSeletor((e) => e.usuario.foto);
  const nome = papel === "aluno" ? nomeAluna : sessao.nome;
  const fecharMenu = useCallback(() => setAberto(false), []);
  useFecharFora(ref, aberto, fecharMenu);
  const outro: PapelSessao = papel === "professor" ? "aluno" : "professor";

  const itens = [
    { icone: UserRound, texto: "Meu perfil", acao: () => router.push(papel === "aluno" ? "/perfil" : `/pessoas/${sessao.usuarioId}`) },
    ...(apresentacao
      ? [
          { icone: Presentation, texto: "Roteiro guiado", acao: onRoteiro },
          { icone: Repeat2, texto: outro === "professor" ? "Ver como professor" : "Ver como aluna", acao: () => router.push(entrarComoDemo(outro)) },
        ]
      : []),
    {
      icone: LogOut,
      texto: "Sair",
      acao: () => {
        sair();
        router.push("/login");
      },
    },
  ];

  return (
    <div ref={ref} className="relative border-t border-borda p-3">
      <AnimatePresence>
        {aberto && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-x-3 bottom-full mb-2 rounded-xl border border-borda bg-superficie p-1.5 shadow-flutuante"
          >
            <div className="px-2 pb-2 pt-1.5">
              <p className="mb-1.5 text-[12px] text-texto-2">Aparência</p>
              <TemaSegmentado grupo="tema-lateral" />
            </div>
            <div className="border-t border-borda pt-1">
              {itens.map(({ icone: Icone, texto, acao }) => (
                <button
                  key={texto}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAberto(false);
                    acao();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] text-texto transition-colors hover:bg-superficie-2 hover:text-tinta"
                >
                  <Icone className="size-4 text-texto-2" /> {texto}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={aberto}
        className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors hover:bg-superficie-2"
      >
        <Avatar nome={nome} foto={papel === "aluno" ? foto : undefined} tamanho="sm" equipados={papel === "aluno" ? equipados : []} />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[13px] font-medium text-tinta">{nome}</span>
          <span className="block truncate text-[12px] text-texto-2">{papel === "professor" ? "Professor" : "9º Ano A"}</span>
        </span>
        <MoreHorizontal className="size-4 text-texto-2" />
      </button>
    </div>
  );
}
