"use client";

import {
  ArrowRight,
  ChartColumn,
  Heart,
  LogOut,
  MessageCircle,
  Palette,
  Presentation,
  Repeat2,
  ShoppingBag,
  Tag,
  Trash2,
} from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ItemVisual } from "@/components/loja/ItemVisual";
import { PrivacidadeControle } from "@/components/ranking/PrivacidadeControle";
import { RoteiroSheet } from "@/components/shell/RoteiroSheet";
import { useSair } from "@/components/shell/SairSheet";
import { TemaSegmentado } from "@/components/shell/TemaToggle";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Avatar } from "@/components/ui/Avatar";
import { aoTeclarNasAbas } from "@/components/ui/abas";
import { Badge } from "@/components/ui/Badge";
import { TituloSecao, Vazio } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Switch } from "@/components/ui/Switch";
import { ITENS } from "@/data/loja";
import { MEDALHAS } from "@/data/medalhas";
import { useAgora } from "@/hooks/useAgora";
import { entrarComoDemo } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { definirModoApresentacao, useModoApresentacao } from "@/lib/apresentacao";
import { fmt } from "@/lib/format";
import { nivelDe } from "@/lib/gamificacao";
import { tempoRelativo } from "@/lib/tempo";
import { equipar, selecionarEspaco } from "@/store/actions";
import { apagarDadosDoDispositivo } from "@/store/acoes/aluno";
import { useEstado, useSeletor } from "@/store/store";
import type { Post } from "@/store/types";
import { focarPost } from "@/store/ui";
import { arrobaPadrao } from "./arroba";
import { EditarPerfilSheet } from "./EditarPerfilSheet";
import { MedalhasGrade } from "./MedalhasGrade";
import { LinhaAcao } from "./PerfilSecoes";
import { SELOS } from "./selos";

type AbaPerfil = "publicacoes" | "conquistas" | "config";

const ABAS: { id: AbaPerfil; rotulo: string }[] = [
  { id: "publicacoes", rotulo: "Publicações" },
  { id: "conquistas", rotulo: "Conquistas" },
  { id: "config", rotulo: "Configurações" },
];

const TIPO_POST: Record<Post["tipo"], string> = { duvida: "Dúvida", material: "Material", aviso: "Aviso", publicacao: "Publicação" };

/** Perfil da aluna, minimalista: identidade, nível, medalhas, publicações e configurações. */
export function PerfilView() {
  const { usuario, sequencia, medalhas, posts } = useEstado();
  const [aba, setAba] = useState<AbaPerfil>("publicacoes");
  const [editando, setEditando] = useState(false);

  const nivel = nivelDe(usuario.xp);
  const eq = new Set(usuario.equipados);
  const conquistadas = medalhas.filter((m) => m.desbloqueadaEm).length;
  const meus = posts.filter((p) => p.autorId === usuario.id && !p.origemSala).sort((a, b) => b.criadoEm - a.criadoEm);
  const capa = eq.has("pf2") ? "tema-bosque" : eq.has("pf3") ? "capa-pautada" : "bg-superficie-2";

  const estatisticas: { valor: number; rotulo: string; acao?: () => void; href?: string }[] = [
    { valor: meus.length, rotulo: meus.length === 1 ? "Publicação" : "Publicações", acao: () => setAba("publicacoes") },
    { valor: usuario.respostasUteis, rotulo: usuario.respostasUteis === 1 ? "Resposta útil" : "Respostas úteis" },
    { valor: conquistadas, rotulo: conquistadas === 1 ? "Medalha" : "Medalhas", acao: () => setAba("conquistas") },
    { valor: sequencia.dias, rotulo: sequencia.dias === 1 ? "Dia seguido" : "Dias seguidos", href: "/missoes" },
  ];

  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start xl:gap-6">
      <div className="min-w-0 space-y-4">
        <h1 className="sr-only">Seu perfil</h1>

        <section aria-label="Perfil" className="overflow-hidden rounded-2xl border border-borda bg-superficie">
          <div className={cn("h-24 border-b border-borda sm:h-32", capa)} />

          <div className="px-4 sm:px-6">
            <div className="-mt-10 flex items-end justify-between gap-3 sm:-mt-11">
              <span className="rounded-full bg-superficie p-1">
                <Avatar nome={usuario.nome} foto={usuario.foto} tamanho="xl" equipados={usuario.equipados} />
              </span>
              <div className="flex gap-2 pb-1">
                <Button variante="secundario" tamanho="sm" onClick={() => setEditando(true)}>
                  Editar perfil
                </Button>
                <Link
                  href="/estatisticas"
                  aria-label="Minhas estatísticas"
                  className="alvo-toque inline-flex h-8 whitespace-nowrap items-center gap-1.5 rounded-lg border border-borda bg-superficie px-3 text-[13px] font-medium text-tinta transition-colors duration-150 hover:bg-superficie-2 active:scale-[0.98] toque:min-w-11 toque:justify-center"
                >
                  <ChartColumn className="size-4" aria-hidden /> <span className="hidden sm:inline">Minhas estatísticas</span>
                </Link>
                <Link
                  href="/loja"
                  aria-label="Loja"
                  className="alvo-toque inline-flex h-8 whitespace-nowrap items-center gap-1.5 rounded-lg border border-borda bg-superficie px-3 text-[13px] font-medium text-tinta transition-colors duration-150 hover:bg-superficie-2 toque:min-w-11 toque:justify-center"
                >
                  <ShoppingBag className="size-4" aria-hidden /> <span className="hidden sm:inline">Loja</span>
                </Link>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h2 className={cn("text-tinta", eq.has("pf4") ? "font-manuscrita text-[30px] leading-none" : "text-xl font-semibold tracking-tight")}>{usuario.nome}</h2>
                <span title={`${fmt(usuario.xp)} XP`}>
                  <Badge tom="neutro">
                    Nível {nivel.n} · {nivel.titulo}
                  </Badge>
                </span>
              </div>
              <p className="mt-0.5 text-[14px] text-texto-2">
                {usuario.arroba ?? arrobaPadrao(usuario.nome)} · {usuario.turma}
              </p>
              <p className="mt-2 whitespace-pre-line break-words text-[14px] text-texto">{usuario.bio || "Ensino Fundamental II · CEPI Expansão"}</p>

              {(eq.has("pf1") || eq.has("pf5")) && (
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  {eq.has("pf1") && (
                    <Badge tom="azul">
                      <Tag /> Turma 9º A
                    </Badge>
                  )}
                  {eq.has("pf5") && (
                    <ul aria-label="Selos do CEPI" className="flex items-center gap-1">
                      {SELOS.filter((s) => !usuario.selosExibidos || usuario.selosExibidos.includes(s.nome)).map(({ icone: Icone, nome }) => (
                        <li key={nome} title={nome} className="grid size-7 place-items-center rounded-full border border-borda text-texto-2">
                          <Icone className="size-3.5" aria-hidden />
                          <span className="sr-only">{nome}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* No toque cada número ocupa uma faixa de 44 px (sem espaço entre as linhas que quebram): a área de um não invade a do vizinho. */}
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[14px] toque:mt-0 toque:gap-y-0">
                {estatisticas.map((s) => {
                  const conteudo = (
                    <>
                      <AnimatedNumber valor={s.valor} className="font-semibold tabular-nums text-tinta" /> <span className="text-texto-2 group-hover:underline">{s.rotulo}</span>
                    </>
                  );
                  return (
                    <li key={s.rotulo} className="toque:flex toque:min-h-11 toque:items-center">
                      {s.acao ? (
                        <button type="button" onClick={s.acao} className="group alvo-toque">
                          {conteudo}
                        </button>
                      ) : s.href ? (
                        <Link href={s.href} className="group alvo-toque">
                          {conteudo}
                        </Link>
                      ) : (
                        <span>{conteudo}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <AbasPerfil aba={aba} onChange={setAba} />
        </section>

        <motion.div key={aba} role="tabpanel" id={`painel-${aba}`} aria-labelledby={`aba-${aba}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
          {aba === "publicacoes" && <Publicacoes posts={meus} />}
          {aba === "conquistas" && <Conquistas conquistadas={conquistadas} />}
          {aba === "config" && <Configuracoes />}
        </motion.div>
      </div>

      <aside className="hidden space-y-4 xl:sticky xl:top-20 xl:block">
        <NivelCard />
      </aside>

      <EditarPerfilSheet aberto={editando} onFechar={() => setEditando(false)} />
    </div>
  );
}

function AbasPerfil({ aba, onChange }: { aba: AbaPerfil; onChange: (a: AbaPerfil) => void }) {
  return (
    <div role="tablist" aria-label="Seções do perfil" onKeyDown={aoTeclarNasAbas} className="sem-scrollbar mt-4 flex overflow-x-auto border-t border-borda sm:px-2">
      {ABAS.map((a) => {
        const ativo = a.id === aba;
        return (
          <button
            key={a.id}
            type="button"
            role="tab"
            id={`aba-${a.id}`}
            aria-selected={ativo}
            aria-controls={ativo ? `painel-${a.id}` : undefined}
            tabIndex={ativo ? 0 : -1}
            onClick={() => onChange(a.id)}
            className={cn(
              "relative flex-auto shrink-0 whitespace-nowrap px-1.5 py-3 text-[13px] font-medium transition-colors duration-150 hover:bg-superficie-2 toque:min-h-11 sm:flex-none sm:px-4 sm:text-[14px]",
              ativo ? "text-tinta" : "text-texto-2 hover:text-tinta",
            )}
          >
            {a.rotulo}
            {ativo && (
              <motion.span
                layoutId="perfil-aba-sublinhado"
                className="absolute inset-x-1.5 bottom-0 h-0.5 rounded-full bg-tinta sm:inset-x-4"
                transition={{ type: "spring", stiffness: 600, damping: 50 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Publicações da aluna; o toque abre a publicação destacada no feed. */
function Publicacoes({ posts }: { posts: Post[] }) {
  const router = useRouter();
  const usuario = useSeletor((e) => e.usuario);
  const espaco = useSeletor((e) => e.espaco);
  const agora = useAgora(30_000);

  if (posts.length === 0) {
    return (
      <Vazio
        icone={<MessageCircle />}
        titulo="Nenhuma publicação ainda"
        descricao="Suas dúvidas e materiais do feed aparecem aqui."
        acao={
          <Button variante="secundario" tamanho="sm" onClick={() => router.push("/feed")}>
            Ir para o feed
          </Button>
        }
      />
    );
  }

  const abrir = (p: Post) => {
    // O feed filtra pelo espaço escolhido: troca para o espaço da publicação se ela ficaria escondida.
    if (espaco !== "escola" && p.espaco !== espaco && p.espaco !== "escola") selecionarEspaco(p.espaco);
    focarPost(p.id);
    router.push("/feed");
  };

  return (
    <ul className="divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-superficie">
      {posts.map((p) => (
        <li key={p.id}>
          <button type="button" onClick={() => abrir(p)} className="group flex w-full gap-3 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-superficie-2">
            <Avatar nome={usuario.nome} foto={usuario.foto} tamanho="md" equipados={usuario.equipados} />
            <div className="min-w-0 flex-1">
              <p className="flex min-w-0 items-baseline gap-1.5 text-[14px]">
                <span className="truncate font-medium text-tinta">{usuario.nome}</span>
                <span className="shrink-0 text-[13px] text-texto-2">· {tempoRelativo(p.criadoEm, agora)}</span>
              </p>
              <p className="text-[12px] text-texto-2">
                {TIPO_POST[p.tipo]}
                {p.disciplina ? ` · ${p.disciplina}` : ""}
                {p.emRevisao && <span className="text-ouro"> · em revisão</span>}
              </p>
              <p className="mt-1.5 line-clamp-3 text-[14px] leading-relaxed text-texto">{p.texto}</p>
              <div className="mt-2 flex items-center gap-4 text-[12px] text-texto-2">
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <Heart className="size-3.5" aria-hidden /> {p.curtidas}
                  <span className="sr-only">curtidas</span>
                </span>
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <MessageCircle className="size-3.5" aria-hidden /> {p.respostas.length}
                  <span className="sr-only">respostas</span>
                </span>
                <span className="ml-auto inline-flex items-center gap-1 group-hover:text-tinta">
                  Ver no feed <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
                </span>
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

function NivelCard({ className }: { className?: string }) {
  const usuario = useSeletor((e) => e.usuario);
  const nivel = nivelDe(usuario.xp);
  return (
    <section aria-label="Nível" className={cn("rounded-2xl border border-borda bg-superficie p-4", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[15px] font-semibold text-tinta">
          Nível {nivel.n} · {nivel.titulo}
        </h3>
        <span className="text-[13px] tabular-nums text-texto-2">{Math.round(nivel.pct)}%</span>
      </div>
      <ProgressBar valor={nivel.pct} fina className="mt-3" rotulo="Progresso para o próximo nível" />
      <p className="mt-2 text-[13px] text-texto-2">
        {nivel.proximo ? (
          <>
            Faltam <span className="font-medium text-tinta">{fmt(nivel.falta)} XP</span> para {nivel.proximo.titulo} (nível {nivel.proximo.n}).
          </>
        ) : (
          "Você chegou ao nível máximo."
        )}
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-borda pt-3">
        <div>
          <dt className="text-[12px] text-texto-2">XP total</dt>
          <dd>
            <AnimatedNumber valor={usuario.xp} className="text-[15px] font-semibold tabular-nums text-tinta" />
          </dd>
        </div>
        <div>
          <dt className="text-[12px] text-texto-2">Pontos</dt>
          <dd>
            <AnimatedNumber valor={usuario.pontos} className="text-[15px] font-semibold tabular-nums text-tinta" />
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-[12px] text-texto-2">XP vem do mérito acadêmico. Pontos se gastam na Loja.</p>
    </section>
  );
}

function Conquistas({ conquistadas }: { conquistadas: number }) {
  return (
    <div className="space-y-6">
      <NivelCard className="xl:hidden" />
      <section>
        <TituloSecao extra={`${conquistadas} de ${MEDALHAS.length}`}>Medalhas</TituloSecao>
        <Card className="p-2 sm:p-3">
          <MedalhasGrade />
        </Card>
      </section>
    </div>
  );
}

function Configuracoes() {
  const router = useRouter();
  const { pedir: pedirSaida, dialogo: dialogoSaida } = useSair();
  const usuario = useSeletor((e) => e.usuario);
  const compras = useSeletor((e) => e.compras);
  const [roteiro, setRoteiro] = useState(false);
  const apresentacao = useModoApresentacao();
  const [confirmarReset, setConfirmarReset] = useState(false);
  const apagando = useRef(false);
  const eq = new Set(usuario.equipados);
  const cosmeticos = ITENS.filter((i) => i.slot !== "voucher" && compras.some((c) => c.itemId === i.id));

  return (
    <div className="space-y-6">
      <section>
        <TituloSecao
          extra={
            <Link href="/ranking" className="alvo-toque font-medium text-acento hover:underline">
              Ver no ranking
            </Link>
          }
        >
          Privacidade
        </TituloSecao>
        <PrivacidadeControle grupo="privacidade-perfil" />
      </section>

      <section id="personalizacao" className="scroll-mt-24">
        <TituloSecao extra="Itens da Loja">Personalização</TituloSecao>
        {cosmeticos.length > 0 ? (
          <Card semPadding className="divide-y divide-borda">
            {cosmeticos.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <ItemVisual icone={item.icone} raridade={item.raridade} className="size-9 shrink-0 rounded-lg" tamanhoIcone="size-4" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-tinta">{item.nome}</p>
                  <p className="text-[12px] text-texto-2">{eq.has(item.id) ? "Equipado" : "Guardado"}</p>
                </div>
                <Switch ativo={eq.has(item.id)} onChange={(v) => equipar(item.id, v)} rotulo={`Equipar ${item.nome}`} />
              </div>
            ))}
          </Card>
        ) : (
          <Card className="flex items-center gap-3">
            <Palette className="size-5 shrink-0 text-texto-2" aria-hidden />
            <p className="min-w-0 flex-1 text-[13px] text-texto-2">Molduras, capas e efeitos para o perfil ficam na Loja.</p>
            <Link href="/loja" className="alvo-toque shrink-0 text-[13px] font-medium text-acento hover:underline">
              Ver loja
            </Link>
          </Card>
        )}
      </section>

      <section>
        <TituloSecao extra="Salvo neste navegador">Aparência</TituloSecao>
        <Card>
          <TemaSegmentado comTexto grupo="tema-perfil" />
        </Card>
      </section>

      <section>
        <TituloSecao>Conta</TituloSecao>
        <Card semPadding className="divide-y divide-borda overflow-hidden">
          <div className="flex items-center gap-2.5 px-3 py-2.5 sm:px-4">
            <span className="grid size-8 shrink-0 place-items-center text-texto-2 [&_svg]:size-[18px]">
              <Presentation />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-medium text-tinta">Modo apresentação</span>
              <span className="block text-[12px] text-texto-2">Mostra os atalhos de demonstração (Alt+Shift+D).</span>
            </span>
            <Switch ativo={apresentacao} onChange={definirModoApresentacao} rotulo="Modo apresentação" />
          </div>
          {apresentacao && (
            <>
              <LinhaAcao icone={<Presentation />} titulo="Roteiro guiado" detalhe="Os fluxos principais, na ordem" onClick={() => setRoteiro(true)} />
              <LinhaAcao icone={<Repeat2 />} titulo="Ver como professor" detalhe="Prof. Ricardo · mesmos dados deste navegador" onClick={() => router.push(entrarComoDemo("professor"))} />
            </>
          )}
          <div>
            <LinhaAcao icone={<Trash2 />} titulo="Apagar dados deste dispositivo" detalhe="Volta tudo ao estado inicial, inclusive foto, arquivos e lembretes" onClick={() => setConfirmarReset((v) => !v)} />
            <AnimatePresence initial={false}>
              {confirmarReset && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
                  <div className="flex gap-2 px-4 pb-3">
                    <Button variante="secundario" tamanho="sm" className="flex-1" onClick={() => setConfirmarReset(false)}>
                      Cancelar
                    </Button>
                    <Button
                      variante="perigo"
                      tamanho="sm"
                      className="flex-1"
                      onClick={() => {
                        if (apagando.current) return;
                        apagando.current = true;
                        // Apaga também os arquivos do IndexedDB (assíncrono); a trava evita um segundo "Sim, apagar tudo".
                        void apagarDadosDoDispositivo().finally(() => {
                          apagando.current = false;
                        });
                        setConfirmarReset(false);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Sim, apagar tudo
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <LinhaAcao
            icone={<LogOut />}
            titulo="Sair"
            detalhe="Encerra a sessão neste navegador"
            perigo
            onClick={pedirSaida}
          />
        </Card>
        <p className="mt-3 text-center text-[12px] text-texto-2">Portal do Aluno · versão 1.0 · CEPI Expansão. Os dados ficam salvos neste dispositivo.</p>
      </section>

      {apresentacao && <RoteiroSheet aberto={roteiro} onFechar={() => setRoteiro(false)} />}
      {dialogoSaida}
    </div>
  );
}
