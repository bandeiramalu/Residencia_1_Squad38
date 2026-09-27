"use client";

import { Bot, Camera, Scale } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Nota } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { RodapeSheet } from "@/components/ui/RodapeSheet";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";
import { MOTIVOS_DENUNCIA, triarDenuncia, type MotivoDenuncia } from "@/lib/moderacao";
import { denunciar } from "@/store/actions";
import type { Post } from "@/store/types";

/** Denúncia com motivo e evidência + prévia da triagem por IA (US05). */
export function DenunciaSheet({ post, onFechar }: { post: Post | null; onFechar: () => void }) {
  return (
    <Sheet aberto={!!post} onFechar={onFechar} titulo="Denunciar publicação" subtitulo="A coordenação analisa todas as denúncias">
      {post && <Formulario post={post} onFechar={onFechar} />}
    </Sheet>
  );
}

function Formulario({ post, onFechar }: { post: Post; onFechar: () => void }) {
  const [motivo, setMotivo] = useState<MotivoDenuncia | null>(null);
  const [descricao, setDescricao] = useState("");
  const [evidencia, setEvidencia] = useState(true);
  const triagem = useMemo(() => (motivo ? triarDenuncia(motivo, post.texto, descricao) : null), [motivo, post.texto, descricao]);

  return (
    <>
      <div className="rounded-xl border border-borda bg-fundo p-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-texto-2">Publicação denunciada</p>
        <p className="mt-1 line-clamp-3 text-[13px] leading-snug text-texto">{post.texto}</p>
      </div>

      <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-[0.08em] text-verde">Motivo</p>
      <ChipGroup
        grupo="motivo-denuncia"
        rotulo="Motivo da denúncia"
        quebrar
        opcoes={MOTIVOS_DENUNCIA.map((m) => ({ id: m, rotulo: m }))}
        valor={motivo}
        onChange={setMotivo}
      />

      <textarea
        rows={3}
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        placeholder="Conte o que aconteceu (opcional)…"
        aria-label="Descrição da denúncia"
        className="mt-4 w-full resize-none rounded-xl border border-borda bg-verde-mclaro px-3 py-2.5 text-sm text-texto outline-none transition-colors placeholder:text-texto-2/70 focus:border-verde-2 focus:bg-white"
      />

      <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-borda bg-white p-3">
        <input type="checkbox" checked={evidencia} onChange={(e) => setEvidencia(e.target.checked)} className="size-4 accent-verde" />
        <Camera className="size-4 text-verde-2" />
        <span className="text-[13px] text-texto">Anexar captura da publicação como evidência</span>
      </label>

      {triagem && (
        <div className="mt-4 rounded-2xl border border-verde-claro bg-verde-mclaro p-3.5">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-verde">
            <Bot className="size-3.5" /> Triagem automática (IA)
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge tom="verde">{triagem.categoria}</Badge>
            <Badge tom={triagem.prioridade === "alta" ? "alerta" : triagem.prioridade === "média" ? "ambar" : "neutro"}>
              prioridade {triagem.prioridade}
            </Badge>
            <span className="text-[11.5px] text-texto-2">→ {triagem.fila}</span>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-[11px] text-texto-2">Confiança</span>
            <ProgressBar valor={triagem.confianca * 100} fina className="flex-1" rotulo="Confiança da triagem" />
            <span className={cn("text-[11px] font-semibold text-texto")}>{Math.round(triagem.confianca * 100)}%</span>
          </div>
        </div>
      )}

      <Nota icone={<Scale />} tom="branco" className="mt-3">
        A IA só <b className="text-tinta">classifica e prioriza</b>. Ela não decide se a denúncia é verdadeira nem aplica punições — quem decide é
        a coordenação.
      </Nota>

      <RodapeSheet>
        <Button variante="secundario" tamanho="lg" className="flex-1" onClick={onFechar}>
          Cancelar
        </Button>
        <Button
          tamanho="lg"
          className="flex-1"
          disabled={!motivo}
          onClick={() => {
            if (!motivo) return;
            denunciar(post.id, motivo, descricao.trim(), evidencia);
            onFechar();
          }}
        >
          Enviar denúncia
        </Button>
      </RodapeSheet>
    </>
  );
}
