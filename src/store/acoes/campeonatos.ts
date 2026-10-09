/**
 * Campeonatos internos: criar (aluno cria amistoso, professor cria oficial),
 * inscrever, iniciar/encerrar, duelos de quiz no mata-mata e rodadas de pontos corridos.
 */
import type { Disciplina } from "@/data/escola";
import { lerSessao } from "@/lib/auth";
import {
  classificacao,
  decidirPendentesPorDesempenho,
  desempenhoDoColega,
  diaLocal,
  forcaDe,
  gerarChave,
  jogouRodadaHoje,
  ladoVencedor,
  lider,
  nivelDoEstado,
  partidaDoAluno,
  registrarResultado,
  resolverPartidasDosColegas,
  semearParticipantes,
} from "@/lib/campeonatos";
import { hashTexto, mulberry32 } from "@/lib/aleatorio";
import { gerarId, primeiroNome } from "@/lib/format";
import { commit, notificar, papelAtual, premiar } from "../nucleo";
import { obterEstado } from "../store";
import type { Campeonato, CapaCampeonato, FormatoCampeonato, MetricaCampeonato, Partida } from "../types";
import { celebrar, toast } from "../ui";

function campeonato(id: string) {
  return obterEstado().campeonatos.find((c) => c.id === id);
}

function salvar(c: Campeonato) {
  commit({ type: "atualizarCampeonato", campeonato: c });
}

export interface NovoCampeonato {
  nome: string;
  descricao: string;
  formato: FormatoCampeonato;
  metrica: MetricaCampeonato;
  disciplina?: Disciplina;
  inicio: number;
  fim: number;
  premio: { pontos: number; xp: number; titulo?: string };
  maxParticipantes: number;
  capa: CapaCampeonato;
  turmas: string[];
  /** Convidados já inscritos (amistoso entre amigos) ou turmas (interclasses). */
  participantes?: string[];
}

/** Cria o campeonato e devolve o id. O criador aluno entra automaticamente. */
export function criarCampeonato(dados: NovoCampeonato) {
  const sessao = lerSessao();
  const estado = obterEstado();
  const criadorId = sessao?.usuarioId ?? estado.usuario.id;
  const oficial = papelAtual() === "professor";
  const agora = Date.now();

  let participantes = [...new Set(dados.participantes ?? [])];
  if (!oficial && dados.formato !== "interclasses" && !participantes.includes(criadorId)) participantes = [criadorId, ...participantes];
  const status = dados.inicio <= agora ? "andamento" : "inscricoes";

  const novo: Campeonato = {
    id: gerarId("camp"),
    ...dados,
    nome: dados.nome.trim(),
    descricao: dados.descricao.trim(),
    criadorId,
    oficial,
    status,
    participantes,
    partidas: dados.formato === "mata-mata" && status === "andamento" && participantes.length >= 2 ? gerarChave(participantes) : [],
    placar: Object.fromEntries(participantes.map((p) => [p, 0])),
    criadoEm: agora,
  };
  commit({ type: "criarCampeonato", campeonato: novo });

  const aluna = estado.usuario;
  const alunaConvidada = participantes.includes(aluna.id) || (dados.formato === "interclasses" && participantes.includes(aluna.turma));
  if (oficial && (alunaConvidada || !dados.turmas.length || dados.turmas.includes(aluna.turma))) {
    notificar(aluna.id, {
      tipo: "campeonato",
      titulo: status === "inscricoes" ? "Inscrições abertas!" : "Novo campeonato começou",
      texto: `${estado.pessoas[criadorId]?.nome ?? "A escola"} criou “${novo.nome}”.`,
      href: `/campeonatos/${novo.id}`,
      deId: criadorId,
    });
  }
  // Convites de um amistoso criado pela aluna: os amigos aceitam em seguida.
  toast({ tipo: "medalha", titulo: "Campeonato criado!", mensagem: status === "inscricoes" ? "As inscrições estão abertas." : "Já está valendo — boa sorte!" }, 3200);
  return novo.id;
}

export function inscreverCampeonato(id: string) {
  const c = campeonato(id);
  const { usuario } = obterEstado();
  if (!c || c.participantes.includes(usuario.id) || c.participantes.length >= c.maxParticipantes) return;
  salvar({ ...c, participantes: [...c.participantes, usuario.id], placar: { ...c.placar, [usuario.id]: 0 } });
  toast({ tipo: "medalha", titulo: "Inscrição confirmada", mensagem: `Você está em “${c.nome}”.` }, 3000);
}

export function sairDoCampeonato(id: string) {
  const c = campeonato(id);
  const { usuario } = obterEstado();
  if (!c || c.status !== "inscricoes") return;
  const placar = { ...c.placar };
  delete placar[usuario.id];
  salvar({ ...c, participantes: c.participantes.filter((p) => p !== usuario.id), placar });
  toast({ tipo: "info", titulo: "Inscrição cancelada" }, 2200);
}

/** Professor/organizador inicia o campeonato: fecha inscrições e monta o chaveamento. */
export function iniciarCampeonato(id: string) {
  const c = campeonato(id);
  if (!c || c.status !== "inscricoes") return;
  if (c.formato === "mata-mata" && c.participantes.length < 2) {
    toast({ tipo: "alerta", titulo: "Faltam inscritos", mensagem: "O mata-mata precisa de pelo menos 2 participantes." }, 3000);
    return;
  }
  // Chaveamento por nível (melhor × pior), sem sorteio.
  const partidas = c.formato === "mata-mata" ? gerarChave(semearParticipantes(c.participantes, nivelDoEstado(obterEstado(), c.disciplina))) : [];
  const iniciado: Campeonato = { ...c, status: "andamento", inicio: Math.min(c.inicio, Date.now()), partidas };
  salvar(iniciado);
  const aluna = obterEstado().usuario;
  if (iniciado.participantes.includes(aluna.id)) {
    const partida = partidaDoAluno(iniciado, aluna.id);
    notificar(aluna.id, {
      tipo: "campeonato",
      titulo: `${c.nome} começou!`,
      texto: partida ? "Seu primeiro duelo já está liberado." : "A tabela já está valendo.",
      href: `/campeonatos/${c.id}`,
    });
  }
  toast({ tipo: "info", titulo: "Campeonato iniciado", mensagem: `${c.participantes.length} ${c.participantes.length === 1 ? "participante" : "participantes"} · inscrições encerradas.` }, 3000);
}

/**
 * Encerra e premia. No mata-mata, confrontos sem resultado vão para quem tem melhor desempenho real (XP e domínio), sem sorteio.
 * Nos demais formatos, vence quem tem mais pontos; empate desempata por maior XP. Se o 1º tem 0 ponto, não há campeão nem prêmio.
 */
export function encerrarCampeonato(id: string) {
  let c = campeonato(id);
  if (!c || c.status === "encerrado") return;
  const nivelDe = nivelDoEstado(obterEstado(), c.disciplina);
  if (c.formato === "mata-mata") c = decidirPendentesPorDesempenho(c, nivelDe);
  const campeao = c.campeao ?? lider(c, nivelDe);
  const final: Campeonato = { ...c, status: "encerrado", campeao, fim: Math.min(c.fim, Date.now()) };
  salvar(final);
  if (!campeao) {
    toast(
      {
        tipo: "info",
        titulo: c.formato === "mata-mata" ? "Encerrado sem campeão: nenhum confronto foi decidido" : "Encerrado sem campeão: ninguém pontuou",
        mensagem: "Sem campeão, ninguém recebe o prêmio.",
      },
      3600,
    );
    return;
  }
  premiarCampeao(final);
  toast({ tipo: "medalha", titulo: "Campeonato encerrado", mensagem: `Campeão: ${obterEstado().pessoas[campeao]?.nome ?? campeao}` }, 3400);
}

function premiarCampeao(c: Campeonato) {
  const { usuario } = obterEstado();
  const venceu = c.campeao === usuario.id || (c.formato === "interclasses" && c.campeao === usuario.turma);
  if (!venceu) return;
  const silencioso = papelAtual() !== "aluno";
  premiar(c.premio.pontos, c.premio.xp, `prêmio de “${c.nome}”`, c.disciplina, silencioso);
  notificar(usuario.id, {
    tipo: "campeonato",
    titulo: c.formato === "interclasses" ? `Sua turma venceu “${c.nome}”` : `Você venceu “${c.nome}”`,
    texto: c.premio.titulo ? `Título: ${c.premio.titulo}` : undefined,
    href: `/campeonatos/${c.id}`,
  });
  if (!silencioso) celebrar();
}

export interface ResultadoDuelo {
  venceu: boolean;
  meuPlacar: number;
  placarAdversario: number;
  adversarioId: string | null;
  campeao: boolean;
  /** Próximo duelo liberado (se venceu). */
  proxima?: string;
  /** Tempo total de resposta (ms) de cada lado — decide o empate em acertos. */
  meuTempo: number;
  tempoAdversario: number;
}

const PERGUNTAS_DUELO = 5;

/** Partida do mata-mata que a aluna começou e ainda não terminou (sair ou recarregar no meio a deixa assim). */
function partidaEmCurso(c: Campeonato, alunoId: string) {
  return c.partidas.find((p) => p.status === "disponivel" && p.emCurso?.alunoId === alunoId);
}

function atualizarPartida(c: Campeonato, partidaId: string, mudar: (p: Partida) => Partida) {
  salvar({ ...c, partidas: c.partidas.map((p) => (p.id === partidaId ? mudar(p) : p)) });
}

/**
 * A aluna começou o duelo: a partida passa a "em curso" e a tentativa já está consumida
 * (sair ou recarregar agora conta como derrota). Devolve false se a partida não está disponível para ela.
 */
export function iniciarDuelo(campId: string, partidaId: string): boolean {
  const c = campeonato(campId);
  const { usuario } = obterEstado();
  const p = c?.partidas.find((x) => x.id === partidaId);
  if (!c || !p || p.status !== "disponivel" || (p.a !== usuario.id && p.b !== usuario.id)) return false;
  // Duplo clique em "Começar": o segundo segue; uma partida já com respostas não recomeça.
  if (p.emCurso) return p.emCurso.alunoId === usuario.id && p.emCurso.respostas === 0;
  atualizarPartida(c, partidaId, (x) => ({ ...x, emCurso: { alunoId: usuario.id, desde: Date.now(), respostas: 0, acertos: 0, tempoMs: 0 } }));
  return true;
}

/** Guarda cada resposta do duelo (acerto e tempo gasto) para que sair no meio finalize com o que já foi feito. */
export function registrarRespostaDuelo(campId: string, partidaId: string, acertou: boolean, tempoMs: number) {
  const c = campeonato(campId);
  if (!c?.partidas.find((p) => p.id === partidaId)?.emCurso) return;
  atualizarPartida(c, partidaId, (p) =>
    p.emCurso
      ? { ...p, emCurso: { ...p.emCurso, respostas: p.emCurso.respostas + 1, acertos: p.emCurso.acertos + (acertou ? 1 : 0), tempoMs: p.emCurso.tempoMs + Math.max(0, tempoMs) } }
      : p,
  );
}

/**
 * Fecha o duelo da aluna: os colegas jogam conforme o nível real (XP/domínio), com semente fixa por partida.
 * Empate em acertos: vence quem teve o menor tempo total de resposta. Com `abandono`, a aluna perde
 * (WO) mantendo os acertos que fez; o placar nunca mostra o rival atrás dela.
 */
function concluirDuelo(c: Campeonato, p: Partida, acertos: number, total: number, tempoMs: number, abandono: boolean): ResultadoDuelo {
  const estado = obterEstado();
  const { usuario } = estado;
  const souA = p.a === usuario.id;
  const adversarioId = souA ? p.b : p.a;
  const nivelDe = nivelDoEstado(estado, c.disciplina);
  const rival = desempenhoDoColega(nivelDe(adversarioId ?? ""), `${c.id}-${p.id}-${adversarioId}`, total);
  const eu = { acertos, tempoTotal: tempoMs, forca: forcaDe(nivelDe(usuario.id)) };
  const outro = { acertos: rival.acertos, tempoTotal: rival.tempoTotal, forca: forcaDe(nivelDe(adversarioId ?? "")) };
  const venceu = !abandono && ladoVencedor(eu, outro) === "a";
  const vencedorId = venceu ? usuario.id : (adversarioId ?? usuario.id);
  const placarRival = abandono ? Math.max(rival.acertos, acertos) : rival.acertos;
  const [placarA, placarB] = souA ? [acertos, placarRival] : [placarRival, acertos];

  let atualizado = registrarResultado(c, p.id, placarA, placarB, vencedorId, abandono);
  const [tempoA, tempoB] = souA ? [tempoMs, rival.tempoTotal] : [rival.tempoTotal, tempoMs];
  atualizado = { ...atualizado, partidas: atualizado.partidas.map((x) => (x.id === p.id ? { ...x, tempoA, tempoB, criterio: "duelo" as const, emCurso: undefined } : x)) };
  atualizado = resolverPartidasDosColegas(atualizado, usuario.id, nivelDe, p.rodada);
  // Eliminada: os confrontos entre colegas seguem pelo mesmo critério até a final.
  if (!venceu) atualizado = resolverPartidasDosColegas(atualizado, usuario.id, nivelDe);
  // Final decidida = campeonato encerrado agora: o fim agendado (que pode estar no futuro) não vale mais.
  if (atualizado.status === "encerrado") atualizado = { ...atualizado, fim: Math.min(atualizado.fim, Date.now()) };
  salvar(atualizado);

  // Amistoso de aluno não emite pontos da escola; o XP dos acertos é mérito e vale sempre.
  premiar(c.oficial ? acertos * 2 : 0, acertos * 6, `duelo em “${c.nome}”: ${acertos}/${total} acertos${abandono ? " (saiu antes do fim)" : ""}`, c.disciplina);
  const proxima = partidaDoAluno(atualizado, usuario.id);
  const campeao = atualizado.campeao === usuario.id;
  if (atualizado.status === "encerrado") premiarCampeao(atualizado);
  else if (venceu && proxima) {
    const outroId = proxima.a === usuario.id ? proxima.b : proxima.a;
    notificar(usuario.id, { tipo: "campeonato", titulo: "Próximo duelo liberado!", texto: `Você enfrenta ${primeiroNome(obterEstado().pessoas[outroId ?? ""]?.nome ?? "")}.`, href: `/campeonatos/${c.id}` }, false);
  }
  return { venceu, meuPlacar: acertos, placarAdversario: placarRival, adversarioId, campeao, proxima: proxima?.id, meuTempo: tempoMs, tempoAdversario: rival.tempoTotal };
}

/** Registra o duelo de quiz da aluna numa partida do mata-mata (resultado final, depois das 5 perguntas). */
export function jogarDuelo(campId: string, partidaId: string, acertos: number, total: number, tempoMs: number): ResultadoDuelo | null {
  const c = campeonato(campId);
  const p = c?.partidas.find((x) => x.id === partidaId);
  if (!c || !p || p.status !== "disponivel") return null;
  return concluirDuelo(c, p, acertos, total, tempoMs, false);
}

/** Sair do duelo no meio (confirmado): conta como derrota, mantendo os acertos já feitos. */
export function abandonarDuelo(campId: string, partidaId: string): ResultadoDuelo | null {
  const c = campeonato(campId);
  const p = c?.partidas.find((x) => x.id === partidaId);
  if (!c || !p || p.status !== "disponivel") return null;
  const r = concluirDuelo(c, p, p.emCurso?.acertos ?? 0, PERGUNTAS_DUELO, p.emCurso?.tempoMs ?? 0, true);
  toast({ tipo: "alerta", titulo: "Você saiu do duelo", mensagem: `Contou como derrota, com ${r.meuPlacar} ${r.meuPlacar === 1 ? "acerto" : "acertos"} até aqui.` }, 4200);
  return r;
}

/**
 * Ao abrir o campeonato: se a aluna deixou um duelo pela metade (recarregou ou saiu da tela), finaliza com os
 * acertos registrados e avisa. Devolve true se mudou o estado.
 */
export function resolverDueloEmCurso(campId: string): boolean {
  const c = campeonato(campId);
  const { usuario } = obterEstado();
  // Só a própria aluna, na aba dela: o professor abrindo o campeonato não encerra o duelo de ninguém.
  if (papelAtual() !== "aluno" || (lerSessao()?.usuarioId ?? usuario.id) !== usuario.id) return false;
  const p = c && partidaEmCurso(c, usuario.id);
  if (!c || !p) return false;
  const r = concluirDuelo(c, p, p.emCurso?.acertos ?? 0, PERGUNTAS_DUELO, p.emCurso?.tempoMs ?? 0, true);
  toast(
    { tipo: "alerta", titulo: "Duelo interrompido", mensagem: `Você saiu no meio. A partida contou como derrota, com ${r.meuPlacar} ${r.meuPlacar === 1 ? "acerto" : "acertos"} até ali.` },
    5200,
  );
  return true;
}

/** Rodadas de quiz iniciadas neste navegador (campeonato:aluna) — a tentativa do dia é consumida ao começar. */
const rodadasIniciadas = new Set<string>();

/**
 * Pontos corridos: começa a rodada de hoje. Cada aluna joga uma por dia; a tentativa é consumida ao começar,
 * então sair no meio não devolve a rodada. Devolve false se já jogou hoje (ou se não pode jogar).
 */
export function iniciarRodadaQuiz(campId: string): boolean {
  const c = campeonato(campId);
  const { usuario } = obterEstado();
  if (!c || c.status !== "andamento" || !c.participantes.includes(usuario.id)) return false;
  const agora = Date.now();
  if (jogouRodadaHoje(c, usuario.id, agora)) {
    toast({ tipo: "info", titulo: "Próxima rodada amanhã", mensagem: "Você já jogou a rodada de hoje neste campeonato." }, 3000);
    return false;
  }
  salvar({ ...c, rodadasJogadas: { ...(c.rodadasJogadas ?? {}), [usuario.id]: diaLocal(agora) } });
  rodadasIniciadas.add(`${campId}:${usuario.id}`);
  return true;
}

/** Rodada de quiz em campeonato de pontos corridos: cada acerto vale 10 pontos na tabela (uma rodada por dia). */
export function jogarRodadaQuiz(campId: string, acertos: number, total: number) {
  const c = campeonato(campId);
  const { usuario } = obterEstado();
  if (!c || c.status !== "andamento" || !c.participantes.includes(usuario.id)) return null;
  const chave = `${campId}:${usuario.id}`;
  const agora = Date.now();
  // Sem rodada iniciada aqui e com o dia já gasto: não paga de novo.
  if (!rodadasIniciadas.has(chave) && jogouRodadaHoje(c, usuario.id, agora)) return null;
  rodadasIniciadas.delete(chave);
  const placar = { ...c.placar, [usuario.id]: (c.placar[usuario.id] ?? 0) + acertos * 10 };
  // Os colegas jogam conforme o nível real (XP/domínio); a semente fixa por rodada mantém o resultado reproduzível.
  const nivelDe = nivelDoEstado(obterEstado(), c.disciplina);
  for (const id of c.participantes) {
    if (id === usuario.id) continue;
    const semente = `${c.id}-rodada-${c.placar[usuario.id] ?? 0}-${id}`;
    if (mulberry32(hashTexto(`${semente}-joga`))() > 0.35 + 0.4 * forcaDe(nivelDe(id))) continue;
    placar[id] = (placar[id] ?? 0) + desempenhoDoColega(nivelDe(id), semente, total).acertos * 10;
  }
  const atualizado: Campeonato = { ...c, placar, rodadasJogadas: { ...(c.rodadasJogadas ?? {}), [usuario.id]: diaLocal(agora) } };
  salvar(atualizado);
  premiar(c.oficial ? acertos * 2 : 0, acertos * 5, `rodada em “${c.nome}”: ${acertos}/${total} acertos`, c.disciplina);
  return classificacao(atualizado, nivelDe).find((l) => l.id === usuario.id)?.posicao ?? 0;
}

export function excluirCampeonato(id: string) {
  commit({ type: "removerCampeonato", id });
  toast({ tipo: "info", titulo: "Campeonato excluído" }, 2200);
}
