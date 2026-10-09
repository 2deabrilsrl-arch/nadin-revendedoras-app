// GET: datos de mi tienda (la crea en borrador la primera vez) · PUT: guardar diseño y datos
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserAndTienda, noAuth, bad, s, sOrNull, num, bool, RESERVED_SLUGS } from '@/lib/mi-tienda';
import { slugify, getTiendaBaseUrl, PREVIEW_COOKIE } from '@/lib/tienda';
import { normalizarDiseno } from '@/lib/tienda-diseno';

export const dynamic = 'force-dynamic';
const MARGEN_MINIMO = Number(process.env.TIENDA_MARGEN_MINIMO || 0);
const HEX = /^#[0-9a-f]{6}$/i;

export async function GET() {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const { tienda, user } = ctx;
  const inicioMes = new Date(); inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0);
  const hace7 = new Date(Date.now() - 7 * 864e5);
  const [cobros, entregas, destacados, propios, pendientes, ventasMes, visitas7] = await Promise.all([
    prisma.tiendaMetodoPago.count({ where: { tiendaId: tienda.id, activo: true } }),
    prisma.tiendaEnvio.count({ where: { tiendaId: tienda.id, activo: true } }),
    prisma.tiendaProducto.count({ where: { tiendaId: tienda.id, destacado: true } }),
    prisma.tiendaProductoPropio.count({ where: { tiendaId: tienda.id } }),
    prisma.ordenTienda.count({ where: { tiendaId: tienda.id, estado: { in: ['pendiente_pago', 'pagada'] } } }),
    prisma.ordenTienda.aggregate({ where: { tiendaId: tienda.id, pagadaAt: { gte: inicioMes }, estado: { not: 'cancelada' } }, _sum: { total: true }, _count: true }),
    prisma.tiendaStatDia.aggregate({ where: { tiendaId: tienda.id, fecha: { gte: hace7 } }, _sum: { visitas: true } }),
  ]);
  return NextResponse.json({
    // Lista "Empezá acá" y resumen de la pantalla de Inicio
    progreso: {
      marca: !!(tienda.nombre && tienda.logoUrl && tienda.whatsapp),
      diseno: tienda.diseno != null,
      productos: destacados + propios > 0,
      cobros: cobros > 0,
      entregas: entregas > 0,
      publicada: !!tienda.activa,
    },
    resumen: {
      pendientes,
      ventasMes: ventasMes._sum.total || 0,
      pedidosMes: ventasMes._count || 0,
      visitas7: visitas7._sum.visitas || 0,
    },
    tienda: { ...tienda, diseno: normalizarDiseno(tienda.diseno), disenoBorrador: borradorLimpio(tienda.disenoBorrador) },
    url: getTiendaBaseUrl(tienda),
    urlApp: `/t/${tienda.slug}`,
    margenUsuaria: user.margen,
    margenMinimo: MARGEN_MINIMO,
  });
}

/** Borrador del editor: diseño + colores + letra, siempre validado */
function borradorLimpio(raw: any) {
  if (!raw || typeof raw !== 'object') return null;
  return {
    diseno: normalizarDiseno(raw.diseno),
    colorPrimario: typeof raw.colorPrimario === 'string' && HEX.test(raw.colorPrimario) ? raw.colorPrimario : null,
    colorSecundario: typeof raw.colorSecundario === 'string' && HEX.test(raw.colorSecundario) ? raw.colorSecundario : null,
    fuente: ['moderna', 'elegante', 'clasica'].includes(raw.fuente) ? raw.fuente : null,
  };
}

function conCookiePreview(res: NextResponse, tiendaId: string | null) {
  if (tiendaId) res.cookies.set(PREVIEW_COOKIE, tiendaId, { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: 60 * 60 * 6 });
  else res.cookies.set(PREVIEW_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}

export async function PUT(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const { tienda } = ctx;
  const b: any = await req.json().catch(() => ({}));

  // Editor de diseño: guardar borrador / publicar / descartar
  if (b.accion === 'borrador') {
    const borrador = borradorLimpio(b.borrador);
    if (!borrador) return bad('Borrador inválido.');
    await prisma.tienda.update({ where: { id: tienda.id }, data: { disenoBorrador: borrador as any } });
    return conCookiePreview(NextResponse.json({ ok: true, borrador }), tienda.id);
  }
  if (b.accion === 'publicar') {
    const borrador = borradorLimpio(b.borrador ?? tienda.disenoBorrador);
    if (!borrador) return bad('No hay cambios para publicar.');
    const updated = await prisma.tienda.update({
      where: { id: tienda.id },
      data: {
        diseno: borrador.diseno as any,
        ...(borrador.colorPrimario ? { colorPrimario: borrador.colorPrimario } : {}),
        ...(borrador.colorSecundario ? { colorSecundario: borrador.colorSecundario } : {}),
        ...(borrador.fuente ? { fuente: borrador.fuente } : {}),
        disenoBorrador: null as any,
      },
    });
    return NextResponse.json({ tienda: { ...updated, diseno: normalizarDiseno(updated.diseno), disenoBorrador: null }, url: getTiendaBaseUrl(updated) });
  }
  if (b.accion === 'descartar') {
    await prisma.tienda.update({ where: { id: tienda.id }, data: { disenoBorrador: null as any } });
    return conCookiePreview(NextResponse.json({ ok: true }), null);
  }

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
    // Acepta la etiqueta <meta ...> completa o solo el código
    googleVerificacion:
      b.googleVerificacion === undefined
        ? undefined
        : (String(b.googleVerificacion || '').match(/content=["']?([A-Za-z0-9_-]{10,100})/)?.[1] ||
            (/^[A-Za-z0-9_-]{10,100}$/.test(String(b.googleVerificacion || '').trim()) ? String(b.googleVerificacion).trim() : null)),
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

  if (b.diseno !== undefined) data.diseno = normalizarDiseno(b.diseno);

  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
  const updated = await prisma.tienda.update({ where: { id: tienda.id }, data });
  return NextResponse.json({ tienda: { ...updated, diseno: normalizarDiseno(updated.diseno), disenoBorrador: borradorLimpio(updated.disenoBorrador) }, url: getTiendaBaseUrl(updated) });
}
