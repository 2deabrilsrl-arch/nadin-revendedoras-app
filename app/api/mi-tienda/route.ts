// GET: datos de mi tienda (la crea en borrador la primera vez) · PUT: guardar diseño y datos
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserAndTienda, noAuth, bad, s, sOrNull, num, bool, RESERVED_SLUGS } from '@/lib/mi-tienda';
import { slugify, getTiendaBaseUrl } from '@/lib/tienda';

export const dynamic = 'force-dynamic';
const MARGEN_MINIMO = Number(process.env.TIENDA_MARGEN_MINIMO || 0);
const HEX = /^#[0-9a-f]{6}$/i;

export async function GET() {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const { tienda, user } = ctx;
  return NextResponse.json({
    tienda,
    url: getTiendaBaseUrl(tienda),
    urlApp: `/t/${tienda.slug}`,
    margenUsuaria: user.margen,
    margenMinimo: MARGEN_MINIMO,
  });
}

export async function PUT(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const { tienda } = ctx;
  const b: any = await req.json().catch(() => ({}));

  const data: Record<string, any> = {
    nombre: s(b.nombre, 40),
    eslogan: sOrNull(b.eslogan, 120),
    descripcion: sOrNull(b.descripcion, 2000),
    logoUrl: sOrNull(b.logoUrl, 500),
    bannerUrl: sOrNull(b.bannerUrl, 500),
    fuente: ['moderna', 'elegante', 'clasica'].includes(b.fuente) ? b.fuente : undefined,
    colorPrimario: typeof b.colorPrimario === 'string' && HEX.test(b.colorPrimario) ? b.colorPrimario : undefined,
    colorSecundario: typeof b.colorSecundario === 'string' && HEX.test(b.colorSecundario) ? b.colorSecundario : undefined,
    ciudad: sOrNull(b.ciudad, 60),
    provincia: sOrNull(b.provincia, 60),
    whatsapp: sOrNull(b.whatsapp, 25),
    instagram: sOrNull(b.instagram, 60),
    facebook: sOrNull(b.facebook, 80),
    tiktok: sOrNull(b.tiktok, 60),
    email: sOrNull(b.email, 120),
    seoTitulo: sOrNull(b.seoTitulo, 70),
    seoDescripcion: sOrNull(b.seoDescripcion, 160),
    mostrarNadin: bool(b.mostrarNadin),
    envioAutoNadin: bool(b.envioAutoNadin),
    activa: bool(b.activa),
    metaPixelId: sOrNull(b.metaPixelId, 20),
    ga4Id: sOrNull(b.ga4Id, 20),
  };

  for (const k of ['logoUrl', 'bannerUrl']) {
    if (data[k] && !/^https:\/\//i.test(data[k])) return bad('Las imágenes tienen que ser links https.');
  }
  if (data.nombre !== undefined && data.nombre.length < 2) return bad('El nombre de la tienda es obligatorio.');

  if (b.margen !== undefined) {
    const m = num(b.margen, 0, 500);
    if (m !== null && m !== undefined && m < MARGEN_MINIMO) return bad(`El margen mínimo es ${MARGEN_MINIMO}%.`);
    data.margen = m;
  }

  if (b.slug !== undefined) {
    const slug = slugify(String(b.slug)).slice(0, 30);
    if (slug.length < 3) return bad('La dirección de la tienda debe tener al menos 3 letras.');
    if (RESERVED_SLUGS.has(slug)) return bad('Esa dirección no está disponible.');
    if (slug !== tienda.slug) {
      const taken = await prisma.tienda.findUnique({ where: { slug } });
      if (taken) return bad('Esa dirección ya la usa otra tienda.');
      data.slug = slug;
    }
  }

  if (data.activa === true) {
    const pagos = await prisma.tiendaMetodoPago.count({ where: { tiendaId: tienda.id, activo: true } });
    if (!pagos) return bad('Para publicar la tienda activá al menos un medio de pago.');
  }

  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
  const updated = await prisma.tienda.update({ where: { id: tienda.id }, data });
  return NextResponse.json({ tienda: updated, url: getTiendaBaseUrl(updated) });
}
