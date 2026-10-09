/** Exportações reais feitas no navegador: planilha CSV (abre no Excel) e calendário .ics. */
import { baixarArquivo } from "./pdf";

type Celula = string | number | null | undefined;

/** Número puro ("-5", "+3,5") ou só um sinal ("-" como "sem valor"): não é fórmula, então não precisa de neutralização. */
const NUMERO_PURO = /^(?:[+-]|[+-]?\d+(?:[.,]\d+)?)$/;

/**
 * Texto que o Excel/Sheets executaria como fórmula (`=HYPERLINK(...)`, `+cmd|...`, `@SUM(...)`): começa com
 * `= + - @`, tab ou CR. Recebe `'` na frente, e o conteúdo passa a ser só texto. Células numéricas ficam como estão.
 */
function neutralizarFormula(v: Celula) {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return String(v);
  return /^[=+\-@\t\r]/.test(v) && !NUMERO_PURO.test(v) ? `'${v}` : v;
}

function celulaCsv(v: Celula) {
  const s = neutralizarFormula(v);
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
  /** Minutos de antecedência de um alarme (ex.: 30). */
  lembreteMin?: number;
  /** Vários alarmes, um `VALARM` por item (ex.: `[4320, 1440, 120]` = 72 h, 24 h e 2 h antes). Soma-se a `lembreteMin`. */
  lembretesMin?: number[];
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

/** Bytes de um ponto de código em UTF-8. */
function bytesUtf8(ponto: number) {
  return ponto < 0x80 ? 1 : ponto < 0x800 ? 2 : ponto < 0x10000 ? 3 : 4;
}

/**
 * Linhas de no máximo 75 octetos UTF-8 (RFC 5545 §3.1); a continuação começa com um espaço, que também conta.
 * Percorre por pontos de código: nunca parte um caractere de vários bytes nem um par substituto (emoji).
 */
function dobrar(linha: string) {
  const partes: string[] = [];
  let atual = "";
  let bytes = 0;
  for (const ch of linha) {
    const n = bytesUtf8(ch.codePointAt(0) ?? 0);
    if (bytes + n > 75) {
      partes.push(atual);
      atual = " ";
      bytes = 1;
    }
    atual += ch;
    bytes += n;
  }
  partes.push(atual);
  return partes.join("\r\n");
}

/** Alarmes do evento (`lembretesMin` + `lembreteMin`) sem repetição nem valores inválidos. */
function alarmesDe(e: EventoIcs) {
  const todos = [...(e.lembretesMin ?? []), ...(e.lembreteMin ? [e.lembreteMin] : [])];
  return [...new Set(todos.filter((m) => Number.isFinite(m) && m > 0).map((m) => Math.round(m)))];
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
    for (const min of alarmesDe(e)) linhas.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${textoIcs(e.titulo)}`, `TRIGGER:-PT${min}M`, "END:VALARM");
    linhas.push("END:VEVENT");
  }
  linhas.push("END:VCALENDAR");
  return linhas.map(dobrar).join("\r\n") + "\r\n";
}

export function baixarIcs(nome: string, eventos: EventoIcs[], nomeCalendario?: string) {
  const arquivo = nome.toLowerCase().endsWith(".ics") ? nome : `${nome}.ics`;
  baixarArquivo(new Blob([gerarIcs(eventos, nomeCalendario)], { type: "text/calendar;charset=utf-8" }), arquivo);
}
