"use client";

import { Check, PackageCheck, Ticket } from "lucide-react";
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

/** Trocas da loja com voucher: o professor marca como entregue e a aluna é avisada. */
export function TrocasSheet({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const { compras, usuario } = useEstado();
  const agora = useAgora(60_000);
  const trocas = compras.filter((c) => c.voucher);
  const pendentes = trocas.filter((c) => !c.entregueEm);

  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo="Trocas para entregar" subtitulo={pendentes.length ? `${pendentes.length} aguardando entrega` : "Tudo entregue"}>
      {trocas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-borda px-4 py-6 text-center text-[13px] text-texto-2">Nenhuma troca com voucher até agora.</p>
      ) : (
        <ul className="divide-y divide-borda overflow-hidden rounded-xl border border-borda">
          {[...trocas]
            .sort((a, b) => Number(!!a.entregueEm) - Number(!!b.entregueEm) || b.criadoEm - a.criadoEm)
            .map((c) => {
              const item = itemPorId(c.itemId);
              return (
                <li key={c.id} className="flex items-center gap-3 bg-superficie px-3.5 py-3">
                  <LinkPessoa id={usuario.id} rotulo={`Perfil de ${usuario.nome}`} className="shrink-0">
                    <Avatar nome={usuario.nome} tamanho="sm" />
                  </LinkPessoa>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-tinta">{item?.nome ?? "Recompensa"}</p>
                    <p className="truncate text-[12px] text-texto-2">
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
                    <Button tamanho="sm" onClick={() => marcarTrocaEntregue(c.id, item?.nome ?? "A recompensa")}>
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
