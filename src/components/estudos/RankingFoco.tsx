"use client";

import { Eye, EyeOff, VenetianMask } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { TituloSecao } from "@/components/ui/Blocos";
import { Card } from "@/components/ui/Card";
import { LinkPessoa } from "@/components/ui/LinkPessoa";
import { Segmentado } from "@/components/ui/Segmentado";
import { cn } from "@/lib/cn";
import { formatarMinutos, inicioDaSemana, minutosEntre, montarRankingFoco, type EscopoFoco, type LinhaFoco, type ResumoEstudos } from "@/lib/estudos";
import { primeiroNome } from "@/lib/format";
import { somarDias } from "@/lib/tempo";
import { definirPrivacidade } from "@/store/actions";
import { useEstado } from "@/store/store";
import type { Privacidade, SessaoEstudo } from "@/store/types";
import { turmaCurta } from "./formato";

const VISIBILIDADE = [
  {
    id: "publico",
    rotulo: (
      <>
        <Eye /> Público
      </>
    ),
    aria: "Público",
  },
  {
    id: "anonimo",
    rotulo: (
      <>
        <VenetianMask /> Anônimo
      </>
    ),
    aria: "Anônimo",
  },
  {
    id: "sombra",
    rotulo: (
      <>
        <EyeOff /> Invisível
      </>
    ),
    aria: "Modo invisível",
  },
] as const;

const DESCRICAO: Record<Privacidade, string> = {
  publico: "Os colegas veem seu nome, seu avatar e seus minutos de foco.",
  anonimo: "Você aparece como “Aluno anônimo”; a posição continua valendo.",
  sombra: "Você não aparece nos rankings; só você vê sua posição.",
};

const MOLA = { type: "spring", stiffness: 500, damping: 45 } as const;

/**
 * Ranking de foco (minutos na semana) com o controle de visibilidade.
 * No modo invisível (valor interno "sombra") a aluna sai da lista pública e vê
 * só um aviso com a própria posição e a comparação com a semana passada.
 */
export function RankingFoco({ agora, resumo, className }: { agora: number; resumo: ResumoEstudos; className?: string }) {
  const estado = useEstado();
  const { usuario } = estado;
  const [escopo, setEscopo] = useState<EscopoFoco>("turma");
  const r = montarRankingFoco(estado, escopo, agora);
  const anonimo = usuario.privacidade === "anonimo";
  const escola = escopo === "escola";
  const top = r.linhas.slice(0, 5);
  const eu = r.linhas.find((l) => l.eu);
  const euForaDoTop = !!eu && !top.some((l) => l.eu);
  const ondeEstou = escola ? "na escola" : `no ${turmaCurta(usuario.turma)}`;

  return (
    <Card semPadding className={cn("p-5", className)}>
      <TituloSecao
        className="mb-1"
        extra={
          <Link href="/ranking" className="alvo-toque rounded font-medium text-acento hover:underline">
            Ver tudo
          </Link>
        }
      >
        Ranking de foco
      </TituloSecao>
      <p className="text-[13px] text-texto-2">Minutos de foco nesta semana</p>

      <Segmentado
        className="mt-3"
        tamanho="sm"
        grupo="escopo-foco"
        rotulo="Escopo do ranking de foco"
        opcoes={[
          { id: "turma", rotulo: `Turma · ${turmaCurta(usuario.turma)}` },
          { id: "escola", rotulo: "Escola toda" },
        ]}
        valor={escopo}
        onChange={setEscopo}
      />

      <AnimatePresence mode="wait" initial={false}>
        {r.sombra ? (
          <AvisoInvisivel key="invisivel" posicao={r.minhaPosicao} total={r.total} onde={ondeEstou} sessoes={estado.estudos.sessoes} agora={agora} semanaMin={resumo.semanaMin} />
        ) : (
          <MinhaPosicao key="publico" linhas={r.linhas} posicao={r.minhaPosicao} total={r.total} minutos={r.meusMinutos} escola={escola} />
        )}
      </AnimatePresence>

      <ol className="-mx-5 mt-2 divide-y divide-borda border-y border-borda" aria-label={`Top 5 de foco ${ondeEstou}`}>
        {top.map((l) => (
          <Linha key={l.id} linha={l} anonimo={anonimo} equipados={usuario.equipados} escola={escola} />
        ))}
        {euForaDoTop && eu && (
          <>
            <li aria-hidden className="py-0.5 text-center text-[12px] leading-4 tracking-[0.3em] text-texto-2">
              ···
            </li>
            <Linha linha={eu} anonimo={anonimo} equipados={usuario.equipados} escola={escola} />
          </>
        )}
      </ol>

      <Visibilidade valor={usuario.privacidade} />
    </Card>
  );
}

function MinhaPosicao({ linhas, posicao, total, minutos, escola }: { linhas: LinhaFoco[]; posicao: number; total: number; minutos: number; escola: boolean }) {
  const acima = linhas[posicao - 2];
  const falta = acima ? acima.minutos - minutos + 1 : 0;
  return (
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="mt-3 text-[13px] leading-snug text-texto-2">
      Você está em{" "}
      <b className="font-medium text-tinta tabular-nums">
        {posicao}º de {total}
      </b>
      {acima ? (
        <>
          {" "}
          · faltam <b className="font-medium text-tinta tabular-nums">{formatarMinutos(falta)}</b> para passar {primeiroNome(acima.nome)}
          {escola ? ` (${turmaCurta(acima.turma)})` : ""}
        </>
      ) : (
        " · liderando"
      )}
    </motion.p>
  );
}

/** Aviso discreto do modo invisível: posição só para a aluna + ritmo em relação à semana passada. */
function AvisoInvisivel({ posicao, total, onde, sessoes, agora, semanaMin }: { posicao: number; total: number; onde: string; sessoes: SessaoEstudo[]; agora: number; semanaMin: number }) {
  const semana = inicioDaSemana(agora);
  const passada = somarDias(semana, -7);
  // Mesmo ponto da semana passada (segunda 00:00 + o tempo já decorrido desta semana).
  const mesmoPonto = minutosEntre(sessoes, passada, passada + (agora - semana));
  const pct = mesmoPonto ? Math.abs(Math.round((semanaMin / mesmoPonto - 1) * 100)) : 0;
  const ritmo = !mesmoPonto
    ? semanaMin
      ? `${formatarMinutos(semanaMin)} a mais que no mesmo ponto da semana passada.`
      : null
    : semanaMin > mesmoPonto
      ? `${pct}% à frente do seu ritmo da semana passada.`
      : semanaMin < mesmoPonto
        ? `${pct}% atrás do seu ritmo da semana passada.`
        : "No mesmo ritmo da semana passada.";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      role="status"
      className="mt-3 flex gap-2.5 rounded-xl border border-borda bg-superficie-2 px-3 py-2.5 text-[13px] leading-snug text-texto-2"
    >
      <EyeOff className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>
        Você está invisível nos rankings. Sua posição:{" "}
        <b className="font-medium text-tinta tabular-nums">
          {posicao}º de {total}
        </b>{" "}
        {onde}.{ritmo && <span className="mt-0.5 block">{ritmo}</span>}
      </p>
    </motion.div>
  );
}

function Linha({ linha, anonimo, equipados, escola }: { linha: LinhaFoco; anonimo: boolean; equipados: string[]; escola: boolean }) {
  const oculto = linha.eu && anonimo;
  const nome = linha.eu ? (anonimo ? "Aluno anônimo · você" : "Você") : linha.nome;
  return (
    <motion.li
      layout="position"
      transition={MOLA}
      className={cn("flex items-center gap-3 px-5 py-2.5", linha.eu && "bg-verde-mclaro")}
      aria-current={linha.eu || undefined}
    >
      <span className="w-5 shrink-0 text-center text-[13px] font-medium text-texto-2 tabular-nums">{linha.posicao}</span>
      {oculto ? (
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-superficie-2 text-texto-2 ring-1 ring-borda">
          <VenetianMask className="size-4" aria-hidden />
        </span>
      ) : (
        <LinkPessoa id={linha.id} rotulo={`Perfil de ${nome}`} className="shrink-0">
          <Avatar nome={linha.nome} tamanho="sm" equipados={linha.eu ? equipados : []} />
        </LinkPessoa>
      )}
      <p className="flex min-w-0 flex-1 items-baseline gap-1.5 text-[14px]">
        {oculto ? (
          <span className="truncate font-medium text-tinta">{nome}</span>
        ) : (
          <LinkPessoa id={linha.id} className="min-w-0 truncate font-medium text-tinta hover:underline">
            {nome}
          </LinkPessoa>
        )}
        {escola && <span className="shrink-0 text-[12px] text-texto-2">{turmaCurta(linha.turma)}</span>}
      </p>
      <span className="shrink-0 text-[13px] font-medium text-tinta tabular-nums">{formatarMinutos(linha.minutos)}</span>
    </motion.li>
  );
}

function Visibilidade({ valor }: { valor: Privacidade }) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-[13px] font-medium text-tinta">Quem vê você nos rankings</p>
      <Segmentado tamanho="sm" grupo="privacidade-foco" rotulo="Visibilidade nos rankings" opcoes={VISIBILIDADE} valor={valor} onChange={definirPrivacidade} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={valor}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.15 }}
          className="mt-2 text-[12px] leading-snug text-texto-2"
        >
          {DESCRICAO[valor]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
