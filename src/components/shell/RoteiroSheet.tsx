"use client";

import { ArrowRight, GraduationCap, Presentation, Repeat2, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Segmentado } from "@/components/ui/Segmentado";
import { Sheet } from "@/components/ui/Sheet";
import { entrarComoDemo, useSessao, type PapelSessao } from "@/lib/auth";
import { resetarDemonstracao } from "@/store/actions";

interface Passo {
  href: string;
  titulo: string;
  como: string;
}

/** Roteiro sugerido para apresentar o portal (banca / sala de aula). Só aparece no modo apresentação. */
const ROTEIRO: Record<PapelSessao, Passo[]> = {
  aluno: [
    { href: "/estudos", titulo: "Sala de estudos com métricas", como: "Estudos → Iniciar foco → “Avançar 5 min” até fechar o ciclo. Veja pontos, meta do dia e o Interclasses virar." },
    { href: "/estudos/salas/sala-revisao-mat", titulo: "Sala coletiva ao vivo", como: "Entre na revisão de Matemática: timer sincronizado com a turma, chat e presença." },
    { href: "/campeonatos/copa-matematica", titulo: "Campeonato mata-mata", como: "Copa CEPI de Matemática → Jogar a semifinal (duelo de quiz com tempo)." },
    { href: "/ranking", titulo: "Modo invisível no ranking", como: "Ranking → Visibilidade → Invisível. A aluna sai dos rankings e só ela vê a própria posição." },
    { href: "/missoes#atividades", titulo: "Entregar atividade", como: "Missões → Lista 7 → Entregar. Depois troque para o professor e corrija." },
    { href: "/feed", titulo: "Dúvida com busca semântica", como: "Início → caixa de publicação → Dúvida → digite 15+ caracteres e veja dúvidas parecidas." },
    { href: "/loja", titulo: "Resgatar recompensa", como: "Loja → item → Confirmar troca." },
    { href: "/pessoas/lucas", titulo: "Perfil de um colega", como: "Toque em qualquer avatar ou nome: abre o perfil, com medalhas e publicações." },
  ],
  professor: [
    { href: "/professor", titulo: "Painel da turma", como: "Engajamento da semana, alunos em risco e entregas a corrigir." },
    { href: "/professor/atividades/at-lista7", titulo: "Corrigir entrega", como: "Lista 7 → entrega da Ana → nota e comentário. Os pontos chegam para ela na hora." },
    { href: "/professor/alunos", titulo: "Atribuir pontos", como: "Alunos → selecione → Dar pontos/XP com motivo registrado." },
    { href: "/professor/atividades", titulo: "Publicar atividade", como: "Nova atividade → turma 9º A. Veja os alunos entregando ao vivo." },
    { href: "/estudos/salas", titulo: "Abrir sala oficial", como: "Salas → Criar sala. A turma é avisada por notificação." },
    { href: "/campeonatos", titulo: "Criar/iniciar campeonato", como: "Crie um campeonato ou inicie o Desafio Relâmpago de Química." },
    { href: "/professor/moderacao", titulo: "Moderação humana", como: "Publicações sinalizadas pela triagem: liberar ou remover." },
  ],
};

export function RoteiroSheet({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const sessao = useSessao();
  const router = useRouter();
  const [aba, setAba] = useState<PapelSessao>(sessao?.papel ?? "aluno");
  const outro: PapelSessao = sessao?.papel === "professor" ? "aluno" : "professor";

  const trocar = () => {
    onFechar();
    router.push(entrarComoDemo(outro));
  };

  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo="Roteiro de apresentação" subtitulo="Sugestão de ordem para apresentar o portal" largura="lg">
      <Segmentado
        grupo="roteiro"
        rotulo="Papel"
        valor={aba}
        onChange={setAba}
        opcoes={[
          { id: "aluno", rotulo: <><GraduationCap /> Aluno</> },
          { id: "professor", rotulo: <><Presentation /> Professor</> },
        ]}
      />
      <ol className="-mx-3 mt-3 space-y-0.5">
        {ROTEIRO[aba].map((p, i) => {
          const precisaTrocar = sessao?.papel !== aba;
          return (
            <li key={p.titulo}>
              <Link
                href={precisaTrocar ? "#" : p.href}
                onClick={(e) => {
                  onFechar();
                  if (precisaTrocar) {
                    e.preventDefault();
                    entrarComoDemo(aba);
                    router.push(p.href);
                  }
                }}
                className="group flex gap-3 rounded-xl p-3 transition-colors hover:bg-superficie-2"
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-superficie-2 text-[12px] font-medium text-texto-2 ring-1 ring-borda">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-medium text-tinta">{p.titulo}</span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-texto-2">{p.como}</span>
                </span>
                <ArrowRight className="mt-1 size-4 shrink-0 text-texto-2 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          );
        })}
      </ol>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Button variante="escuro" onClick={trocar}>
          <Repeat2 /> Ver como {outro === "professor" ? "professor" : "aluno"}
        </Button>
        <Button
          variante="secundario"
          onClick={() => {
            resetarDemonstracao();
            onFechar();
          }}
        >
          <RotateCcw /> Reiniciar dados da demo
        </Button>
      </div>
      <p className="mt-3 text-center text-[11.5px] text-texto-2">
        Aluno e professor compartilham os dados neste navegador — o que um faz, o outro vê.
      </p>
    </Sheet>
  );
}
