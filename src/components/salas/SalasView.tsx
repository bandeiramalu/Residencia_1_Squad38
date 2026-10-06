"use client";

import { ArrowRight, KeyRound, LogOut, Pause, Play, Plus, Users } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Anel } from "@/components/ui/Anel";
import { Badge } from "@/components/ui/Badge";
import { TituloPagina, TituloSecao, Vazio } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { Entrada } from "@/components/ui/Campo";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { type Disciplina } from "@/data/escola";
import { useAgora } from "@/hooks/useAgora";
import { useSessao } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { formatarRelogio, lerTimer } from "@/lib/estudos";
import { fmt } from "@/lib/format";
import { buscarSalaPorCodigo, pausarFoco, retomarFoco, sairSala } from "@/store/actions";
import { useSeletor } from "@/store/store";
import type { SalaEstudo } from "@/store/types";
import { agendadaFechada, BotaoLembrar, COR_FOCO, COR_PAUSA, COR_PAUSADO, faltaParaAbrir, IconeSala, liberarSala, quandoAbre, TRILHO } from "./comum";
import { ConfirmarEncerrarSheet } from "./Dialogos";
import { SalaCard } from "./SalaCard";

/** O formulário de criação só é baixado quando a página já está na tela. */
const CriarSalaSheet = dynamic(() => import("./CriarSalaSheet").then((m) => m.CriarSalaSheet), { ssr: false });

type Filtro = "todas" | "aovivo" | "oficiais" | "minhas" | `d:${Disciplina}`;

const MOLA = { type: "spring", stiffness: 520, damping: 44 } as const;
const ENTRADA = { duration: 0.18, ease: [0.2, 0, 0, 1] } as const;

export function SalasView() {
  const salas = useSeletor((e) => e.salas);
  const pessoas = useSeletor((e) => e.pessoas);
  const salaAtual = useSeletor((e) => e.salaAtual);
  const usuario = useSeletor((e) => e.usuario);
  const sessao = useSessao();
  const router = useRouter();
  const agora = useAgora(60_000);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [criando, setCriando] = useState(false);
  const [encerrando, setEncerrando] = useState<SalaEstudo | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [codigo, setCodigo] = useState("");

  const professor = sessao?.papel === "professor";
  const usuarioId = sessao?.usuarioId ?? usuario.id;

  // Aluno vê as salas abertas à escola e as da própria turma; o professor acompanha todas.
  const visiveis = salas.filter((s) => professor || !s.turma || s.turma === usuario.turma || s.id === salaAtual || s.criadorId === usuarioId);
  const abertas = visiveis.filter((s) => !agendadaFechada(s, agora));
  const agendadas = visiveis.filter((s) => agendadaFechada(s, agora)).sort((a, b) => a.agendadaPara! - b.agendadaPara!);

  const minha = (s: SalaEstudo) => s.criadorId === usuarioId || (!professor && s.id === salaAtual);
  const aoVivo = (s: SalaEstudo) => s.membros.length > 0 || (!professor && s.id === salaAtual);
  const passa = (s: SalaEstudo, f: Filtro) => {
    if (f === "aovivo") return aoVivo(s);
    if (f === "oficiais") return s.oficial;
    if (f === "minhas") return minha(s);
    if (f.startsWith("d:")) return s.disciplina === f.slice(2);
    return true;
  };

  const disciplinas = [...new Set(visiveis.map((s) => s.disciplina).filter((d): d is Disciplina => !!d))];
  const filtros: { id: Filtro; rotulo: string }[] = [
    { id: "todas", rotulo: "Todas" },
    { id: "aovivo", rotulo: "Ao vivo" },
    { id: "oficiais", rotulo: "Oficiais" },
    ...disciplinas.map((d) => ({ id: `d:${d}` as Filtro, rotulo: d })),
    { id: "minhas", rotulo: "Minhas" },
  ];

  // Se o filtro de disciplina sumiu (a sala fechou), volta para "Todas".
  const filtroAtivo = filtros.some((f) => f.id === filtro) ? filtro : "todas";

  // Primeiro a sala "da pessoa" (onde a aluna está / as que o professor abriu); depois as mais cheias.
  const prioridade = (s: SalaEstudo) => (professor ? s.criadorId === usuarioId : s.id === salaAtual);
  const lista = abertas
    .filter((s) => passa(s, filtroAtivo))
    .sort((a, b) => Number(prioridade(b)) - Number(prioridade(a)) || Number(aoVivo(b)) - Number(aoVivo(a)) || b.membros.length - a.membros.length);
  const listaAgendadas = agendadas.filter((s) => filtroAtivo !== "aovivo" && passa(s, filtroAtivo));
  const pessoasAgora = abertas.reduce((t, s) => t + s.membros.length, 0) + (salaAtual && !professor ? 1 : 0);
  const salasAoVivo = abertas.filter(aoVivo).length;
  const salaDaAluna = !professor && salaAtual ? salas.find((s) => s.id === salaAtual) : undefined;

  const entrarComCodigo = (e: FormEvent) => {
    e.preventDefault();
    if (!codigo.trim()) return;
    const id = buscarSalaPorCodigo(codigo);
    if (!id) return;
    liberarSala(id);
    setCodigo("");
    router.push(`/estudos/salas/${id}`);
  };

  const pedirEncerrar = (s: SalaEstudo) => {
    setEncerrando(s);
    setConfirmando(true);
  };

  const cardProps = (s: SalaEstudo) => ({
    sala: s,
    pessoas,
    dentro: !professor && s.id === salaAtual,
    podeEncerrar: s.criadorId === usuarioId,
    onEncerrar: pedirEncerrar,
  });

  return (
    <div className="space-y-6">
      <TituloPagina
        titulo="Salas de estudo"
        descricao={professor ? "Abra salas para as suas turmas e acompanhe quem está focando." : "Estude com colegas em ciclos de foco sincronizados."}
        acao={
          <Button onClick={() => setCriando(true)}>
            <Plus />
            {professor ? "Criar sala oficial" : "Criar sala"}
          </Button>
        }
      />

      <AnimatePresence initial={false}>
        {salaDaAluna && (
          <motion.div
            key="banner"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={ENTRADA}
            className="overflow-hidden"
          >
            <BannerSalaAtual sala={salaDaAluna} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <form onSubmit={entrarComCodigo} className="flex gap-2" aria-label="Entrar com código de convite">
            <div className="min-w-0 flex-1 sm:max-w-sm">
              <Entrada
                icone={<KeyRound />}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="Código de convite (ex.: SALA-7K2P)"
                aria-label="Código de convite da sala"
                maxLength={16}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                className="font-mono tracking-wide placeholder:font-sans placeholder:tracking-normal"
              />
            </div>
            <Button type="submit" variante="secundario" className="h-10" disabled={!codigo.trim()}>
              Entrar
            </Button>
          </form>
          <p className="flex items-center gap-2 text-[13px] text-texto-2 sm:justify-end">
            <span className="size-1.5 rounded-full bg-verde" aria-hidden />
            <span>
              <span className="font-medium tabular-nums text-tinta">{fmt(pessoasAgora)}</span> {pessoasAgora === 1 ? "pessoa" : "pessoas"} em{" "}
              <span className="font-medium tabular-nums text-tinta">{salasAoVivo}</span> {salasAoVivo === 1 ? "sala" : "salas"} agora
            </span>
          </p>
        </div>

        <ChipGroup grupo="filtro-salas" rotulo="Filtrar salas" opcoes={filtros} valor={filtroAtivo} onChange={setFiltro} />
      </div>

      <section aria-labelledby="salas-abertas">
        <TituloSecao extra={lista.length ? `${lista.length} ${lista.length === 1 ? "sala" : "salas"}` : undefined}>
          <span id="salas-abertas">Abertas agora</span>
        </TituloSecao>

        {lista.length === 0 ? (
          <Vazio
            icone={<Users />}
            titulo={filtroAtivo === "minhas" ? "Você ainda não criou salas" : listaAgendadas.length ? "Nenhuma sala aberta agora" : "Nenhuma sala com esse filtro"}
            descricao={
              filtroAtivo === "minhas"
                ? "Crie uma sala e chame a turma para focar junto."
                : listaAgendadas.length
                  ? "Há salas agendadas logo abaixo."
                  : "Troque o filtro ou crie uma sala."
            }
            acao={
              <Button variante="secundario" onClick={() => setCriando(true)}>
                <Plus />
                {professor ? "Criar sala oficial" : "Criar sala"}
              </Button>
            }
          />
        ) : (
          <motion.ul layout className="relative grid gap-3 lg:grid-cols-2">
            <AnimatePresence mode="popLayout" initial={false}>
              {lista.map((s) => (
                <motion.li
                  key={s.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ ...ENTRADA, layout: MOLA }}
                >
                  <SalaCard {...cardProps(s)} />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </section>

      {listaAgendadas.length > 0 && (
        <section aria-labelledby="salas-agendadas">
          <TituloSecao extra="Avisamos quando abrir">
            <span id="salas-agendadas">Agendadas</span>
          </TituloSecao>
          <ul className="divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-superficie">
            {listaAgendadas.map((s) => (
              <LinhaAgendada key={s.id} sala={s} agora={agora} criador={pessoas[s.criadorId]?.nome} podeCancelar={s.criadorId === usuarioId} onCancelar={pedirEncerrar} />
            ))}
          </ul>
        </section>
      )}

      <CriarSalaSheet aberto={criando} onFechar={() => setCriando(false)} />
      <ConfirmarEncerrarSheet
        sala={encerrando}
        aberto={confirmando}
        agendada={!!encerrando && agendadaFechada(encerrando, agora)}
        onFechar={() => setConfirmando(false)}
      />
    </div>
  );
}

function LinhaAgendada({ sala, agora, criador, podeCancelar, onCancelar }: { sala: SalaEstudo; agora: number; criador?: string; podeCancelar: boolean; onCancelar: (s: SalaEstudo) => void }) {
  return (
    <li className="relative flex flex-wrap items-center gap-3 p-4 transition-colors duration-150 hover:bg-superficie-2 sm:flex-nowrap">
      <IconeSala sala={sala} />
      <div className="min-w-0 flex-1">
        <Link
          href={`/estudos/salas/${sala.id}`}
          className="block truncate text-[14px] font-medium text-tinta outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-verde"
        >
          {sala.nome}
        </Link>
        <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[13px] text-texto-2">
          <span className="truncate">
            {criador ? `${criador} · ` : ""}
            {sala.disciplina ?? "Sala livre"}
          </span>
          {sala.oficial && <Badge tom="neutro">Oficial</Badge>}
        </p>
      </div>
      <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
        <div className="sm:text-right">
          <p className="text-[13px] font-medium tabular-nums text-tinta">{quandoAbre(sala.agendadaPara!, agora)}</p>
          <p className="text-[12px] text-texto-2">{faltaParaAbrir(sala.agendadaPara!, agora)}</p>
        </div>
        <div className="relative z-10 flex gap-1.5">
          {podeCancelar && (
            <Button variante="fantasma" tamanho="sm" onClick={() => onCancelar(sala)} className="text-alerta hover:bg-red-50 hover:text-alerta">
              Cancelar
            </Button>
          )}
          <BotaoLembrar sala={sala} />
        </div>
      </div>
    </li>
  );
}

/** "Você está na sala X" — estado ativo, com o seu timer ao vivo (isolado a cada segundo). */
function BannerSalaAtual({ sala }: { sala: SalaEstudo }) {
  const timer = useSeletor((e) => e.estudos.timer);
  const meu = timer?.salaId === sala.id ? timer : null;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-verde-claro bg-verde-mclaro p-3.5">
      {meu ? (
        <MeuFoco nome={sala.nome} />
      ) : (
        <>
          <IconeSala sala={sala} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium text-tinta">{sala.nome}</p>
            <p className="text-[12px] text-texto-2">Você está nesta sala</p>
          </div>
        </>
      )}
      <div className="flex w-full gap-2 sm:w-auto">
        {meu && (
          <Button
            variante="secundario"
            onClick={meu.pausado ? retomarFoco : pausarFoco}
            aria-label={meu.pausado ? "Retomar foco" : "Pausar foco"}
            title={meu.pausado ? "Retomar" : "Pausar"}
            className="w-9 px-0"
          >
            {meu.pausado ? <Play /> : <Pause />}
          </Button>
        )}
        <Button variante="secundario" onClick={() => sairSala()}>
          <LogOut />
          Sair
        </Button>
        <Link
          href={`/estudos/salas/${sala.id}`}
          className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-verde px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-verde-2 active:scale-[0.98] sm:flex-none"
        >
          Voltar para a sala
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

/** Anel fino + nome da sala + "Foco · 12:30 · Matemática". Re-renderiza a cada segundo. */
function MeuFoco({ nome }: { nome: string }) {
  const timer = useSeletor((e) => e.estudos.timer);
  const agora = useAgora(1000);
  if (!timer) return null;
  const l = lerTimer(timer, agora);
  const pausa = timer.fase === "pausa";
  const estado = timer.pausado ? "Pausado" : pausa ? "Pausa" : "Foco";
  return (
    <>
      <Anel
        progresso={l.progresso ?? 0}
        tamanho={40}
        espessura={3}
        cor={timer.pausado ? COR_PAUSADO : pausa ? COR_PAUSA : COR_FOCO}
        trilho={TRILHO}
        animar={false}
        rotulo={`Seu foco: ${estado.toLowerCase()}`}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-tinta">{nome}</p>
        <p className="truncate text-[12px] tabular-nums text-texto-2">
          <span className={cn("font-medium", timer.pausado ? "text-texto-2" : pausa ? "text-ambar" : "text-acento")}>{estado}</span> · {formatarRelogio(l.restanteMs ?? l.decorridoMs)} ·{" "}
          {timer.disciplina}
        </p>
      </div>
    </>
  );
}
