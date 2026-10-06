"use client";

import { Download, Lock } from "lucide-react";
import { m as motion } from "motion/react";
import { useState } from "react";
import { Nota } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { RodapeSheet } from "@/components/ui/RodapeSheet";
import { Sheet } from "@/components/ui/Sheet";
import { ESCOLA } from "@/data/escola";
import { MEDALHAS, type MedalhaDef } from "@/data/medalhas";
import { cn } from "@/lib/cn";
import { progressoMedalha } from "@/lib/gamificacao";
import { baixarArquivo, gerarPdfDocumento } from "@/lib/pdf";
import { dataCurta } from "@/lib/tempo";
import { useEstado } from "@/store/store";
import { MedalhaIcone } from "./MedalhaIcone";

function baixarCertificado(medalha: MedalhaDef, nome: string, em: number) {
  const data = new Date(em).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
  const { blob } = gerarPdfDocumento({
    escola: ESCOLA.nome,
    titulo: "Certificado de medalha",
    subtitulo: medalha.nome,
    blocos: [
      { tipo: "paragrafo", texto: `Certificamos que ${nome} conquistou a medalha "${medalha.nome}" no Portal do Aluno do ${ESCOLA.nome}.` },
      { tipo: "quadro", titulo: "Critério da medalha", texto: medalha.criterio },
      { tipo: "tabela", colunas: ["Aluno(a)", "Medalha", "Conquistada em"], linhas: [[nome, medalha.nome, data]] },
      { tipo: "paragrafo", texto: `${ESCOLA.cidade} · emitido em ${new Date().toLocaleDateString("pt-BR")}.` },
    ],
  });
  baixarArquivo(blob, `certificado-${medalha.id}.pdf`);
}

/** Galeria de medalhas desbloqueáveis; o toque abre o progresso (fluxo 3.5). */
export function MedalhasGrade() {
  const estado = useEstado();
  const [aberta, setAberta] = useState<MedalhaDef | null>(null);
  const desbloqueio = (id: string) => estado.medalhas.find((m) => m.id === id)?.desbloqueadaEm;

  return (
    <>
      <ul className="grid grid-cols-4 gap-1 sm:gap-2">
        {MEDALHAS.map((m, i) => {
          const em = desbloqueio(m.id);
          const prog = progressoMedalha(m, estado);
          return (
            <motion.li key={m.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02, duration: 0.18 }}>
              <button
                type="button"
                onClick={() => setAberta(m)}
                aria-label={`Medalha ${m.nome}${em ? ", conquistada" : ", bloqueada"}`}
                className="flex h-full w-full flex-col items-center gap-1.5 rounded-xl px-1 py-2.5 text-center transition-colors duration-150 hover:bg-superficie-2"
              >
                <span
                  className={cn(
                    "relative grid size-11 place-items-center rounded-full",
                    em ? "bg-ouro-claro text-ouro" : "bg-superficie-2 text-texto-2/70 ring-1 ring-inset ring-borda",
                  )}
                >
                  <MedalhaIcone icone={m.icone} className="size-5" />
                  {!em && (
                    <span className="absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-superficie ring-1 ring-borda">
                      <Lock className="size-2.5 text-texto-2" aria-hidden />
                    </span>
                  )}
                </span>
                <span className={cn("text-[12px] leading-tight", em ? "font-medium text-tinta" : "text-texto-2")}>{m.nome}</span>
                {!em && <ProgressBar valor={prog.pct} fina className="mx-auto h-1 w-10" rotulo={`Progresso de ${m.nome}`} />}
              </button>
            </motion.li>
          );
        })}
      </ul>

      <Sheet aberto={!!aberta} onFechar={() => setAberta(null)} titulo={aberta?.nome ?? "Medalha"} subtitulo={aberta?.criterio}>
        {aberta &&
          (() => {
            const em = desbloqueio(aberta.id);
            const prog = progressoMedalha(aberta, estado);
            return (
              <>
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  className={cn(
                    "mx-auto grid size-20 place-items-center rounded-full",
                    em ? "bg-ouro-claro text-ouro" : "border border-dashed border-texto-2/40 bg-superficie-2 text-texto-2/70",
                  )}
                >
                  <MedalhaIcone icone={aberta.icone} className="size-9" />
                </motion.div>
                <p className="mt-3 text-center text-[14px] font-medium text-tinta">{em ? "Conquistada" : "Ainda bloqueada"}</p>

                <div className="mt-4 rounded-xl border border-borda bg-superficie-2 p-4">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-texto-2">{em ? "Conquistada em" : "Progresso atual"}</span>
                    <span className="font-medium tabular-nums text-tinta">{em ? dataCurta(em) : prog.texto}</span>
                  </div>
                  <ProgressBar valor={em ? 100 : prog.pct} fina className="mt-2" rotulo="Progresso de desbloqueio" />
                  <p className="mt-2 text-[13px] text-texto-2">Critério: {aberta.criterio}.</p>
                </div>

                <Nota icone={<Lock />} tom="branco" className="mt-3">
                  Medalhas vêm do mérito e ficam no seu perfil. Não podem ser compradas com pontos.
                </Nota>

                <RodapeSheet>
                  <Button tamanho="lg" className="flex-1" variante="secundario" onClick={() => setAberta(null)}>
                    Fechar
                  </Button>
                  {em && (
                    <Button tamanho="lg" className="flex-1" onClick={() => baixarCertificado(aberta, estado.usuario.nome, em)}>
                      <Download /> Baixar certificado (PDF)
                    </Button>
                  )}
                </RodapeSheet>
              </>
            );
          })()}
      </Sheet>
    </>
  );
}
