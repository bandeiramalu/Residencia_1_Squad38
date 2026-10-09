/** Substitui `next/dynamic` por React.lazy (tudo já está no mesmo arquivo). */
import { createElement, lazy, Suspense, type ComponentType } from "react";

type Carregador<P> = () => Promise<ComponentType<P> | { default: ComponentType<P> }>;

export default function dynamic<P extends object>(carregar: Carregador<P>, opcoes?: { loading?: ComponentType; ssr?: boolean }) {
  const Preguicoso = lazy(async () => {
    const m = await carregar();
    return { default: "default" in m ? m.default : m };
  });
  const Carregando = opcoes?.loading;
  return function Dinamico(props: P) {
    return createElement(Suspense, { fallback: Carregando ? createElement(Carregando) : null }, createElement(Preguicoso as ComponentType<P>, props));
  };
}
