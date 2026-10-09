"use client";

import { ArrowDown, ArrowRight, GraduationCap, Presentation, Repeat2, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Segmentado } from "@/components/ui/Segmentado";
import { Sheet } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { useSimulacao } from "@/hooks/useConexao";
import { entrarComoDemo, useSessao, type PapelSessao } from "@/lib/auth";
import { definirSimulacao, limparSimulacoes, SIMULACOES, type Simulacao } from "@/lib/simulacoes";
import { resetarDemonstracao } from "@/store/actions";

interface Passo {
  href: string;
  titulo: string;
  como: string;
  /** Em vez de abrir uma tela, leva à seção “Simular falhas” deste roteiro. */
  simulacoes?: boolean;
}

const ID_SIMULAR = "simular-falhas";

/** Roteiro sugerido para apresentar o portal (banca / sala de aula). Só aparece no modo apresentação. */
const ROTEIRO: Record<PapelSessao, Passo[]> = {
  aluno: [
    { href: "/estudos", titulo: "Sala de estudos com métricas", como: "Estudos → Iniciar foco → “Avançar 5 min” até fechar o ciclo (modo apresentação). Veja os pontos e a meta do dia subirem." },
    { href: "/estudos/salas/sala-revisao-mat", titulo: "Sala coletiva ao vivo", como: "Entre na revisão de Matemática: timer sincronizado com a turma, chat e presença." },
    { href: "/campeonatos/copa-matematica", titulo: "Campeonato mata-mata", como: "Copa CEPI de Matemática → Jogar a semifinal (duelo de quiz com tempo)." },
    { href: "/ranking", titulo: "Modo invisível no ranking", como: "Ranking → Visibilidade → Invisível. A aluna sai dos rankings e só ela vê a própria posição." },
    { href: "/missoes#atividades", titulo: "Entregar atividade", como: "Missões → Lista 7 → Entregar. Depois troque para o professor e corrija." },
    { href: "/feed", titulo: "Dúvida com busca semântica", como: "Início → caixa de publicação → Dúvida → digite 15+ caracteres e veja dúvidas parecidas." },
    {
      href: "/feed",
      simulacoes: true,
      titulo: "Estados de erro",
      como: "Ligue as simulações em “Simular falhas”, logo abaixo, uma de cada vez: sem conexão (faixa no topo), IA indisponível (Nova publicação), busca (lupa do feed), falha ao salvar (Missões) e falha ao carregar (próxima tela).",
    },
    { href: "/loja", titulo: "Resgatar recompensa", como: "Loja → item → Confirmar troca." },
    { href: "/pessoas/lucas", titulo: "Perfil de um colega", como: "Toque em qualquer avatar ou nome: abre o perfil, com medalhas e publicações." },
  ],
  professor: [
    { href: "/professor", titulo: "Painel da turma", como: "Indicadores da turma, alunos em risco, entregas para corrigir, destaques da semana e atalhos para Dúvidas, Moderação, Salas e Campeonatos." },
    { href: "/professor/atividades/at-lista7", titulo: "Corrigir entrega", como: "Lista 7 → entrega da Ana → nota e comentário. Os pontos chegam para ela na hora." },
    { href: "/professor/alunos", titulo: "Atribuir pontos", como: "Alunos → selecione → Dar pontos/XP com motivo registrado." },
    { href: "/professor/atividades", titulo: "Publicar atividade", como: "Nova atividade → turma 9º A. Veja os alunos entregando ao vivo." },
    { href: "/estudos/salas", titulo: "Abrir sala oficial", como: "Salas → Criar sala. A turma é avisada por notificação." },
    { href: "/campeonatos", titulo: "Criar/iniciar campeonato", como: "Crie um campeonato ou inicie o Desafio Relâmpago de Química." },
    { href: "/feed", titulo: "Feed da escola", como: "Publique um aviso para o 9º A (a turma recebe a notificação), responda uma dúvida (vira resposta oficial) e remova uma publicação de aluno em “Mais opções”." },
    { href: "/professor/moderacao", titulo: "Moderação humana", como: "Publicações sinalizadas pela triagem: liberar ou remover." },
  ],
};

/** Uma linha de “Simular falhas”: nome, onde aparece e a chave que liga/desliga. */
function LinhaSimulacao({ id, rotulo, descricao }: { id: Simulacao; rotulo: string; descricao: string }) {
  const ativa = useSimulacao(id);
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-medium text-tinta">{rotulo}</span>
        <span className="mt-0.5 block text-[12px] leading-snug text-texto-2">{descricao}</span>
      </span>
      <Switch ativo={ativa} onChange={(v) => definirSimulacao(id, v)} rotulo={`Simular: ${rotulo}`} />
    </li>
  );
}

/** Liga falhas de mentira para mostrar os estados de erro da interface (só no modo apresentação). */
function SimularFalhas() {
  return (
    <section className="mt-6" aria-labelledby={ID_SIMULAR}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 id={ID_SIMULAR} className="text-[14px] font-semibold text-tinta">
          Simular falhas
        </h3>
        <button type="button" onClick={limparSimulacoes} className="relative text-[12px] font-medium text-texto-2 underline-offset-4 hover:text-tinta hover:underline toque:py-3">
          Desligar todas
        </button>
      </div>
      <p className="mt-0.5 text-[12px] text-texto-2">Só valem com o modo apresentação ligado; nada é perdido nem enviado de verdade.</p>
      <ul className="mt-1 divide-y divide-borda">
        {SIMULACOES.map((s) => (
          <LinhaSimulacao key={s.id} {...s} />
        ))}
      </ul>
    </section>
  );
}

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
          const corpo = (
            <>
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-superficie-2 text-[12px] font-medium text-texto-2 ring-1 ring-borda">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-medium text-tinta">{p.titulo}</span>
                <span className="mt-0.5 block text-[12px] leading-snug text-texto-2">{p.como}</span>
              </span>
              {p.simulacoes ? (
                <ArrowDown className="mt-1 size-4 shrink-0 text-texto-2 transition-transform group-hover:translate-y-0.5" />
              ) : (
                <ArrowRight className="mt-1 size-4 shrink-0 text-texto-2 transition-transform group-hover:translate-x-0.5" />
              )}
            </>
          );
          return (
            <li key={p.titulo}>
              {p.simulacoes ? (
                <button
                  type="button"
                  onClick={() => document.getElementById(ID_SIMULAR)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="group flex w-full gap-3 rounded-xl p-3 text-left transition-colors hover:bg-superficie-2"
                >
                  {corpo}
                </button>
              ) : (
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
                  {corpo}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
      <SimularFalhas />
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
