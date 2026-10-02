// Layout de la tienda pública de cada revendedora
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { Playfair_Display, Lora } from 'next/font/google';
import { getTiendaBySite, getLinkPrefix, getTiendaBaseUrl } from '@/lib/tienda';
import { getSession } from '@/lib/session';
import { TiendaCartProvider, CartBadgeLink } from '@/components/tienda/TiendaCart';

export const dynamic = 'force-dynamic';

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-elegante', display: 'swap' });
const lora = Lora({ subsets: ['latin'], variable: '--font-clasica', display: 'swap' });

const safeColor = (c: string | null | undefined, fallback: string) => (c && /^#[0-9a-f]{3,8}$/i.test(c) ? c : fallback);

export async function generateMetadata({ params }: { params: { site: string } }): Promise<Metadata> {
  const tienda = await getTiendaBySite(params.site);
  if (!tienda) return { title: 'Tienda no encontrada', robots: { index: false, follow: false } };
  const base = getTiendaBaseUrl(tienda);
  const lugar = tienda.ciudad ? ` en ${tienda.ciudad}` : '';
  const titulo = tienda.seoTitulo || `${tienda.nombre} | Lencería y ropa interior${lugar}`;
  const descripcion =
    tienda.seoDescripcion ||
    tienda.eslogan ||
    `Comprá lencería, corpiños, bombachas y ropa interior online${lugar} en ${tienda.nombre}. Envíos y atención personalizada por WhatsApp.`;
  return {
    metadataBase: new URL(base.replace(/\/t\/[^/]+$/, '') || base),
    title: { default: titulo, template: `%s | ${tienda.nombre}` },
    description: descripcion,
    applicationName: tienda.nombre,
    manifest: null,
    robots: tienda.activa ? { index: true, follow: true } : { index: false, follow: false },
    icons: tienda.logoUrl ? { icon: tienda.logoUrl, apple: tienda.logoUrl } : undefined,
    appleWebApp: { capable: false, title: tienda.nombre },
    openGraph: {
      type: 'website',
      locale: 'es_AR',
      siteName: tienda.nombre,
      title: titulo,
      description: descripcion,
      url: base,
      images: tienda.bannerUrl || tienda.logoUrl ? [{ url: (tienda.bannerUrl || tienda.logoUrl) as string }] : [],
    },
    twitter: { card: 'summary_large_image', title: titulo, description: descripcion },
  };
}

export default async function TiendaLayout({ children, params }: { children: React.ReactNode; params: { site: string } }) {
  const tienda = await getTiendaBySite(params.site);
  if (!tienda) notFound();

  let esDuena = false;
  if (!tienda.activa) {
    const session = await getSession().catch(() => null);
    esDuena = session?.uid === tienda.userId;
    if (!esDuena) notFound();
  }

  const prefix = getLinkPrefix(tienda.slug);
  const primary = safeColor(tienda.colorPrimario, '#e11d74');
  const secondary = safeColor(tienda.colorSecundario, '#111827');
  const fontVar =
    tienda.fuente === 'elegante' ? 'var(--font-elegante)' : tienda.fuente === 'clasica' ? 'var(--font-clasica)' : 'inherit';
  const wa = (tienda.whatsapp || '').replace(/\D/g, '');
  const anio = new Date().getFullYear();
  const pixel = tienda.metaPixelId && /^\d{6,20}$/.test(tienda.metaPixelId) ? tienda.metaPixelId : null;
  const ga4 = tienda.ga4Id && /^G-[A-Z0-9]{4,15}$/i.test(tienda.ga4Id) ? tienda.ga4Id : null;

  return (
    <div
      className={`${playfair.variable} ${lora.variable} min-h-screen bg-white text-gray-900`}
      style={{ ['--t-primary' as any]: primary, ['--t-secondary' as any]: secondary, ['--t-font-title' as any]: fontVar }}
    >
      {/* Ocultamos los elementos propios de la app de revendedoras */}
      <style>{`#nadin-app-chrome,#nadin-app-chrome-bottom{display:none!important} .t-title{font-family:var(--t-font-title)}`}</style>

      <TiendaCartProvider tiendaId={tienda.id} tiendaSlug={tienda.slug} prefix={prefix}>
        {!tienda.activa && esDuena && (
          <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
            Vista previa: tu tienda todavía no está publicada. Activala desde <strong>Mi Tienda</strong> en la app.
          </div>
        )}

        <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
            <a href={prefix || '/'} className="flex min-w-0 items-center gap-2" aria-label={`${tienda.nombre} - inicio`}>
              {tienda.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tienda.logoUrl} alt={tienda.nombre} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full font-bold text-white" style={{ background: primary }}>
                  {tienda.nombre.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="t-title truncate text-lg font-bold">{tienda.nombre}</span>
            </a>
            <form action={`${prefix}/buscar`} className="ml-auto hidden flex-1 sm:block sm:max-w-sm" role="search">
              <input
                name="q"
                type="search"
                placeholder="Buscar productos"
                aria-label="Buscar productos"
                className="w-full rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-[var(--t-primary)]"
              />
            </form>
            <a href={`${prefix}/buscar`} className="ml-auto rounded-full p-2 sm:hidden" aria-label="Buscar">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            </a>
            <CartBadgeLink />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

        <footer className="mt-16 border-t border-gray-100 bg-gray-50">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm sm:grid-cols-3">
            <div>
              <p className="t-title text-base font-bold">{tienda.nombre}</p>
              {tienda.eslogan && <p className="mt-1 text-gray-600">{tienda.eslogan}</p>}
              {tienda.ciudad && <p className="mt-1 text-gray-600">{tienda.ciudad}{tienda.provincia ? `, ${tienda.provincia}` : ''}</p>}
            </div>
            <div>
              <p className="font-semibold">Contacto</p>
              <ul className="mt-2 space-y-1 text-gray-600">
                {wa && <li><a href={`https://wa.me/${wa}`} target="_blank" rel="noopener">WhatsApp</a></li>}
                {tienda.instagram && <li><a href={`https://instagram.com/${tienda.instagram.replace('@', '')}`} target="_blank" rel="noopener">Instagram</a></li>}
                {tienda.facebook && <li><a href={`https://facebook.com/${tienda.facebook}`} target="_blank" rel="noopener">Facebook</a></li>}
                {tienda.tiktok && <li><a href={`https://tiktok.com/@${tienda.tiktok.replace('@', '')}`} target="_blank" rel="noopener">TikTok</a></li>}
                {tienda.email && <li><a href={`mailto:${tienda.email}`}>{tienda.email}</a></li>}
              </ul>
            </div>
            <div>
              <p className="font-semibold">Ayuda</p>
              <ul className="mt-2 space-y-1 text-gray-600">
                <li><a href={`${prefix}/terminos`}>Términos y condiciones</a></li>
                <li><a href={`${prefix}/arrepentimiento`} className="font-semibold text-gray-900 underline">Botón de arrepentimiento</a></li>
                <li><a href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario" target="_blank" rel="noopener">Defensa del consumidor</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 py-4 text-center text-xs text-gray-500">
            © {anio} {tienda.nombre}
            {tienda.mostrarNadin && <> · Productos de <a href="https://nadinlenceria.com" target="_blank" rel="noopener" className="underline">Nadin Lencería</a></>}
          </div>
        </footer>

        {wa && (
          <a
            href={`https://wa.me/${wa}`}
            target="_blank"
            rel="noopener"
            className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg"
            aria-label="Escribinos por WhatsApp"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.8-1.2-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.2 1.4Z" /></svg>
          </a>
        )}
      </TiendaCartProvider>

      {pixel && (
        <Script id="meta-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');`}</Script>
      )}
      {ga4 && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga4}');`}</Script>
        </>
      )}
    </div>
  );
}
