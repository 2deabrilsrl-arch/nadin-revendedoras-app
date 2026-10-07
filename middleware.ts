// MIDDLEWARE
// 1) Tiendas Nadin: si el pedido llega por un subdominio de tiendas
//    ({slug}.TIENDAS_ROOT_DOMAIN) o por un dominio propio de una revendedora,
//    se reescribe internamente a /t/{site}/... (la URL del navegador no cambia).
// 2) Redirección por rol (lógica previa, sin cambios).

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// App de revendedoras: el inicio es Mi Tienda y estas secciones viejas ya no se muestran
// (los datos se conservan; para volver a mostrarlas, sacarlas de esta lista y del menú).
const RUTAS_OCULTAS = ['/dashboard/logros', '/dashboard/ranking', '/dashboard/best-sellers', '/dashboard/analytics', '/dashboard/catalogos-digitales', '/dashboard/historial'];

const RESERVED_SUBDOMAINS = new Set(['www', 'app', 'api', 'admin', 'mail', 'tiendas']);

function appHosts(): string[] {
  const fromEnv = (process.env.APP_HOSTS || '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return ['localhost', '127.0.0.1', 'nadin-revendedoras-app.vercel.app', ...fromEnv];
}

/** Devuelve el "site" de la tienda para este host, o null si es la app normal. */
function resolveTiendaSite(hostHeader: string | null): string | null {
  if (!hostHeader) return null;
  const host = hostHeader.split(':')[0].toLowerCase();

  if (appHosts().includes(host)) return null;
  if (host.endsWith('.vercel.app')) return null; // previews de Vercel = app normal

  const root = (process.env.TIENDAS_ROOT_DOMAIN || '').toLowerCase();
  if (root) {
    if (host === root || host === `www.${root}`) return null; // landing de tiendas (futuro)
    if (host.endsWith(`.${root}`)) {
      const sub = host.slice(0, -(root.length + 1));
      if (!sub || sub.includes('.') || RESERVED_SUBDOMAINS.has(sub)) return null;
      return sub;
    }
  }

  // Cualquier otro host que apunte a este proyecto = dominio propio de una tienda
  return host;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ---------- Tiendas Nadin ----------
  const site = resolveTiendaSite(request.headers.get('host'));
  if (site) {
    const isSeoFile = pathname === '/sitemap.xml' || pathname === '/robots.txt';
    const isPassThrough =
      pathname.startsWith('/api/') ||
      pathname.startsWith('/_next/') ||
      (!isSeoFile && /\.[a-zA-Z0-9]+$/.test(pathname)); // archivos estáticos de /public

    if (!isPassThrough) {
      const url = request.nextUrl.clone();
      url.pathname = `/t/${encodeURIComponent(site)}${pathname === '/' ? '' : pathname}`;
      // Avisamos a las páginas que vienen por dominio de tienda (los links no llevan /t/{site})
      const headers = new Headers(request.headers);
      headers.set('x-tienda-rewrite', '1');
      return NextResponse.rewrite(url, { request: { headers } });
    }
    return NextResponse.next();
  }

  // ---------- App de revendedoras ----------
  if (pathname === '/dashboard' || pathname === '/dashboard/' || RUTAS_OCULTAS.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
    return NextResponse.redirect(new URL('/dashboard/mi-tienda', request.url));
  }

  // ---------- Roles (lógica previa) ----------
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    const token = await getToken({ req: request as any });
    if (token) {
      const userEmail = token.email as string;
      const isVendedora = userEmail === 'nadinlenceria@gmail.com';

      if (isVendedora && pathname.startsWith('/dashboard') && !pathname.startsWith('/dashboard/admin')) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      if (!isVendedora && pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
