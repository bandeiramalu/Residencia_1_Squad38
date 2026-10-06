"use client";

import { ArrowDown, ArrowUp, EyeOff, Hourglass, Trophy, UserRound } from "lucide-react";
import { m as motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { Fragment, useState } from "react";
import { ArenaAbas } from "@/components/shell/ArenaAbas";
import { Avatar } from "@/components/ui/Avatar";
import { Nota, TituloPagina } from "@/components/ui/Blocos";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { Segmentado } from "@/components/ui/Segmentado";
import { DISCIPLINAS, type Disciplina } from "@/data/escola";
import { LIGA_DO_USUARIO, ZONA, type LigaId } from "@/data/ranking";
import { useMidia } from "@/hooks/useMidia";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/format";
import { montarRanking, type Escopo, type LinhaRanking } from "@/lib/gamificacao";
import { useSeletor } from "@/store/store";
import { AvatarAnonimo, LinhaFantasma, LinhaRankingItem, Posicao, Variacao } from "./LinhaRankingItem";
import { LARGO, PinoPosicao, useLinhaForaDaTela } from "./PinoPosicao";
import { PrivacidadeControle } from "./PrivacidadeControle";
import { AbaFoco } from "./RankingFoco";
import { nomeDaLiga, ReguaLigas } from "./ReguaLigas";
import { ResumoSemana } from "./ResumoSemana";

type Aba = "liga" | "foco";

const ABAS = [
  { id: "liga", rotulo: <><Trophy /> Liga (XP)</> },
  { id: "foco", rotulo: <><Hourglass /> Foco</> },
] as const;

const ESCOPOS = [
  { id: "liga", rotulo: "Minha liga" },
  { id: "turma", rotulo: "Minha turma" },
  { id: "disciplina", rotulo: "Por disciplina" },
] as const;

/** Ranking: ligas semanais por XP, ranking de foco e visibilidade (Público · Anônimo · Invisível). */
export function RankingView() {
  const param = useSearchParams().get("aba");
  const [aba, setAba] = useState<Aba>(param === "liga" || param === "foco" ? param : "liga");

  return (
    <div className="space-y-6">
      <ArenaAbas />
      <TituloPagina
        titulo="Ranking"
        descricao={aba === "liga" ? "Pelo XP da semana. Gastar pontos na Loja não muda sua posição." : "Minutos de estudo registrados na Sala de Estudos nesta semana."}
        acao={<Segmentado grupo="ranking-aba" rotulo="Tipo de ranking" opcoes={ABAS} valor={aba} onChange={setAba} className="w-full sm:w-[300px]" />}
      />

      <motion.div key={aba} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
        {aba === "liga" ? <AbaLiga /> : <AbaFoco />}
      </motion.div>
    </div>
  );
}

/** Modo invisível: tira a aluna da lista pública e renumera os colegas (e as zonas da liga) sem ela. */
function semMim(linhas: LinhaRanking[], escopo: Escopo, liga: LigaId): LinhaRanking[] {
  const outros = linhas.filter((l) => !l.eu);
  return outros.map((l, i) => {
    let zona: LinhaRanking["zona"];
    if (escopo === "liga") {
      if (i < ZONA && liga !== "diamante") zona = "promocao";
      else if (i >= outros.length - ZONA && liga !== "bronze") zona = "rebaixamento";
    }
    return { ...l, posicao: i + 1, zona };
  });
}

function AbaLiga() {
  const usuario = useSeletor((e) => e.usuario);
  const largo = useMidia(LARGO);
  const [escopo, setEscopo] = useState<Escopo>("liga");
  const [liga, setLiga] = useState<LigaId>(LIGA_DO_USUARIO);
  const [disciplina, setDisciplina] = useState<Disciplina>("Matemática");

  const sombra = usuario.privacidade === "sombra";
  const anonimo = usuario.privacidade === "anonimo";
  const completas = montarRanking(usuario, escopo, liga, disciplina);
  const eu = completas.find((l) => l.eu);
  const linhas = sombra ? semMim(completas, escopo, liga) : completas;
  const chave = `${escopo}-${liga}-${disciplina}-${usuario.privacidade}`;
  const { observar, fora: linhaFora, rolar: rolarAteMim } = useLinhaForaDaTela<HTMLLIElement>(chave);
  const unidade = escopo === "disciplina" ? `XP em ${disciplina}` : "XP nesta semana";
  const titulo = escopo === "liga" ? `Liga ${nomeDaLiga(liga)}` : escopo === "turma" ? usuario.turma : disciplina;

  const escolherLiga = (l: LigaId) => {
    setLiga(l);
    setEscopo("liga");
  };

  const regua = <ReguaLigas selecionada={liga} onSelecionar={escolherLiga} ativa={escopo === "liga"} />;
  const privacidade = <PrivacidadeControle grupo="privacidade-ranking" id="visibilidade" />;
  const fantasma = eu && <LinhaFantasma ref={observar} posicao={eu.posicao} valor={fmt(eu.xp)} />;

  return (
    <div className="space-y-4 xl:grid xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start xl:gap-6 xl:space-y-0">
      <aside className="space-y-4 xl:col-start-2 xl:row-start-1">
        <ResumoSemana usuario={usuario} />
        {largo && regua}
        {largo && privacidade}
      </aside>

      <section aria-label="Classificação por XP" className="min-w-0 space-y-4 xl:col-start-1 xl:row-start-1">
        <ChipGroup grupo="escopo-ranking" rotulo="Escopo do ranking" opcoes={ESCOPOS} valor={escopo} onChange={setEscopo} />

        {escopo === "liga" && !largo && regua}
        {escopo === "disciplina" && (
          <ChipGroup grupo="disciplina-ranking" rotulo="Disciplina" opcoes={DISCIPLINAS.map((d) => ({ id: d, rotulo: d }))} valor={disciplina} onChange={setDisciplina} />
        )}

        {anonimo && eu && <Nota icone={<UserRound />}>Os colegas veem “Aluno anônimo” no seu lugar. Você continua ganhando XP normalmente.</Nota>}

        <div className="overflow-hidden rounded-2xl border border-borda bg-superficie">
          <div className="flex items-baseline justify-between gap-3 border-b border-borda px-4 py-3">
            <h2 className="truncate text-[15px] font-semibold text-tinta">{titulo}</h2>
            <span className="shrink-0 text-[12px] text-texto-2">
              {linhas.length} alunos · {escopo === "disciplina" ? "XP na disciplina" : "XP da semana"}
            </span>
          </div>
          <div aria-hidden className="flex items-center gap-2.5 border-b border-borda px-3 py-2 text-[12px] text-texto-2 sm:gap-3 sm:px-4">
            <span className="w-7 shrink-0 text-center">#</span>
            <span className="min-w-0 flex-1">Aluno</span>
            <span className="w-10 shrink-0 text-right sm:w-16">
              <span className="sm:hidden">Var.</span>
              <span className="hidden sm:inline">Variação</span>
            </span>
            <span className="w-14 shrink-0 text-right">XP</span>
          </div>

          <motion.ol
            key={`${escopo}-${liga}-${disciplina}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            aria-label="Classificação"
            className="divide-y divide-borda"
          >
            {linhas.map((l, i) => {
              const inicioZona = escopo === "liga" && l.zona && linhas[i - 1]?.zona !== l.zona ? l.zona : undefined;
              const fantasmaAqui = sombra && eu && i === eu.posicao - 1;
              // A linha tracejada fica do lado certo do rótulo de zona: dentro dela só se você também estaria nela.
              const fantasmaAntes = fantasmaAqui && (!inicioZona || eu.zona !== inicioZona);
              return (
                <Fragment key={l.id}>
                  {fantasmaAntes && fantasma}
                  {inicioZona && <RotuloZona zona={inicioZona} />}
                  {fantasmaAqui && !fantasmaAntes && fantasma}
                  <LinhaRankingItem ref={l.eu ? observar : undefined} linha={l} oculto={l.eu && anonimo} equipados={l.eu ? usuario.equipados : []} />
                </Fragment>
              );
            })}
            {sombra && eu && eu.posicao > linhas.length && fantasma}
          </motion.ol>
        </div>

        {!largo && privacidade}

        <p className="px-1 text-[12px] text-texto-2">Medalhas e nível vêm do mérito acadêmico. O saldo de pontos da Loja nunca entra neste cálculo.</p>
      </section>

      <PinoPosicao visivel={!!eu && linhaFora} sombra={sombra} onClick={rolarAteMim} rotulo="Mostrar sua posição na tabela">
        {eu &&
          (sombra ? (
            <>
              <span className="grid w-7 shrink-0 place-items-center text-texto-2">
                <EyeOff className="size-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium text-tinta">Você estaria em {eu.posicao}º</span>
                <span className="block truncate text-[12px] text-texto-2">Modo invisível · só você vê</span>
              </span>
              <span className="shrink-0 text-[14px] font-medium tabular-nums text-texto-2">{fmt(eu.xp)} XP</span>
            </>
          ) : (
            <>
              <Posicao n={eu.posicao} />
              {anonimo ? <AvatarAnonimo /> : <Avatar nome={usuario.nome} tamanho="sm" equipados={usuario.equipados} />}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium text-tinta">
                  Você · {eu.posicao}º lugar{anonimo ? " (anônimo)" : ""}
                </span>
                <span className="block truncate text-[12px] text-texto-2">
                  {fmt(eu.xp)} {unidade}
                </span>
              </span>
              <Variacao tendencia={eu.tendencia} variacao={eu.variacao} />
            </>
          ))}
      </PinoPosicao>
    </div>
  );
}

function RotuloZona({ zona }: { zona: "promocao" | "rebaixamento" }) {
  const Icone = zona === "promocao" ? ArrowUp : ArrowDown;
  return (
    <li aria-hidden className={cn("flex items-center gap-1.5 bg-superficie-2 px-4 py-1.5 text-[12px] font-medium", zona === "promocao" ? "text-acento" : "text-alerta")}>
      <Icone className="size-3.5" />
      {zona === "promocao" ? "Zona de promoção" : "Zona de rebaixamento"}
      <span className="ml-auto font-normal text-texto-2">{zona === "promocao" ? `top ${ZONA} sobem` : `últimos ${ZONA} descem`}</span>
    </li>
  );
}
