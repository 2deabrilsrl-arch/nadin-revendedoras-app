// Medios de pago de mi tienda
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserAndTienda, noAuth, bad, s, sOrNull, num, bool } from '@/lib/mi-tienda';

export const dynamic = 'force-dynamic';
const TIPOS = ['transferencia', 'mercadopago', 'link', 'efectivo'];

function publico(m: any) {
  const cfg = (m.config || {}) as Record<string, any>;
  const { accessToken, refreshToken, ...resto } = cfg;
  // vencido: el permiso de MP caducó y no se pudo renovar solo (ej. la revendedora lo revocó en MP)
  const vencido = !!(accessToken && resto.expiresAt && new Date(resto.expiresAt).getTime() < Date.now());
  return { ...m, config: m.tipo === 'mercadopago' ? { conectado: !!accessToken && !vencido, vencido, cuenta: resto.nickname || resto.userId || null } : cfg };
}

async function validarConfig(tipo: string, raw: any): Promise<{ config?: any; error?: string }> {
  const c = raw || {};
  if (tipo === 'transferencia') {
    const config = { alias: s(c.alias, 40) || '', cbu: (s(c.cbu, 30) || '').replace(/\D/g, ''), titular: s(c.titular, 80) || '', banco: s(c.banco, 60) || '' };
    if (!config.alias && !config.cbu) return { error: 'Cargá el alias o el CBU/CVU.' };
    if (config.cbu && config.cbu.length !== 22) return { error: 'El CBU/CVU tiene que tener 22 números.' };
    return { config };
  }
  if (tipo === 'link') {
    const url = s(c.url, 500) || '';
    if (url && !/^https:\/\//i.test(url)) return { error: 'El link de pago tiene que empezar con https://' };
    return { config: { url } };
  }
  if (tipo === 'mercadopago') {
    // Carga manual del Access Token (alternativa al botón "Conectar")
    const token = s(c.accessToken, 200);
    if (!token) return {};
    if (!/^APP_USR-/.test(token)) return { error: 'El Access Token de producción empieza con APP_USR-' };
    const r = await fetch('https://api.mercadopago.com/users/me', { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) return { error: 'Mercado Pago rechazó ese Access Token.' };
    const me: any = await r.json();
    return { config: { accessToken: token, userId: me.id, nickname: me.nickname || me.email || null } };
  }
  return { config: {} };
}

export async function GET() {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const pagos = await prisma.tiendaMetodoPago.findMany({ where: { tiendaId: ctx.tienda.id }, orderBy: { orden: 'asc' } });
  return NextResponse.json({ pagos: pagos.map(publico), mpOAuth: !!(process.env.MP_CLIENT_ID && process.env.MP_CLIENT_SECRET) });
}

export async function POST(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const b: any = await req.json().catch(() => ({}));
  if (!TIPOS.includes(b.tipo)) return bad('Tipo de pago inválido.');
  if (b.tipo === 'mercadopago') {
    const ya = await prisma.tiendaMetodoPago.findFirst({ where: { tiendaId: ctx.tienda.id, tipo: 'mercadopago' } });
    if (ya) return bad('Ya tenés Mercado Pago agregado.');
  }
  const v = await validarConfig(b.tipo, b.config);
  if (v.error) return bad(v.error);
  const nombres: Record<string, string> = { transferencia: 'Transferencia bancaria', mercadopago: 'Mercado Pago (tarjetas, débito y dinero en cuenta)', link: 'Link de pago', efectivo: 'Efectivo al retirar' };
  const count = await prisma.tiendaMetodoPago.count({ where: { tiendaId: ctx.tienda.id } });
  const m = await prisma.tiendaMetodoPago.create({
    data: {
      tiendaId: ctx.tienda.id,
      tipo: b.tipo,
      nombre: s(b.nombre, 80) || nombres[b.tipo],
      descuentoPct: num(b.descuentoPct, 0, 50) ?? 0,
      instrucciones: sOrNull(b.instrucciones, 500) ?? null,
      // MP queda inactivo hasta conectar la cuenta
      activo: b.tipo === 'mercadopago' ? !!v.config?.accessToken : true,
      config: v.config ?? {},
      orden: count + 1,
    },
  });
  return NextResponse.json({ pago: publico(m) });
}

export async function PUT(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const b: any = await req.json().catch(() => ({}));
  const m = await prisma.tiendaMetodoPago.findFirst({ where: { id: String(b.id || ''), tiendaId: ctx.tienda.id } });
  if (!m) return bad('Medio de pago no encontrado.', 404);

  const data: any = {
    nombre: s(b.nombre, 80) || undefined,
    descuentoPct: num(b.descuentoPct, 0, 50) ?? undefined,
    instrucciones: sOrNull(b.instrucciones, 500),
    activo: bool(b.activo),
  };
  if (b.config !== undefined) {
    const v = await validarConfig(m.tipo, b.config);
    if (v.error) return bad(v.error);
    if (m.tipo === 'mercadopago') {
      if (v.config) data.config = { ...((m.config as any) || {}), ...v.config };
    } else data.config = v.config;
  }
  if (data.activo === true && m.tipo === 'mercadopago') {
    const cfg: any = data.config || m.config || {};
    if (!cfg.accessToken) return bad('Primero conectá tu cuenta de Mercado Pago.');
  }
  if (data.activo === true && m.tipo === 'transferencia') {
    const cfg: any = data.config || m.config || {};
    if (!cfg.alias && !cfg.cbu) return bad('Cargá tu alias o CBU antes de activar la transferencia.');
  }
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
  const upd = await prisma.tiendaMetodoPago.update({ where: { id: m.id }, data });
  return NextResponse.json({ pago: publico(upd) });
}

export async function DELETE(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const id = new URL(req.url).searchParams.get('id') || '';
  await prisma.tiendaMetodoPago.deleteMany({ where: { id, tiendaId: ctx.tienda.id } });
  return NextResponse.json({ ok: true });
}
