"use client";

import { Bell, BellRing, CalendarClock, CalendarPlus, ChevronLeft, ChevronRight, Download, MapPin, TriangleAlert } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { EVENTOS, inicioDoEvento, LIMITE_SEMANA_CHEIA, ROTULO_EVENTO, type EventoBase, type TipoEvento } from "@/data/calendario";
import { useAgora } from "@/hooks/useAgora";
import { cn } from "@/lib/cn";
import { baixarIcs, type EventoIcs } from "@/lib/exportar";
import { inicioDoDia, NOMES_DIAS, somarDias } from "@/lib/tempo";
import { ANTECEDENCIA_LEMBRETE_MIN, alternarLembreteEvento } from "@/store/acoes/aluno";
import { useSeletor } from "@/store/store";

/** Ponto colorido por tipo (grade, legenda e lista usam a mesma leitura). */
const PONTO: Record<TipoEvento, string> = { prova: "bg-verde", trabalho: "bg-texto-2", prazo: "bg-ambar", evento: "bg-cepi" };
const DIA = 86_400_000;

const paraIcs = (e: EventoBase & { inicio: number }): EventoIcs => ({
  id: e.id,
  titulo: e.titulo,
  inicio: e.inicio,
  local: e.local,
  descricao: `${ROTULO_EVENTO[e.tipo]}${e.disciplina ? ` de ${e.disciplina}` : ""} · Portal do Aluno CEPI`,
  lembreteMin: ANTECEDENCIA_LEMBRETE_MIN,
});

/**
 * Calendário único de provas, trabalhos e prazos (EP02 / US04).
 * O alerta de "semana cheia" é uma REGRA determinística, não uma previsão de IA.
 */
export function CalendarioSheet({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo="Calendário" subtitulo="Provas, trabalhos e prazos" largura="lg">
      <Conteudo />
    </Sheet>
  );
}

/** Só existe com o modal aberto: relógio e seleção nascem a cada abertura (volta sempre para o mês atual). */
function Conteudo() {
  const agora = useAgora(60_000);
  const lembretes = useSeletor((e) => e.lembretes);
  const hoje = inicioDoDia(agora);
  const [selecionado, setSelecionado] = useState<number | null>(null);
  /** 0 = mês atual; os eventos da semana podem cair no mês seguinte. */
  const [deslocamentoMes, setDeslocamentoMes] = useState(0);

  const eventos = EVENTOS.map((e) => ({ ...e, dia: somarDias(hoje, e.emDias), inicio: inicioDoEvento(e, hoje) }));
  const avaliacoesSemana = eventos.filter((e) => e.emDias <= 7 && (e.tipo === "prova" || e.tipo === "trabalho"));
  const semanaCheia = avaliacoesSemana.length >= LIMITE_SEMANA_CHEIA;

  // Grade do mês começando na segunda-feira.
  const base = new Date(hoje);
  const primeiro = new Date(base.getFullYear(), base.getMonth() + deslocamentoMes, 1);
  const inicioMes = primeiro.getTime();
  const vazios = (primeiro.getDay() + 6) % 7;
  const diasNoMes = new Date(primeiro.getFullYear(), primeiro.getMonth() + 1, 0).getDate();
  const celulas: (number | null)[] = [...Array<null>(vazios).fill(null), ...Array.from({ length: diasNoMes }, (_, i) => somarDias(inicioMes, i))];
  const nomeMes = primeiro.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const lista = selecionado ? eventos.filter((e) => e.dia === selecionado) : eventos;

  const trocarMes = (passo: number) => {
    setSelecionado(null);
    setDeslocamentoMes((d) => d + passo);
  };

  return (
    <>
      {semanaCheia && (
        <p
          role="status"
          title={`Regra automática: com ${LIMITE_SEMANA_CHEIA} ou mais avaliações na semana, o portal avisa você.`}
          className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-[13px] leading-snug text-amber-900"
        >
          <TriangleAlert className="mt-px size-4 shrink-0 text-ambar" />
          <span>
            <span className="font-medium">Semana cheia:</span> {avaliacoesSemana.length} avaliações e entregas nos próximos 7 dias.
          </span>
        </p>
      )}

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-5">
        {/* Mês */}
        <div className="rounded-2xl border border-borda bg-superficie p-3 lg:sticky lg:top-0">
          <div className="mb-2 flex items-center justify-between gap-2 px-1">
            <p className="text-[15px] font-semibold text-tinta first-letter:uppercase" aria-live="polite">
              {nomeMes}
            </p>
            <div className="flex items-center gap-0.5">
              {deslocamentoMes !== 0 && (
                <button
                  type="button"
                  onClick={() => trocarMes(-deslocamentoMes)}
                  className="mr-1 h-8 rounded-lg border border-borda px-2.5 text-[12.5px] font-medium text-tinta transition-colors hover:bg-superficie-2"
                >
                  Hoje
                </button>
              )}
              <button
                type="button"
                onClick={() => trocarMes(-1)}
                aria-label="Mês anterior"
                className="grid size-8 place-items-center rounded-lg text-texto-2 transition-colors hover:bg-superficie-2 hover:text-tinta active:scale-95"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => trocarMes(1)}
                aria-label="Próximo mês"
                className="grid size-8 place-items-center rounded-lg text-texto-2 transition-colors hover:bg-superficie-2 hover:text-tinta active:scale-95"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {NOMES_DIAS.map((d) => (
              <span key={d} className="pb-1 text-[11.5px] text-texto-2">
                {d.slice(0, 3)}
              </span>
            ))}
            {celulas.map((dia, i) => {
              if (!dia) return <span key={`v${i}`} />;
              const doDia = eventos.filter((e) => e.dia === dia);
              const ehHoje = dia === hoje;
              const ativo = dia === selecionado;
              return (
                <button
                  key={dia}
                  type="button"
                  onClick={() => setSelecionado(ativo ? null : dia)}
                  aria-pressed={ativo}
                  aria-label={`${new Date(dia).getDate()}${ehHoje ? ", hoje" : ""}${doDia.length ? `, ${doDia.length} compromisso(s)` : ""}`}
                  className={cn(
                    "relative flex aspect-square flex-col items-center justify-center rounded-lg text-[13px] tabular-nums transition-colors duration-150",
                    ativo
                      ? "bg-tinta font-medium text-superficie"
                      : ehHoje
                        ? "font-semibold text-acento ring-1 ring-inset ring-verde"
                        : dia < hoje
                          ? "text-texto-2/50 hover:bg-superficie-2"
                          : "text-texto hover:bg-superficie-2",
                  )}
                >
                  {new Date(dia).getDate()}
                  {doDia.length > 0 && (
                    <span className="absolute bottom-1 flex gap-0.5">
                      {doDia.slice(0, 3).map((e) => (
                        <span key={e.id} className={cn("size-1 rounded-full", ativo ? "bg-superficie" : PONTO[e.tipo])} />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-borda px-1 pt-2.5 text-[12px] text-texto-2" aria-label="Legenda">
            {(Object.keys(PONTO) as TipoEvento[]).map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <span className={cn("size-1.5 rounded-full", PONTO[t])} />
                {ROTULO_EVENTO[t]}
              </li>
            ))}
          </ul>
        </div>

        {/* Compromissos */}
        <div className="mt-5 lg:mt-0">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <h3 className="text-[14px] font-semibold text-tinta first-letter:uppercase">
              {selecionado ? new Date(selecionado).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }) : "Próximos compromissos"}
            </h3>
            <div className="flex items-center gap-3">
              {selecionado && (
                <button type="button" onClick={() => setSelecionado(null)} className="rounded-md text-[13px] font-medium text-texto-2 transition-colors hover:text-tinta">
                  Ver todos
                </button>
              )}
              <button
                type="button"
                onClick={() => baixarIcs("agenda-portal-do-aluno", eventos.map(paraIcs), "Agenda do Portal do Aluno")}
                className="inline-flex items-center gap-1 rounded-md text-[13px] font-medium text-acento transition-colors hover:underline"
              >
                <Download className="size-3.5" /> Exportar agenda (.ics)
              </button>
            </div>
          </div>

          <ul className="divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-superficie">
            <AnimatePresence initial={false}>
              {lista.length === 0 && (
                <motion.li
                  key="vazio"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-4 py-8 text-center text-[13.5px] text-texto-2"
                >
                  Nenhum compromisso neste dia.
                </motion.li>
              )}
              {lista.map((e) => {
                const lembrete = lembretes.includes(e.id);
                const faltam = Math.round((e.dia - hoje) / DIA);
                return (
                  <motion.li
                    key={e.id}
                    layout="position"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                    className="flex items-start gap-3 px-3.5 py-3 transition-colors duration-150 hover:bg-superficie-2"
                  >
                    <div className="grid w-10 shrink-0 place-items-center rounded-lg border border-borda py-1 text-center">
                      <span className="text-[10.5px] capitalize leading-4 text-texto-2">
                        {new Date(e.dia).toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}
                      </span>
                      <span className="text-[15px] font-semibold leading-5 tabular-nums text-tinta">{new Date(e.dia).getDate()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-texto-2">
                        <span className={cn("size-1.5 shrink-0 rounded-full", PONTO[e.tipo])} aria-hidden />
                        {ROTULO_EVENTO[e.tipo]}
                        <span aria-hidden>·</span>
                        <span className={cn(faltam <= 2 && "font-medium text-tinta")}>
                          {faltam === 0 ? "hoje" : faltam === 1 ? "amanhã" : `em ${faltam} dias`}
                        </span>
                      </p>
                      <p className="mt-0.5 text-[14px] font-medium leading-snug text-tinta">{e.titulo}</p>
                      <p className="mt-0.5 flex min-w-0 items-center gap-2 text-[12.5px] text-texto-2">
                        <span className="inline-flex shrink-0 items-center gap-1 tabular-nums">
                          <CalendarClock className="size-3.5" /> {e.hora}
                        </span>
                        {e.local && (
                          <span className="inline-flex min-w-0 items-center gap-1">
                            <MapPin className="size-3.5 shrink-0" /> <span className="truncate">{e.local}</span>
                          </span>
                        )}
                      </p>
                      <button
                        type="button"
                        onClick={() => baixarIcs(`evento-${e.id}`, [paraIcs(e)])}
                        className="mt-1.5 inline-flex items-center gap-1 rounded-md text-[12.5px] font-medium text-acento transition-colors hover:underline"
                      >
                        <CalendarPlus className="size-3.5" /> Adicionar ao meu calendário
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => alternarLembreteEvento({ id: e.id, titulo: e.titulo, inicio: e.inicio })}
                      aria-pressed={lembrete}
                      aria-label={lembrete ? "Desativar lembrete" : "Ativar lembrete"}
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-full transition-colors duration-150 active:scale-95",
                        lembrete ? "bg-verde-claro text-acento" : "text-texto-2 hover:bg-superficie-2 hover:text-tinta",
                      )}
                    >
                      {lembrete ? <BellRing className="size-4" /> : <Bell className="size-4" />}
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </div>
      </div>
    </>
  );
}
