/** Substitui `next/link`: <a href="#/rota"> com navegação no próprio documento. */
/* eslint-disable @typescript-eslint/no-unused-vars -- props do next/link que o adaptador ignora */
import type { AnchorHTMLAttributes, MouseEvent, Ref } from "react";
import { navegar } from "./roteador";

type Href = string | { pathname?: string; query?: Record<string, string>; hash?: string };

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: Href;
  replace?: boolean;
  scroll?: boolean;
  prefetch?: boolean | null;
  ref?: Ref<HTMLAnchorElement>;
};

function formatar(href: Href) {
  if (typeof href === "string") return href;
  const q = href.query ? `?${new URLSearchParams(href.query)}` : "";
  return `${href.pathname ?? ""}${q}`;
}

export default function Link({ href, replace, scroll: _scroll, prefetch: _prefetch, onClick, ...resto }: Props) {
  const url = formatar(href);
  const externo = /^(https?:|mailto:|tel:|blob:|data:)/.test(url);
  const aoClicar = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || externo || resto.target || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navegar(url, replace);
  };
  return <a href={externo ? url : `#${url}`} onClick={aoClicar} {...resto} />;
}
