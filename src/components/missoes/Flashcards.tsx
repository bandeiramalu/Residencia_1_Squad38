"use client";

import { CircleCheck, Layers, Pencil, Plus, RefreshCw, RotateCcw, Trash2, X } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import { useState } from "react";
import { AreaTexto, Campo, Entrada, Seletor } from "@/components/ui/Campo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Sheet } from "@/components/ui/Sheet";
import { CARTAS_POR_RODADA, type Flashcard } from "@/data/missoes";
import { DISCIPLINAS, type Disciplina } from "@/data/escola";
import { useAgora } from "@/hooks/useAgora";
import { cn } from "@/lib/cn";
import { inicioDoDia } from "@/lib/estudos";
import {
  apagarCarta,
  cartaPorId,
  cartasDaEscolha,
  contarVencidas,
  iniciarRodada,
  responderFlashcard,
  sairDaRodada,
  salvarCarta,
  type EscolhaRodada,
} from "@/store/acoes/flashcards";
import { virarCarta } from "@/store/actions";
import { useSeletor } from "@/store/store";
import type { EstadoFlashcards } from "@/store/types";
import { ProgressoNaoSalvo } from "./ProgressoNaoSalvo";

const MOLA = { type: "spring", stiffness: 500, damping: 45 } as const;
const VAZIO: EstadoFlashcards = { minhas: [], caixas: {}, erradas: [] };
const ESCOLHAS: EscolhaRodada[] = ["Todas", ...DISCIPLINAS];

function rotuloEscolha(e: EscolhaRodada | undefined) {
  if (!e || e === "Todas") return "todas as disciplinas";
  if (e === "Erradas") return "as cartas que você errou";
  return e;
}

/** Prática rápida: escolha a disciplina, repetição espaçada (caixas de Leitner) e cartas próprias. */
export function Flashcards() {
  const p = useSeletor((e) => e.pratica);
  const flashSalvo = useSeletor((e) => e.flash);
  const flash = flashSalvo ?? VAZIO;
  const [gerenciar, setGerenciar] = useState(false);

  return (
    <>
      {p.ids ? <Rodada flash={flash} onGerenciar={() => setGerenciar(true)} /> : <Escolha flash={flash} onGerenciar={() => setGerenciar(true)} />}
      <MinhasCartas aberto={gerenciar} onFechar={() => setGerenciar(false)} minhas={flash.minhas} />
    </>
  );
}

function Escolha({ flash, onGerenciar }: { flash: EstadoFlashcards; onGerenciar: () => void }) {
  const [escolha, setEscolha] = useState<EscolhaRodada>("Todas");
  const agora = useAgora(60_000);
  const total = cartasDaEscolha(flash, escolha).length;
  const vencidas = contarVencidas(flash, escolha, agora);
  const nesta = Math.min(CARTAS_POR_RODADA, total);
  // A recompensa da rodada vale uma vez por dia em cada escolha (disciplina, todas ou só as erradas).
  const jaPremiada = flash.premiadas?.[escolha] === inicioDoDia(agora);

  return (
    <Card className="p-4">
      <p className="text-[13px] text-texto-2">Escolha a disciplina da rodada</p>
      <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Disciplina da rodada">
        {ESCOLHAS.map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={escolha === d}
            onClick={() => setEscolha(d)}
            className={cn(
              "h-8 rounded-full px-3 text-[13px] font-medium ring-1 transition-colors active:scale-[0.98] toque:min-h-11",
              escolha === d ? "bg-verde-mclaro text-acento ring-verde" : "bg-superficie text-texto ring-borda hover:bg-superficie-2",
            )}
          >
            {d === "Todas" ? "Todas" : d}
          </button>
        ))}
      </div>

      <p className="mt-3 text-[13px] leading-snug text-texto-2">
        {total === 0
          ? "Nenhuma carta nesta disciplina ainda. Crie as suas."
          : vencidas > 0
            ? `${vencidas} ${vencidas === 1 ? "carta vencida" : "cartas vencidas"} para revisar. A rodada começa por elas.`
            : "Nada vencido agora: a rodada traz as que vencem primeiro."}
        {total > 0 && jaPremiada && " A recompensa de hoje desta escolha já foi dada: praticar continua valendo para a memória, sem novos pontos."}
      </p>

      <div className="mt-3 grid gap-2">
        <Button bloco onClick={() => iniciarRodada(escolha)} disabled={total === 0}>
          <Layers /> Começar rodada ({nesta} {nesta === 1 ? "carta" : "cartas"})
        </Button>
        {flash.erradas.length > 0 && (
          <Button variante="secundario" bloco onClick={() => iniciarRodada("Erradas")}>
            <RotateCcw /> Revisar só as que errei ({flash.erradas.length})
          </Button>
        )}
        <Button variante="secundario" bloco onClick={onGerenciar}>
          <Plus /> Criar meus flashcards{flash.minhas.length ? ` (${flash.minhas.length})` : ""}
        </Button>
      </div>
      <p className="mt-3 text-[12px] leading-snug text-texto-2">
        Repetição espaçada: acertou, a carta sobe de caixa e volta em 1, 3, 7 e 15 dias. Errou, volta para a caixa 1.
      </p>
    </Card>
  );
}

function Rodada({ flash, onGerenciar }: { flash: EstadoFlashcards; onGerenciar: () => void }) {
  const p = useSeletor((e) => e.pratica);
  const ids = p.ids ?? [];
  // N é fixo (as cartas da rodada). As primeiras N respostas passam uma vez por cada carta; depois vem a revisão das erradas.
  const total = ids.length;
  const carta = cartaPorId(ids[p.fila[0]] ?? "", flash.minhas);
  const restantes = p.fila.length;
  const revisao = p.vistas >= total;
  const caixa = carta ? (flash.caixas[carta.id]?.caixa ?? 1) : 1;

  if (p.fim || !carta) {
    return (
      <Card className="p-5 text-center">
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <CircleCheck className="mx-auto size-8 text-acento" aria-hidden />
          <p className="mt-2 text-[15px] font-semibold text-tinta">Rodada concluída</p>
          <p className="mx-auto mt-1 max-w-xs text-[13px] text-texto-2">
            {p.acertos} {p.acertos === 1 ? "acerto" : "acertos"} em {ids.length} {ids.length === 1 ? "carta" : "cartas"} de {rotuloEscolha(p.escolha)}. Acertos em cartas vencidas contam para as missões; a recompensa da rodada vale uma vez por dia em cada escolha (cada disciplina, “Todas” e “Revisar erradas”).
          </p>
          <ProgressoNaoSalvo chaves={["d2", "coletiva"]} className="mt-3 text-left" />
          <div className="mt-4 grid gap-2">
            {flash.erradas.length > 0 && (
              <Button tamanho="sm" onClick={() => iniciarRodada("Erradas")}>
                <RotateCcw /> Revisar só as que errei ({flash.erradas.length})
              </Button>
            )}
            <Button variante="secundario" tamanho="sm" onClick={sairDaRodada}>
              <Layers /> Nova rodada
            </Button>
            <Button variante="secundario" tamanho="sm" onClick={onGerenciar}>
              <Plus /> Criar meus flashcards
            </Button>
          </div>
        </motion.div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-texto">
          {revisao ? `Revisão · faltam ${restantes}` : `Carta ${p.vistas + 1} de ${total}`}
          <span className="text-texto-2"> · {carta.disciplina}</span>
        </span>
        <span className="tabular-nums text-texto-2">
          {p.acertos} {p.acertos === 1 ? "acerto" : "acertos"}
        </span>
      </div>
      <ProgressBar valor={total - restantes} max={Math.max(1, total)} fina className="mt-2" rotulo="Cartas acertadas na rodada" />

      <div className="relative mt-4 h-40 [perspective:1200px]">
        {restantes > 1 && <div aria-hidden className="absolute inset-x-3 -bottom-1.5 top-1.5 rounded-xl border border-borda bg-superficie-2" />}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.button
            key={p.vistas}
            type="button"
            onClick={() => !p.virada && virarCarta()}
            aria-label={p.virada ? "Resposta exibida" : "Virar carta"}
            initial={{ x: 16, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -16, opacity: 0, transition: { duration: 0.15 } }}
            transition={MOLA}
            className="absolute inset-0 w-full rounded-xl [transform-style:preserve-3d]"
          >
            <motion.div className="relative h-full w-full [transform-style:preserve-3d]" animate={{ rotateY: p.virada ? 180 : 0 }} transition={MOLA}>
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-borda bg-superficie p-5 text-center [backface-visibility:hidden]">
                <span className="text-[12px] text-texto-2">Pergunta · caixa {caixa} de 5</span>
                <p className="mt-1.5 text-[15px] font-medium leading-snug text-tinta">{carta.pergunta}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-[12px] text-texto-2">
                  <RefreshCw className="size-3" aria-hidden /> Toque para virar
                </span>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center overflow-y-auto rounded-xl border border-verde-claro bg-verde-mclaro p-5 text-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <span className="text-[12px] text-acento">Resposta</span>
                <p className="mt-1.5 text-[15px] font-medium leading-snug text-tinta">{carta.resposta}</p>
              </div>
            </motion.div>
          </motion.button>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex gap-2">
        {p.virada ? (
          <>
            <Button variante="secundario" className="flex-1" onClick={() => responderFlashcard(false)}>
              Errei
            </Button>
            <Button className="flex-1" onClick={() => responderFlashcard(true)}>
              Acertei
            </Button>
          </>
        ) : (
          <Button variante="secundario" bloco onClick={virarCarta}>
            <RefreshCw /> Virar carta
          </Button>
        )}
      </div>
      <ProgressoNaoSalvo chaves={["d2", "coletiva"]} className="mt-3" />
      <button
        type="button"
        onClick={sairDaRodada}
        className="alvo-toque mt-3 inline-flex items-center gap-1 text-[12px] text-texto-2 transition-colors hover:text-tinta"
      >
        <X className="size-3" aria-hidden /> Sair da rodada
      </button>
    </Card>
  );
}

/** Criar, editar e apagar as próprias cartas (guardadas no store, valem entre sessões). */
function MinhasCartas({ aberto, onFechar, minhas }: { aberto: boolean; onFechar: () => void; minhas: Flashcard[] }) {
  const [editando, setEditando] = useState<string | null>(null);
  const [disciplina, setDisciplina] = useState<Disciplina>("Matemática");
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState("");
  const [tentou, setTentou] = useState(false);

  const limpar = () => {
    setEditando(null);
    setPergunta("");
    setResposta("");
    setTentou(false);
  };

  const salvar = () => {
    if (!pergunta.trim() || !resposta.trim()) {
      setTentou(true);
      return;
    }
    if (salvarCarta({ id: editando ?? undefined, disciplina, pergunta, resposta })) limpar();
  };

  const editar = (c: Flashcard) => {
    setEditando(c.id);
    setDisciplina(c.disciplina);
    setPergunta(c.pergunta);
    setResposta(c.resposta);
    setTentou(false);
  };

  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo="Meus flashcards" subtitulo="Frente, verso e disciplina. As cartas entram nas suas rodadas.">
      <div className="space-y-3">
        <Campo rotulo="Disciplina" htmlFor="fc-disc">
          <Seletor id="fc-disc" value={disciplina} onChange={(e) => setDisciplina(e.target.value as Disciplina)}>
            {DISCIPLINAS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Seletor>
        </Campo>
        <Campo rotulo="Frente (pergunta)" htmlFor="fc-frente" erro={tentou && !pergunta.trim() ? "Escreva a frente da carta." : undefined}>
          <Entrada id="fc-frente" value={pergunta} onChange={(e) => setPergunta(e.target.value)} maxLength={140} placeholder="Ex.: O que é fotossíntese?" />
        </Campo>
        <Campo rotulo="Verso (resposta)" htmlFor="fc-verso" erro={tentou && !resposta.trim() ? "Escreva o verso da carta." : undefined}>
          <AreaTexto id="fc-verso" value={resposta} onChange={(e) => setResposta(e.target.value)} maxLength={280} className="min-h-20" placeholder="Resposta curta e clara" />
        </Campo>
        <div className="flex gap-2">
          <Button className="flex-1" onClick={salvar}>
            {editando ? "Salvar alterações" : "Adicionar carta"}
          </Button>
          {editando && (
            <Button variante="secundario" onClick={limpar}>
              Cancelar
            </Button>
          )}
        </div>
      </div>

      <div className="mt-5 border-t border-borda pt-4">
        <p className="text-[13px] font-medium text-tinta">Suas cartas ({minhas.length})</p>
        {minhas.length === 0 ? (
          <div className="mt-2 rounded-xl border border-dashed border-borda px-4 py-5 text-center">
            <span className="mx-auto mb-2 grid size-9 place-items-center rounded-full bg-superficie-2 text-texto-2">
              <Layers className="size-4" aria-hidden />
            </span>
            <p className="text-[13px] text-texto-2">Nenhuma carta sua ainda. Escreva a primeira acima: ela entra nas suas rodadas.</p>
            <Button variante="secundario" tamanho="sm" className="mt-3" onClick={() => document.getElementById("fc-frente")?.focus()}>
              <Plus /> Criar a primeira carta
            </Button>
          </div>
        ) : (
          <ul className="mt-2 divide-y divide-borda">
            {minhas.map((c) => (
              <li key={c.id} className="flex items-start gap-2 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] text-texto-2">{c.disciplina}</p>
                  <p className="text-[14px] font-medium leading-snug text-tinta">{c.pergunta}</p>
                  <p className="text-[13px] leading-snug text-texto-2">{c.resposta}</p>
                </div>
                <button type="button" aria-label="Editar carta" onClick={() => editar(c)} className="alvo-toque grid size-8 shrink-0 place-items-center rounded-full text-texto-2 transition-colors hover:bg-superficie-2 hover:text-tinta">
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Apagar carta"
                  onClick={() => {
                    apagarCarta(c.id);
                    if (editando === c.id) limpar();
                  }}
                  className="alvo-toque grid size-8 shrink-0 place-items-center rounded-full text-texto-2 transition-colors hover:bg-superficie-2 hover:text-alerta"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Sheet>
  );
}
