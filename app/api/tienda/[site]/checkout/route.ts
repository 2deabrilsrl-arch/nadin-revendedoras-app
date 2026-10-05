// Crea la orden web. Los precios se recalculan acá: nada del navegador es confiable.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTiendaBySite, getTiendaBaseUrl, formatPrecio } from '@/lib/tienda';
import { cotizar, crearPreferenciaMP, emailOrden, escapeHtml } from '@/lib/tienda-checkout';
import { enviarNotificacionGeneral } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

const str = (v: any, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function POST(req: Request, { params }: { params: { site: string } }) {
  try {
    const tienda = await getTiendaBySite(params.site);
    if (!tienda || !tienda.activa) return NextResponse.json({ error: 'Tienda no disponible' }, { status: 404 });

    const body: any = await req.json().catch(() => ({}));
    const cliente = body.cliente || {};
    const nombre = str(cliente.nombre, 100);
    const telefono = str(cliente.telefono, 30);
    const email = str(cliente.email, 120).toLowerCase();
    const dni = str(cliente.dni, 15);
    const nota = str(body.nota, 500);

    if (nombre.length < 2) return NextResponse.json({ error: 'Completá tu nombre.' }, { status: 400 });
    if (telefono.replace(/\D/g, '').length < 8) return NextResponse.json({ error: 'Completá un teléfono válido.' }, { status: 400 });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'El email no es válido.' }, { status: 400 });
    if (!body.aceptaTerminos) return NextResponse.json({ error: 'Tenés que aceptar los términos y condiciones.' }, { status: 400 });

    const c = await cotizar(tienda, { items: body.items, envioId: body.envioId, pagoId: body.pagoId, cupon: body.cupon });
    if (c.errores.length) return NextResponse.json({ error: c.errores.join(' '), errores: c.errores }, { status: 409 });
    if (!c.lineas.length) return NextResponse.json({ error: 'El carrito está vacío.' }, { status: 400 });
    if (!c.pago) return NextResponse.json({ error: 'Elegí un medio de pago.' }, { status: 400 });
    if (!c.envio) {
      const hayEnvios = await prisma.tiendaEnvio.count({ where: { tiendaId: tienda.id, activo: true } });
      if (hayEnvios) return NextResponse.json({ error: 'Elegí una forma de entrega.' }, { status: 400 });
      c.envio = { id: '', tipo: 'coordinar', nombre: 'A coordinar con la tienda', pideDireccion: false };
    }
    if (body.cupon && c.cuponError) return NextResponse.json({ error: c.cuponError }, { status: 400 });

    let direccion: Record<string, string> | null = null;
    if (c.envio.pideDireccion) {
      const d = body.direccion || {};
      direccion = {
        calle: str(d.calle, 120), numero: str(d.numero, 20), piso: str(d.piso, 30),
        localidad: str(d.localidad, 80), provincia: str(d.provincia, 60), cp: str(d.cp, 10),
      };
      if (!direccion.calle || !direccion.numero || !direccion.localidad) {
        return NextResponse.json({ error: 'Completá la dirección de entrega.' }, { status: 400 });
      }
    }

    const orden = await prisma.$transaction(async (tx) => {
      if (c.cupon) {
        // reserva de uso del cupón (respeta usosMax aunque haya compras simultáneas)
        const ok = await tx.$executeRaw`UPDATE "TiendaCupon" SET "usos" = "usos" + 1 WHERE "id" = ${c.cupon.id} AND ("usosMax" IS NULL OR "usos" < "usosMax")`;
        if (!ok) throw new Error('CUPON_AGOTADO');
      }
      return tx.ordenTienda.create({
        data: {
          tiendaId: tienda.id,
          metodoPagoTipo: c.pago!.tipo,
          metodoPagoNombre: c.pago!.nombre,
          envioTipo: c.envio!.tipo,
          envioNombre: c.envio!.nombre,
          envioCosto: c.envioCosto,
          subtotal: c.subtotal,
          descuento: c.descuentoCupon + c.descuentoPago,
          descuentoPromo: c.descuentoPromo,
          promosTexto: c.promos.join(' · ').slice(0, 300) || null,
          cuponCodigo: c.cupon?.codigo || null,
          total: c.total,
          totalMayorista: c.totalMayorista,
          clienteNombre: nombre,
          clienteEmail: email || null,
          clienteTelefono: telefono,
          clienteDni: dni || null,
          direccion: direccion || undefined,
          nota: nota || null,
          items: { create: c.lineas.map((l) => ({ ...l, imagen: l.imagen || null })) },
        },
      });
    });

    // Si venía de un carrito guardado, lo marcamos como recuperado
    const carritoToken = str(body.carritoToken, 60);
    if (carritoToken) {
      await prisma.tiendaCarrito.updateMany({ where: { token: carritoToken, tiendaId: tienda.id }, data: { estado: 'recuperado', ordenId: orden.id } }).catch(() => {});
    }

    let redirectUrl: string | null = null;
    if (c.pago.tipo === 'mercadopago') {
      const pref = await crearPreferenciaMP(tienda, orden);
      if (pref) {
        await prisma.ordenTienda.update({ where: { id: orden.id }, data: { mpPreferenceId: pref.id } });
        redirectUrl = pref.initPoint;
      }
    }

    // Avisos (no bloquean la compra)
    const base = getTiendaBaseUrl(tienda);
    const linkPedido = `${base}/pedido/${orden.token}`;
    enviarNotificacionGeneral({
      userId: tienda.userId,
      tipo: 'tienda_orden_nueva',
      titulo: `🛍️ Nuevo pedido web #${orden.numero}`,
      mensaje: `${nombre} compró por ${formatPrecio(orden.total)} (${c.pago.nombre}). Pendiente de pago.`,
      metadata: JSON.stringify({ ordenId: orden.id }),
    }).catch(() => {});
    emailOrden(
      email,
      `Recibimos tu pedido #${orden.numero} - ${tienda.nombre}`,
      `<p>¡Hola ${escapeHtml(nombre)}!</p><p>Recibimos tu pedido <strong>#${orden.numero}</strong> por <strong>${formatPrecio(orden.total)}</strong>.</p>
       <p>Podés ver el estado y cómo pagar acá: <a href="${linkPedido}">${linkPedido}</a></p><p>${escapeHtml(tienda.nombre)}</p>`,
      tienda.email
    ).catch(() => {});

    return NextResponse.json({ ok: true, token: orden.token, numero: orden.numero, redirectUrl });
  } catch (e: any) {
    if (e?.message === 'CUPON_AGOTADO') return NextResponse.json({ error: 'El cupón ya alcanzó su límite de usos.' }, { status: 409 });
    console.error('checkout tienda', e);
    return NextResponse.json({ error: 'No pudimos crear el pedido. Probá de nuevo.' }, { status: 500 });
  }
}
