/**
 * Gerador de PDF sem bibliotecas: monta à mão um documento A4 com várias páginas
 * (Helvetica / Helvetica-Bold, WinAnsiEncoding), quebra de linha pela largura real
 * do texto (métricas AFM) e paginação automática com rodapé "página X de Y".
 */

/* ───────────── Modelo do documento ───────────── */

export type Bloco =
  | { tipo: "secao"; texto: string }
  | { tipo: "paragrafo"; texto: string }
  | { tipo: "numerada"; itens: string[] }
  | { tipo: "marcadores"; itens: string[] }
  /** Quadro destacado ("Lembre-se"). `texto` em lista vira marcadores. */
  | { tipo: "quadro"; titulo: string; texto: string | string[] }
  | { tipo: "tabela"; colunas: string[]; linhas: string[][]; larguras?: number[] }
  | { tipo: "gabarito"; titulo?: string; itens: string[] };

export interface Documento {
  escola?: string;
  titulo: string;
  subtitulo?: string;
  blocos: Bloco[];
}

export interface PdfGerado {
  blob: Blob;
  paginas: number;
  bytes: number;
}

/* ───────────── Codificação (WinAnsi) ───────────── */

const WIN_ANSI: Record<string, number> = {
  "—": 0x97,
  "–": 0x96,
  "“": 0x93,
  "”": 0x94,
  "‘": 0x91,
  "’": 0x92,
  "•": 0x95,
  "…": 0x85,
  "€": 0x80,
};

const SUBSCRITOS: Record<string, string> = { "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9" };
const SUBSTITUICOES: Record<string, string> = { "−": "-", "→": "->", "≤": "<=", "≥": ">=", "≠": "!=", "≈": "~", " ": " ", "\t": " " };

function limpar(texto: string) {
  return texto
    .normalize("NFC")
    .replace(/[₀-₉]/g, (c) => SUBSCRITOS[c])
    .replace(/[−→≤≥≠≈ \t]/g, (c) => SUBSTITUICOES[c]);
}

/** Texto -> string de bytes Latin-1/WinAnsi (cada caractere = 1 byte). */
function paraBytes(texto: string) {
  let out = "";
  for (const ch of limpar(texto)) {
    const code = ch.codePointAt(0) ?? 63;
    out += String.fromCharCode(WIN_ANSI[ch] ?? (code < 256 ? code : 63));
  }
  return out;
}

function escaparPdf(bytes: string) {
  return bytes.replace(/[()\\]/g, (c) => `\\${c}`);
}

/* ───────────── Métricas AFM (largura por 1000 unidades) ───────────── */

// Códigos 32..126
const LARGURA_REGULAR = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778,
  722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];
const LARGURA_NEGRITO = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778,
  722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
  611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584,
];
const ESPECIAIS: Record<string, [number, number]> = {
  "•": [350, 350],
  "–": [556, 556],
  "—": [1000, 1000],
  "…": [1000, 1000],
  "’": [222, 278],
  "‘": [222, 278],
  "“": [333, 500],
  "”": [333, 500],
  "×": [584, 584],
  "÷": [584, 584],
  "°": [400, 400],
  "±": [584, 584],
  "²": [333, 333],
  "³": [333, 333],
  "º": [365, 365],
  "ª": [370, 370],
  "½": [834, 834],
  "·": [278, 278],
  "«": [556, 556],
  "»": [556, 556],
  "¿": [611, 611],
  "¡": [333, 333],
};

function larguraChar(ch: string, negrito: boolean) {
  const esp = ESPECIAIS[ch];
  if (esp) return esp[negrito ? 1 : 0];
  const base = ch.normalize("NFD")[0];
  const code = base.charCodeAt(0);
  if (code >= 32 && code <= 126) return (negrito ? LARGURA_NEGRITO : LARGURA_REGULAR)[code - 32];
  return 556;
}

function medir(texto: string, tamanho: number, negrito = false) {
  let total = 0;
  for (const ch of limpar(texto)) total += larguraChar(ch, negrito);
  return (total * tamanho) / 1000;
}

function quebrar(texto: string, tamanho: number, negrito: boolean, largura: number) {
  const linhas: string[] = [];
  for (const paragrafo of limpar(texto).split("\n")) {
    let linha = "";
    for (const palavra of paragrafo.split(" ").filter(Boolean)) {
      const tentativa = linha ? `${linha} ${palavra}` : palavra;
      if (medir(tentativa, tamanho, negrito) <= largura) {
        linha = tentativa;
        continue;
      }
      if (linha) linhas.push(linha);
      linha = palavra;
      // palavra maior que a linha: quebra por caractere
      while (medir(linha, tamanho, negrito) > largura && linha.length > 1) {
        let corte = linha.length - 1;
        while (corte > 1 && medir(linha.slice(0, corte), tamanho, negrito) > largura) corte--;
        linhas.push(linha.slice(0, corte));
        linha = linha.slice(corte);
      }
    }
    linhas.push(linha);
  }
  return linhas;
}

/* ───────────── Layout ───────────── */

const LARG = 595;
const ALT = 842;
const MARGEM = 56;
const UTIL = LARG - MARGEM * 2;
const BASE = 62; // limite inferior do conteúdo

type Cor = readonly [number, number, number];
const COR_TEXTO: Cor = [0.13, 0.17, 0.15];
const COR_CINZA: Cor = [0.4, 0.46, 0.43];
const COR_VERDE: Cor = [0.118, 0.443, 0.286];
const COR_ESCURA: Cor = [0.106, 0.227, 0.173];

function cor(c: Cor) {
  return `${c[0]} ${c[1]} ${c[2]}`;
}

class Editor {
  paginas: string[] = [];
  y = 0;
  private atual = "";

  constructor() {
    this.nova(true);
  }

  nova(primeira = false) {
    if (!primeira) this.paginas.push(this.atual);
    this.atual = "";
    this.y = ALT - (primeira ? 0 : 64);
  }

  fechar() {
    this.paginas.push(this.atual);
  }

  restante() {
    return this.y - BASE;
  }

  garantir(altura: number) {
    if (this.y - altura < BASE) this.nova();
  }

  texto(x: number, y: number, s: string, tamanho: number, negrito = false, c: Cor = COR_TEXTO) {
    this.atual += `BT /${negrito ? "F2" : "F1"} ${tamanho} Tf ${cor(c)} rg ${x.toFixed(2)} ${y.toFixed(2)} Td (${escaparPdf(paraBytes(s))}) Tj ET\n`;
  }

  retangulo(x: number, y: number, w: number, h: number, c: Cor) {
    this.atual += `${cor(c)} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f\n`;
  }
}

function desenharLista(ed: Editor, itens: string[], rotulo: (i: number) => string, tamanho = 10.5) {
  const recuo = 22;
  const entre = tamanho * 1.45;
  itens.forEach((item, i) => {
    const linhas = quebrar(item, tamanho, false, UTIL - recuo);
    ed.garantir(entre * Math.min(linhas.length, 2) + 2);
    linhas.forEach((linha, j) => {
      if (j > 0) ed.garantir(entre);
      ed.y -= entre;
      if (j === 0) ed.texto(MARGEM + 4, ed.y, rotulo(i), tamanho, true, COR_VERDE);
      ed.texto(MARGEM + recuo, ed.y, linha, tamanho);
    });
    ed.y -= 4;
  });
  ed.y -= 4;
}

function desenharSecao(ed: Editor, texto: string, c: Cor = COR_ESCURA) {
  const tamanho = 13;
  ed.garantir(70);
  ed.y -= 10;
  const linhas = quebrar(texto, tamanho, true, UTIL);
  for (const linha of linhas) {
    ed.y -= tamanho * 1.3;
    ed.texto(MARGEM, ed.y, linha, tamanho, true, c);
  }
  ed.y -= 5;
  ed.retangulo(MARGEM, ed.y, 28, 1.6, COR_VERDE);
  ed.y -= 6;
}

function desenharQuadro(ed: Editor, titulo: string, texto: string | string[]) {
  const tam = 10;
  const entre = tam * 1.45;
  const pad = 11;
  const recuo = Array.isArray(texto) ? 12 : 0;
  const larg = UTIL - pad * 2 - 4 - recuo;
  const grupos = (Array.isArray(texto) ? texto : [texto]).map((t) => quebrar(t, tam, false, larg));
  const nLinhas = grupos.reduce((s, g) => s + g.length, 0);
  const altura = pad * 2 + 14 + 5 + nLinhas * entre + (grupos.length - 1) * 3;
  ed.garantir(Math.min(altura, ALT - 150) + 6);
  ed.y -= 4;
  const topo = ed.y;
  const altReal = Math.min(altura, topo - BASE);
  ed.retangulo(MARGEM, topo - altReal, UTIL, altReal, [0.925, 0.965, 0.94]);
  ed.retangulo(MARGEM, topo - altReal, 3.5, altReal, COR_VERDE);
  ed.y = topo - pad - 10;
  ed.texto(MARGEM + pad + 4, ed.y, titulo, 10.5, true, COR_ESCURA);
  ed.y -= 5;
  for (const g of grupos) {
    g.forEach((linha, j) => {
      ed.y -= entre;
      if (Array.isArray(texto) && j === 0) ed.texto(MARGEM + pad + 4, ed.y, "•", tam, true, COR_VERDE);
      ed.texto(MARGEM + pad + 4 + recuo, ed.y, linha, tam);
    });
    ed.y -= 3;
  }
  ed.y = topo - altReal - 12;
}

function desenharTabela(ed: Editor, colunas: string[], linhas: string[][], larguras?: number[]) {
  const tam = 9.5;
  const entre = tam * 1.4;
  const pad = 6;
  const pesos = larguras ?? colunas.map(() => 1);
  const soma = pesos.reduce((a, b) => a + b, 0);
  const ws = pesos.map((p) => (p / soma) * UTIL);

  const altura = (celulas: string[], negrito: boolean) =>
    Math.max(...celulas.map((c, i) => quebrar(c, tam, negrito, ws[i] - pad * 2).length)) * entre + pad * 1.5;

  const desenhar = (celulas: string[], negrito: boolean, fundo?: Cor) => {
    const h = altura(celulas, negrito);
    ed.y -= h;
    if (fundo) ed.retangulo(MARGEM, ed.y, UTIL, h, fundo);
    ed.retangulo(MARGEM, ed.y, UTIL, 0.6, [0.82, 0.87, 0.84]);
    let x = MARGEM;
    celulas.forEach((c, i) => {
      quebrar(c, tam, negrito, ws[i] - pad * 2).forEach((linha, j) => {
        ed.texto(x + pad, ed.y + h - pad * 0.75 - tam * 0.9 - j * entre, linha, tam, negrito, negrito ? COR_ESCURA : COR_TEXTO);
      });
      x += ws[i];
    });
  };

  ed.garantir(altura(colunas, true) + (linhas[0] ? altura(linhas[0], false) : 0) + 4);
  ed.y -= 4;
  desenhar(colunas, true, [0.88, 0.94, 0.91]);
  for (const linha of linhas) {
    if (ed.y - altura(linha, false) < BASE) {
      ed.nova();
      desenhar(colunas, true, [0.88, 0.94, 0.91]);
    }
    desenhar(linha, false);
  }
  ed.y -= 12;
}

function desenharBloco(ed: Editor, b: Bloco) {
  switch (b.tipo) {
    case "secao":
      return desenharSecao(ed, b.texto);
    case "paragrafo": {
      const tam = 10.5;
      const entre = tam * 1.5;
      for (const linha of quebrar(b.texto, tam, false, UTIL)) {
        ed.garantir(entre);
        ed.y -= entre;
        ed.texto(MARGEM, ed.y, linha, tam);
      }
      ed.y -= 8;
      return;
    }
    case "numerada":
      return desenharLista(ed, b.itens, (i) => `${i + 1}.`);
    case "marcadores":
      return desenharLista(ed, b.itens, () => "•");
    case "quadro":
      return desenharQuadro(ed, b.titulo, b.texto);
    case "tabela":
      return desenharTabela(ed, b.colunas, b.linhas, b.larguras);
    case "gabarito":
      desenharSecao(ed, b.titulo ?? "Gabarito", COR_VERDE);
      return desenharLista(ed, b.itens, (i) => `${i + 1}.`, 10);
  }
}

/* ───────────── Montagem do arquivo ───────────── */

export function gerarPdfDocumento(doc: Documento): PdfGerado {
  const ed = new Editor();
  const escola = doc.escola ?? "";

  // Cabeçalho discreto (1ª página)
  if (escola) {
    ed.texto(MARGEM, ALT - 42, escola, 9, true, COR_VERDE);
    const dir = "Portal do Aluno";
    ed.texto(LARG - MARGEM - medir(dir, 9), ALT - 42, dir, 9, false, COR_CINZA);
    ed.retangulo(MARGEM, ALT - 49, UTIL, 0.7, [0.8, 0.86, 0.83]);
  }
  ed.y = ALT - 56;
  for (const linha of quebrar(doc.titulo, 21, true, UTIL)) {
    ed.y -= 28;
    ed.texto(MARGEM, ed.y, linha, 21, true, COR_ESCURA);
  }
  if (doc.subtitulo) {
    for (const linha of quebrar(doc.subtitulo, 10, false, UTIL)) {
      ed.y -= 16;
      ed.texto(MARGEM, ed.y, linha, 10, false, COR_CINZA);
    }
  }
  ed.y -= 12;

  for (const b of doc.blocos) desenharBloco(ed, b);
  ed.fechar();

  const total = ed.paginas.length;
  const conteudos = ed.paginas.map((c, i) => {
    const rod = `página ${i + 1} de ${total}`;
    return (
      c +
      `${cor([0.8, 0.86, 0.83])} rg ${MARGEM} 46 ${UTIL} 0.6 re f\n` +
      `BT /F1 8.5 Tf ${cor(COR_CINZA)} rg ${(LARG - MARGEM - medir(rod, 8.5)).toFixed(2)} 32 Td (${escaparPdf(paraBytes(rod))}) Tj ET\n` +
      `BT /F1 8.5 Tf ${cor(COR_CINZA)} rg ${MARGEM} 32 Td (${escaparPdf(paraBytes(escola || doc.titulo))}) Tj ET\n`
    );
  });

  // Objetos: 1 catálogo, 2 páginas, 3-4 fontes, 5.. (página, conteúdo) por página, último = Info
  const kids = conteudos.map((_, i) => `${5 + i * 2} 0 R`).join(" ");
  const objetos: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${kids}] /Count ${total} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
  ];
  conteudos.forEach((c, i) => {
    objetos.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${LARG} ${ALT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + i * 2} 0 R >>`,
    );
    objetos.push(`<< /Length ${c.length} >>\nstream\n${c}endstream`);
  });
  objetos.push(`<< /Title (${escaparPdf(paraBytes(doc.titulo.replace(/[—–]/g, "-")))}) /Producer (Portal do Aluno) >>`);

  let saida = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets: number[] = [];
  objetos.forEach((obj, i) => {
    offsets.push(saida.length);
    saida += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const inicioXref = saida.length;
  const n = objetos.length + 1;
  saida += `xref\n0 ${n}\n0000000000 65535 f \n`;
  for (const off of offsets) saida += `${String(off).padStart(10, "0")} 00000 n \n`;
  saida += `trailer\n<< /Size ${n} /Root 1 0 R /Info ${objetos.length} 0 R >>\nstartxref\n${inicioXref}\n%%EOF`;

  const bytes = new Uint8Array(saida.length);
  for (let i = 0; i < saida.length; i++) bytes[i] = saida.charCodeAt(i) & 0xff;
  return { blob: new Blob([bytes], { type: "application/pdf" }), paginas: total, bytes: bytes.length };
}

export function baixarArquivo(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
