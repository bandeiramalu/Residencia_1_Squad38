# Portal do Aluno · CEPI Expansão

Rede social educacional integrada ao portal do [Colégio CEPI Expansão](https://www.cepiexpansao.com.br) (Aracaju · SE) — projeto da **Residência de Software, Squad 38**.

Dois perfis de acesso (**aluno** e **professor**), **Sala de Estudos com métricas**, **salas de estudo coletivas**, **campeonatos internos**, **modo invisível** no ranking, feed de dúvidas com busca semântica, missões, loja de recompensas, mensagens diretas e **tema claro/escuro** — tudo com dados de demonstração e com o caminho do backend já desenhado.

Feito em **Next.js 16 (App Router) + React 19**, seguindo os documentos do squad: _Correção dos Épicos_, _Design System_, _Navegação e fluxos_ e _Stack e Ferramentas IA_.

## Como rodar

Pré-requisito: Node.js 20 ou superior.

```bash
npm install
npm run dev                  # desenvolvimento → http://localhost:3000
```

**Para apresentar, use a versão de produção** (muito mais rápida que o modo dev):

```bash
npm run build && npm start   # → http://localhost:3000
```

| Comando             | O que faz                       |
| ------------------- | ------------------------------- |
| `npm run build`     | build de produção               |
| `npm start`         | serve o build de produção       |
| `npm run lint`      | ESLint (regras do Next + React) |
| `npm run typecheck` | checagem de tipos do TypeScript |

### Contas de demonstração

| Perfil    | E-mail                          | Senha      |
| --------- | ------------------------------- | ---------- |
| Aluna     | `ana.moura@aluno.cepi.edu.br`   | `cepi2026` |
| Professor | `ricardo.nogueira@cepi.edu.br`  | `cepi2026` |

A tela de login também tem **acesso rápido** (um clique) para cada perfil. Aluno e professor compartilham os mesmos dados neste navegador: **o que o professor faz, a aluna vê** — atividade publicada, nota dada, pontos atribuídos, sala aberta, campeonato criado.

Os dados ficam no `localStorage`, então a demo continua de onde parou. Para voltar ao início: **Roteiro de apresentação → Reiniciar dados da demo** (ou **Perfil → Reiniciar demonstração**).

## Roteiro de apresentação

Dentro do app há o item **Roteiro de apresentação** (menu da conta, no rodapé da barra lateral; Perfil no celular; menu do professor) com os passos clicáveis e o atalho **Ver como professor/aluno**. Sugestão de ordem:

1. **Sala de Estudos** → Iniciar foco → **Avançar 5 min (demo)** até fechar o ciclo: pontos, meta do dia, sequência, ranking de foco sobe e o **9º A passa o 9º B** no Interclasses.
2. **Sala coletiva** "Revisão para a prova de Matemática" → Entrar e focar: timer sincronizado com a turma, presença e chat ao vivo.
3. **Campeonatos** → Copa CEPI de Matemática → **Jogar duelo** (5 perguntas, 20 s cada) e ver o chaveamento.
4. **Ranking** → Visibilidade → **Invisível**: a aluna sai dos rankings e só ela vê a própria posição.
5. **Missões** → Atividades do professor → **Entregar** a Lista 7.
6. **Ver como professor** → Atividades → Lista 7 → **Corrigir** a entrega da Ana (nota → pontos e XP proporcionais).
7. Professor: **Alunos** (dar pontos com motivo), **Nova atividade** (os alunos entregam ao vivo), **Moderação**.
8. **Ver como aluna** → sino de notificações: a correção e os pontos chegaram.

## O que dá para fazer

### Aluno

| Área | Funcionalidades |
| --- | --- |
| **Sala de Estudos** (`/estudos`) | timer de foco Pomodoro 25/5, foco profundo 50/10 ou livre · modo imersivo em tela cheia · continua certo com a aba em segundo plano (pílula "ao vivo" em qualquer tela e tempo no título da aba) · meta diária com anel · métricas (hoje, semana com variação, média de 30 dias, maior sessão, horário de pico) · gráficos de 7/30 dias, por disciplina, mapa de calor de 12 semanas e distribuição por hora · você × sua turma · ranking de foco · registro manual (não vale pontos nem disputa) |
| **Salas coletivas** (`/estudos/salas`) | salas ao vivo com ciclo **sincronizado** para todos · presença (quem está focando ou na pausa) · chat com triagem de ofensas e reações · salas oficiais (professor), agendadas e privadas com código · criar sala |
| **Campeonatos** (`/campeonatos`) | **mata-mata** com chaveamento e duelos de quiz · **pontos corridos** (quiz ou tempo de foco) · **interclasses** (turma × turma por minutos de foco) · inscrições, pódio, prêmios · o aluno cria **amistosos** com colegas (sem pontos da escola) |
| **Ranking** (`/ranking`) | liga semanal por XP (Bronze → Diamante, zonas de promoção/rebaixamento, contagem até domingo 23:59) · ranking de foco (turma/escola) · visibilidade **Público / Anônimo / Invisível** |
| **Missões** (`/missoes`) | sequência com congeladores · missões diárias (inclui completar um ciclo de foco) · **atividades do professor** com entrega e nota · flashcards 3D · desafios personalizados · missão coletiva · relatos à escola |
| **Feed** (`/feed`) | dúvidas, materiais e avisos · busca semântica · dúvidas parecidas ao escrever · resposta oficial fixada · PDF com download real · denúncia · no desktop, coluna com "estudando agora", sua semana, próximas provas e campeonato em destaque |
| **Loja, Perfil, Mensagens** | troca de pontos por itens e vouchers · medalhas, domínio por disciplina, aparência (claro/escuro/sistema) · mensagens diretas e em grupo com "digitando…", ✓✓ e retenção de mensagens ofensivas |

### Professor

| Área | Funcionalidades |
| --- | --- |
| **Painel** (`/professor`) | por turma: ativos hoje, estudo médio, domínio, alunos em risco, entregas a corrigir · engajamento de 7 dias · quem precisa de atenção · destaques da semana · ações rápidas · publicar aviso no feed |
| **Alunos** (`/professor/alunos`) | tabela com XP, minutos (tendência), sequência, domínio, pendências e risco · ficha do aluno · **dar pontos/XP** com motivo registrado (um ou vários alunos) |
| **Atividades** (`/professor/atividades`) | criar atividade (lista, quiz, leitura, entrega, projeto) com prazo e recompensa · acompanhar entregas **ao vivo** · **corrigir** com nota 0–10 e comentário (recompensa proporcional) · corrigir todas · lembrar pendentes |
| **Salas e campeonatos** | criar salas oficiais (inclusive agendadas) e campeonatos oficiais · iniciar, encerrar e premiar |
| **Moderação** (`/professor/moderacao`) | publicações sinalizadas pela triagem automática ou denunciadas: **a IA só classifica, a decisão é humana** (liberar/remover) |

### Regras de gamificação

- **Pontos** = participação e constância (tempo de foco, sequência, colaboração). São gastos na Loja.
- **XP** = mérito acadêmico (quiz, correções, respostas úteis). Nunca é gasto; define nível e liga.
- Gastar pontos não muda XP nem posição. Sequência e tempo de estudo não dão XP.
- Amistosos criados por alunos não distribuem pontos da escola; registro manual de estudo não vale em disputas.

## Fluxos do documento "Navegação e fluxos"

| Fluxo | Caminho no protótipo |
| ----- | -------------------- |
| 3.1 | Início → caixa de publicação → **Material** → disciplina → descrição → Publicar → publicação com o PDF e **Baixar** |
| 3.2 | Início → caixa de publicação → **Dúvida** → texto com mais de 15 caracteres → **dúvidas parecidas** aparecem → Publicar |
| 3.3 | Loja → item → **Confirmar troca** (saldo atual × pós-compra) → débito → "Adquirido" → histórico |
| 3.4 | Missões → **Abrir relato** → categoria → relato → Enviar → **EM ANÁLISE** |
| 3.5 | Perfil → toque numa medalha → modal com critério e progresso |

### Rastreabilidade dos épicos

| História | Onde está | Papel da IA no protótipo |
| -------- | --------- | ------------------------ |
| US01 | Feed (publicar, comentar, curtir, salvar) · mensagens diretas e grupos · chat das salas | — |
| US02 | Nova publicação → Dúvida | sugestão de disciplina/tags + dúvidas similares (`lib/busca.ts`) |
| US03 | Busca do Feed · respostas oficiais fixadas | busca semântica por conceitos (`lib/busca.ts`) |
| US04 | Calendário no cabeçalho | **regra determinística** (3+ avaliações na semana) |
| US05 | Denunciar publicação → fila de **Moderação** do professor | classifica e prioriza; não decide (`lib/moderacao.ts`) |
| US06 | Publicação, mensagem ou chat de sala ofensivo fica retido → revisão humana | sinaliza (`lib/moderacao.ts`) |
| US07 | Pontos, XP, níveis, sequência, medalhas, tempo de foco | — |
| US08 | Loja, itens de perfil e recompensas da escola | — |
| US09A | **Painel do professor**: engajamento, risco, domínio por aluno | regras determinísticas (`lib/turmas.ts`) |
| US09B | Missões → Desafios para você | personalização pelo histórico |

> **Sobre a IA:** no protótipo, as funções de IA são **simuladas no navegador** com regras e um mapa de conceitos. Os módulos em `src/lib` têm a mesma "forma" que a integração real teria.

## Backend: meio caminho andado

O time faz só o frontend, mas a integração já está desenhada:

- **[`docs/BACKEND.md`](docs/BACKEND.md)** — guia didático: arquitetura, fluxo de uma ação até a API, autenticação e papéis, modelo de dados (diagrama ER), tabela ação ↔ endpoint, eventos em tempo real, **regras de negócio que o servidor deve garantir** e checklist de integração.
- **[`docs/api/openapi.yaml`](docs/api/openapi.yaml)** — contrato OpenAPI 3.1 com todos os endpoints.
- **[`docs/api/schema.sql`](docs/api/schema.sql)** — esquema PostgreSQL (tabelas, restrições, gatilhos e views de ranking que respeitam o modo invisível).
- **`src/api/`** — cliente HTTP (`client.ts`), catálogo tipado de endpoints (`endpoints.ts`), **fila de sincronização** com reenvio e idempotência (`sync.ts`) e cliente WebSocket para salas e notificações (`realtime.ts`).

Toda mudança de estado passa por `commit()` (`src/store/nucleo.ts`), que chama `sincronizar(acao)`. Sem API configurada, nada é enviado; com `NEXT_PUBLIC_API_URL` no `.env.local` (veja `.env.example`), o login e as ações passam a usar o backend.

## Visual

Minimalista e alinhado ao portal da escola (Zenix Education): fonte **Geist**, neutros em slate, verde só para ações e estados ativos, cards brancos com borda fina e sem sombra, padrões de rede social (composer, abas, listas com divisórias) e tema claro/escuro.

## Desempenho e acabamento

- **React Compiler** (versão nativa em Rust no Turbopack): memoização automática, menos re-renderizações.
- **Motion com LazyMotion** (`m`): só as funções de animação usadas vão para o bundle.
- **Modais sob demanda** (`next/dynamic`): calendário, carteira, notificações, publicação, checkout, duelo etc. só baixam quando abertos.
- **Relógios isolados**: timers de 1 s re-renderizam só o número, nunca a página; o timer é calculado por horário (não perde tempo em segundo plano).
- **`content-visibility`** em listas longas; seletores de estado (`useSeletor`) para ler só a fatia necessária.
- **Rotas protegidas no servidor** (`src/proxy.ts`): o redirecionamento acontece antes da página renderizar.
- **Tema escuro sem "piscar"**: script no `<head>` aplica o tema antes da primeira pintura; todas as cores são variáveis do Design System.
- Gráficos em SVG/HTML puro (sem biblioteca) com paleta por disciplina validada para daltonismo nos dois temas.
- `cn()` com tailwind-merge: classes passadas por `className` sobrescrevem as do componente sem conflito.

## Arquitetura

```
src/
├── app/                   Rotas (App Router) — uma pasta por tela
│   ├── login/             Entrada (aluno × professor)
│   ├── feed/ estudos/ missoes/ ranking/ campeonatos/ loja/ perfil/ mensagens/
│   ├── estudos/salas/     Salas coletivas e salas/[id]
│   ├── professor/         Painel, alunos, atividades/[id], moderação
│   ├── layout.tsx         Fontes, tema e a moldura do app
│   └── globals.css        Tokens do Design System (claro/escuro)
├── proxy.ts               Controle de acesso por papel (antes da renderização)
├── components/
│   ├── shell/             Barra lateral, cabeçalho, barra inferior, notificações, roteiro
│   ├── ui/                Design System (Button, Card, Sheet, Segmentado, Anel, gráficos…)
│   └── estudos/ salas/ campeonatos/ professor/ atividades/ feed/ ranking/ missoes/ …
├── data/                  Dados de demonstração (turmas, salas, campeonatos, atividades, histórico…)
├── lib/                   Regras puras (estudos, campeonatos, turmas, gamificação, busca, moderação, auth, tema)
├── api/                   Cliente HTTP, endpoints, sincronização e tempo real (backend)
└── store/
    ├── types.ts           Tipos do domínio
    ├── seed.ts            Estado inicial + migração de versões antigas
    ├── reducer.ts         Reducer puro: toda mudança de estado passa por aqui
    ├── store.ts           Store externa + useSyncExternalStore + localStorage
    ├── nucleo.ts          commit, premiação, notificações, eventos agendados da demo
    ├── actions.ts         Fluxos do usuário (feed, missões, loja, mensagens…)
    ├── acoes/             Fluxos novos: estudos, salas, campeonatos, atividades, professor
    └── ui.ts              Estado não salvo: toasts, comemorações, "digitando…"
```

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Motion · Lucide Icons · tailwind-merge.
