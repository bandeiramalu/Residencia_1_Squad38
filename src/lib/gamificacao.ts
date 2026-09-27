import { DISCIPLINAS, type Disciplina } from "@/data/escola";
import { MEDALHAS, type MedalhaDef } from "@/data/medalhas";
import { ALUNOS_RANKING, LIGA_DO_USUARIO, USUARIO_RANKING, ZONA, type LigaId } from "@/data/ranking";
import { USUARIO_INICIAL } from "@/data/usuario";
import type { AppState, Usuario } from "@/store/types";

/* ───────────── Níveis (XP é permanente e define o nível) ───────────── */

export const NIVEIS = [
  { n: 1, titulo: "Novato", min: 0 },
  { n: 2, titulo: "Aprendiz", min: 200 },
  { n: 3, titulo: "Estudante", min: 500 },
  { n: 4, titulo: "Destaque", min: 1000 },
  { n: 5, titulo: "Mestre", min: 2000 },
  { n: 6, titulo: "Lenda", min: 3500 },
];

export function nivelDe(xp: number) {
  let atual = NIVEIS[0];
  for (const nivel of NIVEIS) if (xp >= nivel.min) atual = nivel;
  const proximo = NIVEIS.find((nivel) => nivel.min > xp);
  const pct = proximo ? ((xp - atual.min) / (proximo.min - atual.min)) * 100 : 100;
  return { ...atual, proximo, falta: proximo ? proximo.min - xp : 0, pct };
}

/* ───────────── Ranking ───────────── */

export type Escopo = "liga" | "turma" | "disciplina";
export type Tendencia = "sobe" | "desce" | "manteve";

export interface LinhaRanking {
  id: string;
  nome: string;
  turma: string;
  xp: number;
  posicao: number;
  variacao: number;
  tendencia: Tendencia;
  eu: boolean;
  zona?: "promocao" | "rebaixamento";
}

interface Participante {
  id: string;
  nome: string;
  turma: string;
  xp: number;
  xpBase: number;
  variacaoBase: number;
  eu: boolean;
}

function ordenar<T extends { xp: number; eu: boolean }>(lista: T[], chave: (t: T) => number) {
  // Em empate, o colega que chegou antes fica na frente.
  return [...lista].sort((a, b) => chave(b) - chave(a) || Number(a.eu) - Number(b.eu));
}

export function montarRanking(
  usuario: Usuario,
  escopo: Escopo,
  liga: LigaId,
  disciplina: Disciplina,
): LinhaRanking[] {
  const xpDe = (disc: Partial<Record<Disciplina, number>>) => disc[disciplina] ?? 0;
  const eu: Participante = {
    id: usuario.id,
    nome: usuario.nome,
    turma: usuario.turma,
    xp: escopo === "disciplina" ? xpDe(usuario.xpSemanaDisc) : usuario.xpSemana,
    xpBase: escopo === "disciplina" ? xpDe(USUARIO_INICIAL.xpSemanaDisc) : USUARIO_INICIAL.xpSemana,
    variacaoBase: USUARIO_RANKING.variacaoBase,
    eu: true,
  };

  const filtro =
    escopo === "turma"
      ? (a: (typeof ALUNOS_RANKING)[number]) => a.turma === usuario.turma
      : escopo === "liga"
        ? (a: (typeof ALUNOS_RANKING)[number]) => a.liga === liga
        : (a: (typeof ALUNOS_RANKING)[number]) => a.liga === LIGA_DO_USUARIO;

  const participantes: Participante[] = ALUNOS_RANKING.filter(filtro).map((a) => {
    const xp = escopo === "disciplina" ? a.xpDisc[disciplina] : a.xpSemana;
    return { id: a.id, nome: a.nome, turma: a.turma, xp, xpBase: xp, variacaoBase: a.variacaoBase, eu: false };
  });

  const incluiUsuario = escopo !== "liga" || liga === LIGA_DO_USUARIO;
  if (incluiUsuario) participantes.push(eu);

  const base = ordenar(participantes, (p) => p.xpBase).map((p) => p.id);
  const atual = ordenar(participantes, (p) => p.xp);

  return atual.map((p, i) => {
    const variacao = p.variacaoBase + (base.indexOf(p.id) - i);
    const linha: LinhaRanking = {
      id: p.id,
      nome: p.nome,
      turma: p.turma,
      xp: p.xp,
      posicao: i + 1,
      variacao,
      tendencia: variacao > 0 ? "sobe" : variacao < 0 ? "desce" : "manteve",
      eu: p.eu,
    };
    if (escopo === "liga") {
      if (i < ZONA && liga !== "diamante") linha.zona = "promocao";
      else if (i >= atual.length - ZONA && liga !== "bronze") linha.zona = "rebaixamento";
    }
    return linha;
  });
}

export function posicaoNaLiga(usuario: Usuario) {
  const lista = montarRanking(usuario, "liga", LIGA_DO_USUARIO, DISCIPLINAS[0]);
  return lista.find((l) => l.eu)?.posicao ?? 0;
}

/* ───────────── Medalhas ───────────── */

export function progressoMedalha(def: MedalhaDef, estado: AppState) {
  const u = estado.usuario;
  const valores: Record<string, number> = {
    colaborador: u.respostasUteis,
    "mestre-quimica": 20,
    constante: estado.sequencia.dias,
    "sem-congelador": estado.sequencia.diasSemCongelador,
    mentor: u.respostasUteis,
    polimata: DISCIPLINAS.filter((d) => u.dominio[d] >= 70).length,
    "voz-da-escola": u.relatosValidados,
    "topo-da-liga": posicaoNaLiga(u) === 1 ? 1 : 0,
  };
  const atual = Math.min(def.meta, valores[def.id] ?? 0);
  const pct = (atual / def.meta) * 100;
  const texto = def.id === "topo-da-liga" ? `${posicaoNaLiga(u)}º lugar na liga` : `${atual}/${def.meta}`;
  return { atual, pct, texto, completa: atual >= def.meta };
}

/** Medalhas que acabaram de cumprir o critério e ainda não foram registradas. */
export function medalhasConquistadas(estado: AppState) {
  const jaTem = new Set(estado.medalhas.filter((m) => m.desbloqueadaEm).map((m) => m.id));
  return MEDALHAS.filter((def) => !jaTem.has(def.id) && progressoMedalha(def, estado).completa);
}
