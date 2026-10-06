"use client";

import { Send, Users } from "lucide-react";
import { useState } from "react";
import { ICONE_ATIVIDADE } from "@/components/atividades/comum";
import { SeletorArquivo } from "@/components/feed/SeletorArquivo";
import { Nota } from "@/components/ui/Blocos";
import { Button } from "@/components/ui/Button";
import { AreaTexto, Campo, Entrada, Seletor } from "@/components/ui/Campo";
import { RodapeSheet } from "@/components/ui/RodapeSheet";
import { Segmentado } from "@/components/ui/Segmentado";
import { Sheet } from "@/components/ui/Sheet";
import { ROTULO_ATIVIDADE } from "@/data/atividades";
import { DISCIPLINAS, type Disciplina } from "@/data/escola";
import { PROFESSOR } from "@/data/professor";
import { alunosDaTurma } from "@/data/turmas";
import { useAgora } from "@/hooks/useAgora";
import type { ArquivoSalvo } from "@/lib/arquivos";
import { cn } from "@/lib/cn";
import { infoDoAnexo } from "@/lib/materiais";
import { criarAtividade } from "@/store/actions";
import type { Anexo, TipoAtividade } from "@/store/types";
import { OPCOES_TURMA, Stepper, useTurmaProfessor } from "./comum";

const TIPOS = Object.keys(ROTULO_ATIVIDADE) as TipoAtividade[];

/** Recompensa sugerida por tipo (o professor ajusta). */
const SUGESTAO: Record<TipoAtividade, { pontos: number; xp: number }> = {
  lista: { pontos: 40, xp: 30 },
  quiz: { pontos: 25, xp: 20 },
  leitura: { pontos: 20, xp: 15 },
  entrega: { pontos: 40, xp: 30 },
  projeto: { pontos: 80, xp: 60 },
};

function paraInputData(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "2026-10-02" → timestamp às 23h59 do dia (horário local). */
function deInputData(valor: string) {
  const [a, m, d] = valor.split("-").map(Number);
  if (!a || !m || !d) return NaN;
  return new Date(a, m - 1, d, 23, 59).getTime();
}

/** Formulário de nova atividade (título, tipo, turma, prazo, recompensa e anexo). */
export function NovaAtividadeSheet({ aberto, onFechar, onCriada }: { aberto: boolean; onFechar: () => void; onCriada: (id: string) => void }) {
  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo="Nova atividade" subtitulo="A turma é avisada na hora" largura="lg">
      <Formulario onCancelar={onFechar} onCriada={onCriada} />
    </Sheet>
  );
}

function Formulario({ onCancelar, onCriada }: { onCancelar: () => void; onCriada: (id: string) => void }) {
  const agora = useAgora(60_000);
  const turmaPainel = useTurmaProfessor();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<TipoAtividade>("lista");
  const [disciplina, setDisciplina] = useState<Disciplina>(PROFESSOR.disciplina);
  const [turma, setTurma] = useState(turmaPainel);
  const [prazo, setPrazo] = useState(() => paraInputData(agora + 3 * 86_400_000));
  const [pontos, setPontos] = useState(SUGESTAO.lista.pontos);
  const [xp, setXp] = useState(SUGESTAO.lista.xp);
  const [arquivo, setArquivo] = useState<ArquivoSalvo | null>(null);
  const [gerarPdf, setGerarPdf] = useState(false);
  const [tentou, setTentou] = useState(false);

  const hoje = paraInputData(agora);
  const prazoTs = deInputData(prazo);
  const erros = {
    titulo: titulo.trim().length < 4 ? "Dê um título com pelo menos 4 letras." : undefined,
    descricao: descricao.trim().length < 10 ? "Explique o que o aluno deve fazer (mín. 10 caracteres)." : undefined,
    prazo: !Number.isFinite(prazoTs) ? "Escolha a data de entrega." : prazo < hoje ? "O prazo não pode estar no passado." : undefined,
    recompensa: pontos <= 0 && xp <= 0 ? "Defina pontos ou XP para a nota máxima." : undefined,
  };
  const valido = !Object.values(erros).some(Boolean);
  const qtdAlunos = alunosDaTurma(turma).length;

  const escolherTipo = (t: TipoAtividade) => {
    setTipo(t);
    setPontos(SUGESTAO[t].pontos);
    setXp(SUGESTAO[t].xp);
  };

  const publicar = () => {
    setTentou(true);
    if (!valido) return;
    let anexo: Anexo | undefined;
    if (arquivo) {
      anexo = { nome: arquivo.nome, paginas: arquivo.paginas ?? 0, tamanho: arquivo.tamanho, arquivoId: arquivo.id, mime: arquivo.mime, previa: arquivo.previa };
    } else if (gerarPdf) {
      const nome = `${titulo.trim().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40) || "atividade"}.pdf`;
      anexo = { nome, ...infoDoAnexo(nome, { titulo: titulo.trim(), descricao: descricao.trim(), disciplina, autor: PROFESSOR.nome }) };
    }
    const id = criarAtividade({
      titulo,
      descricao,
      tipo,
      disciplina,
      turma,
      prazo: prazoTs,
      pontos,
      xp,
      anexo,
    });
    onCriada(id);
  };

  return (
    <div className="space-y-5">
      <Campo rotulo="Título" htmlFor="at-titulo" erro={tentou && erros.titulo}>
        <Entrada id="at-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Lista 8 — Função quadrática" maxLength={80} autoComplete="off" />
      </Campo>

      <Campo rotulo="Descrição" htmlFor="at-descricao" erro={tentou && erros.descricao} dica="O que entregar, como será avaliado e onde está o material.">
        <AreaTexto id="at-descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Resolva as questões 1 a 10 e envie com o raciocínio…" maxLength={400} />
      </Campo>

      <div>
        <p className="mb-1.5 text-[13px] font-medium text-tinta">Tipo</p>
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5" role="radiogroup" aria-label="Tipo da atividade">
          {TIPOS.map((t) => {
            const Icone = ICONE_ATIVIDADE[t];
            const ativo = t === tipo;
            return (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={ativo}
                onClick={() => escolherTipo(t)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-[12px] font-medium leading-tight transition-[background-color,border-color,color] duration-150 active:scale-[0.98]",
                  ativo ? "border-verde bg-verde-mclaro text-acento" : "border-borda bg-superficie text-texto-2 hover:bg-superficie-2 hover:text-tinta",
                )}
              >
                <Icone className="size-4" aria-hidden />
                <span className="text-center">{ROTULO_ATIVIDADE[t]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Disciplina" htmlFor="at-disciplina">
          <Seletor id="at-disciplina" value={disciplina} onChange={(e) => setDisciplina(e.target.value as Disciplina)}>
            {DISCIPLINAS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Seletor>
        </Campo>
        <div className="space-y-1.5">
          <p className="text-[13px] font-medium text-tinta">Turma</p>
          <Segmentado opcoes={OPCOES_TURMA} valor={turma} onChange={setTurma} grupo="nova-atividade-turma" rotulo="Turma da atividade" />
        </div>
        <Campo rotulo="Prazo de entrega" htmlFor="at-prazo" erro={tentou && erros.prazo} dica="Até 23h59 do dia escolhido.">
          <Entrada id="at-prazo" type="date" value={prazo} min={hoje} onChange={(e) => setPrazo(e.target.value)} />
        </Campo>
      </div>

      <div>
        <p className="mb-1.5 text-[13px] font-medium text-tinta">
          Anexo <span className="font-normal text-texto-2">· opcional</span>
        </p>
        <SeletorArquivo valor={arquivo} onChange={setArquivo} titulo="Anexar arquivo da atividade" />
        <label className={cn("mt-2.5 flex cursor-pointer items-start gap-2.5 text-[13px] leading-snug", arquivo ? "opacity-50" : "text-texto")}>
          <input type="checkbox" checked={gerarPdf && !arquivo} disabled={!!arquivo} onChange={(e) => setGerarPdf(e.target.checked)} className="mt-0.5 size-4 accent-verde" />
          <span>
            Gerar um PDF a partir da descrição
            <span className="block text-[12px] text-texto-2">Sem arquivo, os alunos baixam um PDF com o enunciado que você escreveu.</span>
          </span>
        </label>
      </div>

      <div>
        <p className="mb-1.5 text-[13px] font-medium text-tinta">Recompensa pela nota 10</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Stepper valor={pontos} onChange={setPontos} passo={5} max={200} rotulo="pontos" sufixo="pontos" atalhos={[20, 40, 60, 80]} />
          <Stepper valor={xp} onChange={setXp} passo={5} max={150} rotulo="XP" sufixo="XP" atalhos={[15, 30, 45, 60]} />
        </div>
        {tentou && erros.recompensa && <p className="mt-1.5 text-[12px] font-medium text-alerta">{erros.recompensa}</p>}
        <p className="mt-2 text-[12px] leading-snug text-texto-2">A recompensa é proporcional à nota: nota 8 rende {Math.round(pontos * 0.8)} pontos e {Math.round(xp * 0.8)} XP.</p>
      </div>

      <Nota icone={<Users />}>
        <span className="font-medium text-tinta">{turma}</span> · {qtdAlunos} alunos recebem uma notificação.
      </Nota>

      <RodapeSheet>
        <Button variante="secundario" className="flex-1" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button className="flex-[2]" onClick={publicar} disabled={tentou && !valido}>
          <Send /> Publicar atividade
        </Button>
      </RodapeSheet>
    </div>
  );
}
