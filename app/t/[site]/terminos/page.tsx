import { notFound } from 'next/navigation';
import { getTiendaBySite, getLinkPrefix } from '@/lib/tienda';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Términos y condiciones', robots: { index: false, follow: true } };

export default async function Page({ params }: { params: { site: string } }) {
  const tienda = await getTiendaBySite(params.site);
  if (!tienda) notFound();
  const prefix = getLinkPrefix(tienda.slug);
  return (
    <article className="prose mx-auto max-w-2xl text-gray-700">
      <h1 className="t-title text-3xl font-bold text-gray-900">Términos y condiciones</h1>
      <p><strong>{tienda.nombre}</strong> es la vendedora de los productos ofrecidos en esta tienda y la responsable de la venta, el cobro y la atención.</p>
      <h2 className="text-xl font-semibold text-gray-900">Precios y stock</h2>
      <p>Los precios están expresados en pesos argentinos. El stock se actualiza periódicamente; si al confirmar tu pedido algún producto no estuviera disponible, te vamos a contactar para ofrecerte un cambio o devolverte el importe de ese producto.</p>
      <h2 className="text-xl font-semibold text-gray-900">Pagos</h2>
      <p>El pedido se confirma una vez acreditado el pago con el medio elegido.</p>
      <h2 className="text-xl font-semibold text-gray-900">Envíos y entregas</h2>
      <p>Los plazos y costos de entrega se informan al momento de la compra según la opción elegida.</p>
      <h2 className="text-xl font-semibold text-gray-900">Cambios y devoluciones</h2>
      <p>Por razones de higiene, la ropa interior y lencería solo puede cambiarse sin uso, con etiquetas y en su empaque original. Podés cancelar tu compra dentro de los 10 días corridos desde la entrega usando el <a href={`${prefix}/arrepentimiento`}>botón de arrepentimiento</a>.</p>
      <h2 className="text-xl font-semibold text-gray-900">Datos personales</h2>
      <p>Usamos tus datos solo para gestionar tu pedido y comunicarnos con vos. Podés pedir su actualización o eliminación escribiéndonos. La Agencia de Acceso a la Información Pública es el órgano de control de la Ley 25.326.</p>
      <h2 className="text-xl font-semibold text-gray-900">Defensa del consumidor</h2>
      <p>Ante cualquier reclamo podés contactarnos o acudir a <a href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario" target="_blank" rel="noopener">Defensa de las y los Consumidores</a>.</p>
    </article>
  );
}
