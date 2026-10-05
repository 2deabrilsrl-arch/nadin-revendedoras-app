// Páginas propias de la tienda (Cómo comprar, Cambios, Envíos…)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserAndTienda, noAuth, bad } from '@/lib/mi-tienda';
import { slugify } from '@/lib/tienda';
import { MODELOS_PAGINAS } from '@/lib/tienda-paginas';

export const dynamic = 'force-dynamic';
const txt = (v: any, max: number) => String(v ?? '').trim().slice(0, max);

export async function GET() {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const paginas = await prisma.tiendaPagina.findMany({ where: { tiendaId: ctx.tienda.id }, orderBy: [{ orden: 'asc' }, { createdAt: 'asc' }] });
  return NextResponse.json({ paginas, modelos: MODELOS_PAGINAS.map(({ slug, titulo }) => ({ slug, titulo })) });
}

export async function POST(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const b: any = await req.json().catch(() => ({}));
  const modelo = MODELOS_PAGINAS.find((m) => m.slug === b.modelo);
  const titulo = txt(b.titulo, 80) || modelo?.titulo || 'Nueva página';
  let slug = slugify(txt(b.slug, 60) || modelo?.slug || titulo) || 'pagina';
  const total = await prisma.tiendaPagina.count({ where: { tiendaId: ctx.tienda.id } });
  if (total >= 20) return bad('Podés tener hasta 20 páginas.');
  for (let n = 2; await prisma.tiendaPagina.findUnique({ where: { tiendaId_slug: { tiendaId: ctx.tienda.id, slug } } }); n++) slug = `${slugify(modelo?.slug || titulo)}-${n}`;
  const pagina = await prisma.tiendaPagina.create({
    data: { tiendaId: ctx.tienda.id, slug, titulo, contenido: txt(b.contenido, 20000) || modelo?.contenido || '', orden: total },
  });
  return NextResponse.json({ pagina });
}

export async function PUT(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const b: any = await req.json().catch(() => ({}));
  const actual = await prisma.tiendaPagina.findFirst({ where: { id: txt(b.id, 40), tiendaId: ctx.tienda.id } });
  if (!actual) return bad('Página no encontrada.', 404);
  const data: any = {};
  if (b.titulo !== undefined) data.titulo = txt(b.titulo, 80) || actual.titulo;
  if (b.contenido !== undefined) data.contenido = txt(b.contenido, 20000);
  if (typeof b.visible === 'boolean') data.visible = b.visible;
  if (typeof b.enPie === 'boolean') data.enPie = b.enPie;
  if (Number.isFinite(Number(b.orden))) data.orden = Math.max(0, Math.min(99, Math.round(Number(b.orden))));
  const pagina = await prisma.tiendaPagina.update({ where: { id: actual.id }, data });
  return NextResponse.json({ pagina });
}

export async function DELETE(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const id = txt(new URL(req.url).searchParams.get('id'), 40);
  const r = await prisma.tiendaPagina.deleteMany({ where: { id, tiendaId: ctx.tienda.id } });
  if (!r.count) return bad('Página no encontrada.', 404);
  return NextResponse.json({ ok: true });
}
