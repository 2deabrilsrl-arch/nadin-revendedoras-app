// El puente informa el resultado de generar el remito en Dragonfish.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bridgeAutorizado, noAutorizado, MAX_INTENTOS, notificarFaltantes, Faltante } from '@/lib/dragonfish';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!bridgeAutorizado(req)) return noAutorizado();
  const b: any = await req.json().catch(() => ({}));
  const id = String(b.id || '');
  const c = await prisma.consolidacion.findUnique({ where: { id }, select: { id: true, dfIntentos: true } });
  if (!c) return NextResponse.json({ error: 'No existe' }, { status: 404 });

  // Productos sin stock que el puente sacó del remito
  const faltantes: Faltante[] = Array.isArray(b.faltantes)
    ? b.faltantes.slice(0, 200).map((f: any) => ({
        sku: String(f.sku || ''), nombre: String(f.nombre || ''),
        pedida: Number(f.pedida) || 0, enviada: Number(f.enviada) || 0,
      })).filter((f: Faltante) => f.sku && f.pedida > f.enviada)
    : [];
  const yaAvisado = await prisma.consolidacion.findUnique({ where: { id }, select: { dfFaltantes: true } });
  const avisar = faltantes.length > 0 && !yaAvisado?.dfFaltantes;

  if (b.ok) {
    await prisma.consolidacion.update({
      where: { id },
      data: {
        dfEstado: 'generado',
        dfComprobante: String(b.comprobante || '').slice(0, 60) || null,
        dfError: null,
        dfActualizadoAt: new Date(),
        ...(faltantes.length ? { dfFaltantes: faltantes as any } : {}),
      },
    });
    if (avisar) await notificarFaltantes(id, faltantes, false).catch((e) => console.error('Aviso faltantes:', e));
  } else if (b.sinStock) {
    // No había nada en stock: no se genera remito y se avisa a la revendedora
    await prisma.consolidacion.update({
      where: { id },
      data: { dfEstado: 'sin_stock', dfError: 'Sin stock de ningún producto', dfFaltantes: faltantes as any, dfActualizadoAt: new Date() },
    });
    if (avisar) await notificarFaltantes(id, faltantes, true).catch((e) => console.error('Aviso faltantes:', e));
  } else {
    const intentos = c.dfIntentos + 1;
    await prisma.consolidacion.update({
      where: { id },
      data: {
        // reintenta hasta MAX_INTENTOS; después queda en "error" para revisarlo a mano
        dfEstado: intentos >= MAX_INTENTOS || b.definitivo ? 'error' : 'pendiente',
        dfIntentos: intentos,
        dfError: String(b.error || 'Error desconocido').slice(0, 1000),
        dfActualizadoAt: new Date(),
      },
    });
  }
  return NextResponse.json({ ok: true });
}
