"use client";

import {
  ArrowRight,
  Award,
  BookOpenCheck,
  Check,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  ClipboardPlus,
  Coins,
  DoorOpen,
  History,
  Megaphone,
  PackageCheck,
  ShieldAlert,
  Swords,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ICONE_ATIVIDADE, textoPrazo } from "@/components/atividades/comum";
import { CriarCampeonatoSheet } from "@/components/campeonatos/CriarCampeonatoSheet";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Badge, type TomBadge } from "@/components/ui/Badge";
import { TituloPagina, TituloSecao } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Segmentado } from "@/components/ui/Segmentado";
import { PROFESSOR } from "@/data/professor";
import { useAgora } from "@/hooks/useAgora";
import { useSessao } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { formatarMinutos } from "@/lib/estudos";
import { fmt, primeiroNome } from "@/lib/format";
import { tempoRelativo } from "@/lib/tempo";
import {
  alunosDoPainel,
  atividadesParaCorrigir,
  atribuicoesRecentes,
  destaquesDaSemana,
  duvidasPendentes,
  relatosPendentes,
  resumoDaTurma,
  trocasPendentes,
  ultimoAcesso,
} from "@/lib/turmas";
import { useEstado } from "@/store/store";
import { AvisoSheet } from "./AvisoSheet";
import { BotaoLembrar, LinkBotao, Metadados, OPCOES_TURMA, PessoaLink, VazioLista, definirTurma, useProfessorId, useTurmaProfessor } from "./comum";
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

/** Indicador do Painel: o texto quebra de linha em vez de ser cortado com reticências. */
function Numero({ href, rotulo, children, detalhe, alerta, className }: { href: string; rotulo: string; children: ReactNode; detalhe: string; alerta?: boolean; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "group min-w-0 rounded-2xl border border-borda bg-superficie p-4 transition-[background-color,transform] duration-150 hover:bg-superficie-2 active:scale-[0.98] lg:p-3.5 xl:p-4",
        className,
      )}
    >
      <p className="text-[13px] leading-tight text-texto-2">{rotulo}</p>
      <p className={cn("mt-1 text-[26px] font-semibold leading-tight tracking-tight tabular-nums sm:text-[28px]", alerta ? "text-alerta" : "text-tinta")}>{children}</p>
      <p className="mt-0.5 flex items-start gap-1 text-[12px] leading-snug text-texto-2">
        <span className="min-w-0">{detalhe}</span>
        <ChevronRight className="mt-px size-3.5 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
      </p>
    </Link>
  );
}

const CLASSE_ATALHO = "flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-superficie-2 active:bg-superficie-2";

/** Atalho da seção "Comunidade e engajamento": sempre visível; o contador só aparece quando há algo esperando. */
function Atalho({
  href,
  onClick,
  icone: Icone,
  titulo,
  detalhe,
  contador = 0,
  descricaoContador,
  tom = "ambar",
}: {
  href?: string;
  onClick?: () => void;
  icone: LucideIcon;
  titulo: string;
  detalhe: string;
  contador?: number;
  descricaoContador?: string;
  tom?: TomBadge;
}) {
  const conteudo = (
    <>
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-superficie-2 text-texto-2 ring-1 ring-inset ring-borda">
        <Icone className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[14px] font-medium text-tinta">{titulo}</span>
          {contador > 0 && (
            <Badge tom={tom} className="tabular-nums">
              <span aria-hidden>{contador}</span>
              <span className="sr-only">{descricaoContador ?? `${contador} aguardando`}</span>
            </Badge>
          )}
        </span>
        <span className="block text-[12px] leading-snug text-texto-2">{detalhe}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-texto-2 lg:hidden" aria-hidden />
    </>
  );
  return href ? (
    <Link href={href} className={CLASSE_ATALHO}>
      {conteudo}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={CLASSE_ATALHO}>
      {conteudo}
    </button>
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
  const [darPara, setDarPara] = useState<{ alunos: AlvoPontos[]; motivo?: string } | null>(null);
  const [trocasAberta, setTrocasAberta] = useState(false);
  const [novaAberta, setNovaAberta] = useState(false);
  const [avisoAberto, setAvisoAberto] = useState(false);
  const [campAberto, setCampAberto] = useState(false);

  const tratamento = (sessao?.nome ?? PROFESSOR.nome).split(" ").slice(0, 2).join(" ");
  const alunos = alunosDoPainel(estado, turma, agora);
  const resumo = resumoDaTurma(alunos);
  const paraCorrigir = atividadesParaCorrigir(estado, profId, turma);
  const totalCorrigir = paraCorrigir.reduce((s, x) => s + x.quantidade, 0);
  const emRisco = alunos.filter((a) => a.risco === "alto").sort((a, b) => b.ultimoAcessoHa - a.ultimoAcessoHa);
  const destaques = destaquesDaSemana(alunos, 3);
  const recentes = atribuicoesRecentes(estado, profId, 5);
  const naModeracao = estado.posts.filter((p) => p.emRevisao || p.denuncia).length;
  const nRelatos = relatosPendentes(estado).length;
  const nDuvidas = duvidasPendentes(estado, estado.pessoas[profId]?.disciplina);
  const nTrocas = trocasPendentes(estado).length;

  const consulta = new URLSearchParams({ turma, periodo: "7" }).toString();
  const botaoAcao = "h-auto min-h-9 w-full px-3 py-2 text-[13px] leading-tight toque:min-h-11";

  return (
    <div className="space-y-6">
      <TituloPagina
        titulo={`${saudacao(agora)}, ${tratamento}`}
        descricao={agora ? `${dataPorExtenso(agora)} · ${turma}` : turma}
        acao={<Segmentado opcoes={OPCOES_TURMA} valor={turma} onChange={definirTurma} grupo="prof-painel-turma" rotulo="Turma" tamanho="sm" className="w-full sm:w-64" />}
      />

      {/* Os 5 indicadores do documento: 2 colunas no celular, uma linha no desktop. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Numero href="/professor/alunos" rotulo="Ativos hoje" detalhe={`de ${resumo.total} alunos`}>
          <AnimatedNumber valor={resumo.ativosHoje} />
        </Numero>
        <Numero href={`/professor/estatisticas?${consulta}`} rotulo="Estudo por aluno" detalhe="média em 7 dias">
          {formatarMinutos(resumo.minutosMedios)}
        </Numero>
        <Numero href="/professor/alunos" rotulo="Domínio médio" detalhe="da turma">
          <AnimatedNumber valor={resumo.dominioMedio} />%
        </Numero>
        <Numero href="/professor/alunos?filtro=risco" rotulo="Em risco" detalhe="ver alunos" alerta={resumo.emRisco > 0}>
          <AnimatedNumber valor={resumo.emRisco} />
        </Numero>
        <Numero href="/professor/atividades" rotulo="Para corrigir" detalhe="ver atividades" className="max-lg:col-span-2">
          <AnimatedNumber valor={totalCorrigir} />
        </Numero>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Ações rápidas">
        <Button variante="secundario" className={botaoAcao} onClick={() => setNovaAberta(true)}>
          <ClipboardPlus className="text-texto-2" /> Nova atividade
        </Button>
        <Button variante="secundario" className={botaoAcao} onClick={() => setAvisoAberto(true)}>
          <Megaphone className="text-texto-2" /> Publicar aviso
        </Button>
        <LinkBotao href="/estudos/salas" className={botaoAcao}>
          <DoorOpen className="text-texto-2" /> Abrir sala
        </LinkBotao>
        <Button variante="secundario" className={botaoAcao} onClick={() => setCampAberto(true)}>
          <Swords className="text-texto-2" /> Criar campeonato
        </Button>
      </div>

      {/* Sempre visível (mesmo com tudo zerado): é por aqui que o celular chega a Dúvidas, Moderação, Salas e Campeonatos. */}
      <section aria-label="Comunidade e engajamento">
        <TituloSecao>Comunidade e engajamento</TituloSecao>
        <div className="overflow-hidden rounded-2xl border border-borda bg-superficie">
          <ul className={cn("-m-px grid grid-cols-1 sm:grid-cols-2", nTrocas > 0 ? "lg:grid-cols-5" : "lg:grid-cols-4")}>
            <li className="border-l border-t border-borda">
              <Atalho href="/professor/duvidas" icone={CircleHelp} titulo="Dúvidas" detalhe="Responder aos alunos" contador={nDuvidas} descricaoContador={`${nDuvidas} ${nDuvidas === 1 ? "dúvida aguardando" : "dúvidas aguardando"} resposta`} />
            </li>
            <li className="border-l border-t border-borda">
              <Atalho
                href="/professor/moderacao"
                icone={ShieldAlert}
                titulo="Moderação"
                detalhe="Publicações e relatos"
                contador={naModeracao + nRelatos}
                tom="alerta"
                descricaoContador={`${naModeracao} ${naModeracao === 1 ? "publicação" : "publicações"} e ${nRelatos} ${nRelatos === 1 ? "relato" : "relatos"} para revisar`}
              />
            </li>
            <li className="border-l border-t border-borda">
              <Atalho href="/estudos/salas" icone={BookOpenCheck} titulo="Salas de estudo" detalhe="Abrir ou entrar em salas" />
            </li>
            <li className="border-l border-t border-borda">
              <Atalho href="/campeonatos" icone={Swords} titulo="Campeonatos" detalhe="Acompanhar e criar torneios" />
            </li>
            {nTrocas > 0 && (
              <li className="border-l border-t border-borda">
                <Atalho
                  onClick={() => setTrocasAberta(true)}
                  icone={PackageCheck}
                  titulo="Trocas"
                  detalhe="Vouchers para entregar"
                  contador={nTrocas}
                  descricaoContador={`${nTrocas} ${nTrocas === 1 ? "troca" : "trocas"} para entregar`}
                />
              </li>
            )}
          </ul>
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <section className="min-w-0">
          <TituloSecao extra={emRisco.length ? `${emRisco.length} ${emRisco.length === 1 ? "aluno" : "alunos"}` : undefined}>Precisa de atenção</TituloSecao>
          <Card semPadding className="overflow-hidden">
            {emRisco.length === 0 ? (
              <VazioLista
                icone={<Check />}
                titulo={`Ninguém em risco no ${turma}`}
                descricao="Quem sumir ou estudar pouco aparece aqui, com atalhos para lembrar e reconhecer."
                acao={<LinkBotao href="/professor/alunos">Ver os alunos</LinkBotao>}
              />
            ) : (
              <ul className="divide-y divide-borda">
                {emRisco.slice(0, 5).map((a) => (
                  <li key={a.id} className="flex items-center gap-2 px-4 py-1">
                    <PessoaLink
                      id={a.id}
                      nome={a.nome}
                      iniciais={a.iniciais}
                      className="flex-1"
                      apoio={
                        <Metadados
                          itens={[
                            <span key="acesso" className="text-alerta">
                              {ultimoAcesso(a.ultimoAcessoHa)}
                            </span>,
                            `${formatarMinutos(a.minutosSemana)} na semana`,
                          ]}
                        />
                      }
                    />
                    <BotaoLembrar alunoId={a.id} nome={a.nome} rotuloCurto />
                    <Button
                      variante="secundario"
                      tamanho="sm"
                      className="toque:h-11"
                      onClick={() => setDarPara({ alunos: [{ id: a.id, nome: a.nome, iniciais: a.iniciais }] })}
                      aria-label={`Dar pontos a ${a.nome}`}
                    >
                      <Coins />
                      <span className="hidden sm:inline">Dar pontos</span>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {emRisco.length > 5 && (
              <Link href="/professor/alunos?filtro=risco" className="flex min-h-11 items-center justify-center gap-1.5 border-t border-borda py-2.5 text-[13px] font-medium text-acento transition-colors hover:bg-superficie-2">
                Ver os {emRisco.length} alunos em risco <ArrowRight className="size-3.5" />
              </Link>
            )}
          </Card>
        </section>

        <section className="min-w-0">
          <TituloSecao extra={totalCorrigir ? `${totalCorrigir} ${totalCorrigir === 1 ? "entrega" : "entregas"}` : undefined}>Para corrigir</TituloSecao>
          <Card semPadding className="overflow-hidden">
            {paraCorrigir.length === 0 ? (
              <VazioLista
                icone={<CheckCheck />}
                titulo="Nada aguardando correção"
                descricao="Quando um aluno entregar uma atividade sua, ela aparece aqui."
                acao={
                  <Button variante="secundario" onClick={() => setNovaAberta(true)}>
                    <ClipboardPlus className="text-texto-2" /> Nova atividade
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-borda">
                {paraCorrigir.slice(0, 5).map(({ atividade: at, quantidade }) => {
                  const Icone = ICONE_ATIVIDADE[at.tipo];
                  return (
                    <li key={at.id}>
                      <Link href={`/professor/atividades/${at.id}`} className="group flex min-h-14 items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-superficie-2">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-superficie-2 text-texto-2 ring-1 ring-inset ring-borda">
                          <Icone className="size-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 text-[14px] font-medium leading-snug text-tinta">{at.titulo}</span>
                          <Metadados
                            className="block truncate text-[12px] text-texto-2"
                            itens={[
                              <span key="n" className="font-medium text-tinta tabular-nums">
                                {quantidade} para corrigir
                              </span>,
                              agora ? textoPrazo(at.prazo, agora) : null,
                            ]}
                          />
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-texto-2 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            {paraCorrigir.length > 5 && (
              <Link href="/professor/atividades" className="flex min-h-11 items-center justify-center gap-1.5 border-t border-borda py-2.5 text-[13px] font-medium text-acento transition-colors hover:bg-superficie-2">
                Ver as {paraCorrigir.length} atividades <ArrowRight className="size-3.5" />
              </Link>
            )}
          </Card>
        </section>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <section className="min-w-0">
          <TituloSecao extra="XP na semana">Destaques da semana</TituloSecao>
          <Card semPadding className="overflow-hidden">
            {destaques.length === 0 ? (
              <VazioLista icone={<Award />} titulo="Ninguém pontuou ainda esta semana" descricao="Os três alunos com mais XP aparecem aqui para você reconhecer." />
            ) : (
              <>
                <ol className="divide-y divide-borda">
                  {destaques.map((a, i) => (
                    <li key={a.id} className="flex items-center gap-3 px-4 py-1">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-superficie-2 text-[12px] font-semibold tabular-nums text-tinta ring-1 ring-inset ring-borda" aria-label={`${i + 1}º lugar`}>
                        {i + 1}
                      </span>
                      <PessoaLink id={a.id} nome={a.nome} iniciais={a.iniciais} className="flex-1" />
                      <span className="shrink-0 text-[13px] font-medium tabular-nums text-tinta">{fmt(a.xpSemana)} XP</span>
                    </li>
                  ))}
                </ol>
                <div className="border-t border-borda p-3">
                  <Button
                    className="w-full toque:h-11"
                    onClick={() =>
                      setDarPara({
                        alunos: destaques.map((a) => ({ id: a.id, nome: a.nome, iniciais: a.iniciais })),
                        motivo: "Destaque da semana",
                      })
                    }
                  >
                    <Award /> {destaques.length === 3 ? "Reconhecer os 3" : destaques.length === 1 ? `Reconhecer ${primeiroNome(destaques[0].nome)}` : `Reconhecer os ${destaques.length}`}
                  </Button>
                </div>
              </>
            )}
          </Card>
        </section>

        <section className="min-w-0">
          <TituloSecao>Atribuições recentes</TituloSecao>
          <Card semPadding className="overflow-hidden">
            {recentes.length === 0 ? (
              <VazioLista
                icone={<History />}
                titulo="Nenhum ponto dado ainda"
                descricao="Os últimos reconhecimentos e correções aparecem aqui."
                acao={<LinkBotao href="/professor/alunos">Escolher um aluno</LinkBotao>}
              />
            ) : (
              <ul className="divide-y divide-borda">
                {recentes.map((r) => {
                  const nome = estado.pessoas[r.alunoId]?.nome ?? "Aluno";
                  return (
                    <li key={r.id} className="flex items-center gap-3 px-4 py-1">
                      <PessoaLink
                        id={r.alunoId}
                        nome={nome}
                        iniciais={estado.pessoas[r.alunoId]?.iniciais}
                        className="flex-1"
                        apoio={[r.motivo, agora ? tempoRelativo(r.criadoEm, agora) : null].filter(Boolean).join(" · ")}
                      />
                      <span className="shrink-0 text-right text-[12px] font-medium tabular-nums text-texto">
                        {r.pontos > 0 && <span className="block">+{fmt(r.pontos)} pts</span>}
                        {r.xp > 0 && <span className="block">+{fmt(r.xp)} XP</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </section>
      </div>

      <Link href="/professor/estatisticas" className="inline-flex min-h-11 items-center gap-1 text-[13px] font-medium text-acento hover:underline">
        Ver estatísticas <ArrowRight className="size-3.5" />
      </Link>

      <DarPontosSheet alunos={darPara?.alunos ?? null} motivoInicial={darPara?.motivo} onFechar={() => setDarPara(null)} />
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
