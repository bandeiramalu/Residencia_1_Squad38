"use client";

import { ArrowRight, Check, ChevronRight, CircleHelp, ClipboardPlus, Coins, DoorOpen, Megaphone, PackageCheck, ShieldAlert, Swords } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { CriarCampeonatoSheet } from "@/components/campeonatos/CriarCampeonatoSheet";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Avatar } from "@/components/ui/Avatar";
import { TituloPagina, TituloSecao } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LinkPessoa } from "@/components/ui/LinkPessoa";
import { Segmentado } from "@/components/ui/Segmentado";
import { PROFESSOR } from "@/data/professor";
import { useAgora } from "@/hooks/useAgora";
import { useSessao } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { formatarMinutos } from "@/lib/estudos";
import { alunosDoPainel, duvidasPendentes, relatosPendentes, resumoDaTurma, trocasPendentes, ultimoAcesso } from "@/lib/turmas";
import { useEstado } from "@/store/store";
import { AvisoSheet } from "./AvisoSheet";
import { BotaoLembrar, LinkBotao, Metadados, OPCOES_TURMA, definirTurma, useProfessorId, useTurmaProfessor } from "./comum";
import { DarPontosSheet, type AlvoPontos } from "./DarPontosSheet";
import { NovaAtividadeSheet } from "./NovaAtividadeSheet";
import { TrocasSheet } from "./TrocasSheet";

function saudacao(agora: number) {
  const h = new Date(agora).getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

function dataPorExtenso(agora: number) {
  const t = new Date(agora).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function Numero({ href, rotulo, children, detalhe, alerta }: { href: string; rotulo: string; children: ReactNode; detalhe: string; alerta?: boolean }) {
  return (
    <Link href={href} className="group min-w-0 rounded-2xl border border-borda bg-superficie p-4 transition-[background-color,transform] duration-150 hover:bg-superficie-2 active:scale-[0.98]">
      <p className="truncate text-[13px] text-texto-2">{rotulo}</p>
      <p className={cn("mt-1 text-[28px] font-semibold leading-tight tracking-tight tabular-nums", alerta ? "text-alerta" : "text-tinta")}>{children}</p>
      <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-texto-2">
        <span className="truncate">{detalhe}</span>
        <ChevronRight className="size-3.5 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" />
      </p>
    </Link>
  );
}

/** Painel do professor: o que fazer agora, sem gráficos (eles vivem em Estatísticas). */
export function PainelView() {
  const estado = useEstado();
  const agora = useAgora(60_000);
  const turma = useTurmaProfessor();
  const profId = useProfessorId();
  const sessao = useSessao();
  const router = useRouter();
  const [darPara, setDarPara] = useState<AlvoPontos[] | null>(null);
  const [trocasAberta, setTrocasAberta] = useState(false);
  const [novaAberta, setNovaAberta] = useState(false);
  const [avisoAberto, setAvisoAberto] = useState(false);
  const [campAberto, setCampAberto] = useState(false);

  const tratamento = (sessao?.nome ?? PROFESSOR.nome).split(" ").slice(0, 2).join(" ");
  const alunos = alunosDoPainel(estado, turma, agora);
  const resumo = resumoDaTurma(alunos);
  const corrigirTurma = estado.atividades
    .filter((a) => a.professorId === profId && a.turma === turma)
    .reduce((s, a) => s + a.entregas.filter((e) => e.status === "entregue").length, 0);
  const emRisco = alunos.filter((a) => a.risco === "alto").sort((a, b) => b.ultimoAcessoHa - a.ultimoAcessoHa);
  const naModeracao = estado.posts.filter((p) => p.emRevisao || p.denuncia).length;
  const nRelatos = relatosPendentes(estado).length;
  const nDuvidas = duvidasPendentes(estado, estado.pessoas[profId]?.disciplina);
  const nTrocas = trocasPendentes(estado).length;

  return (
    <div className="space-y-6">
      <TituloPagina
        titulo={`${saudacao(agora)}, ${tratamento}`}
        descricao={agora ? `${dataPorExtenso(agora)} · ${turma}` : turma}
        acao={<Segmentado opcoes={OPCOES_TURMA} valor={turma} onChange={definirTurma} grupo="prof-painel-turma" rotulo="Turma" tamanho="sm" className="w-full sm:w-64" />}
      />

      <div className="grid grid-cols-3 gap-3">
        <Numero href="/professor/alunos" rotulo="Ativos hoje" detalhe={`de ${resumo.total} alunos`}>
          <AnimatedNumber valor={resumo.ativosHoje} />
        </Numero>
        <Numero href="/professor/alunos?filtro=risco" rotulo="Em risco" detalhe="ver alunos" alerta={resumo.emRisco > 0}>
          <AnimatedNumber valor={resumo.emRisco} />
        </Numero>
        <Numero href="/professor/atividades" rotulo="Para corrigir" detalhe="ver atividades">
          <AnimatedNumber valor={corrigirTurma} />
        </Numero>
      </div>

      <div className="sem-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Ações rápidas">
        <Button variante="secundario" onClick={() => setNovaAberta(true)}>
          <ClipboardPlus className="text-texto-2" /> Nova atividade
        </Button>
        <Button variante="secundario" onClick={() => setAvisoAberto(true)}>
          <Megaphone className="text-texto-2" /> Publicar aviso
        </Button>
        <LinkBotao href="/estudos/salas">
          <DoorOpen className="text-texto-2" /> Abrir sala
        </LinkBotao>
        <Button variante="secundario" onClick={() => setCampAberto(true)}>
          <Swords className="text-texto-2" /> Criar campeonato
        </Button>
      </div>

      <section>
        <TituloSecao extra={emRisco.length ? `${emRisco.length} ${emRisco.length === 1 ? "aluno" : "alunos"}` : undefined}>Precisa de atenção</TituloSecao>
        <Card semPadding className="overflow-hidden">
          {emRisco.length === 0 ? (
            <p className="flex items-center gap-2.5 px-4 py-4 text-[13px] text-texto-2">
              <Check className="size-4 text-acento" /> Ninguém em risco no {turma}.
            </p>
          ) : (
            <ul className="divide-y divide-borda">
              {emRisco.slice(0, 5).map((a) => {
                return (
                  <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                    <LinkPessoa id={a.id} rotulo={`Perfil de ${a.nome}`} className="shrink-0">
                      <Avatar nome={a.nome} iniciais={a.iniciais} tamanho="sm" />
                    </LinkPessoa>
                    <div className="min-w-0 flex-1">
                      <LinkPessoa id={a.id} className="block truncate text-[14px] font-medium text-tinta hover:underline">
                        {a.nome}
                      </LinkPessoa>
                      <Metadados
                        className="block truncate text-[12px] text-texto-2"
                        itens={[
                          <span key="acesso" className="text-alerta">
                            {ultimoAcesso(a.ultimoAcessoHa)}
                          </span>,
                          `${formatarMinutos(a.minutosSemana)} na semana`,
                        ]}
                      />
                    </div>
                    <BotaoLembrar alunoId={a.id} nome={a.nome} rotuloCurto />
                    <Button variante="secundario" tamanho="sm" onClick={() => setDarPara([{ id: a.id, nome: a.nome, iniciais: a.iniciais }])} aria-label={`Dar pontos a ${a.nome}`}>
                      <Coins />
                      <span className="hidden sm:inline">Dar pontos</span>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
          {emRisco.length > 5 && (
            <Link href="/professor/alunos?filtro=risco" className="flex items-center justify-center gap-1.5 border-t border-borda py-2.5 text-[13px] font-medium text-acento transition-colors hover:bg-superficie-2">
              Ver os {emRisco.length} alunos em risco <ArrowRight className="size-3.5" />
            </Link>
          )}
        </Card>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 text-[13px]">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {nDuvidas > 0 && (
            <Link href="/professor/duvidas" className="inline-flex items-center gap-2 text-texto-2 transition-colors hover:text-tinta">
              <CircleHelp className="size-4 text-acento" />
              <span>
                <span className="font-medium tabular-nums text-tinta">{nDuvidas}</span> {nDuvidas === 1 ? "dúvida aguardando" : "dúvidas aguardando"} resposta
              </span>
            </Link>
          )}
          {naModeracao + nRelatos > 0 && (
            <Link href="/professor/moderacao" className="inline-flex items-center gap-2 text-texto-2 transition-colors hover:text-tinta">
              <ShieldAlert className="size-4 text-alerta" />
              <span>
                <span className="font-medium tabular-nums text-tinta">{naModeracao + nRelatos}</span> na moderação
                {nRelatos > 0 && ` (${nRelatos} ${nRelatos === 1 ? "relato" : "relatos"})`}
              </span>
            </Link>
          )}
          {nTrocas > 0 && (
            <button type="button" onClick={() => setTrocasAberta(true)} className="inline-flex items-center gap-2 text-texto-2 transition-colors hover:text-tinta">
              <PackageCheck className="size-4 text-ambar" />
              <span>
                <span className="font-medium tabular-nums text-tinta">{nTrocas}</span> {nTrocas === 1 ? "troca" : "trocas"} para entregar
              </span>
            </button>
          )}
        </div>
        <Link href="/professor/estatisticas" className="inline-flex items-center gap-1 font-medium text-acento hover:underline">
          Ver estatísticas <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <DarPontosSheet alunos={darPara} onFechar={() => setDarPara(null)} />
      <NovaAtividadeSheet
        aberto={novaAberta}
        onFechar={() => setNovaAberta(false)}
        onCriada={(id) => {
          setNovaAberta(false);
          router.push(`/professor/atividades/${id}`);
        }}
      />
      <AvisoSheet aberto={avisoAberto} onFechar={() => setAvisoAberto(false)} />
      <TrocasSheet aberto={trocasAberta} onFechar={() => setTrocasAberta(false)} />
      <CriarCampeonatoSheet aberto={campAberto} onFechar={() => setCampAberto(false)} />
    </div>
  );
}
