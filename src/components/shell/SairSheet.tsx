"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { sair } from "@/lib/auth";
import { usePendentesEnvio } from "@/store/actions";

/** Confirmação de saída quando ainda há publicações/ações guardadas neste aparelho esperando envio. */
function SairSheet({ aberto, pendentes, onFechar, onSair }: { aberto: boolean; pendentes: number; onFechar: () => void; onSair: () => void }) {
  const saindo = useRef(false);
  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo="Sair do portal?">
      <p className="text-sm leading-relaxed text-texto">
        Há {pendentes} {pendentes === 1 ? "ação aguardando" : "ações aguardando"} envio neste aparelho. Sair mesmo assim?
      </p>
      <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
        <Button variante="secundario" onClick={onFechar}>
          Continuar no portal
        </Button>
        <Button
          variante="perigo"
          onClick={() => {
            if (saindo.current) return;
            saindo.current = true;
            onSair();
          }}
        >
          Sair mesmo assim
        </Button>
      </div>
    </Sheet>
  );
}

/**
 * "Sair" do portal. `pedir()` sai na hora; se houver ações aguardando envio neste aparelho, antes pergunta
 * "Há N ações aguardando envio neste aparelho. Sair mesmo assim?". Renderize `dialogo` em qualquer lugar do componente.
 */
export function useSair(): { pedir: () => void; dialogo: ReactNode } {
  const router = useRouter();
  const pendentes = usePendentesEnvio();
  const [aberto, setAberto] = useState(false);
  const sairAgora = () => {
    sair();
    router.push("/login");
  };
  return {
    pedir: () => (pendentes > 0 ? setAberto(true) : sairAgora()),
    dialogo: <SairSheet aberto={aberto} pendentes={pendentes} onFechar={() => setAberto(false)} onSair={sairAgora} />,
  };
}
