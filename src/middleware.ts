import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // Extrai todos os cookies da requisição
  const cookies = req.cookies.getAll();
  
  // Verifica se existe algum cookie de sessão válido gerado pelo Supabase Auth
  const isAuth = cookies.some(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));

  // Se o usuário tentar acessar qualquer rota dentro de /admin E não estiver logado
  if (req.nextUrl.pathname.startsWith('/admin') && !isAuth) {
    // Redireciona para a tela de login
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Se estiver logado ou acessando uma rota pública (como a home), deixa passar
  return NextResponse.next();
}

// Configuração de onde o Middleware deve agir
export const config = {
  matcher: ['/admin/:path*'],
};