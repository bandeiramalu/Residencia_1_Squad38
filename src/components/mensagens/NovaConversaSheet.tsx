"use client";

import { ChevronRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Sheet } from "@/components/ui/Sheet";
import { normalizar } from "@/lib/format";
import { iniciarConversa } from "@/store/actions";
import { useEstado } from "@/store/store";
import type { Pessoa } from "@/store/types";

/** Escolher um contato (professor, colega ou coordenação) para iniciar conversa. */
export function NovaConversaSheet({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo="Nova mensagem" subtitulo="Professores, colegas e coordenação do CEPI">
      <ListaContatos onFechar={onFechar} />
    </Sheet>
  );
}

function ListaContatos({ onFechar }: { onFechar: () => void }) {
  const router = useRouter();
  const { pessoas, usuario } = useEstado();
  const [busca, setBusca] = useState("");
  const termo = normalizar(busca.trim());

  const contatos = Object.values(pessoas).filter((p) => p.id !== usuario.id && (!termo || normalizar(p.nome).includes(termo)));
  const grupos: { titulo: string; pessoas: Pessoa[] }[] = [
    { titulo: "Professores", pessoas: contatos.filter((p) => p.papel === "professor") },
    { titulo: "Colegas", pessoas: contatos.filter((p) => p.papel === "aluno") },
    { titulo: "Escola", pessoas: contatos.filter((p) => p.papel === "escola") },
  ].filter((g) => g.pessoas.length);

  const abrir = (id: string) => {
    const conversaId = iniciarConversa(id);
    onFechar();
    router.push(`/mensagens/${conversaId}`);
  };

  return (
    <>
      <label className="flex h-11 items-center gap-2 rounded-xl border border-borda bg-verde-mclaro px-3 focus-within:border-verde-2 focus-within:bg-white">
        <Search className="size-4 text-texto-2" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar pelo nome…"
          aria-label="Buscar contato"
          className="min-w-0 flex-1 bg-transparent text-sm text-texto outline-none placeholder:text-texto-2/70"
        />
      </label>

      {grupos.length === 0 && <p className="py-6 text-center text-sm text-texto-2">Ninguém encontrado com esse nome.</p>}

      {grupos.map((g) => (
        <section key={g.titulo} className="mt-4">
          <h3 className="mb-1.5 text-xs font-bold uppercase tracking-[0.08em] text-verde">{g.titulo}</h3>
          <ul>
            {g.pessoas.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => abrir(p.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-verde-mclaro active:bg-verde-claro"
                >
                  <Avatar nome={p.nome} iniciais={p.iniciais} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-tinta">{p.nome}</span>
                    <span className="block text-xs text-texto-2">
                      {p.papel === "professor" ? p.disciplina : p.papel === "escola" ? "Atendimento aos alunos" : p.turma}
                    </span>
                  </span>
                  <ChevronRight className="size-4 text-texto-2" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
