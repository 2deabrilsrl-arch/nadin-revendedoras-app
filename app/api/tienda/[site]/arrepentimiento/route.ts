// Botón de arrepentimiento (Res. 424/2020): la clienta pide cancelar su compra.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTiendaBySite } from '@/lib/tienda';
import { enviarNotificacionGeneral } from '@/lib/notifications';

export async function POST(req: Request, { params }: { params: { site: string } }) {
  const tienda = await getTiendaBySite(params.site);
  if (!tienda) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });
  const body: any = await req.json().catch(() => ({}));
  const numero = parseInt(String(body.numero || ''), 10);
  const contacto = String(body.contacto || '').trim().toLowerCase().slice(0, 120);
  const motivo = String(body.motivo || '').trim().slice(0, 500);
  if (!numero || !contacto) return NextResponse.json({ error: 'Completá el número de pedido y tu email o teléfono.' }, { status: 400 });

  const orden = await prisma.ordenTienda.findFirst({ where: { tiendaId: tienda.id, numero } });
  const digits = contacto.replace(/\D/g, '');
  const coincide =
    orden &&
    ((orden.clienteEmail && orden.clienteEmail.toLowerCase() === contacto) ||
      (digits.length >= 8 && orden.clienteTelefono.replace(/\D/g, '').endsWith(digits.slice(-8))));

  // Respondemos igual exista o no (no revelamos datos de otros pedidos)
  if (coincide && orden) {
    await prisma.ordenTienda.update({ where: { id: orden.id }, data: { arrepentimiento: true } });
    await enviarNotificacionGeneral({
      userId: tienda.userId,
      tipo: 'tienda_arrepentimiento',
      titulo: `↩️ Pedido web #${orden.numero}: botón de arrepentimiento`,
      mensaje: `${orden.clienteNombre} pidió cancelar la compra.${motivo ? ` Motivo: ${motivo}` : ''} Tenés que contactarla y gestionar la devolución.`,
      metadata: JSON.stringify({ ordenId: orden.id }),
    }).catch(() => {});
  }
  const codigo = `ARR-${Date.now().toString(36).toUpperCase()}`;
  return NextResponse.json({ ok: true, codigo });
}
