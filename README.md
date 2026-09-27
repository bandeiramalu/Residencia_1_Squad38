# Portal do Aluno · CEPI Expansão

Protótipo funcional da **rede social educacional** integrada ao portal do [Colégio CEPI Expansão](https://www.cepiexpansao.com.br) (Aracaju · SE).
Projeto da **Residência de Software — Squad 38**.

Feito em **Next.js 16 (App Router) + React 19**, seguindo os documentos do squad:
_Correção dos Épicos_, _Design System_, _Navegação e fluxos_ e _Stack e Ferramentas IA_.

## Como rodar

Pré-requisito: Node.js 20 ou superior.

```bash
npm install
npm run dev        # http://localhost:3000
```

Outros comandos:

| Comando             | O que faz                         |
| ------------------- | --------------------------------- |
| `npm run build`     | build de produção                 |
| `npm start`         | serve o build de produção         |
| `npm run lint`      | ESLint (regras do Next + React)   |
| `npm run typecheck` | checagem de tipos do TypeScript   |

Os dados da demonstração ficam no `localStorage` do navegador — a demo continua de onde parou ao recarregar.
Para voltar ao início: **Perfil → Reiniciar demonstração**.

## O que dá para fazer

Navegação por **barra inferior fixa com 5 abas** e modais inferiores (bottom sheets), como no documento de navegação.

| Aba          | Funcionalidades                                                                                                                                                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Feed**     | filtros Tudo/Dúvidas/Materiais/Avisos/Minha turma · faixa de avatares que filtra por autor · curtir, comentar/responder, salvar · anexos PDF com **download real** · resposta oficial fixada · marcar resposta como útil · busca semântica · denúncia |
| **Missões**  | sequência (streak) com calendário semanal e congeladores · missões diárias · flashcards que viram em 3D · desafios personalizados · missão coletiva da turma · missões do professor · ouvidoria (relatar problema da escola)                                |
| **Ranking**  | Minha liga / Minha turma / Por disciplina · régua Bronze → Prata → Ouro → Diamante · zonas de promoção e rebaixamento · contagem regressiva até domingo 23:59 · SOBE/DESCE/MANTEVE com variação de posições                                             |
| **Loja**     | saldo de pontos × XP · abas Avatar / Perfil / Recompensas da escola · raridades Comum → Exclusivo · modal "Confirmar troca" com saldo antes/depois · histórico de trocas · vouchers para retirar na secretaria                                         |
| **Perfil**   | avatar com os itens equipados · nível e barra de XP · métricas · 8 medalhas com modal de progresso · desempenho por disciplina · personalização · ocultar posição pública                                                                                 |

No cabeçalho: seletor de **turma/espaço** (Toda a escola, 9º Ano A, Clube de Robótica, Bilíngue Cultura Inglesa), **calendário** de provas e prazos e o **saldo** de pontos/XP.

### Fluxos do documento "Navegação e fluxos"

| Fluxo | Caminho no protótipo                                                                                     |
| ----- | -------------------------------------------------------------------------------------------------------- |
| 3.1   | Feed → **+** → Material → disciplina → descrição → Publicar → toast "Material compartilhado" → card com **PDF · Baixar** |
| 3.2   | Feed → **+** → Dúvida → disciplina → texto com mais de 15 caracteres → **dúvidas parecidas** aparecem → Publicar |
| 3.3   | Loja → item → **Confirmar troca** (saldo atual × pós-compra) → Comprar → débito → botão vira "Adquirido" → histórico |
| 3.4   | Missões → **Abrir relato** → categoria → relato → Enviar relato → card fica **EM ANÁLISE**               |
| 3.5   | Perfil → toque numa medalha → modal com critério e progresso → Fechar                                    |

### Rastreabilidade dos épicos

| História | Onde está                                                                                       | Papel da IA no protótipo                                           |
| -------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| US01     | Feed: publicar, comentar, curtir, salvar                                                        | —                                                                  |
| US02     | Modal "Nova publicação" → Dúvida                                                                | sugestão de disciplina e tags + dúvidas similares (`lib/busca.ts`) |
| US03     | Busca do Feed · respostas oficiais fixadas                                                      | busca semântica por conceitos (`lib/busca.ts`)                     |
| US04     | Calendário no cabeçalho · lembretes                                                             | **regra determinística** (3+ avaliações na semana), não predição  |
| US05     | Feed → ⋯ → Denunciar publicação                                                                 | classifica e prioriza; não decide nem pune (`lib/moderacao.ts`)    |
| US06     | Publicação com termos ofensivos vai para **revisão humana**                                     | sinaliza para a coordenação (`lib/moderacao.ts`)                   |
| US07     | Pontos, XP, níveis, sequência, medalhas                                                         | —                                                                  |
| US08     | Loja, itens de perfil, **desconto na cantina** e outras recompensas da escola                   | —                                                                  |
| US09B    | Missões → Desafios para você (disciplinas com menor domínio)                                    | personalização pelo histórico do aluno                             |

US09A (relatório do professor) e US10 (antifraude) são telas de professor/coordenação e ficam fora deste Portal do Aluno.

> **Sobre a IA:** no protótipo, as funções de IA são **simuladas no navegador** com regras e um mapa de conceitos, para a demo funcionar sem servidor. Os módulos em `src/lib` têm a mesma "forma" que a integração real teria — trocar por uma API de modelo de linguagem não exige mexer nas telas.

## Arquitetura

```
src/
├── app/                  Rotas (App Router): uma pasta por aba
│   ├── layout.tsx        Layout raiz: fontes, metadados e a moldura do app
│   ├── template.tsx      Transição de entrada entre as abas
│   ├── feed/ missoes/ ranking/ loja/ perfil/   page.tsx de cada aba (Server Components)
│   └── globals.css       Tokens do Design System (Tailwind v4 @theme)
├── components/
│   ├── shell/            Cabeçalho, barra inferior, esqueleto de carregamento
│   ├── ui/               Componentes do Design System (Button, Card, Badge, Avatar, Sheet…)
│   ├── feed/ missoes/ ranking/ loja/ perfil/ calendario/   componentes de cada tela
├── data/                 Dados de exemplo (pessoas, posts, missões, loja, medalhas, ranking)
├── lib/                  Regras puras: gamificação, busca semântica, moderação, PDF, datas
├── hooks/                useAgora (relógio compartilhado), useFecharFora
└── store/                Estado global
    ├── types.ts          Tipos do domínio
    ├── seed.ts           Estado inicial
    ├── reducer.ts        Reducer puro: toda mudança de estado passa por aqui
    ├── store.ts          Store externa + useSyncExternalStore + persistência no localStorage
    ├── actions.ts        Fluxos de usuário (mudam estado, mostram toasts, agendam eventos)
    └── ui.ts             Estado que não é salvo: toasts, comemorações, destaque do feed
```

**Decisões principais**

- **Uma rota por aba** (`/feed`, `/missoes`, `/ranking`, `/loja`, `/perfil`): o roteamento por pastas do Next.js é a justificativa da stack. As páginas são Server Components enxutos que exportam `metadata` e renderizam a tela (Client Component).
- **Estado em um reducer puro** (`store/reducer.ts`) lido pelos componentes com `useSyncExternalStore` — o mesmo modelo do Redux, sem dependência extra. Trocar o `localStorage` por uma API do portal é mexer só em `store.ts`/`actions.ts`.
- **Hidratação sem erro**: como os dados vivem no navegador, as telas renderizam depois da hidratação (antes aparece um esqueleto), evitando divergência entre servidor e cliente.
- **Design System em tokens**: as cores do documento viram classes do Tailwind (`bg-verde`, `text-texto-2`, `bg-verde-claro`…); espaçamento em múltiplos de 4 px.
- **Fluidez**: animações com [Motion](https://motion.dev) — pílula ativa que desliza na navegação e nos filtros, modais com mola e arraste para fechar, flashcards em 3D, reordenação animada do ranking, números que rolam. Respeita "reduzir movimento" do sistema.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Motion · Lucide Icons.
