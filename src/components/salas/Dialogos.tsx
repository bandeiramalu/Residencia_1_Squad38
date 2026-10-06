"use client";

import { Info, Power } from "lucide-react";
import { useState } from "react";
import { Nota } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { DisciplinaIcon } from "@/components/ui/DisciplinaIcon";
import { RodapeSheet } from "@/components/ui/RodapeSheet";
import { Sheet } from "@/components/ui/Sheet";
import { DISCIPLINAS, type Disciplina } from "@/data/escola";
import { fecharSala } from "@/store/actions";
import type { SalaEstudo } from "@/store/types";
import { rotuloRitmo } from "./comum";

/** Confirmação antes de encerrar uma sala (ação destrutiva: todos saem e o chat some). */
export function ConfirmarEncerrarSheet({
  sala,
  aberto,
  agendada,
  onFechar,
  onEncerrada,
}: {
  sala: SalaEstudo | null;
  aberto: boolean;
  /** Sala agendada que ainda não abriu: o texto vira "cancelar". */
  agendada?: boolean;
  onFechar: () => void;
  onEncerrada?: () => void;
}) {
  const encerrar = () => {
    if (!sala) return;
    onFechar();
    onEncerrada?.();
    fecharSala(sala.id);
  };

  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo={agendada ? "Cancelar sala agendada?" : "Encerrar a sala?"} subtitulo={sala?.nome}>
      <div className="space-y-3">
        <p className="text-[14px] leading-relaxed text-texto">
          {sala && sala.membros.length > 0
            ? `${sala.membros.length} ${sala.membros.length === 1 ? "pessoa sai" : "pessoas saem"} da sala na hora e o chat é apagado.`
            : "A sala sai da lista e o chat é apagado."}
        </p>
        <Nota icone={<Info />}>O tempo de foco que cada um já fez continua registrado nas métricas e nos campeonatos.</Nota>
      </div>
      <RodapeSheet>
        <Button variante="secundario" bloco className="shrink" onClick={onFechar}>
          Voltar
        </Button>
        <Button variante="perigo" bloco className="shrink" onClick={encerrar}>
          <Power />
          {agendada ? "Cancelar sala" : "Encerrar sala"}
        </Button>
      </RodapeSheet>
    </Sheet>
  );
}

/** Sala livre (sem disciplina): a aluna escolhe em que vai focar antes de entrar. */
export function EscolherDisciplinaSheet({ sala, aberto, onFechar, onEscolher, inicial }: { sala: SalaEstudo; aberto: boolean; onFechar: () => void; onEscolher: (d: Disciplina) => void; inicial?: Disciplina }) {
  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo="Em que você vai focar?" subtitulo={`“${sala.nome}” é uma sala livre · ciclos de ${rotuloRitmo(sala)}`}>
      <Escolha onFechar={onFechar} onEscolher={onEscolher} inicial={inicial} />
    </Sheet>
  );
}

function Escolha({ onFechar, onEscolher, inicial }: { onFechar: () => void; onEscolher: (d: Disciplina) => void; inicial?: Disciplina }) {
  const [disciplina, setDisciplina] = useState<Disciplina | null>(inicial ?? null);
  return (
    <>
      <p className="mb-3 text-[13px] text-texto-2">Seu tempo entra nas métricas dessa disciplina (e nos campeonatos de foco).</p>
      <ChipGroup
        grupo="sala-disciplina"
        rotulo="Disciplina do foco"
        quebrar
        opcoes={DISCIPLINAS.map((d) => ({
          id: d,
          rotulo: (
            <>
              <DisciplinaIcon disciplina={d} />
              {d}
            </>
          ),
        }))}
        valor={disciplina}
        onChange={setDisciplina}
      />
      <RodapeSheet>
        <Button variante="secundario" bloco className="shrink" onClick={onFechar}>
          Cancelar
        </Button>
        <Button
          bloco
          className="shrink"
          disabled={!disciplina}
          onClick={() => {
            if (!disciplina) return;
            onFechar();
            onEscolher(disciplina);
          }}
        >
          Começar a focar
        </Button>
      </RodapeSheet>
    </>
  );
}
