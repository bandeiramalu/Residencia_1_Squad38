/**
 * Gera um PDF simples (1 página, Helvetica) direto no navegador para o botão
 * "PDF · Baixar". Não usa bibliotecas: monta os objetos PDF à mão.
 */

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

function paraLatin1(texto: string) {
  const bytes: number[] = [];
  for (const ch of texto.replace(/[₀-₉]/g, (c) => SUBSCRITOS[c])) {
    const code = ch.codePointAt(0) ?? 63;
    if (WIN_ANSI[ch]) bytes.push(WIN_ANSI[ch]);
    else if (code < 256) bytes.push(code);
    else bytes.push(63);
  }
  return bytes;
}

function escaparPdf(bytes: number[]) {
  const out: number[] = [];
  for (const b of bytes) {
    if (b === 0x28 || b === 0x29 || b === 0x5c) out.push(0x5c);
    out.push(b);
  }
  return out;
}

function quebrarLinhas(texto: string, largura: number) {
  const linhas: string[] = [];
  for (const paragrafo of texto.split("\n")) {
    let linha = "";
    for (const palavra of paragrafo.split(" ")) {
      if ((linha + " " + palavra).trim().length > largura) {
        linhas.push(linha);
        linha = palavra;
      } else linha = (linha + " " + palavra).trim();
    }
    linhas.push(linha);
  }
  return linhas;
}

interface Bloco {
  texto: string;
  tamanho: number;
  negrito?: boolean;
  cor?: [number, number, number];
  espaco?: number;
}

export function gerarPdf(blocos: Bloco[]) {
  const partes: number[][] = [];
  const texto = (s: string) => partes.push(paraLatin1(s));

  // O primeiro bloco cai dentro da faixa verde (use cor branca nele).
  let y = 832;
  const conteudo: number[] = [];
  const add = (s: string) => conteudo.push(...paraLatin1(s));

  // Faixa verde do cabeçalho
  add("0.118 0.443 0.286 rg 0 800 595 42 re f\n");
  for (const bloco of blocos) {
    const largura = Math.floor(95 * (11 / bloco.tamanho));
    for (const linha of quebrarLinhas(bloco.texto, largura)) {
      if (y < 60) break;
      y -= bloco.tamanho + 6;
      const [r, g, b] = bloco.cor ?? [0.27, 0.37, 0.33];
      add(`BT /${bloco.negrito ? "F2" : "F1"} ${bloco.tamanho} Tf ${r} ${g} ${b} rg 56 ${y} Td (`);
      conteudo.push(...escaparPdf(paraLatin1(linha)));
      add(") Tj ET\n");
    }
    y -= bloco.espaco ?? 6;
  }

  const objetos = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
  ];

  texto("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  const offsets: number[] = [];
  const tamanhoAtual = () => partes.reduce((s, p) => s + p.length, 0);

  objetos.forEach((obj, i) => {
    offsets.push(tamanhoAtual());
    texto(`${i + 1} 0 obj\n${obj}\nendobj\n`);
  });

  offsets.push(tamanhoAtual());
  texto(`6 0 obj\n<< /Length ${conteudo.length} >>\nstream\n`);
  partes.push(conteudo);
  texto("\nendstream\nendobj\n");

  const inicioXref = tamanhoAtual();
  let xref = `xref\n0 7\n0000000000 65535 f \n`;
  for (const off of offsets) xref += `${String(off).padStart(10, "0")} 00000 n \n`;
  texto(xref);
  texto(`trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF`);

  const total = new Uint8Array(tamanhoAtual());
  let pos = 0;
  for (const p of partes) {
    total.set(p, pos);
    pos += p.length;
  }
  return new Blob([total], { type: "application/pdf" });
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
