// Cron cada hora: avisos para que las revendedoras no dejen cosas trabadas
// 1) Tienda lista para publicar (tiene un cobro activo) y sigue en borrador → aviso (hasta 2 veces, cada 5 días)
// 2) Pedido web pagado hace más de 24 h que no se mandó a Nadin → aviso (hasta 2 veces, cada 2 días)
// 3) Pedido web sin pagar hace 7 días → se cancela solo (salvo efectivo al entregar y ventas manuales)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatPrecio } from '@/lib/tienda';
import { emailOrden, escapeHtml, vaANadin, DIAS_CANCELA_SIN_PAGO, PAGOS_AL_ENTREGAR } from '@/lib/tienda-checkout';
import { enviarNotificacionGeneral } from '@/lib/notifications';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const H = 3600e3;
const D = 24 * H;
const appUrl = () => (process.env.NEXT_PUBLIC_APP_URL || 'https://nadin-revendedoras-app.vercel.app').replace(/\/$/, '');

function boton(href: string, texto: string) {
  return `<p style="margin:18px 0"><a href="${href}" style="background:#db2777;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold">${texto}</a></p>`;
}
function mail(titulo: string, cuerpo: string) {
  return `<div style="font-family:Arial,sans-serif;font-size:15px;color:#111;max-width:560px"><h2 style="margin:0 0 10px">${titulo}</h2>${cuerpo}<p style="color:#666;font-size:12px">Nadin Lencería · Tiendas Nadin</p></div>`;
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const ahora = Date.now();
  const r = { publicar: 0, enviarNadin: 0, canceladas: 0 };

  // 1) Tiendas listas para publicar
  const listas = await prisma.tienda.findMany({
    where: {
      activa: false,
      recordatoriosPublicar: { lt: 2 },
      OR: [{ recordatorioPublicarAt: null }, { recordatorioPublicarAt: { lte: new Date(ahora - 5 * D) } }],
      metodosPago: { some: { activo: true } },
      user: { bloqueado: false },
    },
    include: { user: { select: { email: true, name: true } } },
    take: 50,
  });
  for (const t of listas) {
    const link = '/dashboard/mi-tienda?tab=inicio';
    const nombre = (t.user.name || '').split(' ')[0];
    await enviarNotificacionGeneral({
      userId: t.userId,
      tipo: 'tienda_lista_publicar',
      titulo: '🚀 Tu tienda está lista para publicar',
      mensaje: 'Ya tenés un medio de cobro activo: solo falta tocar “Publicar ahora” y empezás a vender.',
      metadata: JSON.stringify({ link }),
    }).catch(() => {});
    await emailOrden(
      t.email || t.user.email,
      '🚀 Tu tienda está lista: te falta un solo toque',
      mail(`¡Hola${nombre ? ` ${escapeHtml(nombre)}` : ''}! Tu tienda está lista`,
        `<p>Tu tienda <strong>${escapeHtml(t.nombre)}</strong> ya tiene diseño, productos y un medio de cobro activo.</p>
         <p>Mientras siga en borrador, solo la ves vos. Entrá a la app y tocá <strong>Publicar ahora</strong>: en un segundo queda online para compartir el link.</p>
         ${boton(`${appUrl()}${link}`, 'Publicar mi tienda')}`)
    ).catch(() => {});
    await prisma.tienda.update({ where: { id: t.id }, data: { recordatorioPublicarAt: new Date(), recordatoriosPublicar: { increment: 1 } } });
    r.publicar++;
  }

  // 2) Pedidos pagados hace más de 24 h sin enviar a Nadin (agrupado por tienda)
  const pagadas = await prisma.ordenTienda.findMany({
    where: {
      estado: 'pagada',
      pedidoId: null,
      pagadaAt: { lte: new Date(ahora - D) },
      recordatoriosNadin: { lt: 2 },
      OR: [{ recordatorioNadinAt: null }, { recordatorioNadinAt: { lte: new Date(ahora - 2 * D) } }],
      tienda: { user: { bloqueado: false } },
    },
    include: { items: true, tienda: { include: { user: { select: { email: true, name: true } } } } },
    take: 200,
  });
  const porTienda = new Map<string, typeof pagadas>();
  for (const o of pagadas) {
    if (!o.items.some(vaANadin)) continue; // solo productos propios: no va a Nadin
    porTienda.set(o.tiendaId, [...(porTienda.get(o.tiendaId) || []), o]);
  }
  for (const lista of Array.from(porTienda.values())) {
    const t = lista[0].tienda;
    const n = lista.length;
    const link = '/dashboard/mi-tienda?tab=pedidos&enviar=1';
    const detalle = lista.map((o) => `#${o.numero} ${o.clienteNombre}`).join(', ');
    await enviarNotificacionGeneral({
      userId: t.userId,
      tipo: 'tienda_pedidos_sin_enviar',
      titulo: n === 1 ? '📦 Tenés 1 pedido pagado sin enviar a Nadin' : `📦 Tenés ${n} pedidos pagados sin enviar a Nadin`,
      mensaje: `${detalle}. Mandalos ahora para asegurar el stock: es un toque.`,
      metadata: JSON.stringify({ link }),
    }).catch(() => {});
    const filas = lista.map((o) => `<li>#${o.numero} · ${escapeHtml(o.clienteNombre)} · ${formatPrecio(o.total)}</li>`).join('');
    await emailOrden(
      t.email || t.user.email,
      n === 1 ? '📦 Tenés un pedido pagado sin enviar a Nadin' : `📦 Tenés ${n} pedidos pagados sin enviar a Nadin`,
      mail('Pedidos pagados esperando', `<p>Tus clientas ya pagaron y estos pedidos todavía no llegaron a Nadin:</p><ul>${filas}</ul>
        <p>Mientras no los mandes, el stock no queda reservado. Tocá el botón y enviálos todos juntos.</p>
        ${boton(`${appUrl()}${link}`, 'Enviar a Nadin')}
        <p style="font-size:13px;color:#444">Tip: en <strong>Mi Tienda → Marca, datos y dominio → Envío automático a Nadin</strong> podés hacer que se manden solos cuando quedan pagos.</p>`)
    ).catch(() => {});
    await prisma.ordenTienda.updateMany({ where: { id: { in: lista.map((o) => o.id) } }, data: { recordatorioNadinAt: new Date(), recordatoriosNadin: { increment: 1 } } });
    r.enviarNadin += n;
  }

  // 3) Pedidos sin pagar hace 7 días: se cancelan solos
  const vencidas = await prisma.ordenTienda.findMany({
    where: {
      estado: 'pendiente_pago',
      pedidoId: null,
      pagadaAt: null,
      origen: 'web',
      metodoPagoTipo: { notIn: PAGOS_AL_ENTREGAR },
      createdAt: { lte: new Date(ahora - DIAS_CANCELA_SIN_PAGO * D) },
    },
    take: 200,
  });
  const canceladasPorTienda = new Map<string, typeof vencidas>();
  for (const o of vencidas) {
    const ok = await prisma.$transaction(async (tx) => {
      const upd = await tx.ordenTienda.updateMany({
        where: { id: o.id, estado: 'pendiente_pago', pagadaAt: null },
        data: { estado: 'cancelada', canceladaAt: new Date(), canceladaAuto: true },
      });
      if (!upd.count) return false;
      if (o.cuponCodigo) {
        await tx.tiendaCupon.updateMany({ where: { tiendaId: o.tiendaId, codigo: o.cuponCodigo, usos: { gt: 0 } }, data: { usos: { decrement: 1 } } });
      }
      return true;
    });
    if (!ok) continue;
    canceladasPorTienda.set(o.tiendaId, [...(canceladasPorTienda.get(o.tiendaId) || []), o]);
    r.canceladas++;
  }
  const tiendas = canceladasPorTienda.size
    ? await prisma.tienda.findMany({ where: { id: { in: Array.from(canceladasPorTienda.keys()) } }, select: { id: true, userId: true } })
    : [];
  for (const t of tiendas) {
    const lista = canceladasPorTienda.get(t.id) || [];
    await enviarNotificacionGeneral({
      userId: t.userId,
      tipo: 'tienda_pedidos_cancelados',
      titulo: lista.length === 1 ? '🗑️ Se canceló 1 pedido sin pagar' : `🗑️ Se cancelaron ${lista.length} pedidos sin pagar`,
      mensaje: `${lista.map((o) => `#${o.numero} ${o.clienteNombre}`).join(', ')}: pasaron ${DIAS_CANCELA_SIN_PAGO} días sin que se pagaran. Si la clienta paga por Mercado Pago igual, el pedido vuelve solo.`,
      metadata: JSON.stringify({ link: '/dashboard/mi-tienda?tab=pedidos' }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, ...r });
}
