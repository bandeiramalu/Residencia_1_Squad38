"use client";

import { EyeOff, Info, Timer } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Nota, TituloPagina } from "@/components/ui/Blocos";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { DISCIPLINAS, type Disciplina } from "@/data/escola";
import { LIGA_DO_USUARIO, LIGAS, type LigaId } from "@/data/ranking";
import { useAgora } from "@/hooks/useAgora";
import { fmt } from "@/lib/format";
import { montarRanking, type Escopo } from "@/lib/gamificacao";
import { contagemRegressiva, fechamentoDaSemana } from "@/lib/tempo";
import { useEstado } from "@/store/store";
import { ReguaLigas } from "./ReguaLigas";
import { LinhaRankingItem, Variacao } from "./LinhaRankingItem";

const ESCOPOS = [
  { id: "liga", rotulo: "Minha liga" },
  { id: "turma", rotulo: "Minha turma" },
  { id: "disciplina", rotulo: "Por disciplina" },
] as const;

/** Aba 3 — Ranking: ligas semanais e tabela de classificação por XP. */
export function RankingView() {
  const { usuario } = useEstado();
  const [escopo, setEscopo] = useState<Escopo>("liga");
  const [liga, setLiga] = useState<LigaId>(LIGA_DO_USUARIO);
  const [disciplina, setDisciplina] = useState<Disciplina>("Matemática");

  const linhas = useMemo(() => montarRanking(usuario, escopo, liga, disciplina), [usuario, escopo, liga, disciplina]);
  const minhaNaLiga = useMemo(() => montarRanking(usuario, "liga", LIGA_DO_USUARIO, disciplina).find((l) => l.eu), [usuario, disciplina]);
  const eu = linhas.find((l) => l.eu);
  const nomeLiga = LIGAS.find((l) => l.id === LIGA_DO_USUARIO)!.nome;

  // Mostra um "pino" com a sua posição quando a sua linha sai da tela.
  const minhaLinha = useRef<HTMLLIElement>(null);
  const [linhaVisivel, setLinhaVisivel] = useState(true);
  useEffect(() => {
    const alvo = minhaLinha.current;
    if (!alvo) return;
    const obs = new IntersectionObserver(([e]) => setLinhaVisivel(e.isIntersecting), { rootMargin: "-64px 0px -88px 0px" });
    obs.observe(alvo);
    return () => obs.disconnect();
  }, [linhas]);

  return (
    <div className="space-y-5">
      <TituloPagina titulo="Ranking por liga" descricao={<>Calculado pelo <b className="text-verde">XP da semana</b>. Gastar pontos na Loja não muda sua posição.</>} />

      <ResumoSemana posicao={minhaNaLiga?.posicao ?? 0} variacao={minhaNaLiga?.variacao ?? 0} nomeLiga={nomeLiga} oculto={usuario.ocultarRanking} />

      <ChipGroup grupo="escopo-ranking" rotulo="Escopo do ranking" opcoes={ESCOPOS} valor={escopo} onChange={setEscopo} />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={escopo} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
          {escopo === "liga" && <ReguaLigas selecionada={liga} onSelecionar={setLiga} />}
          {escopo === "disciplina" && (
            <ChipGroup
              grupo="disciplina-ranking"
              rotulo="Disciplina"
              opcoes={DISCIPLINAS.map((d) => ({ id: d, rotulo: d }))}
              valor={disciplina}
              onChange={setDisciplina}
            />
          )}
          {escopo === "turma" && (
            <p className="text-[12.5px] text-texto-2">
              Alunos do <b className="text-tinta">{usuario.turma}</b> ordenados pelo XP acumulado na semana.
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {usuario.ocultarRanking && (
        <Nota icone={<EyeOff />}>
          Sua posição pública está oculta: os colegas veem “Aluno anônimo” no seu lugar. Você continua ganhando XP normalmente. Para voltar a aparecer,
          desative no Perfil.
        </Nota>
      )}

      <ol className="space-y-1.5" aria-label="Classificação">
        {linhas.map((l, i) => (
          <LinhaRankingItem
            key={l.id}
            ref={l.eu ? minhaLinha : undefined}
            linha={l}
            oculto={l.eu && usuario.ocultarRanking}
            equipados={l.eu ? usuario.equipados : []}
            divisorAntes={
              escopo === "liga" && l.zona === "rebaixamento" && linhas[i - 1]?.zona !== "rebaixamento"
                ? "Zona de rebaixamento"
                : escopo === "liga" && i === 0 && l.zona === "promocao"
                  ? "Zona de promoção"
                  : undefined
            }
          />
        ))}
      </ol>

      <Nota icone={<Info />} tom="branco">
        Medalhas e nível são conquistados por mérito acadêmico. O saldo de pontos do Marketplace nunca entra neste cálculo.
      </Nota>

      <AnimatePresence>
        {eu && !linhaVisivel && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 480, damping: 36 }}
            className="fixed inset-x-0 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-30 mx-auto w-full max-w-[480px] px-4"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-verde-2/50 bg-verde-claro/95 px-3 py-2.5 shadow-flutuante backdrop-blur">
              <span className="w-8 text-center text-sm font-extrabold text-verde">{eu.posicao}º</span>
              <Avatar nome={usuario.nome} tamanho="sm" equipados={usuario.equipados} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-tinta">Você · {usuario.turma}</p>
                <p className="text-[11px] text-texto-2">{fmt(eu.xp)} XP nesta semana</p>
              </div>
              <Variacao linha={eu} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResumoSemana({ posicao, variacao, nomeLiga, oculto }: { posicao: number; variacao: number; nomeLiga: string; oculto: boolean }) {
  const agora = useAgora(1000);
  const { dias, horas, minutos, segundos } = contagemRegressiva(fechamentoDaSemana(agora) - agora);
  const partes = [
    { v: dias, r: "d" },
    { v: horas, r: "h" },
    { v: minutos, r: "min" },
    { v: segundos, r: "s" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl bg-linear-to-br from-verde to-tinta p-4 text-white shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/70">Liga {nomeLiga}</p>
          <p className="mt-0.5 text-2xl font-extrabold">
            <motion.span key={posicao} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="inline-block">
              {posicao}º lugar
            </motion.span>
          </p>
          <p className="text-[12.5px] text-white/80">
            {variacao > 0 ? `subiu ${variacao} ${variacao === 1 ? "posição" : "posições"}` : variacao < 0 ? `caiu ${-variacao} posições` : "manteve a posição"} desde o último
            fechamento{oculto ? " · posição oculta" : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="flex items-center justify-end gap-1 text-[11px] font-semibold text-white/70">
            <Timer className="size-3.5" /> Fecha domingo 23:59
          </p>
          <div className="mt-1 flex gap-1">
            {partes.map((p) => (
              <span key={p.r} className="min-w-9 rounded-lg bg-white/12 px-1.5 py-1 text-center">
                <span className="block text-sm font-extrabold tabular-nums leading-none">{String(p.v).padStart(2, "0")}</span>
                <span className="text-[9px] text-white/70">{p.r}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
