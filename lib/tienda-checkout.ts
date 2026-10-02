// lib/tienda-checkout.ts
// Cálculo de la compra (siempre del lado del servidor), Mercado Pago de la
// revendedora, y el paso "Enviar a Nadin" que crea un Pedido normal.

import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { getCatalogoTienda, getTiendaBaseUrl, formatPrecio, type TiendaConUser } from '@/lib/tienda';
import { enviarNotificacionGeneral } from '@/lib/notifications';
import { crearConsolidacion, FORMAS_PAGO_NADIN, TIPOS_ENVIO_NADIN } from '@/lib/consolidacion';

export interface ItemEntrada {
  productId: string;
  variantId: string;
  qty: number;
}

export interface LineaCalculada {
  productId: string;
  variantId: string;
  sku: string;
  brand: string;
  nombre: string;
  talle: string;
  color: string;
  imagen: string;
  qty: number;
  precio: number;
  mayorista: number;
}

export interface Cotizacion {
  lineas: LineaCalculada[];
  errores: string[];
  subtotal: number;
  descuentoCupon: number;
  descuentoPago: number;
  envioCosto: number;
  total: number;
  totalMayorista: number;
  cupon: { id: string; codigo: string; tipo: string } | null;
  cuponError: string | null;
  envio: { id: string; tipo: string; nombre: string; pideDireccion: boolean } | null;
  pago: { id: string; tipo: string; nombre: string } | null;
}

const round = (n: number) => Math.round(n);

export async function cotizar(
  tienda: TiendaConUser,
  input: { items: ItemEntrada[]; envioId?: string | null; pagoId?: string | null; cupon?: string | null }
): Promise<Cotizacion> {
  const errores: string[] = [];
  const items = (Array.isArray(input.items) ? input.items : []).slice(0, 50);
  const catalogo = await getCatalogoTienda(tienda);
  const byId = new Map(catalogo.map((p) => [p.id, p]));

  const lineas: LineaCalculada[] = [];
  for (const it of items) {
    const qty = Math.floor(Number(it.qty));
    if (!qty || qty < 1 || qty > 99) continue;
    const p = byId.get(String(it.productId));
    const v = p?.variantes.find((x) => x.id === String(it.variantId));
    if (!p || !v) {
      errores.push('Un producto del carrito ya no está disponible.');
      continue;
    }
    if (v.stock < qty) {
      errores.push(
        v.stock <= 0
          ? `${p.nombre} (${[v.talle, v.color].filter(Boolean).join(' / ')}) se quedó sin stock.`
          : `De ${p.nombre} (${[v.talle, v.color].filter(Boolean).join(' / ')}) quedan solo ${v.stock}.`
      );
      continue;
    }
    lineas.push({
      productId: p.id,
      variantId: v.id,
      sku: v.sku,
      brand: p.brand,
      nombre: p.nombre,
      talle: v.talle,
      color: v.color,
      imagen: p.image,
      qty,
      precio: v.precio,
      mayorista: v.mayorista,
    });
  }

  const subtotal = lineas.reduce((a, l) => a + l.precio * l.qty, 0);
  const totalMayorista = lineas.reduce((a, l) => a + l.mayorista * l.qty, 0);

  // Cupón
  let cupon: Cotizacion['cupon'] = null;
  let cuponError: string | null = null;
  let descuentoCupon = 0;
  let envioGratisCupon = false;
  const codigo = (input.cupon || '').trim().toUpperCase();
  if (codigo) {
    const c = await prisma.tiendaCupon.findUnique({ where: { tiendaId_codigo: { tiendaId: tienda.id, codigo } } });
    if (!c || !c.activo) cuponError = 'El cupón no existe o no está activo.';
    else if (c.venceAt && c.venceAt < new Date()) cuponError = 'El cupón está vencido.';
    else if (c.usosMax != null && c.usos >= c.usosMax) cuponError = 'El cupón ya alcanzó su límite de usos.';
    else if (c.minimo && subtotal < c.minimo) cuponError = `El cupón es válido para compras desde ${formatPrecio(c.minimo)}.`;
    else {
      cupon = { id: c.id, codigo: c.codigo, tipo: c.tipo };
      if (c.tipo === 'porcentaje') descuentoCupon = round(subtotal * Math.min(Math.max(c.valor, 0), 100) / 100);
      else if (c.tipo === 'monto') descuentoCupon = round(Math.min(Math.max(c.valor, 0), subtotal));
      else if (c.tipo === 'envio_gratis') envioGratisCupon = true;
    }
  }

  // Medio de pago
  let pago: Cotizacion['pago'] = null;
  let descuentoPago = 0;
  if (input.pagoId) {
    const m = await prisma.tiendaMetodoPago.findFirst({ where: { id: input.pagoId, tiendaId: tienda.id, activo: true } });
    if (m) {
      pago = { id: m.id, tipo: m.tipo, nombre: m.nombre };
      if (m.descuentoPct > 0) descuentoPago = round((subtotal - descuentoCupon) * Math.min(m.descuentoPct, 50) / 100);
    }
  }

  // Envío
  let envio: Cotizacion['envio'] = null;
  let envioCosto = 0;
  if (input.envioId) {
    const e = await prisma.tiendaEnvio.findFirst({ where: { id: input.envioId, tiendaId: tienda.id, activo: true } });
    if (e) {
      envio = { id: e.id, tipo: e.tipo, nombre: e.nombre, pideDireccion: e.pideDireccion };
      const gratis = envioGratisCupon || (e.gratisDesde != null && subtotal >= e.gratisDesde);
      envioCosto = gratis ? 0 : Math.max(0, e.precio);
    }
  }

  const total = Math.max(0, subtotal - descuentoCupon - descuentoPago + envioCosto);
  return { lineas, errores, subtotal, descuentoCupon, descuentoPago, envioCosto, total, totalMayorista, cupon, cuponError, envio, pago };
}

// ---------------------------------------------------------------------
// Mercado Pago (cuenta de la revendedora)
// ---------------------------------------------------------------------

interface MpConfig {
  accessToken?: string;
  publicKey?: string;
  userId?: string | number;
  refreshToken?: string;
  expiresAt?: string;
}

export async function getMpConfig(tiendaId: string): Promise<MpConfig | null> {
  const m = await prisma.tiendaMetodoPago.findFirst({ where: { tiendaId, tipo: 'mercadopago' } });
  const cfg = (m?.config || null) as MpConfig | null;
  return cfg?.accessToken ? cfg : null;
}

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://nadin-revendedoras-app.vercel.app').replace(/\/$/, '');
}

export async function crearPreferenciaMP(
  tienda: TiendaConUser,
  orden: { id: string; numero: number; token: string; total: number; clienteEmail: string | null; clienteNombre: string }
): Promise<{ id: string; initPoint: string } | null> {
  const cfg = await getMpConfig(tienda.id);
  if (!cfg?.accessToken) return null;
  const base = getTiendaBaseUrl(tienda);
  const body = {
    items: [
      {
        id: orden.id,
        title: `Pedido #${orden.numero} - ${tienda.nombre}`,
        quantity: 1,
        currency_id: 'ARS',
        unit_price: Math.round(orden.total),
      },
    ],
    payer: orden.clienteEmail ? { email: orden.clienteEmail, name: orden.clienteNombre } : undefined,
    external_reference: orden.id,
    statement_descriptor: tienda.nombre.slice(0, 22),
    back_urls: {
      success: `${base}/pedido/${orden.token}`,
      pending: `${base}/pedido/${orden.token}`,
      failure: `${base}/pedido/${orden.token}`,
    },
    auto_return: 'approved',
    notification_url: `${appUrl()}/api/webhooks/mercadopago?orden=${orden.id}`,
  };
  const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error('MP preference error', res.status, await res.text().catch(() => ''));
    return null;
  }
  const data: any = await res.json();
  return { id: data.id, initPoint: data.init_point };
}

/** Consulta un pago en MP con el token de la revendedora y, si está aprobado, marca la orden como pagada. */
export async function verificarPagoMP(ordenId: string, paymentId: string): Promise<boolean> {
  const orden = await prisma.ordenTienda.findUnique({ where: { id: ordenId } });
  if (!orden || orden.estado !== 'pendiente_pago') return false;
  const cfg = await getMpConfig(orden.tiendaId);
  if (!cfg?.accessToken) return false;
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${cfg.accessToken}` },
  });
  if (!res.ok) return false;
  const pay: any = await res.json();
  const ok =
    pay.status === 'approved' &&
    String(pay.external_reference) === orden.id &&
    Number(pay.transaction_amount) >= Math.round(orden.total) - 1;
  if (!ok) return false;
  await marcarPagada(orden.id, String(pay.id));
  return true;
}

// ---------------------------------------------------------------------
// Ciclo de vida de la orden
// ---------------------------------------------------------------------

export async function marcarPagada(ordenId: string, mpPaymentId?: string) {
  const upd = await prisma.ordenTienda.updateMany({
    where: { id: ordenId, estado: 'pendiente_pago' },
    data: { estado: 'pagada', pagadaAt: new Date(), ...(mpPaymentId ? { mpPaymentId } : {}) },
  });
  if (upd.count === 0) return; // ya estaba pagada (webhook repetido)

  const orden = await prisma.ordenTienda.findUnique({ where: { id: ordenId }, include: { tienda: true } });
  if (!orden) return;

  if (orden.tienda.envioAutoNadin) {
    try {
      const t = orden.tienda;
      const conDatos = !!(t.nadinFormaPago && t.nadinTipoEnvio);
      await enviarANadin(orden.id, t.userId, conDatos
        ? { consolidar: true, formaPago: t.nadinFormaPago, tipoEnvio: t.nadinTipoEnvio, transporteNombre: t.nadinTransporte }
        : { consolidar: false });
      return;
    } catch (e) {
      console.error('Envío automático a Nadin falló', e);
    }
  }

  await enviarNotificacionGeneral({
    userId: orden.tienda.userId,
    tipo: 'tienda_orden_pagada',
    titulo: `💰 Pedido web #${orden.numero} pagado`,
    mensaje: `${orden.clienteNombre} pagó ${formatPrecio(orden.total)}. ¿Lo enviamos a Nadin para asegurar el stock?`,
    metadata: JSON.stringify({ ordenId: orden.id }),
  }).catch(() => {});
}

/**
 * Convierte una orden web pagada en un Pedido del flujo actual de Nadin
 * (el mismo que arma la revendedora a mano), para que se consolide y se arme.
 */
export interface OpcionesEnvioNadin {
  consolidar: boolean;
  formaPago?: string | null;
  tipoEnvio?: string | null;
  transporteNombre?: string | null;
}

/**
 * Pasa la orden web a Nadin. Con `consolidar: true` (lo normal) también crea la
 * consolidación en el mismo paso, así la revendedora no tiene que ir a "Consolidar".
 */
export async function enviarANadin(ordenId: string, userId: string, opciones: OpcionesEnvioNadin = { consolidar: false }) {
  let formaPago: string | null = null;
  let tipoEnvio: string | null = null;
  let transporteNombre: string | null = null;
  if (opciones.consolidar) {
    formaPago = String(opciones.formaPago || '').toLowerCase();
    tipoEnvio = String(opciones.tipoEnvio || '').toLowerCase();
    transporteNombre = (opciones.transporteNombre || '').trim().slice(0, 80) || null;
    if (!(FORMAS_PAGO_NADIN as readonly string[]).includes(formaPago)) throw new Error('Elegí cómo le pagás a Nadin.');
    if (!(TIPOS_ENVIO_NADIN as readonly string[]).includes(tipoEnvio)) throw new Error('Elegí cómo recibís el pedido.');
    if (tipoEnvio === 'envio' && !transporteNombre) throw new Error('Indicá el transporte.');
  }

  const res = await enviarANadinPedido(ordenId, userId);
  if (!opciones.consolidar || res.yaEnviada) return { ...res, consolidado: false };

  await crearConsolidacion({ userId, pedidoIds: [res.pedidoId], formaPago, tipoEnvio, transporteNombre });
  // Recordamos la elección para la próxima (un toque)
  await prisma.tienda.updateMany({
    where: { userId },
    data: { nadinFormaPago: formaPago, nadinTipoEnvio: tipoEnvio, nadinTransporte: transporteNombre },
  });
  return { ...res, consolidado: true };
}

async function enviarANadinPedido(ordenId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const orden = await tx.ordenTienda.findUnique({ where: { id: ordenId }, include: { items: true, tienda: true } });
    if (!orden || orden.tienda.userId !== userId) throw new Error('Orden no encontrada');
    if (orden.pedidoId) return { pedidoId: orden.pedidoId, yaEnviada: true };
    if (orden.estado !== 'pagada') throw new Error('Solo se pueden enviar a Nadin pedidos pagados');

    const dir = (orden.direccion || {}) as Record<string, string>;
    const nota = [
      `Pedido web #${orden.numero}`,
      `Envío: ${orden.envioNombre}`,
      dir.calle ? `Dirección: ${dir.calle} ${dir.numero || ''} ${dir.piso || ''}, ${dir.localidad || ''} (${dir.cp || ''}) ${dir.provincia || ''}` : '',
      orden.nota ? `Nota clienta: ${orden.nota}` : '',
    ].filter(Boolean).join(' · ');

    const pedido = await tx.pedido.create({
      data: {
        userId: orden.tienda.userId,
        cliente: orden.clienteNombre,
        telefono: orden.clienteTelefono,
        nota,
        estado: 'pendiente',
        paidByClient: true,
        paidByClientAt: orden.pagadaAt || new Date(),
        lineas: {
          create: orden.items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            sku: i.sku || '',
            brand: i.brand || '',
            name: i.nombre,
            talle: i.talle || '',
            color: i.color || '',
            qty: i.qty,
            mayorista: i.mayorista,
            venta: i.precio,
          })),
        },
      },
    });

    await tx.ordenTienda.update({
      where: { id: orden.id },
      data: { pedidoId: pedido.id, estado: 'enviada_nadin', enviadaNadinAt: new Date() },
    });
    return { pedidoId: pedido.id, yaEnviada: false };
  });
}

// ---------------------------------------------------------------------
// Emails (Resend). Si no hay API key, no hace nada.
// ---------------------------------------------------------------------

export async function emailOrden(
  to: string | null | undefined,
  asunto: string,
  html: string,
  replyTo?: string | null
) {
  if (!to || !process.env.RESEND_API_KEY) return;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.TIENDAS_FROM_EMAIL || 'Pedidos <noreply@nadinlenceria.com>',
      to,
      subject: asunto,
      html,
      ...(replyTo ? { replyTo } : {}),
    } as any);
  } catch (e) {
    console.error('Email orden tienda falló', e);
  }
}

export function escapeHtml(s: string) {
  return (s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}
