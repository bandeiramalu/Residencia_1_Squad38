"use client";

import { Star, Ticket, Trophy } from "lucide-react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/Badge";
import { Nota } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { RodapeSheet } from "@/components/ui/RodapeSheet";
import { Sheet } from "@/components/ui/Sheet";
import type { ItemLoja } from "@/data/loja";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/format";
import { comprar, equipar } from "@/store/actions";
import { useEstado } from "@/store/store";
import { ESTILO_RARIDADE, ItemVisual } from "./ItemVisual";

/** Modal "Confirmar troca": saldo atual × saldo após a compra (fluxo 3.3). */
export function CheckoutSheet({ item, onFechar }: { item: ItemLoja | null; onFechar: () => void }) {
  const { usuario, compras } = useEstado();

  return (
    <Sheet aberto={!!item} onFechar={onFechar} titulo="Confirmar troca" subtitulo="Confira o valor antes de usar seus pontos">
      {item &&
        (() => {
          const adquirido = compras.some((c) => c.itemId === item.id);
          const equipado = usuario.equipados.includes(item.id);
          const depois = usuario.pontos - item.custo;
          const estilo = ESTILO_RARIDADE[item.raridade];
          const voucher = item.slot === "voucher";

          return (
            <>
              <div className="flex items-center gap-4">
                <motion.div initial={{ scale: 0.8, rotate: -6 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 400, damping: 16 }}>
                  <ItemVisual icone={item.icone} raridade={item.raridade} className="size-20 rounded-2xl" tamanhoIcone="size-9" />
                </motion.div>
                <div className="min-w-0">
                  <p className="text-base font-bold leading-snug text-tinta">{item.nome}</p>
                  <Badge tom={estilo.badge} className="mt-1.5">
                    {Array.from({ length: estilo.estrelas }, (_, k) => (
                      <Star key={k} className="-mr-0.5 fill-current" />
                    ))}
                    <span className="ml-0.5">{item.raridade}</span>
                  </Badge>
                  <p className="mt-1.5 text-[12.5px] leading-snug text-texto-2">{item.descricao}</p>
                </div>
              </div>

              {adquirido ? (
                <div className="mt-5 rounded-2xl bg-verde-mclaro p-4 text-center">
                  <p className="text-sm font-bold text-verde">Você já tem este item</p>
                  {!voucher && (
                    <p className="mt-1 text-[12.5px] text-texto-2">{equipado ? "Ele está equipado no seu perfil." : "Ele está guardado no seu perfil."}</p>
                  )}
                  {voucher && (
                    <p className="mt-1 text-[12.5px] text-texto-2">
                      Código: <b className="font-mono text-verde">{compras.find((c) => c.itemId === item.id)?.voucher}</b>
                    </p>
                  )}
                </div>
              ) : (
                <dl className="mt-5 divide-y divide-borda rounded-2xl border border-borda text-[13.5px]">
                  <div className="flex items-center justify-between px-4 py-3">
                    <dt className="text-texto-2">Custo do item</dt>
                    <dd className="font-bold text-tinta">− {fmt(item.custo)} pontos</dd>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <dt className="text-texto-2">Saldo atual</dt>
                    <dd className="font-semibold text-texto">{fmt(usuario.pontos)} pontos</dd>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <dt className="text-texto-2">Saldo após a compra</dt>
                    <dd className={cn("font-extrabold", depois < 0 ? "text-alerta" : "text-verde")}>
                      {depois < 0 ? `faltam ${fmt(-depois)}` : `${fmt(depois)} pontos`}
                    </dd>
                  </div>
                </dl>
              )}

              {voucher && !adquirido && (
                <Nota icone={<Ticket />} tom="azul" className="mt-3">
                  Você recebe um <b className="text-tinta">código</b> para retirar na secretaria do CEPI.
                </Nota>
              )}
              <Nota icone={<Trophy />} className="mt-3">
                Seu <b className="text-tinta">{fmt(usuario.xp)} XP</b> e sua posição no ranking não mudam com esta compra. Ranking é por XP; loja é por pontos.
              </Nota>

              <RodapeSheet>
                <Button variante="secundario" tamanho="lg" className="flex-1" onClick={onFechar}>
                  {adquirido ? "Fechar" : "Cancelar"}
                </Button>
                {adquirido ? (
                  !voucher && (
                    <Button tamanho="lg" className="flex-1" onClick={() => equipar(item.id, !equipado)}>
                      {equipado ? "Remover do perfil" : "Equipar"}
                    </Button>
                  )
                ) : (
                  <Button
                    tamanho="lg"
                    className="flex-1"
                    disabled={depois < 0}
                    onClick={() => {
                      if (comprar(item.id)) onFechar();
                    }}
                  >
                    {depois < 0 ? "Saldo insuficiente" : "Comprar"}
                  </Button>
                )}
              </RodapeSheet>
            </>
          );
        })()}
    </Sheet>
  );
}
