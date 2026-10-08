"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { COR_CALOR } from "@/lib/cores";
import type { CelulaMapa } from "@/lib/estudos";

/*
 * Gráficos leves (HTML/SVG puro, sem biblioteca): traços finos, pontas de 4 px
 * arredondadas apoiadas na base, 2 px de respiro entre barras, grade discreta,
 * dica (tooltip) ao passar o mouse/tocar e textos sempre nas cores de texto.
 */

function Dica({ children, visivel, className }: { children: ReactNode; visivel: boolean; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  // Mantém a dica inteira dentro da tela (celular): desloca na horizontal o que passar da borda.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !visivel) return;
    el.style.transform = "";
    const { left, right } = el.getBoundingClientRect();
    const largura = document.documentElement.clientWidth;
    const margem = 8;
    const ajuste = left < margem ? margem - left : right > largura - margem ? largura - margem - right : 0;
    if (ajuste) el.style.transform = `translateX(${Math.round(ajuste)}px)`;
  }, [visivel, children]);
  return (
    <span
      ref={ref}
      role="tooltip"
      className={cn(
        "pointer-events-none absolute z-20 whitespace-nowrap rounded-md bg-tinta px-2 py-1 text-[11px] font-medium text-superficie shadow-flutuante transition-[opacity,transform] duration-150",
        visivel ? "opacity-100" : "translate-y-1 opacity-0",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ───────────── Barras verticais ───────────── */

export interface Barra {
  chave: string | number;
  /** Rótulo do eixo X ("Seg", "12/09"). */
  rotulo: string;
  valor: number;
  /** Texto da dica ao passar o mouse. */
  dica?: string;
  destaque?: boolean;
}

interface PropsBarras {
  dados: Barra[];
  altura?: number;
  /** Linha tracejada de referência (ex.: meta diária). */
  meta?: number;
  rotuloMeta?: string;
  formatar?: (v: number) => string;
  /** Mostra só 1 a cada N rótulos do eixo X (séries longas). */
  passoRotulo?: number;
  className?: string;
  rotulo: string;
}

export function Barras({ dados, altura = 150, meta, rotuloMeta, formatar = String, passoRotulo = 1, className, rotulo }: PropsBarras) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const max = Math.max(1, meta ?? 0, ...dados.map((d) => d.valor)) * 1.08;
  return (
    <figure className={cn("w-full", className)} aria-label={rotulo}>
      <div className="relative" style={{ height: altura }} onPointerLeave={() => setAtivo(null)}>
        {/* grade: só a linha de base */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-borda" />
        {meta !== undefined && meta > 0 && (
          <div className="absolute inset-x-0 border-t border-dashed border-texto-2/40" style={{ bottom: `${(meta / max) * 100}%` }}>
            {rotuloMeta && <span className="absolute -top-4 right-0 text-[10px] font-semibold text-texto-2">{rotuloMeta}</span>}
          </div>
        )}
        <div className="absolute inset-0 flex items-end gap-[2px]">
          {dados.map((d, i) => {
            const h = (d.valor / max) * 100;
            return (
              <button
                key={d.chave}
                type="button"
                className="relative flex h-full min-w-0 flex-1 items-end justify-center outline-none"
                onPointerEnter={() => setAtivo(i)}
                onFocus={() => setAtivo(i)}
                onBlur={() => setAtivo(null)}
                aria-label={d.dica ?? `${d.rotulo}: ${formatar(d.valor)}`}
              >
                <span
                  className={cn(
                    "block w-full max-w-7 rounded-t-[4px] transition-[height,background-color,opacity] duration-500 ease-suave",
                    d.destaque ? "bg-verde" : "bg-verde/30",
                    ativo !== null && ativo !== i && "opacity-55",
                    d.valor === 0 && "bg-borda",
                  )}
                  style={{ height: d.valor === 0 ? 2 : `${Math.max(h, 1.5)}%` }}
                />
                <Dica
                  visivel={ativo === i}
                  className={cn("bottom-full mb-1", i < 2 ? "left-0" : i > dados.length - 3 ? "right-0" : "left-1/2 -translate-x-1/2")}
                >
                  {d.dica ?? `${d.rotulo} · ${formatar(d.valor)}`}
                </Dica>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-1.5 flex gap-[2px]" aria-hidden>
        {dados.map((d, i) => (
          <span key={d.chave} className={cn("min-w-0 flex-1 truncate text-center text-[10px] tabular-nums", d.destaque ? "font-bold text-tinta" : "text-texto-2")}>
            {i % passoRotulo === 0 || d.destaque ? d.rotulo : ""}
          </span>
        ))}
      </div>
    </figure>
  );
}

/* ───────────── Barras horizontais (ranking de categorias) ───────────── */

export interface BarraH {
  chave: string;
  rotulo: ReactNode;
  valor: number;
  /** Cor da marca (identidade da categoria). O texto nunca usa essa cor. */
  cor?: string;
  valorTexto?: string;
}

export function BarrasHorizontais({ dados, className, rotulo }: { dados: BarraH[]; className?: string; rotulo: string }) {
  const max = Math.max(1, ...dados.map((d) => d.valor));
  return (
    <ul className={cn("space-y-2.5", className)} aria-label={rotulo}>
      {dados.map((d) => (
        <li key={d.chave} className="grid grid-cols-[minmax(0,7.5rem)_1fr_auto] items-center gap-3 text-[12.5px]">
          <span className="flex min-w-0 items-center gap-2 truncate font-semibold text-tinta">
            {d.cor && <i className="size-2.5 shrink-0 rounded-[3px]" style={{ background: d.cor }} />}
            <span className="truncate">{d.rotulo}</span>
          </span>
          <span className="h-1.5 overflow-hidden rounded-full bg-borda/70">
            <span className="block h-full rounded-full transition-[width] duration-700 ease-suave" style={{ width: `${(d.valor / max) * 100}%`, background: d.cor ?? "var(--color-verde-2)" }} />
          </span>
          <span className="w-14 text-right font-bold tabular-nums text-texto">{d.valorTexto ?? d.valor}</span>
        </li>
      ))}
    </ul>
  );
}

/* ───────────── Mapa de calor (constância) ───────────── */

const DIAS = ["Seg", "", "Qua", "", "Sex", "", "Dom"];

export function MapaDeCalor({ semanas, formatar, className }: { semanas: CelulaMapa[][]; formatar: (c: CelulaMapa) => string; className?: string }) {
  const [ativa, setAtiva] = useState<string | null>(null);
  const meses = semanas.map((s, i) => {
    const mes = new Date(s[0].dia).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
    const anterior = i > 0 ? new Date(semanas[i - 1][0].dia).getMonth() : -1;
    return new Date(s[0].dia).getMonth() !== anterior ? mes : "";
  });
  return (
    // Células de no máximo ~22 px: com poucas semanas o mapa fica compacto em vez de esticar.
    <figure className={cn("w-full", className)} style={{ maxWidth: semanas.length * 25 + 28 }} aria-label="Mapa de calor dos dias de estudo">
      <div className="flex gap-1.5">
        <div className="grid shrink-0 grid-rows-7 gap-[3px] pt-4 text-[9.5px] text-texto-2" aria-hidden>
          {DIAS.map((d, i) => (
            <span key={i} className="flex h-full items-center leading-none">
              {d}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 grid h-3 gap-[3px] text-[9.5px] capitalize text-texto-2" style={{ gridTemplateColumns: `repeat(${semanas.length}, minmax(0, 1fr))` }} aria-hidden>
            {meses.map((m, i) => (
              <span key={i} className="overflow-visible whitespace-nowrap leading-none">
                {m}
              </span>
            ))}
          </div>
          <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${semanas.length}, minmax(0, 1fr))` }} onPointerLeave={() => setAtiva(null)}>
            {semanas.map((semana, w) => (
              <div key={w} className="grid grid-rows-7 gap-[3px]">
                {semana.map((c) => {
                  const id = `${w}-${c.dia}`;
                  return (
                    <span
                      key={c.dia}
                      className={cn("relative aspect-square rounded-[3px]", c.futuro && "opacity-0")}
                      style={{ background: COR_CALOR[c.nivel] }}
                      onPointerEnter={() => !c.futuro && setAtiva(id)}
                      aria-label={c.futuro ? undefined : formatar(c)}
                    >
                      <Dica visivel={ativa === id} className={cn("bottom-full mb-1", w > semanas.length / 2 ? "right-0" : "left-0")}>
                        {formatar(c)}
                      </Dica>
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="mt-2 flex items-center justify-end gap-1 text-[10px] text-texto-2">
        menos
        {COR_CALOR.map((c) => (
          <i key={c} className="size-2.5 rounded-[3px]" style={{ background: c }} />
        ))}
        mais
      </figcaption>
    </figure>
  );
}

/* ───────────── Linha fina (tendência) ───────────── */

export function Sparkline({ valores, largura = 120, altura = 36, cor = "var(--color-verde-2)", className }: { valores: number[]; largura?: number; altura?: number; cor?: string; className?: string }) {
  if (valores.length < 2) return null;
  const max = Math.max(1, ...valores);
  const passo = largura / (valores.length - 1);
  const pontos = valores.map((v, i) => [i * passo, altura - 3 - (v / max) * (altura - 6)] as const);
  const linha = pontos.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${linha} L${largura},${altura} L0,${altura} Z`;
  const [ux, uy] = pontos[pontos.length - 1];
  return (
    <svg width={largura} height={altura} viewBox={`0 0 ${largura} ${altura}`} className={className} aria-hidden>
      <path d={area} fill={cor} opacity={0.12} />
      <path d={linha} fill="none" stroke={cor} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={ux} cy={uy} r={3} fill={cor} stroke="var(--color-superficie)" strokeWidth={2} />
    </svg>
  );
}

/* ───────────── Rosca (proporção de um todo) ───────────── */

export interface Fatia {
  chave: string;
  rotulo: string;
  valor: number;
  cor: string;
}

export function Rosca({ fatias, tamanho = 148, espessura = 16, children, rotulo }: { fatias: Fatia[]; tamanho?: number; espessura?: number; children?: ReactNode; rotulo: string }) {
  const [ativa, setAtiva] = useState<string | null>(null);
  const total = fatias.reduce((s, f) => s + f.valor, 0) || 1;
  const r = (tamanho - espessura) / 2;
  const c = 2 * Math.PI * r;
  const respiro = fatias.length > 1 ? 2 : 0;
  // Início de cada fatia no contorno (soma das anteriores).
  const inicios = fatias.map((_, i) => fatias.slice(0, i).reduce((s, f) => s + (f.valor / total) * c, 0));
  return (
    <div className="relative inline-grid shrink-0 place-items-center" style={{ width: tamanho, height: tamanho }} role="img" aria-label={rotulo} onPointerLeave={() => setAtiva(null)}>
      <svg width={tamanho} height={tamanho} className="absolute inset-0 -rotate-90" aria-hidden>
        {fatias.map((f, i) => {
          const tam = (f.valor / total) * c;
          const offset = -inicios[i];
          return (
            <circle
              key={f.chave}
              cx={tamanho / 2}
              cy={tamanho / 2}
              r={r}
              fill="none"
              stroke={f.cor}
              strokeWidth={ativa === f.chave ? espessura + 4 : espessura}
              strokeDasharray={`${Math.max(0, tam - respiro)} ${c}`}
              strokeDashoffset={offset}
              opacity={ativa && ativa !== f.chave ? 0.35 : 1}
              className="cursor-pointer transition-[opacity,stroke-width] duration-200"
              onPointerEnter={() => setAtiva(f.chave)}
            />
          );
        })}
      </svg>
      <div className="relative px-4 text-center">
        {ativa ? (
          <>
            <p className="text-[18px] font-extrabold leading-none text-tinta tabular-nums">{Math.round(((fatias.find((f) => f.chave === ativa)?.valor ?? 0) / total) * 100)}%</p>
            <p className="mt-1 text-[11px] text-texto-2">{fatias.find((f) => f.chave === ativa)?.rotulo}</p>
          </>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
