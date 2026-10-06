"use client";

import { ArrowRight, CalendarClock, Check, KeyRound, Lock, Users } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Nota } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { AreaTexto, Campo, Entrada } from "@/components/ui/Campo";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { RodapeSheet } from "@/components/ui/RodapeSheet";
import { Segmentado } from "@/components/ui/Segmentado";
import { Sheet } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { DISCIPLINAS, type Disciplina } from "@/data/escola";
import { PROFESSOR, TURMAS_DO_PROFESSOR } from "@/data/professor";
import { TEMAS_SALA } from "@/data/salas";
import { useSessao } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { criarSala } from "@/store/actions";
import { useSeletor } from "@/store/store";
import type { TemaSala } from "@/store/types";
import { BotaoCopiar, IconeSala } from "./comum";

type Ritmo = "25" | "50" | "livre";
type Acesso = "turma" | "aberta";

const RITMOS = [
  { id: "25", rotulo: "25/5", aria: "25 minutos de foco e 5 de pausa" },
  { id: "50", rotulo: "50/10", aria: "50 minutos de foco e 10 de pausa" },
  { id: "livre", rotulo: "Personalizado" },
] as const;

const TEMAS = Object.keys(TEMAS_SALA) as TemaSala[];

const LIMITES = {
  nome: [3, 60],
  descricao: 200,
  foco: [10, 120],
  pausa: [1, 30],
} as const;

interface Props {
  aberto: boolean;
  onFechar: () => void;
}

/** Criação de sala coletiva (aluno cria sala livre da turma; professor cria sala oficial e pode agendar). */
export function CriarSalaSheet({ aberto, onFechar }: Props) {
  const sessao = useSessao();
  const professor = sessao?.papel === "professor";
  return (
    <Sheet
      aberto={aberto}
      onFechar={onFechar}
      largura="lg"
      titulo={professor ? "Criar sala oficial" : "Criar sala de estudo"}
      subtitulo={professor ? "Os alunos da turma são avisados quando a sala abrir." : "Chame a turma para focar no mesmo ritmo."}
    >
      <Formulario professor={professor} onFechar={onFechar} />
    </Sheet>
  );
}

/** "02/10 às 19:00" (a prévia não depende do relógio). */
function dataHora(ts: number) {
  const d = new Date(ts);
  return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} às ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

/** Chamados só em eventos (o relógio não entra no render). */
function noFuturo(ts: number) {
  return ts > Date.now() + 60_000;
}

function amanhaISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function inteiro(v: string) {
  return /^\d+$/.test(v.trim()) ? Number(v) : NaN;
}

function Formulario({ professor, onFechar }: { professor: boolean; onFechar: () => void }) {
  const router = useRouter();
  const ids = useId();
  const turmaAluna = useSeletor((e) => e.usuario.turma);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [disciplina, setDisciplina] = useState<Disciplina | "livre">(professor ? PROFESSOR.disciplina : "livre");
  const [ritmo, setRitmo] = useState<Ritmo>("25");
  const [focoTxt, setFocoTxt] = useState("40");
  const [pausaTxt, setPausaTxt] = useState("8");
  const [tema, setTema] = useState<TemaSala>(professor ? "esmeralda" : "oceano");
  const [capacidadeTxt, setCapacidadeTxt] = useState(professor ? "35" : "10");
  const [privada, setPrivada] = useState(false);
  const [turmaProf, setTurmaProf] = useState<string>(TURMAS_DO_PROFESSOR[0]);
  const [acesso, setAcesso] = useState<Acesso>("turma");
  const [agendar, setAgendar] = useState(false);
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [tentou, setTentou] = useState(false);
  const [erroAgenda, setErroAgenda] = useState<string | null>(null);
  const [criadaId, setCriadaId] = useState<string | null>(null);
  const criada = useSeletor((e) => (criadaId ? e.salas.find((s) => s.id === criadaId) : undefined));

  const maxCapacidade = professor ? 100 : 30;
  const foco = ritmo === "livre" ? inteiro(focoTxt) : Number(ritmo);
  const pausa = ritmo === "livre" ? inteiro(pausaTxt) : ritmo === "25" ? 5 : 10;
  const capacidade = inteiro(capacidadeTxt);
  const agendadaPara = agendar && data && hora ? new Date(`${data}T${hora}`).getTime() : undefined;

  const erros = {
    nome: nome.trim().length < LIMITES.nome[0] ? "Use pelo menos 3 letras." : undefined,
    foco: ritmo === "livre" && !(foco >= LIMITES.foco[0] && foco <= LIMITES.foco[1]) ? `Foco entre ${LIMITES.foco[0]} e ${LIMITES.foco[1]} min.` : undefined,
    pausa: ritmo === "livre" && !(pausa >= LIMITES.pausa[0] && pausa <= LIMITES.pausa[1]) ? `Pausa entre ${LIMITES.pausa[0]} e ${LIMITES.pausa[1]} min.` : undefined,
    capacidade: !(capacidade >= 2 && capacidade <= maxCapacidade) ? `De 2 a ${maxCapacidade} pessoas.` : undefined,
    agenda: agendar && (!data || !hora) ? "Escolha o dia e a hora da abertura." : undefined,
  };
  const valido = !Object.values(erros).some(Boolean);
  const erro = (campo: keyof typeof erros) => (tentou ? erros[campo] : undefined);

  const ligarAgenda = (ativo: boolean) => {
    setAgendar(ativo);
    if (ativo && !data) {
      // Sugestão: amanhã às 19h (horário de estudo mais comum da turma).
      setData(amanhaISO());
      setHora("19:00");
    }
  };

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    setTentou(true);
    if (!valido) return;
    // Validação que depende do relógio fica no envio (o horário pode ter passado com o formulário aberto).
    if (agendadaPara !== undefined && !noFuturo(agendadaPara)) {
      setErroAgenda("Escolha um horário no futuro.");
      return;
    }
    const id = criarSala({
      nome,
      descricao,
      disciplina: disciplina === "livre" ? undefined : disciplina,
      focoMin: foco,
      pausaMin: pausa,
      privada,
      tema,
      capacidade,
      turma: professor ? turmaProf : acesso === "turma" ? turmaAluna : undefined,
      agendadaPara: professor ? agendadaPara : undefined,
    });
    if (privada) {
      setCriadaId(id);
      return;
    }
    onFechar();
    router.push(`/estudos/salas/${id}`);
  };

  if (criada) {
    const abrir = () => {
      onFechar();
      router.push(`/estudos/salas/${criada.id}`);
    };
    return <Criada nome={criada.nome} codigo={criada.codigo ?? ""} onAbrir={abrir} onFechar={onFechar} />;
  }

  const t = TEMAS_SALA[tema];
  const nomePrevia = nome.trim() || "Nome da sala";

  return (
    <form onSubmit={enviar} noValidate>
      {/* Prévia mínima: a sala como aparece na lista. */}
      <div className="mb-5 flex items-center gap-3 rounded-xl border border-borda bg-superficie-2 p-3" aria-label="Prévia da sala">
        <IconeSala sala={{ disciplina: disciplina === "livre" ? undefined : disciplina, tema }} />
        <div className="min-w-0 flex-1">
          <p className={cn("truncate text-[14px] font-medium", nome.trim() ? "text-tinta" : "text-texto-2")}>{nomePrevia}</p>
          <p className="truncate text-[12px] text-texto-2">
            {disciplina === "livre" ? "Sala livre" : disciplina} · {Number.isFinite(foco) ? foco : "?"}/{Number.isFinite(pausa) ? pausa : "?"} min
            {agendar && agendadaPara ? ` · abre ${dataHora(agendadaPara)}` : ""}
          </p>
        </div>
        {(professor || privada) && (
          <span className="flex shrink-0 gap-1">
            {professor && <Badge tom="neutro">Oficial</Badge>}
            {privada && (
              <Badge tom="neutro">
                <Lock aria-hidden />
                Privada
              </Badge>
            )}
          </span>
        )}
      </div>

      <div className="space-y-5">
        <Campo rotulo="Nome da sala" htmlFor={`${ids}-nome`} erro={erro("nome")} dica={`${nome.length}/${LIMITES.nome[1]}`}>
          <Entrada
            id={`${ids}-nome`}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={LIMITES.nome[1]}
            placeholder={professor ? "Ex.: Plantão de dúvidas · Funções" : "Ex.: Revisão de Química até a prova"}
            aria-invalid={!!erro("nome")}
            autoComplete="off"
          />
        </Campo>

        <Campo rotulo={<>Descrição <span className="font-normal text-texto-2">· opcional</span></>} htmlFor={`${ids}-desc`} dica={`${descricao.length}/${LIMITES.descricao}`}>
          <AreaTexto
            id={`${ids}-desc`}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            maxLength={LIMITES.descricao}
            rows={2}
            className="min-h-20"
            placeholder="O que a sala vai estudar e como funciona o chat."
          />
        </Campo>

        <div className="space-y-2">
          <p className="text-[13px] font-medium text-tinta">
            Disciplina <span className="font-normal text-texto-2">· opcional</span>
          </p>
          <ChipGroup
            grupo="criar-sala-disciplina"
            rotulo="Disciplina da sala"
            quebrar
            opcoes={[{ id: "livre" as const, rotulo: "Livre" }, ...DISCIPLINAS.map((d) => ({ id: d, rotulo: d }))]}
            valor={disciplina}
            onChange={setDisciplina}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-[13px] font-medium text-tinta">Ritmo dos ciclos</p>
            <Segmentado grupo="criar-sala-ritmo" rotulo="Ritmo dos ciclos" opcoes={RITMOS} valor={ritmo} onChange={setRitmo} />
            <AnimatePresence initial={false}>
              {ritmo === "livre" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Campo rotulo="Foco (min)" htmlFor={`${ids}-foco`} erro={erro("foco")}>
                      <Entrada id={`${ids}-foco`} inputMode="numeric" value={focoTxt} onChange={(e) => setFocoTxt(e.target.value.replace(/\D/g, "").slice(0, 3))} aria-invalid={!!erro("foco")} />
                    </Campo>
                    <Campo rotulo="Pausa (min)" htmlFor={`${ids}-pausa`} erro={erro("pausa")}>
                      <Entrada id={`${ids}-pausa`} inputMode="numeric" value={pausaTxt} onChange={(e) => setPausaTxt(e.target.value.replace(/\D/g, "").slice(0, 2))} aria-invalid={!!erro("pausa")} />
                    </Campo>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Campo rotulo="Capacidade" htmlFor={`${ids}-cap`} erro={erro("capacidade")} dica={`Até ${maxCapacidade} pessoas.`}>
            <Entrada
              id={`${ids}-cap`}
              icone={<Users />}
              inputMode="numeric"
              value={capacidadeTxt}
              onChange={(e) => setCapacidadeTxt(e.target.value.replace(/\D/g, "").slice(0, 3))}
              aria-invalid={!!erro("capacidade")}
            />
          </Campo>
        </div>

        <fieldset>
          <legend className="mb-2 text-[13px] font-medium text-tinta">
            Cor <span className="font-normal text-texto-2">· {t.nome}</span>
          </legend>
          <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Cor da sala">
            {TEMAS.map((id) => {
              const ativo = id === tema;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={ativo}
                  aria-label={TEMAS_SALA[id].nome}
                  title={TEMAS_SALA[id].nome}
                  onClick={() => setTema(id)}
                  className={cn(
                    "grid size-8 place-items-center rounded-full ring-offset-2 ring-offset-superficie transition-shadow duration-150",
                    ativo ? "ring-2 ring-tinta" : "hover:ring-2 hover:ring-borda",
                  )}
                  style={{ background: TEMAS_SALA[id].cor }}
                >
                  {ativo && <Check className="size-4 text-white" strokeWidth={2.5} aria-hidden />}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="space-y-2">
          <p className="text-[13px] font-medium text-tinta">{professor ? "Turma" : "Quem pode ver"}</p>
          {professor ? (
            <ChipGroup
              grupo="criar-sala-turma"
              rotulo="Turma da sala"
              quebrar
              opcoes={TURMAS_DO_PROFESSOR.map((tm) => ({ id: tm, rotulo: tm }))}
              valor={turmaProf}
              onChange={setTurmaProf}
            />
          ) : (
            <Segmentado
              grupo="criar-sala-acesso"
              rotulo="Quem pode ver a sala"
              opcoes={[
                { id: "turma", rotulo: `Só o ${turmaAluna.replace(" Ano ", " ")}` },
                { id: "aberta", rotulo: "Toda a escola" },
              ]}
              valor={acesso}
              onChange={setAcesso}
            />
          )}
        </div>

        <div className="divide-y divide-borda rounded-xl border border-borda">
          <label className="flex cursor-pointer items-center gap-3 p-3.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-superficie-2 text-texto-2">
              <KeyRound className="size-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-medium text-tinta">Sala privada</span>
              <span className="block text-[12px] text-texto-2">Só entra quem tiver o código de convite.</span>
            </span>
            <Switch ativo={privada} onChange={setPrivada} rotulo="Sala privada" />
          </label>

          {professor && (
            <div className="p-3.5">
              <label className="flex cursor-pointer items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-superficie-2 text-texto-2">
                  <CalendarClock className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-medium text-tinta">Agendar abertura</span>
                  <span className="block text-[12px] text-texto-2">Os alunos podem ativar um lembrete.</span>
                </span>
                <Switch ativo={agendar} onChange={ligarAgenda} rotulo="Agendar abertura" />
              </label>
              <AnimatePresence initial={false}>
                {agendar && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-2 pt-3">
                      <Campo rotulo="Dia" htmlFor={`${ids}-data`}>
                        <Entrada
                          id={`${ids}-data`}
                          type="date"
                          value={data}
                          onChange={(e) => {
                            setData(e.target.value);
                            setErroAgenda(null);
                          }}
                        />
                      </Campo>
                      <Campo rotulo="Hora" htmlFor={`${ids}-hora`}>
                        <Entrada
                          id={`${ids}-hora`}
                          type="time"
                          value={hora}
                          onChange={(e) => {
                            setHora(e.target.value);
                            setErroAgenda(null);
                          }}
                        />
                      </Campo>
                    </div>
                    {(erro("agenda") || erroAgenda) && <p className="mt-1.5 text-[12px] font-medium text-alerta">{erro("agenda") ?? erroAgenda}</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {tentou && !valido && (
          <p role="alert" className="text-[12.5px] font-medium text-alerta">
            Confira os campos destacados antes de criar a sala.
          </p>
        )}
      </div>

      <RodapeSheet>
        <Button variante="secundario" bloco className="shrink" onClick={onFechar}>
          Cancelar
        </Button>
        <Button type="submit" bloco className="shrink">
          {agendar ? "Agendar sala" : "Criar sala"}
          <ArrowRight />
        </Button>
      </RodapeSheet>
    </form>
  );
}

/** Depois de criar uma sala privada: mostra o código de convite para copiar. */
function Criada({ nome, codigo, onAbrir, onFechar }: { nome: string; codigo: string; onAbrir: () => void; onFechar: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}>
      <div className="grid place-items-center py-4 text-center">
        <span className="grid size-11 place-items-center rounded-full bg-verde-mclaro text-acento">
          <Lock className="size-5" aria-hidden />
        </span>
        <p className="mt-3 text-[17px] font-semibold text-tinta">Sala privada criada</p>
        <p className="mt-1 max-w-sm text-[14px] text-texto-2">Mande o código para quem vai estudar com você em “{nome}”.</p>
        <BotaoCopiar
          texto={codigo}
          className="mt-5 inline-flex items-center gap-3 rounded-xl border border-dashed border-borda bg-superficie-2 px-5 py-3 text-[20px] font-medium text-tinta transition-colors duration-150 hover:bg-superficie active:scale-[0.98] [&_svg]:size-4"
        />
        <p className="mt-2 text-[12px] text-texto-2">Toque no código para copiar.</p>
      </div>
      <Nota icone={<KeyRound />} className="mt-2">
        Quem estiver fora da sala digita o código em <strong className="font-semibold text-tinta">Salas → Entrar com código</strong>.
      </Nota>
      <RodapeSheet>
        <Button variante="secundario" bloco className="shrink" onClick={onFechar}>
          Fechar
        </Button>
        <Button bloco className="shrink" onClick={onAbrir}>
          Abrir a sala
          <ArrowRight />
        </Button>
      </RodapeSheet>
    </motion.div>
  );
}
