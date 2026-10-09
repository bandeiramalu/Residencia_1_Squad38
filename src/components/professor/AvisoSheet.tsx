"use client";

import { Send } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AreaTexto, Campo } from "@/components/ui/Campo";
import { RodapeSheet } from "@/components/ui/RodapeSheet";
import { useRascunho } from "@/components/ui/rascunhos";
import { Sheet } from "@/components/ui/Sheet";
import { DESTINOS_PROFESSOR, espacoDaTurma } from "@/data/professor";
import { cn } from "@/lib/cn";
import { publicarAviso } from "@/store/actions";
import type { EspacoId } from "@/store/types";
import { useTurmaProfessor } from "./comum";

const LIMITE = 280;

/** Aviso oficial no feed — aparece fixo como "Aviso" no destino escolhido (toda a escola ou uma das turmas do professor). */
export function AvisoSheet({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo="Publicar aviso" subtitulo="Aparece no feed e notifica cada aluno do destino">
      <Formulario onFechar={onFechar} />
    </Sheet>
  );
}

function Formulario({ onFechar }: { onFechar: () => void }) {
  const [texto, setTexto, limparRascunho] = useRascunho("aviso");
  // Começa na turma que o professor está vendo no Painel; ele pode trocar.
  const turmaDoPainel = useTurmaProfessor();
  const [destino, setDestino] = useState<EspacoId>(() => espacoDaTurma(turmaDoPainel) ?? "escola");
  const enviando = useRef(false);
  const valido = texto.trim().length >= 5;

  const publicar = () => {
    if (!valido || enviando.current) return;
    enviando.current = true;
    // A ação decide, avisa (toast) e notifica; `null` = recusado, então o formulário continua aberto.
    const id = publicarAviso(texto, destino);
    if (!id) {
      enviando.current = false;
      return;
    }
    limparRascunho();
    onFechar();
  };

  return (
    <div className="space-y-5">
      <Campo rotulo="Mensagem" htmlFor="aviso-texto" dica={`${texto.length}/${LIMITE} caracteres`}>
        <AreaTexto
          id="aviso-texto"
          value={texto}
          onChange={(e) => setTexto(e.target.value.slice(0, LIMITE))}
          placeholder="Ex.: Amanhã a aula de Matemática será no laboratório 2. Tragam a Lista 7 impressa."
          className="min-h-28"
        />
      </Campo>

      <div>
        <p className="mb-2 text-[13px] font-medium text-tinta">Onde publicar</p>
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Destino do aviso">
          {DESTINOS_PROFESSOR.map((d) => {
            const ativo = d.id === destino;
            return (
              <button
                key={d.id}
                type="button"
                role="radio"
                aria-checked={ativo}
                onClick={() => setDestino(d.id)}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-[background-color,border-color] duration-150",
                  ativo ? "border-verde bg-verde-mclaro" : "border-borda bg-superficie hover:bg-superficie-2",
                )}
              >
                <span className={cn("grid size-4 shrink-0 place-items-center rounded-full border-2", ativo ? "border-acao" : "border-texto-2")}>
                  {ativo && <span className="size-1.5 rounded-full bg-acao" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-medium text-tinta">{d.nome}</span>
                  <span className="block truncate text-[12px] text-texto-2">{d.descricao}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {valido && (
        <div className="rounded-xl border border-borda bg-superficie-2 p-3.5">
          <p className="mb-1 text-[12px] font-medium text-texto-2">Prévia</p>
          <p className="whitespace-pre-line text-[14px] leading-relaxed text-texto">{texto.trim()}</p>
        </div>
      )}

      <RodapeSheet>
        <Button variante="secundario" className="flex-1" onClick={onFechar}>
          Cancelar
        </Button>
        <Button className="flex-[2]" disabled={!valido} onClick={publicar}>
          <Send /> Publicar no feed
        </Button>
      </RodapeSheet>
    </div>
  );
}
