"use client";

import { ArrowRight, ChevronDown, Eye, EyeOff, GraduationCap, IdCard, Lock, Mail, Presentation } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { BotaoTema } from "@/components/shell/TemaToggle";
import { Button } from "@/components/ui/Button";
import { Campo, Entrada } from "@/components/ui/Campo";
import { Segmentado } from "@/components/ui/Segmentado";
import { ESCOLA } from "@/data/escola";
import { CONTAS_DEMO, ErroLogin, confirmarMatricula, entrar, entrarComoDemo, redefinirSenha, type PapelSessao } from "@/lib/auth";

function destinoSeguro(padrao: string) {
  const voltar = new URLSearchParams(window.location.search).get("voltar");
  // Só caminhos internos (evita redirecionamento aberto).
  return voltar && voltar.startsWith("/") && !voltar.startsWith("//") ? voltar : padrao;
}

/** Entrada no portal: um cartão simples, no padrão visual do portal da escola. */
export function LoginView() {
  const router = useRouter();
  const [papel, setPapel] = useState<PapelSessao>("aluno");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [etapa, setEtapa] = useState<"entrar" | "matricula" | "nova" | "pronto">("entrar");
  const [matricula, setMatricula] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [contasAbertas, setContasAbertas] = useState(false);
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  const trocarPapel = (p: PapelSessao) => {
    setPapel(p);
    setErro(null);
  };

  const voltarAoLogin = () => {
    setEtapa("entrar");
    setErro(null);
    setMatricula("");
    setNovaSenha("");
  };

  const confirmar = (e: FormEvent) => {
    e.preventDefault();
    if (!confirmarMatricula(papel, email, matricula)) {
      setErro("E-mail e matrícula não conferem com nenhuma conta.");
      return;
    }
    setErro(null);
    setEtapa("nova");
  };

  const salvarNovaSenha = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await redefinirSenha(papel, novaSenha);
      setSenha("");
      setErro(null);
      setEtapa("pronto");
    } catch (err) {
      setErro(err instanceof ErroLogin ? err.message : "Não foi possível salvar a nova senha.");
    }
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setErro(null);
    setEntrando(true);
    try {
      const home = await entrar(email, senha, papel);
      router.replace(papel === "aluno" ? destinoSeguro(home) : home);
    } catch (err) {
      setErro(err instanceof ErroLogin ? err.message : "Não foi possível entrar agora. Tente de novo.");
      setEntrando(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-14 items-center justify-between border-b border-borda bg-superficie px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Image src="/cepi-logo.png" alt={ESCOLA.nome} width={32} height={32} className="size-8 rounded-lg bg-white object-contain ring-1 ring-borda" priority />
          <span className="text-[14px] font-semibold text-tinta">{ESCOLA.nome}</span>
        </div>
        <BotaoTema />
      </header>

      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:items-center sm:py-16">
        <div className="w-full max-w-[400px]">
          <div className="rounded-2xl border border-borda bg-superficie p-6 sm:p-8">
            <h1 className="text-xl font-semibold tracking-tight text-tinta">
              {etapa === "entrar" ? "Entrar no portal" : etapa === "pronto" ? "Senha atualizada" : "Esqueci a senha"}
            </h1>
            <p className="mt-1 text-sm text-texto-2">
              {etapa === "entrar" && "Use seu e-mail institucional."}
              {etapa === "matricula" && "Confirme seu e-mail e sua matrícula."}
              {etapa === "nova" && "Escolha uma nova senha (mínimo de 6 caracteres)."}
              {etapa === "pronto" && "Agora é só entrar com a nova senha."}
            </p>

            {etapa === "entrar" && (
              <form onSubmit={enviar} className="mt-6 space-y-4" noValidate>
                <Segmentado
                  grupo="login-papel"
                  rotulo="Tipo de acesso"
                  valor={papel}
                  onChange={trocarPapel}
                  opcoes={[
                    { id: "aluno", rotulo: <><GraduationCap /> Aluno</> },
                    { id: "professor", rotulo: <><Presentation /> Professor</> },
                  ]}
                />
                <Campo rotulo="E-mail" htmlFor="email">
                  <Entrada id="email" type="email" autoComplete="username" icone={<Mail />} value={email} onChange={(e) => setEmail(e.target.value)} required />
                </Campo>
                <Campo rotulo="Senha" htmlFor="senha" erro={erro}>
                  <div className="relative">
                    <Entrada
                      id="senha"
                      type={verSenha ? "text" : "password"}
                      autoComplete="current-password"
                      icone={<Lock />}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setVerSenha((v) => !v)}
                      aria-label={verSenha ? "Esconder senha" : "Mostrar senha"}
                      className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-texto-2 hover:bg-superficie-2 hover:text-tinta"
                    >
                      {verSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </Campo>
                <Button type="submit" tamanho="lg" bloco carregando={entrando}>
                  {entrando ? "Entrando…" : "Entrar"} {!entrando && <ArrowRight />}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setErro(null);
                    setEtapa("matricula");
                  }}
                  className="block w-full text-center text-[13px] font-medium text-texto-2 underline-offset-4 hover:text-tinta hover:underline"
                >
                  Esqueci a senha
                </button>
              </form>
            )}

            {etapa === "matricula" && (
              <form onSubmit={confirmar} className="mt-6 space-y-4" noValidate>
                <Segmentado
                  grupo="recuperar-papel"
                  rotulo="Tipo de acesso"
                  valor={papel}
                  onChange={trocarPapel}
                  opcoes={[
                    { id: "aluno", rotulo: <><GraduationCap /> Aluno</> },
                    { id: "professor", rotulo: <><Presentation /> Professor</> },
                  ]}
                />
                <Campo rotulo="E-mail" htmlFor="rec-email">
                  <Entrada id="rec-email" type="email" autoComplete="username" icone={<Mail />} value={email} onChange={(e) => setEmail(e.target.value)} required />
                </Campo>
                <Campo rotulo="Matrícula" htmlFor="rec-matricula" erro={erro} dica={papel === "aluno" ? "Está na sua carteirinha escolar." : "Registro funcional na secretaria."}>
                  <Entrada id="rec-matricula" icone={<IdCard />} value={matricula} onChange={(e) => setMatricula(e.target.value)} autoComplete="off" required />
                </Campo>
                <Button type="submit" tamanho="lg" bloco>
                  Confirmar <ArrowRight />
                </Button>
                <button type="button" onClick={voltarAoLogin} className="block w-full text-center text-[13px] font-medium text-texto-2 hover:text-tinta">
                  Voltar ao login
                </button>
              </form>
            )}

            {etapa === "nova" && (
              <form onSubmit={salvarNovaSenha} className="mt-6 space-y-4" noValidate>
                <Campo rotulo="Nova senha" htmlFor="nova-senha" erro={erro}>
                  <Entrada id="nova-senha" type="password" autoComplete="new-password" icone={<Lock />} value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} required />
                </Campo>
                <Button type="submit" tamanho="lg" bloco>
                  Salvar nova senha
                </Button>
                <button type="button" onClick={voltarAoLogin} className="block w-full text-center text-[13px] font-medium text-texto-2 hover:text-tinta">
                  Cancelar
                </button>
              </form>
            )}

            {etapa === "pronto" && (
              <div className="mt-6">
                <Button tamanho="lg" bloco onClick={voltarAoLogin}>
                  Ir para o login <ArrowRight />
                </Button>
              </div>
            )}
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => setContasAbertas((v) => !v)}
              aria-expanded={contasAbertas}
              className="mx-auto flex items-center gap-1 text-[12.5px] text-texto-2 underline-offset-4 hover:text-tinta hover:underline"
            >
              Usar conta de teste <ChevronDown className={`size-3.5 transition-transform ${contasAbertas ? "rotate-180" : ""}`} />
            </button>
            {contasAbertas && (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {(["aluno", "professor"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => router.replace(entrarComoDemo(p))}
                    className="flex items-center gap-3 rounded-xl border border-borda bg-superficie p-3 text-left transition-colors hover:bg-superficie-2 active:scale-[0.98]"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-superficie-2 text-texto-2">
                      {p === "aluno" ? <GraduationCap className="size-4" /> : <Presentation className="size-4" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-tinta">{CONTAS_DEMO[p].nome}</span>
                      <span className="block truncate text-[11.5px] text-texto-2">{p === "aluno" ? "Aluna · 9º Ano A" : "Professor · Matemática"}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="pb-6 text-center text-[12px] text-texto-2">Residência de Software · Squad 38</footer>
    </div>
  );
}
