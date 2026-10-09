"use client";

import { ArrowLeft, ArrowRight, Download, FileText, Flame, Heart, MessageCircle, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { MedalhaIcone } from "@/components/perfil/MedalhaIcone";
import { Avatar, iniciaisDe } from "@/components/ui/Avatar";
import { TituloSecao, Vazio } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { MEDALHAS } from "@/data/medalhas";
import { ALUNOS_RANKING } from "@/data/ranking";
import { TURMAS_DO_PROFESSOR } from "@/data/professor";
import { ALUNOS_TURMAS } from "@/data/turmas";
import { useAgora } from "@/hooks/useAgora";
import { fmt } from "@/lib/format";
import { nivelDe } from "@/lib/gamificacao";
import { tempoRelativo } from "@/lib/tempo";
import { baixarMaterial, selecionarEspaco } from "@/store/actions";
import { useEstado } from "@/store/store";
import type { Pessoa, Post } from "@/store/types";
import { focarPost } from "@/store/ui";

const TIPO_POST: Record<Post["tipo"], string> = { duvida: "Dúvida", material: "Material", aviso: "Aviso", publicacao: "Publicação" };

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Perfil público de uma pessoa (colega, professor ou coordenação). Rota compartilhada por aluno e professor. */
export function PessoaView({ id }: { id: string }) {
  const router = useRouter();
  const { pessoas, posts, usuario } = useEstado();
  const agora = useAgora(30_000);
  const p = pessoas[id] ?? daLiga(id);

  const doAutor = useMemo(
    () => posts.filter((x) => x.autorId === id && !x.origemSala && (!x.emRevisao || id === usuario.id)).sort((a, b) => b.criadoEm - a.criadoEm),
    [posts, id, usuario.id],
  );

  const voltar = (
    <button
      type="button"
      onClick={() => router.back()}
      className="-ml-2 inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-[14px] font-medium text-texto-2 transition-colors duration-150 hover:bg-superficie-2 hover:text-tinta active:scale-[0.98] alvo-toque"
    >
      <ArrowLeft className="size-4" aria-hidden /> Voltar
    </button>
  );

  if (!p) {
    return (
      <div className="mx-auto max-w-[680px] space-y-4">
        {voltar}
        <Vazio
          icone={<UserRound />}
          titulo="Perfil não encontrado"
          descricao="Essa pessoa não existe ou saiu do portal."
          acao={
            <Button variante="secundario" tamanho="sm" onClick={() => router.push("/feed")}>
              Ir para o início
            </Button>
          }
        />
      </div>
    );
  }

  const abrirPost = (post: Post) => {
    // O feed filtra pelo espaço escolhido: vai para o espaço da publicação para ela aparecer.
    selecionarEspaco(post.espaco);
    focarPost(post.id);
    router.push("/feed");
  };

  return (
    <div className="mx-auto max-w-[680px] space-y-5">
      {voltar}

      <section aria-label="Perfil" className="rounded-2xl border border-borda bg-superficie p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <Avatar nome={p.nome} iniciais={p.iniciais} foto={id === usuario.id ? usuario.foto : undefined} tamanho="xl" equipados={id === usuario.id ? usuario.equipados : []} />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-tinta">{p.nome}</h1>
            <p className="mt-0.5 text-[14px] text-texto-2">{id === usuario.id && usuario.arroba ? `${usuario.arroba} · ${subtitulo(p)}` : subtitulo(p)}</p>
            {id === usuario.id && usuario.bio && <p className="mt-1.5 whitespace-pre-line break-words text-[14px] text-texto">{usuario.bio}</p>}
          </div>
        </div>

        {p.papel === "aluno" && <ResumoAluno pessoa={p} />}
        {p.papel === "professor" && (
          <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-borda pt-4 text-[14px]">
            <div>
              <dt className="text-[12.5px] text-texto-2">Disciplina</dt>
              <dd className="mt-0.5 font-medium text-tinta">{p.disciplina ?? "Docente"}</dd>
            </div>
            <div>
              <dt className="text-[12.5px] text-texto-2">Turmas</dt>
              <dd className="mt-0.5 font-medium text-tinta">{id === "prof_ricardo" ? TURMAS_DO_PROFESSOR.join(", ") : "Ensino Fundamental II e Médio"}</dd>
            </div>
          </dl>
        )}

        {doAutor.length > 0 && (
          <Button variante="secundario" bloco className="mt-5" onClick={() => router.push(`/feed?autor=${id}`)}>
            Ver publicações <ArrowRight />
          </Button>
        )}
      </section>

      {p.papel === "aluno" && <Medalhas pessoa={p} />}

      {p.papel === "aluno" && (
        <section>
          <TituloSecao>Publicações recentes</TituloSecao>
          {doAutor.length === 0 ? (
            <Vazio
              icone={<MessageCircle />}
              titulo="Nenhuma publicação ainda"
              descricao="As dúvidas, materiais e avisos desta pessoa aparecem aqui."
              acao={
                <Button variante="secundario" tamanho="sm" onClick={() => router.push("/feed")}>
                  Ir para o feed
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-superficie">
              {doAutor.slice(0, 4).map((post) => (
                <li key={post.id}>
                  <CardPost post={post} agora={agora} onAbrir={() => abrirPost(post)} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {p.papel === "professor" && (
        <>
          <ListaPosts titulo="Materiais publicados" vazio="Nenhum material publicado ainda." posts={doAutor.filter((x) => x.tipo === "material")} agora={agora} onAbrir={abrirPost} comAnexo />
          <ListaPosts titulo="Avisos" vazio="Nenhum aviso recente." posts={doAutor.filter((x) => x.tipo === "aviso")} agora={agora} onAbrir={abrirPost} />
        </>
      )}

      {p.papel === "escola" && <ListaPosts titulo="Avisos recentes" vazio="Nenhum aviso recente." posts={doAutor.filter((x) => x.tipo === "aviso")} agora={agora} onAbrir={abrirPost} />}
    </div>
  );
}

/** Colegas das outras ligas (gerados em data/ranking) não estão no store: monta o perfil a partir do ranking. */
function daLiga(id: string): Pessoa | undefined {
  const a = ALUNOS_RANKING.find((x) => x.id === id);
  if (!a) return undefined;
  return { id: a.id, nome: a.nome, iniciais: iniciaisDe(a.nome), papel: "aluno", turma: a.turma, xp: 300 + a.xpSemana * 3 };
}

function subtitulo(p: Pessoa) {
  if (p.papel === "aluno") return p.turma ?? "Estudante";
  if (p.papel === "professor") return `${p.nome.startsWith("Profª") ? "Professora" : "Professor"} · ${p.disciplina ?? "CEPI"}`;
  return "Conta oficial da escola";
}

function ResumoAluno({ pessoa }: { pessoa: Pessoa }) {
  const { usuario, sequencia } = useEstado();
  const eu = pessoa.id === usuario.id;
  // Quem escolheu o modo anônimo/sombra não mostra XP nem posição.
  const oculto = eu && usuario.privacidade !== "publico";
  const xp = eu ? usuario.xp : (pessoa.xp ?? 0);
  const nivel = nivelDe(xp);
  const dias = eu ? sequencia.dias : (ALUNOS_TURMAS.find((a) => a.id === pessoa.id)?.sequencia ?? 0);

  return (
    <div className="mt-5 border-t border-borda pt-4">
      <div className="flex items-baseline justify-between gap-2 text-[14px]">
        <span className="font-medium text-tinta">
          Nível {nivel.n} · {nivel.titulo}
        </span>
        {!oculto && <span className="tabular-nums text-texto-2">{fmt(xp)} XP</span>}
      </div>
      <ProgressBar valor={nivel.pct} fina className="mt-2" rotulo="Progresso para o próximo nível" />
      <p className="mt-3 flex items-center gap-1.5 text-[14px] text-texto-2">
        <Flame className="size-4 text-ambar" aria-hidden />
        <span className="font-medium tabular-nums text-tinta">{dias}</span> {dias === 1 ? "dia seguido" : "dias seguidos"} de estudo
      </p>
    </div>
  );
}

/** Medalhas conquistadas (grade compacta). Para colegas o portal não guarda o detalhe: o conjunto é derivado do id (demo). */
function Medalhas({ pessoa }: { pessoa: Pessoa }) {
  const { usuario, medalhas } = useEstado();
  const ids =
    pessoa.id === usuario.id
      ? medalhas.filter((m) => m.desbloqueadaEm).map((m) => m.id)
      : MEDALHAS.filter((m) => m.id !== "topo-da-liga" && hash(pessoa.id + m.id) % 5 === 0).map((m) => m.id);
  const conquistadas = MEDALHAS.filter((m) => ids.includes(m.id));

  return (
    <section>
      <TituloSecao extra={conquistadas.length ? `${conquistadas.length} de ${MEDALHAS.length}` : undefined}>Medalhas</TituloSecao>
      {conquistadas.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-borda px-4 py-6 text-center text-[13px] text-texto-2">Ainda sem medalhas.</p>
      ) : (
        <ul className="grid grid-cols-4 gap-2 rounded-2xl border border-borda bg-superficie p-3 sm:grid-cols-5">
          {conquistadas.map((m) => (
            <li key={m.id} title={m.criterio} className="flex flex-col items-center gap-1.5 px-1 py-2 text-center">
              <span className="grid size-11 place-items-center rounded-full bg-ouro-claro text-ouro">
                <MedalhaIcone icone={m.icone} className="size-5" />
              </span>
              <span className="text-[11.5px] leading-tight text-texto">{m.nome}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CardPost({ post, agora, onAbrir }: { post: Post; agora: number; onAbrir: () => void }) {
  return (
    <button type="button" onClick={onAbrir} className="group flex w-full flex-col px-4 py-3.5 text-left transition-colors duration-150 hover:bg-superficie-2 active:bg-superficie-2">
      <span className="text-[12px] text-texto-2">
        {TIPO_POST[post.tipo]}
        {post.disciplina ? ` · ${post.disciplina}` : ""} · {tempoRelativo(post.criadoEm, agora)}
      </span>
      <span className="mt-1 line-clamp-3 text-[14px] leading-relaxed text-texto">{post.texto}</span>
      <span className="mt-2 flex items-center gap-4 text-[12px] text-texto-2">
        <span className="inline-flex items-center gap-1 tabular-nums">
          <Heart className="size-3.5" aria-hidden /> {post.curtidas}
          <span className="sr-only">curtidas</span>
        </span>
        <span className="inline-flex items-center gap-1 tabular-nums">
          <MessageCircle className="size-3.5" aria-hidden /> {post.respostas.length}
          <span className="sr-only">respostas</span>
        </span>
        <span className="ml-auto inline-flex items-center gap-1 group-hover:text-tinta">
          Ver no feed <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
        </span>
      </span>
    </button>
  );
}

function ListaPosts({ titulo, vazio, posts, agora, onAbrir, comAnexo }: { titulo: string; vazio: string; posts: Post[]; agora: number; onAbrir: (p: Post) => void; comAnexo?: boolean }) {
  return (
    <section>
      <TituloSecao>{titulo}</TituloSecao>
      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-borda px-4 py-6 text-center">
          <span className="mx-auto mb-2 grid size-9 place-items-center rounded-full bg-superficie-2 text-texto-2">
            <MessageCircle className="size-4" aria-hidden />
          </span>
          <p className="text-[13px] text-texto-2">{vazio}</p>
          <Link href="/feed" className="alvo-toque mt-2 inline-block text-[13px] font-medium text-acento hover:underline">
            Ir para o feed
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-superficie">
          {posts.slice(0, 5).map((post) => (
            <li key={post.id}>
              <CardPost post={post} agora={agora} onAbrir={() => onAbrir(post)} />
              {comAnexo && post.anexo && (
                <div className="flex items-center gap-3 px-4 pb-3.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-superficie-2 text-texto-2 ring-1 ring-inset ring-borda">
                    <FileText className="size-4" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium text-tinta">{post.anexo.nome}</span>
                    <span className="block text-[12px] text-texto-2">
                      PDF · {post.anexo.paginas} {post.anexo.paginas === 1 ? "pág." : "págs."}
                    </span>
                  </span>
                  <Button variante="secundario" tamanho="sm" onClick={() => baixarMaterial(post)} aria-label={`Baixar ${post.anexo.nome}`}>
                    <Download /> Baixar
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
