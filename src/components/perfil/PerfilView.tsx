"use client";

import { Coins, EyeOff, Flame, Megaphone, RotateCcw, Sparkles, Tag } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { TituloPagina, TituloSecao } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DisciplinaIcon } from "@/components/ui/DisciplinaIcon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Switch } from "@/components/ui/Switch";
import { DISCIPLINAS } from "@/data/escola";
import { ITENS } from "@/data/loja";
import { MEDALHAS } from "@/data/medalhas";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/format";
import { nivelDe } from "@/lib/gamificacao";
import { equipar, ocultarRanking, resetarDemonstracao } from "@/store/actions";
import { useEstado } from "@/store/store";
import { ItemVisual } from "@/components/loja/ItemVisual";
import { MedalhasGrade } from "./MedalhasGrade";

const FIGURINHAS = ["🦉", "🔬", "🤖", "📚", "⚽", "🌱"];

/** Aba 5 — Perfil: estatísticas, medalhas, desempenho e privacidade. */
export function PerfilView() {
  const { usuario, sequencia, medalhas, compras, relatos } = useEstado();
  const nivel = nivelDe(usuario.xp);
  const eq = new Set(usuario.equipados);
  const conquistadas = medalhas.filter((m) => m.desbloqueadaEm).length;
  const cosmeticos = ITENS.filter((i) => i.slot !== "voucher" && compras.some((c) => c.itemId === i.id));
  const [confirmarReset, setConfirmarReset] = useState(false);

  const capa = eq.has("pf2") ? "tema-bosque" : eq.has("pf3") ? "capa-pautada" : "bg-linear-to-br from-verde-claro via-verde-mclaro to-white";

  return (
    <div className="space-y-6">
      <TituloPagina titulo="Seu perfil" descricao="Conquistas, desempenho e preferências" />

      {/* Cabeçalho do aluno */}
      <Card semPadding className="overflow-hidden">
        <div className={cn("relative h-24", capa)}>
          {eq.has("pf5") && (
            <div className="absolute right-3 top-2 flex gap-1 text-lg">
              {FIGURINHAS.map((f, i) => (
                <motion.span key={f} initial={{ y: -10, opacity: 0, rotate: -20 }} animate={{ y: 0, opacity: 1, rotate: (i % 2 ? 1 : -1) * 8 }} transition={{ delay: i * 0.06 }}>
                  {f}
                </motion.span>
              ))}
            </div>
          )}
        </div>
        <div className="px-4 pb-4">
          <div className="-mt-10 flex items-end justify-between">
            <span className="rounded-full bg-white p-1.5 shadow-card">
              <Avatar nome={usuario.nome} tamanho="xl" equipados={usuario.equipados} />
            </span>
            <Badge tom="claro" className="mb-1">
              <Sparkles /> Nível {nivel.n} – {nivel.titulo}
            </Badge>
          </div>
          <p className={cn("mt-2 text-tinta", eq.has("pf4") ? "font-manuscrita text-[30px] leading-none" : "text-xl font-extrabold")}>{usuario.nome}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-texto-2">
              {usuario.turma} · Ensino Fundamental II
            </span>
            {eq.has("pf1") && (
              <Badge tom="azul">
                <Tag /> Turma 9º A
              </Badge>
            )}
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-texto-2">Próximo nível</span>
              <b className="tabular-nums text-tinta">
                {fmt(usuario.xp)} / {nivel.proximo ? fmt(nivel.proximo.min) : "—"} XP
              </b>
            </div>
            <ProgressBar valor={nivel.pct} rotulo="Progresso para o próximo nível" />
            <p className="mt-2 text-[12px] leading-snug text-texto-2">
              {nivel.proximo ? (
                <>
                  Faltam <b className="text-verde">{fmt(nivel.falta)} XP</b> para o nível {nivel.proximo.n} — {nivel.proximo.titulo}. XP vem de respostas úteis,
                  flashcards, missões e desafios.
                </>
              ) : (
                "Você chegou ao nível máximo."
              )}
            </p>
          </div>
        </div>
      </Card>

      {/* Consolidado de métricas */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { icone: <Sparkles className="size-4" />, valor: usuario.xp, rotulo: "XP total", cor: "bg-verde-claro text-verde" },
          { icone: <Coins className="size-4" />, valor: usuario.pontos, rotulo: "Pontos na loja", cor: "bg-verde-claro text-verde" },
          { icone: <Flame className="size-4" />, valor: sequencia.dias, rotulo: "Dias seguidos", cor: "bg-amber-50 text-ambar" },
        ].map((m) => (
          <Card key={m.rotulo} className="p-3">
            <span className={cn("grid size-8 place-items-center rounded-xl", m.cor)}>{m.icone}</span>
            <AnimatedNumber valor={m.valor} className="mt-2 block text-lg font-extrabold text-tinta" />
            <span className="text-[11px] text-texto-2">{m.rotulo}</span>
          </Card>
        ))}
      </div>

      <section>
        <TituloSecao extra={`${conquistadas} de ${MEDALHAS.length} conquistadas`}>Medalhas</TituloSecao>
        <MedalhasGrade />
      </section>

      <section>
        <TituloSecao extra="Flashcards, desafios e missões">Progresso por disciplina</TituloSecao>
        <Card className="space-y-3.5">
          {DISCIPLINAS.map((d) => {
            const v = usuario.dominio[d];
            const status = v >= 70 ? "forte" : v >= 50 ? "em progresso" : "pede atenção";
            return (
              <div key={d}>
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <span className="flex items-center gap-2 font-semibold text-tinta">
                    <DisciplinaIcon disciplina={d} className="size-4 text-verde-2" /> {d}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className={cn("text-[11px]", v < 50 ? "text-ambar" : "text-texto-2")}>{status}</span>
                    <b className="w-9 text-right tabular-nums text-verde">{v}%</b>
                  </span>
                </div>
                <ProgressBar valor={v} fina tom={v < 50 ? "ambar" : v < 70 ? "suave" : "verde"} rotulo={`Domínio em ${d}`} />
              </div>
            );
          })}
        </Card>
      </section>

      {cosmeticos.length > 0 && (
        <section>
          <TituloSecao extra="Itens da Loja">Personalização</TituloSecao>
          <Card semPadding className="divide-y divide-borda">
            {cosmeticos.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <ItemVisual icone={item.icone} raridade={item.raridade} className="size-10 shrink-0 rounded-xl" tamanhoIcone="size-5" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-tinta">{item.nome}</p>
                  <p className="text-[11px] text-texto-2">{eq.has(item.id) ? "Equipado" : "Guardado"}</p>
                </div>
                <Switch ativo={eq.has(item.id)} onChange={(v) => equipar(item.id, v)} rotulo={`Equipar ${item.nome}`} />
              </div>
            ))}
          </Card>
        </section>
      )}

      <section>
        <TituloSecao>Privacidade</TituloSecao>
        <Card semPadding className="divide-y divide-borda">
          <div className="flex items-start gap-3 px-4 py-3.5">
            <EyeOff className="mt-0.5 size-5 shrink-0 text-verde-2" />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-tinta">Ocultar minha posição pública</p>
              <p className="mt-0.5 text-[12px] leading-snug text-texto-2">
                {usuario.ocultarRanking
                  ? "Os colegas veem “Aluno anônimo” no seu lugar do ranking. Seu XP continua crescendo."
                  : "Seu nome aparece no ranking da liga, da turma e por disciplina."}
              </p>
            </div>
            <Switch ativo={usuario.ocultarRanking} onChange={ocultarRanking} rotulo="Ocultar minha posição pública" />
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Megaphone className="size-5 shrink-0 text-verde-2" />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-tinta">Seus relatos à escola</p>
              <p className="text-[12px] text-texto-2">
                {relatos.length} {relatos.length === 1 ? "relato enviado" : "relatos enviados"} · {relatos.filter((r) => r.status === "validado").length} validados
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section className="rounded-2xl border border-dashed border-verde-suave p-4 text-center">
        <p className="text-[12.5px] leading-snug text-texto-2">
          Protótipo do Portal do Aluno — Squad 38. Os dados ficam salvos neste navegador para a demonstração continuar de onde parou.
        </p>
        {confirmarReset ? (
          <div className="mt-3 flex justify-center gap-2">
            <Button variante="secundario" tamanho="sm" onClick={() => setConfirmarReset(false)}>
              Cancelar
            </Button>
            <Button
              variante="perigo"
              tamanho="sm"
              onClick={() => {
                resetarDemonstracao();
                setConfirmarReset(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Sim, reiniciar tudo
            </Button>
          </div>
        ) : (
          <Button variante="fantasma" tamanho="sm" className="mt-2" onClick={() => setConfirmarReset(true)}>
            <RotateCcw /> Reiniciar demonstração
          </Button>
        )}
      </section>
    </div>
  );
}
