/**
 * Visão do professor sobre as turmas: junta os dados gerados (`data/turmas.ts`)
 * com o que muda ao vivo na demo — a aluna Ana (estado real) e os bônus dados.
 * Para o professor, "minutos da semana" é a janela móvel dos últimos 7 dias
 * (não zera na segunda-feira, então o alerta de risco é estável).
 */
import { alunosDaTurma, type AlunoTurma } from "@/data/turmas";
import { TURMAS_DO_PROFESSOR } from "@/data/professor";
import { ganhosPorDia } from "@/components/estatisticas/calculos";
import type { AppState, Atividade, Atribuicao, Post, SessaoEstudo } from "@/store/types";
import { minutosPorDia } from "./estudos";

export type Risco = "alto" | "medio" | "baixo";

export interface AlunoPainel extends AlunoTurma {
  bonusPontos: number;
  bonusXp: number;
  /** É a aluna da demonstração (dados ao vivo). */
  aoVivo: boolean;
  risco: Risco;
  dominioMedio: number;
  /** Atividades desta turma ainda não entregues pelo aluno. */
  pendentes: number;
  /** Só na aluna ao vivo: sessões reais de estudo (para recortes por disciplina e períodos longos). */
  sessoes?: SessaoEstudo[];
  /** Só na aluna ao vivo: XP ganho por dia nos últimos 90 dias (do mais antigo até hoje). */
  xpDiario90?: number[];
}

const DIA_MIN = 24 * 60;

function risco(a: AlunoTurma): Risco {
  if (a.ultimoAcessoHa > 3 * DIA_MIN || a.minutosSemana < 45) return "alto";
  if (a.minutosSemana < 150 || a.entregasNoPrazo < 60) return "medio";
  return "baixo";
}

export function alunosDoPainel(estado: AppState, turma: string, agora: number): AlunoPainel[] {
  const pendentesPorAluno = new Map<string, number>();
  for (const at of estado.atividades) {
    if (at.turma !== turma) continue;
    for (const e of at.entregas) if (e.status === "pendente") pendentesPorAluno.set(e.alunoId, (pendentesPorAluno.get(e.alunoId) ?? 0) + 1);
  }

  return alunosDaTurma(turma).map((base) => {
    const bonus = estado.bonus[base.id] ?? { pontos: 0, xp: 0 };
    // Nome e iniciais atuais vêm do cadastro no store (a pessoa pode ter editado o perfil).
    const cadastro = estado.pessoas[base.id];
    let a: AlunoTurma = {
      ...base,
      nome: cadastro?.nome ?? base.nome,
      iniciais: cadastro?.iniciais ?? base.iniciais,
      xp: base.xp + bonus.xp,
      xpSemana: base.xpSemana + bonus.xp,
      pontos: base.pontos + bonus.pontos,
    };
    const aoVivo = base.id === estado.usuario.id;
    if (aoVivo) {
      const u = estado.usuario;
      const minutos7d = minutosPorDia(estado.estudos.sessoes, 7, agora).map((d) => d.minutos);
      a = {
        ...a,
        xp: u.xp,
        xpSemana: u.xpSemana,
        pontos: u.pontos,
        minutosSemana: minutos7d.reduce((s, m) => s + m, 0),
        minutos7d,
        sequencia: estado.sequencia.dias,
        dominio: u.dominio,
        ultimoAcessoHa: 0,
      };
    }
    const valores = Object.values(a.dominio);
    return {
      ...a,
      bonusPontos: bonus.pontos,
      bonusXp: bonus.xp,
      aoVivo,
      risco: aoVivo ? "baixo" : risco(a),
      dominioMedio: Math.round(valores.reduce((s, v) => s + v, 0) / valores.length),
      pendentes: pendentesPorAluno.get(a.id) ?? 0,
      ...(aoVivo ? { sessoes: estado.estudos.sessoes, xpDiario90: ganhosPorDia(estado, 90, agora).map((g) => g.xp) } : {}),
    };
  });
}

export interface ResumoTurma {
  total: number;
  ativosHoje: number;
  mediaMinutosSemana: number;
  mediaDominio: number;
  /** Estudo por aluno: média de minutos dos últimos 7 dias (mesmo valor de `mediaMinutosSemana`, nome do Painel). */
  minutosMedios: number;
  /** Domínio médio da turma, de 0 a 100 (mesmo valor de `mediaDominio`, nome do Painel). */
  dominioMedio: number;
  emRisco: number;
  xpSemanaTotal: number;
  /** Minutos somados da turma por dia (últimos 7 dias). */
  minutos7d: number[];
}

export function resumoDaTurma(alunos: AlunoPainel[]): ResumoTurma {
  const total = alunos.length || 1;
  const minutosMedios = Math.round(alunos.reduce((s, a) => s + a.minutosSemana, 0) / total);
  const dominioMedio = Math.round(alunos.reduce((s, a) => s + a.dominioMedio, 0) / total);
  return {
    total: alunos.length,
    ativosHoje: alunos.filter((a) => a.ultimoAcessoHa < DIA_MIN).length,
    mediaMinutosSemana: minutosMedios,
    mediaDominio: dominioMedio,
    minutosMedios,
    dominioMedio,
    emRisco: alunos.filter((a) => a.risco === "alto").length,
    xpSemanaTotal: alunos.reduce((s, a) => s + a.xpSemana, 0),
    minutos7d: Array.from({ length: 7 }, (_, d) => alunos.reduce((s, a) => s + (a.minutos7d[d] ?? 0), 0)),
  };
}

/** Atividade da turma com entregas aguardando nota. */
export interface AtividadeParaCorrigir {
  atividade: Atividade;
  /** Entregas com status "entregue" (ainda sem nota). */
  quantidade: number;
}

/**
 * Atividades do professor, na turma, com pelo menos uma entrega aguardando nota
 * (mais entregas primeiro; empate: prazo mais próximo). Atividades de outros professores não entram.
 */
export function atividadesParaCorrigir(estado: AppState, professorId: string, turma: string): AtividadeParaCorrigir[] {
  return estado.atividades
    .filter((a) => a.professorId === professorId && a.turma === turma)
    .map((atividade) => ({ atividade, quantidade: atividade.entregas.filter((e) => e.status === "entregue").length }))
    .filter((x) => x.quantidade > 0)
    .sort((x, y) => y.quantidade - x.quantidade || x.atividade.prazo - y.atividade.prazo);
}

/** Os `n` alunos com mais XP na semana (só quem pontuou; empate: ordem alfabética). */
export function destaquesDaSemana(alunos: AlunoPainel[], n = 3): AlunoPainel[] {
  return alunos
    .filter((a) => a.xpSemana > 0)
    .sort((a, b) => b.xpSemana - a.xpSemana || a.nome.localeCompare(b.nome, "pt-BR"))
    .slice(0, n);
}

/** Últimos pontos/XP dados pelo professor (a lista do estado já vem da mais nova para a mais antiga). */
export function atribuicoesRecentes(estado: AppState, professorId: string, n = 5): Atribuicao[] {
  return estado.atribuicoes.filter((a) => a.professorId === professorId).slice(0, n);
}

/** "há 5 min" · "há 3 h" · "há 4 dias" a partir de minutos. */
export function ultimoAcesso(minutos: number) {
  if (minutos < 2) return "online agora";
  if (minutos < 60) return `há ${minutos} min`;
  if (minutos < DIA_MIN) return `há ${Math.floor(minutos / 60)} h`;
  const dias = Math.floor(minutos / DIA_MIN);
  return dias === 1 ? "ontem" : `há ${dias} dias`;
}

/** Dúvidas do feed vindas das turmas do professor (qualquer disciplina; filtre depois). */
export function duvidasDasTurmas(estado: AppState): Post[] {
  const turmas = new Set<string>(TURMAS_DO_PROFESSOR);
  return estado.posts
    .filter((p) => {
      if (p.tipo !== "duvida") return false;
      const autor = estado.pessoas[p.autorId];
      if (autor?.papel === "professor") return false;
      return p.espaco === "escola" || (!!autor?.turma && turmas.has(autor.turma));
    })
    .sort((a, b) => b.criadoEm - a.criadoEm);
}

export function duvidaRespondida(p: Post) {
  return p.respostas.some((r) => r.oficial);
}

/** Quantas dúvidas da disciplina do professor ainda esperam a resposta oficial. */
export function duvidasPendentes(estado: AppState, disciplina?: string) {
  return duvidasDasTurmas(estado).filter((p) => !duvidaRespondida(p) && (!disciplina || !p.disciplina || p.disciplina === disciplina)).length;
}

/** Relatos à coordenação aguardando validação. */
export function relatosPendentes(estado: AppState) {
  return estado.relatos.filter((r) => r.status === "em análise");
}

/** Trocas com voucher ainda não entregues. */
export function trocasPendentes(estado: AppState) {
  return estado.compras.filter((c) => c.voucher && !c.entregueEm);
}
