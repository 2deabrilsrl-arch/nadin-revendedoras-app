// Render de las secciones modulares de la home (server component)
import type { Seccion } from '@/lib/tienda-diseno';
import { youtubeId } from '@/lib/tienda-diseno';
import type { ProductoTienda, CategoriaNodo, TiendaConUser } from '@/lib/tienda';
import { filtrarPorCategoria, PAGE_SIZE } from '@/lib/tienda';
import ProductGrid, { Paginacion, TituloSeccion, tnImg } from './ProductGrid';
import HeroCarousel from './HeroCarousel';
import Icon from './Icon';

interface Ctx {
  tienda: TiendaConUser;
  prefix: string;
  productos: ProductoTienda[]; // solo disponibles
  categorias: CategoriaNodo[];
  descTransfer: number;
  page: number;
}

export default function Secciones({ secciones, ctx }: { secciones: Seccion[]; ctx: Ctx }) {
  const visibles = secciones.filter((s) => s.visible);
  // En páginas 2+ solo mostramos la grilla de "todos"
  const lista = ctx.page > 1 ? visibles.filter((s) => s.tipo === 'productos' && s.fuente === 'todos') : visibles;
  let primeraTodos = true;
  return (
    <>
      {lista[0]?.tipo !== 'carrusel' && <h1 className="sr-only">{ctx.tienda.nombre}</h1>}
      {lista.map((s, i) => {
        const esTodos = s.tipo === 'productos' && s.fuente === 'todos' && primeraTodos;
        if (esTodos) primeraTodos = false;
        return <Bloque key={s.id} s={s} ctx={ctx} primera={i === 0} paginar={esTodos} />;
      })}
    </>
  );
}

const enlace = (prefix: string, l?: string) => (l ? (l.startsWith('/') ? `${prefix}${l}` : l) : undefined);

function Contenedor({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`mx-auto max-w-7xl px-4 ${className}`}>{children}</section>;
}

function Bloque({ s, ctx, primera, paginar }: { s: Seccion; ctx: Ctx; primera: boolean; paginar: boolean }) {
  const { tienda, prefix, productos, categorias, descTransfer } = ctx;

  switch (s.tipo) {
    case 'carrusel': {
      const slides = s.slides.length
        ? s.slides.map((x) => ({ ...x, href: enlace(prefix, x.link) }))
        : tienda.bannerUrl
          ? [{ imagen: tienda.bannerUrl, titulo: tienda.nombre, texto: tienda.eslogan || undefined, boton: 'Ver productos', href: '#productos' }]
          : [];
      if (slides.length) return <div className="t-sec-full">{primera && <h1 className="sr-only">{tienda.nombre}</h1>}<HeroCarousel slides={slides} /></div>;
      return (
        <section className="t-hero-band px-4 py-16 text-center sm:py-24">
          {primera ? <h1 className="t-title text-4xl sm:text-6xl">{tienda.nombre}</h1> : <p className="t-title text-4xl sm:text-6xl">{tienda.nombre}</p>}
          {tienda.eslogan && <p className="mx-auto mt-4 max-w-xl opacity-80">{tienda.eslogan}</p>}
          <a href="#productos" className="t-btn mt-8">Ver productos</a>
        </section>
      );
    }

    case 'beneficios':
      if (!s.items.length) return null;
      return (
        <section className="t-benefits border-b border-black/5">
          <ul className={`mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-6 sm:gap-6 ${s.items.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} ${s.items.length === 4 ? 'lg:grid-cols-4' : ''}`}>
            {s.items.map((b) => (
              <li key={b.titulo} className="flex items-center gap-3 sm:justify-center">
                <span style={{ color: 'var(--t-primary)' }}><Icon name={b.icono} size={28} strokeWidth={1.3} /></span>
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-[0.12em]">{b.titulo}</span>
                  {b.texto && <span className="block text-xs opacity-60">{b.texto}</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      );

    case 'categorias': {
      const tiles = categorias.slice(0, s.cantidad).map((c) => {
        const p = productos.find((x) => x.categorySlugs[0] === c.slug && x.image);
        return { nombre: c.nombre, href: `${prefix}/categoria/${c.path.join('/')}`, imagen: p?.image || '' };
      }).filter((c) => c.imagen);
      if (tiles.length < 2) return null;
      return (
        <Contenedor className="pt-14">
          {s.titulo && <TituloSeccion>{s.titulo}</TituloSeccion>}
          {s.formato === 'circulos' ? (
            <ul className="-mx-4 flex gap-5 overflow-x-auto px-4 pb-2 sm:justify-center">
              {tiles.map((c) => (
                <li key={c.href} className="w-24 shrink-0 text-center sm:w-32">
                  <a href={c.href} className="group block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={tnImg(c.imagen, 320)} alt={c.nombre} loading="lazy" className="aspect-square w-full rounded-full object-cover ring-1 ring-black/5 transition group-hover:ring-2 group-hover:ring-[var(--t-primary)]" />
                    <span className="mt-2 block text-xs uppercase tracking-[0.1em]">{c.nombre}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <ul className={`grid grid-cols-2 gap-3 sm:gap-5 ${tiles.length >= 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
              {tiles.map((c) => (
                <li key={c.href}>
                  <a href={c.href} className="group relative block overflow-hidden rounded-[var(--t-radius)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={tnImg(c.imagen, 640)} alt={c.nombre} loading="lazy" className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105" />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4 pt-12 text-center text-sm font-semibold uppercase tracking-[0.14em] text-white">{c.nombre}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Contenedor>
      );
    }

    case 'productos': {
      let lista: ProductoTienda[] = productos;
      let verTodo: string | undefined;
      if (s.fuente === 'destacados') lista = productos.filter((p) => p.destacado);
      if (s.fuente === 'mas_vendidos') lista = [...productos].sort((a, b) => a.rank - b.rank);
      if (s.fuente === 'categoria' && s.categoria) {
        const path = s.categoria.split('/').filter(Boolean);
        lista = filtrarPorCategoria(productos, path);
        verTodo = `${prefix}/categoria/${path.join('/')}`;
      }
      if (paginar) {
        const pagina = lista.slice((ctx.page - 1) * PAGE_SIZE, ctx.page * PAGE_SIZE);
        return (
          <Contenedor className="scroll-mt-28 pt-16">
            <div id="productos" />
            {(s.titulo || ctx.page > 1) && <TituloSeccion>{ctx.page > 1 ? `${s.titulo || 'Productos'} · página ${ctx.page}` : s.titulo}</TituloSeccion>}
            <ProductGrid productos={pagina} prefix={prefix} descTransfer={descTransfer} />
            <Paginacion page={ctx.page} total={lista.length} pageSize={PAGE_SIZE} baseHref={prefix || '/'} />
          </Contenedor>
        );
      }
      const items = lista.slice(0, s.cantidad);
      if (items.length < 2) return null;
      return (
        <Contenedor className="pt-16">
          {s.titulo && <TituloSeccion href={verTodo}>{s.titulo}</TituloSeccion>}
          <ProductGrid productos={items} prefix={prefix} descTransfer={descTransfer} formato={s.formato} />
        </Contenedor>
      );
    }

    case 'banners':
      if (!s.items.length) return null;
      return (
        <Contenedor className="pt-14">
          <ul className={`grid gap-3 sm:gap-5 ${s.items.length === 1 ? '' : s.items.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
            {s.items.map((b, k) => {
              const href = enlace(prefix, b.link);
              const inner = (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.imagen} alt={b.titulo || ''} loading="lazy" className={`w-full object-cover transition duration-500 group-hover:scale-105 ${s.items.length === 1 ? 'aspect-[21/8]' : 'aspect-[4/5] sm:aspect-[4/3]'}`} />
                  {b.titulo && <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-5 pt-14 text-sm font-semibold uppercase tracking-[0.14em] text-white">{b.titulo}</span>}
                </>
              );
              return (
                <li key={k} className="group relative overflow-hidden rounded-[var(--t-radius)]">
                  {href ? <a href={href} className="block">{inner}</a> : inner}
                </li>
              );
            })}
          </ul>
        </Contenedor>
      );

    case 'imagen_texto': {
      const href = enlace(prefix, s.link);
      return (
        <Contenedor className="pt-16">
          <div className={`grid items-center gap-8 overflow-hidden rounded-[var(--t-radius)] md:grid-cols-2 ${s.lado === 'der' ? 'md:[&>*:first-child]:order-2' : ''}`}>
            {s.imagen ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.imagen} alt={s.titulo} loading="lazy" className="aspect-[4/5] w-full rounded-[var(--t-radius)] object-cover md:aspect-square" />
            ) : <div className="aspect-square w-full rounded-[var(--t-radius)] bg-gray-100" />}
            <div className="px-2 text-center md:px-10 md:text-left">
              {s.titulo && <h2 className="t-title text-3xl sm:text-4xl">{s.titulo}</h2>}
              {s.texto && <p className="mt-4 whitespace-pre-line leading-relaxed opacity-75">{s.texto}</p>}
              {s.boton && href && <a href={href} className="t-btn mt-8">{s.boton}</a>}
            </div>
          </div>
        </Contenedor>
      );
    }

    case 'texto': {
      const texto = s.texto || tienda.descripcion || '';
      if (!texto) return null;
      return (
        <Contenedor className="pt-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="t-h mb-4">{s.titulo || `Sobre ${tienda.nombre}`}</h2>
            <p className="whitespace-pre-line leading-relaxed opacity-75">{texto}</p>
          </div>
        </Contenedor>
      );
    }

    case 'video': {
      const vid = youtubeId(s.url);
      if (!vid) return null;
      return (
        <Contenedor className="pt-16">
          {s.titulo && <TituloSeccion>{s.titulo}</TituloSeccion>}
          <div className="aspect-video overflow-hidden rounded-[var(--t-radius)] bg-black">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${vid}`}
              title={s.titulo || 'Video'}
              loading="lazy"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </Contenedor>
      );
    }

    case 'redes': {
      const wa = (tienda.whatsapp || '').replace(/\D/g, '');
      const ig = tienda.instagram?.replace('@', '');
      if (!wa && !ig) return null;
      return (
        <Contenedor className="pt-16">
          <div className="t-cta-band rounded-[var(--t-radius)] px-6 py-12 text-center">
            {s.titulo && <h2 className="t-title text-2xl sm:text-3xl">{s.titulo}</h2>}
            {s.texto && <p className="mx-auto mt-3 max-w-lg opacity-75">{s.texto}</p>}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {ig && <a href={`https://instagram.com/${ig}`} target="_blank" rel="noopener" className="t-btn"><Icon name="instagram" size={18} /> @{ig}</a>}
              {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener" className="t-btn-outline">Escribinos por WhatsApp</a>}
            </div>
          </div>
        </Contenedor>
      );
    }
  }
}
