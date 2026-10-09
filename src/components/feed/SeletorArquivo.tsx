"use client";

import { CircleAlert, FileText, Loader2, Paperclip, X } from "lucide-react";
import { useId, useRef, useState, type DragEvent } from "react";
import { cn } from "@/lib/cn";
import { ACEITA_ARQUIVOS, formatarTamanho, LIMITE_BYTES, salvarArquivo, type ArquivoSalvo } from "@/lib/arquivos";
import { toast } from "@/store/ui";

interface Props {
  valor: ArquivoSalvo | null;
  onChange: (arquivo: ArquivoSalvo | null) => void;
  titulo?: string;
  dica?: string;
  accept?: string;
  className?: string;
}

/** Seletor de arquivo real (clique ou arrastar e soltar). O arquivo é guardado no navegador na hora. */
export function SeletorArquivo({
  valor,
  onChange,
  titulo = "Anexar arquivo",
  dica = `PDF, imagem ou documento · até ${formatarTamanho(LIMITE_BYTES)}`,
  accept = ACEITA_ARQUIVOS,
  className,
}: Props) {
  const id = useId();
  const entrada = useRef<HTMLInputElement>(null);
  const [sobre, setSobre] = useState(false);
  const [lendo, setLendo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const idErro = `${id}-erro`;

  const receber = async (file?: File | null) => {
    if (!file) return;
    setErro(null);
    setLendo(true);
    try {
      // O mesmo `accept` do campo vale para o clique e para arrastar e soltar (que o navegador não filtra).
      onChange(await salvarArquivo(file, accept));
    } catch (e) {
      const msg = e instanceof Error && e.message ? e.message : "Não foi possível guardar o arquivo.";
      setErro(msg);
      toast({ tipo: "alerta", titulo: "Arquivo não anexado", mensagem: msg }, 4200);
    } finally {
      setLendo(false);
    }
  };

  const soltar = (e: DragEvent) => {
    e.preventDefault();
    setSobre(false);
    void receber(e.dataTransfer.files?.[0]);
  };

  return (
    <div className={className}>
      {valor ? (
        <div className="flex items-center gap-3 rounded-xl border border-borda bg-superficie-2 p-3">
          {valor.previa ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={valor.previa} alt="Prévia da imagem escolhida" className="size-10 shrink-0 rounded-lg object-cover ring-1 ring-inset ring-borda" />
          ) : (
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-superficie text-texto-2 ring-1 ring-inset ring-borda">
              <FileText className="size-[18px]" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium text-tinta">{valor.nome}</p>
            <p className="text-[12px] tabular-nums text-texto-2">
              {valor.paginas ? `${valor.paginas} ${valor.paginas === 1 ? "página" : "páginas"} · ` : ""}
              {valor.tamanho} · pronto para enviar
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remover arquivo"
            className="grid size-9 shrink-0 place-items-center rounded-full text-texto-2 transition-[background-color,color,transform] duration-150 hover:bg-superficie hover:text-alerta active:scale-95 max-sm:size-11"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          onDragOver={(e) => {
            e.preventDefault();
            setSobre(true);
          }}
          onDragLeave={() => setSobre(false)}
          onDrop={soltar}
          className={cn(
            "flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-3 transition-[background-color,border-color,transform] duration-150 active:scale-[0.99] focus-within:border-verde focus-within:ring-3 focus-within:ring-verde/15",
            sobre ? "border-verde bg-verde-mclaro" : "border-borda bg-superficie hover:border-texto-2/40 hover:bg-superficie-2",
          )}
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-superficie-2 text-texto-2 ring-1 ring-inset ring-borda">
            {lendo ? <Loader2 className="size-[18px] animate-spin" /> : <Paperclip className="size-[18px]" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-medium text-tinta">{lendo ? "Guardando…" : sobre ? "Solte o arquivo aqui" : titulo}</span>
            <span className="block text-[12px] text-texto-2">
              <span className="max-sm:hidden">Clique ou arraste · </span>
              {dica}
            </span>
          </span>
          <input
            id={id}
            ref={entrada}
            type="file"
            className="sr-only"
            accept={accept}
            aria-describedby={erro ? idErro : undefined}
            onChange={(e) => {
              void receber(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      )}
      {erro && (
        <p id={idErro} role="alert" className="mt-1.5 flex items-start gap-1.5 text-[12px] font-medium leading-snug text-alerta">
          <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
          {erro}
        </p>
      )}
    </div>
  );
}
