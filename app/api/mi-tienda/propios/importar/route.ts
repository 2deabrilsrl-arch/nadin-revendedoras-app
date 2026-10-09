// Importar productos propios desde planilla. La planilla se lee en el navegador;
// acá llegan las filas, se validan y (si no es solo revisión) se guardan.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserAndTienda, noAuth, bad } from '@/lib/mi-tienda';
import { planificar, MAX_FILAS_IMPORT, COLUMNAS, type FilaImport } from '@/lib/importar-propios';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CAMPOS = new Set<string>(COLUMNAS.map((c) => c.k));

export async function POST(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const b: any = await req.json().catch(() => ({}));
  const crudas = Array.isArray(b.filas) ? b.filas : [];
  if (!crudas.length) return bad('La planilla no tiene filas con productos.');
  if (crudas.length > MAX_FILAS_IMPORT) return bad(`La planilla puede tener hasta ${MAX_FILAS_IMPORT} filas.`);

  // Solo campos conocidos, como texto o número
  const filas: FilaImport[] = crudas.map((f: any, i: number) => {
    const out: any = { fila: Number.isInteger(f?.fila) ? f.fila : i + 2 };
    for (const [k, v] of Object.entries(f || {})) {
      if (!CAMPOS.has(k)) continue;
      if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
      else if (typeof v === 'string') out[k] = v.slice(0, 4000);
    }
    return out;
  });

  const existentes = await prisma.tiendaProductoPropio.findMany({
    where: { tiendaId: ctx.tienda.id },
    select: { id: true, nombre: true, variantes: { select: { id: true, talle: true, color: true } } },
    orderBy: { createdAt: 'asc' },
  });
  const plan = planificar(filas, existentes);
  if (b.soloRevisar) return NextResponse.json(plan);

  let hechos = 0;
  const fallidos: string[] = [];
  for (const p of plan.productos) {
    try {
      if (!p.id) {
        await prisma.tiendaProductoPropio.create({
          data: {
            tiendaId: ctx.tienda.id,
            nombre: p.nombre,
            categoria: p.categoria || 'Otros',
            descripcion: p.descripcion || null,
            imagenes: p.imagenes || [],
            variantes: {
              create: p.variantes.map((v) => ({ talle: v.talle, color: v.color, precio: v.precio!, precioAntes: v.precioAntes ?? null, stock: v.stock ?? 0, sku: v.sku ?? null })),
            },
          },
        });
      } else {
        const id = p.id;
        await prisma.$transaction(async (tx) => {
          const data: any = {};
          if (p.categoria) data.categoria = p.categoria;
          if (p.descripcion) data.descripcion = p.descripcion;
          if (p.imagenes?.length) data.imagenes = p.imagenes;
          if (Object.keys(data).length) await tx.tiendaProductoPropio.update({ where: { id }, data });
          for (const v of p.variantes) {
            const cambios: any = {};
            if (v.precio !== undefined) cambios.precio = v.precio;
            if (v.precioAntes !== undefined) cambios.precioAntes = v.precioAntes;
            if (v.stock !== undefined) cambios.stock = v.stock;
            if (v.sku !== undefined) cambios.sku = v.sku;
            if (v.id) {
              if (Object.keys(cambios).length) await tx.tiendaVariantePropia.updateMany({ where: { id: v.id, productoId: id }, data: cambios });
            } else {
              await tx.tiendaVariantePropia.create({ data: { productoId: id, talle: v.talle, color: v.color, precio: v.precio!, precioAntes: v.precioAntes ?? null, stock: v.stock ?? 0, sku: v.sku ?? null } });
            }
          }
        }, { timeout: 20000 });
      }
      hechos++;
    } catch (e) {
      console.error('[importar propios]', p.nombre, e);
      fallidos.push(p.nombre);
    }
  }
  return NextResponse.json({ ...plan, productos: undefined, hechos, fallidos });
}
