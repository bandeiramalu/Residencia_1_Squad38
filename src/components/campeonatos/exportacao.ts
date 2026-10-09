import { ESCOLA } from "@/data/escola";
import { nomeDaRodada, ROTULO_FORMATO, ROTULO_METRICA } from "@/data/campeonatos";
import { baixarCsv } from "@/lib/exportar";
import { classificacao, nomeParticipante, totalRodadas, type NivelDe } from "@/lib/campeonatos";
import { baixarArquivo, gerarPdfDocumento, type Bloco } from "@/lib/pdf";
import type { Campeonato, Pessoa } from "@/store/types";

export type PapelCertificado = "campeao" | "vice" | "participante";

const ROTULO_PAPEL: Record<PapelCertificado, string> = {
  campeao: "Certificado de campeão",
  vice: "Certificado de vice-campeão",
  participante: "Certificado de participação",
};

function slug(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Campeão e vice: no mata-mata, o vencedor e o derrotado da final; nos demais, 1º e 2º da tabela
 * (empate desempata por maior XP via `nivelDe`). Campeonato encerrado sem campeão (ninguém pontuou) não tem pódio.
 */
export function podio(c: Campeonato, nivelDe?: NivelDe): { campeao?: string; vice?: string } {
  if (c.formato === "mata-mata") {
    const final = c.partidas.find((p) => p.rodada === totalRodadas(c) - 1);
    const campeao = c.campeao ?? final?.vencedor;
    const vice = final && final.vencedor ? (final.a === final.vencedor ? final.b : final.a) : null;
    return { campeao, vice: vice ?? undefined };
  }
  if (c.status === "encerrado" && !c.campeao) return {};
  const tabela = classificacao(c, nivelDe);
  const campeao = c.campeao ?? tabela[0]?.id;
  return { campeao, vice: tabela.find((l) => l.id !== campeao)?.id };
}

/** Papel de um participante no resultado final (null = não participou). */
export function papelNoResultado(c: Campeonato, id: string, nivelDe?: NivelDe): PapelCertificado | null {
  if (!c.participantes.includes(id)) return null;
  const { campeao, vice } = podio(c, nivelDe);
  if (id === campeao) return "campeao";
  if (id === vice) return "vice";
  return "participante";
}

function desfecho(c: Campeonato, id: string, nivelDe?: NivelDe) {
  if (c.formato === "mata-mata") {
    const total = totalRodadas(c);
    const ultima = [...c.partidas].reverse().find((p) => p.status === "encerrada" && (p.a === id || p.b === id));
    if (!ultima) return "Participou do campeonato.";
    return ultima.vencedor === id ? "Avançou até o fim da chave." : `Eliminação na fase: ${nomeDaRodada(ultima.rodada, total)}.`;
  }
  const linha = classificacao(c, nivelDe).find((l) => l.id === id);
  return linha ? `${linha.posicao}º lugar de ${c.participantes.length}, com ${linha.pontos.toLocaleString("pt-BR")} ${ROTULO_METRICA[c.metrica].unidade}.` : "Participou do campeonato.";
}

const dataLonga = (ms: number) => new Date(ms).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

function baseCertificado(c: Campeonato, papel: PapelCertificado, nomes: string[], emitidoPor: string): Bloco[] {
  const unidade = c.formato === "interclasses" ? "turma" : "participante";
  const conquista =
    papel === "campeao"
      ? `conquistou o 1º lugar em “${c.nome}”`
      : papel === "vice"
        ? `conquistou o 2º lugar em “${c.nome}”`
        : `participou de “${c.nome}”`;
  return [
    { tipo: "paragrafo", texto: `Certificamos que ${nomes.length === 1 ? `${unidade === "turma" ? "a turma" : "a pessoa"} ${nomes[0]}` : `os participantes listados abaixo`} ${conquista}, campeonato ${c.oficial ? "oficial" : "entre colegas"} de ${ROTULO_FORMATO[c.formato].toLowerCase()}${c.disciplina ? ` (${c.disciplina})` : ""}, disputado entre ${dataLonga(c.inicio)} e ${dataLonga(Math.min(c.fim, Date.now()))}.` },
    ...(nomes.length > 1 ? [{ tipo: "marcadores", itens: nomes } as Bloco] : []),
    { tipo: "quadro", titulo: "Regra de pontuação", texto: `${ROTULO_METRICA[c.metrica].nome}: ${ROTULO_METRICA[c.metrica].descricao}` },
    { tipo: "paragrafo", texto: `Emitido em ${dataLonga(Date.now())} por ${emitidoPor}.` },
  ];
}

/** Certificado em PDF. `ids` = quem recebe (campeão/vice: 1 pessoa; participação: todos os participantes ou só a aluna). */
export function baixarCertificado(c: Campeonato, papel: PapelCertificado, ids: string[], pessoas: Record<string, Pessoa>, emitidoPor: string, nivelDe?: NivelDe) {
  const nomes = ids.map((id) => nomeParticipante(id, pessoas));
  const blocos = baseCertificado(c, papel, nomes, emitidoPor);
  if (ids.length === 1) blocos.splice(1, 0, { tipo: "quadro", titulo: "Resultado", texto: desfecho(c, ids[0], nivelDe) });
  const { blob } = gerarPdfDocumento({ escola: ESCOLA.nome, titulo: ROTULO_PAPEL[papel], subtitulo: c.nome, blocos });
  baixarArquivo(blob, `${slug(ROTULO_PAPEL[papel])}-${slug(c.nome)}${ids.length === 1 ? `-${slug(nomes[0])}` : ""}.pdf`);
}

/** Tabela final em CSV (abre no Excel). */
export function exportarTabelaCsv(c: Campeonato, pessoas: Record<string, Pessoa>, nivelDe?: NivelDe) {
  const nome = (id: string | null) => nomeParticipante(id, pessoas);
  if (c.formato === "mata-mata") {
    const total = totalRodadas(c);
    baixarCsv(
      `tabela-${slug(c.nome)}`,
      ["Fase", "Confronto", "Participante A", "Participante B", "Acertos A", "Acertos B", "Tempo A (s)", "Tempo B (s)", "Vencedor", "Critério"],
      c.partidas.map((p) => [
        nomeDaRodada(p.rodada, total),
        p.id,
        nome(p.a),
        nome(p.b),
        p.placarA ?? "",
        p.placarB ?? "",
        p.tempoA !== undefined ? (p.tempoA / 1000).toFixed(1) : "",
        p.tempoB !== undefined ? (p.tempoB / 1000).toFixed(1) : "",
        p.vencedor ? nome(p.vencedor) : "",
        p.status !== "encerrada" ? "Pendente" : p.criterio === "desempenho" ? "Desempenho (XP/domínio)" : "Duelo",
      ]),
    );
    return;
  }
  baixarCsv(
    `tabela-${slug(c.nome)}`,
    ["Posição", c.formato === "interclasses" ? "Turma" : "Participante", `Pontuação (${ROTULO_METRICA[c.metrica].unidade})`],
    classificacao(c, nivelDe).map((l) => [l.posicao, nome(l.id), l.pontos]),
  );
}
