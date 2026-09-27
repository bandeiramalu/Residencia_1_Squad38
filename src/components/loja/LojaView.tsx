"use client";

import { Check, Coins, Lock, ShoppingBag, Star, Ticket, Trophy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Badge } from "@/components/ui/Badge";
import { Nota, TituloPagina, TituloSecao } from "@/components/ui/Blocos";
import { Card } from "@/components/ui/Card";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { ABAS_LOJA, ITENS, itemPorId, type AbaLoja, type ItemLoja } from "@/data/loja";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/format";
import { dataCurta } from "@/lib/tempo";
import { useEstado } from "@/store/store";
import { CheckoutSheet } from "./CheckoutSheet";
import { ESTILO_RARIDADE, ItemVisual } from "./ItemVisual";

/** Aba 4 — Loja (Marketplace de recompensas). */
export function LojaView() {
  const { usuario, compras } = useEstado();
  const [aba, setAba] = useState<AbaLoja>("avatar");
  const [selecionado, setSelecionado] = useState<ItemLoja | null>(null);
  const itens = ITENS.filter((i) => i.aba === aba);
  const possui = (id: string) => compras.some((c) => c.itemId === id);
  const gasto = compras.reduce((s, c) => s + c.custo, 0);

  return (
    <div className="space-y-5">
      <TituloPagina titulo="Marketplace" descricao="Troque seus pontos por itens do perfil e recompensas da escola." />

      <Card tom="suave" className="relative overflow-hidden">
        <Coins className="absolute -right-6 -top-6 size-32 text-verde/5" />
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-texto-2">Saldo de pontos</p>
        <p className="mt-1 flex items-end gap-2">
          <AnimatedNumber valor={usuario.pontos} className="text-4xl font-extrabold tracking-tight text-tinta" />
          <span className="pb-1 text-sm font-semibold text-texto-2">pontos disponíveis</span>
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] leading-snug">
          <div className="rounded-xl bg-white p-2.5">
            <p className="flex items-center gap-1 font-bold text-tinta">
              <Coins className="size-3.5 text-verde" /> Pontos de Loja
            </p>
            <p className="mt-0.5 text-texto-2">Gastáveis. Vêm de participação e constância.</p>
          </div>
          <div className="rounded-xl bg-white p-2.5">
            <p className="flex items-center gap-1 font-bold text-tinta">
              <Trophy className="size-3.5 text-verde" /> XP · {fmt(usuario.xp)}
            </p>
            <p className="mt-0.5 text-texto-2">Permanente. Define ranking e nível — comprar não muda.</p>
          </div>
        </div>
      </Card>

      <ChipGroup grupo="aba-loja" rotulo="Categorias da loja" opcoes={ABAS_LOJA.map((a) => ({ id: a.id, rotulo: a.nome }))} valor={aba} onChange={setAba} />

      {aba === "escola" && (
        <Nota icone={<Lock />}>
          Itens e experiências do próprio CEPI Expansão, retirados na secretaria com código. <b className="text-tinta">Medalhas não estão à venda</b> — só
          existem por conquista.
        </Nota>
      )}

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.ul
          key={aba}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-2 gap-3"
        >
          {itens.map((item, i) => {
            const adquirido = possui(item.id);
            const equipado = usuario.equipados.includes(item.id);
            const falta = item.custo - usuario.pontos;
            const estilo = ESTILO_RARIDADE[item.raridade];
            return (
              <motion.li key={item.id} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.035 }}>
                <button
                  type="button"
                  onClick={() => setSelecionado(item)}
                  aria-label={`${item.nome}, ${item.raridade}, ${item.custo} pontos${adquirido ? ", adquirido" : ""}`}
                  className={cn(
                    "group flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-card transition-[transform,border-color] duration-200 hover:-translate-y-0.5 active:scale-[0.98]",
                    estilo.card,
                  )}
                >
                  <div className="relative">
                    <ItemVisual icone={item.icone} raridade={item.raridade} className="aspect-[4/3] w-full" />
                    <span className="absolute left-2 top-2">
                      <Badge tom={estilo.badge}>
                        {Array.from({ length: estilo.estrelas }, (_, k) => (
                          <Star key={k} className="-mr-0.5 fill-current" />
                        ))}
                        <span className="ml-0.5">{item.raridade}</span>
                      </Badge>
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <p className="line-clamp-2 min-h-[2.5rem] text-[13px] font-semibold leading-snug text-tinta">{item.nome}</p>
                    <div className="mt-auto pt-2">
                      {adquirido ? (
                        <span className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-verde-claro text-xs font-bold text-verde">
                          <Check className="size-3.5" /> {equipado ? "Equipado" : "Adquirido"}
                        </span>
                      ) : (
                        <span
                          className={cn(
                            "flex h-8 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-colors",
                            falta > 0 ? "bg-fundo text-texto-2" : "bg-verde text-white group-hover:bg-verde-2",
                          )}
                        >
                          <Coins className="size-3.5" /> {fmt(item.custo)} pts
                        </span>
                      )}
                      {!adquirido && falta > 0 && <p className="mt-1 text-center text-[10.5px] text-texto-2">faltam {fmt(falta)}</p>}
                    </div>
                  </div>
                </button>
              </motion.li>
            );
          })}
        </motion.ul>
      </AnimatePresence>

      <section>
        <TituloSecao extra={`${fmt(gasto)} pontos usados`}>Histórico de trocas</TituloSecao>
        <Card semPadding className="divide-y divide-borda overflow-hidden">
          {compras.length === 0 && <p className="p-4 text-sm text-texto-2">Você ainda não fez nenhuma troca.</p>}
          <AnimatePresence initial={false}>
            {compras.map((c) => {
              const item = itemPorId(c.itemId);
              return (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, backgroundColor: "#e3f4eb" }}
                  animate={{ opacity: 1, backgroundColor: "#ffffff" }}
                  transition={{ duration: 1.2 }}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-verde-claro text-verde">
                    {c.voucher ? <Ticket className="size-4" /> : <ShoppingBag className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-tinta">{item?.nome}</p>
                    <p className="text-[11.5px] text-texto-2">
                      {dataCurta(c.criadoEm)}
                      {c.voucher && (
                        <>
                          {" "}
                          · código <b className="font-mono text-verde">{c.voucher}</b>
                        </>
                      )}
                    </p>
                  </div>
                  <span className="shrink-0 text-[13px] font-bold text-texto-2">−{fmt(c.custo)} pts</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </Card>
      </section>

      <CheckoutSheet item={selecionado} onFechar={() => setSelecionado(null)} />
    </div>
  );
}
