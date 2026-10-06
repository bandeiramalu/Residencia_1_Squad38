/** Relatórios reais do professor: boletim do aluno, relatório e planilha da turma (PDF e CSV no navegador). */
import { ESCOLA, DISCIPLINAS } from "@/data/escola";
import { MEDALHAS } from "@/data/medalhas";
import { baixarCsv } from "@/lib/exportar";
import { fmt } from "@/lib/format";
import { formatarMinutos } from "@/lib/estudos";
import { baixarArquivo, gerarPdfDocumento, type Bloco } from "@/lib/pdf";
import { dataCurta } from "@/lib/tempo";
import { ultimoAcesso, type AlunoPainel } from "@/lib/turmas";
import type { AppState } from "@/store/types";
import { toast } from "@/store/ui";

const nota = (n: number) => n.toFixed(1).replace(".", ",");
const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

const NOME_RISCO = { alto: "Risco alto", medio: "Atenção", baixo: "Em dia" } as const;

function entregasDoAluno(estado: AppState, a: AlunoPainel) {
  return estado.atividades
    .filter((at) => at.turma === a.turma)
    .map((at) => ({ at, e: at.entregas.find((x) => x.alunoId === a.id) }))
    .filter((x): x is { at: AppState["atividades"][number]; e: NonNullable<typeof x.e> } => !!x.e)
    .sort((x, y) => x.at.prazo - y.at.prazo);
}

/** Boletim em PDF: notas, médias por disciplina, entregas, foco, medalhas e observações. */
export function baixarBoletim(estado: AppState, a: AlunoPainel) {
  const linhas = entregasDoAluno(estado, a);
  const corrigidas = linhas.filter((l) => l.e.status === "corrigida" && l.e.nota !== undefined);
  const entregues = linhas.filter((l) => l.e.status !== "pendente").length;
  const mediaGeral = corrigidas.length ? corrigidas.reduce((s, l) => s + (l.e.nota ?? 0), 0) / corrigidas.length : null;

  const porDisc = DISCIPLINAS.map((d) => {
    const notas = corrigidas.filter((l) => l.at.disciplina === d).map((l) => l.e.nota ?? 0);
    return { d, media: notas.length ? notas.reduce((s, n) => s + n, 0) / notas.length : null, qtd: notas.length };
  });

  const medalhas = a.aoVivo ? MEDALHAS.filter((m) => estado.medalhas.some((x) => x.id === m.id)) : [];
  const ordenadas = [...DISCIPLINAS].sort((x, y) => a.dominio[y] - a.dominio[x]);
  const bonus = estado.atribuicoes.filter((x) => x.alunoId === a.id).slice(0, 8);

  const observacoes = [
    `Mais forte em ${ordenadas[0]} (${a.dominio[ordenadas[0]]}% de domínio); precisa de apoio em ${ordenadas[ordenadas.length - 1]} (${a.dominio[ordenadas[ordenadas.length - 1]]}%).`,
    `Situação de engajamento: ${NOME_RISCO[a.risco]}. Último acesso: ${ultimoAcesso(a.ultimoAcessoHa)}.`,
    a.pendentes > 0 ? `${a.pendentes} ${a.pendentes === 1 ? "atividade pendente" : "atividades pendentes"} de entrega.` : "Nenhuma atividade pendente.",
    ...bonus.map((b) => {
      const ganho = [b.pontos > 0 && `+${b.pontos} pontos`, b.xp > 0 && `+${b.xp} XP`].filter(Boolean).join(", ");
      return `${dataCurta(b.criadoEm)}: ${b.motivo}${ganho ? ` (${ganho})` : ""}.`;
    }),
  ];

  const blocos: Bloco[] = [
    { tipo: "secao", texto: "Resumo" },
    {
      tipo: "tabela",
      colunas: ["Indicador", "Valor"],
      linhas: [
        ["Turma", a.turma],
        ["Média geral das atividades corrigidas", mediaGeral === null ? "sem notas ainda" : nota(mediaGeral)],
        ["Entregas realizadas", `${entregues} de ${linhas.length}`],
        ["Entregas no prazo", `${a.entregasNoPrazo}%`],
        ["Estudo na semana", formatarMinutos(a.minutosSemana)],
        ["Sequência de estudo", `${a.sequencia} ${a.sequencia === 1 ? "dia" : "dias"}`],
        ["XP total / pontos", `${fmt(a.xp)} XP / ${fmt(a.pontos)} pontos`],
        ["Domínio médio", `${a.dominioMedio}%`],
      ],
      larguras: [0.6, 0.4],
    },
    { tipo: "secao", texto: "Médias por disciplina" },
    {
      tipo: "tabela",
      colunas: ["Disciplina", "Média das notas", "Atividades corrigidas", "Domínio"],
      linhas: porDisc.map((p) => [p.d, p.media === null ? "-" : nota(p.media), String(p.qtd), `${a.dominio[p.d]}%`]),
    },
    { tipo: "secao", texto: "Notas e entregas" },
    linhas.length
      ? {
          tipo: "tabela",
          colunas: ["Atividade", "Disciplina", "Prazo", "Situação", "Nota"],
          linhas: linhas.map(({ at, e }) => [
            at.titulo,
            at.disciplina,
            dataCurta(at.prazo),
            e.status === "corrigida" ? "Corrigida" : e.status === "entregue" ? "Entregue" : "Pendente",
            e.status === "corrigida" && e.nota !== undefined ? nota(e.nota) : "-",
          ]),
          larguras: [0.38, 0.17, 0.15, 0.17, 0.13],
        }
      : { tipo: "paragrafo", texto: "Nenhuma atividade publicada para a turma." },
    { tipo: "secao", texto: "Medalhas" },
    medalhas.length
      ? { tipo: "marcadores", itens: medalhas.map((m) => `${m.nome}: ${m.criterio}`) }
      : { tipo: "paragrafo", texto: "Nenhuma medalha conquistada até agora." },
    { tipo: "secao", texto: "Observações" },
    { tipo: "marcadores", itens: observacoes },
  ];

  const { blob } = gerarPdfDocumento({ escola: ESCOLA.nome, titulo: `Boletim de ${a.nome}`, subtitulo: `${a.turma} · emitido em ${dataCurta(Date.now())}`, blocos });
  baixarArquivo(blob, `boletim-${slug(a.nome)}.pdf`);
  toast({ tipo: "info", titulo: "Boletim gerado", mensagem: `boletim-${slug(a.nome)}.pdf` }, 2600);
}

function mediaNotas(estado: AppState, a: AlunoPainel) {
  const notas = entregasDoAluno(estado, a)
    .filter((l) => l.e.status === "corrigida" && l.e.nota !== undefined)
    .map((l) => l.e.nota ?? 0);
  return notas.length ? notas.reduce((s, n) => s + n, 0) / notas.length : null;
}

/** Relatório da turma em PDF. */
export function baixarRelatorioTurma(estado: AppState, turma: string, alunos: AlunoPainel[]) {
  const total = alunos.length || 1;
  const emRisco = alunos.filter((a) => a.risco === "alto");
  const atividades = estado.atividades.filter((at) => at.turma === turma);
  const aguardando = atividades.reduce((s, at) => s + at.entregas.filter((e) => e.status === "entregue").length, 0);
  const medias = alunos.map((a) => mediaNotas(estado, a)).filter((m): m is number => m !== null);

  const blocos: Bloco[] = [
    { tipo: "secao", texto: "Resumo da turma" },
    {
      tipo: "tabela",
      colunas: ["Indicador", "Valor"],
      linhas: [
        ["Alunos", String(alunos.length)],
        ["Em risco", String(emRisco.length)],
        ["Estudo médio por semana", formatarMinutos(Math.round(alunos.reduce((s, a) => s + a.minutosSemana, 0) / total))],
        ["Domínio médio", `${Math.round(alunos.reduce((s, a) => s + a.dominioMedio, 0) / total)}%`],
        ["Entregas no prazo (média)", `${Math.round(alunos.reduce((s, a) => s + a.entregasNoPrazo, 0) / total)}%`],
        ["Média das notas corrigidas", medias.length ? nota(medias.reduce((s, m) => s + m, 0) / medias.length) : "sem notas ainda"],
        ["Entregas aguardando correção", String(aguardando)],
      ],
      larguras: [0.6, 0.4],
    },
    { tipo: "secao", texto: "Alunos" },
    {
      tipo: "tabela",
      colunas: ["Aluno", "XP sem.", "Estudo", "Seq.", "Domínio", "Pend.", "Situação"],
      linhas: [...alunos]
        .sort((x, y) => x.nome.localeCompare(y.nome, "pt-BR"))
        .map((a) => [a.nome, fmt(a.xpSemana), formatarMinutos(a.minutosSemana), String(a.sequencia), `${a.dominioMedio}%`, String(a.pendentes), NOME_RISCO[a.risco]]),
      larguras: [0.32, 0.1, 0.12, 0.08, 0.12, 0.08, 0.18],
    },
    { tipo: "secao", texto: "Precisa de atenção" },
    emRisco.length
      ? { tipo: "marcadores", itens: emRisco.map((a) => `${a.nome}: ${ultimoAcesso(a.ultimoAcessoHa)}, ${formatarMinutos(a.minutosSemana)} de estudo na semana.`) }
      : { tipo: "paragrafo", texto: "Ninguém em risco alto nesta turma." },
    { tipo: "secao", texto: "Atividades" },
    atividades.length
      ? {
          tipo: "tabela",
          colunas: ["Atividade", "Disciplina", "Prazo", "Entregas", "Corrigidas"],
          linhas: atividades.map((at) => [
            at.titulo,
            at.disciplina,
            dataCurta(at.prazo),
            `${at.entregas.filter((e) => e.status !== "pendente").length}/${at.entregas.length}`,
            String(at.entregas.filter((e) => e.status === "corrigida").length),
          ]),
          larguras: [0.38, 0.17, 0.15, 0.15, 0.15],
        }
      : { tipo: "paragrafo", texto: "Nenhuma atividade publicada para a turma." },
  ];

  const { blob } = gerarPdfDocumento({ escola: ESCOLA.nome, titulo: `Relatório da turma ${turma}`, subtitulo: `Emitido em ${dataCurta(Date.now())}`, blocos });
  baixarArquivo(blob, `relatorio-${slug(turma)}.pdf`);
  toast({ tipo: "info", titulo: "Relatório gerado", mensagem: `relatorio-${slug(turma)}.pdf` }, 2600);
}

/** Planilha da turma (CSV que abre no Excel). */
export function baixarCsvTurma(estado: AppState, turma: string, alunos: AlunoPainel[]) {
  baixarCsv(
    `turma-${slug(turma)}`,
    ["Aluno", "Turma", "XP total", "XP na semana", "Pontos", "Minutos na semana", "Sequência (dias)", "Domínio médio (%)", "Entregas no prazo (%)", "Pendentes", "Média das notas", "Situação", "Último acesso", ...DISCIPLINAS.map((d) => `Domínio ${d} (%)`)],
    [...alunos]
      .sort((x, y) => x.nome.localeCompare(y.nome, "pt-BR"))
      .map((a) => {
        const m = mediaNotas(estado, a);
        return [a.nome, a.turma, a.xp, a.xpSemana, a.pontos, a.minutosSemana, a.sequencia, a.dominioMedio, a.entregasNoPrazo, a.pendentes, m === null ? "" : nota(m), NOME_RISCO[a.risco], ultimoAcesso(a.ultimoAcessoHa), ...DISCIPLINAS.map((d) => a.dominio[d])];
      }),
  );
  toast({ tipo: "info", titulo: "Planilha exportada", mensagem: `turma-${slug(turma)}.csv` }, 2600);
}

/* ───────────── Estatísticas (recorte atual) ───────────── */

export interface SecaoExport {
  titulo: string;
  colunas: string[];
  linhas: string[][];
}

/** PDF com as tabelas dos números do recorte atual das Estatísticas. */
export function baixarEstatisticasPdf(recorte: string, secoes: SecaoExport[]) {
  const blocos: Bloco[] = secoes.flatMap((s): Bloco[] => [
    { tipo: "secao", texto: s.titulo },
    s.linhas.length ? { tipo: "tabela", colunas: s.colunas, linhas: s.linhas } : { tipo: "paragrafo", texto: "Sem dados neste recorte." },
  ]);
  const { blob } = gerarPdfDocumento({ escola: ESCOLA.nome, titulo: "Estatísticas da turma", subtitulo: `${recorte} · emitido em ${dataCurta(Date.now())}`, blocos });
  baixarArquivo(blob, "estatisticas.pdf");
  toast({ tipo: "info", titulo: "PDF gerado", mensagem: "estatisticas.pdf" }, 2600);
}

/** CSV único (seção; colunas…) com os mesmos números do PDF. */
export function baixarEstatisticasCsv(recorte: string, secoes: SecaoExport[]) {
  const largura = Math.max(1, ...secoes.map((s) => s.colunas.length));
  const preencher = (l: string[]) => [...l, ...Array<string>(largura - l.length).fill("")];
  const linhas: string[][] = [["Recorte", recorte, ...Array<string>(largura - 1).fill("")]];
  for (const s of secoes) {
    linhas.push(Array<string>(largura + 1).fill(""));
    linhas.push([s.titulo, ...preencher(s.colunas)]);
    for (const l of s.linhas) linhas.push(["", ...preencher(l)]);
  }
  baixarCsv("estatisticas", ["Seção", ...Array.from({ length: largura }, (_, i) => `Coluna ${i + 1}`)], linhas);
  toast({ tipo: "info", titulo: "Dados exportados", mensagem: "estatisticas.csv" }, 2600);
}
