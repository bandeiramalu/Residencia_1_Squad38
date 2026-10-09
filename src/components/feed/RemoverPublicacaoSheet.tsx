"use client";

import { Info } from "lucide-react";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { RodapeSheet } from "@/components/ui/RodapeSheet";
import { Sheet } from "@/components/ui/Sheet";
import { MOTIVOS_REMOCAO, removerPublicacao } from "@/store/actions";
import type { Post } from "@/store/types";
import { ErroCampo } from "./ErroCampo";

const MAX_OBSERVACAO = 200;

/** Professor remove a publicação de um aluno pelo feed: o motivo é obrigatório e vai para o Histórico da Moderação. */
export function RemoverPublicacaoSheet({ aberto, post, nomeAutor, onFechar }: { aberto: boolean; post: Post; nomeAutor?: string; onFechar: () => void }) {
  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo="Remover publicação" subtitulo="O autor recebe uma notificação com o motivo">
      <Formulario key={post.id} post={post} nomeAutor={nomeAutor} onFechar={onFechar} />
    </Sheet>
  );
}

function Formulario({ post, nomeAutor, onFechar }: { post: Post; nomeAutor?: string; onFechar: () => void }) {
  const [motivo, setMotivo] = useState<(typeof MOTIVOS_REMOCAO)[number] | null>(null);
  const [observacao, setObservacao] = useState("");
  const [tentou, setTentou] = useState(false);
  const enviando = useRef(false);
  const grupo = useRef<HTMLDivElement>(null);
  const idErro = useId();
  const semMotivo = tentou && !motivo;

  const remover = () => {
    if (enviando.current) return;
    if (!motivo) {
      setTentou(true);
      grupo.current?.querySelector<HTMLElement>("button")?.focus();
      return;
    }
    enviando.current = true;
    const extra = observacao.trim();
    removerPublicacao(post.id, extra ? `${motivo}: ${extra}` : motivo);
    onFechar();
  };

  return (
    <>
      <blockquote className="rounded-xl border border-borda bg-superficie-2 px-3.5 py-3">
        <p className="text-[12px] text-texto-2">Publicação{nomeAutor ? ` de ${nomeAutor}` : ""}</p>
        <p className="mt-1 line-clamp-3 text-[13.5px] leading-snug text-texto">{post.texto}</p>
      </blockquote>

      <p className="mb-2 mt-5 text-[13px] font-medium text-tinta">
        Motivo <span className="font-normal text-texto-2">· obrigatório</span>
      </p>
      <div ref={grupo} role="group" aria-label="Motivo da remoção" aria-describedby={semMotivo ? idErro : undefined}>
        <ChipGroup
          grupo="motivo-remocao"
          rotulo="Motivo da remoção"
          quebrar
          opcoes={MOTIVOS_REMOCAO.map((m) => ({ id: m, rotulo: m }))}
          valor={motivo}
          onChange={setMotivo}
        />
      </div>
      {semMotivo && <ErroCampo id={idErro}>Escolha o motivo da remoção.</ErroCampo>}

      <div className="relative mt-4">
        <textarea
          rows={3}
          value={observacao}
          maxLength={MAX_OBSERVACAO}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Observação para o registro (opcional)…"
          aria-label="Observação sobre a remoção"
          className="w-full resize-none rounded-xl border border-borda bg-superficie px-3.5 pb-7 pt-2.5 text-sm leading-relaxed text-tinta outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-texto-2 hover:border-texto-2/40 focus:border-verde focus:ring-3 focus:ring-verde/15"
        />
        <span className="pointer-events-none absolute bottom-2.5 right-3.5 text-[11.5px] tabular-nums text-texto-2">
          {observacao.length}/{MAX_OBSERVACAO}
        </span>
      </div>

      <p className="mt-3 flex gap-2 text-[12.5px] leading-relaxed text-texto-2">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>A publicação some do feed para todos e a decisão fica registrada em Moderação › Histórico.</span>
      </p>

      <RodapeSheet>
        <Button variante="secundario" tamanho="lg" className="flex-1" onClick={onFechar}>
          Cancelar
        </Button>
        <Button variante="perigo" tamanho="lg" className="flex-1" onClick={remover}>
          Remover publicação
        </Button>
      </RodapeSheet>
    </>
  );
}
