"use client";

import { ArrowRight, Check, Keyboard, Timer, Trophy, X } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { LinkPessoa } from "@/components/ui/LinkPessoa";
import { Button } from "@/components/ui/Button";
import { nomeDaRodada, ROTULO_METRICA } from "@/data/campeonatos";
import type { Questao } from "@/data/desafios";
import { perguntasDoDuelo } from "@/data/quiz";
import { useAgora } from "@/hooks/useAgora";
import { classificacao, desempenhoDoColega, nivelDoEstado, totalRodadas } from "@/lib/campeonatos";
import { cn } from "@/lib/cn";
import { fmt, primeiroNome } from "@/lib/format";
import { abandonarDuelo, iniciarDuelo, iniciarRodadaQuiz, jogarDuelo, jogarRodadaQuiz, registrarRespostaDuelo, type ResultadoDuelo } from "@/store/actions";
import { obterEstado, useSeletor } from "@/store/store";
import type { Campeonato, Pessoa } from "@/store/types";
import { aFaseArtigo, LINK_PRIMARIO, naFase, ordinal, useDesempate } from "./comum";

const TEMPO_MS = 20_000;
const LETRAS = ["A", "B", "C", "D"];
const SUAVE = [0.2, 0, 0, 1] as const;

/** Leitura do relógio — chamada só em handlers e efeitos (início da pergunta, tempo de resposta). */
function relogio() {
  return Date.now();
}

export type ModoJogo = { tipo: "duelo"; partidaId: string } | { tipo: "rodada" };

interface Props {
  campId: string;
  modo: ModoJogo;
  /** Muda a cada novo jogo (próximo duelo, outra rodada): remonta só o conteúdo, sem piscar a tela. */
  chave: string;
  onFechar: () => void;
  /** Vitória com próximo confronto liberado: abre o próximo duelo. */
  onProximo: (partidaId: string) => void;
}

type Fim = { tipo: "duelo"; r: ResultadoDuelo } | { tipo: "rodada"; posicao: number } | { tipo: "erro"; rodada?: boolean };

/**
 * Duelo/rodada de quiz num modal no tema atual (tela cheia no celular): apresentação, 5 perguntas com 20 s,
 * feedback imediato, placar discreto com o ritmo do adversário (derivado do nível real dele) e o resultado.
 * Os dados do jogo (perguntas, adversário) são fotografados na abertura: o resultado muda o campeonato
 * no meio da tela e nada pode "pular".
 */
export function Duelo({ chave, ...props }: Props) {
  const painel = useRef<HTMLDivElement>(null);

  // Trava a rolagem da página e foca o diálogo enquanto o jogo está aberto.
  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // O botão com autoFocus (ex.: "Começar duelo") já pode estar focado: não roubar o foco dele.
    if (!painel.current?.contains(document.activeElement)) painel.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  useEffect(() => {
    painel.current?.scrollTo({ top: 0 });
  }, [chave]);

  return (
    <motion.div className="fixed inset-0 z-[55] sm:grid sm:place-items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
      <div className="absolute inset-0 hidden bg-slate-950/40 sm:block" aria-hidden />
      <motion.div
        ref={painel}
        role="dialog"
        aria-modal="true"
        aria-label={props.modo.tipo === "duelo" ? "Duelo de quiz" : "Rodada de quiz"}
        tabIndex={-1}
        className="relative flex h-full w-full flex-col overflow-y-auto overscroll-contain bg-superficie text-texto outline-none sm:h-auto sm:max-h-[min(760px,calc(100dvh-3rem))] sm:max-w-[600px] sm:rounded-2xl sm:border sm:border-borda"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.2, ease: SUAVE }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <Jogo key={chave} {...props} />
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

function Jogo({ campId, modo, onFechar, onProximo }: Omit<Props, "chave">) {
  const c = useSeletor((e) => e.campeonatos.find((x) => x.id === campId));
  const usuario = useSeletor((e) => e.usuario);
  const pessoas = useSeletor((e) => e.pessoas);

  const [jogo] = useState(() => {
    const partida = modo.tipo === "duelo" ? c?.partidas.find((p) => p.id === modo.partidaId) : undefined;
    const rivalId = partida ? (partida.a === usuario.id ? partida.b : partida.a) : null;
    const semente = modo.tipo === "duelo" ? `${campId}-${modo.partidaId}` : `${campId}-rodada-${c?.placar[usuario.id] ?? 0}`;
    const desempenhoRival = modo.tipo === "duelo" && rivalId ? desempenhoDoColega(nivelDoEstado(obterEstado(), c?.disciplina)(rivalId), `${campId}-${modo.partidaId}-${rivalId}`, 5) : null;
    return {
      perguntas: perguntasDoDuelo(c?.disciplina, semente, 5),
      rivalId,
      fase: partida && c ? nomeDaRodada(partida.rodada, totalRodadas(c)) : "Rodada",
      /** Quanto o adversário leva em cada pergunta (ms), conforme o nível dele — o mesmo desempenho que decide o duelo. */
      temposRival: desempenhoRival?.tempos ?? [],
    };
  });
  const { perguntas, rivalId } = jogo;

  const [fase, setFase] = useState<"intro" | "jogo" | "fim">("intro");
  const [indice, setIndice] = useState(0);
  const [inicio, setInicio] = useState(0);
  const [respostas, setRespostas] = useState<(number | null)[]>([]);
  const [usados, setUsados] = useState<number[]>([]);
  const [fim, setFim] = useState<Fim | null>(null);
  const [saindo, setSaindo] = useState(false);
  /** Perguntas já respondidas (clique, tecla ou tempo esgotado): cada uma conta uma única vez. */
  const registradas = useRef(new Set<number>());
  /** O resultado só é pedido uma vez (duplo clique em "Ver resultado" não vira "partida já disputada"). */
  const finalizado = useRef(false);

  const respondida = respostas.length > indice;
  const acertos = respostas.filter((r, i) => r === perguntas[i]?.correta).length;
  const pergunta = perguntas[indice];

  // Registra uma resposta (opção escolhida ou `null` = tempo esgotado). No duelo, cada resposta também vai para o
  // estado: se a aluna sair ou recarregar no meio, a partida é finalizada com o que já foi feito.
  const registrar = useCallback(
    (n: number, opcao: number | null, usado: number) => {
      if (registradas.current.has(n)) return;
      registradas.current.add(n);
      setRespostas((r) => (r.length > n ? r : [...r, opcao]));
      setUsados((u) => (u.length > n ? u : [...u, usado]));
      if (modo.tipo === "duelo") registrarRespostaDuelo(campId, modo.partidaId, opcao !== null && opcao === perguntas[n]?.correta, usado);
    },
    [campId, modo, perguntas],
  );

  // Tempo esgotado: registra a pergunta como não respondida.
  useEffect(() => {
    if (fase !== "jogo" || respondida) return;
    const t = setTimeout(() => registrar(indice, null, TEMPO_MS), Math.max(0, inicio + TEMPO_MS - Date.now()));
    return () => clearTimeout(t);
  }, [fase, respondida, inicio, indice, registrar]);

  // Começar consome a tentativa: no duelo a partida passa a "em curso"; na rodada de pontos corridos, a do dia.
  const comecar = () => {
    if (fase !== "intro") return;
    const liberado = modo.tipo === "duelo" ? iniciarDuelo(campId, modo.partidaId) : iniciarRodadaQuiz(campId);
    if (!liberado) {
      setFim({ tipo: "erro", rodada: modo.tipo === "rodada" });
      setFase("fim");
      return;
    }
    setFase("jogo");
    setIndice(0);
    setInicio(relogio());
  };

  const responder = (opcao: number) => {
    if (fase !== "jogo" || respondida || saindo) return;
    registrar(indice, opcao, Math.min(TEMPO_MS, relogio() - inicio));
  };

  // O título de campeã é comemorado pela ação (`celebrar()` só quando vira campeã); vitórias no caminho não têm confete.
  const finalizar = () => {
    if (finalizado.current) return;
    finalizado.current = true;
    if (modo.tipo === "duelo") {
      const r = jogarDuelo(campId, modo.partidaId, acertos, perguntas.length, usados.reduce((a, b) => a + b, 0));
      setFim(r ? { tipo: "duelo", r } : { tipo: "erro" });
    } else {
      const posicao = jogarRodadaQuiz(campId, acertos, perguntas.length);
      setFim(posicao === null ? { tipo: "erro" } : { tipo: "rodada", posicao });
    }
    setFase("fim");
  };

  const proxima = () => {
    if (indice < perguntas.length - 1) {
      setIndice(indice + 1);
      setInicio(relogio());
    } else finalizar();
  };

  // Fechar no meio do jogo pede confirmação (a tentativa já foi gasta); antes de começar ou depois do resultado, fecha direto.
  const tentarFechar = () => {
    if (fase !== "jogo") return onFechar();
    // Já respondeu tudo e só falta ver o resultado: fechar equivale a ver o resultado.
    if (respostas.length >= perguntas.length) return finalizar();
    setSaindo(true);
  };

  const confirmarSaida = () => {
    if (modo.tipo === "duelo") abandonarDuelo(campId, modo.partidaId);
    onFechar();
  };

  // Atalhos: 1–4 / A–D respondem; Esc fecha. (Enter aciona o botão focado.)
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (saindo) setSaindo(false);
        else tentarFechar();
        return;
      }
      if (fase !== "jogo" || respondida || saindo || e.key.length !== 1 || e.metaKey || e.ctrlKey) return;
      const n = "1234".indexOf(e.key);
      const l = "abcd".indexOf(e.key.toLowerCase());
      const i = n >= 0 ? n : l;
      if (i < 0 || i >= (pergunta?.opcoes.length ?? 0)) return;
      registrar(indice, i, Math.min(TEMPO_MS, Date.now() - inicio));
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  });

  const rivalNome = rivalId ? (pessoas[rivalId]?.nome ?? rivalId) : "";

  return (
    <motion.div className="flex min-h-full flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
      <header className="sticky top-0 z-10 box-content flex h-14 shrink-0 items-center justify-between gap-3 border-b border-borda bg-superficie px-4 pt-[env(safe-area-inset-top)] sm:px-5">
        <p className="min-w-0 truncate text-[13px] text-texto-2">
          <span className="font-medium text-tinta">{jogo.fase}</span> · {c?.nome}
        </p>
        <button
          type="button"
          onClick={tentarFechar}
          aria-label="Fechar"
          className="alvo-toque -mr-1.5 grid size-9 shrink-0 place-items-center rounded-full text-texto-2 transition-colors hover:bg-superficie-2 hover:text-tinta"
        >
          <X className="size-5" />
        </button>
      </header>

      <div className="flex flex-1 flex-col px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pb-5">
        <AnimatePresence mode="wait" initial={false}>
          {fase === "intro" && c && (
            <motion.div key="intro" className="flex flex-1 flex-col" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {modo.tipo === "duelo" ? (
                <Apresentacao rivalId={rivalId} nome={usuario.nome} iniciais={pessoas[usuario.id]?.iniciais} rivalNome={rivalNome} rivalIniciais={rivalId ? pessoas[rivalId]?.iniciais : undefined} rivalTurma={rivalId ? pessoas[rivalId]?.turma : undefined} turma={usuario.turma} c={c} onComecar={comecar} />
              ) : (
                <ApresentacaoRodada c={c} alunoId={usuario.id} onComecar={comecar} />
              )}
            </motion.div>
          )}

          {fase === "jogo" && pergunta && (
            <motion.div key="jogo" className="flex flex-1 flex-col" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: SUAVE }}>
              <Placar
                nome={usuario.nome}
                iniciais={pessoas[usuario.id]?.iniciais}
                acertos={acertos}
                respostas={respostas}
                perguntas={perguntas}
                rival={rivalId ? { nome: rivalNome, iniciais: pessoas[rivalId]?.iniciais, tempo: jogo.temposRival[indice], inicio, indice } : null}
              />
              <Cronometro inicio={inicio} usado={respondida ? usados[indice] : undefined} />

              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={indice} className="mt-5 flex flex-1 flex-col" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18, ease: SUAVE }}>
                  <p className="text-[13px] text-texto-2">
                    Pergunta {indice + 1} de {perguntas.length}
                    {c?.disciplina ? ` · ${c.disciplina}` : ""}
                  </p>
                  <h2 className="mt-1.5 text-balance text-[18px] font-semibold leading-snug text-tinta sm:text-[20px]">{pergunta.enunciado}</h2>

                  <div className="mt-4 grid gap-2" role="group" aria-label="Alternativas">
                    {pergunta.opcoes.map((op, i) => (
                      <Alternativa key={i} letra={LETRAS[i]} tecla={i + 1} texto={op} estado={estadoDa(i, pergunta, respostas[indice], respondida)} onClick={() => responder(i)} />
                    ))}
                  </div>

                  <AnimatePresence>
                    {respondida && (
                      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: SUAVE }} className="mt-3">
                        <Feedback escolha={respostas[indice]} pergunta={pergunta} usado={usados[indice]} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="mt-auto pt-5">
                    {respondida ? (
                      <Button tamanho="lg" bloco onClick={proxima} autoFocus>
                        {indice < perguntas.length - 1 ? "Próxima pergunta" : "Ver resultado"}
                        <ArrowRight />
                      </Button>
                    ) : (
                      <p className="hidden items-center justify-center gap-1.5 text-center text-[12px] text-texto-2 sm:flex">
                        <Keyboard className="size-3.5" aria-hidden /> Use as teclas 1–4 para responder
                      </p>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}

          {fase === "fim" && fim && (
            <motion.div key="fim" className="flex flex-1 flex-col" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: SUAVE }}>
              <Resultado fim={fim} c={c} acertos={acertos} total={perguntas.length} respostas={respostas} perguntas={perguntas} alunoId={usuario.id} pessoas={pessoas} fase={jogo.fase} onFechar={onFechar} onProximo={onProximo} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {saindo && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/40 p-6">
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="sair-titulo"
            aria-describedby="sair-texto"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16, ease: SUAVE }}
            className="w-full max-w-sm rounded-2xl border border-borda bg-superficie p-5 text-center shadow-flutuante"
          >
            <h3 id="sair-titulo" className="text-[17px] font-semibold text-tinta">
              {modo.tipo === "duelo" ? "Sair do duelo?" : "Sair da rodada?"}
            </h3>
            <p id="sair-texto" className="mt-1.5 text-[14px] leading-snug text-texto-2">
              {modo.tipo === "duelo" ? "Sair conta como derrota com os acertos até aqui." : "Sair agora gasta a rodada de hoje, sem pontos."}
            </p>
            <div className="mt-4 grid gap-2">
              <Button tamanho="lg" bloco onClick={() => setSaindo(false)} autoFocus>
                Continuar jogando
              </Button>
              <Button tamanho="lg" bloco variante="perigo" onClick={confirmarSaida}>
                {modo.tipo === "duelo" ? "Sair e perder o duelo" : "Sair da rodada"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

type EstadoAlternativa = "livre" | "certa" | "errada" | "apagada";

function estadoDa(i: number, q: Questao, escolha: number | null | undefined, respondida: boolean): EstadoAlternativa {
  if (!respondida) return "livre";
  if (i === q.correta) return "certa";
  if (i === escolha) return "errada";
  return "apagada";
}

/* ───────────── Peças ───────────── */

interface ApresentacaoProps {
  rivalId?: string | null;
  nome: string;
  iniciais?: string;
  turma: string;
  rivalNome: string;
  rivalIniciais?: string;
  rivalTurma?: string;
  c: Campeonato;
  onComecar: () => void;
}

function Regras({ itens }: { itens: { titulo: string; texto: string }[] }) {
  return (
    <dl className="grid w-full grid-cols-3 divide-x divide-borda rounded-xl border border-borda">
      {itens.map((r) => (
        <div key={r.titulo} className="flex flex-col-reverse px-2 py-2.5 text-center">
          <dt className="text-[12px] leading-snug text-texto-2">{r.texto}</dt>
          <dd className="text-[14px] font-medium text-tinta">{r.titulo}</dd>
        </div>
      ))}
    </dl>
  );
}

function Apresentacao({ rivalId, nome, iniciais, turma, rivalNome, rivalIniciais, rivalTurma, c, onComecar }: ApresentacaoProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-4 text-center">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-tinta">Duelo de quiz</h2>
        <p className="mt-1 text-[14px] text-texto-2">{c.disciplina ?? "Conhecimentos gerais"}</p>
      </div>

      <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
        <div className="flex min-w-0 flex-col items-center">
          <Avatar nome={nome} iniciais={iniciais} tamanho="lg" />
          <p className="mt-2 w-full truncate text-[15px] font-medium text-tinta">Você</p>
          <p className="w-full truncate text-[12px] text-texto-2">{turma}</p>
        </div>
        <span className="text-[15px] text-texto-2" aria-label="contra">
          ×
        </span>
        <div className="flex min-w-0 flex-col items-center">
          {rivalId ? (
            <>
              <LinkPessoa id={rivalId} rotulo={`Perfil de ${rivalNome}`}>
                <Avatar nome={rivalNome} iniciais={rivalIniciais} tamanho="lg" />
              </LinkPessoa>
              <LinkPessoa id={rivalId} className="mt-2 w-full truncate text-[15px] font-medium text-tinta">{primeiroNome(rivalNome)}</LinkPessoa>
            </>
          ) : (
            <>
              <Avatar nome={rivalNome} iniciais={rivalIniciais} tamanho="lg" />
              <p className="mt-2 w-full truncate text-[15px] font-medium text-tinta">{primeiroNome(rivalNome)}</p>
            </>
          )}
          <p className="w-full truncate text-[12px] text-texto-2">{rivalTurma ?? "Adversário"}</p>
        </div>
      </div>

      <Regras
        itens={[
          { titulo: "5 perguntas", texto: "da disciplina" },
          { titulo: "20 s cada", texto: "sem resposta = erro" },
          { titulo: "Empate", texto: "vence o menor tempo total" },
        ]}
      />
      <p className="-mt-2 text-[12px] text-texto-2">Sair no meio conta como derrota.</p>

      <Button tamanho="lg" bloco onClick={onComecar} autoFocus>
        Começar duelo
      </Button>
    </div>
  );
}

function ApresentacaoRodada({ c, alunoId, onComecar }: { c: Campeonato; alunoId: string; onComecar: () => void }) {
  const nivelDe = useDesempate(c.disciplina);
  const minha = classificacao(c, nivelDe).find((l) => l.id === alunoId);
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-4 text-center">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-tinta">Rodada de quiz</h2>
        <p className="mt-1 text-[14px] text-texto-2">{c.disciplina ?? "Conhecimentos gerais"}</p>
        {minha && (
          <p className="mt-3 text-[13px] text-texto-2">
            Você está em <span className="font-medium text-tinta">{ordinal(minha.posicao)}</span> com {fmt(minha.pontos)} {ROTULO_METRICA[c.metrica].unidade}
          </p>
        )}
      </div>
      <Regras
        itens={[
          { titulo: "5 perguntas", texto: "da disciplina" },
          { titulo: "20 s cada", texto: "sem resposta = erro" },
          { titulo: "10 pontos", texto: "por acerto" },
        ]}
      />
      <p className="-mt-2 text-[12px] text-texto-2">Uma rodada por dia: sair no meio gasta a de hoje.</p>
      <Button tamanho="lg" bloco onClick={onComecar} autoFocus>
        Começar rodada
      </Button>
    </div>
  );
}

interface PlacarProps {
  nome: string;
  iniciais?: string;
  acertos: number;
  respostas: (number | null)[];
  perguntas: Questao[];
  rival: { nome: string; iniciais?: string; tempo: number; inicio: number; indice: number } | null;
}

/** Placar discreto: seus acertos (com o histórico de cada pergunta) × o progresso do adversário (sem revelar os acertos dele). */
function Placar({ nome, iniciais, acertos, respostas, perguntas, rival }: PlacarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Avatar nome={nome} iniciais={iniciais} tamanho="xs" className="max-sm:hidden" />
        <div className="min-w-0">
          <p className="text-[12px] text-texto-2">Você</p>
          <div className="mt-1 flex gap-1">
            {perguntas.map((q, i) => (
              <span
                key={i}
                className={cn("h-1 w-4 rounded-full transition-colors duration-200", i >= respostas.length ? "bg-borda" : respostas[i] === q.correta ? "bg-verde" : "bg-alerta")}
              />
            ))}
          </div>
        </div>
      </div>

      <p className="flex shrink-0 items-center gap-1.5 text-[15px] font-semibold tabular-nums text-tinta" aria-label={`${acertos} acertos`}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={acertos} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 6, opacity: 0 }} transition={{ duration: 0.16, ease: SUAVE }}>
            {acertos}
          </motion.span>
        </AnimatePresence>
        {rival && (
          <>
            <span className="font-normal text-texto-2">×</span>
            <span className="text-texto-2">?</span>
          </>
        )}
      </p>

      {rival ? <LadoRival {...rival} total={perguntas.length} /> : <div className="flex-1" />}
    </div>
  );
}

/** Lado do adversário: re-renderiza 4×/s só aqui para mostrar quando ele "responde". */
function LadoRival({ nome, iniciais, tempo, inicio, indice, total }: { nome: string; iniciais?: string; tempo: number; inicio: number; indice: number; total: number }) {
  const agora = useAgora(250);
  const respondeu = agora - inicio >= tempo;
  const feitas = indice + (respondeu ? 1 : 0);
  return (
    <div className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right">
      <div className="min-w-0">
        <p className="truncate text-[12px] text-texto-2">{respondeu ? `${primeiroNome(nome)} respondeu` : `${primeiroNome(nome)} pensando…`}</p>
        <div className="mt-1 flex justify-end gap-1">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={cn("h-1 w-4 rounded-full transition-colors duration-200", i < feitas ? "bg-texto-2" : "bg-borda")} />
          ))}
        </div>
      </div>
      <Avatar nome={nome} iniciais={iniciais} tamanho="xs" className="max-sm:hidden" />
    </div>
  );
}

/** Barra de tempo fina da pergunta (isolada: só ela re-renderiza 4×/s). */
function Cronometro({ inicio, usado }: { inicio: number; usado?: number }) {
  const agora = useAgora(250);
  const decorrido = usado ?? Math.min(TEMPO_MS, Math.max(0, agora - inicio));
  const restante = TEMPO_MS - decorrido;
  const urgente = usado === undefined && restante <= 5_000;
  return (
    <div className="mt-4 flex items-center gap-3" role="timer" aria-label={`${Math.ceil(restante / 1000)} segundos restantes`}>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-superficie-2 ring-1 ring-inset ring-borda">
        <div className={cn("h-full rounded-full transition-[width,background-color] duration-300 ease-linear", urgente ? "bg-alerta" : "bg-verde")} style={{ width: `${(restante / TEMPO_MS) * 100}%` }} />
      </div>
      <span className={cn("w-8 text-right text-[13px] tabular-nums", urgente ? "font-medium text-alerta" : "text-texto-2")}>{Math.ceil(restante / 1000)}s</span>
    </div>
  );
}

function Alternativa({ letra, tecla, texto, estado, onClick }: { letra: string; tecla: number; texto: string; estado: EstadoAlternativa; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-disabled={estado !== "livre"}
      aria-keyshortcuts={String(tecla)}
      animate={estado === "errada" ? { x: [0, -4, 4, -2, 0] } : { x: 0 }}
      transition={{ duration: 0.3, ease: SUAVE }}
      className={cn(
        "flex min-h-12 w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-[15px] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde",
        estado === "livre" && "border-borda bg-superficie text-texto hover:bg-superficie-2 active:bg-superficie-2",
        estado === "certa" && "border-verde bg-verde-mclaro text-tinta",
        estado === "errada" && "border-alerta/50 bg-red-50 text-tinta",
        estado === "apagada" && "cursor-default border-borda bg-superficie text-texto-2 opacity-60",
      )}
    >
      <span
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-lg text-[12px] font-medium",
          estado === "certa" ? "bg-acao text-white" : estado === "errada" ? "bg-alerta text-white" : "border border-borda text-texto-2",
        )}
      >
        {estado === "certa" ? <Check className="size-4" aria-label="Correta" /> : estado === "errada" ? <X className="size-4" aria-label="Sua resposta" /> : letra}
      </span>
      <span className="min-w-0 flex-1">{texto}</span>
    </motion.button>
  );
}

function Feedback({ escolha, pergunta, usado }: { escolha: number | null | undefined; pergunta: Questao; usado?: number }) {
  const acertou = escolha === pergunta.correta;
  const esgotou = escolha === null;
  return (
    <div className="rounded-xl border border-borda bg-superficie-2 p-3.5" role="status">
      <p className={cn("flex items-center gap-1.5 text-[14px] font-medium", acertou ? "text-acento" : esgotou ? "text-ouro" : "text-alerta")}>
        {acertou ? <Check className="size-4" aria-hidden /> : esgotou ? <Timer className="size-4" aria-hidden /> : <X className="size-4" aria-hidden />}
        {acertou ? "Certo" : esgotou ? "Tempo esgotado" : "Errado"}
        {acertou && usado !== undefined && <span className="font-normal text-texto-2">· {(usado / 1000).toFixed(1).replace(".", ",")} s</span>}
      </p>
      <p className="mt-1 text-[14px] leading-relaxed text-texto">{pergunta.explicacao}</p>
    </div>
  );
}

/* ───────────── Resultado ───────────── */

interface ResultadoProps {
  fim: Fim;
  c?: Campeonato;
  acertos: number;
  total: number;
  respostas: (number | null)[];
  perguntas: Questao[];
  alunoId: string;
  pessoas: Record<string, Pessoa>;
  fase: string;
  onFechar: () => void;
  onProximo: (partidaId: string) => void;
}

function Resultado({ fim, c, acertos, total, respostas, perguntas, alunoId, pessoas, fase, onFechar, onProximo }: ResultadoProps) {
  if (fim.tipo === "erro" || !c) {
    const rodada = fim.tipo === "erro" && fim.rodada;
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-4 text-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-tinta">{rodada ? "Você já jogou a rodada de hoje" : "Esta partida já foi disputada"}</h2>
          <p className="mt-1 text-[14px] text-texto-2">{rodada ? "A próxima rodada abre amanhã." : "O chaveamento mudou enquanto você jogava."}</p>
        </div>
        <Button tamanho="lg" bloco onClick={onFechar} autoFocus>
          Voltar ao campeonato
        </Button>
      </div>
    );
  }

  const respostasLista = (
    <ol className="flex justify-center gap-1.5" aria-label={`${acertos} de ${total} acertos`}>
      {perguntas.map((q, i) => {
        const certo = respostas[i] === q.correta;
        return (
          <li key={i} className={cn("grid size-7 place-items-center rounded-full", certo ? "bg-verde-mclaro text-acento" : "bg-red-50 text-alerta")}>
            {certo ? <Check className="size-3.5" aria-label="acerto" /> : <X className="size-3.5" aria-label="erro" />}
          </li>
        );
      })}
    </ol>
  );

  if (fim.tipo === "rodada") {
    const ganhos = [`+${acertos * 10} pts na tabela`, ...(acertos > 0 ? [`+${acertos * 5} XP`] : []), ...(acertos > 0 && c.oficial ? [`+${acertos * 2} pontos`] : [])];
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-4 text-center">
        <div>
          <p className="text-[13px] text-texto-2">Rodada concluída</p>
          <h2 className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-tinta">
            {acertos} de {total} acertos
          </h2>
          {fim.posicao > 0 && <p className="mt-1 text-[14px] text-texto-2">Você está em {ordinal(fim.posicao)} na classificação</p>}
        </div>
        {respostasLista}
        <Ganhos itens={ganhos} />
        <div className="grid w-full gap-2">
          <p className="text-[13px] text-texto-2">Você joga uma rodada por dia: a próxima abre amanhã.</p>
          <Button tamanho="lg" bloco onClick={onFechar} autoFocus>
            Ver classificação
          </Button>
        </div>
      </div>
    );
  }

  const { r } = fim;
  const rival = r.adversarioId ? pessoas[r.adversarioId] : undefined;
  const rivalNome = rival ? primeiroNome(rival.nome) : "adversário";
  const empate = r.meuPlacar === r.placarAdversario;
  const segundos = (ms: number) => `${(ms / 1000).toFixed(1).replace(".", ",")} s`;
  const proxima = r.proxima ? c.partidas.find((p) => p.id === r.proxima) : undefined;
  const proximoRival = proxima ? (proxima.a === alunoId ? proxima.b : proxima.a) : null;
  const faseProxima = proxima ? nomeDaRodada(proxima.rodada, totalRodadas(c)) : "";

  if (r.campeao) {
    const premio = [...(c.premio.pontos > 0 ? [`+${fmt(c.premio.pontos)} pontos`] : []), ...(c.premio.xp > 0 ? [`+${fmt(c.premio.xp)} XP`] : []), ...(c.premio.titulo ? [`Título: ${c.premio.titulo}`] : []), `+${r.meuPlacar * 6} XP no duelo`];
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-4 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-ouro-claro text-ouro">
          <Trophy className="size-6" aria-hidden />
        </span>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-tinta">Você é a campeã</h2>
          <p className="mt-1 text-[14px] text-texto-2">
            {c.nome} · final vencida por {r.meuPlacar} × {r.placarAdversario} contra {rivalNome}
          </p>
        </div>
        <Ganhos itens={premio} />
        <Button tamanho="lg" bloco onClick={onFechar} autoFocus>
          Ver o pódio
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-4 text-center">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-tinta">{r.venceu ? `Você venceu ${aFaseArtigo(fase)}` : `Você parou ${naFase(fase)}`}</h2>
        <p className="mt-1 text-[14px] text-texto-2">{empate ? `Empate em acertos — ${r.venceu ? "você" : rivalNome} teve o menor tempo total (${segundos(r.meuTempo)} × ${segundos(r.tempoAdversario)}).` : r.venceu ? `Contra ${rivalNome}` : `${rivalNome} avança no chaveamento`}</p>
      </div>

      <div className="flex items-center justify-center gap-5">
        <div className="flex w-20 flex-col items-center gap-1.5">
          <Avatar nome={pessoas[alunoId]?.nome ?? "Você"} iniciais={pessoas[alunoId]?.iniciais} tamanho="md" />
          <span className="text-[13px] text-texto-2">Você</span>
        </div>
        <p className="text-2xl font-semibold tabular-nums text-tinta" aria-label={`${r.meuPlacar} a ${r.placarAdversario}`}>
          {r.meuPlacar}
          <span className="mx-2 font-normal text-texto-2">×</span>
          {r.placarAdversario}
        </p>
        <div className="flex w-20 flex-col items-center gap-1.5">
          {r.adversarioId ? (
            <LinkPessoa id={r.adversarioId} rotulo={`Perfil de ${rival?.nome ?? "adversário"}`} className="flex w-full flex-col items-center gap-1.5">
              <Avatar nome={rival?.nome ?? "Adversário"} iniciais={rival?.iniciais} tamanho="md" />
              <span className="w-full truncate text-[13px] text-texto-2">{rivalNome}</span>
            </LinkPessoa>
          ) : (
            <>
              <Avatar nome="Adversário" tamanho="md" />
              <span className="w-full truncate text-[13px] text-texto-2">{rivalNome}</span>
            </>
          )}
        </div>
      </div>

      {respostasLista}
      <Ganhos itens={r.meuPlacar > 0 ? [`+${r.meuPlacar * 6} XP`, ...(c.oficial ? [`+${r.meuPlacar * 2} pontos`] : [])] : ["Sem XP desta vez"]} />

      {r.venceu && proxima && proximoRival && (
        <div className="flex w-full items-center gap-3 rounded-xl border border-borda p-3 text-left">
          <Avatar nome={pessoas[proximoRival]?.nome ?? proximoRival} iniciais={pessoas[proximoRival]?.iniciais} tamanho="sm" />
          <p className="min-w-0 flex-1 text-[14px] text-texto">
            Próximo: <span className="font-medium text-tinta">{faseProxima}</span> contra {primeiroNome(pessoas[proximoRival]?.nome ?? "")}
          </p>
        </div>
      )}

      <div className="grid w-full gap-2">
        {r.venceu && proxima && proximoRival ? (
          <Button tamanho="lg" bloco onClick={() => onProximo(proxima.id)} autoFocus>
            Jogar {aFaseArtigo(faseProxima)}
            <ArrowRight />
          </Button>
        ) : r.venceu ? (
          <Button tamanho="lg" bloco onClick={onFechar} autoFocus>
            Ver chaveamento
          </Button>
        ) : (
          <Link href="/estudos" onClick={onFechar} className={cn(LINK_PRIMARIO, "h-11 rounded-xl text-[15px]")}>
            Estudar {c.disciplina ?? "agora"}
          </Link>
        )}
        {(r.venceu && proxima) || !r.venceu ? (
          <Button tamanho="lg" bloco variante="secundario" onClick={onFechar}>
            {r.venceu ? "Depois" : "Ver chaveamento"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function Ganhos({ itens }: { itens: string[] }) {
  return (
    <p className="flex flex-wrap justify-center gap-x-2 text-[13px] text-texto-2">
      {itens.map((g, i) => (
        <span key={g} className={cn(i === 0 && "font-medium text-tinta")}>
          {i > 0 && <span className="mr-2" aria-hidden>·</span>}
          {g}
        </span>
      ))}
    </p>
  );
}
