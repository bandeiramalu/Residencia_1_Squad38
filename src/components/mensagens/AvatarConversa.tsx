import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { ehGrupo, outrosParticipantes } from "@/lib/conversas";
import type { Conversa, Pessoa } from "@/store/types";

/** Avatar do contato ou, em grupos, dois avatares sobrepostos. */
export function AvatarConversa({
  conversa,
  pessoas,
  usuarioId,
  tamanho = "md",
}: {
  conversa: Conversa;
  pessoas: Record<string, Pessoa>;
  usuarioId: string;
  tamanho?: "sm" | "md";
}) {
  const outros = outrosParticipantes(conversa, usuarioId);

  if (!ehGrupo(conversa)) {
    const p = pessoas[outros[0]];
    return <Avatar nome={p?.nome ?? "?"} iniciais={p?.iniciais} tamanho={tamanho} />;
  }

  const [a, b] = outros.map((id) => pessoas[id]);
  const mini = tamanho === "sm" ? "xs" : "sm";
  return (
    <span className={cn("relative inline-block shrink-0", tamanho === "sm" ? "size-9" : "size-11")}>
      <span className="absolute left-0 top-0">
        <Avatar nome={a?.nome ?? "?"} iniciais={a?.iniciais} tamanho={mini} />
      </span>
      <span className="absolute bottom-0 right-0 rounded-full ring-2 ring-white">
        <Avatar nome={b?.nome ?? "?"} iniciais={b?.iniciais} tamanho={mini} />
      </span>
    </span>
  );
}
