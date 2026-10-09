// Gera demonstração/Portal_do_Aluno.html: o app inteiro (JS, CSS, fontes e imagens) num único arquivo.
// Uso: `npm run demo` (= `next build` + este script). O CSS vem de .next/static, gerado pelo build.
import * as esbuild from "esbuild";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(AQUI, "../..");
const SRC = path.join(REPO, "src");
const SAIDA_DIR = path.join(REPO, "demonstração");
const SAIDA = path.join(SAIDA_DIR, "Portal_do_Aluno.html");

const dataUri = (arquivo, tipo) => `data:${tipo};base64,${fs.readFileSync(arquivo).toString("base64")}`;

// ── CSS do build do Next (Tailwind já compilado), com as fontes embutidas ──
function lerCss() {
  const pasta = path.join(REPO, ".next/static");
  const arquivos = [];
  const andar = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) andar(p);
    else if (e.name.endsWith(".css")) arquivos.push(p);
  });
  andar(pasta);
  if (!arquivos.length) throw new Error("Nenhum CSS em .next/static — rode `npm run demo` (ou `npm run build` antes).");
  let css = arquivos.map((a) => fs.readFileSync(a, "utf8")).join("\n");
  // Só os subconjuntos latin e latin-ext (português); cirílico/vietnamita ficam de fora.
  css = css.replace(/@font-face\{[^}]*\}/g, (regra) => {
    const faixa = /unicode-range:([^;}]*)/.exec(regra)?.[1] ?? "";
    if (faixa && !/^U\+(\?\?|0-FF|100-)/.test(faixa)) return "";
    return regra.replace(/url\(\.\.\/media\/([^)]+)\)/g, (_, nome) => `url(${dataUri(path.join(pasta, "media", nome), "font/woff2")})`);
  });
  const restantes = css.match(/url\((?!data:)[^)]*\)/g);
  if (restantes) throw new Error(`URLs externas no CSS: ${restantes.join(", ")}`);
  const variaveis = [...css.matchAll(/\.([\w-]+__variable)\{--font-/g)].map((m) => m[1]);
  return { css, variaveis };
}

// ── Script do tema (roda no <head>, antes da primeira pintura) ──
async function scriptTema() {
  const r = await esbuild.build({
    stdin: { contents: `import { SCRIPT_TEMA } from ${JSON.stringify(path.join(SRC, "lib/tema-script.ts"))}; saida(SCRIPT_TEMA);`, resolveDir: AQUI, loader: "ts" },
    bundle: true, write: false, format: "iife", platform: "neutral",
  });
  let s = "";
  vm.runInNewContext(r.outputFiles[0].text, { saida: (x) => (s = x) });
  return s;
}

// ── Bundle do app ──
// Logo reduzido (aparece com 32–36 px) e embutido uma vez só, numa variável global.
function logo() {
  const original = path.join(REPO, "public/cepi-logo.png");
  const reduzido = path.join(os.tmpdir(), "cepi-logo-128.png");
  const r = spawnSync("python", ["-c", `from PIL import Image; im=Image.open(r"${original}"); im.thumbnail((128,128), Image.LANCZOS); im.save(r"${reduzido}", optimize=True)`]);
  return dataUri(r.status === 0 ? reduzido : original, "image/png");
}
const LOGO = logo();
const SHIMS = { "next/link": "link.tsx", "next/navigation": "navigation.ts", "next/image": "image.tsx", "next/dynamic": "dynamic.tsx" };

const pluginDemo = {
  name: "demo",
  setup(b) {
    b.onResolve({ filter: /^next\/(link|navigation|image|dynamic)$/ }, (a) => ({ path: path.join(AQUI, "shims", SHIMS[a.path]) }));
    b.onResolve({ filter: /^next(\/|$)/ }, (a) => ({ errors: [{ text: `Import do Next sem adaptador: ${a.path} (em ${a.importer})` }] }));
    b.onLoad({ filter: /\.(ts|tsx)$/ }, (a) => {
      if (!path.resolve(a.path).startsWith(path.resolve(SRC))) return undefined;
      let t = fs.readFileSync(a.path, "utf8");
      t = t.replaceAll('="/cepi-logo.png"', "={globalThis.__LOGO_CEPI}").replaceAll('"/cepi-logo.png"', "globalThis.__LOGO_CEPI");
      t = t.replaceAll("${location.origin}/feed#post-", '${location.href.split("#")[0]}#/feed#post-');
      return { contents: t, loader: a.path.endsWith("x") ? "tsx" : "ts" };
    });
  },
};

const r = await esbuild.build({
  entryPoints: [path.join(AQUI, "app.tsx")],
  bundle: true, write: false, minify: true, format: "iife", target: "es2020", jsx: "automatic",
  legalComments: "none", tsconfig: path.join(REPO, "tsconfig.json"),
  define: {
    "process.env.NODE_ENV": '"production"',
    "process.env.NEXT_PUBLIC_API_URL": "undefined",
    "process.env.NEXT_PUBLIC_WS_URL": "undefined",
  },
  plugins: [pluginDemo],
  logLevel: "warning",
});
const js = r.outputFiles[0].text.replaceAll("</script", "<\\/script");

const { css, variaveis } = lerCss();
const tema = await scriptTema();
const icone = dataUri(path.join(SRC, "app/icon.png"), "image/png");

const html = `<!doctype html>
<html lang="pt-BR" class="${variaveis.join(" ")} antialiased">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#ffffff">
<meta name="description" content="Portal do Aluno — Colégio CEPI Expansão. Versão de demonstração em arquivo único (funciona offline).">
<title>Portal do Aluno · CEPI</title>
<link rel="icon" href="${icone}">
<script>${tema};window.__LOGO_CEPI=${JSON.stringify(LOGO)}</script>
<style>${css}</style>
</head>
<body class="min-h-dvh">
<div id="app"></div>
<script>${js}</script>
</body>
</html>
`;
fs.mkdirSync(SAIDA_DIR, { recursive: true });
fs.writeFileSync(SAIDA, html);
console.log(`ok → ${SAIDA} (${(html.length / 1024 / 1024).toFixed(2)} MB; JS ${(js.length / 1024).toFixed(0)} KB, CSS ${(css.length / 1024).toFixed(0)} KB; fontes: ${variaveis.join(", ")})`);
