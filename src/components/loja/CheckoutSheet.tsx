"use client";

import { Check, Coins, Ticket, TriangleAlert } from "lucide-react";
import { m as motion } from "motion/react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { RodapeSheet } from "@/components/ui/RodapeSheet";
import { Sheet } from "@/components/ui/Sheet";
import type { ItemLoja } from "@/data/loja";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/format";
import { comprar, equipar } from "@/store/actions";
import { useEstado } from "@/store/store";
import { ESTILO_RARIDADE, PreviaItem, ROTULO_SLOT } from "./ItemVisual";

/** Modal "Confirmar troca": saldo atual × saldo após a compra (fluxo 3.3). */
export function CheckoutSheet({ aberto, item, onFechar }: { aberto: boolean; item: ItemLoja; onFechar: () => void }) {
  const { usuario, compras } = useEstado();
  const voucher = item.slot === "voucher";
  const trocas = compras.filter((c) => c.itemId === item.id);
  // Itens do perfil são únicos; vouchers (cantina, secretaria) podem ser trocados de novo — cada troca gera um código novo
  // (os códigos e o comprovante em PDF ficam no histórico de trocas da Loja).
  const adquirido = !voucher && trocas.length > 0;
  const equipado = usuario.equipados.includes(item.id);
  const depois = usuario.pontos - item.custo;
  const semSaldo = depois < 0;
  const trocando = useRef(false);

  // O modal fica montado entre aberturas: a trava de duplo clique volta a cada abertura.
  useEffect(() => {
    if (aberto) trocando.current = false;
  }, [aberto]);

  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo={adquirido ? "Seu item" : "Confirmar troca"}>
      <div className="flex items-center gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
          className="grid size-20 shrink-0 place-items-center rounded-2xl border border-borda bg-superficie-2"
        >
          <PreviaItem item={item} nome={usuario.nome} compacta />
        </motion.div>
        <div className="min-w-0">
          <p className="text-[12.5px] text-texto-2">
            <span className={ESTILO_RARIDADE[item.raridade].texto}>{item.raridade}</span> · {ROTULO_SLOT[item.slot]}
          </p>
          <p className="mt-0.5 text-[16px] font-semibold leading-snug text-tinta">{item.nome}</p>
          <p className="mt-0.5 text-[13px] leading-snug text-texto-2">{item.descricao}</p>
        </div>
      </div>

      {adquirido ? (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-borda px-4 py-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-verde-claro text-acento">
            <Check className="size-4" strokeWidth={2.4} />
          </span>
          <div className="min-w-0 text-[13.5px]">
            <p className="font-medium text-tinta">Você já tem este item</p>
            <p className="text-texto-2">{equipado ? "Está equipado no seu perfil." : "Está guardado no seu perfil."}</p>
          </div>
        </div>
      ) : (
        <>
          {voucher && trocas.length > 0 && (
            <p className="mt-5 flex items-start gap-1.5 text-[12.5px] leading-snug text-texto-2">
              <Ticket className="mt-px size-3.5 shrink-0" aria-hidden /> Você já trocou este item {trocas.length === 1 ? "1 vez" : `${trocas.length} vezes`}. Cada troca gera um código novo; os códigos ficam no histórico.
            </p>
          )}
          <dl className={cn("divide-y divide-borda overflow-hidden rounded-xl border border-borda text-[14px] tabular-nums", voucher && trocas.length > 0 ? "mt-3" : "mt-5")}>
            <div className="flex items-center justify-between px-4 py-3">
              <dt className="text-texto-2">Saldo atual</dt>
              <dd className="font-medium text-texto">{fmt(usuario.pontos)} pontos</dd>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <dt className="text-texto-2">Custo do item</dt>
              <dd className="flex items-center gap-1 font-medium text-tinta">
                − <Coins className="size-3.5 text-ambar" aria-hidden /> {fmt(item.custo)}
              </dd>
            </div>
            <div className="flex items-center justify-between bg-superficie-2 px-4 py-3">
              <dt className="font-medium text-tinta">Saldo após a troca</dt>
              <dd className={cn("text-[15px] font-semibold", semSaldo ? "text-alerta" : "text-tinta")}>
                {semSaldo ? `faltam ${fmt(-depois)}` : `${fmt(depois)} pontos`}
              </dd>
            </div>
          </dl>
          {semSaldo && (
            <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-borda bg-superficie-2 px-3.5 py-3 text-[13.5px] font-medium leading-snug text-alerta">
              <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden />
              Saldo insuficiente: você possui {fmt(usuario.pontos)} pontos e este item requer {fmt(item.custo)} pontos.
            </p>
          )}
        </>
      )}

      <div className="mt-3 space-y-1.5 text-[12.5px] leading-snug text-texto-2">
        {voucher && (
          <p className="flex items-start gap-1.5">
            <Ticket className="mt-px size-3.5 shrink-0" aria-hidden /> Você recebe um código para retirar na secretaria do CEPI.
          </p>
        )}
        {voucher && (
          <p>
            Como retirar: vá à secretaria do CEPI (ou à cantina, nas recompensas de lanche) com o código e um documento. A entrega é registrada no portal.
          </p>
        )}
        <p>Trocas não mudam seu XP ({fmt(usuario.xp)}) nem sua posição no ranking.</p>
      </div>

      <RodapeSheet>
        <Button variante="secundario" tamanho="lg" className="flex-1" onClick={onFechar}>
          {adquirido ? "Fechar" : "Cancelar"}
        </Button>
        {adquirido ? (
          <Button variante={equipado ? "secundario" : "primario"} tamanho="lg" className="flex-1" onClick={() => equipar(item.id, !equipado)}>
            {equipado ? "Remover do perfil" : "Equipar"}
          </Button>
        ) : (
          <Button
            tamanho="lg"
            className="flex-1"
            disabled={semSaldo}
            onClick={() => {
              if (trocando.current || semSaldo) return;
              trocando.current = true;
              if (comprar(item.id)) onFechar();
              else trocando.current = false;
            }}
          >
            Trocar pontos
          </Button>
        )}
      </RodapeSheet>
    </Sheet>
  );
}
