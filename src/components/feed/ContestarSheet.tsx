"use client";

import { Info } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { RodapeSheet } from "@/components/ui/RodapeSheet";
import { Sheet } from "@/components/ui/Sheet";
import { contestarRetencao } from "@/store/actions";
import type { Post } from "@/store/types";

const MAX_TEXTO = 300;

/** O autor de uma publicação retida pela triagem pede que a coordenação reveja ("Isso foi um engano?"). Uma vez só. */
export function ContestarSheet({ aberto, post, onFechar }: { aberto: boolean; post: Post; onFechar: () => void }) {
  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo="Contestar a revisão" subtitulo="A coordenação analisa e avisa você">
      <Formulario key={post.id} post={post} onFechar={onFechar} />
    </Sheet>
  );
}

function Formulario({ post, onFechar }: { post: Post; onFechar: () => void }) {
  const [texto, setTexto] = useState("");
  const enviando = useRef(false);

  const enviar = () => {
    if (enviando.current) return;
    enviando.current = true;
    contestarRetencao(post.id, texto.trim() || undefined);
    onFechar();
  };

  return (
    <>
      <blockquote className="rounded-xl border border-borda bg-superficie-2 px-3.5 py-3">
        <p className="text-[12px] text-texto-2">Sua publicação em revisão</p>
        <p className="mt-1 line-clamp-3 text-[13.5px] leading-snug text-texto">{post.texto}</p>
      </blockquote>

      <div className="relative mt-4">
        <textarea
          rows={4}
          value={texto}
          maxLength={MAX_TEXTO}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Conte por que isso foi um engano (opcional)…"
          aria-label="Motivo da contestação"
          className="w-full resize-none rounded-xl border border-borda bg-superficie px-3.5 pb-7 pt-2.5 text-sm leading-relaxed text-tinta outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-texto-2 hover:border-texto-2/40 focus:border-verde focus:ring-3 focus:ring-verde/15"
        />
        <span className="pointer-events-none absolute bottom-2.5 right-3.5 text-[11.5px] tabular-nums text-texto-2">
          {texto.length}/{MAX_TEXTO}
        </span>
      </div>

      <p className="mt-3 flex gap-2 text-[12.5px] leading-relaxed text-texto-2">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>A triagem é automática e pode errar. Nada é punido sem uma pessoa da coordenação decidir.</span>
      </p>

      <RodapeSheet>
        <Button variante="secundario" tamanho="lg" className="flex-1" onClick={onFechar}>
          Cancelar
        </Button>
        <Button tamanho="lg" className="flex-1" onClick={enviar}>
          Enviar contestação
        </Button>
      </RodapeSheet>
    </>
  );
}
