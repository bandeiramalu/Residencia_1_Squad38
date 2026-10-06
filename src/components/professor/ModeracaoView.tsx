"use client";

import { Bot, Check, Download, Eye, EyeOff, Flag, Megaphone, Paperclip, ShieldCheck, Trash2, X } from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type TomBadge } from "@/components/ui/Badge";
import { TituloPagina } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { AreaTexto, Seletor } from "@/components/ui/Campo";
import { Card } from "@/components/ui/Card";
import { LinkPessoa } from "@/components/ui/LinkPessoa";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ESPACOS } from "@/data/escola";
import { useAgora } from "@/hooks/useAgora";
import { cn } from "@/lib/cn";
import { baixarCsv } from "@/lib/exportar";
import { MOTIVOS_DENUNCIA, triarDenuncia, verificarPublicacao, type MotivoDenuncia, type Triagem } from "@/lib/moderacao";
import { dataCurta, tempoRelativo } from "@/lib/tempo";
import { relatosPendentes } from "@/lib/turmas";
import { MOTIVOS_REMOCAO, moderarPost, validarRelato } from "@/store/actions";
import { useEstado } from "@/store/store";
import type { Pessoa, Post, RegistroModeracao, Relato } from "@/store/types";
import { Abas } from "./comum";

const PESO_PRIORIDADE = { alta: 0, média: 1, baixa: 2 } as const;
const TOM_PRIORIDADE: Record<Triagem["prioridade"], TomBadge> = { alta: "alerta", média: "ambar", baixa: "neutro" };

type Analise = Triagem & { origem: "denuncia" | "automatica" };
type Aba = "publicacoes" | "relatos" | "historico";

function analisar(p: Post): Analise {
  if (p.denuncia) {
    const motivo = (MOTIVOS_DENUNCIA as readonly string[]).includes(p.denuncia.motivo) ? (p.denuncia.motivo as MotivoDenuncia) : "Outro";
    return { ...triarDenuncia(motivo, p.texto, p.denuncia.descricao), origem: "denuncia" };
  }
  const v = verificarPublicacao(p.texto);
  return { ...triarDenuncia(v.sinalizado ? v.motivo : "Outro", p.texto, ""), origem: "automatica" };
}

function nomeDoEspaco(id: string) {
  return ESPACOS.find((e) => e.id === id)?.nome ?? id;
}

/** US05/US06 — fila de revisão humana: a IA só classifica e prioriza, quem decide é o professor. */
export function ModeracaoView() {
  const estado = useEstado();
  const { posts, pessoas, historicoModeracao = [] } = estado;
  const agora = useAgora(60_000);
  const [aba, setAba] = useState<Aba>("publicacoes");
  const [revelados, setRevelados] = useState<string[]>([]);

  const fila = posts
    .filter((p) => p.emRevisao || p.denuncia)
    .map((p) => ({ post: p, analise: analisar(p) }))
    .sort((x, y) => PESO_PRIORIDADE[x.analise.prioridade] - PESO_PRIORIDADE[y.analise.prioridade] || y.post.criadoEm - x.post.criadoEm);
  const relatos = relatosPendentes(estado);

  const alternarRevelado = (id: string) => setRevelados((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));

  const exportar = () =>
    baixarCsv(
      "historico-moderacao",
      ["Data", "Decisão", "Autor", "Turma", "Decidido por", "Motivo", "Publicação"],
      historicoModeracao.map((h) => [
        new Date(h.em).toLocaleString("pt-BR"),
        h.decisao === "removido" ? "Removida" : "Liberada",
        pessoas[h.autorId]?.nome ?? h.autorId,
        pessoas[h.autorId]?.turma ?? "",
        pessoas[h.decididoPor]?.nome ?? h.decididoPor,
        h.motivo ?? "",
        h.texto,
      ]),
    );

  return (
    <div className="space-y-5">
      <TituloPagina
        titulo="Moderação"
        descricao="Publicações sinalizadas ou denunciadas e relatos à coordenação. A IA só prioriza; quem decide é você."
        acao={
          <Button variante="secundario" onClick={exportar} disabled={historicoModeracao.length === 0}>
            <Download /> Exportar histórico (CSV)
          </Button>
        }
      />

      <Abas
        abas={[
          { id: "publicacoes", rotulo: "Publicações", contador: fila.length },
          { id: "relatos", rotulo: "Relatos", contador: relatos.length },
          { id: "historico", rotulo: "Histórico", contador: historicoModeracao.length },
        ]}
        valor={aba}
        onChange={setAba}
        grupo="prof-moderacao"
        rotulo="Seções da moderação"
        className="px-0"
      />

      {aba === "publicacoes" &&
        (fila.length === 0 ? (
          <Vazia titulo="Nada para revisar" texto="A triagem avisa quando algo precisar do seu olhar." />
        ) : (
          <Card semPadding className="overflow-hidden">
            <ul className="divide-y divide-borda">
              <AnimatePresence initial={false}>
                {fila.map(({ post, analise }) => (
                  <motion.li
                    key={post.id}
                    layout="position"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                  >
                    <ItemRevisao
                      post={post}
                      analise={analise}
                      autor={pessoas[post.autorId]}
                      agora={agora}
                      revelado={revelados.includes(post.id)}
                      onRevelar={() => alternarRevelado(post.id)}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </Card>
        ))}

      {aba === "relatos" && <Relatos pendentes={relatos} decididos={estado.relatos.filter((r) => r.status !== "em análise")} autor={pessoas[estado.usuario.id]} agora={agora} />}

      {aba === "historico" &&
        (historicoModeracao.length === 0 ? (
          <Vazia titulo="Nenhuma decisão ainda" texto="Suas decisões ficam registradas aqui, com quem decidiu, quando e o motivo." />
        ) : (
          <Card semPadding className="overflow-hidden">
            <ul className="divide-y divide-borda">
              {historicoModeracao.map((h) => (
                <LinhaHistorico key={h.id} registro={h} autor={pessoas[h.autorId]} decisor={pessoas[h.decididoPor]} agora={agora} />
              ))}
            </ul>
          </Card>
        ))}
    </div>
  );
}

function ItemRevisao({
  post: p,
  analise: t,
  autor,
  agora,
  revelado,
  onRevelar,
}: {
  post: Post;
  analise: Analise;
  autor?: Pessoa;
  agora: number;
  revelado: boolean;
  onRevelar: () => void;
}) {
  const nome = autor?.nome ?? "Aluno";
  const confianca = Math.round(t.confianca * 100);
  const [removendo, setRemovendo] = useState(false);
  const [motivo, setMotivo] = useState<string>("");
  const [detalhe, setDetalhe] = useState("");

  const confirmarRemocao = () => {
    if (!motivo) return;
    moderarPost(p.id, "removido", detalhe.trim() ? `${motivo}: ${detalhe.trim()}` : motivo);
  };

  return (
    <article className="px-4 py-4">
      <div className="flex items-center gap-3">
        <LinkPessoa id={p.autorId} rotulo={`Perfil de ${nome}`} className="shrink-0">
          <Avatar nome={nome} iniciais={autor?.iniciais} tamanho="sm" />
        </LinkPessoa>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-tinta">
            <LinkPessoa id={p.autorId} className="hover:underline">
              {nome}
            </LinkPessoa>
          </p>
          <p className="truncate text-[12px] text-texto-2">
            {autor?.turma ?? nomeDoEspaco(p.espaco)} · {tempoRelativo(p.criadoEm, agora)}
          </p>
        </div>
        {t.origem === "denuncia" ? (
          <Badge tom="neutro" className="shrink-0">
            <Flag /> Denunciada
          </Badge>
        ) : (
          <Badge tom="neutro" className="shrink-0">
            <Bot /> Sinalizada
          </Badge>
        )}
      </div>

      <div className="relative mt-3 overflow-hidden rounded-xl border border-borda bg-superficie-2">
        <p className={cn("p-3.5 text-[14px] leading-relaxed text-texto transition-[filter] duration-200", !revelado && "select-none blur-[6px]")} aria-hidden={!revelado}>
          {p.texto}
        </p>
        {!revelado ? (
          <button type="button" onClick={onRevelar} className="absolute inset-0 grid place-items-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-borda bg-superficie px-3 py-1.5 text-[12.5px] font-medium text-tinta transition-colors hover:bg-superficie-2">
              <Eye className="size-3.5" /> Mostrar conteúdo
            </span>
          </button>
        ) : (
          <button type="button" onClick={onRevelar} className="mx-3.5 mb-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-texto-2 hover:text-tinta">
            <EyeOff className="size-3.5" /> Ocultar novamente
          </button>
        )}
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-3 text-[12px]">
        <div className="min-w-0">
          <dt className="text-texto-2">Categoria</dt>
          <dd className="mt-0.5 truncate text-[13px] font-medium text-tinta">{t.categoria}</dd>
        </div>
        <div>
          <dt className="text-texto-2">Prioridade</dt>
          <dd className="mt-0.5">
            <Badge tom={TOM_PRIORIDADE[t.prioridade]} className="capitalize">
              {t.prioridade}
            </Badge>
          </dd>
        </div>
        <div>
          <dt className="text-texto-2">Confiança</dt>
          <dd className="mt-0.5 flex items-center gap-2">
            <span className="text-[13px] font-medium tabular-nums text-tinta">{confianca}%</span>
            <ProgressBar valor={confianca} fina tom="suave" rotulo="Confiança da triagem" className="max-w-16" />
          </dd>
        </div>
      </dl>

      {p.denuncia && (
        <p className="mt-3 text-[12.5px] leading-snug text-texto-2">
          Motivo: <span className="font-medium text-tinta">{p.denuncia.motivo}</span>
          {p.denuncia.descricao && <> · “{p.denuncia.descricao}”</>}
          {p.denuncia.evidencia && (
            <span className="ml-1 inline-flex items-center gap-1">
              · <Paperclip className="size-3" /> print anexado
            </span>
          )}
        </p>
      )}

      {removendo ? (
        <div className="mt-3.5 space-y-2.5 rounded-xl border border-borda bg-superficie-2 p-3.5">
          <p className="text-[13px] font-medium text-tinta">Por que remover? O autor recebe o motivo.</p>
          <Seletor value={motivo} onChange={(e) => setMotivo(e.target.value)} aria-label="Motivo da remoção">
            <option value="">Escolha um motivo</option>
            {MOTIVOS_REMOCAO.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Seletor>
          <AreaTexto value={detalhe} onChange={(e) => setDetalhe(e.target.value.slice(0, 240))} placeholder="Explique melhor (opcional)" className="min-h-16" aria-label="Detalhe do motivo" />
          <div className="flex items-center gap-2">
            <Button variante="fantasma" tamanho="sm" onClick={() => setRemovendo(false)}>
              <X /> Cancelar
            </Button>
            <Button variante="perigo" tamanho="sm" className="ml-auto" disabled={!motivo} onClick={confirmarRemocao}>
              <Trash2 /> Remover e avisar o autor
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <Button variante="secundario" tamanho="sm" onClick={() => moderarPost(p.id, "aprovado")}>
            <Check /> Liberar
          </Button>
          <Button variante="perigo" tamanho="sm" onClick={() => setRemovendo(true)}>
            <Trash2 /> Remover
          </Button>
          <span className="ml-auto text-[12px] text-texto-2" title="O autor é avisado da decisão">
            Encaminhada para {t.fila}
          </span>
        </div>
      )}
    </article>
  );
}

function Relatos({ pendentes, decididos, autor, agora }: { pendentes: Relato[]; decididos: Relato[]; autor?: Pessoa; agora: number }) {
  const nome = autor?.nome ?? "Aluna";
  if (pendentes.length === 0 && decididos.length === 0) return <Vazia titulo="Nenhum relato recebido" texto="Quando um aluno relatar algo à coordenação, aparece aqui para validação." icone={<Megaphone />} />;
  return (
    <div className="space-y-5">
      {pendentes.length === 0 ? (
        <Vazia titulo="Nenhum relato aguardando" texto="Todos os relatos recebidos já foram decididos." icone={<Megaphone />} />
      ) : (
        <Card semPadding className="overflow-hidden">
          <ul className="divide-y divide-borda">
            {pendentes.map((r) => (
              <li key={r.id} className="px-4 py-4">
                <div className="flex items-center gap-3">
                  {autor && (
                    <LinkPessoa id={autor.id} rotulo={`Perfil de ${nome}`} className="shrink-0">
                      <Avatar nome={nome} iniciais={autor.iniciais} tamanho="sm" />
                    </LinkPessoa>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-tinta">{autor ? <LinkPessoa id={autor.id} className="hover:underline">{nome}</LinkPessoa> : nome}</p>
                    <p className="truncate text-[12px] text-texto-2">
                      {r.categoria} · {tempoRelativo(r.criadoEm, agora)}
                    </p>
                  </div>
                  <Badge tom="ambar">Em análise</Badge>
                </div>
                <p className="mt-3 whitespace-pre-line rounded-xl border border-borda bg-superficie-2 p-3.5 text-[14px] leading-relaxed text-texto">{r.texto}</p>
                <div className="mt-3.5 flex flex-wrap items-center gap-2">
                  <Button variante="secundario" tamanho="sm" onClick={() => validarRelato(r.id, true)}>
                    <Check /> Validar (+30 pontos)
                  </Button>
                  <Button variante="perigo" tamanho="sm" onClick={() => validarRelato(r.id, false)}>
                    <X /> Recusar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {decididos.length > 0 && (
        <section>
          <h2 className="mb-2 text-[13px] font-medium text-texto-2">Já decididos</h2>
          <Card semPadding className="overflow-hidden">
            <ul className="divide-y divide-borda">
              {decididos.map((r) => (
                <li key={r.id} className="flex items-start gap-3 px-4 py-3">
                  {r.status === "validado" ? <Check className="mt-0.5 size-4 shrink-0 text-acento" aria-hidden /> : <X className="mt-0.5 size-4 shrink-0 text-alerta" aria-hidden />}
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-tinta">
                      {r.status === "validado" ? "Validado" : "Recusado"}
                      <span className="font-normal text-texto-2">
                        {" · "}
                        {r.categoria}
                        {r.decididoEm ? ` · ${tempoRelativo(r.decididoEm, agora)}` : ""}
                      </span>
                    </p>
                    <p className="line-clamp-1 text-[12px] text-texto-2">{r.texto}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}
    </div>
  );
}

function LinhaHistorico({ registro: h, autor, decisor, agora }: { registro: RegistroModeracao; autor?: Pessoa; decisor?: Pessoa; agora: number }) {
  const removida = h.decisao === "removido";
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      {removida ? <Trash2 className="mt-0.5 size-4 shrink-0 text-alerta" aria-hidden /> : <Check className="mt-0.5 size-4 shrink-0 text-acento" aria-hidden />}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-tinta">
          {removida ? "Removida" : "Liberada"}
          <span className="font-normal text-texto-2">
            {" · "}
            <LinkPessoa id={h.autorId} className="hover:underline">
              {autor?.nome ?? "autor"}
            </LinkPessoa>
          </span>
        </p>
        <p className="line-clamp-2 text-[12px] text-texto-2">{h.texto}</p>
        {h.motivo && (
          <p className="mt-0.5 text-[12px] text-texto-2">
            Motivo: <span className="text-texto">{h.motivo}</span>
          </p>
        )}
        <p className="mt-0.5 text-[11.5px] text-texto-2">
          {decisor?.nome ?? "Professor"} · {tempoRelativo(h.em, agora)} · {dataCurta(h.em)}
        </p>
      </div>
    </li>
  );
}

function Vazia({ titulo, texto, icone }: { titulo: string; texto: string; icone?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-borda bg-superficie px-6 py-10 text-center">
      <div className="mx-auto grid size-10 place-items-center rounded-full bg-superficie-2 text-acento [&_svg]:size-5">{icone ?? <ShieldCheck />}</div>
      <p className="mt-3 text-[15px] font-medium text-tinta">{titulo}</p>
      <p className="mx-auto mt-1 max-w-sm text-[13px] text-texto-2">{texto}</p>
    </div>
  );
}
