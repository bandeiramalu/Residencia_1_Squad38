"use client";

import { Camera, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Avatar, iniciaisDe } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { AreaTexto, Campo, Entrada } from "@/components/ui/Campo";
import { RodapeSheet } from "@/components/ui/RodapeSheet";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";
import { editarPerfil } from "@/store/acoes/aluno";
import { useSeletor } from "@/store/store";
import { arrobaPadrao } from "./arroba";
import { reduzirFoto } from "./foto";
import { SELOS } from "./selos";

const MAX_BIO = 160;
const REGRA_ARROBA = /^[a-z0-9._]{3,20}$/;

export function EditarPerfilSheet({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo="Editar perfil" subtitulo="Nome, foto, bio e selos">
      <Formulario onFechar={onFechar} />
    </Sheet>
  );
}

/** Só existe com a sheet aberta: os campos nascem do perfil atual a cada abertura. */
function Formulario({ onFechar }: { onFechar: () => void }) {
  const usuario = useSeletor((e) => e.usuario);
  const temSelos = usuario.equipados.includes("pf5");
  const entrada = useRef<HTMLInputElement>(null);
  const enviando = useRef(false);

  const [nome, setNome] = useState(usuario.nome);
  const [arroba, setArroba] = useState((usuario.arroba ?? arrobaPadrao(usuario.nome)).replace(/^@/, ""));
  const [bio, setBio] = useState(usuario.bio ?? "");
  const [foto, setFoto] = useState<string | undefined>(usuario.foto);
  const [selos, setSelos] = useState<string[]>(usuario.selosExibidos ?? SELOS.map((s) => s.nome));
  const [erroFoto, setErroFoto] = useState("");
  const [tentou, setTentou] = useState(false);

  const nomeLimpo = nome.trim().replace(/\s+/g, " ");
  const arrobaLimpo = arroba.trim().replace(/^@/, "").toLowerCase();
  const erroNome = nomeLimpo.length < 2 ? "Digite seu nome (mínimo 2 letras)." : nomeLimpo.length > 60 ? "Máximo de 60 caracteres." : "";
  const erroArroba = REGRA_ARROBA.test(arrobaLimpo) ? "" : "Use 3 a 20 caracteres: letras minúsculas, números, ponto ou _.";

  const escolherFoto = async (campo: HTMLInputElement) => {
    const arquivo = campo.files?.[0];
    campo.value = "";
    if (!arquivo) return;
    setErroFoto("");
    try {
      setFoto(await reduzirFoto(arquivo));
    } catch (e) {
      setErroFoto(e instanceof Error ? e.message : "Não foi possível usar esta imagem.");
    }
  };

  const salvar = () => {
    if (enviando.current) return;
    setTentou(true);
    if (erroNome || erroArroba) return;
    enviando.current = true;
    editarPerfil({
      nome: nomeLimpo,
      iniciais: iniciaisDe(nomeLimpo),
      arroba: `@${arrobaLimpo}`,
      bio: bio.trim() || undefined,
      foto,
      selosExibidos: selos,
    });
    onFechar();
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <Avatar nome={nomeLimpo || usuario.nome} foto={foto} tamanho="xl" />
        <div className="flex flex-wrap gap-2">
          <input ref={entrada} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-label="Escolher foto" onChange={(e) => void escolherFoto(e.target)} />
          <Button variante="secundario" tamanho="sm" onClick={() => entrada.current?.click()}>
            <Camera /> {foto ? "Trocar foto" : "Escolher foto"}
          </Button>
          {foto && (
            <Button variante="fantasma" tamanho="sm" onClick={() => setFoto(undefined)}>
              <Trash2 /> Remover
            </Button>
          )}
        </div>
      </div>
      {erroFoto ? (
        <p className="mt-1.5 text-[12px] font-medium text-alerta">{erroFoto}</p>
      ) : (
        <p className="mt-1.5 text-[12px] text-texto-2">A foto é recortada em quadrado e fica salva neste dispositivo.</p>
      )}

      <div className="mt-5 space-y-4">
        <Campo rotulo="Nome de exibição" htmlFor="ep-nome" erro={tentou && erroNome}>
          <Entrada id="ep-nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={60} autoComplete="name" />
        </Campo>

        <Campo rotulo="@usuário" htmlFor="ep-arroba" erro={tentou && erroArroba}>
          <Entrada id="ep-arroba" value={arroba} onChange={(e) => setArroba(e.target.value)} maxLength={21} autoCapitalize="none" spellCheck={false} icone={<span className="text-[14px]">@</span>} />
        </Campo>

        <Campo rotulo="Bio" htmlFor="ep-bio" dica={`${bio.length}/${MAX_BIO}`}>
          <AreaTexto id="ep-bio" value={bio} onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO))} maxLength={MAX_BIO} rows={3} className="min-h-20" placeholder="Conte algo sobre você" />
        </Campo>

        <div>
          <p className="text-[13px] font-medium text-tinta">Selos exibidos</p>
          {temSelos ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {SELOS.map(({ icone: Icone, nome: n }) => {
                const ativo = selos.includes(n);
                return (
                  <li key={n}>
                    <button
                      type="button"
                      aria-pressed={ativo}
                      onClick={() => setSelos((s) => (ativo ? s.filter((x) => x !== n) : [...s, n]))}
                      className={cn(
                        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] transition-colors duration-150 active:scale-[0.98] toque:min-h-11",
                        ativo ? "border-tinta bg-tinta text-superficie" : "border-borda text-texto-2 hover:bg-superficie-2 hover:text-tinta",
                      )}
                    >
                      <Icone className="size-3.5" aria-hidden /> {n}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-1 text-[12.5px] text-texto-2">Os selos do CEPI ficam disponíveis com o item &quot;Selos do CEPI no perfil&quot;, na Loja.</p>
          )}
        </div>
      </div>

      <RodapeSheet>
        <Button variante="secundario" tamanho="lg" className="flex-1" onClick={onFechar}>
          Cancelar
        </Button>
        <Button tamanho="lg" className="flex-1" onClick={salvar}>
          Salvar
        </Button>
      </RodapeSheet>
    </>
  );
}
