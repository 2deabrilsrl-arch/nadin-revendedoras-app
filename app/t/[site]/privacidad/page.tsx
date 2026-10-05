import { notFound } from 'next/navigation';
import { getTiendaBySite, getLinkPrefix } from '@/lib/tienda';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Política de privacidad', robots: { index: false, follow: true } };

export default async function Page({ params }: { params: { site: string } }) {
  const tienda = await getTiendaBySite(params.site);
  if (!tienda) notFound();
  const prefix = getLinkPrefix(tienda.slug);
  const wa = (tienda.whatsapp || '').replace(/\D/g, '');
  return (
    <article className="prose mx-auto max-w-2xl px-4 py-10 text-gray-700 [&_h2]:mt-6 [&_p]:mt-2 [&_li]:mt-1">
      <h1 className="t-title text-3xl font-bold text-gray-900">Política de privacidad</h1>
      <p><strong>{tienda.nombre}</strong> es la responsable de los datos que dejás en esta tienda. Los cuidamos según la Ley 25.326 de Protección de Datos Personales.</p>
      <h2 className="text-xl font-semibold text-gray-900">Qué datos guardamos</h2>
      <ul className="list-disc pl-5">
        <li><strong>Cuando comprás:</strong> nombre, teléfono, email y dirección de entrega.</li>
        <li><strong>Cuando dejás tu email o WhatsApp</strong> en el aviso de bienvenida.</li>
        <li><strong>Cuando completás tus datos en el carrito</strong> y no terminás la compra: guardamos el carrito para poder recordártelo.</li>
        <li><strong>Visitas:</strong> contamos visitas y productos vistos de forma anónima, sin cookies de seguimiento ni datos personales.</li>
      </ul>
      <h2 className="text-xl font-semibold text-gray-900">Para qué los usamos</h2>
      <ul className="list-disc pl-5">
        <li>Preparar, cobrar y entregar tu pedido, y avisarte cómo va.</li>
        <li>Recordarte un carrito que dejaste sin terminar.</li>
        <li>Enviarte novedades y promociones, solo si nos dejaste tu dato para eso. Podés pedir que no te escribamos más en cualquier momento.</li>
      </ul>
      <p>No vendemos ni cedemos tus datos. Solo los comparte la plataforma de la tienda y, cuando corresponde, el medio de pago o de envío que elegiste.</p>
      <h2 className="text-xl font-semibold text-gray-900">Tus derechos</h2>
      <p>Podés pedir ver, corregir o borrar tus datos, o dejar de recibir mensajes, escribiéndonos{wa ? <> por <a href={`https://wa.me/${wa.length === 10 ? `549${wa}` : wa}`} target="_blank" rel="noopener">WhatsApp</a></> : null}{tienda.email ? <> o a <a href={`mailto:${tienda.email}`}>{tienda.email}</a></> : null}. Los datos de compras ya hechas pueden conservarse el tiempo que exija la ley.</p>
      <p>La Agencia de Acceso a la Información Pública, órgano de control de la Ley 25.326, atiende las denuncias y reclamos por incumplimiento de las normas de protección de datos personales.</p>
      <p className="text-sm"><a href={`${prefix}/terminos`}>Ver términos y condiciones</a></p>
    </article>
  );
}
