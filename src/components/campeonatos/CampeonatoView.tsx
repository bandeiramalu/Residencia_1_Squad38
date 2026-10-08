"use client";

import { ChevronLeft, Download, FileText, Flag, Hourglass, Play, Sparkles, Swords, Trash2, Trophy, UserMinus, UserPlus, Users, Zap } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArenaAbas } from "@/components/shell/ArenaAbas";
import { Avatar } from "@/components/ui/Avatar";
import { LinkPessoa } from "@/components/ui/LinkPessoa";
import { TituloSecao, Vazio } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CAPAS_CAMPEONATO, nomeDaRodada, ROTULO_FORMATO, ROTULO_METRICA } from "@/data/campeonatos";
import { useSessao } from "@/lib/auth";
import { classificacao, partidaDoAluno, partidasPendentes, participa, podeInscrever, rodadaAtual, totalRodadas } from "@/lib/campeonatos";
import { cn } from "@/lib/cn";
import { fmt, plural } from "@/lib/format";
import { encerrarCampeonato, excluirCampeonato, iniciarCampeonato, inscreverCampeonato, sairDoCampeonato } from "@/store/actions";
import { useSeletor } from "@/store/store";
import type { Campeonato, Pessoa, Usuario } from "@/store/types";
import { Chaveamento } from "./Chaveamento";
import { baixarCertificado, exportarTabelaCsv, papelNoResultado, podio } from "./exportacao";
import {
  dataCampeonato,
  eliminacao,
  faseLiberada,
  ICONE_FORMATO,
  ICONE_METRICA,
  jogoPedido,
  limparPedidoDeJogo,
  LINK_PRIMARIO,
  naFase,
  ordinal,
  PontoAoVivo,
  PontoCapa,
  Prazo,
  ROTULO_STATUS,
  textoPremio,
  turmaCurta,
} from "./comum";
import type { ModoJogo } from "./Duelo";
import { fraseDaDisputa, ListaInscritos, PlacarTurmas, Podio, TabelaClassificacao } from "./Placares";

const Duelo = dynamic(() => import("./Duelo").then((m) => m.Duelo), { ssr: false });

const ENTRADA = { duration: 0.2, ease: [0.2, 0, 0, 1] } as const;

interface JogoAberto {
  modo: ModoJogo;
  /** Incrementa a cada novo jogo aberto em sequência (próximo duelo, outra rodada). */
  n: number;
}

function podeJogarRodada(c: Campeonato, alunoId: string) {
  return c.formato === "pontos-corridos" && c.metrica === "quiz" && c.status === "andamento" && c.participantes.includes(alunoId);
}

/** Detalhe do campeonato (aluno e professor): cabeçalho, disputa no formato certo, duelo e gestão. */
export function CampeonatoView({ id }: { id: string }) {
  const sessao = useSessao();
  const professor = sessao?.papel === "professor";
  const router = useRouter();
  const c = useSeletor((e) => e.campeonatos.find((x) => x.id === id));
  const usuario = useSeletor((e) => e.usuario);
  const pessoas = useSeletor((e) => e.pessoas);
  const [saindo, setSaindo] = useState(false);

  // Vindo do "Jogar" da lista: já abre o duelo/rodada liberado.
  const [jogo, setJogo] = useState<JogoAberto | null>(() => {
    if (professor || !c || !jogoPedido(c.id)) return null;
    const partida = partidaDoAluno(c, usuario.id);
    if (partida) return { modo: { tipo: "duelo", partidaId: partida.id }, n: 0 };
    return podeJogarRodada(c, usuario.id) ? { modo: { tipo: "rodada" }, n: 0 } : null;
  });

  useEffect(() => {
    limparPedidoDeJogo();
  }, []);

  // Com duelo/rodada liberado, já baixa a tela do jogo: o "Jogar" abre sem espera.
  const temJogo = !professor && !!c && (!!partidaDoAluno(c, usuario.id) || podeJogarRodada(c, usuario.id));
  useEffect(() => {
    if (temJogo) void import("./Duelo");
  }, [temJogo]);

  if (!c) {
    if (saindo) return null;
    return (
      <div className="space-y-6">
        {!professor && <ArenaAbas />}
        <Vazio
          icone={<Swords />}
          titulo="Campeonato não encontrado"
          descricao="Ele pode ter sido excluído pelo organizador."
          acao={
            <Link href="/campeonatos" className={LINK_PRIMARIO}>
              Ver campeonatos
            </Link>
          }
        />
      </div>
    );
  }

  const euId = professor ? null : usuario.id;
  const minhaTurma = professor ? null : usuario.turma;
  const organizador = professor || (!c.oficial && c.criadorId === usuario.id);
  const abrirDuelo = (partidaId: string) => setJogo((j) => ({ modo: { tipo: "duelo", partidaId }, n: (j?.n ?? 0) + 1 }));
  const abrirRodada = () => setJogo((j) => ({ modo: { tipo: "rodada" }, n: (j?.n ?? 0) + 1 }));
  const excluir = () => {
    setSaindo(true);
    router.replace("/campeonatos");
    excluirCampeonato(c.id);
  };

  const encerrado = c.status === "encerrado";
  const chaveamento = c.formato === "mata-mata" && c.partidas.length > 0;

  const lateral = (
    <>
      <CartaoDetalhes c={c} largo={chaveamento && !organizador} />
      {organizador && <CartaoGestao c={c} professor={professor} onExcluir={excluir} />}
    </>
  );

  return (
    <div className="space-y-6">
      {!professor && <ArenaAbas />}

      <div className="space-y-3">
        <Link href="/campeonatos" className="-ml-1 inline-flex h-7 items-center gap-0.5 rounded-md pr-2 text-[13px] text-texto-2 transition-colors hover:text-tinta">
          <ChevronLeft className="size-4" aria-hidden />
          Campeonatos
        </Link>
        <Cabecalho c={c} pessoas={pessoas} />
      </div>

      {!professor && <Chamada c={c} usuario={usuario} pessoas={pessoas} onJogarDuelo={abrirDuelo} onJogarRodada={abrirRodada} />}

      {encerrado && <Podio c={c} pessoas={pessoas} euId={euId} turma={minhaTurma} />}
      {encerrado && <CartaoResultado c={c} pessoas={pessoas} usuario={usuario} organizador={organizador} />}

      {chaveamento ? (
        <>
          <Card className="p-4 sm:p-5">
            <TituloSecao extra={encerrado ? "Resultado final" : `Em disputa: ${nomeDaRodada(rodadaAtual(c), totalRodadas(c)).toLowerCase()}`}>Chaveamento</TituloSecao>
            <Chaveamento c={c} pessoas={pessoas} euId={euId} onJogar={abrirDuelo} />
            <p className="mt-3 text-[12px] leading-snug text-texto-2">
              Como se decide: o duelo vence quem acerta mais; em empate, vence o menor tempo total de resposta. Colegas jogam conforme o nível real (XP e domínio da disciplina). Ao encerrar antes da final, confrontos sem resultado vão para quem tem melhor desempenho (XP e domínio) — nunca por sorteio.
            </p>
          </Card>
          <div className={cn("grid items-start gap-4", organizador && "md:grid-cols-2")}>{lateral}</div>
        </>
      ) : (
        <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-6">
          <section className="min-w-0 space-y-4">
            <Disputa c={c} pessoas={pessoas} euId={euId} turma={minhaTurma} />
          </section>
          <aside className="mt-6 grid items-start gap-4 self-start md:grid-cols-2 xl:sticky xl:top-20 xl:mt-0 xl:grid-cols-1">{lateral}</aside>
        </div>
      )}

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {jogo && (
              <Duelo
                key="duelo"
                campId={c.id}
                modo={jogo.modo}
                chave={`${jogo.modo.tipo === "duelo" ? jogo.modo.partidaId : "rodada"}-${jogo.n}`}
                onFechar={() => setJogo(null)}
                onProximo={abrirDuelo}
                onNovaRodada={abrirRodada}
              />
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}

/* ───────────── Cabeçalho ───────────── */

/** Card branco: status, nome, descrição curta, metadados em linha, organizador, prazo e prêmio. */
function Cabecalho({ c, pessoas }: { c: Campeonato; pessoas: Record<string, Pessoa> }) {
  const IconeFormato = ICONE_FORMATO[c.formato];
  const IconeMetrica = ICONE_METRICA[c.metrica];
  const organizador = pessoas[c.criadorId]?.nome ?? "Coordenação";

  return (
    <header className="relative overflow-hidden rounded-2xl border border-borda bg-superficie p-4 sm:p-5">
      <div aria-hidden className={cn("pointer-events-none absolute inset-x-0 top-0 h-16 bg-linear-to-b", CAPAS_CAMPEONATO[c.capa].gradiente)} />
      <div className="relative">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-texto-2">
          <span className="inline-flex items-center gap-1.5">
            {c.status === "andamento" ? <PontoAoVivo /> : <PontoCapa capa={c.capa} className="size-1.5" />}
            {ROTULO_STATUS[c.status]}
          </span>
          <span aria-hidden>·</span>
          <span>{c.oficial ? "Oficial" : "Amistoso"}</span>
        </p>
        <motion.h1 initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={ENTRADA} className="mt-1 text-balance text-[22px] font-semibold leading-tight tracking-tight text-tinta sm:text-2xl">
          {c.nome}
        </motion.h1>
        {c.descricao && <p className="mt-1 line-clamp-2 max-w-2xl text-[14px] text-texto-2">{c.descricao}</p>}

        <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-texto [&_svg]:size-4 [&_svg]:text-texto-2">
          <li className="inline-flex items-center gap-1.5">
            <IconeFormato aria-hidden />
            {ROTULO_FORMATO[c.formato]}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <IconeMetrica aria-hidden />
            {ROTULO_METRICA[c.metrica].nome}
          </li>
          {c.disciplina && <li>{c.disciplina}</li>}
          <li className="inline-flex items-center gap-1.5 tabular-nums">
            <Users aria-hidden />
            {c.formato === "interclasses" ? plural(c.participantes.length, "turma", "turmas") : `${c.participantes.length}/${c.maxParticipantes} ${c.maxParticipantes === 1 ? "participante" : "participantes"}`}
          </li>
        </ul>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-borda pt-3 text-[13px] text-texto-2">
          <span className="inline-flex min-w-0 items-center gap-2">
            <LinkPessoa id={c.criadorId} rotulo={`Perfil de ${organizador}`}><Avatar nome={organizador} iniciais={pessoas[c.criadorId]?.iniciais} tamanho="xs" /></LinkPessoa>
            <span className="truncate">
              Organizado por <LinkPessoa id={c.criadorId} className="font-medium text-texto">{organizador}</LinkPessoa>
            </span>
          </span>
          <Prazo c={c} className="font-medium text-texto" />
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <Trophy className="size-4 shrink-0" aria-hidden />
            <span className="truncate">
              {textoPremio(c.premio)}
              {c.premio.titulo && (c.premio.pontos > 0 || c.premio.xp > 0) ? ` · ${c.premio.titulo}` : ""}
            </span>
          </span>
        </div>
      </div>
    </header>
  );
}

/* ───────────── Chamada da aluna ───────────── */

interface ChamadaProps {
  c: Campeonato;
  usuario: Usuario;
  pessoas: Record<string, Pessoa>;
  onJogarDuelo: (partidaId: string) => void;
  onJogarRodada: () => void;
}

/** O que a aluna pode fazer agora neste campeonato (jogar, inscrever-se, estudar) — ou a situação dela. */
function Chamada({ c, usuario, pessoas, onJogarDuelo, onJogarRodada }: ChamadaProps) {
  const dentro = participa(c, usuario.id, usuario.turma);

  if (c.status === "inscricoes") {
    if (c.formato === "interclasses") {
      return <Aviso icone={<Users />} titulo={dentro ? "Sua turma está na disputa" : "Sua turma não participa"} texto={dentro ? "Quando começar, cada minuto seu soma para a turma." : "Este interclasses é entre outras turmas."} />;
    }
    if (dentro) {
      return (
        <Aviso
          icone={<UserPlus />}
          titulo="Você está inscrita"
          texto={`${c.participantes.length} de ${plural(c.maxParticipantes, "vaga preenchida", "vagas preenchidas")}.`}
          acao={
            <Button variante="secundario" onClick={() => sairDoCampeonato(c.id)}>
              <UserMinus />
              Cancelar inscrição
            </Button>
          }
        />
      );
    }
    const pode = podeInscrever(c, usuario.turma);
    const lotado = c.participantes.length >= c.maxParticipantes;
    return (
      <Aviso
        icone={<UserPlus />}
        titulo={pode ? "Inscrições abertas" : lotado ? "Vagas esgotadas" : "Inscrição indisponível"}
        texto={pode ? `${c.maxParticipantes - c.participantes.length === 1 ? "Resta 1 vaga" : `Restam ${c.maxParticipantes - c.participantes.length} vagas`}.` : lotado ? "Todas as vagas foram preenchidas." : "Este campeonato é para outras turmas."}
        acao={
          pode ? (
            <Button onClick={() => inscreverCampeonato(c.id)}>
              <UserPlus />
              Inscrever-se
            </Button>
          ) : undefined
        }
      />
    );
  }

  if (c.status === "encerrado") return null;

  if (c.formato === "mata-mata") {
    if (!dentro) return <Aviso icone={<Swords />} titulo="Você está assistindo" texto="Acompanhe os duelos no chaveamento." />;
    const partida = partidaDoAluno(c, usuario.id);
    if (partida) {
      const rivalId = partida.a === usuario.id ? partida.b : partida.a;
      const rival = pessoas[rivalId ?? ""];
      const fase = nomeDaRodada(partida.rodada, totalRodadas(c));
      return (
        <Aviso
          icone={
            <span className="flex items-center">
              <span className="rounded-full ring-2 ring-superficie">
                <LinkPessoa id={usuario.id} rotulo="Seu perfil"><Avatar nome={usuario.nome} iniciais={pessoas[usuario.id]?.iniciais} tamanho="sm" /></LinkPessoa>
              </span>
              <span className="-ml-2 rounded-full ring-2 ring-superficie">
                {rivalId ? <LinkPessoa id={rivalId} rotulo={`Perfil de ${rival?.nome ?? "adversário"}`}><Avatar nome={rival?.nome ?? "Adversário"} iniciais={rival?.iniciais} tamanho="sm" /></LinkPessoa> : <Avatar nome="Adversário" tamanho="sm" />}
              </span>
            </span>
          }
          semCirculo
          titulo={`${faseLiberada(fase)} — você × ${rival?.nome ?? "adversário"}`}
          texto="5 perguntas, 20 s cada."
          acao={
            <Button onClick={() => onJogarDuelo(partida.id)}>
              <Play />
              Jogar
            </Button>
          }
        />
      );
    }
    const caiu = eliminacao(c, usuario.id);
    return caiu ? (
      <Aviso icone={<Flag />} titulo={`Você parou ${naFase(caiu)}`} texto="Os XP dos acertos já estão na sua conta." />
    ) : (
      <Aviso icone={<Hourglass />} titulo="Aguardando seu próximo adversário" texto="Seu duelo é liberado quando o outro confronto terminar." />
    );
  }

  if (c.formato === "interclasses") {
    if (!dentro) return <Aviso icone={<Users />} titulo="Sua turma não participa" texto="Acompanhe a disputa entre as turmas abaixo." />;
    return (
      <Aviso
        icone={<Users />}
        titulo={fraseDaDisputa(c, usuario.turma) ?? "Sua turma está na disputa"}
        texto={c.metrica === "foco" ? "Cada minuto de foco na Sala de Estudos soma para a sua turma." : "Todo XP de mérito da turma conta até o fim."}
        acao={
          <Link href={c.metrica === "foco" ? "/estudos" : "/missoes"} className={LINK_PRIMARIO}>
            {c.metrica === "foco" ? <Hourglass /> : <Sparkles />}
            {c.metrica === "foco" ? "Estudar agora" : "Ganhar XP"}
          </Link>
        }
      />
    );
  }

  // Pontos corridos
  if (!dentro) return <Aviso icone={<Users />} titulo="Você não está neste campeonato" texto="As inscrições já fecharam." />;
  const minha = classificacao(c).find((l) => l.id === usuario.id);
  const pos = minha ? `Você está em ${ordinal(minha.posicao)}` : "Você está na disputa";
  if (podeJogarRodada(c, usuario.id)) {
    return (
      <Aviso
        icone={<Zap />}
        titulo={pos}
        texto="Rodada de 5 perguntas: cada acerto vale 10 pontos."
        acao={
          <Button onClick={onJogarRodada}>
            <Play />
            Jogar rodada
          </Button>
        }
      />
    );
  }
  if (c.metrica === "foco") {
    return (
      <Aviso
        icone={<Hourglass />}
        titulo={pos}
        texto="Seus minutos de foco na Sala de Estudos entram na tabela."
        acao={
          <Link href="/estudos" className={LINK_PRIMARIO}>
            <Hourglass />
            Estudar agora
          </Link>
        }
      />
    );
  }
  return <Aviso icone={<Sparkles />} titulo={pos} texto="Todo XP de mérito até o fim conta na tabela. Sequência não conta." />;
}

function Aviso({ icone, titulo, texto, acao, semCirculo }: { icone: ReactNode; titulo: string; texto: string; acao?: ReactNode; semCirculo?: boolean }) {
  return (
    <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={ENTRADA} className="flex flex-col gap-3 rounded-2xl border border-borda bg-superficie p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {semCirculo ? <span className="shrink-0">{icone}</span> : <span className="grid size-9 shrink-0 place-items-center rounded-full bg-superficie-2 text-texto-2 [&_svg]:size-4">{icone}</span>}
        <div className="min-w-0">
          <p className="text-[14px] font-medium leading-snug text-tinta">{titulo}</p>
          <p className="mt-0.5 text-[13px] leading-snug text-texto-2">{texto}</p>
        </div>
      </div>
      {acao && <div className="flex shrink-0 [&>*]:max-sm:w-full">{acao}</div>}
    </motion.section>
  );
}

/* ───────────── Disputa (pontos corridos e interclasses) ───────────── */

function Disputa({ c, pessoas, euId, turma }: { c: Campeonato; pessoas: Record<string, Pessoa>; euId: string | null; turma: string | null }) {
  if (c.status === "inscricoes" || (c.formato === "mata-mata" && !c.partidas.length)) {
    return (
      <Card className="p-4 sm:p-5">
        <TituloSecao extra={c.formato === "interclasses" ? plural(c.participantes.length, "turma", "turmas") : `${c.participantes.length}/${c.maxParticipantes} ${c.maxParticipantes === 1 ? "vaga" : "vagas"}`}>{c.formato === "interclasses" ? "Turmas" : "Inscritos"}</TituloSecao>
        {c.participantes.length ? <ListaInscritos c={c} pessoas={pessoas} euId={euId} /> : <p className="py-6 text-center text-[13px] text-texto-2">Ninguém se inscreveu ainda.</p>}
      </Card>
    );
  }
  if (c.formato === "interclasses") {
    return (
      <Card className="p-4 sm:p-5">
        <TituloSecao extra={ROTULO_METRICA[c.metrica].nome}>Placar das turmas</TituloSecao>
        <PlacarTurmas c={c} turma={turma} />
      </Card>
    );
  }
  return (
    <section>
      <TituloSecao extra={plural(c.participantes.length, "participante", "participantes")}>Classificação</TituloSecao>
      <TabelaClassificacao c={c} pessoas={pessoas} euId={euId} />
    </section>
  );
}

/* ───────────── Lateral ───────────── */

/** Datas, público e regras. `largo`: ocupa a largura toda (datas e regras lado a lado a partir do tablet). */
function CartaoDetalhes({ c, largo }: { c: Campeonato; largo?: boolean }) {
  const regras: string[] = [ROTULO_METRICA[c.metrica].descricao];
  if (c.formato === "mata-mata") regras.push("Cada duelo tem 5 perguntas com 20 s. Empate: vence quem respondeu mais rápido.", "Quem perde está fora; quem vence avança.");
  if (c.formato === "pontos-corridos") regras.push(c.metrica === "quiz" ? "Jogue quantas rodadas quiser: cada acerto vale 10 pontos." : "Vence quem tiver mais no fim do prazo.");
  if (c.formato === "interclasses") regras.push("Todos os alunos da turma somam para ela, sem inscrição.");
  regras.push(c.oficial ? "Oficial: o campeão recebe pontos (Loja) e XP (nível)." : "Amistoso: vale o título, sem pontos da escola.");

  const linhas: { rotulo: string; valor: string }[] = [
    { rotulo: "Início", valor: dataCampeonato(c.inicio) },
    { rotulo: "Fim", valor: dataCampeonato(c.fim) },
    c.formato === "interclasses"
      ? { rotulo: "Turmas", valor: String(c.participantes.length) }
      : { rotulo: "Aberto para", valor: c.turmas.length ? c.turmas.map(turmaCurta).join(", ") : "Toda a escola" },
  ];
  if (c.formato !== "interclasses") linhas.push({ rotulo: "Participantes", valor: `${c.participantes.length}/${c.maxParticipantes}` });

  return (
    <Card>
      <TituloSecao>Detalhes</TituloSecao>
      <div className={cn(largo && "md:grid md:grid-cols-2 md:gap-8")}>
        <dl className="divide-y divide-borda text-[13px]">
          {linhas.map((l) => (
            <div key={l.rotulo} className="flex justify-between gap-3 py-2 first:pt-0">
              <dt className="text-texto-2">{l.rotulo}</dt>
              <dd className="text-right font-medium tabular-nums text-tinta">{l.valor}</dd>
            </div>
          ))}
        </dl>
        <div className={cn("mt-4 border-t border-borda pt-3", largo && "md:mt-0 md:border-t-0 md:pt-0")}>
          <h3 className="text-[13px] font-medium text-tinta">Regras</h3>
          <ul className="mt-2 space-y-1.5">
            {regras.map((r) => (
              <li key={r} className="flex gap-2 text-[13px] leading-snug text-texto-2">
                <span className="mt-[7px] size-1 shrink-0 rounded-full bg-texto-2" aria-hidden />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

/** Resultado final: certificados em PDF (campeão, vice, participante) e tabela em CSV. */
function CartaoResultado({ c, pessoas, usuario, organizador }: { c: Campeonato; pessoas: Record<string, Pessoa>; usuario: Usuario; organizador: boolean }) {
  const { campeao, vice } = podio(c);
  const emitidoPor = organizador ? (pessoas[c.criadorId]?.nome ?? "organização") : "Portal do Aluno";
  const meuPapel = !organizador ? papelNoResultado(c, c.formato === "interclasses" ? usuario.turma : usuario.id) : null;
  const meuId = c.formato === "interclasses" ? usuario.turma : usuario.id;
  const nomeCert = { campeao: "Certificado de campeão", vice: "Certificado de vice-campeão", participante: "Certificado de participação" } as const;
  return (
    <Card className="p-4 sm:p-5">
      <TituloSecao extra="PDF e planilha">Certificados e tabela</TituloSecao>
      <div className="flex flex-wrap gap-2">
        {meuPapel && (
          <Button onClick={() => baixarCertificado(c, meuPapel, [meuId], pessoas, emitidoPor)}>
            <FileText />
            {nomeCert[meuPapel]}
          </Button>
        )}
        {organizador && campeao && (
          <Button variante="secundario" onClick={() => baixarCertificado(c, "campeao", [campeao], pessoas, emitidoPor)}>
            <FileText />
            Certificado do campeão
          </Button>
        )}
        {organizador && vice && (
          <Button variante="secundario" onClick={() => baixarCertificado(c, "vice", [vice], pessoas, emitidoPor)}>
            <FileText />
            Certificado do vice
          </Button>
        )}
        {organizador && c.participantes.length > 2 && (
          <Button
            variante="secundario"
            onClick={() =>
              baixarCertificado(
                c,
                "participante",
                c.participantes.filter((id) => id !== campeao && id !== vice),
                pessoas,
                emitidoPor,
              )
            }
          >
            <FileText />
            Certificado de participação
          </Button>
        )}
        <Button variante="secundario" onClick={() => exportarTabelaCsv(c, pessoas)}>
          <Download />
          Exportar tabela (CSV)
        </Button>
      </div>
    </Card>
  );
}

/** Ações do organizador (professor, ou a aluna no amistoso que criou): iniciar, encerrar e premiar, excluir. */
function CartaoGestao({ c, professor, onExcluir }: { c: Campeonato; professor: boolean; onExcluir: () => void }) {
  const [confirmar, setConfirmar] = useState<"encerrar" | "excluir" | null>(null);
  const semChave = c.formato === "mata-mata" && c.participantes.length < 2;
  const lider = classificacao(c)[0];

  return (
    <Card>
      <TituloSecao extra={professor ? "Professor" : "Você organiza"}>Gestão</TituloSecao>
      <AnimatePresence mode="wait" initial={false}>
        {confirmar ? (
          <motion.div key="confirmar" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <p className="text-[14px] font-medium text-tinta">{confirmar === "excluir" ? "Excluir este campeonato?" : "Encerrar e premiar agora?"}</p>
            <p className="mt-1 text-[13px] leading-snug text-texto-2">
              {confirmar === "excluir"
                ? "Placar, chaveamento e inscrições somem para todos. Não dá para desfazer."
                : c.formato === "mata-mata"
                  ? `${partidasPendentes(c) ? `${partidasPendentes(c)} ${partidasPendentes(c) === 1 ? "confronto ainda não foi decidido" : "confrontos ainda não foram decididos"}: cada um vai para quem tem melhor desempenho real (XP total e domínio da disciplina), sem sorteio e marcado como tal na chave. ` : ""}O campeão recebe o prêmio.`
                  : `${lider ? `Hoje o campeão seria ${c.formato === "interclasses" ? lider.id : "o 1º da tabela"} com ${fmt(lider.pontos)} ${ROTULO_METRICA[c.metrica].unidade}.` : ""} O prêmio é entregue na hora.`}
            </p>
            <div className="mt-3 flex gap-2">
              <Button variante="secundario" tamanho="sm" className="flex-1" onClick={() => setConfirmar(null)}>
                Voltar
              </Button>
              <Button
                variante={confirmar === "excluir" ? "perigo" : "primario"}
                tamanho="sm"
                className="flex-1"
                onClick={() => {
                  if (confirmar === "excluir") onExcluir();
                  else encerrarCampeonato(c.id);
                  setConfirmar(null);
                }}
              >
                {confirmar === "excluir" ? "Excluir" : "Encerrar e premiar"}
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="acoes" className="space-y-2" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {c.status === "inscricoes" && (
              <>
                <Button bloco onClick={() => iniciarCampeonato(c.id)} disabled={semChave}>
                  <Play />
                  Iniciar campeonato
                </Button>
                <p className="text-[12px] leading-snug text-texto-2">
                  {semChave ? "O mata-mata precisa de pelo menos 2 inscritos." : `Fecha as inscrições${c.formato === "mata-mata" ? " e monta o chaveamento por nível (melhor × pior)" : ""} com ${c.participantes.length} ${c.formato === "interclasses" ? "turmas" : "participantes"}.`}
                </p>
              </>
            )}
            {c.status === "andamento" && (
              <Button bloco onClick={() => setConfirmar("encerrar")}>
                <Trophy />
                Encerrar e premiar
              </Button>
            )}
            {c.status === "encerrado" && (
              <p className="flex items-center gap-2 text-[13px] text-texto-2">
                <Trophy className="size-4 shrink-0 text-ouro" aria-hidden />
                Prêmio entregue{c.campeao ? ` a ${c.formato === "interclasses" ? c.campeao : "quem venceu"}` : ""}.
              </p>
            )}
            <Button bloco variante="perigo" tamanho="sm" onClick={() => setConfirmar("excluir")}>
              <Trash2 />
              Excluir campeonato
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
