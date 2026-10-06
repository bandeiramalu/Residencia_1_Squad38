"use client";

import { Plus, Trophy } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { ArenaAbas } from "@/components/shell/ArenaAbas";
import { Avatar } from "@/components/ui/Avatar";
import { LinkPessoa } from "@/components/ui/LinkPessoa";
import { TituloPagina, TituloSecao, Vazio } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { nomeDaRodada, ROTULO_METRICA } from "@/data/campeonatos";
import { useSessao } from "@/lib/auth";
import { partidaDoAluno, participa, totalRodadas } from "@/lib/campeonatos";
import { useSeletor } from "@/store/store";
import type { Campeonato, MetricaCampeonato, Pessoa, StatusCampeonato, Usuario } from "@/store/types";
import { CartaoCampeonato } from "./CartaoCampeonato";
import { faseLiberada, ICONE_METRICA, LINK_PRIMARIO, pedirJogo, situacaoDaAluna } from "./comum";

const CriarCampeonatoSheet = dynamic(() => import("./CriarCampeonatoSheet").then((m) => m.CriarCampeonatoSheet), { ssr: false });

type Aba = "andamento" | "inscricoes" | "encerrado" | "meus";

const ORDEM_STATUS: Record<StatusCampeonato, number> = { andamento: 0, inscricoes: 1, encerrado: 2 };

const VAZIO: Record<Aba, string> = {
  andamento: "Nenhum campeonato em andamento",
  inscricoes: "Nenhuma inscrição aberta agora",
  encerrado: "Nenhum campeonato encerrado",
  meus: "",
};

/** Campeonatos (oficiais e amistosos) para aluno e professor. */
export function CampeonatosView() {
  const sessao = useSessao();
  const professor = sessao?.papel === "professor";
  const campeonatos = useSeletor((e) => e.campeonatos);
  const usuario = useSeletor((e) => e.usuario);
  const pessoas = useSeletor((e) => e.pessoas);
  const [aba, setAba] = useState<Aba>("andamento");
  const [criando, setCriando] = useState(false);

  const euId = professor ? (sessao?.usuarioId ?? "") : usuario.id;
  const meu = (c: Campeonato) => (professor ? c.criadorId === euId : participa(c, usuario.id, usuario.turma) || c.criadorId === usuario.id);
  const prioridade = (c: Campeonato) => (professor ? 0 : partidaDoAluno(c, usuario.id) ? 0 : participa(c, usuario.id, usuario.turma) ? 1 : 2);

  const lista = campeonatos
    .filter((c) => (aba === "meus" ? meu(c) : c.status === aba))
    .sort((a, b) => {
      if (aba === "encerrado") return b.fim - a.fim;
      if (aba === "inscricoes") return a.inicio - b.inicio;
      return ORDEM_STATUS[a.status] - ORDEM_STATUS[b.status] || prioridade(a) - prioridade(b) || a.fim - b.fim;
    });

  const contagem = (a: Aba) => campeonatos.filter((c) => (a === "meus" ? meu(c) : c.status === a)).length;
  const rotulo = (texto: string, a: Aba) => (
    <>
      {texto}
      <span className="tabular-nums opacity-60">{contagem(a)}</span>
    </>
  );
  const abas = [
    { id: "andamento" as const, rotulo: rotulo("Em andamento", "andamento") },
    { id: "inscricoes" as const, rotulo: rotulo("Inscrições", "inscricoes") },
    { id: "encerrado" as const, rotulo: rotulo("Encerrados", "encerrado") },
    { id: "meus" as const, rotulo: rotulo(professor ? "Criados por mim" : "Meus", "meus") },
  ];

  const vazio = aba === "meus" ? (professor ? "Você ainda não criou campeonatos" : "Você ainda não está em nenhum campeonato") : VAZIO[aba];

  return (
    <div className="space-y-6">
      {!professor && <ArenaAbas />}

      <TituloPagina
        titulo="Campeonatos"
        descricao={professor ? "Campeonatos oficiais valem pontos e XP para as suas turmas." : "Duelos de quiz, maratonas de foco e disputas entre turmas."}
        acao={
          <Button onClick={() => setCriando(true)}>
            <Plus />
            <span className="sm:hidden">Criar</span>
            <span className="max-sm:hidden">Criar campeonato</span>
          </Button>
        }
      />

      {!professor && <AvisoPartida campeonatos={campeonatos} usuario={usuario} pessoas={pessoas} />}

      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-6">
        <section className="min-w-0 space-y-4" aria-label="Lista de campeonatos">
          <ChipGroup grupo="campeonatos-aba" rotulo="Filtrar campeonatos" opcoes={abas} valor={aba} onChange={setAba} />

          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={aba} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16, ease: [0.2, 0, 0, 1] }}>
              {lista.length === 0 ? (
                <Vazio
                  icone={<Trophy />}
                  titulo={vazio}
                  descricao={professor ? "Um interclasses de foco engaja a turma inteira em poucos dias." : "Chame colegas da sua turma para um amistoso."}
                  acao={
                    <Button tamanho="sm" variante="secundario" onClick={() => setCriando(true)}>
                      <Plus />
                      Criar campeonato
                    </Button>
                  }
                />
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {lista.map((c, i) => (
                    <motion.li key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: [0.2, 0, 0, 1], delay: Math.min(i, 6) * 0.03 }}>
                      <CartaoCampeonato c={c} pessoas={pessoas} turma={professor ? undefined : usuario.turma} situacao={professor ? null : situacaoDaAluna(c, usuario.id, usuario.turma)} />
                    </motion.li>
                  ))}
                </ul>
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        <aside className="mt-6 grid gap-4 self-start sm:grid-cols-2 xl:sticky xl:top-20 xl:mt-0 xl:grid-cols-1">
          {professor ? <Resumo campeonatos={campeonatos} /> : <SuaCampanha campeonatos={campeonatos} usuario={usuario} />}
          <ComoSePontua />
        </aside>
      </div>

      <CriarCampeonatoSheet aberto={criando} onFechar={() => setCriando(false)} />
    </div>
  );
}

/* ───────────── Aviso de partida liberada ───────────── */

/** Card branco no topo quando a aluna tem um duelo liberado: "Semifinal liberada — você × Sofia Andrade" + Jogar. */
function AvisoPartida({ campeonatos, usuario, pessoas }: { campeonatos: Campeonato[]; usuario: Usuario; pessoas: Record<string, Pessoa> }) {
  const comDuelo = campeonatos.find((c) => c.status === "andamento" && partidaDoAluno(c, usuario.id));
  if (!comDuelo) return null;
  const partida = partidaDoAluno(comDuelo, usuario.id)!;
  const rivalId = partida.a === usuario.id ? partida.b : partida.a;
  const rival = pessoas[rivalId ?? ""];
  const fase = nomeDaRodada(partida.rodada, totalRodadas(comDuelo));

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
      className="flex flex-col gap-3 rounded-2xl border border-borda bg-superficie p-4 sm:flex-row sm:items-center"
      aria-label="Partida liberada"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex shrink-0 items-center">
          <span className="rounded-full ring-2 ring-superficie">
            <LinkPessoa id={usuario.id} rotulo="Seu perfil"><Avatar nome={usuario.nome} iniciais={pessoas[usuario.id]?.iniciais} tamanho="sm" /></LinkPessoa>
          </span>
          <span className="-ml-2 rounded-full ring-2 ring-superficie">
            {rivalId ? <LinkPessoa id={rivalId} rotulo={`Perfil de ${rival?.nome ?? "adversário"}`}><Avatar nome={rival?.nome ?? "Adversário"} iniciais={rival?.iniciais} tamanho="sm" /></LinkPessoa> : <Avatar nome="Adversário" tamanho="sm" />}
          </span>
        </span>
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-tinta">
            {faseLiberada(fase)} <span className="font-normal text-texto-2">—</span> você × {rivalId ? <LinkPessoa id={rivalId}>{rival?.nome ?? "adversário"}</LinkPessoa> : "adversário"}
          </p>
          <p className="truncate text-[13px] text-texto-2">{comDuelo.nome} · 5 perguntas, 20 s cada</p>
        </div>
      </div>
      <Link href={`/campeonatos/${comDuelo.id}`} onClick={() => pedirJogo(comDuelo.id)} className={`${LINK_PRIMARIO} max-sm:w-full`}>
        Jogar
      </Link>
    </motion.section>
  );
}

/* ───────────── Coluna lateral ───────────── */

function Numeros({ itens, colunas }: { itens: { valor: number | string; rotulo: string }[]; colunas: 2 | 3 }) {
  return (
    <dl className={colunas === 3 ? "grid grid-cols-3 divide-x divide-borda" : "grid grid-cols-2 gap-y-4"}>
      {itens.map((n) => (
        <div key={n.rotulo} className={colunas === 3 ? "flex flex-col-reverse justify-end px-2 text-center first:pl-0 last:pr-0" : "flex flex-col-reverse justify-end"}>
          <dt className="mt-0.5 text-[12px] text-texto-2">{n.rotulo}</dt>
          <dd className="text-xl font-semibold tabular-nums text-tinta">{n.valor}</dd>
        </div>
      ))}
    </dl>
  );
}

function SuaCampanha({ campeonatos, usuario }: { campeonatos: Campeonato[]; usuario: Usuario }) {
  const titulos = campeonatos.filter((c) => c.status === "encerrado" && (c.campeao === usuario.id || (c.formato === "interclasses" && c.campeao === usuario.turma)));
  const duelos = campeonatos.flatMap((c) => c.partidas.filter((p) => p.status === "encerrada" && p.a && p.b && (p.a === usuario.id || p.b === usuario.id)));
  const vitorias = duelos.filter((p) => p.vencedor === usuario.id).length;
  const disputando = campeonatos.filter((c) => c.status !== "encerrado" && participa(c, usuario.id, usuario.turma)).length;

  return (
    <Card>
      <TituloSecao extra="Temporada 2026">Sua campanha</TituloSecao>
      <Numeros
        colunas={3}
        itens={[
          { valor: disputando, rotulo: "em disputa" },
          { valor: `${vitorias}/${duelos.length}`, rotulo: "duelos vencidos" },
          { valor: titulos.length, rotulo: titulos.length === 1 ? "título" : "títulos" },
        ]}
      />
      {titulos.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-borda pt-3">
          {titulos.map((c) => (
            <li key={c.id} className="flex items-center gap-2 text-[13px] text-texto">
              <Trophy className="size-4 shrink-0 text-ouro" aria-hidden />
              <span className="truncate">{c.premio.titulo ?? c.nome}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Resumo({ campeonatos }: { campeonatos: Campeonato[] }) {
  const ativos = campeonatos.filter((c) => c.status !== "encerrado");
  const alunos = new Set(ativos.filter((c) => c.formato !== "interclasses").flatMap((c) => c.participantes)).size;
  const turmas = new Set(ativos.filter((c) => c.formato === "interclasses").flatMap((c) => c.participantes)).size;
  return (
    <Card>
      <TituloSecao>Resumo</TituloSecao>
      <Numeros
        colunas={2}
        itens={[
          { valor: campeonatos.filter((c) => c.status === "andamento").length, rotulo: "em andamento" },
          { valor: campeonatos.filter((c) => c.status === "inscricoes").length, rotulo: "com inscrições" },
          { valor: alunos, rotulo: "alunos disputando" },
          { valor: turmas, rotulo: "turmas no interclasses" },
        ]}
      />
    </Card>
  );
}

function ComoSePontua() {
  const metricas: MetricaCampeonato[] = ["quiz", "foco", "xp"];
  return (
    <Card>
      <TituloSecao>Como se pontua</TituloSecao>
      <ul className="space-y-3">
        {metricas.map((m) => {
          const Icone = ICONE_METRICA[m];
          return (
            <li key={m} className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-superficie-2 text-texto-2">
                <Icone className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-tinta">{ROTULO_METRICA[m].nome}</p>
                <p className="text-[12px] leading-snug text-texto-2">{ROTULO_METRICA[m].descricao}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 border-t border-borda pt-3 text-[12px] leading-snug text-texto-2">Oficiais (de professores) valem pontos e XP. Amistosos valem o título.</p>
    </Card>
  );
}
