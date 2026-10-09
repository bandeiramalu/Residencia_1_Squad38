"use client";

import { CloudOff, RotateCw } from "lucide-react";
import Link from "next/link";
import { Component, Fragment, useState, type ReactNode } from "react";
import { Button, classesDoBotao } from "@/components/ui/Button";
import { simulacaoAtiva } from "@/lib/simulacoes";

/**
 * Tela 72 — "Não foi possível carregar agora". Mesma tela para dois casos:
 *  1. erro de verdade ao desenhar uma tela (limite de erro abaixo, vale para o Next e para a demonstração);
 *  2. simulação "Falha ao carregar tela" do modo apresentação (sem lançar exceção, nada no console).
 * O que a pessoa escreveu nunca se perde: rascunhos e dados ficam fora das telas.
 */
export function TelaNaoCarregou({ aoTentar, aoVoltar, inicio }: { aoTentar: () => void; aoVoltar: () => void; inicio: string }) {
  return (
    <div className="mx-auto max-w-sm py-16 text-center" role="alert">
      <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-superficie-2 text-texto-2 ring-1 ring-borda" aria-hidden>
        <CloudOff className="size-6" />
      </div>
      <h1 className="text-lg font-semibold text-tinta">Não foi possível carregar agora</h1>
      <p className="mt-1.5 text-sm text-texto-2">O servidor demorou para responder. Nada do que você escreveu foi perdido.</p>
      <div className="mt-6 flex flex-col items-stretch justify-center gap-2.5 sm:flex-row sm:items-center">
        <Button tamanho="lg" onClick={aoTentar}>
          <RotateCw /> Tentar novamente
        </Button>
        <Link href={inicio} onClick={aoVoltar} className={classesDoBotao({ variante: "secundario", tamanho: "lg" })}>
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
}

/** Erros que o Next usa para controlar a navegação (redirect, notFound…) não são falhas: seguem para o roteador. */
function erroDoNext(erro: unknown) {
  const digest = (erro as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_");
}

interface PropsLimite {
  /** Caminho atual: ao mudar de rota o erro é esquecido e a nova tela tenta de novo. */
  caminho: string;
  /** Home do papel (destino de "Voltar ao Início"). */
  inicio: string;
  /** Chamados ao "Tentar novamente" e ao "Voltar ao Início" (o pai remonta o conteúdo). */
  aoTentar: () => void;
  aoVoltar: () => void;
  children: ReactNode;
}
interface EstadoLimite {
  caminho: string;
  erro: unknown;
  falhou: boolean;
}

class LimiteDeErro extends Component<PropsLimite, EstadoLimite> {
  state: EstadoLimite = { caminho: this.props.caminho, erro: null, falhou: false };

  static getDerivedStateFromError(erro: unknown): Partial<EstadoLimite> {
    return { erro, falhou: true };
  }

  static getDerivedStateFromProps(props: PropsLimite, state: EstadoLimite): Partial<EstadoLimite> | null {
    return props.caminho !== state.caminho ? { caminho: props.caminho, erro: null, falhou: false } : null;
  }

  private tentar = () => {
    this.setState({ erro: null, falhou: false });
    this.props.aoTentar();
  };

  private voltar = () => {
    this.setState({ erro: null, falhou: false });
    this.props.aoVoltar();
  };

  render() {
    if (!this.state.falhou) return this.props.children;
    // redirect()/notFound() do Next continuam o caminho deles (o roteador cuida).
    if (erroDoNext(this.state.erro)) throw this.state.erro;
    return <TelaNaoCarregou aoTentar={this.tentar} aoVoltar={this.voltar} inicio={this.props.inicio} />;
  }
}

/**
 * Conteúdo de uma rota dentro do `<main>`: mostra a tela 72 quando a tela quebra ou quando a simulação
 * "Falha ao carregar tela" está ligada (uma vez por navegação: "Tentar novamente" carrega a tela de verdade).
 */
export function ConteudoSeguro({ caminho, inicio, children }: { caminho: string; inicio: string; children: ReactNode }) {
  // Decidido uma vez por navegação (e não a cada render): ligar a simulação não derruba a tela que já está aberta.
  const [navegacao, setNavegacao] = useState(() => ({ caminho, falhar: simulacaoAtiva("carregar"), poupar: "" }));
  if (navegacao.caminho !== caminho) {
    setNavegacao({ caminho, falhar: simulacaoAtiva("carregar") && navegacao.poupar !== caminho, poupar: "" });
  }
  // Muda a cada "Tentar novamente": a `key` remonta a tela com tudo do zero.
  const [tentativa, setTentativa] = useState(0);

  const tentar = () => {
    setNavegacao({ caminho, falhar: false, poupar: "" });
    setTentativa((n) => n + 1);
  };
  // "Voltar ao Início" leva a uma tela que carrega de verdade, mesmo com a simulação ainda ligada.
  const voltar = () => {
    setNavegacao({ caminho, falhar: false, poupar: inicio });
    setTentativa((n) => n + 1);
  };

  if (navegacao.falhar) return <TelaNaoCarregou aoTentar={tentar} aoVoltar={voltar} inicio={inicio} />;
  return (
    <LimiteDeErro caminho={caminho} inicio={inicio} aoTentar={tentar} aoVoltar={voltar}>
      <Fragment key={tentativa}>{children}</Fragment>
    </LimiteDeErro>
  );
}
