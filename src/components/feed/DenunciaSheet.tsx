"use client";

import { Bot, Camera, Scale } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { RodapeSheet } from "@/components/ui/RodapeSheet";
import { Sheet } from "@/components/ui/Sheet";
import { MOTIVOS_DENUNCIA, triarDenuncia, type MotivoDenuncia } from "@/lib/moderacao";
import { denunciar } from "@/store/actions";
import type { Post } from "@/store/types";

/** Denúncia com motivo e evidência + prévia da triagem por IA (US05). */
export function DenunciaSheet({ aberto, post, onFechar }: { aberto: boolean; post: Post; onFechar: () => void }) {
  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo="Denunciar publicação" subtitulo="A coordenação analisa todas as denúncias">
      <Formulario key={post.id} post={post} onFechar={onFechar} />
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
      <blockquote className="rounded-xl border border-borda bg-superficie-2 px-3.5 py-3">
        <p className="text-[12px] text-texto-2">Publicação denunciada</p>
        <p className="mt-1 line-clamp-3 text-[13.5px] leading-snug text-texto">{post.texto}</p>
      </blockquote>

      <p className="mb-2 mt-5 text-[13px] font-medium text-tinta">Motivo</p>
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
        className="mt-4 w-full resize-none rounded-xl border border-borda bg-superficie px-3.5 py-2.5 text-sm leading-relaxed text-tinta outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-texto-2/70 hover:border-texto-2/40 focus:border-verde focus:ring-3 focus:ring-verde/15"
      />

      <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-borda px-3.5 py-3 transition-colors duration-150 hover:bg-superficie-2">
        <input type="checkbox" checked={evidencia} onChange={(e) => setEvidencia(e.target.checked)} className="size-4 accent-verde" />
        <Camera className="size-4 text-texto-2" />
        <span className="text-[13.5px] text-texto">Anexar captura da publicação como evidência</span>
      </label>

      {triagem && (
        <section aria-label="Triagem automática" className="mt-4 rounded-xl border border-borda px-3.5 py-3">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-tinta">
            <Bot className="size-4 text-texto-2" /> Triagem automática
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge tom="contorno">{triagem.categoria}</Badge>
            <Badge tom={triagem.prioridade === "alta" ? "alerta" : triagem.prioridade === "média" ? "ambar" : "neutro"}>
              prioridade {triagem.prioridade}
            </Badge>
            <span className="text-[12px] text-texto-2">→ {triagem.fila}</span>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-[12px] text-texto-2">Confiança</span>
            <ProgressBar valor={triagem.confianca * 100} fina className="flex-1" rotulo="Confiança da triagem" />
            <span className="text-[12px] font-medium tabular-nums text-texto">{Math.round(triagem.confianca * 100)}%</span>
          </div>
        </section>
      )}

      <p className="mt-3 flex gap-2 text-[12.5px] leading-relaxed text-texto-2">
        <Scale className="mt-0.5 size-4 shrink-0" />
        <span>A IA só classifica e prioriza. Quem decide é a coordenação — nada é punido automaticamente.</span>
      </p>

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
