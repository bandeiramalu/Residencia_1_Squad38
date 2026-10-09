/** Substitui `next/image` por <img> simples (a imagem já vem embutida no HTML). */
/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-img-element -- o adaptador descarta de propósito as props exclusivas do next/image */
import type { CSSProperties, ImgHTMLAttributes } from "react";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | { src: string };
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  placeholder?: string;
  blurDataURL?: string;
  unoptimized?: boolean;
  loader?: unknown;
};

export default function Image({ src, fill, priority: _p, quality: _q, placeholder: _ph, blurDataURL: _b, unoptimized: _u, loader: _l, style, width, height, alt, ...resto }: Props) {
  const estilo: CSSProperties | undefined = fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style } : style;
  return (
    <img
      src={typeof src === "string" ? src : src.src}
      alt={alt ?? ""}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      style={estilo}
      decoding="async"
      {...resto}
    />
  );
}
