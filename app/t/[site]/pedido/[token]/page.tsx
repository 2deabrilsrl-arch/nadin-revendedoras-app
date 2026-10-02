// Seguimiento del pedido para la clienta (link privado por token)
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getTiendaBySite, getLinkPrefix, formatPrecio } from '@/lib/tienda';
import { verificarPagoMP } from '@/lib/tienda-checkout';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Tu pedido', robots: { index: false, follow: false } };

const ESTADOS: Record<string, string> = {
  pendiente_pago: 'Esperando el pago',
  pagada: 'Pago recibido · preparando tu pedido',
  enviada_nadin: 'Pago recibido · preparando tu pedido',
  lista: 'Listo para entregar',
  entregada: 'Entregado',
  cancelada: 'Cancelado',
};

export default async function PedidoPage({ params, searchParams }: { params: { site: string; token: string }; searchParams: Record<string, string> }) {
  const tienda = await getTiendaBySite(params.site);
  if (!tienda) notFound();
  let orden = await prisma.ordenTienda.findFirst({ where: { token: params.token, tiendaId: tienda.id }, include: { items: true } });
  if (!orden) notFound();

  // Vuelta de Mercado Pago: verificamos el pago al instante (el webhook puede tardar)
  const paymentId = searchParams.payment_id || searchParams.collection_id;
  if (orden.estado === 'pendiente_pago' && orden.metodoPagoTipo === 'mercadopago' && paymentId) {
    await verificarPagoMP(orden.id, paymentId).catch(() => false);
    orden = (await prisma.ordenTienda.findUnique({ where: { id: orden.id }, include: { items: true } }))!;
  }

  const prefix = getLinkPrefix(tienda.slug);
  const metodo = await prisma.tiendaMetodoPago.findFirst({ where: { tiendaId: tienda.id, tipo: orden.metodoPagoTipo } });
  const cfg = (metodo?.config || {}) as Record<string, string>;
  const wa = (tienda.whatsapp || '').replace(/\D/g, '');
  const msg = encodeURIComponent(`¡Hola! Hice el pedido #${orden.numero} en ${tienda.nombre} por ${formatPrecio(orden.total)}.`);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 rounded-2xl border p-6 text-center">
        <p className="text-sm text-gray-500">Pedido #{orden.numero}</p>
        <h1 className="t-title mt-1 text-2xl font-bold">{orden.estado === 'pendiente_pago' ? '¡Recibimos tu pedido!' : '¡Gracias por tu compra!'}</h1>
        <p className="mt-2 inline-block rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">{ESTADOS[orden.estado] || orden.estado}</p>
      </div>

      {orden.estado === 'pendiente_pago' && (
        <section className="mb-6 rounded-2xl border p-6">
          <h2 className="mb-2 text-lg font-semibold">Cómo pagar · {orden.metodoPagoNombre}</h2>
          <p className="mb-3 text-2xl font-bold">{formatPrecio(orden.total)}</p>
          {orden.metodoPagoTipo === 'transferencia' && (
            <dl className="space-y-1 text-sm">
              {cfg.alias && <div><dt className="inline font-semibold">Alias: </dt><dd className="inline select-all">{cfg.alias}</dd></div>}
              {cfg.cbu && <div><dt className="inline font-semibold">CBU/CVU: </dt><dd className="inline select-all">{cfg.cbu}</dd></div>}
              {cfg.titular && <div><dt className="inline font-semibold">Titular: </dt><dd className="inline">{cfg.titular}</dd></div>}
              {cfg.banco && <div><dt className="inline font-semibold">Banco: </dt><dd className="inline">{cfg.banco}</dd></div>}
            </dl>
          )}
          {orden.metodoPagoTipo === 'link' && cfg.url && /^https:\/\//.test(cfg.url) && (
            <a href={cfg.url} target="_blank" rel="noopener" className="inline-block rounded-full px-6 py-3 font-semibold text-white" style={{ background: 'var(--t-primary)' }}>Ir a pagar</a>
          )}
          {metodo?.instrucciones && <p className="mt-3 whitespace-pre-line text-sm text-gray-700">{metodo.instrucciones}</p>}
          {orden.metodoPagoTipo === 'mercadopago' && <p className="text-sm text-gray-600">Si ya pagaste, en unos minutos se actualiza el estado. Si no, escribinos.</p>}
          {wa && (
            <a href={`https://wa.me/${wa}?text=${msg}`} target="_blank" rel="noopener" className="mt-4 block rounded-full bg-[#25d366] px-6 py-3 text-center font-semibold text-white">
              Enviar comprobante por WhatsApp
            </a>
          )}
        </section>
      )}

      <section className="rounded-2xl border p-6">
        <h2 className="mb-3 text-lg font-semibold">Detalle</h2>
        <ul className="divide-y text-sm">
          {orden.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3 py-2">
              <span>{i.qty} × {i.nombre}{i.talle ? ` · ${i.talle}` : ''}{i.color ? ` · ${i.color}` : ''}</span>
              <span className="font-medium">{formatPrecio(i.precio * i.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrecio(orden.subtotal)}</dd></div>
          {orden.descuento > 0 && <div className="flex justify-between text-green-700"><dt>Descuentos</dt><dd>−{formatPrecio(orden.descuento)}</dd></div>}
          <div className="flex justify-between"><dt>{orden.envioNombre}</dt><dd>{orden.envioCosto ? formatPrecio(orden.envioCosto) : 'Gratis'}</dd></div>
          <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd>{formatPrecio(orden.total)}</dd></div>
        </dl>
      </section>

      <p className="mt-6 text-center text-sm text-gray-500">
        Guardá este link para ver el estado de tu pedido. <a href={prefix || '/'} className="underline">Seguir comprando</a>
      </p>
    </div>
  );
}
