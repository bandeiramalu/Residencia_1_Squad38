"use client";

import { Bell, BellRing, CalendarClock, MapPin, TriangleAlert } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Badge, type TomBadge } from "@/components/ui/Badge";
import { Nota } from "@/components/ui/Blocos";
import { Sheet } from "@/components/ui/Sheet";
import { EVENTOS, LIMITE_SEMANA_CHEIA, ROTULO_EVENTO, type TipoEvento } from "@/data/calendario";
import { useAgora } from "@/hooks/useAgora";
import { cn } from "@/lib/cn";
import { inicioDoDia, NOMES_DIAS, somarDias } from "@/lib/tempo";
import { alternarLembrete } from "@/store/actions";
import { useEstado } from "@/store/store";

const TOM: Record<TipoEvento, TomBadge> = { prova: "verde", trabalho: "claro", prazo: "ambar", evento: "azul" };
const DIA = 86_400_000;

/**
 * Calendário único de provas, trabalhos e prazos (EP02 / US04).
 * O alerta de "semana cheia" é uma REGRA determinística, não uma previsão de IA.
 */
export function CalendarioSheet({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const agora = useAgora(60_000);
  const { lembretes } = useEstado();
  const hoje = inicioDoDia(agora);
  const [selecionado, setSelecionado] = useState<number | null>(null);

  const eventos = useMemo(() => EVENTOS.map((e) => ({ ...e, dia: somarDias(hoje, e.emDias) })), [hoje]);
  const avaliacoesSemana = eventos.filter((e) => e.emDias <= 7 && (e.tipo === "prova" || e.tipo === "trabalho"));
  const semanaCheia = avaliacoesSemana.length >= LIMITE_SEMANA_CHEIA;

  // Grade do mês corrente começando na segunda-feira.
  const mes = useMemo(() => {
    const d = new Date(hoje);
    const primeiro = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    const deslocamento = (new Date(primeiro).getDay() + 6) % 7;
    const diasNoMes = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const celulas: (number | null)[] = Array(deslocamento).fill(null);
    for (let i = 0; i < diasNoMes; i++) celulas.push(somarDias(primeiro, i));
    return { celulas, nome: d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) };
  }, [hoje]);

  const lista = selecionado ? eventos.filter((e) => e.dia === selecionado) : eventos;

  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo="Calendário" subtitulo="Provas, trabalhos e prazos em um só lugar">
      {semanaCheia && (
        <Nota icone={<TriangleAlert />} tom="branco" className="mb-4 border-amber-200 bg-amber-50/70 [&_svg]:text-ambar!">
          <b className="text-tinta">Semana cheia:</b> {avaliacoesSemana.length} avaliações e entregas nos próximos 7 dias. Organize seus
          estudos com antecedência.
          <span className="mt-1 block text-[11px]">
            Regra automática: com {LIMITE_SEMANA_CHEIA} ou mais avaliações na semana, o portal avisa você.
          </span>
        </Nota>
      )}

      <div className="rounded-2xl border border-borda p-3">
        <p className="mb-2 px-1 text-sm font-bold capitalize text-tinta">{mes.nome}</p>
        <div className="grid grid-cols-7 gap-1 text-center">
          {NOMES_DIAS.map((d) => (
            <span key={d} className="pb-1 text-[10px] font-semibold uppercase text-texto-2">
              {d.slice(0, 3)}
            </span>
          ))}
          {mes.celulas.map((dia, i) => {
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
                aria-label={`${new Date(dia).getDate()}${doDia.length ? `, ${doDia.length} compromisso(s)` : ""}`}
                className={cn(
                  "relative flex aspect-square flex-col items-center justify-center rounded-xl text-[13px] font-semibold transition-colors",
                  ativo ? "bg-verde text-white" : ehHoje ? "bg-verde-claro text-verde" : dia < hoje ? "text-texto-2/50" : "text-texto hover:bg-verde-mclaro",
                )}
              >
                {new Date(dia).getDate()}
                {doDia.length > 0 && (
                  <span className="absolute bottom-1 flex gap-0.5">
                    {doDia.slice(0, 3).map((e) => (
                      <span key={e.id} className={cn("size-1 rounded-full", ativo ? "bg-white" : e.tipo === "prova" ? "bg-verde" : "bg-verde-2/60")} />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-2 mt-5 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-verde">
          {selecionado ? new Date(selecionado).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }) : "Próximos compromissos"}
        </h3>
        {selecionado && (
          <button type="button" onClick={() => setSelecionado(null)} className="text-xs font-semibold text-verde-2 hover:underline">
            Ver todos
          </button>
        )}
      </div>

      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {lista.length === 0 && (
            <motion.li initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-verde-mclaro p-4 text-center text-sm text-texto-2">
              Nenhum compromisso neste dia.
            </motion.li>
          )}
          {lista.map((e) => {
            const lembrete = lembretes.includes(e.id);
            const faltam = Math.round((e.dia - hoje) / DIA);
            return (
              <motion.li
                key={e.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-3 rounded-2xl border border-borda bg-white p-3"
              >
                <div className="grid w-11 shrink-0 place-items-center rounded-xl bg-verde-mclaro py-1.5 text-center">
                  <span className="text-[10px] font-semibold uppercase text-texto-2">
                    {new Date(e.dia).toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}
                  </span>
                  <span className="text-base font-extrabold leading-none text-tinta">{new Date(e.dia).getDate()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tom={TOM[e.tipo]} maiuscula>
                      {ROTULO_EVENTO[e.tipo]}
                    </Badge>
                    <span className="text-[11px] text-texto-2">{faltam === 0 ? "hoje" : faltam === 1 ? "amanhã" : `em ${faltam} dias`}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold leading-snug text-tinta">{e.titulo}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-texto-2">
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="size-3.5" /> {e.hora}
                    </span>
                    {e.local && (
                      <span className="inline-flex items-center gap-1 truncate">
                        <MapPin className="size-3.5" /> {e.local}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => alternarLembrete(e.id, e.titulo)}
                  aria-pressed={lembrete}
                  aria-label={lembrete ? "Desativar lembrete" : "Ativar lembrete"}
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-full transition-colors active:scale-90",
                    lembrete ? "bg-verde text-white" : "bg-verde-mclaro text-texto-2 hover:text-verde",
                  )}
                >
                  {lembrete ? <BellRing className="size-4" /> : <Bell className="size-4" />}
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </Sheet>
  );
}
