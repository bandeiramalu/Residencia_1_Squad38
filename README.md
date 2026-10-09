# Portal do Aluno · CEPI Expansão

Rede social educacional integrada ao portal do [Colégio CEPI Expansão](https://www.cepiexpansao.com.br) (Aracaju · SE) — projeto da **Residência de Software, Squad 38**.

Dois perfis de acesso (**aluno** e **professor**, os dois no mesmo **feed da escola**) com **sala de estudos e métricas**, **salas coletivas**, **campeonatos internos**, **estatísticas**, feed de dúvidas com busca por conceitos e sugestão de dúvidas parecidas, missões e flashcards, loja de recompensas, **arquivos reais** (PDF, imagem e documentos), relatórios em PDF/CSV, calendário com lembretes e **tema claro/escuro**. Tudo roda no navegador com dados de demonstração, e o caminho do backend já está desenhado.

Feito em **Next.js 16 (App Router) + React 19**, seguindo os documentos do squad: _Correção dos Épicos_, _Design System_, _Navegação e fluxos_ e _Stack e Ferramentas IA_.

## Como rodar

Pré-requisito: Node.js 20 ou superior.

```bash
npm install
npm run dev                  # desenvolvimento → http://localhost:3000
```

Para apresentar em tela cheia, a versão de produção é bem mais rápida: `npm run build && npm start`.

| Comando             | O que faz                                                          |
| ------------------- | ------------------------------------------------------------------ |
| `npm run dev`       | desenvolvimento                                                    |
| `npm run build`     | build de produção                                                  |
| `npm start`         | serve o build de produção                                          |
| `npm run demo`      | `next build` + gera a **demo em HTML único** (veja abaixo)         |
| `npm run lint`      | ESLint (regras do Next + React)                                    |
| `npm run typecheck` | checagem de tipos do TypeScript                                    |

### Demo em HTML único (sem instalar nada)

`demonstração/Portal_do_Aluno.html` é o app inteiro (JS, CSS, fontes e imagens) num único arquivo: **abre com duplo clique**, offline, direto do disco (`file://`), com as rotas por hash. Serve para mandar por e-mail ou apresentar em qualquer computador.

Ao mudar o código, regenere com:

```bash
npm run demo
```

O gerador fica em `scripts/demo/` (`build.mjs`, `app.tsx`, `shims/` com adaptadores de `next/link`, `next/navigation`, `next/image` e `next/dynamic`). O CSS vem do build do Next, por isso o script roda `next build` antes. Nos componentes, use só essas APIs do Next para o app continuar idêntico nos dois modos.

### Contas de teste

| Perfil    | E-mail                          | Senha      |
| --------- | ------------------------------- | ---------- |
| Aluna     | `ana.moura@aluno.cepi.edu.br`   | `cepi2026` |
| Professor | `ricardo.nogueira@cepi.edu.br`  | `cepi2026` |

A tela de login também tem **acesso rápido** (um clique) para cada perfil. Cada aba ou janela tem a sua própria sessão. Aluna e professor compartilham os dados deste navegador: **o que o professor faz, a aluna vê**.

Os dados ficam no `localStorage` (e os arquivos no IndexedDB), então a demo continua de onde parou. Para voltar ao início: **Perfil › Apagar dados deste dispositivo**.

## Modo apresentação

Os atalhos de demonstração ficam escondidos para não poluir o uso normal. Ligue com **Alt+Shift+D** ou em **Perfil › Configurações › Modo apresentação**. Com ele ligado aparecem:

- **Pular 5 min** no timer de foco (fecha um ciclo em segundos);
- **Simular saída da tela** (mostra o aviso de foco perdido e a trava de 5 minutos);
- **Roteiro de apresentação** (menu da conta) com os passos clicáveis e o atalho **Ver como professor / Ver como aluna**;
- **Simular falhas** (no Roteiro): sem conexão, IA indisponível, busca por significado indisponível, falha ao salvar o
  progresso e falha ao carregar uma tela — para mostrar como o portal se comporta quando algo dá errado. As simulações
  **só existem com o modo apresentação ligado** (ficam em `localStorage["cepi-simulacoes"]`) e nunca geram erro no console.

## Roteiro de apresentação sugerido

Ligue o modo apresentação e entre como aluna (Ana).

1. **Estudos** → Iniciar foco → **Pular 5 min** até fechar o ciclo: pontos, meta do dia, sequência e ranking de foco.
2. **Salas coletivas** → "Revisão para a prova de Matemática" → entrar: timer sincronizado, presença e chat.
3. **Campeonatos** → Copa CEPI de Matemática → jogar o duelo e ver o chaveamento.
4. **Ranking** → Visibilidade → **Invisível**: a aluna sai dos rankings e só ela vê a própria posição.
5. **Feed** → publicar uma **Dúvida** (dúvidas parecidas aparecem) ou um **Material** com um PDF real; **Estatísticas** → ver o período e baixar o relatório (PDF/CSV).
6. **Missões** → **Entregar** a Lista 7, anexando um arquivo.
7. **Ver como professor** → Atividades → Lista 7 → **Corrigir** a entrega da Ana; **Feed** → **Publicar um Aviso** para o 9º A e responder a dúvida da Ana (resposta oficial); **Moderação** → remover com motivo; **Trocas** → marcar a recompensa como entregue.
8. **Ver como aluna** → sino de notificações: correção, pontos, resposta oficial, aviso e entrega chegaram.
9. **Simular falhas** (Roteiro) → ligue "Sem conexão" e publique uma dúvida: faixa "Sem conexão" e selo "Aguardando envio"; ligue "IA indisponível" e abra uma nova dúvida: o portal avisa e deixa escolher a disciplina à mão.

### Tempo real entre duas janelas

Abra o app em **duas janelas do mesmo navegador**: numa entre como aluna, na outra como professor. Sem recarregar, a entrega da aluna aparece para o professor, e a correção, os pontos e os avisos do professor aparecem para a aluna (o estado compartilhado é sincronizado pelo evento `storage`). Arquivos enviados por uma janela abrem na outra (IndexedDB compartilhado). Funciona no Next e na demo em HTML (no `file://`, algumas versões do Safari/Firefox isolam o armazenamento por arquivo; prefira Chrome ou Edge).

## O que dá para fazer

### Aluno

| Área | Funcionalidades |
| --- | --- |
| **Sala de Estudos** (`/estudos`) | timer de foco Pomodoro 25/5, foco profundo 50/10 ou livre · modo imersivo · continua certo com a aba em segundo plano · sair da tela por mais de 5 min encerra o foco · meta diária com anel · métricas (hoje, semana, média de 30 dias, maior sessão, horário de pico) · mapa de calor · você × sua turma · ranking de foco · registro manual |
| **Salas coletivas** (`/estudos/salas`) | ciclo **sincronizado** para todos · presença · chat com triagem de ofensas e reações · salas oficiais, agendadas e privadas com código |
| **Campeonatos** (`/campeonatos`) | mata-mata, pontos corridos e interclasses · inscrições, duelos de quiz, pódio · amistosos criados por alunos (sem pontos da escola) |
| **Ranking** (`/ranking`) | liga semanal por XP (Bronze → Diamante) · ranking de foco (turma/escola) · visibilidade **Público / Anônimo / Invisível** |
| **Missões** (`/missoes`) | sequência com congeladores · missões diárias · **atividades do professor** (entrega com arquivo e nota) · **flashcards** com cartas próprias e repetição espaçada (Leitner) · desafios · missão coletiva · relatos à escola (ouvidoria) |
| **Feed** (`/feed`) | dúvidas, materiais e avisos · busca por conceitos (sinônimos e termos da matéria) · dúvidas parecidas ao escrever · **resposta oficial** do professor fixada · **PDF e imagens reais** (envio, abrir e baixar) · denúncia |
| **Estatísticas** (`/estatisticas`) | foco por período, disciplina e hora · evolução de pontos e XP · notas e média · duelos · missões · medalhas · relatório em **PDF** e **CSV** |
| **Loja e Perfil** | troca de pontos por itens e vouchers (comprovante em PDF) · medalhas, domínio por disciplina · **foto, bio e @** editáveis · calendário com **lembretes** (avisos 72 h, 24 h e 2 h antes) · boletim e certificado em PDF · calendário `.ics` · aparência claro/escuro/sistema |
| **Pessoas** (`/pessoas/[id]`) | perfil de colegas e professores, com medalhas e publicações |

Não há mensagens privadas nem ranking entre colégios: a interação é pelo feed, pelas salas e pelos campeonatos da própria escola.

### Professor

| Área | Funcionalidades |
| --- | --- |
| **Painel** (`/professor`) | por turma: ativos hoje, estudo por aluno, domínio médio, em risco e para corrigir · listas Precisa de atenção, Para corrigir, Destaques da semana (**Reconhecer os 3**) e Atribuições recentes · **lembrar alunos** (no máximo 1 aviso a cada 6 h por aluno) · publicar aviso (Toda a escola, 9º A, 9º B ou 8º A) · bloco Comunidade e engajamento (Dúvidas, Moderação, Salas, Campeonatos e Trocas) |
| **Feed** (`/feed`, o mesmo da aluna) | publicar **Aviso**, **Material** ou **Publicação** com destino (Toda a escola, 9º A, 9º B ou 8º A) · responder dúvidas (resposta **oficial**) e marcar a resposta de um aluno como **Útil** · **remover** a publicação de um aluno (com motivo) · curtir e salvar por usuário · filtros Tudo, Dúvidas, Sem resposta, Materiais, Avisos e Minhas turmas · aviso "N publicações aguardando revisão" |
| **Alunos** (`/professor/alunos`) | tabela com XP, minutos, sequência, domínio e risco · ficha do aluno · **dar pontos/XP** com motivo registrado · **trocas da loja** (marcar a recompensa como entregue) |
| **Atividades** (`/professor/atividades`) | criar (com arquivo), acompanhar entregas **ao vivo**, **corrigir** com nota e comentário (recompensa proporcional), corrigir todas, lembrar pendentes |
| **Dúvidas** (`/professor/duvidas`) | fila das dúvidas da turma · **resposta oficial** (o aluno é notificado e ganha pontos) |
| **Estatísticas** (`/professor/estatisticas`) | engajamento, foco, desempenho, missões, ranking da turma, campeonatos, moderação e alunos em risco · relatórios em PDF/CSV |
| **Salas e campeonatos** | criar salas oficiais (inclusive agendadas) e campeonatos oficiais · iniciar, encerrar e premiar |
| **Moderação** (`/professor/moderacao`) | publicações sinalizadas ou denunciadas: **a IA só classifica, a decisão é humana** · remover exige **motivo** · histórico das decisões · relatos da ouvidoria (coordenação) · indicadores Na fila, Urgentes e Decisões · contestações das autoras · remoções feitas pelo feed (origem no histórico e no CSV) |

### Regras de gamificação

- **Pontos** = participação e constância (tempo de foco, sequência, colaboração). São gastos na Loja.
- **XP** = mérito acadêmico (quiz, correções, respostas úteis). Nunca é gasto; define nível e liga.
- Gastar pontos não muda XP nem posição. Sequência e tempo de estudo não dão XP.
- Amistosos criados por alunos não distribuem pontos da escola; registro manual de estudo não vale em disputas.

## Fluxos do documento "Navegação e fluxos"

| Fluxo | Caminho no protótipo |
| ----- | -------------------- |
| 3.1 | Início → caixa de publicação → **Material** → disciplina → descrição → arquivo → Publicar → publicação com o PDF e **Baixar** |
| 3.2 | Início → caixa de publicação → **Dúvida** → texto com mais de 15 caracteres → **dúvidas parecidas** aparecem → Publicar |
| 3.3 | Loja → item → **Confirmar troca** (saldo atual × pós-compra) → débito → "Adquirido" → histórico e comprovante |
| 3.4 | Missões → **Abrir relato** → categoria → relato → Enviar → **EM ANÁLISE** |
| 3.5 | Perfil → toque numa medalha → modal com critério e progresso |

### Rastreabilidade dos épicos

| História | Onde está | Papel da IA no protótipo |
| -------- | --------- | ------------------------ |
| US01 | Feed (publicar, comentar, curtir, salvar) · chat das salas | — |
| US02 | Nova publicação → Dúvida | sugestão de disciplina/tags + dúvidas similares (`lib/busca.ts`) |
| US03 | Busca do Feed · respostas oficiais fixadas | busca por conceitos e sinônimos (`lib/busca.ts`) |
| US04 | Calendário no cabeçalho, com lembretes | **regra determinística** (3+ avaliações na semana) |
| US05 | Denunciar publicação → fila de **Moderação** do professor | classifica e prioriza; não decide (`lib/moderacao.ts`) |
| US06 | Publicação ou mensagem de sala ofensiva fica retida → revisão humana | sinaliza (`lib/moderacao.ts`) |
| US07 | Pontos, XP, níveis, sequência, medalhas, tempo de foco, estatísticas | — |
| US08 | Loja, itens de perfil e recompensas da escola | — |
| US09A | **Painel do professor**: engajamento, risco, domínio por aluno | regras determinísticas (`lib/turmas.ts`) |
| US09B | Missões → Desafios para você | personalização pelo histórico |

> **Sobre a IA:** no protótipo, as funções de IA são **simuladas no navegador** com regras e um mapa de conceitos. Os módulos em `src/lib` têm a mesma "forma" que a integração real teria.

## Backend: meio caminho andado

O time faz só o frontend, mas a integração já está desenhada:

- **[`docs/BACKEND.md`](docs/BACKEND.md)** — guia didático: arquitetura, fluxo de uma ação até a API, autenticação e papéis, modelo de dados, tabela ação ↔ endpoint, eventos em tempo real, **regras de negócio que o servidor deve garantir** e checklist de integração.
- **[`docs/api/openapi.yaml`](docs/api/openapi.yaml)** — contrato OpenAPI 3.1 com todos os endpoints.
- **[`docs/api/schema.sql`](docs/api/schema.sql)** — esquema PostgreSQL (tabelas, restrições, gatilhos e views de ranking que respeitam o modo invisível).
- **`src/api/`** — cliente HTTP (`client.ts`), catálogo tipado de endpoints (`endpoints.ts`), **fila de sincronização** com reenvio, idempotência e upload prévio de arquivos (`sync.ts`) e cliente WebSocket (`realtime.ts`).

Toda mudança de estado passa por `commit()` (`src/store/nucleo.ts`), que chama `sincronizar(acao)`. Sem API configurada, nada é enviado; com `NEXT_PUBLIC_API_URL` no `.env.local` (veja `.env.example`), o login e as ações passam a usar o backend (`Authorization: Bearer` em todo pedido) e o tempo real conecta para as notificações.

A fila de saída espera 1 s, 2 s, 4 s… até 5 min; erro 5xx nunca descarta o pedido (só os 7 dias de validade); **sair da conta apaga só a fila daquela conta**. `lib/auth.ts` e `api/sync.ts` se falam por eventos da janela (`cepi:sessao-iniciada`, `cepi:sessao-encerrada`), sem importar um ao outro.

**Pendências do modo integrado** (documentadas em `docs/BACKEND.md` §11): a leitura pela API (`/me/bootstrap`, `GET /posts`…) e as telas de duelo, desafio e rodada ainda não chamam os endpoints do servidor; quando ele recusa um pedido, a tela avisa mas o estado otimista não é desfeito; o tempo real só cobre notificações.

## Visual e desempenho

Minimalista e alinhado ao portal da escola: fonte **Geist**, neutros em slate, verde só para ações e estados ativos, cards brancos com borda fina e tema claro/escuro sem "piscar" (script no `<head>`). **React Compiler**, **Motion com LazyMotion**, modais sob demanda (`next/dynamic`), relógios isolados (o timer é calculado por horário), `content-visibility` em listas longas e gráficos em SVG/HTML puro com paleta validada para daltonismo.

A **guarda de rotas** roda no cliente (`src/lib/guarda.ts`, aplicada no `AppShell` e na demo): aluno fora de `/professor/*`; professor fora das áreas só da aluna (`/estudos`, `/missoes`, `/ranking`, `/loja`, `/perfil`, `/estatisticas`); `/feed`, `/estudos/salas`, `/campeonatos` e `/pessoas` são **compartilhadas** pelos dois papéis; rota que não existe mostra a página 404. É só UX; a segurança real fica na API (veja `docs/BACKEND.md`).

### Acessibilidade e celular

- **Teclado**: link "Pular para o conteúdo" no começo de toda página e foco sempre visível.
- **Toque**: alvos de pelo menos **44 × 44 px** no celular (a área aumenta, o visual não) e nenhuma rolagem horizontal a partir de 320 px.
- **Gráficos**: cada gráfico tem um **resumo em texto** para leitor de tela (automático ou escrito pela tela).
- **Imagens enviadas** têm campo de **texto alternativo** (descrição); sem ele, o `alt` é "Imagem enviada por …".
- **Reduzir movimento**: respeita a preferência do sistema.
- **Contraste**: botões e realces com texto branco usam o verde **#15803D** (e **#166534** ao passar o mouse); o verde claro fica para anéis, barras e ícones. Texto âmbar usa o tom `text-ouro`; placeholders são legíveis (sem opacidade).

### Estados de erro e segurança

- **Estados de erro** (telas 71 a 79 dos wireframes): faixa "Sem conexão" e selo "Aguardando envio · salvo neste aparelho", tela "Não foi possível carregar agora", IA com **tempo-limite e plano B** (`lib/ia.ts`: P01 2 s, P02 2,5 s, P04 2 s, P05 1 s, P07 3 s), busca por palavra-chave quando a de significado cai, "Isso foi um engano? Conteste aqui" em publicação retida, "Não conseguimos salvar seu progresso" e estados vazios com ícone, frase e ação. Detalhes e contratos em [`docs/BACKEND.md` §7.3](docs/BACKEND.md).
- **Anexos**: só a lista permitida (`.pdf .png .jpg .jpeg .heic .webp .txt .doc .docx .odt .ppt .pptx .xls .xlsx`, até 10 MB), no clique e ao arrastar; `.html`, `.svg` e `.exe` são recusados. Só PDF, imagem e texto abrem em outra aba; o resto baixa. O servidor repete a regra (tipo real, `nosniff`, `attachment`).
- **Planilhas CSV** neutralizam fórmulas (`=HYPERLINK(...)` vira texto); **PDF** nunca mostra "?" no lugar de emoji ou setas; **`.ics`** dobra linhas por bytes.
- **Triagem de ofensas** por palavra inteira (sem reter dúvidas como "Como excluir os valores negativos?").
- **Cabeçalhos HTTP** em todas as rotas (`next.config.ts`): `nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy` e `Content-Security-Policy` (`frame-ancestors`, `object-src`, `base-uri`).

## Arquitetura

```
src/
├── app/                   Rotas (App Router) — uma pasta por tela
│   ├── login/             Entrada (aluno × professor)
│   ├── feed/ estudos/ missoes/ ranking/ campeonatos/ loja/ perfil/ estatisticas/ pessoas/
│   ├── estudos/salas/     Salas coletivas e salas/[id]
│   ├── professor/         Painel, alunos, atividades/[id], dúvidas, estatísticas, moderação
│   ├── layout.tsx         Fontes, tema e a moldura do app
│   └── globals.css        Tokens do Design System (claro/escuro)
├── components/
│   ├── shell/             Barra lateral, cabeçalho, barra inferior, notificações, roteiro
│   ├── ui/                Design System (Button, Card, Sheet, Segmentado, Anel, gráficos…)
│   └── estudos/ salas/ campeonatos/ professor/ atividades/ feed/ estatisticas/ ranking/ missoes/ …
├── data/                  Dados de demonstração (turmas, salas, campeonatos, atividades, histórico…)
├── hooks/                 Hooks de cliente: useAtor (quem usa esta aba), useConexao, useAgora, useMidia…
├── lib/                   Regras puras e utilitários: estudos, campeonatos, turmas, gamificação, busca, ia,
│                          moderação, auth, guarda, arquivos (IndexedDB), pdf, exportar, simulacoes,
│                          conexao, apresentação, tema
├── api/                   Cliente HTTP, endpoints, DTOs, sincronização e tempo real (backend)
└── store/
    ├── types.ts           Tipos do domínio
    ├── seed.ts            Estado inicial + migração de versões antigas
    ├── reducer.ts         Reducer puro: toda mudança de estado passa por aqui
    ├── store.ts           Store externa + useSyncExternalStore + localStorage
    ├── nucleo.ts          commit, premiação, notificações, eventos agendados da demo
    ├── actions.ts         Fluxos do usuário (feed, missões, loja…)
    ├── acoes/             Fluxos por área: estudos, salas, campeonatos, atividades, professor
    └── ui.ts              Estado não salvo: toasts, comemorações
scripts/demo/              Gerador da demo em HTML único (`npm run demo`)
demonstração/              Portal_do_Aluno.html (saída do gerador)
docs/                      BACKEND.md e api/ (OpenAPI com 117 operações + SQL com 59 tabelas)
```

Documentos do projeto em Markdown (Arquitetura da Solução, Design System, Navegação e Fluxos e Wireframes, com as telas): [`docs/projeto/`](docs/projeto/).

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Motion · Lucide Icons · tailwind-merge · esbuild (só para gerar a demo).
