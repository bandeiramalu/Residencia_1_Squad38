<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Portal do Aluno CEPI — convenções do projeto

- Idioma: português (código de domínio, textos, commits). Componentes de cliente com `"use client"`; animação com `import { m as motion } from "motion/react"`.
- **Estado**: tudo em `src/store/`. Mudança de estado = `commit(acao)` (`nucleo.ts`) → reducer puro (`reducer.ts`, sem `Date.now`/`Math.random`/I/O: tempos e ids entram pela ação) → `sincronizar(acao)` (`src/api/sync.ts`). Campos novos no estado são opcionais, com padrão no código. As telas só chamam fluxos de `store/actions.ts` e `store/acoes/*`, e leem com `useSeletor`.
- Toda ação nova do `Acao` exige uma regra em `REGRAS` de `src/api/sync.ts` (o TypeScript obriga): endpoint em `endpoints.ts`/`dto.ts`, ou `null` com justificativa. Documente em `docs/BACKEND.md`, `docs/api/openapi.yaml` e `docs/api/schema.sql`.
- Sessão por aba (`sessionStorage`, `src/lib/auth.ts`); guarda de rotas no cliente em `src/lib/guarda.ts` (sem `proxy.ts`, sem cookie `cepi_papel`). Contas de teste: `ana.moura@aluno.cepi.edu.br` e `ricardo.nogueira@cepi.edu.br`, senha `cepi2026`.
- O app roda de dois jeitos que devem ficar idênticos: Next (`npm start`) e **demo em HTML único** (`file://`, rotas por hash). Nos componentes use só `next/link`, `next/navigation`, `next/image` e `next/dynamic` (a demo troca por adaptadores em `scripts/demo/shims/`).
- **Gerar a demo**: `npm run demo` (= `next build` + `scripts/demo/build.mjs`) escreve `demonstração/Portal_do_Aluno.html`. Modo apresentação: Alt+Shift+D ou Perfil › Configurações.
- **Testar**: `npx tsc --noEmit -p .` e `npx eslint <arquivos>`. Valide o OpenAPI com `python -c "import yaml; yaml.safe_load(open('docs/api/openapi.yaml', encoding='utf-8'))"`. Para testes de interface, abra a demo (ou `npm start`) com Playwright e entre pelas contas de teste.
- Sem `NEXT_PUBLIC_API_URL` o app é 100% local (modo da demo); com ela, login e ações vão pela fila de `src/api/sync.ts` (veja `.env.example`).
