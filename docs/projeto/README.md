# Documentos do projeto

Versões em Markdown dos 4 PDFs entregues pela equipe (Squad 38 · Portal do Aluno, RISEUP 2026.2), atualizadas para o protótipo v8 (09/10/2026). Ficam ao lado do código, então o que dizem bate com o que o app faz hoje. Cada documento termina com a seção **Atualizações em relação ao PDF**, que lista o que a equipe precisa mudar no PDF.

| Documento | Para que serve | PDF de origem |
| --- | --- | --- |
| [Arquitetura da Solução](ARQUITETURA_DA_SOLUCAO.md) | Camadas do app, estrutura de pastas, caminho de uma ação até a API, integração com a IA e tratamento de latência, erros, timeout e indisponibilidade (item 4.2 da entrega). | `Arquitetura_da_Solucao_Squad38_1.pdf` (6 p.) |
| [Design System](DESIGN_SYSTEM.md) | Cores, tipografia, componentes, acessibilidade, responsividade e padrões de feedback. Os esquemas ficam em [`img/`](img/). | `Design_System_Squad38_1.pdf` (15 p.) |
| [Navegação e Fluxos](NAVEGACAO_E_FLUXOS.md) | Abas e rotas, acesso por perfil, telas e estados do aluno e do professor, fluxos de usuário e escopo do MVP. | `Navegacao_e_Fluxos_Squad38_1.pdf` (12 p.) |
| [Wireframes](WIREFRAMES.md) | Telas principais por destino, detalhamento de navegação e telas de processamento e tratamento de erros (item 3.1 da entrega), com as capturas de [`telas/`](telas/). | `Wireframes_Squad38_1.pdf` (19 p.) |

Os PDFs são os originais da entrega e ficam fora do repositório.

## Como ver as telas

- **Em imagens:** [WIREFRAMES.md](WIREFRAMES.md) mostra as 111 capturas da pasta [`telas/`](telas/), agrupadas por destino e com legenda numerada. O número no nome do arquivo (`03-feed-tudo.webp`) é o número da tela. As telas 01 a 79 seguem o PDF; de 80 a 115 são novas.
- **Ao vivo:** abra [`demonstração/Portal_do_Aluno.html`](../../demonstração/Portal_do_Aluno.html) com duplo clique (funciona por `file://`), ou rode `npm run dev` na raiz. No login, "Usar conta de teste" entra com um toque como aluna (Ana) ou como professor (Ricardo).
- **Falhas e atalhos de apresentação:** Alt+Shift+D liga o modo apresentação; no Roteiro de apresentação, "Simular falhas" mostra as telas de erro de [3.1.3](WIREFRAMES.md#313-telas-de-processamento-e-tratamento-de-erros).
