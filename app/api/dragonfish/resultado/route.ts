// El puente informa el resultado de generar el remito en Dragonfish.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bridgeAutorizado, noAutorizado, MAX_INTENTOS } from '@/lib/dragonfish';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!bridgeAutorizado(req)) return noAutorizado();
  const b: any = await req.json().catch(() => ({}));
  const id = String(b.id || '');
  const c = await prisma.consolidacion.findUnique({ where: { id }, select: { id: true, dfIntentos: true } });
  if (!c) return NextResponse.json({ error: 'No existe' }, { status: 404 });

  if (b.ok) {
    await prisma.consolidacion.update({
      where: { id },
      data: { dfEstado: 'generado', dfComprobante: String(b.comprobante || '').slice(0, 60) || null, dfError: null, dfActualizadoAt: new Date() },
    });
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
