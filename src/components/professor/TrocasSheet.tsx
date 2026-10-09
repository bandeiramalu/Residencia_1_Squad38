"use client";

import { Check, PackageCheck, Ticket } from "lucide-react";
import { useRef } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LinkPessoa } from "@/components/ui/LinkPessoa";
import { Sheet } from "@/components/ui/Sheet";
import { itemPorId } from "@/data/loja";
import { useAgora } from "@/hooks/useAgora";
import { fmt } from "@/lib/format";
import { tempoRelativo } from "@/lib/tempo";
import { marcarTrocaEntregue } from "@/store/actions";
import { useEstado } from "@/store/store";
import { VazioLista } from "./comum";

/** Trocas da loja com voucher: o professor marca como entregue e a aluna é avisada. */
export function TrocasSheet({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const { compras, usuario } = useEstado();
  const agora = useAgora(60_000);
  const trocas = compras.filter((c) => c.voucher);
  const pendentes = trocas.filter((c) => !c.entregueEm);
  // Trava de duplo clique por troca: o botão só some depois do próximo render e a aluna receberia dois avisos.
  const entregando = useRef(new Set<string>());

  const entregar = (id: string, nomeItem: string) => {
    if (entregando.current.has(id)) return;
    entregando.current.add(id);
    marcarTrocaEntregue(id, nomeItem);
  };

  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo="Trocas para entregar" subtitulo={pendentes.length ? `${pendentes.length} aguardando entrega` : "Tudo entregue"}>
      {trocas.length === 0 ? (
        <div className="overflow-hidden rounded-xl border border-dashed border-borda">
          <VazioLista
            icone={<Ticket />}
            titulo="Nenhuma troca com voucher até agora"
            descricao="Quando um aluno trocar pontos por um voucher na Loja, ele aparece aqui para você entregar."
            acao={
              <Button variante="secundario" onClick={onFechar}>
                Voltar ao Painel
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="divide-y divide-borda overflow-hidden rounded-xl border border-borda">
          {[...trocas]
            .sort((a, b) => Number(!!a.entregueEm) - Number(!!b.entregueEm) || b.criadoEm - a.criadoEm)
            .map((c) => {
              const item = itemPorId(c.itemId);
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-2.5 bg-superficie px-3.5 py-3">
                  <Avatar nome={usuario.nome} tamanho="sm" />
                  <div className="min-w-0 flex-1 basis-44">
                    <p className="truncate text-[14px] font-medium text-tinta">{item?.nome ?? "Recompensa"}</p>
                    <p className="text-[12px] text-texto-2">
                      <LinkPessoa id={usuario.id} className="hover:underline">
                        {usuario.nome}
                      </LinkPessoa>
                      {" · "}
                      {fmt(c.custo)} pontos · {tempoRelativo(c.criadoEm, agora)}
                    </p>
                    <p className="mt-0.5 inline-flex items-center gap-1 font-mono text-[12px] font-medium tracking-wide text-texto">
                      <Ticket className="size-3 text-texto-2" aria-hidden /> {c.voucher}
                    </p>
                  </div>
                  {c.entregueEm ? (
                    <Badge tom="claro">
                      <Check /> Entregue {tempoRelativo(c.entregueEm, agora)}
                    </Badge>
                  ) : (
                    <Button tamanho="sm" className="toque:h-11 max-sm:w-full" onClick={() => entregar(c.id, item?.nome ?? "A recompensa")}>
                      <PackageCheck /> Marcar como entregue
                    </Button>
                  )}
                </li>
              );
            })}
        </ul>
      )}
    </Sheet>
  );
}
