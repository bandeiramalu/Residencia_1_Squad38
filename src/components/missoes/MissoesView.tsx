"use client";

import { TituloPagina, TituloSecao } from "@/components/ui/Blocos";
import { useEstado } from "@/store/store";
import { DesafiosCard } from "./DesafiosCard";
import { Flashcards } from "./Flashcards";
import { MissaoColetivaCard } from "./MissaoColetivaCard";
import { MissaoItem } from "./MissaoItem";
import { RelatoCard } from "./RelatoCard";
import { SequenciaCard } from "./SequenciaCard";

/** Aba 2 — Missões: gamificação e estudo diário. */
export function MissoesView() {
  const { missoes } = useEstado();
  const diarias = missoes.filter((m) => m.tipo === "diaria");
  const professor = missoes.filter((m) => m.tipo === "professor");
  const feitas = diarias.filter((m) => m.concluida).length;

  return (
    <div className="space-y-7">
      <TituloPagina titulo="Missões" descricao="Constância e colaboração valem pontos. Mérito acadêmico vale XP." />

      <SequenciaCard feitasHoje={feitas} totalHoje={diarias.length} />

      <section>
        <TituloSecao extra="Renovam a cada 24 horas">Missões de hoje</TituloSecao>
        <ul className="space-y-2.5">
          {diarias.map((m) => (
            <MissaoItem key={m.id} missao={m} />
          ))}
        </ul>
      </section>

      <section>
        <TituloSecao extra="+10 pontos e +15 XP por rodada">Prática rápida · Química</TituloSecao>
        <Flashcards />
      </section>

      <section>
        <TituloSecao extra="Gerados pelo seu histórico">Desafios para você</TituloSecao>
        <DesafiosCard />
      </section>

      <section>
        <TituloSecao extra="Encerra domingo às 23h59">Missão coletiva da semana</TituloSecao>
        <MissaoColetivaCard />
      </section>

      <section>
        <TituloSecao extra="Vinculadas ao plano de aula">Missões do professor</TituloSecao>
        <ul className="space-y-2.5">
          {professor.map((m) => (
            <MissaoItem key={m.id} missao={m} />
          ))}
        </ul>
      </section>

      <section>
        <TituloSecao extra="+30 pontos por relato validado">Participação na escola</TituloSecao>
        <RelatoCard />
      </section>
    </div>
  );
}
