"use client";

import { AtividadesAluno } from "@/components/atividades/AtividadesAluno";
import { TituloPagina, TituloSecao } from "@/components/ui/Blocos";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useMidia } from "@/hooks/useMidia";
import { fmt } from "@/lib/format";
import { useSeletor } from "@/store/store";
import { DesafiosCard } from "./DesafiosCard";
import { Flashcards } from "./Flashcards";
import { MissaoColetivaCard } from "./MissaoColetivaCard";
import { MissaoItem } from "./MissaoItem";
import { RelatoCard } from "./RelatoCard";
import { SequenciaCard } from "./SequenciaCard";

/** A partir desta largura a página ganha a coluna lateral (sequência, coletiva e relato). */
const LARGO = "(min-width: 1280px)";

/**
 * Missões: constância (sequência e diárias), atividades do professor e prática.
 * No celular é uma coluna na ordem de prioridade; em telas largas vira coluna principal + coluna lateral.
 */
export function MissoesView() {
  const largo = useMidia(LARGO);
  const missoes = useSeletor((e) => e.missoes);
  const diarias = missoes.filter((m) => m.tipo === "diaria");
  const feitas = diarias.filter((m) => m.concluida).length;
  const restantes = diarias.filter((m) => !m.concluida);
  const pontosRestantes = restantes.reduce((a, m) => a + m.pontos, 0);
  const xpRestante = restantes.reduce((a, m) => a + m.xp, 0);
  const tudoFeito = diarias.length > 0 && feitas === diarias.length;

  const titulo = <TituloPagina titulo="Missões" descricao="Constância vale pontos; mérito acadêmico vale XP." />;
  const sequencia = (
    <section className="min-w-0">
      <TituloSecao extra="Não dá XP">Sequência</TituloSecao>
      <SequenciaCard />
    </section>
  );

  const hoje = (
    <section aria-label="Missões de hoje">
      <TituloSecao extra="Renovam a cada 24 horas">Missões de hoje</TituloSecao>
      <div className="overflow-hidden rounded-2xl border border-borda bg-superficie">
        <div className="border-b border-borda px-4 py-3">
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <p className="text-texto">
              {tudoFeito ? (
                "Todas feitas. Novas missões chegam amanhã."
              ) : (
                <>
                  Faltam {restantes.length} <span className="text-texto-2">· valem +{fmt(pontosRestantes)} pontos e +{fmt(xpRestante)} XP</span>
                </>
              )}
            </p>
            <span className="shrink-0 font-medium tabular-nums text-tinta">
              {feitas}/{diarias.length}
            </span>
          </div>
          <ProgressBar valor={feitas} max={Math.max(1, diarias.length)} fina className="mt-2" rotulo="Missões diárias concluídas" />
        </div>
        <ul className="divide-y divide-borda">
          {diarias.map((m) => (
            <MissaoItem key={m.id} missao={m} />
          ))}
        </ul>
      </div>
    </section>
  );

  const atividades = <AtividadesAluno />;

  const pratica = (
    <section className="min-w-0">
      <TituloSecao extra="+10 pontos · +15 XP por rodada">Flashcards</TituloSecao>
      <Flashcards />
    </section>
  );

  const desafios = (
    <section className="min-w-0">
      <TituloSecao extra="Pelo seu domínio">Desafios</TituloSecao>
      <DesafiosCard />
    </section>
  );

  const coletiva = (
    <section className="min-w-0">
      <TituloSecao extra="Encerra domingo, 23:59">Missão coletiva</TituloSecao>
      <MissaoColetivaCard />
    </section>
  );

  const relato = (
    <section className="min-w-0">
      <TituloSecao extra="+30 pontos por relato">Relatos à escola</TituloSecao>
      <RelatoCard />
    </section>
  );

  if (!largo) {
    return (
      <div className="space-y-6">
        {titulo}
        {sequencia}
        {hoje}
        {atividades}
        {pratica}
        {desafios}
        {coletiva}
        {relato}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {titulo}
      <div className="grid grid-cols-[minmax(0,1fr)_300px] items-start gap-6">
        <div className="min-w-0 space-y-6">
          {hoje}
          {atividades}
          <div className="grid grid-cols-2 items-start gap-6">
            {pratica}
            {desafios}
          </div>
        </div>
        <aside className="min-w-0 space-y-6">
          {sequencia}
          {coletiva}
          {relato}
        </aside>
      </div>
    </div>
  );
}
