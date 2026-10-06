import { NextResponse, type NextRequest } from "next/server";

/**
 * Controle de acesso por papel, antes de a página renderizar (sem "piscar" a tela errada).
 *
 * Protótipo: o papel vem do cookie `cepi_papel`, gravado no login.
 * Produção: trocar pela validação do JWT (cookie httpOnly emitido pelo backend) — ver docs/BACKEND.md.
 */
const HOME = { aluno: "/feed", professor: "/professor" } as const;

/** Rotas compartilhadas pelos dois papéis. */
const COMPARTILHADAS = ["/estudos/salas", "/campeonatos", "/pessoas"];

function comeca(caminho: string, prefixo: string) {
  return caminho === prefixo || caminho.startsWith(`${prefixo}/`);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const valor = request.cookies.get("cepi_papel")?.value;
  const papel = valor === "aluno" || valor === "professor" ? valor : null;
  const ir = (destino: string) => NextResponse.redirect(new URL(destino, request.url));

  if (pathname === "/login") return papel ? ir(HOME[papel]) : NextResponse.next();
  if (!papel) {
    const login = new URL("/login", request.url);
    if (pathname !== "/") login.searchParams.set("voltar", pathname);
    return NextResponse.redirect(login);
  }
  if (pathname === "/") return ir(HOME[papel]);
  if (COMPARTILHADAS.some((r) => comeca(pathname, r))) return NextResponse.next();

  const areaProfessor = comeca(pathname, "/professor");
  if (papel === "aluno" && areaProfessor) return ir(HOME.aluno);
  if (papel === "professor" && !areaProfessor) return ir(HOME.professor);
  return NextResponse.next();
}

export const config = {
  // Ignora arquivos estáticos, imagens, ícones e rotas internas do Next.
  matcher: ["/((?!_next/static|_next/image|api|favicon.ico|icon.png|apple-icon.png|cepi-logo.png|.*\\.(?:png|jpg|svg|webp|avif|ico|txt|xml)$).*)"],
};
