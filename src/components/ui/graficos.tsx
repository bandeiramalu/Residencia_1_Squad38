"use client";

import { isValidElement, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { COR_CALOR } from "@/lib/cores";
import type { CelulaMapa } from "@/lib/estudos";

/*
 * Gráficos leves (HTML/SVG puro, sem biblioteca): traços finos, pontas de 4 px
 * arredondadas apoiadas na base, 2 px de respiro entre barras, grade discreta,
 * dica (tooltip) ao passar o mouse/tocar e textos sempre nas cores de texto.
 *
 * Acessibilidade (DS §16): todo gráfico tem um resumo em texto para leitores de tela
 * (`resumo` opcional; sem ele é gerado: total, maior valor e onde, variação quando há série anterior);
 * as barras formam UMA parada de Tab e são percorridas com as setas (Home/End vão às pontas);
 * o foco aparece com o anel padrão do app.
 *
 * Toque (DS §16): cada barra é um "vão" inteiro (barra + metade do respiro de cada lado) em toda a altura do gráfico —
 * não sobra faixa morta entre barras — e o dedo que toca ou arrasta na área do gráfico escolhe o vão sob ele
 * (a dica fica na tela depois de soltar). Com 30 barras em 320 px nenhum vão chega a 24 × 24 px: é o limite
 * do dado, por isso o arrasto, as setas e o resumo em texto fazem o papel de alternativa equivalente.
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
  // Fora de cena a dica nem existe no DOM: só "invisível" ainda ocuparia área rolável (rolagem horizontal em 320 px).
  if (!visivel) return null;
  return (
    <span
      ref={ref}
      role="tooltip"
      className={cn("pointer-events-none absolute z-20 whitespace-nowrap rounded-md bg-tinta px-2 py-1 text-[11px] font-medium text-superficie shadow-flutuante", className)}
    >
      {children}
    </span>
  );
}

/* ───────────── Resumos em texto ───────────── */

/** Texto puro de um nó React (para montar o resumo quando o rótulo é um link, por exemplo). */
function textoDe(no: ReactNode): string {
  if (typeof no === "string" || typeof no === "number") return String(no);
  if (Array.isArray(no)) return no.map(textoDe).join("");
  if (isValidElement<{ children?: ReactNode }>(no)) return textoDe(no.props.children);
  return "";
}

const NUMERO = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

/** "12% a mais que no período anterior." / "12% a menos…" / "Igual ao período anterior." */
function textoVariacao(atual: number, anterior: number): string {
  if (!(anterior > 0)) return "";
  const pct = Math.round(((atual - anterior) / anterior) * 100);
  if (pct === 0) return "Igual ao período anterior.";
  return pct > 0 ? `${pct}% a mais que no período anterior.` : `${Math.abs(pct)}% a menos que no período anterior.`;
}

const juntar = (...partes: (string | false | undefined)[]) => partes.filter(Boolean).join(" ");
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

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
  /** Resumo para leitores de tela. Sem ele, é gerado a partir dos dados. */
  resumo?: string;
  /** Total da série anterior (mesma unidade da soma das barras): acrescenta a variação ao resumo gerado. */
  anterior?: number;
  /** Se somar as barras faz sentido. Padrão: sim, exceto com `meta` (médias) ou valores em "%". Controla o "total" do resumo. */
  somavel?: boolean;
}

/** Nome de uma barra para o resumo: a data/nome da dica ("12 set · 1 h 20" → "12 set") ou o rótulo do eixo. */
function nomeDaBarra(b: Barra, i: number): string {
  if (b.dica?.includes(" · ")) return b.dica.split(" · ")[0];
  return b.rotulo || b.dica || `barra ${i + 1}`;
}

function resumoBarras({ dados, formatar, meta, somavel, anterior, rotulo }: Pick<PropsBarras, "dados" | "formatar" | "meta" | "somavel" | "anterior" | "rotulo">): string {
  const f = formatar ?? String;
  if (dados.length === 0) return `${rotulo}: sem dados.`;
  const total = dados.reduce((s, d) => s + d.valor, 0);
  const valores = plural(dados.length, "valor", "valores");
  if (total === 0) return `${rotulo}: ${valores}, todos zerados.`;
  const somar = somavel ?? (meta === undefined && !f(1).includes("%"));
  let imax = 0;
  dados.forEach((d, i) => {
    if (d.valor > dados[imax].valor) imax = i;
  });
  const mediaBruta = total / dados.length;
  // Inteiros ficam inteiros; com decimais (notas), uma casa — em vírgula quando o formato é o padrão.
  const media = dados.every((d) => Number.isInteger(d.valor)) ? f(Math.round(mediaBruta)) : f === String ? NUMERO.format(mediaBruta) : f(Math.round(mediaBruta * 10) / 10);
  return juntar(
    `${rotulo}: ${valores}.`,
    somar ? `Total ${f(total)}, média ${media}.` : `Média ${media}.`,
    `Maior valor: ${f(dados[imax].valor)} em ${nomeDaBarra(dados[imax], imax)}.`,
    somar && anterior !== undefined && textoVariacao(total, anterior),
  );
}

export function Barras({ dados, altura = 150, meta, rotuloMeta, formatar = String, passoRotulo = 1, className, rotulo, resumo, anterior, somavel }: PropsBarras) {
  const [ativo, setAtivo] = useState<number | null>(null);
  // Uma parada de Tab só (tabindex "rotativo"): as setas movem o foco entre as barras.
  const [foco, setFoco] = useState(0);
  const botoes = useRef<(HTMLButtonElement | null)[]>([]);
  const area = useRef<HTMLDivElement>(null);
  const max = Math.max(1, meta ?? 0, ...dados.map((d) => d.valor)) * 1.08;
  const indiceFoco = Math.min(foco, Math.max(0, dados.length - 1));

  // Dedo ou caneta: o vão sob o ponto de toque (por posição, então vale também para a folga entre barras).
  const aoTocar = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" || !area.current || dados.length === 0) return;
    const { left, width } = area.current.getBoundingClientRect();
    if (width <= 0) return;
    setAtivo(Math.max(0, Math.min(dados.length - 1, Math.floor(((e.clientX - left) / width) * dados.length))));
  };

  // A dica de um toque fica até o próximo toque; um toque fora do gráfico a fecha.
  useEffect(() => {
    if (ativo === null) return;
    const fora = (e: globalThis.PointerEvent) => {
      if (e.pointerType !== "mouse" && !area.current?.contains(e.target as Node)) setAtivo(null);
    };
    document.addEventListener("pointerdown", fora);
    return () => document.removeEventListener("pointerdown", fora);
  }, [ativo]);

  const aoTeclar = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const destino =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? i + 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? dados.length - 1 : null;
    if (destino === null) return;
    e.preventDefault();
    const novo = Math.max(0, Math.min(dados.length - 1, destino));
    setFoco(novo);
    botoes.current[novo]?.focus();
  };

  return (
    <figure className={cn("w-full", className)} aria-label={rotulo}>
      <div className="relative" style={{ height: altura }} onPointerLeave={(e) => e.pointerType === "mouse" && setAtivo(null)}>
        {/* grade: só a linha de base */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-borda" />
        {meta !== undefined && meta > 0 && (
          <div className="absolute inset-x-0 border-t border-dashed border-texto-2/40" style={{ bottom: `${(meta / max) * 100}%` }}>
            {rotuloMeta && <span className="absolute -top-4 right-0 text-[10px] font-semibold text-texto-2">{rotuloMeta}</span>}
          </div>
        )}
        {/* Sem `gap`: o respiro de 2 px é o `px-px` de cada vão e a trilha avança 1 px de cada lado (mesmo visual de antes).
            `touch-pan-y`: arrastar na horizontal escolhe a barra; na vertical, a página rola. */}
        <div
          ref={area}
          className="absolute inset-y-0 -inset-x-px flex touch-pan-y items-end"
          role="group"
          aria-label={`${rotulo}: use as setas para percorrer as barras`}
          onPointerDown={aoTocar}
          onPointerMove={aoTocar}
        >
          {dados.map((d, i) => {
            const h = (d.valor / max) * 100;
            return (
              <button
                key={d.chave}
                ref={(el) => {
                  botoes.current[i] = el;
                }}
                type="button"
                tabIndex={i === indiceFoco ? 0 : -1}
                className="relative flex h-full min-w-0 flex-1 items-end justify-center rounded-t-[4px] px-px"
                onPointerEnter={() => setAtivo(i)}
                onFocus={() => {
                  setAtivo(i);
                  setFoco(i);
                }}
                onBlur={() => setAtivo(null)}
                onKeyDown={(e) => aoTeclar(e, i)}
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
      <figcaption className="sr-only">{resumo ?? resumoBarras({ dados, formatar, meta, somavel, anterior, rotulo })}</figcaption>
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

function resumoBarrasH(dados: BarraH[], rotulo: string): string {
  if (dados.length === 0) return `${rotulo}: sem dados.`;
  const nome = (d: BarraH) => textoDe(d.rotulo) || d.chave;
  const valor = (d: BarraH) => d.valorTexto ?? NUMERO.format(d.valor);
  let imax = 0;
  let imin = 0;
  dados.forEach((d, i) => {
    if (d.valor > dados[imax].valor) imax = i;
    if (d.valor < dados[imin].valor) imin = i;
  });
  return juntar(
    `${rotulo}: ${plural(dados.length, "item", "itens")}.`,
    `Maior: ${nome(dados[imax])}, ${valor(dados[imax])}.`,
    dados.length > 1 && `Menor: ${nome(dados[imin])}, ${valor(dados[imin])}.`,
  );
}

/**
 * `interativo`: os rótulos são links (ex.: nome do campeonato, nome do aluno). No toque cada linha passa a ter 44 px (sem
 * espaço entre elas) para que o link ganhe uma área de 44 × 44 px só dele, e o rótulo ganha preenchimento vertical (com
 * margem negativa, sem mexer no layout) para o `truncate` do rótulo não recortar a área de toque do link.
 */
export function BarrasHorizontais({ dados, className, rotulo, resumo, interativo }: { dados: BarraH[]; className?: string; rotulo: string; resumo?: string; interativo?: boolean }) {
  const max = Math.max(1, ...dados.map((d) => d.valor));
  return (
    <figure className={className}>
      <ul className={cn("space-y-2.5", interativo && "toque:space-y-0")} aria-label={rotulo}>
        {dados.map((d) => (
          <li key={d.chave} className={cn("grid grid-cols-[minmax(0,7.5rem)_1fr_auto] items-center gap-3 text-[12.5px]", interativo && "toque:min-h-11")}>
            <span className={cn("flex min-w-0 items-center gap-2 font-semibold text-tinta", !interativo && "truncate")}>
              {d.cor && <i className="size-2.5 shrink-0 rounded-[3px]" style={{ background: d.cor }} />}
              <span className={cn("truncate", interativo && "min-w-0 toque:-my-3.5 toque:py-3.5")}>{d.rotulo}</span>
            </span>
            <span className="h-1.5 overflow-hidden rounded-full bg-borda/70">
              <span className="block h-full rounded-full transition-[width] duration-700 ease-suave" style={{ width: `${(d.valor / max) * 100}%`, background: d.cor ?? "var(--color-verde-2)" }} />
            </span>
            <span className="w-14 text-right font-bold tabular-nums text-texto">{d.valorTexto ?? d.valor}</span>
          </li>
        ))}
      </ul>
      <figcaption className="sr-only">{resumo ?? resumoBarrasH(dados, rotulo)}</figcaption>
    </figure>
  );
}

/* ───────────── Mapa de calor (constância) ───────────── */

const DIAS = ["Seg", "", "Qua", "", "Sex", "", "Dom"];

function resumoMapa(semanas: CelulaMapa[][], formatar: (c: CelulaMapa) => string): string {
  const dias = semanas.flat().filter((c) => !c.futuro);
  if (dias.length === 0) return "Mapa de calor dos dias de estudo: sem dias no período.";
  const comEstudo = dias.filter((c) => c.minutos > 0);
  if (comEstudo.length === 0) return `Mapa de calor dos dias de estudo: nenhum estudo em ${plural(dias.length, "dia", "dias")}.`;
  const melhor = comEstudo.reduce((m, c) => (c.minutos > m.minutos ? c : m));
  return `Mapa de calor dos dias de estudo: houve estudo em ${comEstudo.length} de ${plural(dias.length, "dia", "dias")}. Dia de maior estudo: ${formatar(melhor)}.`;
}

export function MapaDeCalor({ semanas, formatar, className, resumo }: { semanas: CelulaMapa[][]; formatar: (c: CelulaMapa) => string; className?: string; resumo?: string }) {
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
      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-texto-2" aria-hidden>
        menos
        {COR_CALOR.map((c) => (
          <i key={c} className="size-2.5 rounded-[3px]" style={{ background: c }} />
        ))}
        mais
      </div>
      <figcaption className="sr-only">{resumo ?? resumoMapa(semanas, formatar)}</figcaption>
    </figure>
  );
}

/* ───────────── Linha fina (tendência) ───────────── */

function resumoLinha(valores: number[]): string {
  const primeiro = valores[0];
  const ultimo = valores[valores.length - 1];
  const dif = ultimo - primeiro;
  const tendencia = dif === 0 ? "estável" : `${dif > 0 ? "alta" : "queda"} de ${NUMERO.format(Math.abs(dif))}`;
  return `Linha de tendência com ${valores.length} pontos: de ${NUMERO.format(primeiro)} a ${NUMERO.format(ultimo)} (${tendencia}); maior valor ${NUMERO.format(Math.max(...valores))}.`;
}

export function Sparkline({
  valores,
  largura = 120,
  altura = 36,
  cor = "var(--color-verde-2)",
  className,
  rotulo,
  resumo,
}: {
  valores: number[];
  largura?: number;
  altura?: number;
  cor?: string;
  className?: string;
  /** Nome curto do gráfico, lido antes do resumo ("XP acumulado"). */
  rotulo?: string;
  /** Resumo para leitores de tela. Sem ele, é gerado (início, fim e maior valor). */
  resumo?: string;
}) {
  if (valores.length < 2) return null;
  const max = Math.max(1, ...valores);
  const passo = largura / (valores.length - 1);
  const pontos = valores.map((v, i) => [i * passo, altura - 3 - (v / max) * (altura - 6)] as const);
  const linha = pontos.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${linha} L${largura},${altura} L0,${altura} Z`;
  const [ux, uy] = pontos[pontos.length - 1];
  return (
    <svg width={largura} height={altura} viewBox={`0 0 ${largura} ${altura}`} className={className} role="img" aria-label={juntar(rotulo && `${rotulo}.`, resumo ?? resumoLinha(valores))}>
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

function resumoRosca(fatias: Fatia[], rotulo: string): string {
  const total = fatias.reduce((s, f) => s + f.valor, 0);
  if (total <= 0) return `${rotulo}: sem dados.`;
  const partes = fatias.map((f) => `${f.rotulo} ${NUMERO.format(f.valor)} (${Math.round((f.valor / total) * 100)}%)`);
  const maior = fatias.reduce((m, f) => (f.valor > m.valor ? f : m));
  return `${rotulo}: ${partes.join("; ")}. Maior parte: ${maior.rotulo}.`;
}

export function Rosca({ fatias, tamanho = 148, espessura = 16, children, rotulo, resumo }: { fatias: Fatia[]; tamanho?: number; espessura?: number; children?: ReactNode; rotulo: string; resumo?: string }) {
  const [ativa, setAtiva] = useState<string | null>(null);
  const total = fatias.reduce((s, f) => s + f.valor, 0) || 1;
  const r = (tamanho - espessura) / 2;
  const c = 2 * Math.PI * r;
  const respiro = fatias.length > 1 ? 2 : 0;
  // Início de cada fatia no contorno (soma das anteriores).
  const inicios = fatias.map((_, i) => fatias.slice(0, i).reduce((s, f) => s + (f.valor / total) * c, 0));
  return (
    <figure className="relative inline-grid shrink-0 place-items-center" style={{ width: tamanho, height: tamanho }} aria-label={rotulo} onPointerLeave={() => setAtiva(null)}>
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
      <div className="relative px-4 text-center" aria-hidden>
        {ativa ? (
          <>
            <p className="text-[18px] font-extrabold leading-none text-tinta tabular-nums">{Math.round(((fatias.find((f) => f.chave === ativa)?.valor ?? 0) / total) * 100)}%</p>
            <p className="mt-1 text-[11px] text-texto-2">{fatias.find((f) => f.chave === ativa)?.rotulo}</p>
          </>
        ) : (
          children
        )}
      </div>
      <figcaption className="sr-only">{resumo ?? resumoRosca(fatias, rotulo)}</figcaption>
    </figure>
  );
}
