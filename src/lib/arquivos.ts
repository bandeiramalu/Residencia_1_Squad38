/**
 * Arquivos de verdade, offline: o que o usuário escolhe fica no IndexedDB do navegador
 * (funciona em file:// no Chrome/Edge e é compartilhado entre abas — o professor, em outra
 * janela, abre o arquivo que a aluna enviou). Sem IndexedDB, cai para a memória da aba.
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
      req.onsuccess = () => resolve(req.result);
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

/** Mensagem amigável quando o arquivo não pode ser guardado; `undefined` se estiver ok. */
export function validarArquivo(file: File): string | undefined {
  if (file.size === 0) return "Esse arquivo está vazio. Escolha outro.";
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

function mimeDe(file: File) {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  const mapa: Record<string, string> = { pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", txt: "text/plain", heic: "image/heic" };
  return (ext && mapa[ext]) || "application/octet-stream";
}

/** Guarda o arquivo no navegador. Lança `Error` com mensagem amigável se não puder. */
export async function salvarArquivo(file: File): Promise<ArquivoSalvo> {
  const aviso = validarArquivo(file);
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

export async function lerArquivo(id: string): Promise<Blob | undefined> {
  const local = memoria.get(id);
  if (local) return local.blob;
  const banco = await abrirBanco();
  if (!banco) return undefined;
  try {
    const r = await transacao<Registro | undefined>(banco, "readonly", (l) => l.get(id));
    return r?.blob;
  } catch {
    return undefined;
  }
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

/** Abre o arquivo numa nova aba (blob URL); se o navegador bloquear, baixa. `false` = arquivo não encontrado. */
export async function abrirArquivo(id: string, nome: string): Promise<boolean> {
  // A aba é aberta já no clique (antes do await), senão o navegador a trata como pop-up.
  const aba = window.open("", "_blank");
  const blob = await lerArquivo(id);
  if (!blob) {
    aba?.close();
    return false;
  }
  if (!aba) return baixarArquivoSalvo(id, nome);
  const url = URL.createObjectURL(blob);
  aba.location.href = url;
  setTimeout(() => URL.revokeObjectURL(url), 5 * 60_000);
  return true;
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
