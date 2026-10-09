import type { NextConfig } from "next";

/**
 * Cabeçalhos de segurança de todas as rotas. `script-src` fica livre de propósito: o tema (`lib/tema-script.ts`)
 * roda como script inline antes da pintura, e o Next injeta scripts inline de hidratação.
 */
const CABECALHOS_SEGURANCA = [
  // O navegador não "adivinha" o tipo do arquivo: um upload nunca vira script/HTML por sniffing.
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // O portal não roda dentro de iframe de outro site (clickjacking); `frame-ancestors` é o equivalente moderno.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
];

const nextConfig: NextConfig = {
  // Memoização automática de componentes: menos re-renderizações sem useMemo/useCallback manuais.
  reactCompiler: true,
  experimental: {
    // Versão nativa (Rust) do React Compiler dentro do Turbopack — build mais rápido, sem Babel.
    turbopackRustReactCompiler: true,
  },
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: CABECALHOS_SEGURANCA,
      },
      {
        // Arquivos estáticos da pasta public/ podem ficar em cache por 1 dia.
        source: "/:arquivo(cepi-logo.png|favicon.ico)",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
};

export default nextConfig;
