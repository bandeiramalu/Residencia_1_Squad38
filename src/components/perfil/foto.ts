/** Recorta a imagem em quadrado (centro) e reduz para `lado` px; devolve um dataURL JPEG. */
export async function reduzirFoto(arquivo: File, lado = 256): Promise<string> {
  if (!arquivo.type.startsWith("image/")) throw new Error("Escolha um arquivo de imagem (JPG, PNG ou WebP).");
  const url = URL.createObjectURL(arquivo);
  try {
    const img = await new Promise<HTMLImageElement>((ok, erro) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => erro(new Error("Não foi possível ler esta imagem."));
      i.src = url;
    });
    const menor = Math.min(img.naturalWidth, img.naturalHeight);
    if (!menor) throw new Error("Imagem inválida.");
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = lado;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Seu navegador não conseguiu processar a imagem.");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, lado, lado);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, (img.naturalWidth - menor) / 2, (img.naturalHeight - menor) / 2, menor, menor, 0, 0, lado, lado);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}
