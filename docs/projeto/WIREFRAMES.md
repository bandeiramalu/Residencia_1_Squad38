**Bloco 3 · RISEUP 2026.2**

**Squad 38 · Portal do Aluno**

# Wireframes

Telas principais, detalhamento de navegação e telas de processamento e tratamento de erros do protótipo. Item 3.1 da entrega.

| Projeto | Empresa parceira | Squad | Programa |
| --- | --- | --- | --- |
| Rede social educacional | Zenix Code | 38 | Porto Digital × UNIT |

> Versão em Markdown de `Wireframes_Squad38_1.pdf`, atualizada para o protótipo v8 (09/10/2026). As imagens foram refeitas com a v8. O que mudou em relação ao PDF está listado no fim, em [Atualizações em relação ao PDF](#atualizações-em-relação-ao-pdf).

**Neste documento:** [Como ver as telas](#como-ver-as-telas) · [3.1.1 Telas principais](#311-telas-principais) · [3.1.2 Detalhamento de navegação](#312-detalhamento-de-navegação) · [3.1.3 Telas de processamento e tratamento de erros](#313-telas-de-processamento-e-tratamento-de-erros) · [Atualizações em relação ao PDF](#atualizações-em-relação-ao-pdf)

**Documentos do projeto:** [Arquitetura da Solução](ARQUITETURA_DA_SOLUCAO.md) · [Design System](DESIGN_SYSTEM.md) · [Navegação e Fluxos](NAVEGACAO_E_FLUXOS.md) · [Índice](README.md)

---

Este arquivo documenta as telas do protótipo "Portal do Aluno" usadas como referência de wireframe pelo squad, organizadas por destino de navegação, e registra as telas de processamento e tratamento de erro que o item 3.1 do template exige. As imagens foram capturadas da versão atual do protótipo (v8), ambientada no Colégio CEPI Expansão, e substituem as telas do primeiro protótipo gerado no Qwen.

## Como ver as telas

- As imagens ficam em [`telas/`](telas/): 111 arquivos WebP, no formato `NN-nome-da-tela.webp`. O número do arquivo é o número da tela neste documento.
- A numeração **01 a 79** é a do PDF. As telas **80 a 115** são novas e estão em [Telas novas desde o PDF](#telas-novas-desde-o-pdf).
- Celular: 390 × 844 px. Computador: 1440 × 900 px (telas 66, 67, 82, 89, 93, 96, 99 e 115). Todas em resolução dobrada (@2x), com o tema claro. As telas 111 a 114 mostram o tema escuro.
- As capturas usam os dados de demonstração: a aluna Ana Beatriz Moura (9º Ano A) e o Prof. Ricardo Nogueira (Matemática).
- As telas 72, 73, 74 e 76 mostram falhas **simuladas** pelo modo apresentação (veja [3.1.3](#313-telas-de-processamento-e-tratamento-de-erros)). As demais são o estado real do app.
- Sem imagem: as telas 52, 53 e 54 (retiradas) e a 77 (só mockup).
- Para ver ao vivo, abra [`demonstração/Portal_do_Aluno.html`](../../demonstração/Portal_do_Aluno.html) (por `file://`) ou rode `npm run dev`. Contas de teste, passo a passo e atalhos estão em [Navegação e Fluxos](NAVEGACAO_E_FLUXOS.md).

---

## 3.1.1 Telas principais

As telas abaixo mantêm um padrão visual único em todo o produto: fundo claro, cartões brancos com borda fina e cantos arredondados, uma cor de destaque (verde) reservada para ações e estados ativos, e cabeçalho fixo com a identidade da escola, o seletor de espaço (Toda a escola, turma, clubes), os atalhos de calendário e notificações e o saldo de pontos. Estão agrupadas pelos 5 destinos da navegação principal do aluno (Início, Estudos, Missões, Ranking e Perfil), seguidas das sobreposições do cabeçalho, da área do professor e das telas novas desde o PDF.

| Grupo | Telas |
| --- | --- |
| Acesso | 01–02 |
| Início (feed) | 03–14 |
| Estudos e salas coletivas | 15–23 |
| Missões | 24–29 |
| Ranking e Campeonatos | 30–40 |
| Loja | 41–45 |
| Perfil e Estatísticas | 46–51 |
| Sobreposições do cabeçalho | 55–57 (52–54 retiradas) |
| Área do professor e computador | 58–67 |
| Estados de carregamento e erro | 68–79 (veja [3.1.3](#313-telas-de-processamento-e-tratamento-de-erros)) |
| Telas novas desde o PDF | 80–115 |

### Acesso: login por perfil

Porta de entrada do app. O mesmo formulário atende aluno e professor: a aba escolhida define para qual área a pessoa é levada. Abaixo do formulário, "Usar conta de teste" abre o acesso de demonstração, que entra com um toque.

| <img src="telas/01-login-aluno.webp" width="240" alt="01 Login: Aluno"> | <img src="telas/02-login-professor.webp" width="240" alt="02 Login: Professor"> |
|:---:|:---:|
| **01** Login: Aluno | **02** Login: Professor |

### Início: feed social e filtros

Tela de entrada do aluno. Os filtros (Tudo, Dúvidas, Materiais, Avisos, Minha turma) reaproveitam a mesma lista, evitando multiplicar telas. O professor usa este mesmo feed, com ferramentas próprias (telas 80 a 86).

| <img src="telas/03-feed-tudo.webp" width="240" alt="03 Tela principal"> | <img src="telas/04-feed-duvidas.webp" width="240" alt="04 Dúvidas"> | <img src="telas/05-feed-materiais.webp" width="240" alt="05 Materiais"> |
|:---:|:---:|:---:|
| **03** Tela principal | **04** Dúvidas | **05** Materiais |

| <img src="telas/06-feed-avisos.webp" width="240" alt="06 Feed: Avisos"> | <img src="telas/07-feed-minha-turma.webp" width="240" alt="07 Feed: Minha turma"> | <img src="telas/08-busca-semantica.webp" width="240" alt="08 Busca semântica (lupa)"> |
|:---:|:---:|:---:|
| **06** Feed: Avisos | **07** Feed: Minha turma | **08** Busca semântica (lupa) |

### Início: funcionalidades do feed

A caixa de publicação no topo e o botão flutuante (+), que aparece quando a caixa sai da tela, abrem o modal "Nova publicação".

| <img src="telas/09-botao-flutuante.webp" width="240" alt="09 Botão flutuante (+) ao rolar o feed"> | <img src="telas/10-filtro-membro.webp" width="240" alt="10 Filtro por membro (faixa estilo stories)"> | <img src="telas/11-material-da-turma.webp" width="240" alt="11 Material da turma (quando clicado o anexo)"> |
|:---:|:---:|:---:|
| **09** Botão flutuante (+) ao rolar o feed | **10** Filtro por membro (faixa estilo stories) | **11** Material da turma (quando clicado o anexo) |

| <img src="telas/12-nova-duvida-sugestoes.webp" width="240" alt="12 Nova publicação: Dúvida, com sugestões da IA"> | <img src="telas/13-nova-material.webp" width="240" alt="13 Nova publicação: Material"> | <img src="telas/14-denuncia-triagem.webp" width="240" alt="14 Denúncia com triagem automática"> |
|:---:|:---:|:---:|
| **12** Nova publicação: Dúvida, com sugestões da IA | **13** Nova publicação: Material | **14** Denúncia com triagem automática |

### Estudos: sala de estudos e salas coletivas

Uma tela concentra o estudo individual: timer de foco, meta do dia, sessões recentes e ranking de foco, com as métricas (Hoje, Semana e Sequência) no topo. Os gráficos de estudo agora ficam em Estatísticas (telas 50, 90 e 91). O botão "Salas ao vivo", no título, leva às salas coletivas, onde a turma foca no mesmo ciclo, com presença e chat.

| <img src="telas/15-timer-de-foco.webp" width="240" alt="15 Timer de foco"> | <img src="telas/16-foco-em-andamento.webp" width="240" alt="16 Foco em andamento"> | <img src="telas/17-metricas-e-meta.webp" width="240" alt="17 Métricas e meta do dia"> |
|:---:|:---:|:---:|
| **15** Timer de foco | **16** Foco em andamento | **17** Métricas e meta do dia |

| <img src="telas/18-ranking-de-foco-interclasses.webp" width="240" alt="18 Ranking de foco + Interclasses"> | <img src="telas/19-salas-coletivas.webp" width="240" alt="19 Salas coletivas"> | <img src="telas/20-criar-sala.webp" width="240" alt="20 Criar sala"> |
|:---:|:---:|:---:|
| **18** Ranking de foco + Interclasses | **19** Salas coletivas | **20** Criar sala |

| <img src="telas/21-sala-antes-de-entrar.webp" width="240" alt="21 Sala: antes de entrar"> | <img src="telas/22-sala-ao-vivo.webp" width="240" alt="22 Sala ao vivo (timer sincronizado)"> | <img src="telas/23-presenca-e-chat.webp" width="240" alt="23 Presença e chat da sala"> |
|:---:|:---:|:---:|
| **21** Sala: antes de entrar | **22** Sala ao vivo (timer sincronizado) | **23** Presença e chat da sala |

### Missões: engajamento e gamificação

Uma única tela rolável concentra sequência de estudo, missões de hoje, atividades do professor, flashcards, desafios personalizados, missão coletiva e relatos à escola.

| <img src="telas/24-missoes-visao-geral.webp" width="240" alt="24 Missões: visão geral"> | <img src="telas/25-missoes-de-hoje.webp" width="240" alt="25 Missões de hoje"> | <img src="telas/26-atividades-do-professor.webp" width="240" alt="26 Atividades do professor"> |
|:---:|:---:|:---:|
| **24** Missões: visão geral | **25** Missões de hoje | **26** Atividades do professor |

| <img src="telas/27-flashcards-desafios.webp" width="240" alt="27 Flashcards + Desafios"> | <img src="telas/28-missao-coletiva-relatos.webp" width="240" alt="28 Missão coletiva + Relatos à escola"> | <img src="telas/29-relatar-problema.webp" width="240" alt="29 Relatar problema da escola"> |
|:---:|:---:|:---:|
| **27** Flashcards + Desafios | **28** Missão coletiva + Relatos à escola | **29** Relatar problema da escola |

### Ranking: comparação por liga, turma, disciplina e foco

O seletor Liga (XP) / Foco troca a métrica. Na liga, as 3 abas (Minha liga, Minha turma, Por disciplina) reorganizam a mesma lista de XP; o cartão de posição fica no topo e, quando a linha do aluno sai da tela, um pino fixo ("Você · 7º lugar") leva de volta a ela. No Foco, a lista mostra os minutos de estudo da semana, da turma ou da escola toda.

| <img src="telas/30-ranking-visao-geral.webp" width="240" alt="30 Ranking: visão geral"> | <img src="telas/31-ranking-minha-liga.webp" width="240" alt="31 Ranking: Minha liga"> | <img src="telas/32-ranking-minha-turma.webp" width="240" alt="32 Ranking: Minha turma"> |
|:---:|:---:|:---:|
| **30** Ranking: visão geral | **31** Ranking: Minha liga | **32** Ranking: Minha turma |

| <img src="telas/33-ranking-por-disciplina.webp" width="240" alt="33 Ranking: Por disciplina"> | <img src="telas/34-ranking-foco.webp" width="240" alt="34 Ranking: Foco"> | <img src="telas/35-ranking-visibilidade.webp" width="240" alt="35 Visibilidade no ranking"> |
|:---:|:---:|:---:|
| **33** Ranking: Por disciplina | **34** Ranking: Foco | **35** Visibilidade no ranking |

### Campeonatos: duelos e disputas entre turmas

Ficam na aba ao lado do Ranking. Reúnem mata-mata com duelos de quiz, pontos corridos e interclasses; o próximo duelo do aluno aparece em destaque no topo.

| <img src="telas/36-campeonatos.webp" width="240" alt="36 Campeonatos"> | <img src="telas/37-campeonato-detalhe.webp" width="240" alt="37 Detalhe do campeonato"> | <img src="telas/38-chaveamento.webp" width="240" alt="38 Chaveamento"> |
|:---:|:---:|:---:|
| **36** Campeonatos | **37** Detalhe do campeonato | **38** Chaveamento |

| <img src="telas/39-duelo-inicio.webp" width="240" alt="39 Duelo de quiz: início"> | <img src="telas/40-duelo-pergunta.webp" width="240" alt="40 Duelo de quiz: pergunta"> |   |
|:---:|:---:|:---:|
| **39** Duelo de quiz: início | **40** Duelo de quiz: pergunta |   |

### Loja: itens e recompensas

Aberta pelo atalho "Loja" do Perfil ou pelo botão "Ir para a Loja" do painel de saldo (tela 57). O saldo de pontos fica no topo, com o lembrete de que o XP não é gasto na Loja; as recompensas físicas da escola ficam separadas dos itens do perfil.

| <img src="telas/41-loja-avatar.webp" width="240" alt="41 Loja: Avatar"> | <img src="telas/42-loja-historico.webp" width="240" alt="42 Loja: Avatar (continuação) + Histórico"> | <img src="telas/43-loja-perfil.webp" width="240" alt="43 Loja: Perfil"> |
|:---:|:---:|:---:|
| **41** Loja: Avatar | **42** Loja: Avatar (continuação) + Histórico | **43** Loja: Perfil |

| <img src="telas/44-loja-recompensas.webp" width="240" alt="44 Recompensas da escola"> | <img src="telas/45-confirmar-troca.webp" width="240" alt="45 Confirmar troca"> |   |
|:---:|:---:|:---:|
| **44** Recompensas da escola | **45** Confirmar troca |   |

### Perfil: publicações, conquistas e configurações

O perfil segue o padrão de rede social: capa, avatar, nível e números no topo (Publicações, Respostas úteis, Medalhas e Dias seguidos), com os atalhos Editar perfil, Minhas estatísticas e Loja, e 3 abas. Conquistas reúne nível e XP e as medalhas conquistadas e bloqueadas; Configurações reúne privacidade, personalização, aparência e conta. A aba "Estudo" do PDF virou a tela Estatísticas (tela 50).

| <img src="telas/46-perfil-publicacoes.webp" width="240" alt="46 Perfil: Publicações"> | <img src="telas/47-perfil-conquistas-xp.webp" width="240" alt="47 Conquistas: XP e nível"> | <img src="telas/48-perfil-conquistas-medalhas.webp" width="240" alt="48 Conquistas: medalhas"> |
|:---:|:---:|:---:|
| **46** Perfil: Publicações | **47** Conquistas: XP e nível | **48** Conquistas: medalhas |

| <img src="telas/49-detalhe-medalha.webp" width="240" alt="49 Detalhe da medalha"> | <img src="telas/50-estatisticas-aluno-resumo.webp" width="240" alt="50 Estatísticas (no PDF, aba Estudo)"> | <img src="telas/51-perfil-configuracoes.webp" width="240" alt="51 Configurações e privacidade"> |
|:---:|:---:|:---:|
| **49** Detalhe da medalha | **50** Estatísticas (no PDF, aba Estudo) | **51** Configurações e privacidade |

### Sobreposições do cabeçalho

Os ícones do cabeçalho abrem painéis sobre a tela atual, sem trocar de destino: Calendário, Notificações e Saldo.

**Escopo do MVP.** As mensagens diretas (US01, prioridade P0) foram **retiradas** do protótipo por decisão da banca (v4): não há ícone no cabeçalho, item na barra lateral nem atalho no Perfil. A conversa acontece no feed e no chat das salas, e a triagem de ofensas vale para os dois. O Calendário (US04, P1) continua no MVP: ícone fixo no cabeçalho de todas as telas do aluno, com o número de compromissos dos próximos 7 dias, e o bloco "Próximas provas" na coluna da direita do Início, no computador. O fluxo completo está no documento [Navegação e Fluxos](NAVEGACAO_E_FLUXOS.md) (4.12, retirado, e 4.13).

| <img src="telas/55-calendario.webp" width="240" alt="55 Calendário (semana cheia)"> | <img src="telas/56-notificacoes.webp" width="240" alt="56 Notificações"> | <img src="telas/57-saldo-pontos-xp.webp" width="240" alt="57 Seu saldo (pontos e XP)"> |
|:---:|:---:|:---:|
| **55** Calendário (semana cheia) | **56** Notificações | **57** Seu saldo (pontos e XP) |

Telas retiradas:

| Tela | Título no PDF | Situação |
| --- | --- | --- |
| 52 | Mensagens | retirada (decisão da banca) |
| 53 | Conversa em grupo | retirada (decisão da banca) |
| 54 | Mensagem retida para revisão | retirada (decisão da banca). A retenção por moderação continua no feed e no chat das salas (telas 69 e 70) |

### Área do professor

O professor entra pela mesma tela de login e cai no Painel. A navegação dele tem 5 destinos: Painel, Feed, Alunos, Atividades e Estatísticas. Salas, Campeonatos, Dúvidas e Moderação ficam a um toque do Painel, no bloco fixo "Comunidade e engajamento" (e na barra lateral, no computador).

| <img src="telas/58-painel-da-turma.webp" width="240" alt="58 Painel da turma"> | <img src="telas/59-precisa-de-atencao-para-corrigir.webp" width="240" alt="59 Precisa de atenção + Para corrigir"> | <img src="telas/60-dar-pontos-e-xp.webp" width="240" alt="60 Dar pontos e XP"> |
|:---:|:---:|:---:|
| **58** Painel da turma | **59** Precisa de atenção + Para corrigir | **60** Dar pontos e XP |

| <img src="telas/61-alunos.webp" width="240" alt="61 Alunos"> | <img src="telas/62-atividades.webp" width="240" alt="62 Atividades"> | <img src="telas/63-detalhe-da-atividade.webp" width="240" alt="63 Detalhe da atividade"> |
|:---:|:---:|:---:|
| **61** Alunos | **62** Atividades | **63** Detalhe da atividade |

| <img src="telas/64-correcao-com-nota.webp" width="240" alt="64 Correção com nota"> | <img src="telas/65-moderacao.webp" width="240" alt="65 Moderação"> |   |
|:---:|:---:|:---:|
| **64** Correção com nota | **65** Moderação |   |

### Versão para computador

A partir de 1024 px de largura, a barra inferior dá lugar a uma barra lateral com todas as áreas agrupadas. No Início do aluno, a partir de 1280 px, uma coluna à direita mostra o campeonato em destaque, o resumo da semana ("Sua semana"), quem está estudando agora e as próximas provas. O professor tem a barra lateral com Turmas, Engajamento e Comunidade.

| <img src="telas/66-aluno-inicio-computador.webp" width="380" alt="66 Aluno: Início"> | <img src="telas/67-professor-painel-computador.webp" width="380" alt="67 Professor: Painel"> |
|:---:|:---:|
| **66** Aluno: Início | **67** Professor: Painel |

### Telas novas desde o PDF

Telas que o PDF não tinha, de **80 a 115**. Cada legenda diz o que a tela mostra no app v8.

#### Feed do professor

O professor usa o mesmo feed (`/feed`), chamado "Feed da escola". Ele publica Aviso, Material e Publicação, responde dúvidas como resposta oficial, marca respostas de alunos como Útil e remove publicações de alunos. O fluxo está em [Navegação e Fluxos](NAVEGACAO_E_FLUXOS.md) (2.3 e 4.14 a 4.16).

| <img src="telas/80-feed-professor.webp" width="240" alt="80 Feed do professor"> | <img src="telas/81-feed-professor-sem-resposta.webp" width="240" alt="81 Feed do professor: Sem resposta"> | <img src="telas/83-nova-publicacao-aviso-destino.webp" width="240" alt="83 Nova publicação do professor: Aviso com destino"> |
|:---:|:---:|:---:|
| **80** Feed do professor<br><sub>O mesmo Feed da escola, com filtros próprios e a faixa "N publicações aguardando revisão" no topo.</sub> | **81** Feed do professor: Sem resposta<br><sub>Só as dúvidas que ainda não têm resposta oficial.</sub> | **83** Nova publicação do professor: Aviso com destino<br><sub>Tipos Aviso, Material e Publicação (sem Dúvida). O destino é obrigatório.</sub> |

| <img src="telas/84-aviso-do-professor-no-feed-da-aluna.webp" width="240" alt="84 Aviso do professor no feed da aluna"> | <img src="telas/85-resposta-oficial-no-feed.webp" width="240" alt="85 Resposta oficial no feed"> | <img src="telas/86-remover-publicacao.webp" width="240" alt="86 Remover publicação (professor)"> |
|:---:|:---:|:---:|
| **84** Aviso do professor no feed da aluna<br><sub>A aluna da turma vê o aviso na aba Avisos e recebe uma notificação.</sub> | **85** Resposta oficial no feed<br><sub>A resposta do professor a uma dúvida é a resposta oficial: a dúvida fica Resolvida e a aluna ganha +20 pontos e +15 XP, uma vez.</sub> | **86** Remover publicação (professor)<br><sub>No menu da publicação de um aluno, Remover publicação no lugar de Denunciar. O motivo é obrigatório.</sub> |

| <img src="telas/82-feed-professor-computador.webp" width="380" alt="82 Feed do professor no computador"> |
|:---:|
| **82** Feed do professor no computador<br><sub>A partir de 1280 px, coluna à direita com Dúvidas sem resposta, Aguardando moderação e Próximas entregas. Os atalhos Publicar aviso e Compartilhar material ficam logo abaixo, fora do enquadramento.</sub> |

#### Moderação e contestação

A autora de uma publicação retida pode contestar. A contestação e as remoções feitas pelo feed aparecem na Moderação do professor.

| <img src="telas/87-moderacao-com-decisao.webp" width="240" alt="87 Moderação: fila, decisão e contestação"> | <img src="telas/88-contestacao-enviada.webp" width="240" alt="88 Contestação enviada"> |
|:---:|:---:|
| **87** Moderação: fila, decisão e contestação<br><sub>Com uma remoção feita pelo feed (em Decisões) e a publicação contestada pela autora na fila.</sub> | **88** Contestação enviada<br><sub>A publicação segue visível só para a autora, agora com "Contestação enviada em dd/mm · aguardando revisão".</sub> |

| <img src="telas/89-moderacao-computador.webp" width="380" alt="89 Moderação no computador"> |
|:---:|
| **89** Moderação no computador<br><sub>Fila de publicações sinalizadas em 1440 px.</sub> |

#### Estatísticas

Os gráficos saíram da Sala de estudos e do Painel e ganharam uma tela própria para cada papel: `/estatisticas` (aluno) e `/professor/estatisticas` (professor).

| <img src="telas/90-estatisticas-aluno.webp" width="240" alt="90 Estatísticas do aluno"> | <img src="telas/91-estatisticas-aluno-foco.webp" width="240" alt="91 Estatísticas do aluno: Foco e estudo"> | <img src="telas/92-estatisticas-aluno-desempenho.webp" width="240" alt="92 Estatísticas do aluno: Desempenho"> |
|:---:|:---:|:---:|
| **90** Estatísticas do aluno<br><sub>Períodos 7 dias, 30 dias e Bimestre, filtro por disciplina e atalhos para as seções.</sub> | **91** Estatísticas do aluno: Foco e estudo<br><sub>Tempo por dia e Constância. Mais abaixo: Horário de pico, Por disciplina e Você × turma.</sub> | **92** Estatísticas do aluno: Desempenho<br><sub>Notas das atividades, Duelos e Flashcards.</sub> |

| <img src="telas/93-estatisticas-aluno-computador.webp" width="380" alt="93 Estatísticas do aluno no computador"> |
|:---:|
| **93** Estatísticas do aluno no computador<br><sub>A mesma tela em 1440 px.</sub> |

| <img src="telas/94-estatisticas-professor.webp" width="240" alt="94 Estatísticas do professor"> | <img src="telas/95-estatisticas-professor-engajamento.webp" width="240" alt="95 Estatísticas do professor: Engajamento"> |
|:---:|:---:|
| **94** Estatísticas do professor<br><sub>Filtros de turma, período, disciplina e aluno; Exportar (PDF) e Dados (CSV); 8 seções.</sub> | **95** Estatísticas do professor: Engajamento<br><sub>Ativos por dia e Horas de estudo em 30 dias.</sub> |

| <img src="telas/96-estatisticas-professor-computador.webp" width="380" alt="96 Estatísticas do professor no computador"> |
|:---:|
| **96** Estatísticas do professor no computador<br><sub>Filtros e gráficos em 1440 px.</sub> |

#### Dúvidas e Painel do professor

As Dúvidas ganharam uma tela própria (`/professor/duvidas`). O Painel tem atalhos fixos para a comunidade e dois painéis de ação rápida (Publicar aviso e Nova atividade); o detalhe do aluno abre pela lista de Alunos.

| <img src="telas/97-duvidas-do-professor.webp" width="240" alt="97 Dúvidas do professor"> | <img src="telas/98-duvidas-respondidas.webp" width="240" alt="98 Dúvidas do professor: Respondidas"> | <img src="telas/100-painel-professor-atalhos.webp" width="240" alt="100 Painel do professor: atalhos"> |
|:---:|:---:|:---:|
| **97** Dúvidas do professor<br><sub>Dúvidas do feed na disciplina do professor, com filtro de turma, abas Pendentes e Respondidas, campo de resposta oficial e link Ver no feed.</sub> | **98** Dúvidas do professor: Respondidas<br><sub>Aba Respondidas, com a resposta oficial e o botão Útil nas respostas dos alunos.</sub> | **100** Painel do professor: atalhos<br><sub>Bloco Comunidade e engajamento, sempre visível: Dúvidas, Moderação, Salas de estudo e Campeonatos a um toque (Trocas aparece quando há recompensas para entregar).</sub> |

| <img src="telas/108-painel-publicar-aviso.webp" width="240" alt="108 Painel: Publicar aviso"> | <img src="telas/109-nova-atividade.webp" width="240" alt="109 Nova atividade"> | <img src="telas/110-aluno-detalhe.webp" width="240" alt="110 Professor: detalhe do aluno"> |
|:---:|:---:|:---:|
| **108** Painel: Publicar aviso<br><sub>A mesma regra do aviso do feed: destino (Toda a escola, 9º Ano A, 9º Ano B ou 8º Ano A) e notificação dos alunos.</sub> | **109** Nova atividade<br><sub>Tipo, título, descrição, disciplina, turma e prazo.</sub> | **110** Professor: detalhe do aluno<br><sub>Indicadores da semana, atividades e ações: Boletim, lembrar e Dar pontos.</sub> |

| <img src="telas/99-duvidas-computador.webp" width="380" alt="99 Dúvidas do professor no computador"> |
|:---:|
| **99** Dúvidas do professor no computador<br><sub>A mesma tela em 1440 px.</sub> |

#### Perfil público, perfil, atividades e campeonatos

Outras telas do app que o PDF não mostrava.

| <img src="telas/101-perfil-publico.webp" width="240" alt="101 Perfil público de um colega"> | <img src="telas/104-flashcards-rodada.webp" width="240" alt="104 Flashcards: rodada em andamento"> | <img src="telas/105-entregar-atividade.webp" width="240" alt="105 Entregar atividade"> |
|:---:|:---:|:---:|
| **101** Perfil público de um colega<br><sub>Abre ao tocar em qualquer avatar ou nome: nível, medalhas e publicações da pessoa.</sub> | **104** Flashcards: rodada em andamento<br><sub>Rodada de 10 cartas com repetição espaçada: "Carta 1 de 10", Virar carta e, depois, Errei e Acertei.</sub> | **105** Entregar atividade<br><sub>Resposta escrita e arquivo; a nota e o comentário chegam depois.</sub> |

| <img src="telas/106-editar-perfil.webp" width="240" alt="106 Editar perfil"> | <img src="telas/107-criar-campeonato.webp" width="240" alt="107 Criar campeonato"> |   |
|:---:|:---:|:---:|
| **106** Editar perfil<br><sub>Foto, nome de exibição, @usuário, bio e selos exibidos.</sub> | **107** Criar campeonato<br><sub>Amistoso entre colegas da turma, em três passos: Formato, Quando, Quem e prêmio.</sub> |   |

#### Modo apresentação

Os atalhos de demonstração ficam escondidos até o modo apresentação ser ligado (Alt+Shift+D ou Perfil > Configurações > Modo apresentação).

| <img src="telas/102-modo-apresentacao-roteiro.webp" width="240" alt="102 Modo apresentação: Roteiro"> | <img src="telas/103-roteiro-simular-falhas.webp" width="240" alt="103 Roteiro: Simular falhas"> |
|:---:|:---:|
| **102** Modo apresentação: Roteiro<br><sub>Alt+Shift+D liga o modo. O Roteiro de apresentação traz os passos clicáveis do aluno e do professor.</sub> | **103** Roteiro: Simular falhas<br><sub>Liga uma falha por vez (sem conexão, IA, busca, salvar, carregar) ou Desligar todas.</sub> |

#### Tema escuro e computador

O tema claro, escuro ou do sistema é escolhido em Perfil > Configurações > Aparência.

| <img src="telas/111-tema-escuro-configuracoes.webp" width="180" alt="111 Tema escuro: Aparência"> | <img src="telas/112-tema-escuro-feed.webp" width="180" alt="112 Tema escuro: Feed do aluno"> | <img src="telas/113-tema-escuro-painel-professor.webp" width="180" alt="113 Tema escuro: Painel do professor"> | <img src="telas/114-tema-escuro-ranking.webp" width="180" alt="114 Tema escuro: Ranking"> |
|:---:|:---:|:---:|:---:|
| **111** Tema escuro: Aparência | **112** Tema escuro: Feed do aluno | **113** Tema escuro: Painel do professor | **114** Tema escuro: Ranking |

| Tela | O que mostra |
| --- | --- |
| 111 | Tema escuro: Aparência. Configurações > Aparência, com Claro, Escuro e Sistema. |
| 112 | Tema escuro: Feed do aluno. O mesmo feed no tema escuro. |
| 113 | Tema escuro: Painel do professor. O Painel no tema escuro. |
| 114 | Tema escuro: Ranking. O Ranking no tema escuro. |

| <img src="telas/115-ranking-computador.webp" width="380" alt="115 Ranking no computador"> |
|:---:|
| **115** Ranking no computador<br><sub>Lista de XP à esquerda; cartão de posição, ligas e visibilidade à direita (1440 px).</sub> |

---

## 3.1.2 Detalhamento de navegação

Fluxo de navegação do protótipo, do ponto de entrada às sobreposições:

```mermaid
flowchart LR
  L["Login<br/>(abas Aluno e Professor)"] --> G{"Guarda de rotas<br/>no navegador"}
  G -- aluno --> AL
  G -- professor --> PR
  subgraph AL["Aluno: barra inferior"]
    direction TB
    A1["Início (feed)"]
    A2["Estudos"]
    A3["Missões"]
    A4["Ranking"]
    A5["Perfil"]
  end
  subgraph PR["Professor: barra inferior"]
    direction TB
    P1["Painel"]
    P2["Feed"]
    P3["Alunos"]
    P4["Atividades"]
    P5["Estatísticas"]
  end
  A1 --> S1["Nova publicação, Material,<br/>Denúncia, Busca"]
  A2 --> S2["Salas ao vivo e sala"]
  A4 --> S3["Campeonatos, detalhe e duelo"]
  A5 --> S4["Loja, Estatísticas,<br/>Configurações"]
  H["Cabeçalho do aluno:<br/>Calendário, Notificações, Saldo"] -.-> AL
  P1 --> S5["Dúvidas, Moderação,<br/>Salas, Campeonatos"]
  P2 --> S6["Publicar aviso e material,<br/>resposta oficial, remover"]
```

- **Navegação principal fixa**, com 5 destinos sempre acessíveis para o aluno: Início · Estudos · Missões · Ranking · Perfil. O professor tem os seus: Painel · Feed · Alunos · Atividades · Estatísticas. No computador (a partir de 1024 px), a barra inferior vira uma barra lateral agrupada: Aprender, Competir e Você (aluno) ou Turmas, Engajamento e Comunidade (professor).
- **Login único** com as abas Aluno e Professor. Cada perfil é levado à sua tela inicial (Início ou Painel) e não consegue abrir a área do outro. A guarda de rotas roda no navegador ([`src/lib/guarda.ts`](../../src/lib/guarda.ts)): enquanto ela decide, aparece o esqueleto (tela 68) e a página protegida nunca chega a ser montada. O Feed, as Salas coletivas, os Campeonatos e o Perfil público são compartilhados pelos dois perfis. Uma rota que não existe mostra a página 404.
- **Início (feed)** é a tela de entrada do aluno. Sub-filtros em abas (Tudo / Dúvidas / Materiais / Avisos / Minha turma) filtram o mesmo feed sem trocar de tela; isso reduz a quantidade de telas novas a construir. A faixa de membros (estilo stories) filtra pelas publicações de uma pessoa, e a lupa abre a busca semântica.
- **Nova publicação.** A caixa de publicação no topo do feed (com os atalhos Dúvida e Material) e o botão de ação flutuante (+), que aparece quando a caixa sai da tela, abrem o modal "Nova publicação", com 3 tipos (Publicação, Dúvida, Material) e seleção de disciplina, com fluxo de criação em uma única tela, sem navegação extra. Para o professor, os tipos são Aviso, Material e Publicação, com destino obrigatório (Toda a escola, 9º Ano A, 9º Ano B ou 8º Ano A).
- **Anexos e denúncias** abrem painéis sobre o feed ("Material" e "Denunciar publicação"), sem sair da lista, preservando o contexto de rolagem. O professor tem "Remover publicação" no lugar de "Denunciar".
- **Estudos** concentra timer de foco, meta do dia, sessões recentes, ranking de foco e Interclasses do Foco em uma tela, com as métricas do período no topo. O botão "Salas ao vivo" leva às salas coletivas, e o timer continua visível nas outras telas enquanto estiver rodando. Os gráficos ficam em Estatísticas.
- **Missões** concentra os blocos verticais em uma tela só (sequência, missões de hoje, atividades do professor, flashcards, desafios, missão coletiva e relatos à escola). O aluno rola a página em vez de navegar entre telas.
- **Ranking** tem duas abas no topo (Ranking / Campeonatos). Dentro do Ranking, o seletor Liga (XP) / Foco troca a métrica e as 3 abas (Minha liga / Minha turma / Por disciplina) reorganizam a mesma lista, mantendo o cartão de posição e XP no topo.
- **Perfil** tem 3 abas (Publicações / Conquistas / Configurações) e atalhos para Editar perfil, Estatísticas e Loja. Os gráficos de estudo vivem em Estatísticas (`/estatisticas`), que também abre pela barra lateral e pelo link "Ver minhas estatísticas" da Sala de estudos.
- **Loja** tem 3 abas (Avatar / Perfil / Recompensas da escola) e o histórico de trocas ao final da rolagem. É aberta pelo atalho "Loja" do perfil, pelo painel de saldo do cabeçalho ou, no computador, pela barra lateral.
- **Cabeçalho:** calendário, notificações e saldo abrem painéis sobrepostos; o seletor de espaço troca entre Toda a escola, 9º Ano A e os clubes (Clube de Robótica e Bilíngue Cultura Inglesa). O cabeçalho do professor mostra "Painel do professor", a disciplina e as turmas, e as notificações.
- **Professor:** o Painel traz o bloco "Comunidade e engajamento" (Dúvidas, Moderação, Salas e Campeonatos) a um toque. Dúvidas e Moderação também ficam na barra lateral, no grupo Comunidade, com o Feed da escola.
- **Regra de consistência:** qualquer ação que gera pontos/XP mostra o valor (+20 pontos, +10 XP) junto ao elemento que a originou, para o aluno sempre entender o motivo da recompensa.

O detalhe de cada tela, com as rotas e os textos, está em [Navegação e Fluxos](NAVEGACAO_E_FLUXOS.md).

---

## 3.1.3 Telas de processamento e tratamento de erros

Cada risco de falha mapeado no Bloco 1 (moderação, antifraude, latência e indisponibilidade da IA e dos dados) tem uma tela desenhada. No PDF, três estados estavam implementados e os demais eram mockup. **No protótipo v8, todos os estados abaixo estão implementados, menos "Pontos em verificação" (tela 77)**, que depende da sinalização de IA externa (US10, evolução futura) e continua só como desenho. As telas 72, 73, 74 e 76 aparecem aqui com a falha **simulada** pelo modo apresentação; a 71 também aparece com a conexão realmente caída. Os contratos técnicos de cada estado estão em [Arquitetura da Solução](ARQUITETURA_DA_SOLUCAO.md) (seção 05).

| Estado | Quando aparece | O que mostra | Ação do aluno | Situação | Tela |
| --- | --- | --- | --- | --- | --- |
| **Carregando conteúdo** | Abertura do app e das telas principais, e enquanto a guarda de rotas decide para onde levar a pessoa. | Blocos cinza no lugar do conteúdo (esqueleto), para a tela não "pular" quando o conteúdo chega. | Aguarda; nada fica bloqueado. | Implementada | 68 |
| **Sem conexão** | A internet cai enquanto o aluno usa o app. | Faixa "Sem conexão. Tentando retransmitir…", com o número de publicações aguardando envio. O que ele publicar fica no aparelho com o selo "Aguardando envio · salvo neste aparelho" e é reenviado sozinho quando a conexão volta. | Continua usando; não perde nada. | Implementada. A fila de envio existe no código ([`src/api/sync.ts`](../../src/api/sync.ts)). | 71 |
| **Timeout** | Uma tela falha ao carregar ou os dados não respondem dentro do tempo esperado. | "Não foi possível carregar agora", "O servidor demorou para responder. Nada do que você escreveu foi perdido.", botão "Tentar novamente" e atalho "Voltar ao Início". O rascunho nunca é perdido. | Tenta de novo ou volta ao Início. | Implementada como limite de erro, vale para qualquer tela ([`LimiteDeErro.tsx`](../../src/components/shell/LimiteDeErro.tsx)). No protótipo a leitura é local, então a tela aparece quando uma tela quebra ou pela simulação "Falha ao carregar tela". | 72 |
| **Falha da IA na publicação** | A sugestão de disciplina e de dúvidas parecidas (P01/P02) falha ou demora mais que o limite (2 s e 2,5 s). | Aviso neutro "Sugestões indisponíveis no momento. Escolha a disciplina abaixo." e escolha manual da disciplina. Publicar continua liberado. | Escolhe a disciplina e publica. | Implementada ([`src/lib/ia.ts`](../../src/lib/ia.ts)) | 73 |
| **Falha da busca semântica** | A busca por significado está indisponível. | Resultados por palavra-chave, com o aviso "Resultados por palavra-chave. A busca por significado está indisponível agora." | Usa os resultados ou refina a busca. | Implementada | 74 |
| **Conteúdo retido pela moderação** | A triagem classifica uma publicação, dúvida ou mensagem do chat de uma sala como possível ofensa, bullying ou assédio. | "Em revisão pela coordenação. Só você vê esta publicação por enquanto." No chat da sala, o aviso "Mensagem retida para revisão": a mensagem não aparece na conversa e vai para a fila da Moderação. Link "Isso foi um engano? Conteste aqui", que abre "Contestar a revisão"; depois do envio, "Contestação enviada em dd/mm · aguardando revisão". | Aguarda a revisão humana ou contesta. | Implementada: retenção no feed e no chat das salas, e a contestação. | 69, 70, 75, 88 |
| **Erro ao registrar missão** | Falha ao salvar o progresso de missão, flashcards ou missão coletiva. | "Não conseguimos salvar seu progresso" e "O contador só avança quando o servidor confirmar." Na missão, "Progresso não salvo" e "Tentar novamente". | Repete; se persistir, relata em "Relatos à escola". | Implementada | 76 |
| **Pontos em verificação** | A sinalização de IA externa (US10, P3) marca uma resposta. | Os pontos daquela resposta ficam "em verificação"; a resposta continua visível. Link "Contestar". Nada é punido automaticamente. | Aguarda revisão ou contesta. | **Mockup** (evolução futura, US10). Não existe no app. | 77 |
| **Saldo insuficiente** | O aluno tenta trocar um item mais caro que o saldo. | "Saldo insuficiente: você possui X pontos e este item requer Y pontos." O botão de troca fica desativado e o resumo mostra quantos pontos faltam. | Cancela ou escolhe outro item. | Implementada | 78 |
| **Estado vazio** | Uma lista ainda não tem conteúdo (ex.: busca sem resultado, nenhuma publicação, nenhuma notificação). | Ícone, frase curta explicando o que vai aparecer ali e a ação para começar. | Toca na ação sugerida. | Implementada em todas as listas. O exemplo "Nenhuma conversa" saiu com as mensagens retiradas. | 79 |


#### Estados implementados no protótipo

Mesma linguagem visual do protótipo: avisos em âmbar para revisão, vermelho só para erro, e sempre texto e ícone junto da cor. As capturas 72, 73, 74 e 76 mostram falhas simuladas (modo apresentação); as demais são o estado real.

| <img src="telas/68-carregando-esqueleto.webp" width="240" alt="68 Carregando conteúdo"> | <img src="telas/69-publicacao-retida.webp" width="240" alt="69 Publicação retida pela moderação"> | <img src="telas/70-mensagem-retida.webp" width="240" alt="70 Mensagem retida pela moderação (chat da sala)"> |
|:---:|:---:|:---:|
| **68** Carregando conteúdo | **69** Publicação retida pela moderação | **70** Mensagem retida pela moderação (chat da sala) |

| <img src="telas/71-sem-conexao.webp" width="240" alt="71 Sem conexão: faixa e publicação aguardando envio"> | <img src="telas/72-timeout-nao-foi-possivel-carregar.webp" width="240" alt="72 Timeout: não foi possível carregar"> | <img src="telas/73-falha-da-ia-escolha-manual.webp" width="240" alt="73 Falha da IA: escolha manual da disciplina"> |
|:---:|:---:|:---:|
| **71** Sem conexão: faixa e publicação aguardando envio | **72** Timeout: não foi possível carregar | **73** Falha da IA: escolha manual da disciplina |

| <img src="telas/74-falha-da-busca-palavra-chave.webp" width="240" alt="74 Falha da busca semântica: palavra-chave"> | <img src="telas/75-contestacao.webp" width="240" alt="75 Moderação com link de contestação"> | <img src="telas/76-erro-ao-registrar-missao.webp" width="240" alt="76 Erro ao registrar missão"> |
|:---:|:---:|:---:|
| **74** Falha da busca semântica: palavra-chave | **75** Moderação com link de contestação | **76** Erro ao registrar missão |

| <img src="telas/78-saldo-insuficiente.webp" width="240" alt="78 Saldo insuficiente na Loja"> | <img src="telas/79-estado-vazio-busca.webp" width="240" alt="79 Estado vazio: busca sem resultado"> |   |
|:---:|:---:|:---:|
| **78** Saldo insuficiente na Loja | **79** Estado vazio: busca sem resultado |   |

**Como ver cada estado.** Ligue o modo apresentação (Alt+Shift+D, ou Perfil > Configurações > Modo apresentação), abra o **Roteiro de apresentação** e use a seção **Simular falhas** (telas 102 e 103): Sem conexão, IA indisponível, Busca por significado indisponível, Falha ao salvar progresso e Falha ao carregar tela. "Desligar todas" limpa as simulações. As simulações só existem com o modo apresentação ligado.

#### Estado ainda em mockup

**77 Pontos em verificação (antifraude).** Não há captura, porque a sinalização de IA externa (US10, P3) não existe no protótipo. O desenho original está no PDF (página 19) e mostra, sobre uma resposta de aluno, o aviso: "Pontos em verificação. A resposta continua visível; os pontos dela aguardam revisão." e o botão "Contestar".

Regras comuns a todos os estados: nenhuma falha apaga o que o aluno escreveu; nenhuma falha da IA vira punição; todo erro diz o que aconteceu e o que fazer; e a cor nunca é o único sinal, porque cada estado tem texto e ícone próprios.

---

## Atualizações em relação ao PDF

Lista objetiva do que mudou entre `Wireframes_Squad38_1.pdf` e o protótipo v8, para a equipe atualizar o PDF.

**Gerais**

- **Mensagens diretas retiradas** (decisão da banca, v4). Saem do cabeçalho, da barra lateral e do Perfil. As telas 52, 53 e 54 viram "retirada (decisão da banca)", sem imagem. O texto "Mensagens e sobreposições do cabeçalho" vira "Sobreposições do cabeçalho" (Calendário, Notificações, Saldo), e o "Escopo do MVP" passa a dizer que as mensagens diretas (US01, P0) foram retiradas. A retenção por moderação continua no feed e no chat das salas.
- **Imagens refeitas na v8**, pela demonstração em HTML único (`demonstração/Portal_do_Aluno.html`), em celular 390 × 844 px e computador 1440 × 900 px, @2x, tema claro. As telas 01 a 79 mantêm a numeração do PDF; todas as capturas mostram o cabeçalho sem o ícone de mensagens. O texto da introdução não diz mais "em Next.js": o app roda no Next e na demonstração, idênticos.
- **Telas novas, de 80 a 115** (36 telas): Feed do professor (celular e computador), publicar aviso com destino, aviso no feed da aluna, resposta oficial, remover publicação, Moderação com decisão e contestação, contestação enviada, Estatísticas do aluno e do professor, Dúvidas do professor, atalhos do Painel, Publicar aviso e Nova atividade do Painel, detalhe do aluno, perfil público, modo apresentação e "Simular falhas", rodada de flashcards, entregar atividade, editar perfil, criar campeonato, tema escuro e Ranking no computador.
- **Introdução de 3.1.1:** o cabeçalho tem calendário, notificações e saldo (sem "mensagens"); o seletor de espaço mostra Toda a escola, 9º Ano A e os clubes.

**Telas principais**

- **17:** o PDF mostrava "Métricas e gráficos". Agora a tela é "Métricas e meta do dia": mostra Hoje, Semana e Sequência, a Meta do dia, Estudar com a turma e Sessões recentes. Os gráficos (Tempo de estudo, Constância, Horário de pico, Por disciplina, Você × turma) ficam em Estatísticas (`/estatisticas`, telas 50, 90 e 91).
- **18:** a tela de Interclasses (Interclasses do Foco) volta a ter correspondência no app.
- **15 a 23:** "Salas ao vivo" é um botão no título da Sala de estudos. Na sala coletiva só contam os minutos desde a entrada, e o bônus exige o ciclo inteiro.
- **24 a 28:** as missões renovam de verdade a cada dia, e cada missão conclui fazendo a tarefa (o botão "+1 progresso" só aparece no modo apresentação). Flashcards: rodada de 10 cartas por disciplina, com repetição espaçada e botões Errei e Acertei.
- **30 a 35:** a linha do aluno não fica fixa no rodapé da lista; quando ela sai da tela, aparece um pino fixo ("Você · 7º lugar") que leva de volta a ela.
- **35 a 40:** a visibilidade no ranking (Público, Anônimo, Invisível) vale para os rankings; nos campeonatos em que o aluno se inscreve, o nome aparece aos participantes (o texto está na tela).
- **41 a 45 (Loja):** o saldo no topo mostra os pontos e o número de trocas, com o aviso de que o XP não é gasto; o XP não aparece ao lado. A Loja abre pelo atalho do Perfil ou pelo botão "Ir para a Loja" do painel de saldo.
- **46 a 51 (Perfil):** o Perfil tem **3 abas** (Publicações, Conquistas, Configurações). A aba "Estudo" virou a tela **Estatísticas** (`/estatisticas`), aberta pelo botão "Minhas estatísticas", que é novo no topo do Perfil (tela 50). Conquistas não mostram mais o domínio por disciplina. Configurações reúne Privacidade, Personalização, Aparência e Conta (com o interruptor "Modo apresentação").
- **55:** o número do Calendário conta os compromissos dos próximos 7 dias. Os lembretes avisam 72 h, 24 h e 2 h antes.
- **58, 59 e 67 (Painel do professor):** sem o gráfico de Engajamento (os gráficos ficam em Estatísticas). Indicadores Ativos hoje, Estudo por aluno, Domínio médio, Em risco e Para corrigir; bloco "Comunidade e engajamento"; "Precisa de atenção" e "Para corrigir" lado a lado no computador; Destaques da semana e Atribuições recentes.
- **62:** "Nova atividade" é um botão no cabeçalho da lista de Atividades.
- **65:** a Moderação tem os indicadores Na fila, Urgentes e Decisões, as abas Publicações, Relatos e Histórico, o botão "Exportar histórico (CSV)", o selo "Contestada" e as remoções feitas pelo feed.
- **66:** a coluna da direita do Início, no computador (a partir de 1280 px), tem Campeonato em destaque, **Sua semana**, Estudando agora e Próximas provas.

**3.1.2 Detalhamento de navegação**

- A navegação do professor passa a ser **Painel · Feed · Alunos · Atividades · Estatísticas** (o PDF dizia Painel · Alunos · Atividades · Salas · Campeonatos). Salas, Campeonatos, Dúvidas e Moderação ficam a um toque do Painel (bloco "Comunidade e engajamento") e, no computador, na barra lateral: **Turmas** (Painel, Alunos, Atividades, Estatísticas), **Engajamento** (Salas de estudo, Campeonatos) e **Comunidade** (Feed da escola, Dúvidas, Moderação). O PDF dizia que a Moderação é aberta pelo Painel; agora ela é um dos atalhos do bloco fixo e também está na barra lateral.
- "O redirecionamento acontece antes de a página aparecer" vira: a **guarda de rotas** é única e roda no navegador (`src/lib/guarda.ts`); enquanto ela decide, aparece o esqueleto e a página protegida nunca monta. Não existe `proxy.ts` nem cookie de papel. Feed, Salas coletivas, Campeonatos e Perfil público são compartilhados pelos dois perfis. Rota inexistente mostra a página 404.
- O Perfil tem 3 abas (o PDF dizia 4, com "Estudo"). A Loja é aberta pelo atalho do perfil ou pelo painel de saldo, e não mais "pelo saldo no cabeçalho" diretamente.
- O cabeçalho não tem mais "mensagens".
- O modal "Nova publicação" tem uma variante do professor (Aviso, Material, Publicação, com destino obrigatório).
- O .md ganhou um **mapa de navegação** (Mermaid) que o PDF não tem; pode virar figura no PDF.
- **Feed do professor (v8, não está em nenhum PDF):** o professor usa o mesmo `/feed`, com Aviso, Material e Publicação com destino, resposta oficial (+20 pontos e +15 XP ao aluno, uma vez), "Útil" (+25 pontos e +25 XP), "Remover publicação" com motivo, filtros Tudo, Dúvidas, Sem resposta, Materiais, Avisos e Minhas turmas, faixa de moderação e coluna lateral.
- Telas do professor que existem e não estão no PDF: Dúvidas (`/professor/duvidas`) e Estatísticas da turma (`/professor/estatisticas`).

**3.1.3 Telas de processamento e tratamento de erros**

| Tela | Estado | No PDF | Hoje |
| --- | --- | --- | --- |
| 68 | Carregando conteúdo | Implementada | Implementada. Aparece na abertura do app e enquanto a guarda decide a rota; não aparece em troca de aba ou de filtro. |
| 69, 70 | Retenção pela moderação | Implementada (feed, mensagens e salas) | Implementada no feed e no **chat das salas** (sem mensagens diretas). |
| 71 | Sem conexão | Mockup | **Implementada**: faixa e selo "Aguardando envio · salvo neste aparelho", com a conexão realmente caída ou simulada. |
| 72 | Timeout | Mockup | **Implementada** como limite de erro ("Não foi possível carregar agora", "Tentar novamente", "Voltar ao Início"). |
| 73 | Falha da IA na publicação | Mockup | **Implementada** (tempo-limite de 2 s e 2,5 s e escolha manual). |
| 74 | Falha da busca semântica | Mockup | **Implementada** (palavra-chave e aviso). |
| 75 | Link de contestação | Mockup | **Implementada** ("Isso foi um engano? Conteste aqui" abre "Contestar a revisão"; a Moderação mostra a contestação). |
| 76 | Erro ao registrar missão | Mockup | **Implementada** ("Não conseguimos salvar seu progresso" e "Progresso não salvo", "Tentar novamente"). |
| 77 | Pontos em verificação | Mockup | Continua mockup (US10, evolução futura). Sem captura. |
| 78 | Saldo insuficiente | Mockup | **Implementada**, com a frase completa. No PDF o item era "Estrela de destaque" (2.800 pontos); a captura usa a Camiseta da Feira de Ciências (2.600 pontos, saldo de 2.570). |
| 79 | Estado vazio | Mockup, com o exemplo "Mensagens" | **Implementada** em todas as listas; o exemplo agora é a busca sem resultado ("Nada parecido por aqui"). |

- A frase de abertura de 3.1.3 ("Três estados já estão implementados... os demais foram prototipados como mockup") passa a dizer que todos estão implementados, menos o 77.
- A tela 68: o "esqueleto" não reserva o layout exato de cada tela; é um esqueleto geral (título, quatro quadros e três cartões).
- As falhas 71, 72, 73, 74 e 76 podem ser **simuladas só no modo apresentação** (Alt+Shift+D, Roteiro de apresentação, Simular falhas); a 75 é o fluxo real de contestação. Ficam nas capturas 72, 73, 74 e 76 como estado simulado; a 71 é uma queda real de conexão.
- A seção "Estados prototipados (mockup)" do PDF deixa de existir: as imagens 71 a 76 passam a ser capturas do app em "Estados implementados no protótipo". A tela 77 fica numa seção própria.
