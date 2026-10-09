/** Entrada da versão de demonstração: mesmo app, com as rotas do Next resolvidas no navegador. */
import { useEffect, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import Template from "@/app/template";
import NaoEncontrado from "@/app/not-found";
import { CampeonatosView } from "@/components/campeonatos/CampeonatosView";
import { CampeonatoView } from "@/components/campeonatos/CampeonatoView";
import { EstudosView } from "@/components/estudos/EstudosView";
import { EstatisticasAlunoView } from "@/components/estatisticas/EstatisticasAlunoView";
import { FeedView } from "@/components/feed/FeedView";
import { LoginView } from "@/components/login/LoginView";
import { LojaView } from "@/components/loja/LojaView";
import { MissoesView } from "@/components/missoes/MissoesView";
import { PerfilView } from "@/components/perfil/PerfilView";
import { PessoaView } from "@/components/pessoas/PessoaView";
import { AlunosView } from "@/components/professor/AlunosView";
import { AtividadesView } from "@/components/professor/AtividadesView";
import { AtividadeView } from "@/components/professor/AtividadeView";
import { DuvidasView } from "@/components/professor/DuvidasView";
import { EstatisticasView } from "@/components/professor/EstatisticasView";
import { ModeracaoView } from "@/components/professor/ModeracaoView";
import { PainelView } from "@/components/professor/PainelView";
import { RankingView } from "@/components/ranking/RankingView";
import { SalasView } from "@/components/salas/SalasView";
import { SalaView } from "@/components/salas/SalaView";
import { AppShell } from "@/components/shell/AppShell";
import { ESCOLA } from "@/data/escola";
import { ParamsContexto } from "./shims/navigation";
import { separar, useUrl } from "./shims/roteador";

type Rota = [padrao: string, tela: ComponentType<{ id: string }>, titulo: string];

const ROTAS: Rota[] = [
  ["/login", LoginView, "Entrar"],
  ["/feed", FeedView, "Feed"],
  ["/estudos", EstudosView, "Sala de estudos"],
  ["/estudos/salas", SalasView, "Salas de estudo"],
  ["/estudos/salas/:id", SalaView, "Sala de estudo"],
  ["/campeonatos", CampeonatosView, "Campeonatos"],
  ["/campeonatos/:id", CampeonatoView, "Campeonato"],
  ["/loja", LojaView, "Loja"],
  ["/missoes", MissoesView, "Missões"],
  ["/perfil", PerfilView, "Perfil"],
  ["/estatisticas", EstatisticasAlunoView, "Estatísticas"],
  ["/pessoas/:id", PessoaView, "Perfil"],
  ["/ranking", RankingView, "Ranking"],
  ["/professor", PainelView, "Painel do professor"],
  ["/professor/alunos", AlunosView, "Alunos"],
  ["/professor/atividades", AtividadesView, "Atividades"],
  ["/professor/atividades/:id", AtividadeView, "Atividade"],
  ["/professor/moderacao", ModeracaoView, "Moderação"],
  ["/professor/estatisticas", EstatisticasView, "Estatísticas"],
  ["/professor/duvidas", DuvidasView, "Dúvidas"],
];

function casar(caminho: string) {
  const partes = caminho.split("/");
  for (const [padrao, tela, titulo] of ROTAS) {
    const p = padrao.split("/");
    if (p.length !== partes.length) continue;
    const params: Record<string, string> = {};
    if (p.every((seg, i) => (seg.startsWith(":") ? ((params[seg.slice(1)] = decodeURIComponent(partes[i])), true) : seg === partes[i]))) {
      return { tela, titulo, params };
    }
  }
  return null;
}

function App() {
  const url = useUrl();
  const { caminho } = separar(url);
  const rota = casar(caminho);

  // A guarda de rotas (src/lib/guarda.ts) roda dentro do AppShell, igual ao Next:
  // sem sessão ou sem permissão a tela nem chega a montar e a URL é trocada.
  const titulo = rota?.titulo;
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = titulo ? `${titulo} · Portal ${ESCOLA.curto}` : `Portal do Aluno · ${ESCOLA.curto}`;
  }, [caminho, titulo]);

  const Tela = rota?.tela;
  // Como no Next, o template só remonta quando o primeiro segmento da rota muda.
  return (
    <ParamsContexto.Provider value={rota?.params ?? {}}>
      <AppShell>
        <Template key={caminho.split("/")[1] ?? ""}>{Tela ? <Tela key={rota.params.id} id={rota.params.id} /> : <NaoEncontrado />}</Template>
      </AppShell>
    </ParamsContexto.Provider>
  );
}

createRoot(document.getElementById("app")!).render(<App />);
