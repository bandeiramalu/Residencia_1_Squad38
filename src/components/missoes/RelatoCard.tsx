"use client";

import { Info, Megaphone } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Nota } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
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

  return (
    <div className="overflow-hidden rounded-2xl border border-borda bg-superficie">
      <div className="flex items-start gap-3 p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-superficie-2 text-texto-2">
          <Megaphone className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-tinta">Relatar problema da escola</p>
          <p className="mt-0.5 text-[13px] leading-snug text-texto-2">Estrutura, biblioteca, merenda, tecnologia. A coordenação valida.</p>
          <Button variante="secundario" tamanho="sm" className="mt-3" onClick={() => setAberto(true)}>
            Abrir relato
          </Button>
        </div>
      </div>

      {relatos.length > 0 && (
        <ul className="divide-y divide-borda border-t border-borda">
          <AnimatePresence initial={false}>
            {relatos.slice(0, 3).map((r) => (
              <motion.li key={r.id} layout="position" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-tinta">{r.categoria}</span>
                  <Badge tom={r.status === "validado" ? "claro" : "ambar"}>{r.status === "validado" ? "Validado" : r.status === "recusado" ? "Não validado" : "Em análise"}</Badge>
                </div>
                <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-texto">{r.texto}</p>
                <p className="mt-1 text-[12px] text-texto-2">{tempoRelativo(r.criadoEm, agora)}</p>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <Sheet aberto={aberto} onFechar={() => setAberto(false)} titulo="Relatar problema da escola" subtitulo="Vai para a coordenação pedagógica e volta com resposta">
        <FormularioRelato onFechar={() => setAberto(false)} />
      </Sheet>
    </div>
  );
}

function FormularioRelato({ onFechar }: { onFechar: () => void }) {
  const [categoria, setCategoria] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const pronto = !!categoria && texto.trim().length >= 10;

  return (
    <>
      <p className="mb-2 text-[13px] font-medium text-tinta">Categoria</p>
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
        className="mt-4 w-full resize-none rounded-xl border border-borda bg-superficie px-3.5 py-3 text-sm leading-relaxed text-texto outline-none transition-colors placeholder:text-texto-2/70 focus:border-verde"
      />
      <Nota icone={<Info />} className="mt-3">
        Relato validado vale +30 pontos. Não vale XP, porque não é mérito acadêmico.
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
