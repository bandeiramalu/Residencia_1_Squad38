"use client";

import { EyeOff, Play, UserRound } from "lucide-react";
import { m as motion } from "motion/react";
import Link from "next/link";
import { Fragment, useState, type Ref } from "react";
import { Anel } from "@/components/ui/Anel";
import { Avatar } from "@/components/ui/Avatar";
import { LinkPessoa } from "@/components/ui/LinkPessoa";
import { Nota } from "@/components/ui/Blocos";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { useAgora } from "@/hooks/useAgora";
import { useMidia } from "@/hooks/useMidia";
import { cn } from "@/lib/cn";
import { formatarMinutos, montarRankingFoco, resumoEstudos, type EscopoFoco, type LinhaFoco, type RankingFoco } from "@/lib/estudos";
import { useEstado } from "@/store/store";
import { AvatarAnonimo, FaixaDestaque, LinhaFantasma, Posicao } from "./LinhaRankingItem";
import { LARGO, PinoPosicao, useLinhaForaDaTela } from "./PinoPosicao";
import { PrivacidadeControle } from "./PrivacidadeControle";

const ESCOPOS = [
  { id: "turma", rotulo: "Minha turma" },
  { id: "escola", rotulo: "Escola toda" },
] as const;

/** Aba "Foco": quem mais estudou na semana (minutos registrados na Sala de Estudos). */
export function AbaFoco() {
  const estado = useEstado();
  const agora = useAgora(60_000);
  const largo = useMidia(LARGO);
  const [escopo, setEscopo] = useState<EscopoFoco>("turma");
  const { usuario } = estado;
  const rf = montarRankingFoco(estado, escopo, agora);
  const resumo = resumoEstudos(estado.estudos.sessoes, agora, estado.estudos.metaDiariaMin);
  const oculto = usuario.privacidade === "anonimo";
  const { observar, fora: linhaFora, rolar: rolarAteMim } = useLinhaForaDaTela<HTMLLIElement>(`foco-${escopo}-${usuario.privacidade}`);

  return (
    <div className="space-y-4 xl:grid xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start xl:gap-6 xl:space-y-0">
      <aside className="space-y-4 xl:col-start-2 xl:row-start-1">
        <ResumoFoco rf={rf} escopo={escopo} hojeMin={resumo.hojeMin} metaMin={estado.estudos.metaDiariaMin} emFoco={!!estado.estudos.timer} />
        {largo && <PrivacidadeControle grupo="privacidade-ranking" id="visibilidade" />}
      </aside>

      <section aria-label="Ranking de foco" className="min-w-0 space-y-4 xl:col-start-1 xl:row-start-1">
        <ChipGroup grupo="escopo-foco" rotulo="Escopo do ranking de foco" opcoes={ESCOPOS} valor={escopo} onChange={setEscopo} />

        {oculto && <Nota icone={<UserRound />}>Você aparece como “Aluno anônimo” para os colegas. Seus minutos continuam contando.</Nota>}

        <div className="overflow-hidden rounded-2xl border border-borda bg-superficie">
          <div className="flex items-baseline justify-between gap-3 border-b border-borda px-4 py-3">
            <h2 className="text-[15px] font-semibold text-tinta">{escopo === "turma" ? usuario.turma : "Escola toda"}</h2>
            <span className="text-[12px] text-texto-2">Minutos de estudo na semana</span>
          </div>
          <motion.ol
            key={escopo}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            aria-label={escopo === "turma" ? `Minutos de estudo no ${usuario.turma}` : "Minutos de estudo na escola"}
            className="divide-y divide-borda"
          >
            {rf.linhas.map((l, i) => (
              <Fragment key={l.id}>
                {rf.sombra && i === rf.minhaPosicao - 1 && <LinhaFantasma ref={observar} posicao={rf.minhaPosicao} valor={formatarMinutos(rf.meusMinutos)} />}
                <LinhaFocoItem l={l} oculto={l.eu && oculto} equipados={l.eu ? usuario.equipados : []} ref={l.eu ? observar : undefined} />
              </Fragment>
            ))}
            {rf.sombra && rf.minhaPosicao > rf.linhas.length && <LinhaFantasma ref={observar} posicao={rf.minhaPosicao} valor={formatarMinutos(rf.meusMinutos)} />}
          </motion.ol>
        </div>

        {!largo && <PrivacidadeControle grupo="privacidade-ranking" id="visibilidade" />}

        <p className="px-1 text-[12px] text-texto-2">Tempo de estudo rende pontos (1 por minuto + bônus por ciclo). XP vem só do mérito acadêmico.</p>
      </section>

      <PinoPosicao visivel={linhaFora} sombra={rf.sombra} onClick={rolarAteMim} rotulo="Mostrar sua posição na lista">
        {rf.sombra ? (
          <span className="grid w-7 shrink-0 place-items-center text-texto-2">
            <EyeOff className="size-4" aria-hidden />
          </span>
        ) : (
          <Posicao n={rf.minhaPosicao} />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-medium text-tinta">{rf.sombra ? `Você estaria em ${rf.minhaPosicao}º` : `Você · ${rf.minhaPosicao}º de ${rf.total}`}</span>
          <span className="block truncate text-[12px] text-texto-2">{rf.sombra ? "Modo invisível · só você vê" : "Minutos de estudo nesta semana"}</span>
        </span>
        <span className="shrink-0 text-[14px] font-medium tabular-nums text-tinta">{formatarMinutos(rf.meusMinutos)}</span>
      </PinoPosicao>
    </div>
  );
}

function LinhaFocoItem({ l, oculto, equipados, ref }: { l: LinhaFoco; oculto: boolean; equipados: string[]; ref?: Ref<HTMLLIElement> }) {
  return (
    <li ref={ref} className={cn("cv-auto relative flex items-center gap-2.5 px-3 py-2.5 sm:gap-3 sm:px-4", l.eu && "bg-verde-mclaro")} style={{ containIntrinsicSize: "auto 58px" }}>
      {l.eu && <FaixaDestaque />}
      <Posicao n={l.posicao} />
      {oculto ? (
        <AvatarAnonimo />
      ) : (
        <LinkPessoa id={l.id} rotulo={`Perfil de ${l.nome}`} className="shrink-0">
          <Avatar nome={l.nome} tamanho="sm" equipados={equipados} />
        </LinkPessoa>
      )}
      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 items-baseline gap-1.5">
          {oculto ? (
            <span className="truncate text-[14px] font-semibold text-tinta">Aluno anônimo</span>
          ) : (
            <LinkPessoa id={l.id} className={cn("truncate text-[14px] text-tinta", l.eu ? "font-semibold" : "font-medium")}>
              {l.nome}
            </LinkPessoa>
          )}
          {l.eu && <span className="shrink-0 text-[12px] font-medium text-acento">você</span>}
        </p>
        <p className="truncate text-[12px] text-texto-2">{l.turma}</p>
      </div>
      <span className="w-16 shrink-0 text-right text-[14px] font-medium tabular-nums text-tinta">{formatarMinutos(l.minutos)}</span>
    </li>
  );
}

/** Resumo de foco: seus minutos, posição e a meta de hoje. */
function ResumoFoco({ rf, escopo, hojeMin, metaMin, emFoco }: { rf: RankingFoco; escopo: EscopoFoco; hojeMin: number; metaMin: number; emFoco: boolean }) {
  const acima = rf.linhas[rf.minhaPosicao - 2];
  const falta = acima ? acima.minutos - rf.meusMinutos + 1 : 0;
  const pctHoje = metaMin ? hojeMin / metaMin : 0;

  return (
    <section aria-label="Seu foco nesta semana" className="rounded-2xl border border-borda bg-superficie p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-tinta">Seu foco na semana</h2>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-tinta">{formatarMinutos(rf.meusMinutos)}</p>
          <p className="text-[13px] text-texto-2">
            {rf.sombra ? "Você estaria em " : ""}
            <span className="font-medium text-tinta">{rf.minhaPosicao}º</span> de {rf.total} {escopo === "turma" ? "na turma" : "na escola"}
          </p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Anel progresso={pctHoje} tamanho={52} espessura={4} rotulo="Meta de estudo de hoje">
            <span className="text-[12px] font-medium tabular-nums text-tinta">{Math.min(100, Math.round(pctHoje * 100))}%</span>
          </Anel>
          <span className="text-[11px] text-texto-2">meta hoje</span>
        </div>
      </div>

      <p className="mt-3 text-[13px] text-texto">
        {rf.minhaPosicao === 1
          ? "Você lidera o foco da semana."
          : falta > 0
            ? `Faltam ${formatarMinutos(falta)} para o ${rf.minhaPosicao - 1}º lugar.`
            : "Mais um bloco de foco e você sobe uma posição."}{" "}
        <span className="text-texto-2">
          Hoje: {formatarMinutos(hojeMin)} de {formatarMinutos(metaMin)}.
        </span>
      </p>

      <Link
        href="/estudos"
        className="alvo-toque mt-3 flex h-9 items-center justify-center gap-2 rounded-lg bg-acao text-sm font-medium text-white transition-colors duration-150 hover:bg-acao-2 active:scale-[0.98]"
      >
        <Play className="size-4" aria-hidden /> {emFoco ? "Voltar ao foco" : "Estudar agora"}
      </Link>
    </section>
  );
}
