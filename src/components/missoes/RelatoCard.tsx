"use client";

import { Info, Megaphone } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Nota } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { RodapeSheet } from "@/components/ui/RodapeSheet";
import { Sheet } from "@/components/ui/Sheet";
import { CATEGORIAS_RELATO } from "@/data/missoes";
import { useAgora } from "@/hooks/useAgora";
import { tempoRelativo } from "@/lib/tempo";
import { enviarRelato } from "@/store/actions";
import { useEstado } from "@/store/store";

/** Canal de ouvidoria: relatar problemas da escola (fluxo 3.4). */
export function RelatoCard() {
  const { relatos } = useEstado();
  const agora = useAgora(30_000);
  const [aberto, setAberto] = useState(false);
  const emAnalise = relatos.some((r) => r.status === "em análise");

  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-verde-claro text-verde">
          <Megaphone className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[15px] font-bold text-tinta">Relatar problema da escola</p>
            <AnimatePresence>
              {emAnalise && (
                <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                  <Badge tom="ambar" maiuscula>
                    Em análise
                  </Badge>
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <p className="mt-1 text-[12.5px] leading-snug text-texto-2">
            Estrutura, biblioteca, merenda, tecnologia. A coordenação valida e você recebe o crédito.
          </p>
        </div>
      </div>

      <Button variante="secundario" bloco className="mt-4" onClick={() => setAberto(true)}>
        Abrir relato
      </Button>

      {relatos.length > 0 && (
        <ul className="mt-4 space-y-2">
          <AnimatePresence initial={false}>
            {relatos.slice(0, 3).map((r) => (
              <motion.li key={r.id} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-verde-mclaro p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12.5px] font-bold text-tinta">{r.categoria}</span>
                  <Badge tom={r.status === "validado" ? "verde" : "ambar"} maiuscula>
                    {r.status}
                  </Badge>
                </div>
                <p className="mt-1 text-[12.5px] leading-snug text-texto">{r.texto}</p>
                <p className="mt-1 text-[11px] text-texto-2">{tempoRelativo(r.criadoEm, agora)}</p>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <Sheet aberto={aberto} onFechar={() => setAberto(false)} titulo="Relatar problema da escola" subtitulo="Vai para a coordenação pedagógica e volta com resposta">
        <FormularioRelato onFechar={() => setAberto(false)} />
      </Sheet>
    </Card>
  );
}

function FormularioRelato({ onFechar }: { onFechar: () => void }) {
  const [categoria, setCategoria] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const pronto = !!categoria && texto.trim().length >= 10;

  return (
    <>
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-verde">Categoria</p>
      <ChipGroup
        grupo="categoria-relato"
        rotulo="Categoria do relato"
        quebrar
        opcoes={CATEGORIAS_RELATO.map((c) => ({ id: c, rotulo: c }))}
        valor={categoria}
        onChange={setCategoria}
      />
      <textarea
        rows={4}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Descreva o problema, onde acontece e desde quando…"
        aria-label="Descrição do problema"
        className="mt-4 w-full resize-none rounded-2xl border border-borda bg-verde-mclaro px-4 py-3 text-sm leading-relaxed text-texto outline-none transition-colors placeholder:text-texto-2/70 focus:border-verde-2 focus:bg-white"
      />
      <Nota icone={<Info />} className="mt-3">
        Relato validado vale <b className="text-tinta">+30 pontos</b>. Não vale XP, porque não é mérito acadêmico.
      </Nota>
      <RodapeSheet>
        <Button variante="secundario" tamanho="lg" className="flex-1" onClick={onFechar}>
          Cancelar
        </Button>
        <Button
          tamanho="lg"
          className="flex-1"
          disabled={!pronto}
          onClick={() => {
            if (!categoria) return;
            enviarRelato(categoria, texto.trim());
            onFechar();
          }}
        >
          Enviar relato
        </Button>
      </RodapeSheet>
    </>
  );
}
