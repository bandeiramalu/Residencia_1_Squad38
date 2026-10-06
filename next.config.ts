import type { NextConfig } from "next";

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
        // Arquivos estáticos da pasta public/ podem ficar em cache por 1 dia.
        source: "/:arquivo(cepi-logo.png|favicon.ico)",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
};

export default nextConfig;
