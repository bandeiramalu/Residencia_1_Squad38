/** Substitui `next/navigation` na versão de demonstração (HTML único). */
import { createContext, useContext, useMemo } from "react";
import { navegar, separar, useUrl } from "./roteador";

export const ParamsContexto = createContext<Record<string, string>>({});

const roteador = {
  push: (href: string) => navegar(href),
  replace: (href: string) => navegar(href, true),
  back: () => history.back(),
  forward: () => history.forward(),
  refresh: () => {},
  prefetch: () => {},
};

export function useRouter() {
  return roteador;
}

export function usePathname() {
  return separar(useUrl()).caminho;
}

export function useSearchParams() {
  const { query } = separar(useUrl());
  return useMemo(() => new URLSearchParams(query), [query]);
}

export function useParams() {
  return useContext(ParamsContexto);
}

export function redirect(href: string): never {
  navegar(href, true);
  throw new Error(`redirect: ${href}`);
}

export function notFound(): never {
  navegar("/404", true);
  throw new Error("notFound");
}
