"use client";

import { CircleHelp, FileText, Newspaper, Send, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { TituloPagina, Vazio } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { AreaTexto, Seletor } from "@/components/ui/Campo";
import { LinkPessoa } from "@/components/ui/LinkPessoa";
import { TURMAS_DO_PROFESSOR } from "@/data/professor";
import { DISCIPLINAS } from "@/data/escola";
import { useAgora } from "@/hooks/useAgora";
import { abrirAnexoDe, resumoDoAnexo } from "@/lib/materiais";
import { tempoRelativo } from "@/lib/tempo";
import { duvidaRespondida, duvidasDasTurmas } from "@/lib/turmas";
import { marcarRespostaUtil, responderDuvida } from "@/store/actions";
import { useEstado } from "@/store/store";
import type { Pessoa, Post } from "@/store/types";
import { Abas, LinkBotao, Metadados, PessoaLink, useProfessorId } from "./comum";

type Status = "pendentes" | "respondidas";

/** Dúvidas das turmas: o professor responde de verdade (resposta oficial) e valida respostas de colegas. */
export function DuvidasView() {
  const estado = useEstado();
  const agora = useAgora(60_000);
  const profId = useProfessorId();
  const minhaDisciplina = estado.pessoas[profId]?.disciplina ?? "";
  const [status, setStatus] = useState<Status>("pendentes");
  const [disciplina, setDisciplina] = useState<string>(minhaDisciplina);
  const [turma, setTurma] = useState("todas");

  const base = duvidasDasTurmas(estado).filter(
    (p) => (!disciplina || !p.disciplina || p.disciplina === disciplina) && (turma === "todas" || estado.pessoas[p.autorId]?.turma === turma),
  );
  const pendentes = base.filter((p) => !duvidaRespondida(p));
  const respondidas = base.filter(duvidaRespondida);
  const lista = status === "pendentes" ? pendentes : respondidas;

  return (
    <div className="space-y-5">
      <TituloPagina titulo="Dúvidas" descricao="Perguntas dos alunos no feed. Sua resposta fica fixada como oficial." />

      <div className="grid gap-2 sm:grid-cols-2">
        <Seletor value={disciplina} onChange={(e) => setDisciplina(e.target.value)} aria-label="Disciplina">
          <option value="">Todas as disciplinas</option>
          {DISCIPLINAS.map((d) => (
            <option key={d} value={d}>
              {d}
              {d === minhaDisciplina ? " (a sua)" : ""}
            </option>
          ))}
        </Seletor>
        <Seletor value={turma} onChange={(e) => setTurma(e.target.value)} aria-label="Turma">
          <option value="todas">Todas as turmas</option>
          {TURMAS_DO_PROFESSOR.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Seletor>
      </div>

      <Abas
        abas={[
          { id: "pendentes", rotulo: "Pendentes", contador: pendentes.length },
          { id: "respondidas", rotulo: "Respondidas", contador: respondidas.length },
        ]}
        valor={status}
        onChange={setStatus}
        grupo="prof-duvidas"
        rotulo="Situação das dúvidas"
        className="px-0"
      />

      {lista.length === 0 ? (
        <Vazio
          icone={<CircleHelp />}
          titulo={status === "pendentes" ? "Nenhuma dúvida aguardando" : "Nenhuma dúvida respondida ainda"}
          descricao={status === "pendentes" ? "Quando um aluno perguntar algo na sua disciplina, aparece aqui." : "As dúvidas que você responder ficam aqui."}
          acao={
            status === "pendentes" ? (
              <LinkBotao href="/feed">Abrir o feed da escola</LinkBotao>
            ) : (
              <Button variante="secundario" onClick={() => setStatus("pendentes")}>
                Ver as pendentes
              </Button>
            )
          }
        />
      ) : (
        <ul className="space-y-3">
          {lista.map((p) => (
            <li key={p.id}>
              <CartaoDuvida post={p} autor={estado.pessoas[p.autorId]} pessoas={estado.pessoas} agora={agora} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CartaoDuvida({ post, autor, pessoas, agora }: { post: Post; autor?: Pessoa; pessoas: Record<string, Pessoa>; agora: number }) {
  const [texto, setTexto] = useState("");
  const [respondendo, setRespondendo] = useState(!duvidaRespondida(post));
  const nome = autor?.nome ?? "Aluno";
  // Trava de duplo clique: cada envio é uma resposta oficial nova (pontos e notificação ao aluno).
  const enviando = useRef(false);

  const enviar = () => {
    if (enviando.current) return;
    enviando.current = true;
    if (responderDuvida(post.id, texto)) {
      setTexto("");
      setRespondendo(false);
    } else {
      enviando.current = false;
    }
  };

  return (
    <article className="rounded-2xl border border-borda bg-superficie p-4">
      <div className="flex items-center gap-3">
        <PessoaLink
          id={post.autorId}
          nome={nome}
          iniciais={autor?.iniciais}
          className="flex-1"
          apoio={<Metadados itens={[autor?.turma, post.disciplina, tempoRelativo(post.criadoEm, agora)]} />}
        />
        {duvidaRespondida(post) ? (
          <Badge tom="claro" className="shrink-0">
            Respondida
          </Badge>
        ) : (
          <Badge tom="ambar" className="shrink-0">
            Pendente
          </Badge>
        )}
      </div>

      <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-texto">{post.texto}</p>

      {post.anexo && (
        <button
          type="button"
          onClick={() => post.anexo && void abrirAnexoDe(post.anexo, { titulo: post.anexo.nome.replace(/\.pdf$/i, ""), descricao: post.texto, disciplina: post.disciplina, autor: nome })}
          className="mt-3 flex w-full items-center gap-3 rounded-xl border border-borda p-2.5 text-left transition-colors duration-150 hover:bg-superficie-2 active:scale-[0.99]"
          aria-label={`Abrir ${post.anexo.nome}`}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-superficie-2 text-texto-2 ring-1 ring-inset ring-borda">
            <FileText className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-medium text-tinta">{post.anexo.nome}</span>
            <span className="block truncate text-[12px] text-texto-2">{resumoDoAnexo(post.anexo, true)}</span>
          </span>
        </button>
      )}

      {post.respostas.length > 0 && (
        <ul className="mt-3 space-y-2 border-t border-borda pt-3">
          {post.respostas.map((r) => {
            const quem = pessoas[r.autorId];
            const doProfessor = quem?.papel === "professor";
            return (
              <li key={r.id} className="flex items-start gap-2.5">
                <Avatar nome={quem?.nome ?? "Aluno"} iniciais={quem?.iniciais} tamanho="xs" className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] text-texto-2">
                    <LinkPessoa id={r.autorId} className="font-medium text-tinta hover:underline">
                      {quem?.nome ?? "Aluno"}
                    </LinkPessoa>
                    {r.oficial && <span className="ml-1.5 font-medium text-acento">resposta oficial</span>}
                    {r.util && !r.oficial && <span className="ml-1.5 font-medium text-acento">marcada como útil</span>}
                    {" · "}
                    {tempoRelativo(r.criadoEm, agora)}
                  </p>
                  <p className="mt-0.5 whitespace-pre-line text-[13.5px] leading-snug text-texto">{r.texto}</p>
                </div>
                {!doProfessor && !r.util && (
                  <Button variante="secundario" tamanho="sm" className="toque:h-11" onClick={() => marcarRespostaUtil(post.id, r.id)} aria-label={`Marcar resposta de ${quem?.nome ?? "aluno"} como útil`}>
                    <ThumbsUp /> <span className="hidden sm:inline">Útil</span>
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {respondendo ? (
        <div className="mt-3 space-y-2">
          <AreaTexto value={texto} onChange={(e) => setTexto(e.target.value.slice(0, 600))} placeholder="Escreva a resposta oficial…" className="min-h-20" aria-label={`Resposta para ${nome}`} />
          <div className="flex items-center justify-end gap-2">
            <span className="mr-auto text-[12px] tabular-nums text-texto-2">{texto.length}/600</span>
            {duvidaRespondida(post) && (
              <Button variante="fantasma" tamanho="sm" onClick={() => setRespondendo(false)}>
                Cancelar
              </Button>
            )}
            <Button tamanho="sm" disabled={texto.trim().length < 3} onClick={enviar}>
              <Send /> Responder
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link href={`/feed?post=${post.id}`} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-acento hover:underline toque:min-h-11">
          <Newspaper className="size-4" aria-hidden /> Ver no feed
        </Link>
        {!respondendo && (
          <Button
            variante="secundario"
            tamanho="sm"
            className="ml-auto"
            onClick={() => {
              enviando.current = false;
              setRespondendo(true);
            }}
          >
            Responder de novo
          </Button>
        )}
      </div>
    </article>
  );
}
