/** Exportações reais feitas no navegador: planilha CSV (abre no Excel) e calendário .ics. */
import { baixarArquivo } from "./pdf";

type Celula = string | number | null | undefined;

function celulaCsv(v: Celula) {
  const s = v === null || v === undefined ? "" : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV com ";" (padrão do Excel em português) e BOM UTF-8 para os acentos abrirem certos. */
export function gerarCsv(cabecalho: string[], linhas: Celula[][]) {
  return "\uFEFF" + [cabecalho, ...linhas].map((l) => l.map(celulaCsv).join(";")).join("\r\n");
}

export function baixarCsv(nome: string, cabecalho: string[], linhas: Celula[][]) {
  const arquivo = nome.toLowerCase().endsWith(".csv") ? nome : `${nome}.csv`;
  baixarArquivo(new Blob([gerarCsv(cabecalho, linhas)], { type: "text/csv;charset=utf-8" }), arquivo);
}

export interface EventoIcs {
  id: string;
  titulo: string;
  inicio: number | Date;
  /** Padrão: 1 hora depois do início (ou o dia seguinte, se for dia inteiro). */
  fim?: number | Date;
  diaInteiro?: boolean;
  local?: string;
  descricao?: string;
  /** Minutos de antecedência do alarme (ex.: 30). */
  lembreteMin?: number;
}

const doisDig = (n: number) => String(n).padStart(2, "0");

function dataUtc(d: Date) {
  return `${d.getUTCFullYear()}${doisDig(d.getUTCMonth() + 1)}${doisDig(d.getUTCDate())}T${doisDig(d.getUTCHours())}${doisDig(d.getUTCMinutes())}${doisDig(d.getUTCSeconds())}Z`;
}

function dataLocal(d: Date) {
  return `${d.getFullYear()}${doisDig(d.getMonth() + 1)}${doisDig(d.getDate())}`;
}

function textoIcs(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Linhas de no máximo 75 caracteres, como pede a RFC 5545. */
function dobrar(linha: string) {
  const partes: string[] = [];
  for (let i = 0; i < linha.length; i += 74) partes.push((i ? " " : "") + linha.slice(i, i + 74));
  return partes.join("\r\n");
}

export function gerarIcs(eventos: EventoIcs[], nomeCalendario = "Portal do Aluno") {
  const agora = dataUtc(new Date());
  const linhas = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Portal do Aluno CEPI//PT-BR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${textoIcs(nomeCalendario)}`];
  for (const e of eventos) {
    const ini = new Date(e.inicio);
    linhas.push("BEGIN:VEVENT", `UID:${e.id}@portal-do-aluno.cepi`, `DTSTAMP:${agora}`);
    if (e.diaInteiro) {
      const fim = e.fim ? new Date(e.fim) : new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() + 1);
      linhas.push(`DTSTART;VALUE=DATE:${dataLocal(ini)}`, `DTEND;VALUE=DATE:${dataLocal(fim)}`);
    } else {
      const fim = e.fim ? new Date(e.fim) : new Date(ini.getTime() + 60 * 60 * 1000);
      linhas.push(`DTSTART:${dataUtc(ini)}`, `DTEND:${dataUtc(fim)}`);
    }
    linhas.push(`SUMMARY:${textoIcs(e.titulo)}`);
    if (e.local) linhas.push(`LOCATION:${textoIcs(e.local)}`);
    if (e.descricao) linhas.push(`DESCRIPTION:${textoIcs(e.descricao)}`);
    if (e.lembreteMin) linhas.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${textoIcs(e.titulo)}`, `TRIGGER:-PT${Math.round(e.lembreteMin)}M`, "END:VALARM");
    linhas.push("END:VEVENT");
  }
  linhas.push("END:VCALENDAR");
  return linhas.map(dobrar).join("\r\n") + "\r\n";
}

export function baixarIcs(nome: string, eventos: EventoIcs[], nomeCalendario?: string) {
  const arquivo = nome.toLowerCase().endsWith(".ics") ? nome : `${nome}.ics`;
  baixarArquivo(new Blob([gerarIcs(eventos, nomeCalendario)], { type: "text/calendar;charset=utf-8" }), arquivo);
}
