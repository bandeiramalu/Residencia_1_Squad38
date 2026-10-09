"use client";

import { Check, ChevronLeft, Info, Lock, Users } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Nota } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { AreaTexto, Campo, Entrada, Seletor } from "@/components/ui/Campo";
import { RodapeSheet } from "@/components/ui/RodapeSheet";
import { Segmentado } from "@/components/ui/Segmentado";
import { Sheet } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { CAPAS_CAMPEONATO, ROTULO_FORMATO, ROTULO_METRICA } from "@/data/campeonatos";
import { DISCIPLINAS, type Disciplina } from "@/data/escola";
import { TURMAS_DO_PROFESSOR, TURMAS_ESCOLA } from "@/data/professor";
import { hashTexto, mulberry32 } from "@/lib/aleatorio";
import { useSessao } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/format";
import { criarCampeonato } from "@/store/actions";
import { useSeletor } from "@/store/store";
import type { CapaCampeonato, FormatoCampeonato, MetricaCampeonato, Pessoa } from "@/store/types";
import { ICONE_FORMATO, ICONE_METRICA, PontoCapa } from "./comum";

const D = 86_400_000;
const CAPAS = Object.keys(CAPAS_CAMPEONATO) as CapaCampeonato[];
const NOME_CAPA: Record<CapaCampeonato, string> = { ouro: "Ouro", esmeralda: "Esmeralda", oceano: "Oceano", rubi: "Rubi", noite: "Noite" };
const DURACOES = [1, 3, 7, 14, 30];
const ETAPAS = ["Formato", "Quando", "Quem e prêmio"] as const;

const DESCRICAO_FORMATO: Record<FormatoCampeonato, string> = {
  "mata-mata": "Duelos eliminatórios de quiz até a final.",
  "pontos-corridos": "Todos pontuam numa tabela até o prazo.",
  interclasses: "Turma contra turma — todos da turma somam.",
};

interface Rascunho {
  nome: string;
  descricao: string;
  formato: FormatoCampeonato;
  metrica: MetricaCampeonato;
  disciplina: Disciplina | "";
  comecarAgora: boolean;
  /** Valor do <input type="datetime-local">. */
  data: string;
  dias: number;
  max: number;
  capa: CapaCampeonato;
  pontos: number;
  xp: number;
  titulo: string;
  convidados: string[];
  turmas: string[];
  inscreverTurma: boolean;
}

function paraInputData(ts: number) {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function amanhaAs7() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(7, 0, 0, 0);
  return d.getTime();
}

/** Métricas válidas para cada formato (mata-mata é duelo de quiz; interclasses soma foco/XP da turma). */
function metricaPermitida(formato: FormatoCampeonato, metrica: MetricaCampeonato) {
  if (formato === "mata-mata") return metrica === "quiz";
  if (formato === "interclasses") return metrica !== "quiz";
  return true;
}

function opcoesMax(formato: FormatoCampeonato, professor: boolean) {
  if (formato === "mata-mata") return professor ? [4, 8, 16] : [4, 8];
  return professor ? [6, 10, 20, 30] : [3, 4, 6, 8];
}

/**
 * Alunos inscritos automaticamente (opção explícita do professor) num campeonato oficial recém-criado: alunos das turmas
 * escolhidas, com os colegas conhecidos primeiro. Deixa uma vaga livre para a aluna se inscrever.
 */
function inscritosDaTurma(pessoas: Record<string, Pessoa>, turmas: string[], qtd: number, alunaId: string, semente: string) {
  const rnd = mulberry32(hashTexto(semente));
  return Object.values(pessoas)
    .filter((p) => p.papel === "aluno" && p.id !== alunaId && p.turma && turmas.includes(p.turma))
    .map((p) => ({ id: p.id, ordem: (p.id.startsWith("al-") ? 1 : 0) + rnd() }))
    .sort((a, b) => a.ordem - b.ordem)
    .slice(0, qtd)
    .map((p) => p.id);
}

/** Criação de campeonato em 3 etapas. Professor cria oficiais (com pontos/XP); aluno cria amistosos (só título). */
export function CriarCampeonatoSheet({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const professor = useSessao()?.papel === "professor";
  return (
    <Sheet
      aberto={aberto}
      onFechar={onFechar}
      largura="lg"
      titulo={professor ? "Novo campeonato oficial" : "Novo amistoso"}
      subtitulo={professor ? "Vale pontos e XP para os alunos das turmas escolhidas." : "Desafie colegas da sua turma. O prêmio é o título."}
    >
      <Formulario professor={professor} onFechar={onFechar} />
    </Sheet>
  );
}

function Formulario({ professor, onFechar }: { professor: boolean; onFechar: () => void }) {
  const router = useRouter();
  const sessao = useSessao();
  const usuario = useSeletor((e) => e.usuario);
  const pessoas = useSeletor((e) => e.pessoas);
  const disciplinaProf = pessoas[sessao?.usuarioId ?? ""]?.disciplina;

  const enviando = useRef(false);
  const [etapa, setEtapa] = useState(0);
  const [tentou, setTentou] = useState(false);
  const [r, setR] = useState<Rascunho>(() => ({
    nome: "",
    descricao: "",
    formato: "mata-mata",
    metrica: "quiz",
    disciplina: disciplinaProf ?? "Matemática",
    comecarAgora: !professor,
    data: paraInputData(amanhaAs7()),
    dias: 7,
    max: professor ? 8 : 4,
    capa: professor ? "ouro" : "oceano",
    pontos: 200,
    xp: 80,
    titulo: "",
    convidados: [],
    turmas: professor ? [...TURMAS_DO_PROFESSOR] : [usuario.turma],
    inscreverTurma: false,
  }));
  const mudar = (parcial: Partial<Rascunho>) => setR((atual) => ({ ...atual, ...parcial }));

  const interclasses = r.formato === "interclasses";
  // Oficial fora do interclasses sempre abre com inscrições: os alunos precisam de tempo para entrar.
  const soAgendado = professor && !interclasses;
  const agora = !soAgendado && r.comecarAgora;
  const colegas = Object.values(pessoas)
    .filter((p) => p.papel === "aluno" && p.turma === usuario.turma && p.id !== usuario.id)
    .sort((a, b) => Number(a.id.startsWith("al-")) - Number(b.id.startsWith("al-")) || a.nome.localeCompare(b.nome, "pt-BR"));
  const vagasConvite = r.max - 1;

  const erros: Record<string, string | undefined> = {};
  if (etapa === 0) {
    if (r.nome.trim().length < 3) erros.nome = "Dê um nome com pelo menos 3 letras.";
    if (r.metrica === "quiz" && !r.disciplina) erros.disciplina = "Quiz precisa de uma disciplina.";
  }
  if (etapa === 1 && !agora && !(new Date(r.data).getTime() > 0)) erros.data = "Escolha a data e a hora de início.";
  if (etapa === 2) {
    if (professor && interclasses && r.turmas.length < 2) erros.participantes = "Escolha pelo menos 2 turmas para a disputa.";
    else if (professor && !r.turmas.length) erros.participantes = "Escolha ao menos uma turma que pode se inscrever.";
    else if (!professor && agora && !r.convidados.length) erros.participantes = "Convide pelo menos 1 colega — ou agende o início para abrir inscrições.";
  }
  const valido = Object.keys(erros).length === 0;

  const avancar = () => {
    if (!valido) {
      setTentou(true);
      return;
    }
    setTentou(false);
    if (etapa < ETAPAS.length - 1) setEtapa(etapa + 1);
    else criar();
  };

  const criar = () => {
    // Trava de duplo clique: um campeonato por toque, mesmo antes de o painel terminar de fechar.
    if (enviando.current) return;
    enviando.current = true;
    const agoraMs = Date.now();
    const inicio = agora ? agoraMs : Math.max(agoraMs + 60_000, new Date(r.data).getTime());
    const participantes = interclasses
      ? r.turmas
      : professor
        ? r.inscreverTurma
          ? inscritosDaTurma(pessoas, r.turmas, r.formato === "mata-mata" ? r.max - 1 : Math.min(r.max - 1, 9), usuario.id, `${r.nome}-${agoraMs}`)
          : []
        : r.convidados;
    const id = criarCampeonato({
      nome: r.nome,
      descricao: r.descricao || DESCRICAO_FORMATO[r.formato],
      formato: r.formato,
      metrica: r.metrica,
      disciplina: r.disciplina || undefined,
      inicio,
      fim: inicio + r.dias * D,
      premio: professor ? { pontos: r.pontos, xp: r.xp, titulo: r.titulo.trim() || undefined } : { pontos: 0, xp: 0, titulo: r.titulo.trim() || undefined },
      maxParticipantes: interclasses ? Math.max(r.turmas.length, 2) : r.max,
      capa: r.capa,
      turmas: interclasses ? [] : r.turmas,
      participantes,
    });
    onFechar();
    router.push(`/campeonatos/${id}`);
  };

  const escolherFormato = (formato: FormatoCampeonato) => {
    const metrica = metricaPermitida(formato, r.metrica) ? r.metrica : formato === "interclasses" ? "foco" : "quiz";
    const opcoes = opcoesMax(formato, professor);
    const max = opcoes.includes(r.max) ? r.max : opcoes[professor ? 1 : 0];
    mudar({ formato, metrica, max, convidados: r.convidados.slice(0, max - 1) });
  };

  const alternarConvidado = (id: string) => {
    if (r.convidados.includes(id)) mudar({ convidados: r.convidados.filter((c) => c !== id) });
    else if (r.convidados.length < vagasConvite) mudar({ convidados: [...r.convidados, id] });
  };

  const alternarTurma = (t: string) => mudar({ turmas: r.turmas.includes(t) ? r.turmas.filter((x) => x !== t) : [...r.turmas, t] });

  return (
    <div>
      {/* Etapas */}
      <ol className="mb-5 grid grid-cols-3 gap-2" aria-label="Etapas">
        {ETAPAS.map((nome, i) => (
          <li key={nome}>
            <button
              type="button"
              disabled={i > etapa}
              onClick={() => i < etapa && setEtapa(i)}
              className="group alvo-toque w-full text-left disabled:cursor-default"
              aria-current={i === etapa ? "step" : undefined}
            >
              <span className="block h-1 overflow-hidden rounded-full bg-superficie-2 ring-1 ring-inset ring-borda">
                <motion.span className="block h-full rounded-full bg-verde" initial={false} animate={{ width: i <= etapa ? "100%" : "0%" }} transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }} />
              </span>
              <span className={cn("mt-1.5 flex items-center gap-1 text-[12px]", i === etapa ? "font-medium text-tinta" : i < etapa ? "text-acento" : "text-texto-2")}>
                {i < etapa && <Check className="size-3" />}
                {nome}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={etapa} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }} className="space-y-5">
          {etapa === 0 && (
            <>
              <Campo rotulo="Nome do campeonato" htmlFor="camp-nome" erro={tentou ? erros.nome : undefined}>
                <Entrada id="camp-nome" value={r.nome} maxLength={60} placeholder={professor ? "Copa de Funções do 9º ano" : "Duelo da galera do fundão"} onChange={(e) => mudar({ nome: e.target.value })} />
              </Campo>
              <Campo rotulo="Descrição (opcional)" htmlFor="camp-desc" dica={`${r.descricao.length}/200`}>
                <AreaTexto id="camp-desc" value={r.descricao} maxLength={200} rows={2} className="min-h-0" placeholder="Regras combinadas, o que está em jogo…" onChange={(e) => mudar({ descricao: e.target.value })} />
              </Campo>

              <fieldset>
                <legend className="mb-2 text-[13px] font-medium text-tinta">Formato</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {(["mata-mata", "pontos-corridos", "interclasses"] as const).map((f) => {
                    const Icone = ICONE_FORMATO[f];
                    const bloqueado = f === "interclasses" && !professor;
                    const ativo = r.formato === f;
                    return (
                      <button
                        key={f}
                        type="button"
                        disabled={bloqueado}
                        aria-pressed={ativo}
                        onClick={() => escolherFormato(f)}
                        className={cn(
                          "relative flex gap-3 rounded-xl border p-3 text-left transition-colors duration-150 sm:flex-col sm:gap-2",
                          ativo ? "border-verde bg-verde-mclaro" : "border-borda bg-superficie hover:bg-superficie-2",
                          bloqueado && "opacity-55 hover:bg-superficie",
                        )}
                      >
                        <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", ativo ? "bg-superficie text-acento" : "bg-superficie-2 text-texto-2")}>
                          <Icone className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 text-[14px] font-medium text-tinta">
                            {ROTULO_FORMATO[f]}
                            {bloqueado && <Lock className="size-3 text-texto-2" aria-label="Só professores" />}
                          </span>
                          <span className="mt-0.5 block text-[12px] leading-snug text-texto-2">{bloqueado ? "Só professores criam disputas entre turmas." : DESCRICAO_FORMATO[f]}</span>
                        </span>
                        {ativo && <Check className="absolute right-2.5 top-2.5 size-4 text-acento" />}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-2 text-[13px] font-medium text-tinta">Como se pontua</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {(["quiz", "foco", "xp"] as const).map((m) => {
                    const Icone = ICONE_METRICA[m];
                    const permitido = metricaPermitida(r.formato, m);
                    const ativo = r.metrica === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        disabled={!permitido}
                        aria-pressed={ativo}
                        onClick={() => mudar({ metrica: m })}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-[13px] font-medium transition-colors duration-150 toque:min-h-11",
                          ativo ? "border-verde bg-verde-mclaro text-acento" : "border-borda bg-superficie text-texto hover:bg-superficie-2",
                          !permitido && "opacity-45",
                        )}
                      >
                        <Icone className="size-4 shrink-0" />
                        {ROTULO_METRICA[m].nome}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[12px] text-texto-2">
                  {r.formato === "mata-mata" ? "Mata-mata é sempre decidido em duelos de quiz. " : r.formato === "interclasses" ? "Interclasses soma o foco ou o XP de toda a turma. " : ""}
                  {ROTULO_METRICA[r.metrica].descricao}
                </p>
              </fieldset>

              <Campo rotulo={r.metrica === "quiz" ? "Disciplina das perguntas" : "Disciplina (opcional)"} htmlFor="camp-disc" erro={tentou ? erros.disciplina : undefined}>
                <Seletor id="camp-disc" value={r.disciplina} onChange={(e) => mudar({ disciplina: e.target.value as Disciplina | "" })}>
                  {r.metrica !== "quiz" && <option value="">Todas as disciplinas</option>}
                  {r.metrica === "quiz" && !r.disciplina && <option value="">Escolha…</option>}
                  {DISCIPLINAS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Seletor>
              </Campo>
            </>
          )}

          {etapa === 1 && (
            <>
              {soAgendado ? (
                <Nota icone={<Users />}>As inscrições abrem assim que você criar e fecham no início{r.formato === "mata-mata" ? ", quando o chaveamento é montado por nível, melhor contra pior" : ""}.</Nota>
              ) : (
                <Segmentado
                  grupo="camp-inicio"
                  rotulo="Início"
                  opcoes={[
                    { id: "agora", rotulo: "Começar agora" },
                    { id: "agendar", rotulo: "Agendar início" },
                  ]}
                  valor={r.comecarAgora ? "agora" : "agendar"}
                  onChange={(v) => mudar({ comecarAgora: v === "agora" })}
                />
              )}
              {!agora && (
                <Campo rotulo={soAgendado ? "Início do campeonato" : "Data e hora de início"} htmlFor="camp-data" erro={tentou ? erros.data : undefined} dica={soAgendado ? undefined : "Até lá, as inscrições ficam abertas."}>
                  <Entrada id="camp-data" type="datetime-local" className="dark:[color-scheme:dark]" value={r.data} onChange={(e) => mudar({ data: e.target.value })} />
                </Campo>
              )}

              <fieldset>
                <legend className="mb-2 text-[13px] font-medium text-tinta">Duração</legend>
                <Pilulas opcoes={DURACOES} valor={r.dias} onChange={(dias) => mudar({ dias })} formatar={(d) => (d === 1 ? "1 dia" : `${d} dias`)} />
              </fieldset>

              {!interclasses && (
                <fieldset>
                  <legend className="mb-2 text-[13px] font-medium text-tinta">Máximo de participantes</legend>
                  <Pilulas opcoes={opcoesMax(r.formato, professor)} valor={r.max} onChange={(max) => mudar({ max, convidados: r.convidados.slice(0, max - 1) })} formatar={(n) => String(n)} />
                  {r.formato === "mata-mata" && <p className="mt-2 text-[12px] text-texto-2">Vagas que sobrarem viram “folga”: quem ficar sem adversário avança direto.</p>}
                </fieldset>
              )}

              <fieldset>
                <legend className="mb-2 text-[13px] font-medium text-tinta">Cor</legend>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0 rounded-xl border border-borda bg-superficie p-3" aria-hidden>
                    <p className="flex items-center gap-2">
                      <PontoCapa capa={r.capa} />
                      <span className="truncate text-[14px] font-medium text-tinta">{r.nome.trim() || "Seu campeonato"}</span>
                    </p>
                    <p className="mt-0.5 text-[12px] text-texto-2">
                      {professor ? "Oficial" : "Amistoso"} · {ROTULO_FORMATO[r.formato]}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Cor">
                    {CAPAS.map((capa) => (
                      <button
                        key={capa}
                        type="button"
                        role="radio"
                        aria-checked={r.capa === capa}
                        aria-label={NOME_CAPA[capa]}
                        title={NOME_CAPA[capa]}
                        onClick={() => mudar({ capa })}
                        className={cn(
                          "grid size-8 place-items-center rounded-full ring-offset-2 ring-offset-superficie transition-shadow duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-verde alvo-toque",
                          r.capa === capa ? "ring-2 ring-tinta" : "hover:ring-1 hover:ring-borda",
                        )}
                        style={{ background: CAPAS_CAMPEONATO[capa].brilho }}
                      >
                        {r.capa === capa && <Check className="size-4 text-white" aria-hidden />}
                      </button>
                    ))}
                  </div>
                </div>
              </fieldset>
            </>
          )}

          {etapa === 2 && (
            <>
              {professor ? (
                <fieldset>
                  <legend className="mb-1 text-[13px] font-medium text-tinta">{interclasses ? "Turmas na disputa" : "Quem pode se inscrever"}</legend>
                  <p className="mb-2.5 text-[12px] text-texto-2">{interclasses ? "No interclasses as turmas são os participantes: cada aluno soma para a sua." : "Alunos dessas turmas veem o campeonato e recebem o aviso de inscrições."}</p>
                  <div className="flex flex-wrap gap-2">
                    {TURMAS_ESCOLA.map((t) => {
                      const ativo = r.turmas.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          aria-pressed={ativo}
                          onClick={() => alternarTurma(t)}
                          className={cn(
                            "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium ring-1 ring-inset transition-colors duration-150 active:scale-[0.98] toque:min-h-11",
                            ativo ? "bg-verde-mclaro text-acento ring-verde" : "bg-superficie text-texto ring-borda hover:bg-superficie-2",
                          )}
                        >
                          {ativo && <Check className="size-3.5" />}
                          {t}
                        </button>
                      );
                    })}
                  </div>
                  {tentou && erros.participantes && <p className="mt-2 text-[12px] font-medium text-alerta">{erros.participantes}</p>}
                  {!interclasses && (
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-borda bg-superficie-2 p-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-tinta">Inscrever a turma automaticamente</p>
                        <p className="text-[12px] leading-snug text-texto-2">Inscreve alunos das turmas escolhidas e deixa uma vaga livre. Desligado, cada aluno se inscreve por conta própria.</p>
                      </div>
                      <Switch ativo={r.inscreverTurma} onChange={(v) => mudar({ inscreverTurma: v })} rotulo="Inscrever a turma automaticamente" />
                    </div>
                  )}
                </fieldset>
              ) : (
                <fieldset aria-labelledby="camp-convite">
                  <div className="mb-2 flex items-end justify-between gap-3">
                    <p id="camp-convite" className="text-[13px] font-medium text-tinta">
                      Convide colegas do {usuario.turma}
                    </p>
                    <span className="text-[12px] tabular-nums text-texto-2">
                      {r.convidados.length}/{vagasConvite} vagas
                    </span>
                  </div>
                  <ul className="max-h-64 divide-y divide-borda overflow-y-auto overscroll-contain rounded-xl border border-borda bg-superficie">
                    {colegas.map((p) => {
                      const marcado = r.convidados.includes(p.id);
                      const cheio = !marcado && r.convidados.length >= vagasConvite;
                      return (
                        <li key={p.id}>
                          <label className={cn("flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-superficie-2", cheio && "cursor-not-allowed opacity-50")}>
                            <input type="checkbox" className="peer sr-only" checked={marcado} disabled={cheio} onChange={() => alternarConvidado(p.id)} />
                            <Avatar nome={p.nome} iniciais={p.iniciais} tamanho="sm" />
                            <span className="min-w-0 flex-1 truncate text-[14px] text-tinta">{p.nome}</span>
                            <span
                              className={cn(
                                "grid size-5 shrink-0 place-items-center rounded-md border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-verde-2",
                                marcado ? "border-acao bg-acao text-white" : "border-borda bg-superficie",
                              )}
                              aria-hidden
                            >
                              {marcado && <Check className="size-3.5" />}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                  <p className={cn("mt-2 text-[12px]", tentou && erros.participantes ? "font-medium text-alerta" : "text-texto-2")}>
                    {tentou && erros.participantes ? erros.participantes : agora ? "Os convidados entram direto — o campeonato começa na hora." : "Convites são opcionais: colegas da turma podem se inscrever até o início."}
                  </p>
                </fieldset>
              )}

              <fieldset className="space-y-3">
                <legend className="mb-2 text-[13px] font-medium text-tinta">Prêmio {interclasses ? "(para cada aluno da turma campeã)" : "do campeão"}</legend>
                {professor ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="mb-1.5 text-[12px] text-texto-2">Pontos (gastáveis na Loja)</p>
                        <Pilulas opcoes={[0, 100, 200, 300, 500]} valor={r.pontos} onChange={(pontos) => mudar({ pontos })} formatar={fmt} />
                      </div>
                      <div>
                        <p className="mb-1.5 text-[12px] text-texto-2">XP (mérito, sobe o nível)</p>
                        <Pilulas opcoes={[0, 40, 80, 120, 200]} valor={r.xp} onChange={(xp) => mudar({ xp })} formatar={fmt} />
                      </div>
                    </div>
                  </>
                ) : (
                  <Nota icone={<Info />}>Amistosos valem o título, sem pontos da escola. Os duelos de quiz ainda rendem XP pelos acertos.</Nota>
                )}
                <Campo rotulo="Título do campeão (opcional)" htmlFor="camp-titulo">
                  <Entrada id="camp-titulo" value={r.titulo} maxLength={40} placeholder={professor ? "Mestre das Funções" : "Rei(nha) do Fundão"} onChange={(e) => mudar({ titulo: e.target.value })} />
                </Campo>
              </fieldset>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <RodapeSheet>
        {etapa > 0 ? (
          <Button variante="secundario" onClick={() => setEtapa(etapa - 1)} className="flex-1 sm:flex-none">
            <ChevronLeft />
            Voltar
          </Button>
        ) : (
          <Button variante="secundario" onClick={onFechar} className="flex-1 sm:flex-none">
            Cancelar
          </Button>
        )}
        <Button onClick={avancar} className="flex-1">
          {etapa < ETAPAS.length - 1 ? "Continuar" : agora ? "Criar e começar" : "Criar e abrir inscrições"}
        </Button>
      </RodapeSheet>
    </div>
  );
}

function Pilulas({ opcoes, valor, onChange, formatar }: { opcoes: number[]; valor: number; onChange: (v: number) => void; formatar: (v: number) => string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {opcoes.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={o === valor}
          onClick={() => onChange(o)}
          className={cn(
            "h-8 min-w-11 rounded-lg px-3 text-[13px] font-medium tabular-nums transition-colors duration-150 active:scale-[0.98] toque:min-h-11",
            o === valor ? "bg-tinta text-superficie" : "bg-superficie text-texto ring-1 ring-inset ring-borda hover:bg-superficie-2",
          )}
        >
          {formatar(o)}
        </button>
      ))}
    </div>
  );
}
