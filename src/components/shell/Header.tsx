"use client";

import { Bell, CalendarDays, Check, ChevronDown, Coins, LogOut, Presentation, Repeat2, Sparkles, UserRound } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLembretes } from "@/components/calendario/useLembretes";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Avatar } from "@/components/ui/Avatar";
import { EVENTOS } from "@/data/calendario";
import { ESCOLA, ESPACOS } from "@/data/escola";
import { PROFESSOR } from "@/data/professor";
import { useFecharFora } from "@/hooks/useFecharFora";
import { useModoApresentacao } from "@/lib/apresentacao";
import { entrarComoDemo, type PapelSessao } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { selecionarEspaco } from "@/store/actions";
import { useEstado } from "@/store/store";
import { useSair } from "./SairSheet";
import { TemaSegmentado } from "./TemaToggle";

// Modais só são baixados quando abertos pela primeira vez: o cabeçalho carrega mais leve.
const CalendarioSheet = dynamic(() => import("@/components/calendario/CalendarioSheet").then((m) => m.CalendarioSheet));
const CarteiraSheet = dynamic(() => import("./CarteiraSheet").then((m) => m.CarteiraSheet));
const NotificacoesSheet = dynamic(() => import("./NotificacoesSheet").then((m) => m.NotificacoesSheet));
const RoteiroSheet = dynamic(() => import("./RoteiroSheet").then((m) => m.RoteiroSheet));

/** No celular os botões de ícone medem 44 × 44 px (DS §16); o selo acompanha o canto do ícone. */
const BOTAO_ICONE =
  "relative grid size-9 place-items-center rounded-full text-texto-2 transition-colors hover:bg-superficie-2 hover:text-tinta active:scale-95 toque:size-11";

/** Selo de contagem: acima de 99 mostra "99+" (cabe no botão). */
function Contador({ valor, tom = "verde" }: { valor: number; tom?: "verde" | "alerta" }) {
  const texto = valor > 99 ? "99+" : String(valor);
  return (
    <AnimatePresence>
      {valor > 0 && (
        <motion.span
          key={texto}
          initial={{ scale: 0.4 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ type: "spring", stiffness: 600, damping: 18 }}
          className={cn(
            "absolute right-0.5 top-0.5 grid min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold leading-4 text-white ring-2 ring-superficie toque:right-1.5 toque:top-1.5",
            tom === "alerta" ? "bg-alerta dark:text-fundo" : "bg-texto-2 dark:text-fundo",
          )}
          aria-hidden
        >
          {texto}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

/** Cabeçalho fixo: identificação, seletor de espaço (aluno), calendário, notificações e saldo. */
export function Header({ papel, usuarioId }: { papel: PapelSessao; usuarioId: string }) {
  const { usuario, espaco, notificacoes } = useEstado();
  const [aberto, setAberto] = useState<"calendario" | "carteira" | "notificacoes" | "roteiro" | null>(null);
  const minhas = notificacoes.filter((n) => n.para === usuarioId);
  const naoLidasNotif = minhas.filter((n) => !n.lida).length;
  const eventosDaSemana = EVENTOS.filter((e) => e.emDias <= 7).length;
  const fechar = () => setAberto(null);
  const apresentacao = useModoApresentacao();

  // O motor dos lembretes roda só na tela da aluna.
  useLembretes(papel === "aluno");
  // Notificações de lembrete abrem o calendário.
  useEffect(() => {
    const abrir = () => setAberto("calendario");
    window.addEventListener("cepi:abrir-calendario", abrir);
    return () => window.removeEventListener("cepi:abrir-calendario", abrir);
  }, []);

  return (
    <header className="vidro border-b border-borda">
      <div className="coluna flex h-14 items-center gap-2 px-4 sm:px-6 lg:px-8">
        <Image
          src="/cepi-logo.png"
          alt={ESCOLA.nome}
          width={36}
          height={36}
          className="size-8 shrink-0 rounded-lg bg-white object-contain ring-1 ring-borda lg:hidden"
          priority
        />

        {papel === "aluno" ? (
          <SeletorEspaco espaco={espaco} />
        ) : (
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold leading-tight text-tinta">Painel do professor</p>
            <p className="truncate text-xs text-texto-2">
              {PROFESSOR.disciplina} · 9º A, 9º B e 8º A
            </p>
          </div>
        )}

        <div className="flex shrink-0 items-center">
          {papel === "aluno" && (
            <button type="button" onClick={() => setAberto("calendario")} aria-label={`Calendário: ${eventosDaSemana} ${eventosDaSemana === 1 ? "compromisso" : "compromissos"} nos próximos 7 dias`} className={BOTAO_ICONE}>
              <CalendarDays className="size-5" />
              <Contador valor={eventosDaSemana} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setAberto("notificacoes")}
            aria-label={naoLidasNotif ? `Notificações: ${naoLidasNotif} não lidas` : "Notificações"}
            className={BOTAO_ICONE}
          >
            <Bell className="size-5" />
            <Contador valor={naoLidasNotif} tom="alerta" />
          </button>
        </div>

        {papel === "aluno" && (
          // Abaixo de 480 px não há largura para o avatar com alvo de 44 px; o Perfil continua na barra inferior.
          <Link
            href="/perfil"
            aria-label="Seu perfil"
            className="alvo-toque ml-1 shrink-0 rounded-full active:scale-95 max-[479px]:hidden lg:hidden"
          >
            <Avatar nome={usuario.nome} foto={usuario.foto} tamanho="sm" equipados={usuario.equipados} />
          </Link>
        )}

        {papel === "aluno" ? (
          <button
            type="button"
            onClick={() => setAberto("carteira")}
            aria-label="Ver saldo de pontos e XP"
            className="alvo-toque ml-1 flex h-8 shrink-0 items-center rounded-full border border-borda bg-superficie pl-2 pr-2.5 text-[12.5px] font-medium tabular-nums text-tinta transition-colors hover:bg-superficie-2 active:scale-95"
          >
            <Coins className="mr-1 size-3.5 text-ambar" />
            <AnimatedNumber valor={usuario.pontos} />
            {/* Em telas muito estreitas o XP fica só na Carteira e no Perfil. */}
            <span className="flex items-center max-[399px]:hidden">
              <span className="mx-1.5 h-3 w-px bg-borda" />
              <Sparkles className="mr-1 size-3.5 text-acento" />
              <AnimatedNumber valor={usuario.xp} />
            </span>
          </button>
        ) : (
          <MenuProfessor usuarioId={usuarioId} apresentacao={apresentacao} onRoteiro={() => setAberto("roteiro")} />
        )}
      </div>

      {papel === "aluno" && <CalendarioSheet aberto={aberto === "calendario"} onFechar={fechar} />}
      {papel === "aluno" && <CarteiraSheet aberto={aberto === "carteira"} onFechar={fechar} />}
      <NotificacoesSheet aberto={aberto === "notificacoes"} onFechar={fechar} notificacoes={minhas} />
      {apresentacao && <RoteiroSheet aberto={aberto === "roteiro"} onFechar={fechar} />}
    </header>
  );
}

function SeletorEspaco({ espaco }: { espaco: string }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const espacoAtual = ESPACOS.find((e) => e.id === espaco) ?? ESPACOS[0];
  const fecharMenu = useCallback(() => setMenuAberto(false), []);
  useFecharFora(menu, menuAberto, fecharMenu);

  return (
    <div ref={menu} className="relative min-w-0 flex-1">
      <p className="truncate whitespace-nowrap text-[15px] font-semibold leading-tight text-tinta lg:hidden">Portal do Aluno</p>
      <button
        type="button"
        onClick={() => setMenuAberto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={menuAberto}
        className="group alvo-toque flex max-w-full items-center gap-1 rounded-md text-left text-xs text-texto-2 transition-colors hover:text-tinta lg:h-8 lg:rounded-lg lg:px-2.5 lg:text-[13.5px] lg:font-medium lg:text-tinta lg:hover:bg-superficie-2 toque:py-1"
      >
        <span className="truncate">
          {espacoAtual.nome}
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
            className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border border-borda bg-superficie p-1.5 shadow-flutuante"
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
                    className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors", ativo ? "bg-superficie-2" : "hover:bg-superficie-2")}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-tinta">{e.nome}</span>
                      <span className="block text-xs text-texto-2">{e.descricao}</span>
                    </span>
                    {ativo && <Check className="size-4 text-acento" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Avatar do professor com menu: aparência, roteiro, trocar de papel e sair. */
function MenuProfessor({ usuarioId, apresentacao, onRoteiro }: { usuarioId: string; apresentacao: boolean; onRoteiro: () => void }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const fecharMenu = useCallback(() => setAberto(false), []);
  useFecharFora(ref, aberto, fecharMenu);
  const { pedir: pedirSaida, dialogo: dialogoSaida } = useSair();

  return (
    <div ref={ref} className="relative ml-1 shrink-0">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-label="Menu da conta"
        className="alvo-toque rounded-full active:scale-95"
      >
        <Avatar nome={PROFESSOR.nome} iniciais="R" tamanho="sm" />
      </button>
      <AnimatePresence>
        {aberto && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 520, damping: 34 }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-borda bg-superficie p-1.5 shadow-flutuante"
          >
            <div className="px-2 pb-2 pt-1">
              <p className="text-sm font-medium text-tinta">{PROFESSOR.nome}</p>
              <p className="text-xs text-texto-2">{PROFESSOR.email}</p>
            </div>
            <TemaSegmentado grupo="tema-menu" className="mb-1.5" />
            {[
              { icone: UserRound, texto: "Meu perfil", acao: () => router.push(`/pessoas/${usuarioId}`) },
              ...(apresentacao
                ? [
                    { icone: Presentation, texto: "Roteiro guiado", acao: onRoteiro },
                    { icone: Repeat2, texto: "Ver como aluna (Ana)", acao: () => router.push(entrarComoDemo("aluno")) },
                  ]
                : []),
              { icone: LogOut, texto: "Sair", acao: pedirSaida },
            ].map(({ icone: Icone, texto, acao }) => (
              <button
                key={texto}
                type="button"
                role="menuitem"
                onClick={() => {
                  setAberto(false);
                  acao();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] text-texto transition-colors hover:bg-superficie-2 hover:text-tinta toque:py-3"
              >
                <Icone className="size-4 text-texto-2" /> {texto}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      {dialogoSaida}
    </div>
  );
}
