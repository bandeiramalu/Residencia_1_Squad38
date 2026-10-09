"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { AreaTexto, Campo } from "@/components/ui/Campo";
import { RodapeSheet } from "@/components/ui/RodapeSheet";
import { useRascunho } from "@/components/ui/rascunhos";
import { Sheet } from "@/components/ui/Sheet";
import { ESPACOS } from "@/data/escola";
import { cn } from "@/lib/cn";
import { publicarAviso } from "@/store/actions";
import type { EspacoId } from "@/store/types";

const LIMITE = 280;

/** Aviso oficial no feed — aparece fixo como "Aviso" no espaço escolhido. */
export function AvisoSheet({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo="Publicar aviso" subtitulo="Aparece no feed e notifica cada aluno do espaço">
      <Formulario onFechar={onFechar} />
    </Sheet>
  );
}

function Formulario({ onFechar }: { onFechar: () => void }) {
  const [texto, setTexto, limparRascunho] = useRascunho("aviso");
  const [espaco, setEspaco] = useState<EspacoId>("9A");
  const valido = texto.trim().length >= 5;

  const publicar = () => {
    if (!valido) return;
    publicarAviso(texto, espaco);
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
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Espaço do aviso">
          {ESPACOS.map((e) => {
            const ativo = e.id === espaco;
            return (
              <button
                key={e.id}
                type="button"
                role="radio"
                aria-checked={ativo}
                onClick={() => setEspaco(e.id)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-[background-color,border-color] duration-150",
                  ativo ? "border-verde bg-verde-mclaro" : "border-borda bg-superficie hover:bg-superficie-2",
                )}
              >
                <span className={cn("grid size-4 shrink-0 place-items-center rounded-full border-2", ativo ? "border-verde" : "border-texto-2/45")}>
                  {ativo && <span className="size-1.5 rounded-full bg-verde" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-medium text-tinta">{e.nome}</span>
                  <span className="block truncate text-[12px] text-texto-2">{e.id === "9A" ? "Turma do 9º Ano A" : e.descricao}</span>
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
