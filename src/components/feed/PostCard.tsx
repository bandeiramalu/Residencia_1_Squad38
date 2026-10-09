"use client";

import {
  BadgeCheck,
  Bookmark,
  Check,
  ChevronDown,
  CircleCheck,
  CloudUpload,
  Download,
  Ellipsis,
  FileText,
  Flag,
  Heart,
  Link2,
  Megaphone,
  MessageCircle,
  MessageCircleQuestionMark,
  Pin,
  Share,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, m as motion } from "motion/react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { LinkPessoa } from "@/components/ui/LinkPessoa";
import type { Ator } from "@/hooks/useAtor";
import { useFecharFora } from "@/hooks/useFecharFora";
import { cn } from "@/lib/cn";
import { fmt, primeiroNome } from "@/lib/format";
import { resumoDoAnexo } from "@/lib/materiais";
import { curtir, marcarRespostaUtil, marcarUtil, responder, salvar } from "@/store/actions";
import { curtiu, salvou } from "@/store/seletores";
import type { Pessoa, Post, Resposta } from "@/store/types";
import { useSeletor } from "@/store/store";
import { focarPost } from "@/store/ui";
import { baixarDoPost, compartilharPost } from "./anexo";
import { Quando } from "./Quando";

const TIPO: Record<Post["tipo"], { rotulo: string; icone: LucideIcon }> = {
  duvida: { rotulo: "Dúvida", icone: MessageCircleQuestionMark },
  material: { rotulo: "Material", icone: FileText },
  aviso: { rotulo: "Aviso", icone: Megaphone },
  publicacao: { rotulo: "Publicação", icone: MessageCircle },
};

/** Pedido da coluna lateral para abrir a caixa de resposta de um post (`n` muda a cada clique). */
export interface PedidoResposta {
  id: string;
  n: number;
}

interface Props {
  post: Post;
  /** Quem usa esta aba: "Você", menu, curtir/salvar e caixa de resposta seguem a sessão. */
  ator: Ator;
  pessoas: Record<string, Pessoa>;
  /** Aluna deste navegador e os itens da Loja que ela equipou: aparecem no avatar dela para qualquer visitante. */
  alunaId: string;
  equipados: string[];
  destacado?: boolean;
  /** Pula a renderização enquanto o card está fora da tela (`cv-auto`). */
  leve?: boolean;
  /** Linha de contexto acima do autor (ex.: relevância na busca). */
  contexto?: ReactNode;
  pedidoResposta?: PedidoResposta | null;
  onAbrirMaterial: (post: Post) => void;
  onDenunciar: (post: Post) => void;
  onRemover: (post: Post) => void;
  onContestar: (post: Post) => void;
}

const SUAVE = [0.2, 0, 0, 1] as const;
const MAX_RESPOSTA = 600;
/** O contador da resposta só aparece perto do limite. */
const CONTADOR_A_PARTIR_DE = 500;

function TextoComTags({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(/(#[\p{L}\d_]+)/u).map((parte, i) =>
        parte.startsWith("#") ? (
          <span key={i} className="font-medium text-acento">
            {parte}
          </span>
        ) : (
          parte
        ),
      )}
    </>
  );
}

/** Selo de verificado (professor e escola): discreto, na cor institucional. */
function Verificado({ pessoa }: { pessoa?: Pessoa }) {
  if (pessoa?.papel !== "professor" && pessoa?.papel !== "escola") return null;
  return (
    <BadgeCheck
      role="img"
      className="size-[15px] shrink-0 fill-cepi text-superficie"
      aria-label={pessoa.papel === "escola" ? "Conta oficial da escola" : "Professor verificado"}
    />
  );
}

function papelDe(pessoa: Pessoa | undefined, souAutor: boolean) {
  if (souAutor) return "Você";
  if (!pessoa) return "Membro do CEPI";
  if (pessoa.papel === "professor") return pessoa.nome.startsWith("Profª") ? "Professora" : "Professor";
  if (pessoa.papel === "escola") return "Conta oficial";
  return pessoa.turma ?? "Estudante";
}

/** Número que desliza ao mudar (curtidas, respostas). */
function Contador({ valor }: { valor: number }) {
  return (
    <span className="relative inline-grid overflow-hidden tabular-nums">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={valor}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ duration: 0.18, ease: SUAVE }}
        >
          {fmt(valor)}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Ações do card: 32 px no desktop, 44 px no celular (alvo de toque do DS §16). */
const ACAO =
  "inline-flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-full px-2 text-[13px] transition-colors duration-150 active:scale-95 max-sm:h-11 max-sm:min-w-11 [&_svg]:size-[18px]";
const ITEM_MENU =
  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[14px] text-texto transition-colors hover:bg-superficie-2 hover:text-tinta max-sm:min-h-11 [&_svg]:size-4 [&_svg]:text-texto-2";

const dataDiaMes = (ts: number) => new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

export function PostCard({ post, ator, pessoas, alunaId, equipados, destacado, leve, contexto, pedidoResposta, onAbrirMaterial, onDenunciar, onRemover, onContestar }: Props) {
  const autor = pessoas[post.autorId];
  const eu = pessoas[ator.id];
  const souAutor = post.autorId === ator.id;
  const ehDuvida = post.tipo === "duvida";
  const tipo = TIPO[post.tipo];
  const IconeTipo = tipo.icone;
  const equipadosDe = (id: string) => (id === alunaId ? equipados : []);
  const curtido = curtiu(post, ator.id);
  const guardado = salvou(post, ator.id);
  const [abertas, setAbertas] = useState(false);
  const [respondendo, setRespondendo] = useState(false);
  const [menu, setMenu] = useState(false);
  const [texto, setTexto] = useState("");
  const [pedidoAtendido, setPedidoAtendido] = useState<number | null>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const enviando = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fecharMenu = useCallback(() => setMenu(false), []);
  useFecharFora(menuRef, menu, fecharMenu);
  const oficial = post.respostas.find((r) => r.oficial);
  // "Resolvida" só com a resposta oficial do professor (uma resposta marcada útil não basta).
  const resolvida = ehDuvida && !!oficial;
  const respostasOrdenadas = [...post.respostas].sort((a, b) => Number(!!b.oficial) - Number(!!a.oficial));
  const mostrarRespostas = abertas || destacado;
  const total = post.respostas.length;
  const nomeRespostas = (n: number) => (n === 1 ? (ehDuvida ? "resposta" : "comentário") : ehDuvida ? "respostas" : "comentários");
  const tags = post.tags.filter((t) => !post.texto.toLowerCase().includes(`#${t}`)).slice(0, 3);
  const papel = papelDe(autor, souAutor);
  const assunto = post.tipo === "publicacao" ? (post.disciplina ?? tipo.rotulo) : `${tipo.rotulo}${post.disciplina ? ` · ${post.disciplina}` : ""}`;
  // O professor remove publicações de alunos; nas de professor/coordenação só copia o link.
  const podeRemover = ator.professor && autor?.papel === "aluno";

  // Ao abrir a caixa, o envio fica liberado de novo (a trava de `enviar` só vale até ela fechar).
  useEffect(() => {
    if (!respondendo) return;
    enviando.current = false;
    campo.current?.focus({ preventScroll: true });
  }, [respondendo]);

  // "Responder" da coluna lateral: abre a caixa deste card (ajuste de estado na renderização, sem efeito).
  if (pedidoResposta && pedidoResposta.id === post.id && pedidoResposta.n !== pedidoAtendido) {
    setPedidoAtendido(pedidoResposta.n);
    if (!post.emRevisao) {
      setRespondendo(true);
      setAbertas(true);
    }
  }

  // A caixa continua montada por 0,2 s na saída (AnimatePresence), com o `enviar` e o texto antigos: sem a trava,
  // um segundo clique ou Ctrl+Enter nesse intervalo gravaria a mesma resposta de novo (pontos, XP e missão em dobro).
  const enviar = () => {
    const t = texto.trim();
    if (!t || enviando.current) return;
    enviando.current = true;
    responder(post.id, t);
    setTexto("");
    setRespondendo(false);
    setAbertas(true);
  };

  // Publicação em revisão não recebe respostas: o ícone só mostra/oculta as que existem.
  const alternarResposta = () => {
    if (post.emRevisao) {
      setAbertas((a) => !a);
      return;
    }
    setRespondendo(!respondendo);
    if (!respondendo) setAbertas(true);
  };

  const semTriagem = post.denuncia?.semTriagem
    ? "A triagem automática estava indisponível; a denúncia está na fila com o motivo informado."
    : null;

  return (
    <motion.article
      id={`post-${post.id}`}
      layout="position"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ duration: 0.22, ease: SUAVE }}
      aria-label={`${tipo.rotulo} de ${autor?.nome ?? "membro do CEPI"}`}
      className={cn(
        "relative scroll-mt-32 px-4 py-4 transition-colors duration-700 sm:px-5 sm:last:rounded-b-2xl",
        leve && "cv-auto",
        destacado && "bg-verde-mclaro",
      )}
    >
      {contexto && <div className="mb-2 flex items-center gap-1.5 text-[12.5px] text-texto-2 sm:pl-[52px] [&_svg]:size-3.5">{contexto}</div>}

      {/* Autor, papel, quando — e o assunto (tipo · disciplina) */}
      <header className="flex items-start gap-3">
        <LinkPessoa id={post.autorId} rotulo={autor?.nome} className="shrink-0">
          <Avatar nome={autor?.nome ?? "?"} iniciais={autor?.iniciais} equipados={equipadosDe(post.autorId)} />
        </LinkPessoa>
        <div className="min-w-0 flex-1">
          <p className="flex min-w-0 items-center gap-1 text-[14px] leading-5">
            <LinkPessoa id={post.autorId} className="min-w-0 truncate font-medium text-tinta hover:underline">
              {autor?.nome ?? "Membro do CEPI"}
            </LinkPessoa>
            <Verificado pessoa={autor} />
            <span className="hidden shrink-0 text-texto-2 sm:inline">· {papel}</span>
            <span className="shrink-0 text-texto-2">·</span>
            <Quando ts={post.criadoEm} className="shrink-0 text-texto-2" />
          </p>
          <p className="flex min-w-0 items-center gap-1 text-[13px] leading-5 text-texto-2">
            <span className="shrink-0 sm:hidden">{papel} ·</span>
            <IconeTipo className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{assunto}</span>
            {resolvida && (
              <span className="inline-flex shrink-0 items-center gap-0.5 text-acento">
                <span className="text-texto-2">·</span>
                <Check className="size-3.5" aria-hidden /> Resolvida
              </span>
            )}
          </p>
        </div>

        {!souAutor && (
          <div ref={menuRef} className="relative -mr-2 -mt-1 max-sm:-mr-3 max-sm:-mt-2">
            <button
              type="button"
              onClick={() => setMenu((m) => !m)}
              aria-label="Mais opções"
              aria-haspopup="menu"
              aria-expanded={menu}
              className={cn(
                "grid size-8 place-items-center rounded-full transition-colors duration-150 max-sm:size-11",
                menu ? "bg-superficie-2 text-tinta" : "text-texto-2 hover:bg-superficie-2 hover:text-tinta",
              )}
            >
              <Ellipsis className="size-[18px]" />
            </button>
            <AnimatePresence>
              {menu && (
                <motion.div
                  role="menu"
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: SUAVE }}
                  style={{ transformOrigin: "top right" }}
                  className="absolute right-0 top-full z-20 mt-1 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-borda bg-superficie p-1 shadow-flutuante"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenu(false);
                      void compartilharPost(post, autor);
                    }}
                    className={ITEM_MENU}
                  >
                    <Link2 /> {typeof navigator !== "undefined" && typeof navigator.share === "function" ? "Compartilhar" : "Copiar link"}
                  </button>
                  {podeRemover && (
                    <>
                      <div className="my-1 h-px bg-borda" aria-hidden />
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenu(false);
                          onRemover(post);
                        }}
                        className={cn(ITEM_MENU, "text-alerta hover:bg-red-50 hover:text-alerta [&_svg]:text-current")}
                      >
                        <Trash2 />
                        Remover publicação
                      </button>
                    </>
                  )}
                  {!ator.professor && (
                    <>
                      <div className="my-1 h-px bg-borda" aria-hidden />
                      <button
                        type="button"
                        role="menuitem"
                        disabled={!!post.denuncia}
                        onClick={() => {
                          setMenu(false);
                          onDenunciar(post);
                        }}
                        className={cn(ITEM_MENU, "text-alerta hover:bg-red-50 hover:text-alerta disabled:text-texto-2 disabled:hover:bg-transparent [&_svg]:text-current")}
                      >
                        <Flag />
                        {post.denuncia ? "Denúncia já enviada" : "Denunciar publicação"}
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </header>

      <div className="mt-2 sm:pl-[52px]">
        {post.aguardandoEnvio && souAutor && (
          <p className="mb-2.5 flex items-center gap-1.5 text-[12.5px] font-medium text-ouro">
            <CloudUpload className="size-4 shrink-0" aria-hidden />
            Aguardando envio · salvo neste aparelho
          </p>
        )}

        {post.emRevisao && (
          <div
            className="mb-2.5 rounded-lg bg-amber-50 px-3 py-2 text-[13px] leading-snug text-amber-900"
            title="A triagem automática sinalizou possíveis termos ofensivos. Nenhuma punição é aplicada automaticamente."
          >
            <p className="flex items-start gap-2">
              <ShieldAlert className="mt-px size-4 shrink-0 text-ambar" />
              <span>
                <span className="font-medium">Em revisão pela coordenação.</span> Só você vê esta publicação por enquanto.
              </span>
            </p>
            {souAutor &&
              (post.contestacao ? (
                <p className="mt-1.5 pl-6 text-[12.5px]">Contestação enviada em {dataDiaMes(post.contestacao.em)} · aguardando revisão</p>
              ) : (
                <button
                  type="button"
                  onClick={() => onContestar(post)}
                  className="-my-0.5 ml-6 inline-flex items-center rounded-md py-1 text-[12.5px] font-medium underline underline-offset-2 transition-colors hover:text-amber-950 max-sm:min-h-11"
                >
                  Isso foi um engano? Conteste aqui
                </button>
              ))}
          </div>
        )}

        {post.denuncia && (
          <p className="mb-2.5 flex items-start gap-2 rounded-lg bg-superficie-2 px-3 py-2 text-[13px] leading-snug text-texto-2">
            <ShieldCheck className="mt-px size-4 shrink-0" />
            <span>
              {ator.professor ? "Denunciada" : "Você denunciou"} ({post.denuncia.motivo.toLowerCase()}).{" "}
              {semTriagem ?? (
                <>
                  Triagem: <span className="font-medium text-texto">{post.denuncia.categoriaIA}</span>, prioridade {post.denuncia.prioridade} — em análise.
                </>
              )}
            </span>
          </p>
        )}

        <p className="whitespace-pre-line text-[15px] leading-[1.55] text-texto">
          <TextoComTags texto={post.texto} />
        </p>
        {tags.length > 0 && (
          <p className="mt-1 flex flex-wrap gap-x-2 text-[14px] font-medium text-acento">
            {tags.map((t) => (
              <span key={t}>#{t}</span>
            ))}
          </p>
        )}

        {ehDuvida && souAutor && (post.sugestoes?.length ?? 0) > 0 && <Sugestoes ids={post.sugestoes!} atorId={ator.id} />}

        {post.anexo && (
          <div className="group/anexo mt-3 flex items-center gap-3 rounded-xl border border-borda p-2.5 pr-3 transition-colors duration-150 hover:bg-superficie-2">
            <button
              type="button"
              onClick={() => onAbrirMaterial(post)}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left toque:min-h-11"
              aria-label={`Abrir ${post.anexo.nome}`}
            >
              {post.anexo.previa ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.anexo.previa}
                  alt={post.anexo.descricao || `Imagem enviada por ${autor?.nome ?? "um membro do CEPI"}`}
                  className="size-14 shrink-0 rounded-lg object-cover ring-1 ring-inset ring-borda"
                />
              ) : (
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-superficie-2 text-texto-2 ring-1 ring-inset ring-borda transition-colors duration-150 group-hover/anexo:bg-superficie">
                  <FileText className="size-5" strokeWidth={1.75} />
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-medium text-tinta">{post.anexo.nome}</span>
                <span className="block truncate text-[12.5px] text-texto-2">
                  {resumoDoAnexo(post.anexo, true)}
                </span>
              </span>
            </button>
            <Button variante="secundario" tamanho="sm" className="max-sm:h-11 max-sm:min-w-11" onClick={() => baixarDoPost(post, autor)} aria-label={`Baixar ${post.anexo.nome}`}>
              <Download /> <span className="max-[379px]:hidden">Baixar</span>
            </Button>
          </div>
        )}

        {/* Ações: ícones e contadores, alinhados à esquerda */}
        <div className="-ml-2 mt-2 flex items-center gap-1 sm:gap-3">
          <button
            type="button"
            onClick={() => curtir(post.id)}
            aria-pressed={curtido}
            aria-label={`Curtir · ${post.curtidas}`}
            className={cn(ACAO, curtido ? "text-alerta hover:bg-red-50" : "text-texto-2 hover:bg-red-50 hover:text-alerta")}
          >
            {/* Pop por keyframes no `animate` (e não no `initial`): o AnimatePresence do feed bloqueia animações de entrada internas. */}
            <motion.span
              initial={false}
              animate={{ scale: curtido ? [0.8, 1.22, 1] : 1 }}
              transition={{ duration: 0.3, times: [0, 0.5, 1], ease: "easeOut" }}
              className="grid"
            >
              <Heart className={cn(curtido && "fill-current")} />
            </motion.span>
            {post.curtidas > 0 && <Contador valor={post.curtidas} />}
          </button>
          <button
            type="button"
            onClick={alternarResposta}
            aria-expanded={post.emRevisao ? mostrarRespostas : respondendo}
            aria-label={`${ehDuvida ? "Responder" : "Comentar"} · ${total} ${nomeRespostas(total)}`}
            className={cn(ACAO, respondendo ? "bg-superficie-2 text-tinta" : "text-texto-2 hover:bg-superficie-2 hover:text-tinta")}
          >
            <MessageCircle />
            {total > 0 && <Contador valor={total} />}
          </button>
          <button
            type="button"
            onClick={() => salvar(post.id)}
            aria-pressed={guardado}
            aria-label={guardado ? "Remover dos salvos" : "Salvar"}
            title={guardado ? "Salvo" : "Salvar"}
            className={cn(ACAO, guardado ? "text-tinta hover:bg-superficie-2" : "text-texto-2 hover:bg-superficie-2 hover:text-tinta")}
          >
            <motion.span initial={false} animate={{ scale: guardado ? [0.85, 1.12, 1] : 1 }} transition={{ duration: 0.25 }} className="grid">
              <Bookmark className={cn(guardado && "fill-current")} />
            </motion.span>
          </button>
          <button
            type="button"
            onClick={() => void compartilharPost(post, autor)}
            aria-label="Compartilhar (copiar link)"
            title="Copiar link"
            className={cn(ACAO, "text-texto-2 hover:bg-superficie-2 hover:text-tinta")}
          >
            <Share />
          </button>
        </div>

        {/* Caixa de resposta */}
        <AnimatePresence initial={false}>
          {respondendo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: SUAVE }}
              className="overflow-hidden"
            >
              <div className="flex items-start gap-2.5 pb-1 pt-2.5">
                <Avatar nome={eu?.nome ?? "Você"} iniciais={eu?.iniciais} tamanho="sm" equipados={equipadosDe(ator.id)} />
                <div className="min-w-0 flex-1">
                  <textarea
                    ref={campo}
                    rows={2}
                    value={texto}
                    maxLength={MAX_RESPOSTA}
                    onChange={(e) => setTexto(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) enviar();
                      if (e.key === "Escape") setRespondendo(false);
                    }}
                    placeholder={ehDuvida ? `Explique para ${primeiroNome(autor?.nome ?? "")} como você pensou…` : "Escreva um comentário…"}
                    aria-label={ehDuvida ? "Sua resposta" : "Seu comentário"}
                    className="w-full resize-none rounded-xl border border-borda bg-superficie px-3 py-2 text-[14px] leading-relaxed text-tinta outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-texto-2 focus:border-verde focus:ring-3 focus:ring-verde/15"
                  />
                  <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                    {ehDuvida && !souAutor ? (
                      <span className="text-[12px] text-texto-2">{ator.professor ? "Sua resposta fica fixada como oficial." : "+15 pontos e +10 XP ao responder"}</span>
                    ) : (
                      <span className="hidden text-[12px] text-texto-2 sm:inline">Ctrl + Enter para enviar</span>
                    )}
                    {texto.length >= CONTADOR_A_PARTIR_DE && (
                      <span className={cn("text-[12px] tabular-nums", texto.length >= MAX_RESPOSTA ? "font-medium text-alerta" : "text-texto-2")} aria-live="polite">
                        {texto.length}/{MAX_RESPOSTA}
                      </span>
                    )}
                    <div className="ml-auto flex shrink-0 gap-1.5">
                      <Button variante="fantasma" tamanho="sm" className="max-sm:h-11" onClick={() => setRespondendo(false)}>
                        Cancelar
                      </Button>
                      <Button tamanho="sm" className="max-sm:h-11" onClick={enviar} disabled={!texto.trim()}>
                        {ehDuvida ? "Responder" : "Enviar"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Respostas — a oficial do professor fica fixada e visível mesmo com a lista recolhida (US03). */}
        {total > 0 && (
          <div className="mt-2">
            {mostrarRespostas ? (
              <>
                <ul className="space-y-3.5 border-l-2 border-borda py-1 pl-3.5" aria-label={ehDuvida ? "Respostas" : "Comentários"}>
                  <AnimatePresence initial={false}>
                    {respostasOrdenadas.map((r) => (
                      <RespostaItem key={r.id} resposta={r} pessoas={pessoas} post={post} ator={ator} alunaId={alunaId} equipados={equipados} />
                    ))}
                  </AnimatePresence>
                </ul>
                <button
                  type="button"
                  onClick={() => setAbertas(false)}
                  className="mt-1.5 rounded-md py-1 text-[13px] font-medium text-texto-2 transition-colors hover:text-tinta max-sm:min-h-11"
                >
                  Ocultar {nomeRespostas(2)}
                </button>
              </>
            ) : (
              <>
                {oficial && (
                  <ul className="border-l-2 border-borda py-1 pl-3.5" aria-label="Resposta oficial">
                    <RespostaItem resposta={oficial} pessoas={pessoas} post={post} ator={ator} alunaId={alunaId} equipados={equipados} />
                  </ul>
                )}
                {(!oficial || total > 1) && (
                  <button
                    type="button"
                    onClick={() => setAbertas(true)}
                    className="mt-1 inline-flex items-center gap-1 rounded-md py-1 text-[13px] font-medium text-texto-2 transition-colors hover:text-tinta max-sm:min-h-11"
                  >
                    {oficial ? `Ver todas as ${total} ${nomeRespostas(total)}` : `Ver ${total} ${nomeRespostas(total)}`}
                    <ChevronDown className="size-3.5" />
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
}

/** Sugestão do Portal: dúvidas parecidas que já têm resposta e materiais (nunca os posts do próprio autor). */
function Sugestoes({ ids, atorId }: { ids: string[]; atorId: string }) {
  const posts = useSeletor((e) => e.posts);
  const achados = ids
    .map((id) => posts.find((p) => p.id === id))
    .filter((p): p is Post => !!p && p.autorId !== atorId && (p.tipo === "material" || (p.tipo === "duvida" && p.respostas.length > 0)));
  if (achados.length === 0) return null;
  return (
    <div className="mt-3 rounded-xl bg-superficie-2 px-3.5 py-3" aria-label="Parecidas com a sua">
      <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-tinta">
        <Sparkles className="size-3.5 text-texto-2" aria-hidden /> Parecidas com a sua
      </p>
      <ul className="mt-1.5 space-y-0.5">
        {achados.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => focarPost(p.id)}
              className="-mx-1.5 flex w-[calc(100%+12px)] items-start gap-2 rounded-md px-1.5 py-1.5 text-left text-[13px] leading-snug text-texto transition-[background-color,transform] duration-150 hover:bg-superficie active:scale-[0.99] max-sm:min-h-11 max-sm:items-center"
            >
              <span className="line-clamp-2 min-w-0 flex-1">{p.texto}</span>
              <span className="shrink-0 pt-px text-[12px] tabular-nums text-texto-2">
                {p.tipo === "material" ? "Material" : `${p.respostas.length} ${p.respostas.length === 1 ? "resposta" : "respostas"}`}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface PropsResposta {
  resposta: Resposta;
  pessoas: Record<string, Pessoa>;
  post: Post;
  ator: Ator;
  alunaId: string;
  equipados: string[];
}

function RespostaItem({ resposta: r, pessoas, post, ator, alunaId, equipados }: PropsResposta) {
  const autor = pessoas[r.autorId];
  const minha = r.autorId === ator.id;
  const ehDuvida = post.tipo === "duvida";
  // O autor da dúvida marca a resposta que o ajudou; o professor marca respostas de alunos (não as dele, nem as já marcadas).
  const marcaAutor = !ator.professor && post.autorId === ator.id && ehDuvida && !minha && !r.util;
  const marcaProfessor = ator.professor && ehDuvida && autor?.papel === "aluno" && !minha && !r.util;
  const marcar = () => (ator.professor ? marcarRespostaUtil(post.id, r.id) : marcarUtil(post.id, r.id));

  return (
    <motion.li layout="position" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: SUAVE }}>
      {r.oficial && (
        <p className="mb-1.5 flex items-center gap-1 text-[12px] font-medium text-acento">
          <Pin className="size-3.5 -rotate-45" aria-hidden /> Resposta oficial
        </p>
      )}
      <div className="flex items-start gap-2.5">
        <LinkPessoa id={r.autorId} rotulo={autor?.nome} className="shrink-0">
          <Avatar nome={autor?.nome ?? "?"} iniciais={autor?.iniciais} tamanho="sm" equipados={r.autorId === alunaId ? equipados : []} />
        </LinkPessoa>
        <div className="min-w-0 flex-1">
          <p className="flex min-w-0 items-center gap-1 text-[13.5px] leading-5">
            <LinkPessoa id={r.autorId} className="min-w-0 truncate font-medium text-tinta hover:underline">
              {autor?.nome ?? "Membro do CEPI"}
            </LinkPessoa>
            <Verificado pessoa={autor} />
            {minha && <span className="shrink-0 text-texto-2">· você</span>}
            <span className="shrink-0 text-texto-2">·</span>
            <Quando ts={r.criadoEm} className="shrink-0 text-[12.5px] text-texto-2" />
          </p>
          <p className="mt-0.5 text-[14px] leading-relaxed text-texto">{r.texto}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-texto-2 empty:hidden">
            {(marcaAutor || marcaProfessor) && (
              <button
                type="button"
                onClick={marcar}
                aria-label="Marcar resposta como útil"
                title="Quem respondeu ganha +25 pontos e +25 XP"
                className="-mx-1.5 inline-flex h-7 items-center gap-1 rounded-md px-1.5 font-medium text-texto-2 transition-colors hover:bg-verde-mclaro hover:text-acento max-sm:h-11 max-sm:px-3"
              >
                <Check className="size-3.5" /> Útil
              </button>
            )}
            {r.util && (
              <span className="inline-flex items-center gap-1 font-medium text-acento">
                <CircleCheck className="size-3.5" /> Útil
              </span>
            )}
            {minha && !r.util && ehDuvida && !ator.professor && <span>Aguardando {primeiroNome(pessoas[post.autorId]?.nome ?? "")} avaliar</span>}
            {r.uteis > 0 && <span className="tabular-nums">{r.uteis === 1 ? "1 achou útil" : `${r.uteis} acharam útil`}</span>}
          </div>
        </div>
      </div>
    </motion.li>
  );
}
