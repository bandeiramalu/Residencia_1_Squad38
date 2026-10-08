import { useCallback, useState } from "react";

/** Rascunhos em memória, por chave: sobrevivem a fechar o modal sem querer (fundo, Esc, arrasto). */
const rascunhos = new Map<string, string>();

/** Como `useState<string>`, mas o valor volta ao reabrir o modal. `limpar` descarta o rascunho (ao publicar/enviar). */
export function useRascunho(chave: string, inicial = ""): [string, (v: string) => void, () => void] {
  const [valor, setValor] = useState(() => rascunhos.get(chave) ?? inicial);
  const definir = useCallback(
    (v: string) => {
      if (v) rascunhos.set(chave, v);
      else rascunhos.delete(chave);
      setValor(v);
    },
    [chave],
  );
  const limpar = useCallback(() => {
    rascunhos.delete(chave);
  }, [chave]);
  return [valor, definir, limpar];
}
