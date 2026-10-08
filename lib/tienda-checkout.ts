// lib/tienda-checkout.ts
// Cálculo de la compra (siempre del lado del servidor), Mercado Pago de la
// revendedora, y el paso "Enviar a Nadin" que crea un Pedido normal.

import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { getCatalogoTienda, getTiendaBaseUrl, formatPrecio, PREFIJO_VARIANTE_PROPIA, type TiendaConUser } from '@/lib/tienda';
import { enviarNotificacionGeneral } from '@/lib/notifications';
import { crearConsolidacion, FORMAS_PAGO_NADIN, TIPOS_ENVIO_NADIN } from '@/lib/consolidacion';
import { getPromosActivas, aplicarPromos } from '@/lib/tienda-promos';

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
  propio: boolean;
}

export interface Cotizacion {
  lineas: LineaCalculada[];
  descuentoPromo: number;
  promos: string[];
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
      propio: !!p.propio,
    });
  }

  const subtotal = lineas.reduce((a, l) => a + l.precio * l.qty, 0);
  const totalMayorista = lineas.reduce((a, l) => a + l.mayorista * l.qty, 0);

  // Promociones automáticas (3x2, % off…)
  const promoRes = aplicarPromos(lineas, byId as any, await getPromosActivas(tienda.id));
  const descuentoPromo = Math.min(promoRes.descuento, subtotal);
  const baseCupon = subtotal - descuentoPromo;

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
    else if (c.minimo && baseCupon < c.minimo) cuponError = `El cupón es válido para compras desde ${formatPrecio(c.minimo)}.`;
    else {
      cupon = { id: c.id, codigo: c.codigo, tipo: c.tipo };
      if (c.tipo === 'porcentaje') descuentoCupon = round(baseCupon * Math.min(Math.max(c.valor, 0), 100) / 100);
      else if (c.tipo === 'monto') descuentoCupon = round(Math.min(Math.max(c.valor, 0), baseCupon));
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
      if (m.descuentoPct > 0) descuentoPago = round((baseCupon - descuentoCupon) * Math.min(m.descuentoPct, 50) / 100);
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

  const total = Math.max(0, subtotal - descuentoPromo - descuentoCupon - descuentoPago + envioCosto);
  return { lineas, errores, subtotal, descuentoPromo, promos: promoRes.detalle, descuentoCupon, descuentoPago, envioCosto, total, totalMayorista, cupon, cuponError, envio, pago };
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
  if (!m || !cfg?.accessToken) return null;
  // El permiso de MP dura 180 días: si vence en menos de 15, se renueva solo
  const vence = cfg.expiresAt ? new Date(cfg.expiresAt).getTime() : 0;
  if (cfg.refreshToken && vence && vence - Date.now() < 15 * 864e5) {
    const nuevo = await renovarTokenMP(m.id, cfg);
    if (nuevo) return nuevo;
  }
  return cfg;
}

/** Renueva el token de Mercado Pago de la revendedora con el refresh_token. */
export async function renovarTokenMP(metodoId: string, cfg: MpConfig): Promise<MpConfig | null> {
  if (!cfg.refreshToken || !process.env.MP_CLIENT_ID || !process.env.MP_CLIENT_SECRET) return null;
  try {
    const r = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.MP_CLIENT_ID,
        client_secret: process.env.MP_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: cfg.refreshToken,
      }),
    });
    if (!r.ok) {
      console.error('MP refresh', r.status, await r.text().catch(() => ''));
      return null;
    }
    const t: any = await r.json();
    const nuevo: MpConfig = {
      ...cfg,
      accessToken: t.access_token,
      publicKey: t.public_key || cfg.publicKey,
      refreshToken: t.refresh_token || cfg.refreshToken,
      userId: t.user_id || cfg.userId,
      expiresAt: new Date(Date.now() + (Number(t.expires_in) || 0) * 1000).toISOString(),
    };
    await prisma.tiendaMetodoPago.update({ where: { id: metodoId }, data: { config: nuevo as any } });
    return nuevo;
  } catch (e) {
    console.error('MP refresh falló', e);
    return null;
  }
}

/** Para el cron: renueva los tokens de MP que vencen en menos de 15 días (aunque no haya ventas). */
export async function renovarTokensMPPorVencer(max = 30) {
  if (!process.env.MP_CLIENT_ID || !process.env.MP_CLIENT_SECRET) return 0;
  const metodos = await prisma.tiendaMetodoPago.findMany({ where: { tipo: 'mercadopago' }, select: { id: true, config: true } });
  let n = 0;
  for (const m of metodos) {
    if (n >= max) break;
    const cfg = (m.config || {}) as MpConfig;
    const vence = cfg.expiresAt ? new Date(cfg.expiresAt).getTime() : 0;
    if (!cfg.refreshToken || !vence || vence - Date.now() > 15 * 864e5) continue;
    if (await renovarTokenMP(m.id, cfg)) n++;
  }
  return n;
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

  // Productos propios: se descuenta el stock que maneja la revendedora
  const propios = await prisma.ordenTiendaItem.findMany({ where: { ordenId, propio: true } });
  for (const it of propios) {
    const id = it.variantId.startsWith(PREFIJO_VARIANTE_PROPIA) ? it.variantId.slice(PREFIJO_VARIANTE_PROPIA.length) : it.variantId;
    await prisma.tiendaVariantePropia.updateMany({ where: { id }, data: { stock: { decrement: it.qty } } }).catch(() => {});
  }

  const orden = await prisma.ordenTienda.findUnique({ where: { id: ordenId }, include: { tienda: true } });
  if (!orden) return;
  const hayNadin = await prisma.ordenTiendaItem.count({ where: { ordenId, propio: false } });
  if (mpPaymentId) await emailRevendedoraOrden(ordenId, 'pagada'); // si lo marcó ella a mano, no hace falta avisarle

  if (orden.tienda.envioAutoNadin && hayNadin > 0) {
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
    mensaje: hayNadin > 0
      ? `${orden.clienteNombre} pagó ${formatPrecio(orden.total)}. ¿Lo enviamos a Nadin para asegurar el stock?`
      : `${orden.clienteNombre} pagó ${formatPrecio(orden.total)}. Son productos tuyos: preparalos y coordiná la entrega.`,
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

/**
 * Envía varios pedidos web a Nadin juntos, en una sola consolidación (un solo remito/armado).
 * Acepta pedidos pagados que todavía no fueron a Nadin y pedidos que se enviaron "sin consolidar".
 */
export async function enviarVariasANadin(ordenIds: string[], userId: string, opciones: OpcionesEnvioNadin) {
  const formaPago = String(opciones.formaPago || '').toLowerCase();
  const tipoEnvio = String(opciones.tipoEnvio || '').toLowerCase();
  const transporteNombre = (opciones.transporteNombre || '').trim().slice(0, 80) || null;
  if (!(FORMAS_PAGO_NADIN as readonly string[]).includes(formaPago)) throw new Error('Elegí cómo le pagás a Nadin.');
  if (!(TIPOS_ENVIO_NADIN as readonly string[]).includes(tipoEnvio)) throw new Error('Elegí cómo recibís el pedido.');
  if (tipoEnvio === 'envio' && !transporteNombre) throw new Error('Indicá el transporte.');
  const ids = Array.from(new Set(ordenIds)).slice(0, 100);
  if (!ids.length) throw new Error('Elegí al menos un pedido.');

  const pedidoIds: string[] = [];
  for (const id of ids) {
    const res = await enviarANadinPedido(id, userId);
    pedidoIds.push(res.pedidoId);
  }
  // Solo los que todavía no están en una consolidación
  const libres = await prisma.pedido.findMany({ where: { id: { in: pedidoIds }, userId, estado: 'pendiente' }, select: { id: true } });
  if (!libres.length) throw new Error('Esos pedidos ya fueron enviados a Nadin.');
  const r = await crearConsolidacion({ userId, pedidoIds: libres.map((p) => p.id), formaPago, tipoEnvio, transporteNombre });
  await prisma.tienda.updateMany({
    where: { userId },
    data: { nadinFormaPago: formaPago, nadinTipoEnvio: tipoEnvio, nadinTransporte: transporteNombre },
  });
  return { consolidacionId: r.consolidacion.id, pedidos: libres.length };
}

export async function enviarANadinPedido(ordenId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const orden = await tx.ordenTienda.findUnique({ where: { id: ordenId }, include: { items: true, tienda: true } });
    if (!orden || orden.tienda.userId !== userId) throw new Error('Orden no encontrada');
    if (orden.pedidoId) return { pedidoId: orden.pedidoId, yaEnviada: true };
    if (orden.estado !== 'pagada') throw new Error('Solo se pueden enviar a Nadin pedidos pagados');
    // Solo viajan a Nadin sus productos; los propios los entrega la revendedora
    const itemsNadin = orden.items.filter((i) => !i.propio);
    if (!itemsNadin.length) throw new Error('Este pedido tiene solo productos tuyos: no hay nada para enviar a Nadin.');

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
          create: itemsNadin.map((i) => ({
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

/**
 * Aviso por email a la revendedora: pedido nuevo o pedido pagado.
 * Va al email de la tienda (o al de su cuenta si no cargó uno), con el detalle y un botón de WhatsApp a la clienta.
 */
export async function emailRevendedoraOrden(ordenId: string, tipo: 'nueva' | 'pagada') {
  try {
    const o = await prisma.ordenTienda.findUnique({
      where: { id: ordenId },
      include: { items: true, tienda: { include: { user: { select: { email: true, name: true } } } } },
    });
    if (!o) return;
    const to = o.tienda.email || (o.tienda as any).user?.email;
    if (!to) return;
    const tel = (o.clienteTelefono || '').replace(/\D/g, '');
    const wa = tel ? `https://wa.me/${tel.length === 10 ? `549${tel}` : tel}?text=${encodeURIComponent(`¡Hola ${o.clienteNombre}! Te escribo de ${o.tienda.nombre} por tu pedido #${o.numero}.`)}` : '';
    const panel = `${appUrl()}/dashboard/mi-tienda?tab=pedidos`;
    const dir: any = o.direccion || null;
    const filas = o.items.map((i) =>
      `<tr><td style="padding:4px 8px 4px 0">${escapeHtml(i.nombre)}${i.talle ? ` · ${escapeHtml(i.talle)}` : ''}${i.color ? ` · ${escapeHtml(i.color)}` : ''}${i.propio ? ' <em>(tuyo)</em>' : ''}</td><td style="padding:4px 8px">×${i.qty}</td><td style="padding:4px 0;text-align:right">${formatPrecio(i.precio * i.qty)}</td></tr>`
    ).join('');
    const titulo = tipo === 'nueva' ? `🛍️ Nuevo pedido web #${o.numero}` : `💰 Pedido web #${o.numero} pagado`;
    const intro = tipo === 'nueva'
      ? `<p><strong>${escapeHtml(o.clienteNombre)}</strong> hizo un pedido en tu tienda. Pago elegido: <strong>${escapeHtml(o.metodoPagoNombre)}</strong> (todavía sin acreditar).</p>`
      : `<p><strong>${escapeHtml(o.clienteNombre)}</strong> pagó su pedido. ${o.tienda.envioAutoNadin ? 'Los productos de Nadin se envían solos a Nadin.' : 'Entrá a la app para enviarlo a Nadin y asegurar el stock.'}</p>`;
    const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111;max-width:560px">
      <h2 style="margin:0 0 8px">${titulo}</h2>${intro}
      <table style="border-collapse:collapse;width:100%;margin:8px 0">${filas}
        <tr><td colspan="2" style="padding-top:8px;border-top:1px solid #eee"><strong>Total</strong></td><td style="padding-top:8px;border-top:1px solid #eee;text-align:right"><strong>${formatPrecio(o.total)}</strong></td></tr></table>
      <p style="margin:8px 0">Entrega: ${escapeHtml(o.envioNombre)}${dir ? ` — ${escapeHtml([dir.calle, dir.numero, dir.localidad, dir.provincia].filter(Boolean).join(' '))}` : ''}</p>
      <p style="margin:8px 0">Clienta: ${escapeHtml(o.clienteNombre)} · ${escapeHtml(o.clienteTelefono || '')}${o.clienteEmail ? ` · ${escapeHtml(o.clienteEmail)}` : ''}</p>
      ${o.nota ? `<p style="margin:8px 0">Nota: ${escapeHtml(o.nota)}</p>` : ''}
      <p style="margin:16px 0">
        ${wa ? `<a href="${wa}" style="background:#22c55e;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:bold;margin-right:8px">Escribirle por WhatsApp</a>` : ''}
        <a href="${panel}" style="background:#db2777;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:bold">Ver en la app</a>
      </p></div>`;
    await emailOrden(to, `${titulo} — ${formatPrecio(o.total)}`, html, o.clienteEmail);
  } catch (e) {
    console.error('Email a revendedora falló', e);
  }
}
