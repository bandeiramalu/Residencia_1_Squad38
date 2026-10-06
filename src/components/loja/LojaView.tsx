"use client";

import { Check, ChevronRight, Coins, Download, ShoppingBag, Ticket } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Abas } from "@/components/feed/Abas";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { TituloPagina, TituloSecao } from "@/components/ui/Blocos";
import { Card } from "@/components/ui/Card";
import { ABAS_LOJA, ITENS, itemPorId, type AbaLoja, type ItemLoja } from "@/data/loja";
import { fmt, plural } from "@/lib/format";
import { dataCurta } from "@/lib/tempo";
import { useEstado } from "@/store/store";
import { baixarComprovante } from "./comprovante";
import { ESTILO_RARIDADE, ItemVisual, PreviaItem, ROTULO_SLOT } from "./ItemVisual";

// O modal de troca só é baixado quando a aluna toca num item (e antecipado no hover).
const CheckoutSheet = dynamic(() => import("./CheckoutSheet").then((m) => m.CheckoutSheet));
const preCarregarCheckout = () => void import("./CheckoutSheet");

const SUAVE = [0.2, 0, 0, 1] as const;

/** Aba 4 — Loja: troca de pontos por itens do perfil e recompensas da escola. */
export function LojaView() {
  const { usuario, compras } = useEstado();
  const [aba, setAba] = useState<AbaLoja>("avatar");
  // `null` = modal nunca aberto. Depois fica montado e guarda o item enquanto fecha.
  const [checkout, setCheckout] = useState<{ item: ItemLoja; aberto: boolean } | null>(null);
  const itens = ITENS.filter((i) => i.aba === aba);
  const gasto = compras.reduce((s, c) => s + c.custo, 0);

  return (
    <div className="space-y-6">
      <TituloPagina titulo="Loja" descricao="Troque seus pontos por itens do perfil e recompensas da escola." />

      <section aria-label="Saldo" className="rounded-2xl border border-borda bg-superficie p-4 sm:p-5" title="Comprar na Loja não muda o XP nem o ranking.">
        <p className="text-[13px] text-texto-2">Pontos para trocar</p>
        <p className="mt-1 flex items-center gap-2">
          <Coins className="size-5 shrink-0 text-ambar" aria-hidden />
          <AnimatedNumber valor={usuario.pontos} className="text-2xl font-semibold tabular-nums text-tinta" />
        </p>
        <p className="mt-1 text-[12.5px] text-texto-2">{compras.length ? plural(compras.length, "troca feita", "trocas feitas") : "Nenhuma troca ainda"} · XP não é gasto na Loja</p>
      </section>

      <div className="space-y-4">
        <Abas grupo="aba-loja" rotulo="Categorias da loja" opcoes={ABAS_LOJA.map((a) => ({ id: a.id, rotulo: a.nome }))} valor={aba} onChange={setAba} />

        {aba === "escola" && (
          <p className="flex items-center gap-2 text-[13px] text-texto-2">
            <Ticket className="size-4 shrink-0" aria-hidden />
            Retire na secretaria (ou na cantina, nos lanches) com o código. Medalhas não estão à venda.
          </p>
        )}

        <AnimatePresence mode="popLayout" initial={false}>
          <motion.ul
            key={aba}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: SUAVE }}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4"
            aria-label="Itens da loja"
          >
            {itens.map((item) => (
              <li key={item.id} className="cv-auto">
                <CartaoItem
                  item={item}
                  nome={usuario.nome}
                  pontos={usuario.pontos}
                  adquirido={compras.some((c) => c.itemId === item.id)}
                  equipado={usuario.equipados.includes(item.id)}
                  onAbrir={() => setCheckout({ item, aberto: true })}
                />
              </li>
            ))}
          </motion.ul>
        </AnimatePresence>
      </div>

      <section>
        <TituloSecao extra={compras.length ? `${fmt(gasto)} pontos usados` : undefined}>Histórico de trocas</TituloSecao>
        <Card semPadding className="overflow-hidden">
          {compras.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13.5px] text-texto-2">Você ainda não fez nenhuma troca.</p>
          ) : (
            <ul className="divide-y divide-borda">
              <AnimatePresence initial={false}>
                {compras.map((c) => {
                  const item = itemPorId(c.itemId);
                  return (
                    <motion.li
                      key={c.id}
                      layout="position"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, ease: SUAVE }}
                      className="relative flex items-center gap-3 px-4 py-3"
                    >
                      {/* Realce de "acabou de entrar": só a opacidade anima, a cor vem do tema. */}
                      <motion.span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-superficie-2"
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                      />
                      {item ? (
                        <ItemVisual icone={item.icone} raridade={item.raridade} className="relative size-10 shrink-0 rounded-lg" tamanhoIcone="size-[18px]" />
                      ) : (
                        <span className="relative grid size-10 shrink-0 place-items-center rounded-lg bg-superficie-2 text-texto-2 ring-1 ring-inset ring-borda">
                          {c.voucher ? <Ticket className="size-4" /> : <ShoppingBag className="size-4" />}
                        </span>
                      )}
                      <div className="relative min-w-0 flex-1">
                        <p className="truncate text-[14px] font-medium text-tinta">{item?.nome}</p>
                        <p className="text-[12.5px] text-texto-2">
                          {dataCurta(c.criadoEm)}
                          {c.voucher && (
                            <>
                              {" "}
                              · código <span className="font-mono font-medium tracking-wide text-tinta">{c.voucher}</span>
                            </>
                          )}
                        </p>
                        {c.voucher && <p className={c.entregueEm ? "text-[12.5px] font-medium text-acento" : "text-[12.5px] text-texto-2"}>{c.entregueEm ? `Entregue em ${dataCurta(c.entregueEm)}` : "Aguardando retirada"}</p>}
                      </div>
                      {c.voucher && (
                        <button
                          type="button"
                          onClick={() => baixarComprovante(c, item, usuario.nome, usuario.pontos)}
                          aria-label={`Baixar comprovante (PDF) de ${item?.nome ?? "troca"}`}
                          title="Baixar comprovante (PDF)"
                          className="relative grid size-9 shrink-0 place-items-center rounded-full text-texto-2 transition-colors duration-150 hover:bg-superficie-2 hover:text-tinta active:scale-95"
                        >
                          <Download className="size-4" />
                        </button>
                      )}
                      <span className="relative inline-flex shrink-0 items-center gap-1 text-[13px] font-medium tabular-nums text-texto-2">
                        −<Coins className="size-3.5 text-ambar" aria-hidden />
                        {fmt(c.custo)}
                      </span>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </Card>
      </section>

      {checkout && <CheckoutSheet aberto={checkout.aberto} item={checkout.item} onFechar={() => setCheckout({ ...checkout, aberto: false })} />}
    </div>
  );
}

function CartaoItem({
  item,
  nome,
  pontos,
  adquirido,
  equipado,
  onAbrir,
}: {
  item: ItemLoja;
  nome: string;
  pontos: number;
  adquirido: boolean;
  equipado: boolean;
  onAbrir: () => void;
}) {
  const falta = item.custo - pontos;

  return (
    <button
      type="button"
      onClick={onAbrir}
      onPointerEnter={preCarregarCheckout}
      aria-label={`${item.nome}, ${item.raridade}, ${item.custo} pontos${adquirido ? ", adquirido" : ""}`}
      title={item.descricao}
      className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-borda bg-superficie text-left transition-colors duration-150 hover:border-texto-2/35 active:scale-[0.99]"
    >
      <div className="grid aspect-[4/3] w-full place-items-center border-b border-borda bg-superficie-2 sm:aspect-[16/10]">
        <span className="transition-transform duration-200 ease-suave group-hover:scale-[1.04]">
          <PreviaItem item={item} nome={nome} />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-3.5">
        <p className="truncate text-[12px] text-texto-2">
          <span className={ESTILO_RARIDADE[item.raridade].texto}>{item.raridade}</span> · {ROTULO_SLOT[item.slot]}
        </p>
        <p className="mt-0.5 line-clamp-2 min-h-[2.5rem] text-[14px] font-medium leading-snug text-tinta">{item.nome}</p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
          <span className="inline-flex items-center gap-1 text-[14px] font-semibold tabular-nums text-tinta">
            <Coins className="size-4 text-ambar" aria-hidden />
            {fmt(item.custo)}
          </span>
          {adquirido ? (
            <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-acento">
              <Check className="size-3.5" /> {equipado ? "Equipado" : "Adquirido"}
            </span>
          ) : falta > 0 ? (
            <span className="truncate text-[12px] tabular-nums text-texto-2">faltam {fmt(falta)}</span>
          ) : (
            <span className="inline-flex items-center text-[12.5px] font-medium text-acento">
              Trocar <ChevronRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
