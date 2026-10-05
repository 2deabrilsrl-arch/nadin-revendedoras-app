// lib/dominios.ts
// Dominio propio de cada tienda: alta automática en Vercel, chequeo de DNS y activación.
//
// Variables de entorno:
//   VERCEL_API_TOKEN  (obligatoria) token de Vercel con acceso al equipo
//   VERCEL_PROJECT_ID (opcional)    por defecto el proyecto de la app
//   VERCEL_TEAM_ID    (opcional)    por defecto el equipo de Nadin

import { prisma } from '@/lib/prisma';
import { enviarNotificacionGeneral } from '@/lib/notifications';

const PROJECT = () => process.env.VERCEL_PROJECT_ID || 'prj_XT1IVljOTOTgJDvZeM4CTO73JKR2';
const TEAM = () => process.env.VERCEL_TEAM_ID || 'team_oHffCKUKVPtwN3me2fExWpvw';

export const IP_VERCEL = '76.76.21.21';
export const CNAME_VERCEL = 'cname.vercel-dns.com';

// Terminaciones de dos partes más comunes (para saber cuál es el dominio "raíz")
const SUFIJOS_DOBLES = new Set([
  'com.ar', 'net.ar', 'org.ar', 'tur.ar', 'gob.ar', 'edu.ar', 'int.ar', 'mil.ar', 'musica.ar', 'coop.ar', 'mutual.ar', 'senasa.ar',
  'com.uy', 'com.py', 'com.bo', 'com.br', 'com.mx', 'com.co', 'com.pe', 'com.ve', 'com.ec', 'cl.ar', 'co.uk', 'com.es',
]);

export function dominioConfigurado() {
  return !!process.env.VERCEL_API_TOKEN;
}

/** Limpia lo que escribió la revendedora: saca https://, barras, espacios y mayúsculas. */
export function normalizarDominio(input: string): string {
  let d = String(input || '').trim().toLowerCase();
  d = d.replace(/^[a-z]+:\/\//, '').split('/')[0].split('?')[0].split('#')[0].split(':')[0];
  return d.replace(/\.$/, '');
}

export function validarDominio(d: string): string | null {
  if (!d) return 'Escribí tu dominio, por ejemplo: www.lenceriamaria.com.ar';
  if (d.length > 253 || !/^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(d)) return 'Ese dominio no es válido. Ejemplo: www.lenceriamaria.com.ar';
  const prohibidos = ['vercel.app', 'nadinlenceria.com', 'tiendanube.com', 'mitiendanube.com'];
  const root = (process.env.TIENDAS_ROOT_DOMAIN || '').toLowerCase();
  if (root) prohibidos.push(root);
  if (prohibidos.some((p) => d === p || d.endsWith(`.${p}`))) return 'Ese dominio no se puede usar. Tiene que ser un dominio que hayas comprado vos.';
  return null;
}

/** Dominio raíz: lenceriamaria.com.ar (sin www ni subdominios). */
export function dominioRaiz(d: string): string {
  const p = d.split('.');
  const ult2 = p.slice(-2).join('.');
  return SUFIJOS_DOBLES.has(ult2) ? p.slice(-3).join('.') : ult2;
}

/**
 * Qué dominios se dan de alta:
 * - Si escribe el raíz o el www → principal = www.raiz, y el raíz redirige al www.
 * - Si escribe un subdominio (tienda.marca.com) → solo ese.
 */
export function planDominio(d: string): { principal: string; redirige: string | null } {
  const raiz = dominioRaiz(d);
  if (d === raiz || d === `www.${raiz}`) return { principal: `www.${raiz}`, redirige: raiz };
  return { principal: d, redirige: null };
}

async function vercel(path: string, init: RequestInit = {}) {
  const sep = path.includes('?') ? '&' : '?';
  const r = await fetch(`https://api.vercel.com${path}${sep}teamId=${TEAM()}`, <any>{
    ...init,
    headers: { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
    cache: 'no-store',
  });
  const data: any = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

async function agregarEnVercel(name: string, redirect?: string) {
  const r = await vercel(`/v10/projects/${PROJECT()}/domains`, {
    method: 'POST',
    body: JSON.stringify(redirect ? { name, redirect, redirectStatusCode: 308 } : { name }),
  });
  if (r.ok) return null;
  const code = r.data?.error?.code;
  if (code === 'domain_already_in_use' || code === 'domain_already_exists') {
    // Ya está en este proyecto: está bien. Si está en otro proyecto/cuenta, avisamos.
    const ya = await vercel(`/v9/projects/${PROJECT()}/domains/${name}`);
    if (ya.ok) return null;
    return 'Ese dominio ya está conectado a otro sitio. Desconectalo de donde esté (por ejemplo Tiendanube) y probá de nuevo.';
  }
  if (code === 'forbidden' || r.status === 401 || r.status === 403) return 'Falta configurar el permiso de Vercel. Avisale a Nadin.';
  return r.data?.error?.message || 'No se pudo agregar el dominio. Probá de nuevo en unos minutos.';
}

async function quitarDeVercel(name: string) {
  await vercel(`/v9/projects/${PROJECT()}/domains/${name}`, { method: 'DELETE' }).catch(() => null);
}

export interface RegistroDns {
  tipo: 'A' | 'CNAME' | 'TXT';
  nombre: string; // lo que va en "Nombre / Host"
  valor: string;
  ok: boolean;
}

export interface EstadoDominio {
  dominio: string;
  activo: boolean;
  registros: RegistroDns[];
  mensaje: string;
}

/** Nombre del registro tal como se carga en el panel del dominio (@ para el raíz). */
function host(name: string, raiz: string) {
  if (name === raiz) return '@';
  return name.slice(0, -(raiz.length + 1));
}

async function chequearUno(name: string, raiz: string): Promise<{ ok: boolean; verificado: boolean; registros: RegistroDns[] }> {
  const [info, cfg] = await Promise.all([
    vercel(`/v9/projects/${PROJECT()}/domains/${name}`),
    vercel(`/v6/domains/${name}/config`),
  ]);
  let verificado = !!info.data?.verified;
  if (info.ok && !verificado) {
    const v = await vercel(`/v9/projects/${PROJECT()}/domains/${name}/verify`, { method: 'POST' });
    verificado = !!v.data?.verified;
  }
  const apunta = cfg.ok && cfg.data?.misconfigured === false;
  const registros: RegistroDns[] = [];
  if (name === raiz) registros.push({ tipo: 'A', nombre: '@', valor: IP_VERCEL, ok: apunta });
  else registros.push({ tipo: 'CNAME', nombre: host(name, raiz), valor: CNAME_VERCEL, ok: apunta });
  if (!verificado) {
    for (const v of (info.data?.verification || []) as any[]) {
      if (v.type === 'TXT') registros.push({ tipo: 'TXT', nombre: host(v.domain, raiz) || '@', valor: v.value, ok: false });
    }
  }
  return { ok: apunta && verificado, verificado, registros };
}

/** Revisa cómo está el dominio y, si ya apunta bien, lo activa en la tienda. */
export async function revisarDominioTienda(tiendaId: string): Promise<EstadoDominio | null> {
  const t = await prisma.tienda.findUnique({ where: { id: tiendaId }, select: { id: true, userId: true, nombre: true, dominioPropio: true, dominioPendiente: true } });
  if (!t) return null;
  const dominio = t.dominioPendiente || t.dominioPropio;
  if (!dominio) return null;
  if (!dominioConfigurado()) return { dominio, activo: !!t.dominioPropio && !t.dominioPendiente, registros: [], mensaje: 'Falta configurar el permiso de Vercel.' };

  const { principal, redirige } = planDominio(dominio);
  const raiz = dominioRaiz(principal);
  const a = await chequearUno(principal, raiz);
  const b = redirige ? await chequearUno(redirige, raiz) : null;
  const registros = [...(b?.registros || []), ...a.registros];
  const activo = a.ok; // el principal es el que importa; el raíz solo redirige

  if (activo && t.dominioPendiente) {
    await prisma.tienda.update({ where: { id: t.id }, data: { dominioPropio: principal, dominioPendiente: null } });
    await enviarNotificacionGeneral({
      userId: t.userId,
      tipo: 'tienda_dominio_activo',
      titulo: '🌐 Tu dominio ya funciona',
      mensaje: `Tu tienda ya se ve en https://${principal}`,
    }).catch(() => {});
  }
  return {
    dominio: principal,
    activo,
    registros,
    mensaje: activo
      ? (b && !b.ok ? `¡Listo! Tu tienda ya se ve en ${principal}. Falta que ${redirige} apunte bien (opcional).` : `¡Listo! Tu tienda ya se ve en ${principal}.`)
      : 'Todavía no apunta bien. Cargá los datos de abajo donde compraste el dominio. Los cambios pueden tardar desde unos minutos hasta 24 horas.',
  };
}

/** Conecta un dominio nuevo a la tienda (queda pendiente hasta que apunte bien). */
export async function conectarDominio(tiendaId: string, input: string): Promise<{ error?: string; estado?: EstadoDominio | null }> {
  if (!dominioConfigurado()) return { error: 'El dominio propio todavía no está habilitado. Avisale a Nadin.' };
  const d = normalizarDominio(input);
  const err = validarDominio(d);
  if (err) return { error: err };
  const { principal, redirige } = planDominio(d);

  const t = await prisma.tienda.findUnique({ where: { id: tiendaId }, select: { dominioPropio: true, dominioPendiente: true } });
  if (!t) return { error: 'Tienda no encontrada' };
  const otros = [principal, redirige].filter(Boolean) as string[];
  const usado = await prisma.tienda.findFirst({
    where: { id: { not: tiendaId }, OR: [{ dominioPropio: { in: otros } }, { dominioPendiente: { in: otros } }] },
    select: { id: true },
  });
  if (usado) return { error: 'Ese dominio ya lo está usando otra tienda.' };

  const anterior = t.dominioPendiente || t.dominioPropio;
  const e1 = await agregarEnVercel(principal);
  if (e1) return { error: e1 };
  if (redirige) {
    const e2 = await agregarEnVercel(redirige, principal);
    if (e2) console.warn('Dominio raíz no agregado', redirige, e2);
  }
  // Si tenía otro dominio, recién ahora lo saca de Vercel
  if (anterior && anterior !== principal) await quitarDominioVercel(anterior);
  await prisma.tienda.update({ where: { id: tiendaId }, data: { dominioPendiente: principal, dominioPropio: anterior === principal ? t.dominioPropio : null } });
  return { estado: await revisarDominioTienda(tiendaId) };
}

async function quitarDominioVercel(dominio: string) {
  const { principal, redirige } = planDominio(dominio);
  if (redirige) await quitarDeVercel(redirige);
  await quitarDeVercel(principal);
}

export async function desconectarDominio(tiendaId: string) {
  const t = await prisma.tienda.findUnique({ where: { id: tiendaId }, select: { dominioPropio: true, dominioPendiente: true } });
  if (!t) return;
  for (const d of [t.dominioPendiente, t.dominioPropio]) if (d && dominioConfigurado()) await quitarDominioVercel(d);
  await prisma.tienda.update({ where: { id: tiendaId }, data: { dominioPropio: null, dominioPendiente: null } });
}

/** Para el cron: revisa los dominios pendientes y activa los que ya apuntan bien. */
export async function revisarDominiosPendientes(max = 20) {
  if (!dominioConfigurado()) return 0;
  const pend = await prisma.tienda.findMany({ where: { dominioPendiente: { not: null } }, select: { id: true }, take: max });
  let activados = 0;
  for (const p of pend) {
    const e = await revisarDominioTienda(p.id).catch(() => null);
    if (e?.activo) activados++;
  }
  return activados;
}
