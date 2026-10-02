// lib/consolidacion.ts
// Crear una consolidación (pedidos que la revendedora le manda a Nadin para armar).
// Lo usan /api/consolidar (flujo de siempre) y Tiendas Nadin ("Enviar a Nadin").

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendConsolidacionEmail } from '@/lib/email';

export const FORMAS_PAGO_NADIN = ['efectivo', 'transferencia', 'mercadopago', 'tarjeta'] as const;
export const TIPOS_ENVIO_NADIN = ['retiro', 'envio'] as const;

export async function crearConsolidacion(params: {
  userId: string;
  pedidoIds: string[];
  formaPago?: string | null;
  tipoEnvio?: string | null;
  transporteNombre?: string | null;
}) {
  const { userId, pedidoIds } = params;
  const formaPago = params.formaPago || 'Efectivo';
  const tipoEnvio = params.tipoEnvio || 'Retiro';
  const transporteNombre = params.transporteNombre || null;

  if (!pedidoIds.length) throw new Error('No hay pedidos seleccionados');

  const pedidos = await prisma.pedido.findMany({
    where: { id: { in: pedidoIds }, userId },
    include: { lineas: true },
  });
  if (pedidos.length !== pedidoIds.length) throw new Error('Algunos pedidos no existen');

  let totalMayorista = 0;
  let totalVenta = 0;
  pedidos.forEach((pedido) => {
    pedido.lineas.forEach((linea) => {
      totalMayorista += linea.mayorista * linea.qty;
      totalVenta += linea.venta * linea.qty;
    });
  });
  const ganancia = totalVenta - totalMayorista;

  const consolidacion = await prisma.consolidacion.create({
    data: {
      userId,
      pedidoIds: JSON.stringify(pedidoIds),
      formaPago,
      tipoEnvio,
      transporteNombre,
      totalMayorista,
      totalVenta,
      ganancia,
      estado: 'enviado',
      // Si está activo el puente con Dragonfish, queda en cola para generar el remito
      ...(process.env.DRAGONFISH_ENABLED === '1' ? { dfEstado: 'pendiente' } : {}),
    },
  });

  const ahora = new Date();
  await prisma.pedido.updateMany({
    where: { id: { in: pedidoIds } },
    data: { estado: 'enviado', orderStatus: 'sent_to_nadin', sentToNadinAt: ahora },
  });

  const usuario = await prisma.user.findUnique({ where: { id: userId } });
  if (!usuario) throw new Error('Usuario no encontrado');

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  await prisma.consolidacionAccessToken.create({ data: { consolidacionId: consolidacion.id, token, expiresAt } });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const linkMagico = `${baseUrl}/armar-consolidacion/${token}`;

  await sendConsolidacionEmail({
    revendedora: {
      name: usuario.name,
      handle: usuario.handle,
      email: usuario.email,
      dni: usuario.dni,
      telefono: usuario.telefono,
    },
    pedidos: pedidos.map((p) => ({ id: p.id, cliente: p.cliente, telefono: p.telefono || '', lineas: p.lineas })),
    totales: { mayorista: totalMayorista, venta: totalVenta, ganancia },
    formaPago,
    tipoEnvio,
    transporteNombre,
    linkMagico,
  });

  return { consolidacion, linkMagico };
}
