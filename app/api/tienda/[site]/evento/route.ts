// Contador liviano de visitas y vistas de producto (para las estadísticas de la revendedora)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTiendaBySite } from '@/lib/tienda';

export const dynamic = 'force-dynamic';
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse/i;

export async function POST(req: Request, { params }: { params: { site: string } }) {
  try {
    if (BOT.test(req.headers.get('user-agent') || '')) return NextResponse.json({ ok: true });
    const tienda = await getTiendaBySite(params.site);
    if (!tienda || !tienda.activa || (tienda as any).modoEditor) return NextResponse.json({ ok: true });
    const b: any = await req.json().catch(() => ({}));
    const hoy = `(now() at time zone 'America/Argentina/Buenos_Aires')::date`;
    if (b.tipo === 'visita') {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "TiendaStatDia" ("id","tiendaId","fecha","visitas") VALUES (gen_random_uuid()::text, $1, ${hoy}, 1)
         ON CONFLICT ("tiendaId","fecha") DO UPDATE SET "visitas" = "TiendaStatDia"."visitas" + 1`, tienda.id);
    } else if (b.tipo === 'producto' && typeof b.productId === 'string' && /^[\w-]{1,40}$/.test(b.productId)) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "TiendaStatDia" ("id","tiendaId","fecha","vistasProducto") VALUES (gen_random_uuid()::text, $1, ${hoy}, 1)
         ON CONFLICT ("tiendaId","fecha") DO UPDATE SET "vistasProducto" = "TiendaStatDia"."vistasProducto" + 1`, tienda.id);
      await prisma.$executeRawUnsafe(
        `INSERT INTO "TiendaStatProducto" ("id","tiendaId","productId","fecha","vistas") VALUES (gen_random_uuid()::text, $1, $2, ${hoy}, 1)
         ON CONFLICT ("tiendaId","productId","fecha") DO UPDATE SET "vistas" = "TiendaStatProducto"."vistas" + 1`, tienda.id, b.productId);
    } else if (b.tipo === 'carrito') {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "TiendaStatDia" ("id","tiendaId","fecha","carritos") VALUES (gen_random_uuid()::text, $1, ${hoy}, 1)
         ON CONFLICT ("tiendaId","fecha") DO UPDATE SET "carritos" = "TiendaStatDia"."carritos" + 1`, tienda.id);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('evento tienda', e);
    return NextResponse.json({ ok: true });
  }
}
