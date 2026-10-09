"use client";

import { CalendarClock, Send } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AreaTexto, Campo } from "@/components/ui/Campo";
import { RodapeSheet } from "@/components/ui/RodapeSheet";
import { useRascunho } from "@/components/ui/rascunhos";
import { Sheet } from "@/components/ui/Sheet";
import { useAgora } from "@/hooks/useAgora";
import { cn } from "@/lib/cn";
import { entregarAtividade } from "@/store/actions";
import type { Atividade } from "@/store/types";
import { SeletorArquivo } from "@/components/feed/SeletorArquivo";
import type { ArquivoSalvo } from "@/lib/arquivos";
import { prazoUrgente, textoPrazo } from "./comum";

/** Entrega da atividade pela aluna: texto e/ou arquivo real, guardado no navegador. */
export function EntregaSheet({ atividade, onFechar }: { atividade: Atividade | null; onFechar: () => void }) {
  return (
    <Sheet aberto={!!atividade} onFechar={onFechar} titulo="Entregar atividade" subtitulo={atividade?.titulo}>
      {atividade && <Formulario atividade={atividade} onFechar={onFechar} />}
    </Sheet>
  );
}

function Formulario({ atividade, onFechar }: { atividade: Atividade; onFechar: () => void }) {
  const agora = useAgora(60_000);
  const [resposta, setResposta, limparRascunho] = useRascunho(`entrega:${atividade.id}`);
  const [arquivo, setArquivo] = useState<ArquivoSalvo | null>(null);
  const enviando = useRef(false);
  const atrasada = atividade.prazo < agora;
  const pode = resposta.trim().length > 0 || !!arquivo;

  const entregar = () => {
    // Trava de duplo clique: uma entrega (e uma notificação ao professor) por toque.
    if (enviando.current || !pode) return;
    enviando.current = true;
    entregarAtividade(
      atividade.id,
      resposta,
      arquivo ? { nome: arquivo.nome, paginas: arquivo.paginas ?? 0, tamanho: arquivo.tamanho, arquivoId: arquivo.id, mime: arquivo.mime, previa: arquivo.previa } : undefined,
    );
    limparRascunho();
    onFechar();
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-borda bg-superficie-2 p-3.5">
        <p className="text-[14px] leading-relaxed text-texto">{atividade.descricao}</p>
        <p className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-texto-2">
          <span className={cn("inline-flex items-center gap-1", atrasada ? "text-alerta" : prazoUrgente(atividade.prazo, agora) && "text-ouro")}>
            <CalendarClock className="size-3.5" aria-hidden />
            {textoPrazo(atividade.prazo, agora, "aluno")}
          </span>
          <span className="tabular-nums">
            até +{atividade.pontos} pontos e +{atividade.xp} XP
          </span>
        </p>
      </div>

      <Campo rotulo="Sua resposta (opcional)" htmlFor="entrega-resposta" dica="Explique seu raciocínio — o professor lê antes de dar a nota.">
        <AreaTexto
          id="entrega-resposta"
          value={resposta}
          onChange={(e) => setResposta(e.target.value)}
          placeholder="Ex.: Na questão 4 usei dois pontos do gráfico para achar o coeficiente angular…"
          maxLength={600}
          className="min-h-28"
        />
      </Campo>

      <div>
        <p className="mb-1.5 text-[13px] font-medium text-tinta">Arquivo</p>
        <SeletorArquivo valor={arquivo} onChange={setArquivo} />
        <p className="mt-1.5 text-[12px] text-texto-2">O professor abre o mesmo arquivo que você escolher aqui.</p>
      </div>

      <RodapeSheet>
        <Button variante="secundario" className="flex-1" onClick={onFechar}>
          Cancelar
        </Button>
        <Button className="flex-[2]" onClick={entregar} disabled={!pode}>
          <Send /> {atrasada ? "Entregar com atraso" : "Entregar"}
        </Button>
      </RodapeSheet>
    </div>
  );
}
