// lib/mi-tienda.ts — helpers del panel "Mi Tienda" (APIs con sesión)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { slugify } from '@/lib/tienda';

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;

export const RESERVED_SLUGS = new Set(['www', 'app', 'api', 'admin', 'mail', 'tiendas', 'nadin', 'nadinlenceria', 'soporte', 'ayuda']);

export function noAuth() {
  return NextResponse.json({ error: 'Tu sesión venció. Cerrá sesión y volvé a ingresar.', code: 'NO_SESSION' }, { status: 401 });
}

export function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

/** Usuaria logueada + su tienda (la crea en borrador si no existe). */
export async function getUserAndTienda(): Promise<{ user: SessionUser; tienda: Awaited<ReturnType<typeof ensureTienda>> } | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const tienda = await ensureTienda(user);
  return { user, tienda };
}

async function ensureTienda(user: SessionUser) {
  const existing = await prisma.tienda.findUnique({ where: { userId: user.id } });
  if (existing) return existing;
  let base = slugify(user.handle || user.name || 'tienda').slice(0, 30) || 'tienda';
  if (RESERVED_SLUGS.has(base)) base = `${base}-tienda`;
  let slug = base;
  for (let i = 2; await prisma.tienda.findUnique({ where: { slug } }); i++) slug = `${base}-${i}`;
  return prisma.tienda.create({
    data: {
      userId: user.id,
      slug,
      nombre: (user.name || 'Mi tienda').slice(0, 40),
      whatsapp: user.telefono || null,
      metodosPago: {
        create: [{ tipo: 'transferencia', nombre: 'Transferencia bancaria', activo: false, orden: 1 }],
      },
      envios: {
        create: [{ tipo: 'retiro', nombre: 'Retiro / entrega a coordinar', precio: 0, pideDireccion: false, orden: 1 }],
      },
    },
  });
}

export const s = (v: any, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : undefined);
export const sOrNull = (v: any, max: number) => {
  if (v === null) return null;
  const r = s(v, max);
  return r === undefined ? undefined : r || null;
};
export const num = (v: any, min = 0, max = 1e9) => {
  if (v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : undefined;
};
export const bool = (v: any) => (typeof v === 'boolean' ? v : undefined);
