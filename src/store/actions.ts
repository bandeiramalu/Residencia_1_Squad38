/**
 * Ações do Portal do Aluno: cada função é um fluxo de usuário completo
 * (muda o estado, mostra notificações e agenda eventos simulados).
 * Os componentes chamam estas funções — nunca o reducer direto.
 */
import { ESCOLA, type Disciplina } from "@/data/escola";
import { pontosDaSequencia } from "@/data/missoes";
import { itemPorId } from "@/data/loja";
import { USUARIO_ID } from "@/data/pessoas";
import { gerarId, gerarVoucher, primeiroNome } from "@/lib/format";
import { medalhasConquistadas, nivelDe } from "@/lib/gamificacao";
import { triarDenuncia, verificarPublicacao, type MotivoDenuncia } from "@/lib/moderacao";
import { baixarArquivo, gerarPdf } from "@/lib/pdf";
import { dataCurta } from "@/lib/tempo";
import type { Acao } from "./reducer";
import { criarEstadoInicial } from "./seed";
import { despachar, obterEstado } from "./store";
import type { EspacoId, Post, TipoPost } from "./types";
import { celebrar, toast } from "./ui";

/* ───────────── Infraestrutura ───────────── */

/** Invalida eventos agendados quando a demonstração é reiniciada. */
let epoca = 0;

function agendar(ms: number, fn: () => void) {
  const minhaEpoca = epoca;
  setTimeout(() => {
    if (minhaEpoca === epoca) fn();
  }, ms);
}

function commit(acao: Acao) {
  const antes = obterEstado();
  const depois = despachar(acao);
  if (depois !== antes) verificarConquistas(antes.usuario.xp, depois.usuario.xp);
  return depois;
}

function verificarConquistas(xpAntes: number, xpDepois: number) {
  const nivelAntes = nivelDe(xpAntes);
  const nivelDepois = nivelDe(xpDepois);
  if (nivelDepois.n > nivelAntes.n) {
    toast({ tipo: "nivel", titulo: `Você chegou ao nível ${nivelDepois.n} · ${nivelDepois.titulo}`, mensagem: "Nível só sobe com mérito acadêmico." }, 4200);
    celebrar();
  }
  for (const def of medalhasConquistadas(obterEstado())) {
    despachar({ type: "desbloquearMedalha", id: def.id, em: Date.now() });
    toast({ tipo: "medalha", titulo: `Medalha desbloqueada: ${def.nome}`, mensagem: def.criterio }, 4200);
    celebrar();
  }
}

function descreverGanho(pontos: number, xp: number) {
  const partes: string[] = [];
  if (pontos > 0) partes.push(`+${pontos} pontos`);
  if (xp > 0) partes.push(`+${xp} XP`);
  return partes.join(" e ");
}

export function premiar(pontos: number, xp: number, motivo: string, disciplina?: Disciplina) {
  commit({ type: "premiar", pontos, xp, disciplina });
  toast({ tipo: xp > 0 && !pontos ? "xp" : "ganho", titulo: descreverGanho(pontos, xp), mensagem: motivo });
}

function pessoa(id: string) {
  return obterEstado().pessoas[id];
}

function professorDe(disciplina: Disciplina) {
  return Object.values(obterEstado().pessoas).find((p) => p.papel === "professor" && p.disciplina === disciplina);
}

function acharPost(id: string) {
  return obterEstado().posts.find((p) => p.id === id);
}

/* ───────────── Feed ───────────── */

export function curtir(postId: string) {
  commit({ type: "curtir", postId });
}

export function salvar(postId: string) {
  const depois = commit({ type: "salvar", postId });
  const salvo = depois.posts.find((p) => p.id === postId)?.salvo;
  toast({ tipo: "info", titulo: salvo ? "Salvo nos seus favoritos" : "Removido dos favoritos" }, 2200);
}

export function abrirMaterial(postId: string) {
  commit({ type: "materialAberto", postId });
  const missao = obterEstado().missoes.find((m) => m.postId === postId && m.tipo === "diaria" && !m.concluida);
  if (missao) avancarMissao(missao.id, 1);
}

export function baixarMaterial(post: Post) {
  if (!post.anexo) return;
  const autor = pessoa(post.autorId);
  const blob = gerarPdf([
    { texto: `${ESCOLA.nome} — Portal do Aluno`, tamanho: 12, negrito: true, cor: [1, 1, 1], espaco: 26 },
    { texto: post.anexo.nome, tamanho: 18, negrito: true, cor: [0.106, 0.227, 0.173], espaco: 4 },
    { texto: `${post.disciplina ?? "Material"} · ${autor?.nome ?? ""} · ${dataCurta(post.criadoEm)}`, tamanho: 10, cor: [0.435, 0.506, 0.471], espaco: 18 },
    { texto: post.texto, tamanho: 11, espaco: 18 },
    {
      texto:
        "Arquivo de demonstração gerado pelo protótipo do Portal do Aluno (Squad 38). Na versão integrada ao portal da escola, este botão baixa o arquivo original enviado pelo professor.",
      tamanho: 9,
      cor: [0.435, 0.506, 0.471],
    },
  ]);
  baixarArquivo(blob, post.anexo.nome);
  abrirMaterial(post.id);
  toast({ tipo: "info", titulo: "Download iniciado", mensagem: post.anexo.nome }, 2400);
}

const RESPOSTAS_COLEGAS: Record<Disciplina, { autorId: string; texto: string }> = {
  Matemática: { autorId: "lucas", texto: "Tenta desenhar o gráfico com dois pontos e ver para onde a reta vai — foi o que me destravou na lista 7." },
  Biologia: { autorId: "julia", texto: "Revisei isso com o mapa mental da aula 12 da Profª. Denise. Está tudo lá, bem resumido." },
  História: { autorId: "marina", texto: "Separa em duas colunas: o que vinha de antes (estrutural) e o que aconteceu no dia (estopim). Ajuda a não misturar." },
  Português: { autorId: "sofia", texto: "Procura o conectivo: se tiver 'como' ou 'tal qual', é comparação. Sem conectivo, costuma ser metáfora." },
  Química: { autorId: "sofia", texto: "Faz um flashcard com isso! Revisei assim na prática rápida e nunca mais esqueci." },
  Física: { autorId: "pedro", texto: "Monta uma tabelinha com distância e tempo de cada trecho antes de fazer a conta." },
  Geografia: { autorId: "marina", texto: "Tem um mapa ótimo na apostila 4 que mostra isso direitinho. Te mostro no intervalo." },
  Inglês: { autorId: "lucas", texto: "O Teacher Daniel explicou isso na Unit 5 — tem exemplo na vocabulary list que ele postou." },
};

const RESPOSTAS_PROFESSOR: Record<Disciplina, string> = {
  Matemática: "Ótima pergunta. Vou retomar esse ponto na aula de quinta com um exemplo no plano cartesiano — tragam a lista 7.",
  Biologia: "Esse é um erro clássico: observe as figuras 3 e 4 do capítulo 6. Na próxima aula faremos a montagem com massa de modelar.",
  História: "Boa dúvida. Diferenciar causa estrutural de estopim é o que vamos treinar na atividade da semana que vem.",
  Português: 'Repare na presença (ou não) do conectivo comparativo ("como"). Comento na correção da redação.',
  Química: "Confira a tabela da página 112. Na aula prática de terça vamos testar isso no laboratório.",
  Física: "Bom questionamento. Vamos resolver esse caso na lousa com o diagrama de forças na aula de segunda.",
  Geografia: "Interessante! Traga esse recorte para o debate de sexta — é a discussão da apostila 4.",
  Inglês: "Great question! Esse tempo verbal aparece no texto 2 da Unit 5. Faremos a leitura guiada na próxima aula.",
};

interface NovaPublicacao {
  tipo: Exclude<TipoPost, "aviso">;
  disciplina: Disciplina;
  texto: string;
  tags: string[];
}

function slug(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function publicar({ tipo, disciplina, texto, tags }: NovaPublicacao) {
  const estado = obterEstado();
  const moderacao = verificarPublicacao(texto);
  const espaco: EspacoId = estado.espaco === "escola" ? "9A" : estado.espaco;
  const qtdMateriais = estado.posts.filter((p) => p.autorId === USUARIO_ID && p.tipo === "material").length;

  const post: Post = {
    id: gerarId("p"),
    tipo,
    autorId: USUARIO_ID,
    espaco,
    disciplina,
    texto,
    tags,
    criadoEm: Date.now(),
    curtidas: 0,
    curtido: false,
    salvo: false,
    respostas: [],
    anexo:
      tipo === "material"
        ? { nome: `${slug(disciplina)}-material-${qtdMateriais + 1}.pdf`, paginas: 2, tamanho: "96 KB" }
        : undefined,
    emRevisao: moderacao.sinalizado || undefined,
  };
  commit({ type: "publicar", post });

  if (moderacao.sinalizado) {
    toast(
      {
        tipo: "alerta",
        titulo: "Publicação enviada para revisão",
        mensagem: `A triagem automática sinalizou possível ${moderacao.motivo.toLowerCase()}. Um coordenador vai revisar — nada é punido automaticamente.`,
      },
      5200,
    );
    return post.id;
  }

  if (tipo === "material") {
    commit({ type: "premiar", pontos: 10, xp: 0 });
    toast({ tipo: "ganho", titulo: "Material compartilhado", mensagem: "+10 pontos por colaborar com a turma" });
  } else if (tipo === "duvida") {
    toast({ tipo: "info", titulo: `Dúvida publicada em ${disciplina}`, mensagem: "Você será avisada quando alguém responder." });
    simularRespostasDaDuvida(post.id, disciplina);
  } else {
    toast({ tipo: "info", titulo: "Publicação enviada", mensagem: "Sua turma já pode ver no feed." });
  }
  return post.id;
}

function simularRespostasDaDuvida(postId: string, disciplina: Disciplina) {
  const colega = RESPOSTAS_COLEGAS[disciplina];
  agendar(5000, () => {
    if (!acharPost(postId)) return;
    commit({
      type: "responder",
      postId,
      resposta: { id: gerarId("r"), autorId: colega.autorId, texto: colega.texto, criadoEm: Date.now(), uteis: 0, util: false },
    });
    premiar(10, 0, `${primeiroNome(pessoa(colega.autorId)?.nome ?? "Um colega")} respondeu sua dúvida`);
  });

  const professor = professorDe(disciplina);
  if (!professor) return;
  agendar(11000, () => {
    if (!acharPost(postId)) return;
    commit({
      type: "responder",
      postId,
      resposta: { id: gerarId("r"), autorId: professor.id, texto: RESPOSTAS_PROFESSOR[disciplina], criadoEm: Date.now(), uteis: 0, util: false, oficial: true },
    });
    premiar(20, 15, `${professor.nome} deu a resposta oficial`, disciplina);
  });
}

export function responder(postId: string, texto: string) {
  const post = acharPost(postId);
  if (!post) return;
  const resposta = { id: gerarId("r"), autorId: USUARIO_ID, texto, criadoEm: Date.now(), uteis: 0, util: false };
  commit({ type: "responder", postId, resposta });

  const ehDuvidaDeColega = post.tipo === "duvida" && post.autorId !== USUARIO_ID;
  if (!ehDuvidaDeColega) {
    toast({ tipo: "info", titulo: "Comentário publicado" }, 2200);
    return;
  }

  const autor = primeiroNome(pessoa(post.autorId)?.nome ?? "colega");
  premiar(15, 10, `você respondeu a dúvida de ${autor}`, post.disciplina);
  avancarMissao("d1", 1);
  agendar(7000, () => {
    if (!acharPost(postId)?.respostas.some((r) => r.id === resposta.id)) return;
    commit({ type: "respostaAjudou", postId, respostaId: resposta.id, quantidade: 3 });
    premiar(25, 25, `${autor} marcou sua resposta como útil`, post.disciplina);
  });
}

export function marcarUtil(postId: string, respostaId: string) {
  const resposta = acharPost(postId)?.respostas.find((r) => r.id === respostaId);
  if (!resposta || resposta.util) return;
  commit({ type: "marcarUtil", postId, respostaId });
  toast({ tipo: "xp", titulo: `+25 XP para ${primeiroNome(pessoa(resposta.autorId)?.nome ?? "")}`, mensagem: "você marcou a resposta como útil" });
}

export function denunciar(postId: string, motivo: MotivoDenuncia, descricao: string, evidencia: boolean) {
  const post = acharPost(postId);
  if (!post) return;
  const triagem = triarDenuncia(motivo, post.texto, descricao);
  commit({
    type: "denunciar",
    postId,
    denuncia: { motivo, descricao, evidencia, categoriaIA: triagem.categoria, prioridade: triagem.prioridade, criadoEm: Date.now() },
  });
  toast(
    { tipo: "info", titulo: "Denúncia enviada à coordenação", mensagem: `Triagem: ${triagem.categoria} · prioridade ${triagem.prioridade}` },
    4200,
  );
}

export function selecionarEspaco(espaco: EspacoId) {
  commit({ type: "selecionarEspaco", espaco });
}

/* ───────────── Missões ───────────── */

export function avancarMissao(id: string, delta: number) {
  const antes = obterEstado().missoes.find((m) => m.id === id);
  if (!antes || antes.concluida) return;
  const depois = commit({ type: "missaoProgresso", id, delta }).missoes.find((m) => m.id === id);
  if (depois?.concluida) premiar(depois.pontos, depois.xp, `missão concluída: ${depois.titulo}`, depois.disciplina);
}

export function concluirMissao(id: string) {
  const missao = obterEstado().missoes.find((m) => m.id === id);
  if (missao) avancarMissao(id, missao.alvo - missao.progresso);
}

export function registrarEstudo() {
  const s = obterEstado().sequencia;
  if (s.estudouHoje || s.quebrada) return;
  const pontos = pontosDaSequencia(s.dias + 1);
  commit({ type: "registrarEstudo" });
  commit({ type: "premiar", pontos, xp: 0 });
  toast({ tipo: "sequencia", titulo: `${s.dias + 1} dias seguidos!`, mensagem: `+${pontos} pontos. Sequência não dá XP: presença não é domínio.` });
}

export function simularAusencia() {
  const antes = obterEstado().sequencia;
  if (antes.quebrada) return;
  const depois = commit({ type: "simularAusencia" }).sequencia;
  if (!depois.quebrada) {
    toast({
      tipo: "sequencia",
      titulo: "Sua sequência está protegida",
      mensagem: `1 congelador usado — ${depois.congeladores === 1 ? "resta 1" : `restam ${depois.congeladores}`} neste mês. Seus ${depois.dias} dias continuam valendo.`,
    }, 4200);
  } else {
    toast({ tipo: "alerta", titulo: "Sequência interrompida", mensagem: "Sem congeladores. Recupere em até 48 horas por 200 pontos." }, 4200);
  }
}

export const CUSTO_RECUPERACAO = 200;

export function recuperarSequencia() {
  const estado = obterEstado();
  if (estado.usuario.pontos < CUSTO_RECUPERACAO) {
    toast({ tipo: "info", titulo: "Pontos insuficientes", mensagem: `Faltam ${CUSTO_RECUPERACAO - estado.usuario.pontos} pontos.` });
    return;
  }
  commit({ type: "recuperarSequencia", custo: CUSTO_RECUPERACAO });
  toast({ tipo: "gasto", titulo: `−${CUSTO_RECUPERACAO} pontos`, mensagem: `Sequência de ${estado.sequencia.dias} dias recuperada — nada foi perdido.` });
}

export function recomecarSequencia() {
  commit({ type: "recomecarSequencia" });
  toast({ tipo: "info", titulo: "Nova sequência iniciada", mensagem: "Registre o estudo de hoje para começar a contar." });
}

export function virarCarta() {
  commit({ type: "virarCarta" });
}

export function responderCarta(acertou: boolean) {
  const antes = obterEstado().pratica;
  if (antes.fim) return;
  const depois = commit({ type: "responderCarta", acertou }).pratica;
  if (acertou) contribuirColetiva(1, true);
  if (depois.fim) premiar(10, 15, `rodada de flashcards de Química concluída (${depois.acertos} acertos)`, "Química");
}

export function reiniciarPratica() {
  commit({ type: "reiniciarPratica" });
}

export function contribuirColetiva(quantidade: number, silencioso = false) {
  const antes = obterEstado().coletiva;
  if (antes.concluida) return;
  const depois = commit({ type: "contribuirColetiva", quantidade }).coletiva;
  if (depois.concluida) {
    premiar(Math.round(depois.pontosTotal / depois.participantes.length), depois.xp, "a Maratona da Turma foi concluída — sua parte dos 100 pontos");
    celebrar();
  } else if (!silencioso) {
    toast({ tipo: "info", titulo: `+${quantidade} flashcards para a turma`, mensagem: `${depois.progresso}/${depois.alvo} na Maratona da Turma` }, 2400);
  }
}

export function concluirDesafio(disciplina: Disciplina, acertos: number) {
  commit({ type: "concluirDesafio", disciplina, acertos });
  if (acertos > 0) premiar(acertos * 5, acertos * 10, `desafio de ${disciplina}: ${acertos}/3 acertos · domínio +${acertos * 4}%`, disciplina);
  else toast({ tipo: "info", titulo: "Desafio registrado", mensagem: "Revise o conteúdo e tente outro desafio." });
}

export function enviarRelato(categoria: string, texto: string) {
  const id = gerarId("rel");
  commit({ type: "enviarRelato", relato: { id, categoria, texto, status: "em análise", criadoEm: Date.now() } });
  toast({ tipo: "info", titulo: "Relato enviado para a coordenação", mensagem: "Status: em análise" });
  agendar(12000, () => {
    if (!obterEstado().relatos.some((r) => r.id === id)) return;
    commit({ type: "validarRelato", id });
    premiar(30, 0, "seu relato foi validado pela coordenação");
  });
}

/* ───────────── Loja ───────────── */

export function comprar(itemId: string) {
  const item = itemPorId(itemId);
  const estado = obterEstado();
  if (!item) return false;
  if (estado.compras.some((c) => c.itemId === itemId)) {
    toast({ tipo: "info", titulo: `Você já tem ${item.nome}` });
    return false;
  }
  if (estado.usuario.pontos < item.custo) {
    toast({ tipo: "info", titulo: "Saldo insuficiente", mensagem: `Faltam ${item.custo - estado.usuario.pontos} pontos.` });
    return false;
  }
  const voucher = item.slot === "voucher" ? gerarVoucher() : undefined;
  commit({ type: "comprar", compra: { id: gerarId("c"), itemId, custo: item.custo, criadoEm: Date.now(), voucher } });
  if (!voucher) commit({ type: "equipar", itemId, equipar: true });
  toast(
    {
      tipo: "gasto",
      titulo: `−${item.custo} pontos · ${item.nome}`,
      mensagem: voucher ? `Código ${voucher}: apresente na secretaria.` : "Já equipado no seu perfil. XP e ranking não mudam.",
    },
    4200,
  );
  celebrar();
  return true;
}

export function equipar(itemId: string, valor: boolean) {
  commit({ type: "equipar", itemId, equipar: valor });
  toast({ tipo: "info", titulo: valor ? "Equipado no seu perfil" : "Removido do seu perfil", mensagem: itemPorId(itemId)?.nome }, 2200);
}

/* ───────────── Perfil e preferências ───────────── */

export function ocultarRanking(valor: boolean) {
  commit({ type: "ocultarRanking", valor });
  toast({ tipo: "info", titulo: valor ? "Sua posição pública foi ocultada" : "Sua posição pública voltou a aparecer" }, 2600);
}

export function alternarLembrete(eventoId: string, titulo: string) {
  const ativo = !obterEstado().lembretes.includes(eventoId);
  commit({ type: "alternarLembrete", eventoId });
  toast({ tipo: "info", titulo: ativo ? "Lembrete ativado" : "Lembrete desativado", mensagem: titulo }, 2400);
}

export function resetarDemonstracao() {
  epoca++;
  despachar({ type: "resetar", estado: criarEstadoInicial(Date.now()) });
  toast({ tipo: "info", titulo: "Demonstração reiniciada", mensagem: "Todos os dados voltaram ao estado inicial." });
}
