// MIDDLEWARE
// 1) Tiendas Nadin: si el pedido llega por un subdominio de tiendas
//    ({slug}.TIENDAS_ROOT_DOMAIN) o por un dominio propio de una revendedora,
//    se reescribe internamente a /t/{site}/... (la URL del navegador no cambia).
// 2) Seguridad de la API: toda /api/* pide sesión (cookie httpOnly firmada), salvo las rutas públicas.
//    /api/admin/* y las acciones de Nadin piden rol vendedora. Una revendedora solo ve sus datos.
// 3) Páginas /dashboard y /admin: sin sesión → /login; /admin solo para Nadin.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verificarSesionEdge, SESSION_COOKIE } from '@/lib/session-edge';
import { H_UID, H_ROL } from '@/lib/auth-api';

// App de revendedoras: el inicio es Mi Tienda y estas secciones viejas ya no se muestran
// (los datos se conservan; para volver a mostrarlas, sacarlas de esta lista y del menú).
const RUTAS_OCULTAS = ['/dashboard/logros', '/dashboard/ranking', '/dashboard/best-sellers', '/dashboard/analytics', '/dashboard/catalogos-digitales', '/dashboard/historial'];

// APIs que no piden sesión (tienda pública, login, puente, crons, links de armado, webhooks)
const API_PUBLICAS = [
  '/api/auth/', '/api/tienda/', '/api/webhooks/', '/api/dragonfish/', '/api/cron/',
  '/api/armar/', '/api/armar-consolidacion/', '/api/profile/public/', '/api/productos/buscar',
  '/api/mi-tienda/mercadopago/callback',
];
// APIs solo para Nadin (rol vendedora)
const API_SOLO_NADIN: RegExp[] = [
  /^\/api\/admin(\/|$)/,
  /^\/api\/notificaciones\/(admin|vendedora)(\/|$)/,
  /^\/api\/consolidaciones\/[^/]+\/(estado|access-token|armado-iniciado)(\/|$)/,
];

const jsonError = (status: number, error: string, code?: string) =>
  NextResponse.json(code ? { error, code } : { error }, { status });

async function protegerApi(request: NextRequest): Promise<NextResponse> {
  const { pathname, searchParams } = request.nextUrl;
  // Nunca confiar en estos encabezados si vienen del navegador
  const headers = new Headers(request.headers);
  headers.delete(H_UID);
  headers.delete(H_ROL);

  const sesion = await verificarSesionEdge(request.cookies.get(SESSION_COOKIE)?.value);
  if (API_PUBLICAS.some((p) => pathname === p.replace(/\/$/, '') || pathname.startsWith(p))) {
    if (sesion) { headers.set(H_UID, sesion.uid); headers.set(H_ROL, sesion.rol); }
    return NextResponse.next({ request: { headers } });
  }
  if (!sesion) return jsonError(401, 'Tenés que iniciar sesión de nuevo.', 'NO_SESSION');
  const esNadin = sesion.rol === 'vendedora';
  if (!esNadin) {
    if (API_SOLO_NADIN.some((r) => r.test(pathname))) return jsonError(403, 'No tenés permiso para esto.');
    // Una revendedora solo puede pedir sus propios datos
    const uidPedido = searchParams.get('userId') || pathname.match(/^\/api\/notificaciones\/revendedora\/([^/]+)/)?.[1];
    if (uidPedido && decodeURIComponent(uidPedido) !== sesion.uid) return jsonError(403, 'No tenés permiso para esto.');
  }
  headers.set(H_UID, sesion.uid);
  headers.set(H_ROL, sesion.rol);
  return NextResponse.next({ request: { headers } });
}

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
    // Las APIs pasan por el mismo control aunque se entre por el dominio de una tienda
    if (pathname.startsWith('/api/')) return protegerApi(request);
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

  // ---------- API ----------
  if (pathname.startsWith('/api/')) return protegerApi(request);

  // ---------- Páginas de la app: hace falta sesión ----------
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    const sesion = await verificarSesionEdge(request.cookies.get(SESSION_COOKIE)?.value);
    if (!sesion) return NextResponse.redirect(new URL('/login', request.url));
    const esNadin = sesion.rol === 'vendedora';
    if (esNadin && pathname.startsWith('/dashboard') && !pathname.startsWith('/dashboard/admin')) return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    if (!esNadin && pathname.startsWith('/admin')) return NextResponse.redirect(new URL('/dashboard/mi-tienda', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
