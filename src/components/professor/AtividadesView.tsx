"use client";

import { ChevronRight, ClipboardList, Paperclip, Plus } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ICONE_ATIVIDADE, contarEntregas, prazoUrgente, textoPrazo } from "@/components/atividades/comum";
import { Badge } from "@/components/ui/Badge";
import { TituloPagina, Vazio } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Segmentado } from "@/components/ui/Segmentado";
import { ROTULO_ATIVIDADE } from "@/data/atividades";
import { useAgora } from "@/hooks/useAgora";
import { cn } from "@/lib/cn";
import { useSeletor } from "@/store/store";
import type { Atividade } from "@/store/types";
import { FaixaNumeros, OPCOES_TURMA, turmaCurta, useProfessorId } from "./comum";
import { NovaAtividadeSheet } from "./NovaAtividadeSheet";

type Situacao = "abertas" | "encerradas" | "todas";

const OPCOES_SITUACAO: { id: Situacao; rotulo: string }[] = [
  { id: "abertas", rotulo: "Abertas" },
  { id: "encerradas", rotulo: "Encerradas" },
  { id: "todas", rotulo: "Todas" },
];

const OPCOES_FILTRO_TURMA = [{ id: "todas", rotulo: "Todas", aria: "Todas as turmas" }, ...OPCOES_TURMA];

/** Colunas da lista no tablet/desktop. */
const GRADE = "md:grid md:grid-cols-[minmax(0,1fr)_168px_136px_16px] md:items-center md:gap-x-5";

/** Atividades publicadas pelo professor logado, com progresso de entrega e correção. */
export function AtividadesView() {
  const atividades = useSeletor((e) => e.atividades);
  const profId = useProfessorId();
  const agora = useAgora(60_000);
  const router = useRouter();
  const [turma, setTurma] = useState("todas");
  const [situacao, setSituacao] = useState<Situacao>("abertas");
  const [novaAberta, setNovaAberta] = useState(false);

  const minhas = atividades.filter((a) => a.professorId === profId);
  const lista = minhas
    .filter((a) => turma === "todas" || a.turma === turma)
    .filter((a) => situacao === "todas" || (situacao === "abertas" ? a.prazo >= agora : a.prazo < agora))
    .sort((a, b) => {
      // Abertas primeiro (prazo mais próximo no topo); depois as encerradas, das mais recentes.
      const abertaA = a.prazo >= agora;
      const abertaB = b.prazo >= agora;
      if (abertaA !== abertaB) return abertaA ? -1 : 1;
      return abertaA ? a.prazo - b.prazo : b.prazo - a.prazo;
    });

  const abertas = minhas.filter((a) => a.prazo >= agora).length;
  const totais = minhas.reduce(
    (s, a) => {
      const c = contarEntregas(a.entregas);
      return { corrigir: s.corrigir + c.paraCorrigir, enviadas: s.enviadas + c.enviadas, total: s.total + c.total };
    },
    { corrigir: 0, enviadas: 0, total: 0 },
  );

  return (
    <div className="space-y-5">
      <TituloPagina
        titulo="Atividades"
        descricao="Publique para a turma, acompanhe as entregas e corrija com nota."
        acao={
          <Button onClick={() => setNovaAberta(true)} className="max-sm:w-full">
            <Plus /> Nova atividade
          </Button>
        }
      />

      <FaixaNumeros
        compacta
        colunas="grid-cols-3"
        itens={[
          { rotulo: abertas === 1 ? "Aberta" : "Abertas", valor: abertas },
          { rotulo: "Para corrigir", valor: totais.corrigir },
          { rotulo: "Entregues", valor: `${Math.round((totais.enviadas / Math.max(1, totais.total)) * 100)}%` },
        ]}
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <Segmentado opcoes={OPCOES_FILTRO_TURMA} valor={turma} onChange={setTurma} grupo="prof-atividades-turma" rotulo="Filtrar por turma" tamanho="sm" className="sm:flex-[4]" />
        <Segmentado opcoes={OPCOES_SITUACAO} valor={situacao} onChange={setSituacao} grupo="prof-atividades-situacao" rotulo="Filtrar por situação" tamanho="sm" className="sm:flex-[3]" />
      </div>

      {lista.length === 0 ? (
        <Vazio
          icone={<ClipboardList />}
          titulo={situacao === "encerradas" ? "Nenhuma atividade encerrada" : "Nenhuma atividade aberta aqui"}
          descricao="Publique uma lista, quiz ou projeto: a turma é avisada na hora."
          acao={
            <Button tamanho="sm" onClick={() => setNovaAberta(true)}>
              <Plus /> Nova atividade
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-borda bg-superficie">
          <div className={cn(GRADE, "hidden h-10 border-b border-borda bg-superficie-2 px-4 text-[12px] font-medium text-texto-2 md:grid")} aria-hidden>
            <span>Atividade</span>
            <span>Entregas</span>
            <span>Situação</span>
            <span />
          </div>
          <ul className="divide-y divide-borda">
            <AnimatePresence initial={false}>
              {lista.map((a) => (
                <LinhaAtividade key={a.id} atividade={a} agora={agora} />
              ))}
            </AnimatePresence>
          </ul>
        </div>
      )}

      <NovaAtividadeSheet
        aberto={novaAberta}
        onFechar={() => setNovaAberta(false)}
        onCriada={(id) => {
          setNovaAberta(false);
          router.push(`/professor/atividades/${id}`);
        }}
      />
    </div>
  );
}

function SituacaoBadge({ paraCorrigir, enviadas }: { paraCorrigir: number; enviadas: number }) {
  if (paraCorrigir > 0) {
    return (
      <Badge tom="neutro" className="tabular-nums">
        {paraCorrigir} para corrigir
      </Badge>
    );
  }
  if (enviadas > 0) return <Badge tom="claro">Tudo corrigido</Badge>;
  return <Badge tom="contorno">Aguardando entregas</Badge>;
}

function LinhaAtividade({ atividade: a, agora }: { atividade: Atividade; agora: number }) {
  const Icone = ICONE_ATIVIDADE[a.tipo];
  const c = contarEntregas(a.entregas);
  const urgente = prazoUrgente(a.prazo, agora);

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 500, damping: 42 }}
    >
      <Link href={`/professor/atividades/${a.id}`} className={cn(GRADE, "group flex items-start gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-superficie-2")}>
        <span className="flex min-w-0 flex-1 items-start gap-3">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-superficie-2 text-texto-2 ring-1 ring-inset ring-borda">
            <Icone className="size-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-[14px] font-medium text-tinta">{a.titulo}</span>
              {a.anexo && <Paperclip className="size-3.5 shrink-0 text-texto-2" aria-label="Com anexo" />}
            </span>
            <span className="block truncate text-[12px] text-texto-2">
              {ROTULO_ATIVIDADE[a.tipo]} · {a.disciplina} · {turmaCurta(a.turma)} · <span className={cn(urgente && "text-ambar")}>{textoPrazo(a.prazo, agora)}</span>
              <span className="hidden lg:inline">
                {" "}
                · até {a.pontos} pts e {a.xp} XP
              </span>
            </span>
            {/* Celular: entregas e situação logo abaixo do título. */}
            <span className="mt-2 flex items-center gap-2.5 md:hidden">
              <ProgressBar valor={c.enviadas} max={c.total} fina rotulo={`Entregas de ${a.titulo}`} className="w-20" />
              <span className="text-[12px] tabular-nums text-texto-2">
                {c.enviadas}/{c.total}
              </span>
              <SituacaoBadge paraCorrigir={c.paraCorrigir} enviadas={c.enviadas} />
            </span>
          </span>
        </span>

        <span className="hidden md:block">
          <span className="mb-1.5 flex items-baseline justify-between text-[12px] tabular-nums text-texto-2">
            <span>
              <span className="text-tinta">
                {c.enviadas}/{c.total}
              </span>{" "}
              entregaram
            </span>
            <span>{Math.round((c.enviadas / Math.max(1, c.total)) * 100)}%</span>
          </span>
          <ProgressBar valor={c.enviadas} max={c.total} fina rotulo={`Entregas de ${a.titulo}`} />
        </span>
        <span className="hidden md:block">
          <SituacaoBadge paraCorrigir={c.paraCorrigir} enviadas={c.enviadas} />
        </span>
        <ChevronRight className="mt-2 size-4 shrink-0 text-texto-2 transition-transform duration-150 group-hover:translate-x-0.5 md:mt-0" />
      </Link>
    </motion.li>
  );
}
