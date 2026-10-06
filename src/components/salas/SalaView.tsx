"use client";

import { ArrowLeft, CalendarClock, Eye, Lock, LogIn, LogOut, Power, SearchX, Users } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { LinkPessoa } from "@/components/ui/LinkPessoa";
import { Badge } from "@/components/ui/Badge";
import { Vazio } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import type { Disciplina } from "@/data/escola";
import { TEMAS_SALA } from "@/data/salas";
import { useSessao } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { entrarSala, iniciarFoco, sairSala } from "@/store/actions";
import { useSeletor } from "@/store/store";
import type { SalaEstudo } from "@/store/types";
import { BotaoConvidar, BotaoCopiar, IconeSala, rotuloRitmo, useFaseDaSala, useSalaLiberada } from "./comum";
import { ConfirmarEncerrarSheet, EscolherDisciplinaSheet } from "./Dialogos";
import { ChatBloqueado, ChatSala } from "./SalaChat";
import { PresencaSala } from "./SalaPresenca";
import { PainelTimer } from "./SalaTimer";

const TROCA = { duration: 0.15 } as const;

export function SalaView({ id }: { id: string }) {
  const sala = useSeletor((e) => e.salas.find((s) => s.id === id));
  const salaAtual = useSeletor((e) => e.salaAtual);
  const timer = useSeletor((e) => e.estudos.timer);
  const pessoas = useSeletor((e) => e.pessoas);
  const idAluna = useSeletor((e) => e.usuario.id);
  const sessao = useSessao();
  const router = useRouter();
  const { aberta } = useFaseDaSala(sala);
  const liberadaPorCodigo = useSalaLiberada(id);
  const [escolhendo, setEscolhendo] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  if (!sala) {
    return (
      <div className="space-y-4">
        <VoltarParaSalas />
        <Vazio
          icone={<SearchX />}
          titulo="Esta sala não está mais aberta"
          descricao="Ela pode ter sido encerrada por quem criou, ou o link está incorreto."
          acao={
            <Link
              href="/estudos/salas"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-verde px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-verde-2"
            >
              <Users className="size-4" aria-hidden />
              Ver salas abertas
            </Link>
          }
        />
      </div>
    );
  }

  const professor = sessao?.papel === "professor";
  const usuarioId = sessao?.usuarioId ?? idAluna;
  const dentro = salaAtual === id;
  const criador = pessoas[sala.criadorId];
  const souCriador = sala.criadorId === usuarioId;
  const liberada = !sala.privada || professor || dentro || souCriador || liberadaPorCodigo;
  const fechadaAgendada = !aberta && !!sala.agendadaPara;
  const online = sala.membros.length + (dentro ? 1 : 0);

  /** Entra (ou volta a focar) — sala livre pergunta a disciplina antes. */
  const comecar = (disciplina?: Disciplina) => {
    const d = disciplina ?? sala.disciplina;
    if (!d) {
      setEscolhendo(true);
      return;
    }
    if (dentro) iniciarFoco({ disciplina: d, modo: sala.focoMin >= 50 ? "profundo" : "pomodoro", salaId: sala.id });
    else entrarSala(sala.id, d);
  };

  return (
    <div className="space-y-4">
      <VoltarParaSalas />

      <CabecalhoSala
        sala={sala}
        nomeCriador={criador?.nome}
        iniciaisCriador={criador?.iniciais}
        professor={professor}
        dentro={dentro}
        focando={timer?.salaId === id}
        liberada={liberada}
        fechadaAgendada={fechadaAgendada}
        podeEncerrar={souCriador}
        online={online}
        onEntrar={() => comecar()}
        onSair={() => sairSala()}
        onEncerrar={() => setConfirmando(true)}
      />

      <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:items-start lg:gap-4 lg:space-y-0">
        <div className="space-y-4">
          <PainelTimer sala={sala} professor={professor} dentro={dentro} liberada={liberada} nomeCriador={criador?.nome} onEntrar={() => comecar()} />
          {liberada && <PresencaSala sala={sala} professor={professor} dentro={dentro} />}
        </div>
        <div className="lg:sticky lg:top-20">
          {liberada ? (
            <ChatSala
              sala={sala}
              usuarioId={usuarioId}
              podeEnviar={professor || dentro}
              online={fechadaAgendada ? undefined : online}
              aviso={fechadaAgendada ? "O chat abre junto com a sala." : undefined}
              onEntrar={!professor && !fechadaAgendada ? () => comecar() : undefined}
            />
          ) : (
            <ChatBloqueado />
          )}
        </div>
      </div>

      {!sala.disciplina && (
        <EscolherDisciplinaSheet sala={sala} aberto={escolhendo} onFechar={() => setEscolhendo(false)} onEscolher={(d) => comecar(d)} inicial={timer?.disciplina} />
      )}
      <ConfirmarEncerrarSheet
        sala={sala}
        aberto={confirmando}
        agendada={fechadaAgendada}
        onFechar={() => setConfirmando(false)}
        onEncerrada={() => router.push("/estudos/salas")}
      />
    </div>
  );
}

function VoltarParaSalas() {
  return (
    <Link
      href="/estudos/salas"
      className="-ml-2 inline-flex h-8 items-center gap-1.5 rounded-lg pl-1.5 pr-2.5 text-[13px] font-medium text-texto-2 transition-colors duration-150 hover:bg-superficie-2 hover:text-tinta"
    >
      <ArrowLeft className="size-4" aria-hidden />
      Salas
    </Link>
  );
}

interface PropsCabecalho {
  sala: SalaEstudo;
  nomeCriador?: string;
  iniciaisCriador?: string;
  professor: boolean;
  dentro: boolean;
  focando: boolean;
  liberada: boolean;
  fechadaAgendada: boolean;
  podeEncerrar: boolean;
  online: number;
  onEntrar: () => void;
  onSair: () => void;
  onEncerrar: () => void;
}

/** Cabeçalho da sala: card branco com nome, metadados, quem criou, código e as ações. */
function CabecalhoSala({ sala, nomeCriador, iniciaisCriador, professor, dentro, focando, liberada, fechadaAgendada, podeEncerrar, online, onEntrar, onSair, onEncerrar }: PropsCabecalho) {
  const tema = TEMAS_SALA[sala.tema];
  const lotada = !dentro && sala.membros.length >= sala.capacidade;
  const mostraEntrar = !professor && liberada && !fechadaAgendada;

  return (
    <motion.header
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
      className="relative overflow-hidden rounded-2xl border border-borda bg-superficie p-4 sm:p-5"
    >
      {/* Faixa bem suave com a cor da sala no topo do card (identidade discreta). */}
      <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-16 bg-linear-to-b", tema.gradiente)} aria-hidden />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 gap-3.5">
          <IconeSala sala={sala} tamanho="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-[20px] font-semibold leading-tight tracking-tight text-tinta sm:text-[22px]">{sala.nome}</h1>
            <p className="mt-1 text-[13px] text-texto-2">
              {sala.disciplina ?? "Sala livre"} · ciclos de {rotuloRitmo(sala)}
              {sala.turma ? ` · ${sala.turma}` : ""}
              {!fechadaAgendada && (
                <>
                  {" · "}
                  <span className="tabular-nums">{online}</span> {online === 1 ? "pessoa" : "pessoas"}
                </>
              )}
            </p>
          </div>
        </div>

        {(mostraEntrar || podeEncerrar) && (
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <AnimatePresence mode="popLayout" initial={false}>
              {mostraEntrar &&
                (dentro ? (
                  <motion.span key="sair" className="flex gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={TROCA}>
                    {!focando && (
                      <Button onClick={onEntrar}>
                        <LogIn />
                        Voltar a focar
                      </Button>
                    )}
                    <Button variante="secundario" onClick={onSair}>
                      <LogOut />
                      Sair da sala
                    </Button>
                  </motion.span>
                ) : (
                  <motion.span key="entrar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={TROCA}>
                    <Button onClick={onEntrar} disabled={lotada}>
                      <LogIn />
                      {lotada ? "Sala lotada" : "Entrar na sala"}
                    </Button>
                  </motion.span>
                ))}
            </AnimatePresence>
            {podeEncerrar && (
              <Button variante="perigo" onClick={onEncerrar}>
                <Power />
                {fechadaAgendada ? "Cancelar sala" : "Encerrar sala"}
              </Button>
            )}
          </div>
        )}
      </div>

      {sala.descricao && <p className="relative mt-3 max-w-2xl text-[14px] leading-relaxed text-texto">{sala.descricao}</p>}

      <div className="relative mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-borda pt-3.5">
        {nomeCriador && (
          <span className="flex min-w-0 items-center gap-2 text-[13px] text-texto-2">
            <LinkPessoa id={sala.criadorId} rotulo={`Perfil de ${nomeCriador}`} className="flex rounded-full">
              <Avatar nome={nomeCriador} iniciais={iniciaisCriador} tamanho="xs" />
            </LinkPessoa>
            <span className="truncate">
              Criada por{" "}
              <LinkPessoa id={sala.criadorId} className="font-medium text-tinta hover:underline">
                {nomeCriador}
              </LinkPessoa>
            </span>
          </span>
        )}
        <span className="flex flex-wrap items-center gap-1.5">
          {fechadaAgendada && (
            <Badge tom="ambar">
              <CalendarClock aria-hidden />
              Agendada
            </Badge>
          )}
          {sala.oficial && <Badge tom="neutro">Oficial</Badge>}
          {sala.privada && (
            <Badge tom="neutro">
              <Lock aria-hidden />
              Privada
            </Badge>
          )}
          {professor && (
            <Badge tom="azul">
              <Eye aria-hidden />
              Monitorando
            </Badge>
          )}
        </span>
        {liberada && (
          <BotaoConvidar
            sala={sala}
            className={cn("inline-flex h-8 items-center gap-2 rounded-lg border border-borda bg-superficie px-2.5 text-[13px] font-medium text-tinta transition-colors duration-150 hover:bg-superficie-2 active:scale-[0.98] [&_svg]:size-3.5", !(sala.privada && sala.codigo) && "ml-auto")}
          />
        )}
        {sala.privada && sala.codigo && liberada && (
          <BotaoCopiar
            texto={sala.codigo}
            rotulo="Copiar código de convite"
            className="ml-auto inline-flex h-8 items-center gap-2 rounded-lg border border-borda bg-superficie px-2.5 text-[13px] font-medium text-tinta transition-colors duration-150 hover:bg-superficie-2 active:scale-[0.98] [&_svg]:size-3.5"
          />
        )}
      </div>
    </motion.header>
  );
}
