"use client";

import { BellRing, CheckCheck, ChevronLeft, FileDown, FileSpreadsheet, Inbox, LockKeyhole, Paperclip, SearchX, Star, Trash2 } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { ICONE_ATIVIDADE, contarEntregas, fmtNota, lerResposta, prazoUrgente, textoPrazo } from "@/components/atividades/comum";
import { Badge } from "@/components/ui/Badge";
import { abrirAnexoDe, baixarAnexo, baixarAnexoDe } from "@/lib/materiais";
import { baixarCsv } from "@/lib/exportar";
import { baixarRelatorioAtividade, CABECALHO_NOTAS, linhasDeNotas, slugArq } from "@/components/atividades/pdfs";
import { Vazio } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DisciplinaIcon } from "@/components/ui/DisciplinaIcon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { RodapeSheet } from "@/components/ui/RodapeSheet";
import { Sheet } from "@/components/ui/Sheet";
import { ROTULO_ATIVIDADE } from "@/data/atividades";
import { alunosDaTurma } from "@/data/turmas";
import { useAgora } from "@/hooks/useAgora";
import { cn } from "@/lib/cn";
import { tempoRelativo } from "@/lib/tempo";
import { ultimoAcesso } from "@/lib/turmas";
import { excluirAtividade, lembrarPendentes } from "@/store/actions";
import { useSeletor } from "@/store/store";
import type { Atividade, Entrega, Pessoa } from "@/store/types";
import { Abas, FaixaNumeros, LinkBotao, PessoaLink, VazioLista, useProfessorId } from "./comum";
import { CorrecaoSheet, CorrigirTodasSheet } from "./CorrecaoSheet";

type Aba = "corrigir" | "corrigidas" | "pendentes";

function corDaNota(nota: number) {
  return nota >= 7 ? "text-acento" : nota >= 5 ? "text-ouro" : "text-alerta";
}

/** Detalhe da atividade: números, entregas ao vivo e correção com nota. Só o professor que a publicou vê as ações. */
export function AtividadeView({ id }: { id: string }) {
  const atividades = useSeletor((e) => e.atividades);
  const pessoas = useSeletor((e) => e.pessoas);
  const profId = useProfessorId();
  const agora = useAgora(30_000);
  const router = useRouter();
  const [aba, setAba] = useState<Aba>("corrigir");
  const [corrigindo, setCorrigindo] = useState<string | null>(null);
  const [todasAberto, setTodasAberto] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [excluida, setExcluida] = useState(false);
  const [lembrou, setLembrou] = useState(false);
  // Trava de duplo clique: Excluir não pode repetir (o 2º clique chegaria antes da navegação).
  const excluindo = useRef(false);

  const a = atividades.find((x) => x.id === id);
  if (!a) return excluida ? null : <NaoEncontrada />;
  if (a.professorId !== profId) return <DeOutroProfessor atividade={a} dono={pessoas[a.professorId]?.nome} />;

  const c = contarEntregas(a.entregas);
  const encerrada = a.prazo < agora;
  const Icone = ICONE_ATIVIDADE[a.tipo];
  const notas = a.entregas.filter((e) => e.status === "corrigida" && e.nota !== undefined).map((e) => e.nota as number);
  const media = notas.length ? notas.reduce((s, n) => s + n, 0) / notas.length : null;
  const acessos = new Map(alunosDaTurma(a.turma).map((x) => [x.id, x.ultimoAcessoHa]));

  const nome = (alunoId: string) => pessoas[alunoId]?.nome ?? "Aluno";
  const listas: Record<Aba, Entrega[]> = {
    corrigir: a.entregas.filter((e) => e.status === "entregue").sort((x, y) => (x.entregueEm ?? 0) - (y.entregueEm ?? 0)),
    corrigidas: a.entregas.filter((e) => e.status === "corrigida").sort((x, y) => (y.nota ?? 0) - (x.nota ?? 0)),
    pendentes: a.entregas.filter((e) => e.status === "pendente").sort((x, y) => nome(x.alunoId).localeCompare(nome(y.alunoId), "pt-BR")),
  };
  const fila = listas.corrigir.map((e) => e.alunoId);
  const itens = listas[aba];

  const abas = [
    {
      id: "corrigir" as const,
      rotulo: (
        <>
          <span className="sm:hidden">Corrigir</span>
          <span className="hidden sm:inline">Para corrigir</span>
        </>
      ),
      aria: "Para corrigir",
      contador: c.paraCorrigir,
    },
    { id: "corrigidas" as const, rotulo: "Corrigidas", contador: c.corrigidas },
    { id: "pendentes" as const, rotulo: "Pendentes", contador: c.pendentes },
  ];

  const lembrar = () => {
    if (lembrou) return;
    lembrarPendentes(a.id);
    setLembrou(true);
  };

  const excluir = () => {
    if (excluindo.current) return;
    excluindo.current = true;
    setExcluida(true);
    setConfirmarExclusao(false);
    excluirAtividade(a.id);
    router.push("/professor/atividades");
  };

  return (
    <div className="space-y-5">
      <VoltarAtividades />

      <header className="rounded-2xl border border-borda bg-superficie p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tom="neutro">
            <Icone /> {ROTULO_ATIVIDADE[a.tipo]}
          </Badge>
          <Badge tom="neutro">
            <DisciplinaIcon disciplina={a.disciplina} /> {a.disciplina}
          </Badge>
          <Badge tom="neutro">{a.turma}</Badge>
          <Badge tom={!encerrada && prazoUrgente(a.prazo, agora) ? "ambar" : "neutro"}>{textoPrazo(a.prazo, agora)}</Badge>
        </div>
        <h1 className="mt-3 text-[22px] font-semibold leading-snug tracking-tight text-tinta">{a.titulo}</h1>
        <p className="mt-1.5 max-w-prose text-[14px] leading-relaxed text-texto">{a.descricao}</p>

        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-texto-2">
          <span>
            Até <span className="font-medium text-tinta tabular-nums">{a.pontos}</span> pontos e <span className="font-medium text-tinta tabular-nums">{a.xp}</span> XP
          </span>
          {a.anexo && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <button
                type="button"
                onClick={() => void abrirAnexoDe(a.anexo!, { titulo: a.titulo, autor: pessoas[a.professorId]?.nome, disciplina: a.disciplina, descricao: a.descricao })}
                className="alvo-toque inline-flex min-w-0 items-center gap-1 hover:text-tinta hover:underline"
              >
                <Paperclip className="size-3.5 shrink-0" />
                <span className="truncate">{a.anexo.nome}</span>
              </button>
              <button type="button" onClick={() => void baixarAnexoDe(a.anexo!, { titulo: a.titulo, disciplina: a.disciplina, descricao: a.descricao })} className="alvo-toque font-medium text-acento hover:underline">
                Baixar
              </button>
            </span>
          )}
          <span>Publicada {tempoRelativo(a.criadaEm, agora)}</span>
          {!encerrada && c.pendentes > 0 && (
            <span className="inline-flex items-center gap-1.5 text-acento">
              <span className="size-1.5 animate-pulso rounded-full bg-verde" aria-hidden />
              Recebendo entregas
            </span>
          )}
        </p>

        <div className="mt-4 flex flex-wrap gap-x-2 gap-y-3 border-t border-borda pt-4">
          <Button tamanho="sm" onClick={() => setTodasAberto(true)} disabled={c.paraCorrigir === 0}>
            <CheckCheck /> Corrigir todas{c.paraCorrigir > 0 && ` (${c.paraCorrigir})`}
          </Button>
          <Button variante="secundario" tamanho="sm" onClick={lembrar} disabled={c.pendentes === 0 || lembrou}>
            <BellRing /> {lembrou ? "Lembrete enviado" : "Lembrar pendentes"}
          </Button>
          <Button variante="secundario" tamanho="sm" onClick={() => baixarRelatorioAtividade(a, pessoas)}>
            <FileDown /> Relatório da atividade (PDF)
          </Button>
          <Button variante="secundario" tamanho="sm" onClick={() => baixarCsv(`notas-${slugArq(a.titulo)}.csv`, CABECALHO_NOTAS, linhasDeNotas(a, pessoas))}>
            <FileSpreadsheet /> Exportar notas (CSV)
          </Button>
          <Button variante="fantasma" tamanho="sm" className="ml-auto hover:bg-red-50 hover:text-alerta" onClick={() => setConfirmarExclusao(true)}>
            <Trash2 /> Excluir
          </Button>
        </div>
      </header>

      {/* Celular: números → entregas → gráficos. Desktop largo: entregas à esquerda, números e gráficos à direita. */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px] xl:grid-rows-[auto_1fr] xl:gap-x-6 xl:gap-y-3">
        <FaixaNumeros
          className="self-start xl:col-start-2 xl:row-start-1"
          compacta
          colunas="grid-cols-2 sm:grid-cols-4 xl:grid-cols-2"
          itens={[
            {
              rotulo: "Entregaram",
              valor: (
                <>
                  {c.enviadas}
                  <span className="text-[15px] font-medium text-texto-2">/{c.total}</span>
                </>
              ),
              detalhe: `${Math.round((c.enviadas / Math.max(1, c.total)) * 100)}% da turma`,
            },
            { rotulo: "Corrigidas", valor: c.corrigidas, detalhe: c.paraCorrigir ? `${c.paraCorrigir} aguardando nota` : "nenhuma na fila" },
            { rotulo: "Pendentes", valor: c.pendentes, detalhe: encerrada ? "prazo encerrado" : "ainda no prazo" },
            { rotulo: "Média", valor: media === null ? "—" : fmtNota(Math.round(media * 10) / 10), detalhe: `${notas.length} ${notas.length === 1 ? "nota" : "notas"}` },
          ]}
        />
        <section className="min-w-0 self-start overflow-hidden rounded-2xl border border-borda bg-superficie xl:col-start-1 xl:row-span-2 xl:row-start-1">
          <Abas abas={abas} valor={aba} onChange={setAba} grupo="prof-atividade-abas" rotulo="Entregas" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${aba}-${itens.length ? "lista" : "vazia"}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16, ease: [0.2, 0, 0, 1] }}
            >
              {itens.length === 0 ? (
                <VazioAba aba={aba} encerrada={encerrada} onAba={setAba} />
              ) : (
                <ul className="divide-y divide-borda">
                  <AnimatePresence initial={false}>
                    {itens.map((e) => (
                      <LinhaEntrega
                        key={e.alunoId}
                        entrega={e}
                        atividade={a}
                        pessoa={pessoas[e.alunoId]}
                        acessoHa={acessos.get(e.alunoId)}
                        agora={agora}
                        onCorrigir={() => setCorrigindo(e.alunoId)}
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        <Card className="self-start xl:col-start-2 xl:row-start-2">
          <div className="flex items-baseline justify-between text-[13px]">
            <span className="font-medium text-tinta">Taxa de entrega</span>
            <span className="tabular-nums text-texto-2">
              {c.enviadas} de {c.total}
            </span>
          </div>
          <ProgressBar valor={c.enviadas} max={c.total} fina rotulo="Taxa de entrega" className="mt-2" />
          <Link href="/professor/estatisticas?secoes=desempenho" className="alvo-toque mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-acento hover:underline">
            Ver gráficos de notas em Estatísticas
          </Link>
        </Card>
      </div>

      <CorrecaoSheet atividade={a} alunoId={corrigindo} fila={fila} onFechar={() => setCorrigindo(null)} onProxima={setCorrigindo} />
      <CorrigirTodasSheet atividade={a} aberto={todasAberto} onFechar={() => setTodasAberto(false)} />
      <Sheet aberto={confirmarExclusao} onFechar={() => setConfirmarExclusao(false)} titulo="Excluir atividade?" subtitulo={a.titulo}>
        <p className="text-[14px] leading-relaxed text-texto">
          A atividade e as {c.enviadas} entregas saem do painel e da tela dos alunos. Pontos e XP já dados nas correções continuam com eles.
        </p>
        <RodapeSheet>
          <Button variante="secundario" className="flex-1" onClick={() => setConfirmarExclusao(false)}>
            Cancelar
          </Button>
          <Button variante="perigo" className="flex-1" onClick={excluir}>
            <Trash2 /> Excluir atividade
          </Button>
        </RodapeSheet>
      </Sheet>
    </div>
  );
}

function VazioAba({ aba, encerrada, onAba }: { aba: Aba; encerrada: boolean; onAba: (aba: Aba) => void }) {
  const ir = (destino: Aba, rotulo: string) => (
    <Button variante="secundario" tamanho="sm" onClick={() => onAba(destino)}>
      {rotulo}
    </Button>
  );
  if (aba === "corrigir") {
    return (
      <VazioLista
        icone={<CheckCheck />}
        titulo="Nada aguardando correção"
        descricao={encerrada ? "Todas as entregas já têm nota." : "Quando um aluno entregar, a entrega aparece aqui."}
        acao={ir("pendentes", "Ver quem ainda não entregou")}
      />
    );
  }
  if (aba === "corrigidas") {
    return <VazioLista icone={<Star />} titulo="Nenhuma entrega corrigida" descricao="O aluno recebe nota, feedback e pontos na hora." acao={ir("corrigir", "Ver as entregas a corrigir")} />;
  }
  return <VazioLista icone={<Inbox />} titulo="Todos entregaram" descricao="A turma inteira enviou esta atividade." acao={ir("corrigir", "Ver as entregas a corrigir")} />;
}

function LinhaEntrega({
  entrega: e,
  atividade: a,
  pessoa,
  acessoHa,
  agora,
  onCorrigir,
}: {
  entrega: Entrega;
  atividade: Atividade;
  pessoa?: Pessoa;
  acessoHa?: number;
  agora: number;
  onCorrigir: () => void;
}) {
  const nome = pessoa?.nome ?? "Aluno";
  const { texto, anexo } = lerResposta(e.resposta);
  const atrasada = !!e.entregueEm && e.entregueEm > a.prazo;
  let lateral: ReactNode;
  if (e.status === "entregue") {
    lateral = (
      <Button tamanho="sm" variante="secundario" className="toque:h-11" onClick={onCorrigir}>
        Corrigir
      </Button>
    );
  } else if (e.status === "corrigida" && e.nota !== undefined) {
    lateral = (
      <div className="text-right">
        <p className={cn("text-[18px] font-semibold leading-none tabular-nums", corDaNota(e.nota))}>{fmtNota(e.nota)}</p>
        <p className="mt-1 text-[11px] tabular-nums text-texto-2">+{e.pontos ?? Math.round((a.pontos * e.nota) / 10)} pts</p>
      </div>
    );
  } else {
    lateral = <Badge tom="contorno">Pendente</Badge>;
  }

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 500, damping: 42 }}
      className="cv-auto flex items-start gap-3 px-4 py-3.5 [contain-intrinsic-size:auto_76px]"
    >
      <div className="min-w-0 flex-1">
        <PessoaLink
          id={e.alunoId}
          nome={nome}
          iniciais={pessoa?.iniciais}
          className="-my-1.5 max-w-full"
          apoio={
            e.entregueEm ? (
              <>
                Entregou {tempoRelativo(e.entregueEm, agora)}
                {atrasada ? <span className="text-alerta"> · com atraso</span> : " · no prazo"}
              </>
            ) : (
              <>Não entregou{acessoHa !== undefined && ` · último acesso ${ultimoAcesso(acessoHa)}`}</>
            )
          }
        />
        {texto && e.status !== "pendente" && <p className="mt-1.5 line-clamp-2 pl-11 text-[13px] leading-snug text-texto">{texto}</p>}
        {(e.anexo || anexo) && (
          <span className="ml-11 mt-1.5 inline-flex max-w-[calc(100%-2.75rem)] items-center gap-1.5 rounded-md border border-borda bg-superficie-2 py-1 pl-2 pr-1 text-[12px] text-tinta">
            <Paperclip className="size-3 shrink-0 text-texto-2" />
            <span className="truncate">{e.anexo?.nome ?? anexo}</span>
            {e.anexo ? (
              <>
                <button type="button" onClick={() => void abrirAnexoDe(e.anexo!, { titulo: a.titulo })} className="alvo-toque rounded px-1.5 py-0.5 font-medium text-acento transition-colors hover:bg-superficie active:scale-95">
                  Abrir
                </button>
                <button type="button" onClick={() => void baixarAnexoDe(e.anexo!, { titulo: a.titulo })} className="alvo-toque rounded px-1.5 py-0.5 font-medium text-acento transition-colors hover:bg-superficie active:scale-95">
                  Baixar
                </button>
              </>
            ) : (
              <button type="button" onClick={() => baixarAnexo(anexo!, { titulo: a.titulo, autor: nome, disciplina: a.disciplina, texto })} className="alvo-toque rounded px-1.5 py-0.5 font-medium text-acento transition-colors hover:bg-superficie active:scale-95">
                Baixar
              </button>
            )}
          </span>
        )}
        {e.status === "corrigida" && e.feedback && <p className="mt-1.5 line-clamp-2 pl-11 text-[12.5px] leading-snug text-texto-2">“{e.feedback}”</p>}
      </div>
      <div className="shrink-0 self-center">{lateral}</div>
    </motion.li>
  );
}

function VoltarAtividades() {
  return (
    <Link href="/professor/atividades" className="inline-flex items-center gap-1 text-[13px] font-medium text-texto-2 transition-colors hover:text-tinta toque:min-h-11">
      <ChevronLeft className="size-4" /> Atividades
    </Link>
  );
}

function NaoEncontrada() {
  return (
    <div className="space-y-5">
      <VoltarAtividades />
      <Vazio
        icone={<SearchX />}
        titulo="Atividade não encontrada"
        descricao="Ela pode ter sido excluída ou o link está incorreto."
        acao={<LinkBotao href="/professor/atividades">Ver todas as atividades</LinkBotao>}
      />
    </div>
  );
}

/** Atividade publicada por outro professor: sem entregas, correção, lembrete nem exclusão. */
function DeOutroProfessor({ atividade: a, dono }: { atividade: Atividade; dono?: string }) {
  return (
    <div className="space-y-5">
      <VoltarAtividades />
      <Vazio
        icone={<LockKeyhole />}
        titulo={dono ? `Atividade de ${dono}` : "Atividade de outro professor"}
        descricao={`${a.disciplina} · ${a.turma}. Só quem a publicou vê as entregas, corrige, lembra a turma ou exclui.`}
        acao={<LinkBotao href="/professor/atividades">Voltar às atividades</LinkBotao>}
      />
    </div>
  );
}
