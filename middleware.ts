// MIDDLEWARE: REDIRECCIÓN POR ROL
// Ubicación: middleware.ts (en la raíz del proyecto)

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request as any });
  const { pathname } = request.nextUrl;

  // Si el usuario está autenticado
  if (token) {
    const userEmail = token.email as string;
    const isVendedora = userEmail === 'nadinlenceria@gmail.com';

    // Si vendedora intenta acceder a dashboard de revendedora
    if (isVendedora && pathname.startsWith('/dashboard') && !pathname.startsWith('/dashboard/admin')) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    // Si revendedora intenta acceder a dashboard de vendedora
    if (!isVendedora && pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
