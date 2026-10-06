import { abrirAnexoDe, baixarAnexoDe } from "@/lib/materiais";
import { dataCurta } from "@/lib/tempo";
import { abrirMaterial } from "@/store/actions";
import type { Pessoa, Post } from "@/store/types";
import { toast } from "@/store/ui";

function contexto(post: Post, autor?: Pessoa) {
  return { titulo: post.anexo?.nome.replace(/\.pdf$/i, ""), descricao: post.texto, disciplina: post.disciplina, autor: autor?.nome, data: dataCurta(post.criadoEm) };
}

/** Abre o arquivo real (ou o PDF gerado) do material e conta a abertura para as missões. */
export function abrirDoPost(post: Post, autor?: Pessoa) {
  if (!post.anexo) return;
  void abrirAnexoDe(post.anexo, contexto(post, autor));
  abrirMaterial(post.id);
}

export function baixarDoPost(post: Post, autor?: Pessoa) {
  if (!post.anexo) return;
  void baixarAnexoDe(post.anexo, contexto(post, autor));
  abrirMaterial(post.id);
  toast({ tipo: "info", titulo: "Download iniciado", mensagem: post.anexo.nome }, 2400);
}

/** Link que funciona no HTML offline: abre o feed e destaca o post. */
export function linkDoPost(postId: string) {
  return `${location.href.split("#")[0]}#/feed?post=${encodeURIComponent(postId)}`;
}

async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = texto;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}

/** Compartilha com `navigator.share` quando existir; senão copia o link. */
export async function compartilharPost(post: Post, autor?: Pessoa) {
  const url = linkDoPost(post.id);
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title: `Portal do Aluno · ${autor?.nome ?? "publicação"}`, text: post.texto.slice(0, 120), url });
      return;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    }
  }
  if (await copiar(url)) toast({ tipo: "info", titulo: "Link copiado", mensagem: "Cole onde quiser — ele abre direto nesta publicação." }, 2600);
  else toast({ tipo: "alerta", titulo: "Não foi possível copiar o link", mensagem: url }, 5000);
}
