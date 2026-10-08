/**
 * Salas de estudo coletivas: entrar/sair (timer sincronizado com a sala),
 * chat com triagem de ofensas, reações, criação de salas e aviso de abertura das agendadas.
 */
import type { Disciplina } from "@/data/escola";
import { lerSessao } from "@/lib/auth";
import { gerarId, primeiroNome } from "@/lib/format";
import { verificarPublicacao } from "@/lib/moderacao";
import { notificarSistema } from "@/lib/estudos";
import { commit, MODERADOR_ID, notificar, papelAtual } from "../nucleo";
import { obterEstado } from "../store";
import type { MensagemSala, Post, SalaEstudo, TemaSala } from "../types";
import { toast } from "../ui";
import { encerrarFoco, iniciarFoco } from "./estudos";

function msg(autorId: string, texto: string, tipo: MensagemSala["tipo"] = "mensagem"): MensagemSala {
  return { id: gerarId("sm"), autorId, texto, criadoEm: Date.now(), tipo };
}

function sala(id: string) {
  return obterEstado().salas.find((s) => s.id === id);
}

/** Entra na sala e começa o foco sincronizado com o ciclo dela. */
export function entrarSala(salaId: string, disciplina?: Disciplina) {
  const estado = obterEstado();
  const s = sala(salaId);
  if (!s) return;
  if (s.agendadaPara && s.agendadaPara > Date.now()) {
    toast({ tipo: "info", titulo: "Sala ainda não abriu", mensagem: "Ative o lembrete para ser avisada na abertura." });
    return;
  }
  if (estado.salaAtual && estado.salaAtual !== salaId) sairSala(true);
  const nome = primeiroNome(estado.usuario.nome);
  commit({ type: "entrarSala", salaId, mensagem: msg(estado.usuario.id, `${nome} entrou na sala`, "sistema") });
  iniciarFoco({ disciplina: disciplina ?? s.disciplina ?? "Matemática", modo: s.focoMin >= 50 ? "profundo" : "pomodoro", salaId });
  toast({ tipo: "info", titulo: `Você entrou em “${s.nome}”`, mensagem: `${s.membros.length + 1} pessoas focando juntas · ciclos de ${s.focoMin}/${s.pausaMin} min` }, 3000);

}

/** Sai da sala atual (encerra o foco da sala, registrando o que já foi feito). */
export function sairSala(silencioso = false) {
  const estado = obterEstado();
  if (!estado.salaAtual) return;
  if (estado.estudos.timer?.salaId === estado.salaAtual) encerrarFoco(silencioso);
  commit({ type: "sairSala", mensagem: msg(estado.usuario.id, `${primeiroNome(estado.usuario.nome)} saiu da sala`, "sistema") });
  if (!silencioso) toast({ tipo: "info", titulo: "Você saiu da sala" }, 2000);
}

export interface NovaSala {
  nome: string;
  descricao: string;
  disciplina?: Disciplina;
  focoMin: number;
  pausaMin: number;
  privada: boolean;
  tema: TemaSala;
  capacidade: number;
  turma?: string;
  /** Agendar abertura (timestamp). Sem valor = abre agora. */
  agendadaPara?: number;
}

function gerarCodigo() {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c = "";
  for (let i = 0; i < 4; i++) c += letras[Math.floor(Math.random() * letras.length)];
  return `SALA-${c}`;
}

/** Cria uma sala. Professor cria sala "oficial" e os alunos da turma são avisados. Devolve o id. */
export function criarSala(dados: NovaSala) {
  const sessao = lerSessao();
  const criadorId = sessao?.usuarioId ?? obterEstado().usuario.id;
  const oficial = papelAtual() === "professor";
  const agora = Date.now();
  const nova: SalaEstudo = {
    id: gerarId("sala"),
    ...dados,
    nome: dados.nome.trim(),
    descricao: dados.descricao.trim(),
    criadorId,
    oficial,
    codigo: dados.privada ? gerarCodigo() : undefined,
    cicloInicio: dados.agendadaPara ?? agora,
    membros: [],
    mensagens: [msg(criadorId, `Sala criada por ${obterEstado().pessoas[criadorId]?.nome ?? "você"}`, "sistema")],
    focoHojeMin: 0,
    criadaEm: agora,
  };
  commit({ type: "criarSala", sala: nova });

  if (oficial) {
    const aluna = obterEstado().usuario;
    if (!nova.turma || nova.turma === aluna.turma) {
      notificar(aluna.id, {
        tipo: "sala",
        titulo: dados.agendadaPara ? "Nova sala agendada" : "Nova sala de estudos aberta",
        texto: `${obterEstado().pessoas[criadorId]?.nome ?? "Seu professor"} abriu “${nova.nome}”.`,
        href: `/estudos/salas/${nova.id}`,
        deId: criadorId,
      });
    }
    toast({ tipo: "info", titulo: "Sala oficial criada", mensagem: nova.privada ? `Código de convite: ${nova.codigo}` : "Os alunos da turma foram avisados." }, 3600);
  } else {
    toast({ tipo: "info", titulo: "Sala criada", mensagem: nova.privada ? `Código de convite: ${nova.codigo}` : "Chame os colegas pelo link da sala." }, 3600);
  }
  return nova.id;
}

export function fecharSala(salaId: string) {
  const s = sala(salaId);
  if (!s) return;
  if (obterEstado().salaAtual === salaId) sairSala(true);
  commit({ type: "fecharSala", salaId });
  toast({ tipo: "info", titulo: "Sala encerrada", mensagem: s.nome }, 2400);
}

/**
 * Mensagem barrada pela triagem: fica retida na fila de moderação do professor (com o nome da sala).
 * Liberar publica na sala; remover descarta com motivo. O autor é avisado nos dois casos.
 */
function reterMensagemSala(salaId: string, autorId: string, texto: string, motivo: string) {
  const nomeSala = sala(salaId)?.nome ?? "sala de estudo";
  const post: Post = {
    id: gerarId("p"),
    tipo: "publicacao",
    autorId,
    espaco: "9A",
    texto: `Chat da sala “${nomeSala}”: ${texto}`,
    tags: [],
    criadoEm: Date.now(),
    curtidas: 0,
    curtido: false,
    salvo: false,
    respostas: [],
    emRevisao: true,
    origemSala: { salaId, salaNome: nomeSala, mensagem: texto },
  };
  commit({ type: "publicar", post });
  if (autorId !== MODERADOR_ID) {
    notificar(MODERADOR_ID, {
      tipo: "moderacao",
      titulo: "Mensagem de chat retida para revisão",
      texto: `${primeiroNome(obterEstado().pessoas[autorId]?.nome ?? "Aluno")} na sala “${nomeSala}” · possível ${motivo.toLowerCase()}`,
      href: "/professor/moderacao",
      deId: autorId,
    });
  }
  toast({ tipo: "alerta", titulo: "Mensagem retida para revisão", mensagem: `Possível ${motivo.toLowerCase()}. O professor decide se ela é publicada na sala e você recebe o resultado.` }, 4600);
}

/** Envia mensagem no chat da sala (com triagem automática de ofensas — US06). */
export function enviarMensagemSala(salaId: string, texto: string) {
  const limpo = texto.trim();
  if (!limpo) return;
  const moderacao = verificarPublicacao(limpo);
  const autorId = lerSessao()?.usuarioId ?? obterEstado().usuario.id;
  if (moderacao.sinalizado) {
    reterMensagemSala(salaId, autorId, limpo, moderacao.motivo);
    return;
  }
  commit({ type: "mensagemSala", salaId, mensagem: msg(autorId, limpo) });

}

export function reagirSala(salaId: string, emoji: string) {
  const autorId = lerSessao()?.usuarioId ?? obterEstado().usuario.id;
  commit({ type: "mensagemSala", salaId, mensagem: msg(autorId, emoji, "reacao") });
}

/**
 * Salas agendadas que já abriram: se o lembrete está ativo, avisa uma única vez
 * (notificação no app + do sistema). Chame periodicamente (MotorEstudos).
 */
export function verificarSalasAgendadas() {
  const estado = obterEstado();
  const agora = Date.now();
  const para = lerSessao()?.usuarioId ?? estado.usuario.id;
  for (const s of estado.salas) {
    if (!s.agendadaPara || s.agendadaPara > agora) continue;
    const chave = `sala:${s.id}`;
    const marca = `avisada:${s.id}`;
    if (!estado.lembretes.includes(chave) || estado.lembretes.includes(marca)) continue;
    commit({ type: "alternarLembrete", eventoId: marca });
    notificar(para, { tipo: "sala", titulo: "Sua sala abriu", texto: `“${s.nome}” está ao vivo agora.`, href: `/estudos/salas/${s.id}` });
    notificarSistema("Sua sala abriu", `“${s.nome}” está ao vivo agora.`);
  }
}

/** Encontra uma sala privada pelo código de convite. Devolve o id ou null. */
export function buscarSalaPorCodigo(codigo: string) {
  const alvo = codigo.trim().toUpperCase();
  const s = obterEstado().salas.find((x) => x.privada && x.codigo?.toUpperCase() === alvo);
  if (!s) toast({ tipo: "alerta", titulo: "Código não encontrado", mensagem: "Confira com quem criou a sala." }, 2800);
  return s?.id ?? null;
}
