"use client";

import { BellRing, Coins, FileDown, Flame, Minus, Search, FileSpreadsheet, TrendingDown, TrendingUp, UsersRound, X } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { TituloPagina, Vazio } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { Entrada, Seletor } from "@/components/ui/Campo";
import { Segmentado } from "@/components/ui/Segmentado";
import { useAgora } from "@/hooks/useAgora";
import { cn } from "@/lib/cn";
import { formatarMinutos } from "@/lib/estudos";
import { fmt, normalizar } from "@/lib/format";
import { alunosDoPainel, resumoDaTurma, ultimoAcesso, type AlunoPainel } from "@/lib/turmas";
import { lembrarAlunos } from "@/store/actions";
import { useEstado } from "@/store/store";
import { toast } from "@/store/ui";
import { AlunoSheet, type ModoAluno } from "./AlunoSheet";
import { AoVivo, Caixa, Metadados, OPCOES_TURMA, RiscoBadge, definirTurma, useTurmaProfessor } from "./comum";
import { DarPontosSheet, type AlvoPontos } from "./DarPontosSheet";
import { baixarCsvTurma, baixarRelatorioTurma } from "./relatorios";

type Ordem = "nome" | "xp" | "minutos" | "risco";

const ORDENS: { id: Ordem; rotulo: string }[] = [
  { id: "risco", rotulo: "Risco primeiro" },
  { id: "nome", rotulo: "Nome (A–Z)" },
  { id: "xp", rotulo: "XP na semana" },
  { id: "minutos", rotulo: "Minutos na semana" },
];

const PESO_RISCO = { alto: 0, medio: 1, baixo: 2 } as const;

function ordenar(alunos: AlunoPainel[], ordem: Ordem) {
  const lista = [...alunos];
  if (ordem === "nome") return lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  if (ordem === "xp") return lista.sort((a, b) => b.xpSemana - a.xpSemana);
  if (ordem === "minutos") return lista.sort((a, b) => b.minutosSemana - a.minutosSemana);
  return lista.sort((a, b) => PESO_RISCO[a.risco] - PESO_RISCO[b.risco] || b.ultimoAcessoHa - a.ultimoAcessoHa);
}

/** Colunas da tabela (desktop largo). */
const GRADE = "grid grid-cols-[16px_minmax(0,1fr)_72px_136px_52px_112px_52px_92px_84px] items-center gap-x-3";

const semAcessoLongo = (a: AlunoPainel) => a.ultimoAcessoHa > 3 * 1440;

/** Lista da turma: tabela no desktop, lista no celular, seleção múltipla para dar pontos. */
export function AlunosView() {
  const estado = useEstado();
  const agora = useAgora(60_000);
  const turma = useTurmaProfessor();
  const params = useSearchParams();
  const [soRisco, setSoRisco] = useState(params.get("filtro") === "risco");
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("risco");
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [detalhe, setDetalhe] = useState<{ id: string; modo: ModoAluno } | null>(null);
  const [darPara, setDarPara] = useState<AlvoPontos[] | null>(null);

  const alunos = alunosDoPainel(estado, turma, agora);
  const resumo = resumoDaTurma(alunos);
  const termo = normalizar(busca.trim());
  const visiveis = ordenar(
    alunos.filter((a) => (!soRisco || a.risco === "alto") && (!termo || normalizar(a.nome).includes(termo))),
    ordem,
  );
  const marcados = new Set(selecionados);
  const todosVisiveis = visiveis.length > 0 && visiveis.every((a) => marcados.has(a.id));
  const algunsVisiveis = !todosVisiveis && visiveis.some((a) => marcados.has(a.id));
  const alunoDetalhe = detalhe ? (alunos.find((a) => a.id === detalhe.id) ?? null) : null;

  const trocarTurma = (t: string) => {
    definirTurma(t);
    setSelecionados([]);
  };
  const alternar = (id: string) => setSelecionados((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const alternarTodos = () => {
    const ids = visiveis.map((a) => a.id);
    setSelecionados((s) => (todosVisiveis ? s.filter((id) => !ids.includes(id)) : [...new Set([...s, ...ids])]));
  };
  const abrir = (id: string) => setDetalhe({ id, modo: "perfil" });
  const darPontosSelecionados = () => setDarPara(alunos.filter((a) => marcados.has(a.id)).map((a) => ({ id: a.id, nome: a.nome, iniciais: a.iniciais })));

  return (
    <div className={cn("space-y-5", selecionados.length > 0 && "pb-24")}>
      <TituloPagina
        titulo="Alunos"
        descricao="Engajamento, domínio e pendências de cada aluno."
        acao={<Segmentado opcoes={OPCOES_TURMA} valor={turma} onChange={trocarTurma} grupo="prof-alunos-turma" rotulo="Turma" tamanho="sm" className="w-full sm:w-64" />}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <Entrada icone={<Search />} value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={`Buscar em ${turma}…`} aria-label="Buscar aluno" type="search" />
        </div>
        <div className="sm:w-52">
          <Seletor value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} aria-label="Ordenar por">
            {ORDENS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.rotulo}
              </option>
            ))}
          </Seletor>
        </div>
      </div>

      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-texto-2">
        <Metadados
          itens={[
            <span className="whitespace-nowrap" key="t">
              <span className="font-medium text-tinta tabular-nums">{resumo.total}</span> alunos
            </span>,
            <span className="whitespace-nowrap" key="r">
              <span className={cn("font-medium tabular-nums", resumo.emRisco ? "text-alerta" : "text-tinta")}>{resumo.emRisco}</span> em risco
            </span>,
            <span className="whitespace-nowrap" key="a">
              <span className="font-medium text-tinta tabular-nums">{resumo.ativosHoje}</span> ativos hoje
            </span>,
            <span className="whitespace-nowrap" key="m">
              média <span className="font-medium text-tinta tabular-nums">{formatarMinutos(resumo.mediaMinutosSemana)}</span>/semana
            </span>,
          ]}
        />
        <button
          type="button"
          onClick={() => setSoRisco((v) => !v)}
          aria-pressed={soRisco}
          className={cn("rounded-full border px-2.5 py-0.5 text-[12px] font-medium transition-colors", soRisco ? "border-alerta text-alerta" : "border-borda text-texto-2 hover:text-tinta")}
        >
          Só em risco
        </button>
        {(termo || soRisco) && (
          <span className="ml-auto">
            {visiveis.length} {visiveis.length === 1 ? "resultado" : "resultados"}
          </span>
        )}
      </p>

      <div className="flex flex-wrap gap-2">
        <Button variante="secundario" tamanho="sm" onClick={() => baixarRelatorioTurma(estado, turma, alunos)}>
          <FileDown /> Relatório da turma (PDF)
        </Button>
        <Button variante="secundario" tamanho="sm" onClick={() => baixarCsvTurma(estado, turma, alunos)}>
          <FileSpreadsheet /> Exportar turma (CSV)
        </Button>
      </div>

      {visiveis.length === 0 ? (
        <Vazio
          icone={<UsersRound />}
          titulo="Nenhum aluno encontrado"
          descricao={`Nenhum resultado em ${turma} com esses filtros.`}
          acao={
            <Button
              variante="secundario"
              tamanho="sm"
              onClick={() => {
                setBusca("");
                setSoRisco(false);
              }}
            >
              Limpar filtros
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop largo: tabela com cabeçalho fixo. */}
          <div role="table" aria-label={`Alunos do ${turma}`} className="hidden rounded-2xl border border-borda bg-superficie xl:block">
            <div role="rowgroup" className="sticky top-14 z-20 rounded-t-2xl border-b border-borda bg-superficie-2">
              <div role="row" className={cn(GRADE, "h-10 px-4 text-[12px] font-medium text-texto-2")}>
                <span role="columnheader">
                  <Caixa marcada={todosVisiveis} mista={algunsVisiveis} onChange={alternarTodos} rotulo="Selecionar todos" />
                </span>
                <span role="columnheader">Aluno</span>
                <span role="columnheader" className="text-right">
                  XP sem.
                </span>
                <span role="columnheader">Estudo · 7 dias</span>
                <span role="columnheader" className="text-right" title="Sequência de dias">
                  Seq.
                </span>
                <span role="columnheader">Domínio</span>
                <span role="columnheader" className="text-center" title="Atividades pendentes">
                  Pend.
                </span>
                <span role="columnheader">Situação</span>
                <span role="columnheader" className="text-right">
                  Acesso
                </span>
              </div>
            </div>
            <div role="rowgroup" className="divide-y divide-borda">
              {visiveis.map((a) => (
                <LinhaAluno key={a.id} aluno={a} marcado={marcados.has(a.id)} onMarcar={() => alternar(a.id)} onAbrir={() => abrir(a.id)} />
              ))}
            </div>
          </div>

          {/* Celular, tablet e desktop estreito: lista num card só. */}
          <div className="overflow-hidden rounded-2xl border border-borda bg-superficie xl:hidden">
            <div className="flex items-center gap-3 border-b border-borda bg-superficie-2 px-4 py-2.5">
              <Caixa marcada={todosVisiveis} mista={algunsVisiveis} onChange={alternarTodos} rotulo="Selecionar todos" />
              <span className="text-[12px] font-medium text-texto-2">Selecionar todos</span>
            </div>
            <ul className="divide-y divide-borda">
              {visiveis.map((a) => (
                <ItemAluno key={a.id} aluno={a} marcado={marcados.has(a.id)} onMarcar={() => alternar(a.id)} onAbrir={() => abrir(a.id)} />
              ))}
            </ul>
          </div>
        </>
      )}

      <AnimatePresence>
        {selecionados.length > 0 && (
          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
            className="coluna-fixa bottom-[calc(var(--base-inferior)+0.75rem)] z-40 px-4 sm:px-6 lg:px-8"
          >
            <div className="flex items-center gap-2 rounded-xl border border-borda bg-superficie p-2 pl-4 shadow-flutuante">
              <p className="min-w-0 flex-1 truncate text-[13px] text-texto-2">
                <span className="font-medium text-tinta tabular-nums">{selecionados.length}</span> {selecionados.length === 1 ? "selecionado" : "selecionados"}
              </p>
              <Button variante="fantasma" tamanho="sm" onClick={() => setSelecionados([])} aria-label="Limpar seleção">
                <X /> <span className="hidden sm:inline">Limpar</span>
              </Button>
              <Button
                variante="secundario"
                tamanho="sm"
                onClick={() => {
                  if (lembrarAlunos(selecionados) === 0) toast({ tipo: "info", titulo: "Já lembrados há menos de 6 h" }, 2400);
                }}
              >
                <BellRing /> Lembrar
              </Button>
              <Button tamanho="sm" onClick={darPontosSelecionados}>
                <Coins /> Dar pontos/XP
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AlunoSheet aluno={alunoDetalhe} modo={detalhe?.modo ?? "perfil"} onModo={(modo) => setDetalhe((d) => (d ? { ...d, modo } : d))} onFechar={() => setDetalhe(null)} />
      <DarPontosSheet alunos={darPara} onFechar={() => setDarPara(null)} onConcluir={() => setSelecionados([])} />
    </div>
  );
}

interface PropsLinha {
  aluno: AlunoPainel;
  marcado: boolean;
  onMarcar: () => void;
  onAbrir: () => void;
}

/** Tendência simples: últimos 3 dias contra os 4 anteriores. */
function Tendencia({ valores }: { valores: number[] }) {
  const recente = valores.slice(4).reduce((s, v) => s + v, 0) / 3;
  const antes = valores.slice(0, 4).reduce((s, v) => s + v, 0) / 4;
  const sobe = recente > antes * 1.15;
  const desce = recente < antes * 0.85;
  const Icone = sobe ? TrendingUp : desce ? TrendingDown : Minus;
  return <Icone className={cn("size-3.5", sobe ? "text-acento" : desce ? "text-alerta" : "text-texto-2/50")} aria-label={sobe ? "Em alta" : desce ? "Em queda" : "Estável"} />;
}

function BarraDominio({ valor }: { valor: number }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-borda">
        <span className={cn("block h-full rounded-full", valor >= 70 ? "bg-verde" : valor >= 50 ? "bg-texto-2/45" : "bg-ambar")} style={{ width: `${valor}%` }} />
      </span>
      <span className="w-8 text-right text-[12px] tabular-nums text-texto">{valor}%</span>
    </span>
  );
}

function LinhaAluno({ aluno: a, marcado, onMarcar, onAbrir }: PropsLinha) {
  return (
    <div
      role="row"
      aria-selected={marcado}
      onClick={onAbrir}
      className={cn(
        GRADE,
        "cv-auto h-14 cursor-pointer px-4 text-[13px] transition-colors duration-150 last:rounded-b-2xl [contain-intrinsic-size:auto_56px]",
        marcado ? "bg-verde-mclaro" : "hover:bg-superficie-2",
      )}
    >
      <span role="cell">
        <Caixa marcada={marcado} onChange={onMarcar} rotulo={`Selecionar ${a.nome}`} />
      </span>
      <span role="cell" className="flex min-w-0 items-center gap-2.5">
        <Avatar nome={a.nome} iniciais={a.iniciais} tamanho="sm" ativo={a.aoVivo} />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAbrir();
          }}
          className="min-w-0 truncate text-left text-[14px] font-medium text-tinta hover:underline focus-visible:underline focus-visible:outline-none"
        >
          {a.nome}
        </button>
        {a.aoVivo && <AoVivo className="shrink-0" />}
      </span>
      <span role="cell" className="text-right tabular-nums text-tinta">
        {fmt(a.xpSemana)}
      </span>
      <span role="cell" className="flex items-center gap-2">
        <span className="text-[12px] tabular-nums text-texto">{formatarMinutos(a.minutosSemana)}</span>
        <Tendencia valores={a.minutos7d} />
      </span>
      <span role="cell" className={cn("inline-flex items-center justify-end gap-1 tabular-nums", a.sequencia ? "text-tinta" : "text-texto-2/60")}>
        <Flame className={cn("size-3.5", a.sequencia ? "text-ambar" : "text-texto-2/50")} aria-hidden />
        {a.sequencia}
      </span>
      <span role="cell">
        <BarraDominio valor={a.dominioMedio} />
      </span>
      <span role="cell" className={cn("text-center tabular-nums", a.pendentes ? "text-tinta" : "text-texto-2/60")}>
        {a.pendentes || "—"}
      </span>
      <span role="cell">
        <RiscoBadge risco={a.risco} />
      </span>
      <span role="cell" className={cn("text-right text-[12px] tabular-nums", semAcessoLongo(a) ? "text-alerta" : "text-texto-2")}>
        {ultimoAcesso(a.ultimoAcessoHa)}
      </span>
    </div>
  );
}

function ItemAluno({ aluno: a, marcado, onMarcar, onAbrir }: PropsLinha) {
  return (
    <li className={cn("cv-auto flex items-center gap-3 px-4 py-3 transition-colors duration-150 [contain-intrinsic-size:auto_84px]", marcado ? "bg-verde-mclaro" : "hover:bg-superficie-2")}>
      <Caixa marcada={marcado} onChange={onMarcar} rotulo={`Selecionar ${a.nome}`} />
      <button type="button" onClick={onAbrir} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`Abrir ficha de ${a.nome}`}>
        <Avatar nome={a.nome} iniciais={a.iniciais} tamanho="md" ativo={a.aoVivo} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-[14px] font-medium text-tinta">{a.nome}</span>
            {a.aoVivo && <AoVivo className="shrink-0" />}
            {a.risco !== "baixo" && <RiscoBadge risco={a.risco} className="ml-auto shrink-0" />}
          </span>
          <Metadados
            className="block truncate text-[12px] text-texto-2"
            itens={[
              <span key="acesso" className={cn(semAcessoLongo(a) && "text-alerta")}>
                {ultimoAcesso(a.ultimoAcessoHa)}
              </span>,
              a.pendentes > 0 && `${a.pendentes} ${a.pendentes === 1 ? "pendência" : "pendências"}`,
            ]}
          />
          <span className="mt-1 flex items-center gap-x-3 whitespace-nowrap text-[12px] tabular-nums text-texto-2">
            <span>
              <span className="text-tinta">{fmt(a.xpSemana)}</span> XP
            </span>
            <span title="Estudo na semana">
              <span className="text-tinta">{formatarMinutos(a.minutosSemana)}</span>
            </span>
            <span className="inline-flex items-center gap-0.5" title="Sequência de dias">
              <Flame className={cn("size-3", a.sequencia ? "text-ambar" : "text-texto-2/50")} aria-hidden />
              <span className="text-tinta">{a.sequencia}</span>
            </span>
            <span title="Domínio médio">
              <span className="text-tinta">{a.dominioMedio}%</span> domínio
            </span>
          </span>
        </span>
      </button>
    </li>
  );
}
