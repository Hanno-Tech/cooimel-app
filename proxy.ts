import { NextResponse, type NextRequest } from "next/server";

// Checagem otimista: sem cookie de sessão → login. A validação real
// (sessão no banco, papel) acontece nas páginas e Server Actions.
export function proxy(request: NextRequest) {
  if (!request.cookies.has("cooimel_sessao")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/inicio/:path*",
    "/pagamentos/:path*",
    "/boletos/:path*",
    "/historico/:path*",
    "/cotacao/:path*",
    "/avisos/:path*",
    "/cadastro/:path*",
    "/configuracoes/:path*",
    "/trocar-senha",
  ],
};
