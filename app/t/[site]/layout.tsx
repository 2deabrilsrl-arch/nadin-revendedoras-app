// Layout de la tienda pública de cada revendedora
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { Playfair_Display, Lora, Montserrat } from 'next/font/google';
import {
  getTiendaBySite, getLinkPrefix, getTiendaBaseUrl, getCatalogoTienda, buildCategorias, getPagosPublicos,
} from '@/lib/tienda';
import { normalizarDiseno, getPlantilla } from '@/lib/tienda-diseno';
import { getSession } from '@/lib/session';
import { TiendaCartProvider } from '@/components/tienda/TiendaCart';
import HeaderTienda from '@/components/tienda/HeaderTienda';
import Icon from '@/components/tienda/Icon';
import PreviewEditable from '@/components/tienda/PreviewEditable';
import PopupBienvenida from '@/components/tienda/PopupBienvenida';
import Tracker from '@/components/tienda/Tracker';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-elegante', display: 'swap' });
const lora = Lora({ subsets: ['latin'], variable: '--font-clasica', display: 'swap' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-moderna', display: 'swap' });

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

const ESTILOS_CSS = `
#nadin-app-chrome,#nadin-app-chrome-bottom{display:none!important}
.tienda[data-cm="1"] .t-grid{grid-template-columns:minmax(0,1fr)}
@media(min-width:1024px){.tienda[data-cd="3"] .t-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.tienda[data-cd="4"] .t-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.tienda[data-cd="5"] .t-grid{grid-template-columns:repeat(5,minmax(0,1fr))}}
.tienda[data-sf="0"] .t-foto2{display:none!important}
@keyframes t-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.t-marquee{display:flex;width:max-content;animation:t-marquee 28s linear infinite}
.t-marquee:hover{animation-play-state:paused}
@media(prefers-reduced-motion:reduce){.t-marquee{animation:none}}
.tienda{--t-radius:2px;--t-btn-radius:2px;--t-bg:#fff;--t-tint:color-mix(in srgb,var(--t-primary) 8%,#fff);background:var(--t-bg);font-family:var(--font-moderna),system-ui,sans-serif;color:#1f2937}
.tienda .t-title{font-family:var(--t-font-title);letter-spacing:.01em;color:var(--t-secondary)}
.tienda .t-h{font-family:var(--t-font-title);font-size:.95rem;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--t-secondary)}
.tienda .t-btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;background:var(--t-primary);color:#fff;border-radius:var(--t-btn-radius);padding:.85rem 1.75rem;font-size:.78rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;transition:opacity .2s}
.tienda .t-btn:hover{opacity:.9}.tienda .t-btn:disabled{opacity:.45}
.tienda .t-btn-outline{display:inline-flex;align-items:center;justify-content:center;border:1px solid currentColor;border-radius:var(--t-btn-radius);padding:.8rem 1.5rem;font-size:.78rem;letter-spacing:.12em;text-transform:uppercase}
.tienda .t-btn-light{background:#fff;color:#111;border-radius:var(--t-btn-radius);padding:.85rem 1.75rem;font-size:.75rem;font-weight:600;letter-spacing:.16em;text-transform:uppercase}
.tienda .t-badge{border-radius:var(--t-btn-radius);padding:.2rem .55rem;font-size:.68rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase}
.tienda .t-hero-band{background:var(--t-tint)}
.tienda .t-benefits{background:#fff}
.tienda .t-cta-band{background:var(--t-tint)}
/* Tarjetas */
.t-lazy-sec{content-visibility:auto;contain-intrinsic-size:auto 900px}
.tienda[data-tarjeta=enmarcada] .t-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:calc(var(--t-radius) + 4px);padding:.5rem;transition:box-shadow .3s}
.tienda[data-tarjeta=enmarcada] .t-card:hover{box-shadow:0 10px 30px -12px rgba(0,0,0,.18)}
.tienda[data-tarjeta=enmarcada] .t-card-body{padding:0 .35rem .35rem}
.tienda[data-tarjeta=fondo] .t-card-media{background:var(--t-tint)}
.tienda[data-tarjeta=fondo] .t-card-body{padding:.25rem .25rem 0}
/* Plantilla Atelier */
.tienda[data-plantilla=atelier]{--t-radius:16px;--t-btn-radius:999px;--t-bg:color-mix(in srgb,var(--t-primary) 4%,#fff)}
.tienda[data-plantilla=atelier] .t-h{font-size:1.75rem;font-weight:500;letter-spacing:.01em;text-transform:none}
.tienda[data-plantilla=atelier] .t-benefits{background:transparent}
/* Plantilla Urbana */
.tienda[data-plantilla=urbana]{--t-radius:0px;--t-btn-radius:0px}
.tienda[data-plantilla=urbana] .t-h{font-size:clamp(1.5rem,3vw,2.2rem);font-weight:800;letter-spacing:-.01em}
.tienda[data-plantilla=urbana] .t-title{font-weight:800;text-transform:uppercase;letter-spacing:-.01em}
.tienda[data-plantilla=urbana] .t-hero-band,.tienda[data-plantilla=urbana] .t-cta-band{background:var(--t-primary);color:#fff}
.tienda[data-plantilla=urbana] .t-hero-band .t-title,.tienda[data-plantilla=urbana] .t-cta-band .t-title{color:#fff}
.tienda[data-plantilla=urbana] .t-hero-band .t-btn,.tienda[data-plantilla=urbana] .t-cta-band .t-btn{background:#fff;color:#111}
.tienda[data-plantilla=urbana] .t-benefits{background:var(--t-secondary);color:#fff}
/* Plantilla Aurora */
.tienda[data-plantilla=aurora]{--t-radius:8px;--t-btn-radius:6px;--t-bg:#fffaf7}
.tienda[data-plantilla=aurora] .t-h{font-size:1.6rem;font-weight:500;font-style:italic;letter-spacing:0;text-transform:none}
.tienda[data-plantilla=aurora] .t-benefits{background:transparent;border-top:1px solid rgba(0,0,0,.05)}
`;

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
  const home = prefix || '/';
  const diseno = normalizarDiseno(tienda.diseno);
  const plantilla = getPlantilla(diseno.plantilla);
  const [productos, pagos] = await Promise.all([getCatalogoTienda(tienda), getPagosPublicos(tienda.id)]);
  const categoriasTodas = buildCategorias(productos).slice(0, 7).map((c) => ({
    nombre: c.nombre,
    href: `${prefix}/categoria/${c.path.join('/')}`,
    hijos: c.hijos.slice(0, 10).map((h) => ({ nombre: h.nombre, href: `${prefix}/categoria/${h.path.join('/')}` })),
  }));
  // Menú: categorías (si las quiere mostrar) + links propios (páginas, categorías, externos)
  const enlaceMenu = (l: string) => (l.startsWith('/') ? `${prefix}${l}` : l);
  const categorias = [
    ...(diseno.menu.categorias ? categoriasTodas : []),
    ...diseno.menu.extras.map((x) => ({ nombre: x.titulo, href: enlaceMenu(x.link), hijos: [] as { nombre: string; href: string }[] })),
  ];
  const paginas = await prisma.tiendaPagina.findMany({ where: { tiendaId: tienda.id, visible: true, enPie: true }, orderBy: [{ orden: 'asc' }, { createdAt: 'asc' }], select: { slug: true, titulo: true } });

  const primary = safeColor(tienda.colorPrimario, '#e11d74');
  const secondary = safeColor(tienda.colorSecundario, '#111827');
  // "moderna" (valor por defecto) = usar la tipografía de la plantilla
  const fuente = tienda.fuente && tienda.fuente !== 'moderna' ? tienda.fuente : plantilla.fuenteTitulos;
  const fontVar = fuente === 'elegante' ? 'var(--font-elegante)' : fuente === 'clasica' ? 'var(--font-clasica)' : 'var(--font-moderna)';
  const wa = (tienda.whatsapp || '').replace(/\D/g, '');
  const anio = new Date().getFullYear();
  const pixel = tienda.metaPixelId && /^\d{6,20}$/.test(tienda.metaPixelId) ? tienda.metaPixelId : null;
  const ga4 = tienda.ga4Id && /^G-[A-Z0-9]{4,15}$/i.test(tienda.ga4Id) ? tienda.ga4Id : null;
  const anuncioHref = diseno.anuncio.link ? (diseno.anuncio.link.startsWith('/') ? `${prefix}${diseno.anuncio.link}` : diseno.anuncio.link) : null;
  const nombresPago: Record<string, string> = { transferencia: 'Transferencia', mercadopago: 'Mercado Pago', link: 'Tarjetas', efectivo: 'Efectivo' };

  return (
    <div
      className={`tienda ${playfair.variable} ${lora.variable} ${montserrat.variable} min-h-screen`}
      data-plantilla={plantilla.id}
      data-tarjeta={plantilla.tarjeta}
      data-cm={diseno.listado.colMobile}
      data-cd={diseno.listado.colDesktop}
      data-sf={diseno.listado.segundaFoto ? '1' : '0'}
      style={{ ['--t-primary' as any]: primary, ['--t-secondary' as any]: secondary, ['--t-font-title' as any]: fontVar }}
    >
      <style>{ESTILOS_CSS}</style>

      <TiendaCartProvider tiendaId={tienda.id} tiendaSlug={tienda.slug} prefix={prefix}>
        {!tienda.activa && esDuena && (
          <div className="bg-amber-100 px-4 py-2 text-center text-xs text-amber-900">
            Vista previa: tu tienda todavía no está publicada. Activala desde <strong>Mi Tienda Web</strong> en la app.
          </div>
        )}

        {(tienda as any).modoEditor && <PreviewEditable />}
        {tienda.activa && !(tienda as any).modoEditor && <Tracker apiBase={`/api/tienda/${tienda.slug}`} />}
        {(tienda.activa || (tienda as any).modoEditor) && (
          <PopupBienvenida popup={diseno.popup} tiendaId={tienda.id} apiBase={`/api/tienda/${tienda.slug}`} enEditor={!!(tienda as any).modoEditor} tiendaNombre={tienda.nombre} privacidadHref={`${prefix}/privacidad`} />
        )}
        {(tienda as any).enBorrador && (
          <div className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-blue-600 px-4 py-2 text-xs text-white">
            <span>Estás viendo el <strong>borrador</strong> de tu diseño (todavía no está publicado).</span>
            <a href={`/api/mi-tienda/preview?volver=${encodeURIComponent(home)}`} className="underline">Ver la versión publicada</a>
          </div>
        )}

        {diseno.anuncio.activo && (
          <div className="overflow-hidden px-4 py-2 text-xs font-medium tracking-wide text-white" style={{ background: secondary }} data-sec="__encabezado" data-sec-nombre="Barra de anuncios">
            {diseno.anuncio.desliza ? (
              <div className="t-marquee" aria-label={diseno.anuncio.mensajes.join(' · ')}>
                {[0, 1].map((k) => (
                  <div key={k} className="flex shrink-0" aria-hidden={k === 1}>
                    {[...diseno.anuncio.mensajes, ...diseno.anuncio.mensajes].map((m, j) => <span key={j} className="px-8 uppercase">{m}</span>)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-1 text-center">
                {diseno.anuncio.mensajes.map((m, j) => (
                  <span key={j} className={j > 0 ? 'hidden sm:inline' : ''}>
                    {anuncioHref ? <a href={anuncioHref} className="hover:underline">{m}</a> : m}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <HeaderTienda variante={diseno.header === 'auto' ? plantilla.header : diseno.header} nombre={tienda.nombre} logoUrl={tienda.logoUrl} home={home} buscarHref={`${prefix}/buscar`} categorias={categorias} />

        <main>{children}</main>

        <footer className="mt-20 border-t border-black/5 bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="t-title text-lg">{tienda.nombre}</p>
              {tienda.eslogan && <p className="mt-2 text-gray-500">{tienda.eslogan}</p>}
              {tienda.ciudad && <p className="mt-2 text-gray-500">{tienda.ciudad}{tienda.provincia ? `, ${tienda.provincia}` : ''}</p>}
              <div className="mt-4 flex gap-3 text-gray-700">
                {tienda.instagram && <a href={`https://instagram.com/${tienda.instagram.replace('@', '')}`} target="_blank" rel="noopener" aria-label="Instagram"><Icon name="instagram" /></a>}
                {tienda.facebook && <a href={`https://facebook.com/${tienda.facebook}`} target="_blank" rel="noopener" aria-label="Facebook"><Icon name="facebook" /></a>}
                {tienda.tiktok && <a href={`https://tiktok.com/@${tienda.tiktok.replace('@', '')}`} target="_blank" rel="noopener" aria-label="TikTok"><Icon name="tiktok" /></a>}
              </div>
            </div>
            {categoriasTodas.length > 0 && (
              <div>
                <p className="t-h !text-xs">Categorías</p>
                <ul className="mt-4 space-y-2 text-gray-600">
                  {categoriasTodas.slice(0, 6).map((c) => <li key={c.href}><a href={c.href} className="hover:text-gray-900">{c.nombre}</a></li>)}
                </ul>
              </div>
            )}
            <div>
              <p className="t-h !text-xs">Ayuda</p>
              <ul className="mt-4 space-y-2 text-gray-600">
                {paginas.map((pg) => <li key={pg.slug}><a href={`${prefix}/p/${pg.slug}`} className="hover:text-gray-900">{pg.titulo}</a></li>)}
                {wa && <li><a href={`https://wa.me/${wa}`} target="_blank" rel="noopener" className="hover:text-gray-900">Escribinos por WhatsApp</a></li>}
                {tienda.email && <li><a href={`mailto:${tienda.email}`} className="hover:text-gray-900">{tienda.email}</a></li>}
                <li><a href={`${prefix}/terminos`} className="hover:text-gray-900">Términos y condiciones</a></li>
                <li><a href={`${prefix}/privacidad`} className="hover:text-gray-900">Privacidad</a></li>
                <li><a href={`${prefix}/arrepentimiento`} className="hover:text-gray-900">Botón de arrepentimiento</a></li>
                <li><a href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario" target="_blank" rel="noopener" className="hover:text-gray-900">Defensa del consumidor</a></li>
              </ul>
            </div>
            {pagos.tipos.length > 0 && (
              <div>
                <p className="t-h !text-xs">Medios de pago</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {pagos.tipos.map((t) => <li key={t} className="rounded border border-gray-200 px-2.5 py-1 text-xs text-gray-600">{nombresPago[t] || t}</li>)}
                </ul>
              </div>
            )}
          </div>
          <div className="border-t border-black/5 py-5 text-center text-xs text-gray-400">
            © {anio} {tienda.nombre}
            {tienda.mostrarNadin && <> · Productos de <a href="https://nadinlenceria.com" target="_blank" rel="noopener" className="underline">Nadin Lencería</a></>}
          </div>
        </footer>

        {wa && (
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener" aria-label="Escribinos por WhatsApp"
            className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg">
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
