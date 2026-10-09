"use client";

import { ArrowLeft, ChevronRight, Coins, FileDown, Flame } from "lucide-react";
import Link from "next/link";
import { ICONE_ATIVIDADE, fmtNota } from "@/components/atividades/comum";
import { Avatar } from "@/components/ui/Avatar";
import { LinkPessoa } from "@/components/ui/LinkPessoa";
import { Badge } from "@/components/ui/Badge";
import { TituloSecao } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { RodapeSheet } from "@/components/ui/RodapeSheet";
import { Sheet } from "@/components/ui/Sheet";
import { DISCIPLINAS } from "@/data/escola";
import { useAgora } from "@/hooks/useAgora";
import { formatarMinutos } from "@/lib/estudos";
import { fmt, primeiroNome } from "@/lib/format";
import { tempoRelativo } from "@/lib/tempo";
import { ultimoAcesso, type AlunoPainel } from "@/lib/turmas";
import { useEstado, useSeletor } from "@/store/store";
import { AoVivo, BotaoLembrar, FaixaNumeros, RiscoBadge } from "./comum";
import { DarPontosForm } from "./DarPontosSheet";
import { baixarBoletim } from "./relatorios";

export type ModoAluno = "perfil" | "pontos";

/** Ficha do aluno: métricas, domínio, minutos da semana, atividades e reconhecimentos. */
export function AlunoSheet({ aluno, modo, onModo, onFechar }: { aluno: AlunoPainel | null; modo: ModoAluno; onModo: (m: ModoAluno) => void; onFechar: () => void }) {
  const pontos = modo === "pontos";
  return (
    <Sheet
      aberto={!!aluno}
      onFechar={onFechar}
      titulo={pontos ? "Dar pontos e XP" : (aluno?.nome ?? "")}
      subtitulo={aluno ? (pontos ? `Para ${aluno.nome}` : `${aluno.turma} · ${ultimoAcesso(aluno.ultimoAcessoHa)}`) : undefined}
      largura="lg"
    >
      {aluno &&
        (pontos ? (
          <div className="space-y-4">
            <button type="button" onClick={() => onModo("perfil")} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-texto-2 transition-colors hover:text-tinta">
              <ArrowLeft className="size-3.5" /> Voltar à ficha de {primeiroNome(aluno.nome)}
            </button>
            <DarPontosForm alunos={[aluno]} onCancelar={() => onModo("perfil")} onConcluir={() => onModo("perfil")} />
          </div>
        ) : (
          <Ficha aluno={aluno} onDarPontos={() => onModo("pontos")} />
        ))}
    </Sheet>
  );
}

function Ficha({ aluno: a, onDarPontos }: { aluno: AlunoPainel; onDarPontos: () => void }) {
  const agora = useAgora(60_000);
  const atividades = useSeletor((e) => e.atividades);
  const atribuicoes = useSeletor((e) => e.atribuicoes);
  const pessoas = useSeletor((e) => e.pessoas);
  const estado = useEstado();

  const ordenadas = [...DISCIPLINAS].sort((x, y) => a.dominio[y] - a.dominio[x]);
  const melhor = ordenadas[0];
  const pior = ordenadas[ordenadas.length - 1];
  const daTurma = atividades
    .filter((at) => at.turma === a.turma)
    .map((at) => ({ at, e: at.entregas.find((x) => x.alunoId === a.id) }))
    .filter((x) => x.e)
    .sort((x, y) => y.at.prazo - x.at.prazo);
  const historico = atribuicoes.filter((x) => x.alunoId === a.id).slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3.5">
        <LinkPessoa id={a.id} rotulo={`Perfil de ${a.nome}`} className="shrink-0">
          <Avatar nome={a.nome} iniciais={a.iniciais} tamanho="lg" />
        </LinkPessoa>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <LinkPessoa id={a.id} className="text-[14px] font-medium text-tinta hover:underline">
              {a.nome}
            </LinkPessoa>
            <RiscoBadge risco={a.risco} />
            {a.aoVivo && <AoVivo />}
          </div>
          <p className="mt-1.5 text-[13px] leading-snug text-texto-2">
            {fmt(a.xp)} XP no total · {fmt(a.pontos)} pontos · {a.entregasNoPrazo}% das entregas no prazo
          </p>
        </div>
      </div>

      <FaixaNumeros
        compacta
        colunas="grid-cols-2 sm:grid-cols-4"
        itens={[
          { rotulo: "XP na semana", valor: fmt(a.xpSemana), detalhe: a.bonusXp ? `+${a.bonusXp} de bônus` : undefined },
          { rotulo: "Estudo na semana", valor: formatarMinutos(a.minutosSemana) },
          {
            rotulo: "Sequência",
            valor: (
              <span className="inline-flex items-center gap-1">
                <Flame className="size-4 text-ambar" aria-hidden />
                {a.sequencia}
              </span>
            ),
            detalhe: a.sequencia === 1 ? "dia" : "dias",
          },
          { rotulo: "Domínio médio", valor: `${a.dominioMedio}%` },
        ]}
      />

      <p className="text-[13px] leading-snug text-texto-2">
        Mais forte em <span className="font-medium text-tinta">{melhor}</span> ({a.dominio[melhor]}%) · precisa de apoio em <span className="font-medium text-tinta">{pior}</span> ({a.dominio[pior]}%).{" "}
        <Link href={`/professor/estatisticas?aluno=${a.id}`} className="font-medium text-acento hover:underline">
          Ver estatísticas do aluno
        </Link>
      </p>

      <section>
        <TituloSecao extra={a.pendentes ? `${a.pendentes} ${a.pendentes === 1 ? "pendente" : "pendentes"}` : "Nada pendente"}>Atividades</TituloSecao>
        {daTurma.length === 0 ? (
          <p className="text-[13px] text-texto-2">Nenhuma atividade publicada para a turma.</p>
        ) : (
          <ul className="divide-y divide-borda overflow-hidden rounded-xl border border-borda">
            {daTurma.map(({ at, e }) => {
              const Icone = ICONE_ATIVIDADE[at.tipo];
              return (
                <li key={at.id}>
                  <Link href={`/professor/atividades/${at.id}`} className="flex items-center gap-3 bg-superficie px-3.5 py-2.5 transition-colors duration-150 hover:bg-superficie-2">
                    <Icone className="size-4 shrink-0 text-texto-2" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium text-tinta">{at.titulo}</span>
                      <span className="block truncate text-[12px] text-texto-2">
                        {at.disciplina}
                        {e?.entregueEm ? ` · entregou ${tempoRelativo(e.entregueEm, agora)}` : ""}
                      </span>
                    </span>
                    {e?.status === "corrigida" ? (
                      <Badge tom="claro" className="tabular-nums">
                        Nota {fmtNota(e.nota ?? 0)}
                      </Badge>
                    ) : e?.status === "entregue" ? (
                      <Badge tom="neutro">Para corrigir</Badge>
                    ) : (
                      <Badge tom="contorno">Pendente</Badge>
                    )}
                    <ChevronRight className="size-4 shrink-0 text-texto-2" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <TituloSecao>Pontos e XP recebidos</TituloSecao>
        {historico.length === 0 ? (
          <p className="rounded-xl border border-dashed border-borda px-4 py-3.5 text-[13px] text-texto-2">Nenhum ponto dado ainda.</p>
        ) : (
          <ul className="divide-y divide-borda overflow-hidden rounded-xl border border-borda">
            {historico.map((h) => (
              <li key={h.id} className="flex items-start gap-3 bg-superficie px-3.5 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium leading-snug text-tinta">{h.motivo}</p>
                  <p className="text-[12px] text-texto-2">
                    {pessoas[h.professorId]?.nome ?? "Professor"} · {tempoRelativo(h.criadoEm, agora)}
                  </p>
                </div>
                <span className="shrink-0 text-right text-[12px] font-medium tabular-nums text-texto">
                  {h.pontos > 0 && <span className="block">+{h.pontos} pts</span>}
                  {h.xp > 0 && <span className="block">+{h.xp} XP</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <RodapeSheet>
        <Button variante="secundario" onClick={() => baixarBoletim(estado, a)} aria-label="Boletim em PDF">
          <FileDown /> Boletim<span className="max-sm:hidden"> (PDF)</span>
        </Button>
        <BotaoLembrar alunoId={a.id} nome={a.nome} tamanho="md" rotuloCurto />
        <Button className="min-w-0 flex-1" onClick={onDarPontos} aria-label={`Dar pontos a ${primeiroNome(a.nome)}`}>
          <Coins className="shrink-0" /> <span className="truncate">Dar pontos<span className="max-sm:hidden"> a {primeiroNome(a.nome)}</span></span>
        </Button>
      </RodapeSheet>
    </div>
  );
}
