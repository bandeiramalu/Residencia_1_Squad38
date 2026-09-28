"use client";

import { CalendarDays, Check, ChevronDown, Coins, MessageCircle, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { CalendarioSheet } from "@/components/calendario/CalendarioSheet";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { EVENTOS } from "@/data/calendario";
import { ESCOLA, ESPACOS } from "@/data/escola";
import { useFecharFora } from "@/hooks/useFecharFora";
import { cn } from "@/lib/cn";
import { selecionarEspaco } from "@/store/actions";
import { useEstado } from "@/store/store";
import { CarteiraSheet } from "./CarteiraSheet";

/** Cabeçalho fixo: identificação, seletor de turma/espaço e saldo de pontos/XP. */
export function Header() {
  const { usuario, espaco, conversas } = useEstado();
  const pathname = usePathname();
  const naoLidas = conversas.reduce((soma, c) => soma + c.naoLidas, 0);
  const [menuAberto, setMenuAberto] = useState(false);
  const [calendario, setCalendario] = useState(false);
  const [carteira, setCarteira] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const espacoAtual = ESPACOS.find((e) => e.id === espaco) ?? ESPACOS[0];
  const eventosDaSemana = EVENTOS.filter((e) => e.emDias <= 7).length;

  const fecharMenu = useCallback(() => setMenuAberto(false), []);
  useFecharFora(menu, menuAberto, fecharMenu);

  return (
    <header className="sticky top-0 z-40 border-b border-borda bg-white/90 backdrop-blur-md">
      <div className="flex h-16 items-center gap-2 px-4">
        <Image
          src="/cepi-logo.png"
          alt={ESCOLA.nome}
          width={36}
          height={36}
          className="size-9 shrink-0 rounded-xl bg-white object-contain p-0.5 ring-1 ring-borda"
          priority
        />

        <div ref={menu} className="relative min-w-0 flex-1">
          <p className="truncate whitespace-nowrap text-[15px] font-extrabold leading-tight text-tinta">Portal do Aluno</p>
          <button
            type="button"
            onClick={() => setMenuAberto((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={menuAberto}
            className="group flex max-w-full items-center gap-1 rounded-md text-left text-xs text-texto-2 transition-colors hover:text-verde"
          >
            <span className="truncate">
              <span className="font-semibold text-cepi">CEPI</span> · {espacoAtual.nome}
            </span>
            <ChevronDown className={cn("size-3.5 shrink-0 transition-transform duration-200", menuAberto && "rotate-180")} />
          </button>

          <AnimatePresence>
            {menuAberto && (
              <motion.ul
                role="listbox"
                aria-label="Turma ou espaço ativo"
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 520, damping: 34 }}
                style={{ transformOrigin: "top left" }}
                className="absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl border border-borda bg-white p-1.5 shadow-flutuante"
              >
                {ESPACOS.map((e) => {
                  const ativo = e.id === espaco;
                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={ativo}
                        onClick={() => {
                          selecionarEspaco(e.id);
                          setMenuAberto(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                          ativo ? "bg-verde-claro" : "hover:bg-verde-mclaro",
                        )}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-tinta">{e.nome}</span>
                          <span className="block text-xs text-texto-2">{e.descricao}</span>
                        </span>
                        {ativo && <Check className="size-4 text-verde" />}
                      </button>
                    </li>
                  );
                })}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={() => setCalendario(true)}
            aria-label={`Calendário: ${eventosDaSemana} compromissos nos próximos 7 dias`}
            className="relative grid size-9 place-items-center rounded-full text-texto transition-colors hover:bg-verde-mclaro hover:text-verde active:scale-90"
          >
            <CalendarDays className="size-5" />
            <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-verde px-1 text-[10px] font-bold leading-4 text-white ring-2 ring-white">
              {eventosDaSemana}
            </span>
          </button>

          <Link
            href="/mensagens"
            aria-label={naoLidas ? `Mensagens: ${naoLidas} não lidas` : "Mensagens"}
            aria-current={pathname === "/mensagens" ? "page" : undefined}
            className={cn(
              "relative grid size-9 place-items-center rounded-full transition-colors hover:bg-verde-mclaro hover:text-verde active:scale-90",
              pathname === "/mensagens" ? "bg-verde-claro text-verde" : "text-texto",
            )}
          >
            <MessageCircle className="size-5" />
            <AnimatePresence>
              {naoLidas > 0 && (
                <motion.span
                  key={naoLidas}
                  initial={{ scale: 0.4 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 600, damping: 18 }}
                  className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-alerta px-1 text-[10px] font-bold leading-4 text-white ring-2 ring-white"
                >
                  {naoLidas}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setCarteira(true)}
          aria-label="Ver saldo de pontos e XP"
          className="flex shrink-0 items-center rounded-full border border-borda bg-verde-mclaro py-1.5 pl-2 pr-2.5 text-xs font-bold tabular-nums text-tinta transition-colors hover:border-verde-suave active:scale-95"
        >
          <Coins className="mr-1 size-3.5 text-verde" />
          <AnimatedNumber valor={usuario.pontos} />
          {/* Em telas muito estreitas o XP fica só na Carteira e no Perfil. */}
          <span className="flex items-center max-[399px]:hidden">
            <span className="mx-1.5 h-3 w-px bg-verde-suave" />
            <Sparkles className="mr-0.5 size-3.5 text-verde-2" />
            <AnimatedNumber valor={usuario.xp} />
          </span>
        </button>
      </div>

      <CalendarioSheet aberto={calendario} onFechar={() => setCalendario(false)} />
      <CarteiraSheet aberto={carteira} onFechar={() => setCarteira(false)} />
    </header>
  );
}
