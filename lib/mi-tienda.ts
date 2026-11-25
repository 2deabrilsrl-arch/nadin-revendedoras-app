// lib/mi-tienda.ts — helpers del panel "Mi Tienda" (APIs con sesión)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { slugify } from '@/lib/tienda';
import { DISENO_DEFAULT, PREARMADAS, normalizarDiseno } from '@/lib/tienda-diseno';

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
  let tienda = await ensureTienda(user);
  // Tiendas en borrador que todavía no se armaron de entrada (incluye las viejas): se arman una sola vez
  if (!tienda.activa && !tienda.armadaInicialAt) tienda = await armarTiendaInicial(tienda.id).catch(() => tienda);
  return { user, tienda };
}

async function ensureTienda(user: SessionUser) {
  const existing = await prisma.tienda.findUnique({ where: { userId: user.id } });
  if (existing) return existing;
  // (la tienda nueva se arma de entrada en getUserAndTienda)
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

const PLANTILLA_INICIAL = 'rosa';
const DESTACADOS_INICIALES = 8;

/**
 * Deja la tienda "armada de entrada" para que solo falte activar un cobro y publicar:
 * - diseño: la plantilla prearmada "Rosa boutique" (si todavía no eligió ninguno)
 * - destacados: los más vendidos de Nadin (si todavía no destacó nada ni cargó productos propios)
 * La entrega "Retiro / entrega a coordinar" ya viene creada con la tienda.
 * Se hace una sola vez (armadaInicialAt): si después saca algo, no se lo volvemos a poner.
 */
export async function armarTiendaInicial(tiendaId: string) {
  const t = await prisma.tienda.findUnique({ where: { id: tiendaId } });
  if (!t) throw new Error('Tienda no encontrada');
  if (t.armadaInicialAt) return t;
  const data: Record<string, any> = { armadaInicialAt: new Date() };

  if (t.diseno == null) {
    const p = PREARMADAS.find((x) => x.id === PLANTILLA_INICIAL) || PREARMADAS[0];
    data.diseno = normalizarDiseno({
      ...DISENO_DEFAULT,
      plantilla: p.plantilla,
      header: p.header,
      listado: { ...DISENO_DEFAULT.listado, ...(p.listado || {}) },
      anuncio: { ...DISENO_DEFAULT.anuncio, activo: true, mensajes: p.anuncio, texto: p.anuncio[0] || '', desliza: p.anuncio.length > 1 },
      secciones: p.secciones(),
    }) as any;
    data.colorPrimario = p.colorPrimario;
    data.colorSecundario = p.colorSecundario;
    data.fuente = p.fuente;
  }

  const [destacados, propios] = await Promise.all([
    prisma.tiendaProducto.count({ where: { tiendaId, destacado: true } }),
    prisma.tiendaProductoPropio.count({ where: { tiendaId } }),
  ]);
  if (destacados + propios === 0) {
    const top = await prisma.catalogoCache.findMany({
      where: { bestSellerRank: { not: null } },
      orderBy: { bestSellerRank: 'asc' },
      take: DESTACADOS_INICIALES * 3,
      select: { productId: true, data: true },
    });
    // Solo productos que se pueden vender (con alguna variante con stock)
    const conStock = top.filter((p) => {
      try {
        const d = JSON.parse(p.data);
        const vs = Array.isArray(d?.variants) ? d.variants : [];
        return vs.some((v: any) => Number(v?.stock) > 0);
      } catch { return true; }
    }).slice(0, DESTACADOS_INICIALES);
    for (const p of conStock) {
      await prisma.tiendaProducto.upsert({
        where: { tiendaId_productId: { tiendaId, productId: p.productId } },
        create: { tiendaId, productId: p.productId, destacado: true },
        update: { destacado: true },
      });
    }
  }
  return prisma.tienda.update({ where: { id: tiendaId }, data });
}

/** Lista "Empezá acá": qué pasos tiene hechos la tienda (ver lib/pasos-tienda.ts). */
export async function progresoTienda(tienda: { id: string; nombre: string; logoUrl: string | null; whatsapp: string | null; diseno: unknown; activa: boolean }) {
  const [cobros, entregas, destacados, propios] = await Promise.all([
    prisma.tiendaMetodoPago.count({ where: { tiendaId: tienda.id, activo: true } }),
    prisma.tiendaEnvio.count({ where: { tiendaId: tienda.id, activo: true } }),
    prisma.tiendaProducto.count({ where: { tiendaId: tienda.id, destacado: true } }),
    prisma.tiendaProductoPropio.count({ where: { tiendaId: tienda.id } }),
  ]);
  return {
    marca: !!(tienda.nombre && tienda.logoUrl && tienda.whatsapp),
    diseno: tienda.diseno != null,
    productos: destacados + propios > 0,
    cobros: cobros > 0,
    entregas: entregas > 0,
    publicada: !!tienda.activa,
  };
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
