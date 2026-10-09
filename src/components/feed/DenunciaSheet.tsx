"use client";

import { Bot, Camera, Info, Scale } from "lucide-react";
import { useDeferredValue, useEffect, useId, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { RodapeSheet } from "@/components/ui/RodapeSheet";
import { Sheet } from "@/components/ui/Sheet";
import { useSimulacao } from "@/hooks/useConexao";
import { executarIA, type ResultadoIA } from "@/lib/ia";
import { MOTIVOS_DENUNCIA, triarDenuncia, type MotivoDenuncia, type Triagem } from "@/lib/moderacao";
import { simulacaoAtiva } from "@/lib/simulacoes";
import { denunciar } from "@/store/actions";
import type { Post } from "@/store/types";
import { ErroCampo } from "./ErroCampo";

const MAX_DESCRICAO = 300;

/** Denúncia com motivo e evidência + prévia da triagem por IA (US05). Sem a IA, a denúncia entra na fila com o motivo escolhido. */
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
  const [tentou, setTentou] = useState(false);
  const enviando = useRef(false);
  const grupo = useRef<HTMLDivElement>(null);
  const idErro = useId();

  // Triagem (P04) com tempo-limite. Enquanto recalcula, o último resultado continua na tela (sem piscar).
  const descricaoAdiada = useDeferredValue(descricao);
  const iaSimulada = useSimulacao("ia");
  const [triagem, setTriagem] = useState<ResultadoIA<Triagem> | null>(null);
  useEffect(() => {
    if (!motivo) return;
    let cancelado = false;
    void executarIA("P04", () => triarDenuncia(motivo, post.texto, descricaoAdiada), { simulacao: "ia" }).then((r) => {
      if (!cancelado) setTriagem(r);
    });
    return () => {
      cancelado = true;
    };
  }, [motivo, post.texto, descricaoAdiada, iaSimulada]);

  const semMotivo = tentou && !motivo;

  const enviar = () => {
    if (enviando.current) return;
    if (!motivo) {
      setTentou(true);
      grupo.current?.querySelector<HTMLElement>("button")?.focus();
      return;
    }
    enviando.current = true;
    const semTriagem = triagem?.ok === false || simulacaoAtiva("ia");
    denunciar(post.id, motivo, descricao.trim(), evidencia, semTriagem ? { semTriagem: true } : undefined);
    onFechar();
  };

  return (
    <>
      <blockquote className="rounded-xl border border-borda bg-superficie-2 px-3.5 py-3">
        <p className="text-[12px] text-texto-2">Publicação denunciada</p>
        <p className="mt-1 line-clamp-3 text-[13.5px] leading-snug text-texto">{post.texto}</p>
      </blockquote>

      <p className="mb-2 mt-5 text-[13px] font-medium text-tinta">Motivo</p>
      <div ref={grupo} role="group" aria-label="Motivo da denúncia" aria-describedby={semMotivo ? idErro : undefined}>
        <ChipGroup
          grupo="motivo-denuncia"
          rotulo="Motivo da denúncia"
          quebrar
          opcoes={MOTIVOS_DENUNCIA.map((m) => ({ id: m, rotulo: m }))}
          valor={motivo}
          onChange={setMotivo}
        />
      </div>
      {semMotivo && <ErroCampo id={idErro}>Escolha o motivo da denúncia.</ErroCampo>}

      <div className="relative mt-4">
        <textarea
          rows={3}
          value={descricao}
          maxLength={MAX_DESCRICAO}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Conte o que aconteceu (opcional)…"
          aria-label="Descrição da denúncia"
          className="w-full resize-none rounded-xl border border-borda bg-superficie px-3.5 pb-7 pt-2.5 text-sm leading-relaxed text-tinta outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-texto-2 hover:border-texto-2/40 focus:border-verde focus:ring-3 focus:ring-verde/15"
        />
        <span className="pointer-events-none absolute bottom-2.5 right-3.5 text-[11.5px] tabular-nums text-texto-2">
          {descricao.length}/{MAX_DESCRICAO}
        </span>
      </div>

      <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-borda px-3.5 py-3 transition-colors duration-150 hover:bg-superficie-2">
        <input type="checkbox" checked={evidencia} onChange={(e) => setEvidencia(e.target.checked)} className="size-4 accent-verde" />
        <Camera className="size-4 text-texto-2" />
        <span className="text-[13.5px] text-texto">Anexar captura da publicação como evidência</span>
      </label>

      {motivo && triagem?.ok && (
        <section aria-label="Triagem automática" className="mt-4 rounded-xl border border-borda px-3.5 py-3">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-tinta">
            <Bot className="size-4 text-texto-2" /> Triagem automática
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge tom="contorno">{triagem.valor.categoria}</Badge>
            <Badge tom={triagem.valor.prioridade === "alta" ? "alerta" : triagem.valor.prioridade === "média" ? "ambar" : "neutro"}>
              prioridade {triagem.valor.prioridade}
            </Badge>
            <span className="text-[12px] text-texto-2">→ {triagem.valor.fila}</span>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-[12px] text-texto-2">Confiança</span>
            <ProgressBar valor={triagem.valor.confianca * 100} fina className="flex-1" rotulo="Confiança da triagem" />
            <span className="text-[12px] font-medium tabular-nums text-texto">{Math.round(triagem.valor.confianca * 100)}%</span>
          </div>
        </section>
      )}

      {motivo && triagem && !triagem.ok && (
        <p role="status" className="mt-4 flex items-start gap-2 rounded-xl bg-superficie-2 px-3.5 py-3 text-[13px] leading-snug text-texto">
          <Info className="mt-px size-4 shrink-0 text-texto-2" aria-hidden />
          Triagem indisponível no momento. A denúncia entra na fila com o motivo que você escolheu.
        </p>
      )}

      <p className="mt-3 flex gap-2 text-[12.5px] leading-relaxed text-texto-2">
        <Scale className="mt-0.5 size-4 shrink-0" />
        <span>A IA só classifica e prioriza. Quem decide é a coordenação — nada é punido automaticamente.</span>
      </p>

      <RodapeSheet>
        <Button variante="secundario" tamanho="lg" className="flex-1" onClick={onFechar}>
          Cancelar
        </Button>
        <Button tamanho="lg" className="flex-1" onClick={enviar}>
          Enviar denúncia
        </Button>
      </RodapeSheet>
    </>
  );
}
