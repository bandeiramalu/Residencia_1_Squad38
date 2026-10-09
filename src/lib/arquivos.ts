/**
 * Arquivos de verdade, offline: o que o usuário escolhe fica no IndexedDB do navegador
 * (funciona em file:// no Chrome/Edge e é compartilhado entre abas — o professor, em outra
 * janela, abre o arquivo que a aluna enviou). Sem IndexedDB, cai para a memória da aba.
 *
 * Segurança: só entram os tipos da lista permitida (`TIPOS`, por extensão); o tipo guardado (MIME) vem
 * da extensão — nunca do `file.type`, que o remetente controla. Um `.html`/`.svg` aberto numa aba
 * rodaria scripts na origem do portal, então só PDF, imagem e texto abrem na aba (blob com MIME seguro,
 * sem `opener`); o resto é baixado. O servidor repete a regra (MIME real, `nosniff`, `attachment`).
 */
import { useEffect, useState } from "react";

export const LIMITE_BYTES = 10 * 1024 * 1024;

export interface ArquivoSalvo {
  id: string;
  nome: string;
  mime: string;
  bytes: number;
  /** Ex.: "212 KB". */
  tamanho: string;
  /** Só PDF. */
  paginas?: number;
  /** Miniatura (dataURL ~240 px) das imagens. */
  previa?: string;
}

interface Registro {
  id: string;
  nome: string;
  mime: string;
  blob: Blob;
}

const BANCO = "portal-arquivos";
const LOJA = "arquivos";
const memoria = new Map<string, Registro>();
let abertura: Promise<IDBDatabase | null> | null = null;

function abrirBanco(): Promise<IDBDatabase | null> {
  if (abertura) return abertura;
  abertura = new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const req = indexedDB.open(BANCO, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(LOJA)) req.result.createObjectStore(LOJA, { keyPath: "id" });
      };
      req.onsuccess = () => {
        const banco = req.result;
        // Outra aba apagando o banco ("Apagar meus dados") não pode ficar bloqueada por esta conexão.
        banco.onversionchange = () => {
          banco.close();
          abertura = null;
        };
        resolve(banco);
      };
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return abertura;
}

function transacao<T>(banco: IDBDatabase, modo: IDBTransactionMode, fn: (loja: IDBObjectStore) => IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    const req = fn(banco.transaction(LOJA, modo).objectStore(LOJA));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function formatarTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1048576).toFixed(1).replace(".", ",")} MB`;
}

interface TipoPermitido {
  mime: string;
  /** Abre na própria aba do navegador (PDF, imagem e texto); os demais são baixados. */
  aba: boolean;
  imagem?: boolean;
}

/** Lista permitida por extensão (minúscula, sem ponto). Tudo fora dela é recusado. */
const TIPOS: Record<string, TipoPermitido> = {
  pdf: { mime: "application/pdf", aba: true },
  png: { mime: "image/png", aba: true, imagem: true },
  jpg: { mime: "image/jpeg", aba: true, imagem: true },
  jpeg: { mime: "image/jpeg", aba: true, imagem: true },
  webp: { mime: "image/webp", aba: true, imagem: true },
  heic: { mime: "image/heic", aba: false, imagem: true },
  txt: { mime: "text/plain", aba: true },
  doc: { mime: "application/msword", aba: false },
  docx: { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", aba: false },
  odt: { mime: "application/vnd.oasis.opendocument.text", aba: false },
  ppt: { mime: "application/vnd.ms-powerpoint", aba: false },
  pptx: { mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", aba: false },
  xls: { mime: "application/vnd.ms-excel", aba: false },
  xlsx: { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", aba: false },
};

/** Valor do atributo `accept` com toda a lista permitida (campo de anexo sem restrição extra). */
export const ACEITA_ARQUIVOS = Object.keys(TIPOS)
  .map((ext) => `.${ext}`)
  .join(",");

const MIME_NEUTRO = "application/octet-stream";

function extensaoDe(nome: string) {
  return /\.([a-z0-9]+)$/i.exec(nome.trim())?.[1].toLowerCase();
}

function tipoDoNome(nome: string): TipoPermitido | undefined {
  const ext = extensaoDe(nome);
  return ext ? TIPOS[ext] : undefined;
}

/** Extensões permitidas dentro do `accept` (".pdf,.png", "image/*", "application/pdf"); sem `accept`, a lista toda. */
function extensoesAceitas(aceita?: string) {
  const todas = Object.keys(TIPOS);
  const fichas = (aceita ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  if (fichas.length === 0) return todas;
  return todas.filter((ext) => fichas.some((f) => (f.startsWith(".") ? f.slice(1) === ext : f.endsWith("/*") ? TIPOS[ext].mime.startsWith(f.slice(0, -1)) : f === TIPOS[ext].mime)));
}

const MENSAGEM_TIPO = "Tipo de arquivo não aceito.";

/**
 * Mensagem amigável quando o arquivo não pode ser guardado; `undefined` se estiver ok.
 * `aceita` = o mesmo texto do `accept` do campo (vale também para arrastar e soltar, que ignora o `accept`).
 */
export function validarArquivo(file: File, aceita?: string): string | undefined {
  if (file.size === 0) return "Esse arquivo está vazio. Escolha outro.";
  const ext = extensaoDe(file.name);
  const permitidas = extensoesAceitas(aceita);
  if (!ext || !permitidas.includes(ext)) {
    // Campo só de imagem (ex.: foto do caderno): a dica cita os formatos dele; nos demais vale a mensagem padrão.
    if (permitidas.length > 0 && permitidas.every((e) => TIPOS[e].imagem)) return `${MENSAGEM_TIPO} Envie uma imagem (${permitidas.map((e) => e.toUpperCase()).join(", ")}).`;
    return `${MENSAGEM_TIPO} Envie PDF, imagem ou documento.`;
  }
  if (file.size > LIMITE_BYTES) return `O arquivo tem ${formatarTamanho(file.size)} e o limite é ${formatarTamanho(LIMITE_BYTES)}. Escolha um arquivo menor ou comprima o PDF.`;
  return undefined;
}

/** Conta as páginas de um PDF: "/Type /Page" que não seja "/Pages". */
async function contarPaginas(file: File): Promise<number | undefined> {
  try {
    const texto = new TextDecoder("latin1").decode(await file.arrayBuffer());
    const n = (texto.match(/\/Type\s*\/Page(?![A-Za-z])/g) ?? []).length;
    return n > 0 ? n : undefined;
  } catch {
    return undefined;
  }
}

/** Miniatura de ~240 px (dataURL JPEG) para imagens. */
async function miniatura(file: File): Promise<string | undefined> {
  try {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((ok, erro) => {
        const i = new Image();
        i.onload = () => ok(i);
        i.onerror = () => erro(new Error("imagem"));
        i.src = url;
      });
      const escala = Math.min(1, 240 / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.naturalWidth * escala));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * escala));
      const ctx = canvas.getContext("2d");
      if (!ctx) return undefined;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.72);
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    return undefined;
  }
}

function gerarId() {
  return `arq_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** Tipo (MIME) guardado: sempre o da extensão permitida, nunca o `file.type`. */
function mimeDe(file: File) {
  return tipoDoNome(file.name)?.mime ?? MIME_NEUTRO;
}

/** Guarda o arquivo no navegador. Lança `Error` com mensagem amigável se não puder. */
export async function salvarArquivo(file: File, aceita?: string): Promise<ArquivoSalvo> {
  const aviso = validarArquivo(file, aceita);
  if (aviso) throw new Error(aviso);
  const mime = mimeDe(file);
  const [paginas, previa] = await Promise.all([
    mime === "application/pdf" ? contarPaginas(file) : Promise.resolve(undefined),
    mime.startsWith("image/") ? miniatura(file) : Promise.resolve(undefined),
  ]);
  const registro: Registro = { id: gerarId(), nome: file.name, mime, blob: file.slice(0, file.size, mime) };
  const banco = await abrirBanco();
  let guardado = false;
  if (banco) {
    try {
      await transacao(banco, "readwrite", (l) => l.put(registro));
      guardado = true;
    } catch {
      guardado = false;
    }
  }
  if (!guardado) memoria.set(registro.id, registro);
  return { id: registro.id, nome: file.name, mime, bytes: file.size, tamanho: formatarTamanho(file.size), paginas, previa };
}

async function lerRegistro(id: string): Promise<Registro | undefined> {
  const local = memoria.get(id);
  if (local) return local;
  const banco = await abrirBanco();
  if (!banco) return undefined;
  try {
    return await transacao<Registro | undefined>(banco, "readonly", (l) => l.get(id));
  } catch {
    return undefined;
  }
}

/** Blob com o MIME seguro da extensão do nome (arquivo antigo de tipo não permitido vira `octet-stream`). */
function blobSeguro(r: Registro) {
  const mime = tipoDoNome(r.nome)?.mime ?? MIME_NEUTRO;
  // Texto sem charset seria lido como Windows-1252 e quebraria os acentos.
  return r.blob.slice(0, r.blob.size, mime.startsWith("text/") ? `${mime};charset=utf-8` : mime);
}

/** O arquivo guardado, sempre com o MIME seguro (o da extensão), nunca o que veio com ele. */
export async function lerArquivo(id: string): Promise<Blob | undefined> {
  const r = await lerRegistro(id);
  return r ? blobSeguro(r) : undefined;
}

export async function baixarArquivoSalvo(id: string, nome: string): Promise<boolean> {
  const blob = await lerArquivo(id);
  if (!blob) return false;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

/**
 * Abre o arquivo: PDF, imagem e texto numa nova aba (blob com MIME seguro, sem `opener`); os demais tipos
 * (documentos, HEIC e qualquer extensão fora da lista) são baixados. `false` = arquivo não encontrado.
 */
export async function abrirArquivo(id: string, nome: string): Promise<boolean> {
  if (!tipoDoNome(nome)?.aba) return baixarArquivoSalvo(id, nome);
  // A aba é aberta já no clique (antes do await), senão o navegador a trata como pop-up.
  const aba = window.open("", "_blank");
  if (aba) {
    try {
      aba.opener = null;
    } catch {
      /* o navegador não deixa soltar o vínculo */
    }
  }
  const registro = await lerRegistro(id);
  if (!registro) {
    aba?.close();
    return false;
  }
  if (!tipoDoNome(registro.nome)?.aba) {
    aba?.close();
    return baixarArquivoSalvo(id, nome);
  }
  if (!aba) return baixarArquivoSalvo(id, nome);
  const url = URL.createObjectURL(blobSeguro(registro));
  aba.location.href = url;
  setTimeout(() => URL.revokeObjectURL(url), 5 * 60_000);
  return true;
}

/** "Apagar meus dados": fecha a conexão, apaga o banco `portal-arquivos` e esvazia a memória da aba. */
export async function apagarTodosArquivos(): Promise<void> {
  memoria.clear();
  const aberta = abertura;
  abertura = null;
  try {
    (await aberta)?.close();
  } catch {
    /* já estava fechada */
  }
  if (typeof indexedDB === "undefined") return;
  await new Promise<void>((resolve) => {
    try {
      const req = indexedDB.deleteDatabase(BANCO);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      // Outra aba ainda segura o banco: ela o fecha ao receber `versionchange` e a remoção termina sozinha.
      req.onblocked = () => resolve();
    } catch {
      resolve();
    }
  });
}

/** URL temporária (blob) do arquivo guardado, para `<iframe>`/`<img>`. */
export function useUrlArquivo(id?: string) {
  const [estado, setEstado] = useState<{ id: string; url: string | null } | null>(null);
  useEffect(() => {
    if (!id) return;
    let ativo = true;
    let url: string | null = null;
    void lerArquivo(id).then((blob) => {
      if (!ativo) return;
      url = blob ? URL.createObjectURL(blob) : null;
      setEstado({ id, url });
    });
    return () => {
      ativo = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [id]);
  return estado && estado.id === id ? estado.url : null;
}
