// Página pública para promocionar "Tu Tienda" (link del banner y del menú de nadinlenceria.com)
import Link from 'next/link';
import InstalarApp from '@/components/landing/InstalarApp';

export const metadata = {
  title: 'Tu Tienda Nadin — tu tienda online gratis',
  description: 'Creá gratis tu propia tienda online con los productos de Nadin Lencería. Vos ponés tu ganancia, cobrás en tu Mercado Pago y Nadin arma tus pedidos.',
  openGraph: {
    title: 'Tu Tienda Nadin — tu tienda online gratis',
    description: 'Tu propia tienda online con los productos de Nadin ya cargados. Gratis para revendedoras.',
  },
};

const WA = 'https://wa.me/5493416422033?text=' + encodeURIComponent('¡Hola Nadin! Quiero saber más sobre Tu Tienda.');

const BENEFICIOS = [
  { i: '🛍️', t: 'Productos ya cargados', d: 'Todo el catálogo de Nadin con fotos, talles y stock actualizado al momento.' },
  { i: '💸', t: 'Vos ponés tu ganancia', d: 'Elegís tu % y los precios se calculan solos. Las ofertas de Nadin también bajan tu costo.' },
  { i: '💳', t: 'Cobrás en tu cuenta', d: 'Mercado Pago, transferencia o efectivo. La plata va directo a vos.' },
  { i: '📦', t: 'Nadin arma tu pedido', d: 'Con un toque mandás los pedidos a Nadin y te los prepara. Sin cargar nada a mano.' },
  { i: '🎨', t: 'Con tu marca', d: 'Tu nombre, tu logo, tus colores y plantillas listas. También tu propio dominio si querés.' },
  { i: '➕', t: 'Sumá tus productos', d: 'Además de Nadin, podés vender lo tuyo en la misma tienda.' },
];

const PASOS = [
  { t: 'Registrate gratis', d: 'Creá tu cuenta de revendedora en un minuto.' },
  { t: 'Armá tu tienda', d: 'Elegí nombre, logo y diseño. Activá cómo cobrás y cómo entregás.' },
  { t: 'Compartí tu link', d: 'Mandalo por WhatsApp, Instagram y estados. Tus clientas compran solas.' },
];

function Celular() {
  return (
    <div className="relative mx-auto w-[230px] rounded-[2.2rem] bg-gray-900 p-2.5 shadow-2xl sm:w-[260px]" aria-hidden="true">
      <div className="overflow-hidden rounded-[1.7rem] bg-white">
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <span className="text-[10px] font-bold tracking-[0.2em] text-gray-900">TU TIENDA</span>
          <span className="h-4 w-4 rounded-full bg-pink-100" />
        </div>
        <div className="mx-3 flex h-24 items-end rounded-xl bg-gradient-to-br from-pink-500 to-fuchsia-700 p-3">
          <span className="text-sm font-bold leading-tight text-white">Nueva colección<br /><span className="text-[10px] font-normal opacity-90">Envíos a todo el país</span></span>
        </div>
        <div className="grid grid-cols-2 gap-2 p-3">
          {['bg-pink-200', 'bg-rose-100', 'bg-fuchsia-100', 'bg-pink-100'].map((c, k) => (
            <div key={k} className="space-y-1">
              <div className={`h-20 rounded-lg ${c}`} />
              <div className="h-1.5 w-4/5 rounded bg-gray-200" />
              <div className="h-1.5 w-1/2 rounded bg-pink-400" />
            </div>
          ))}
        </div>
        <div className="mx-3 mb-4 rounded-full bg-pink-600 py-2 text-center text-[10px] font-bold tracking-widest text-white">COMPRAR</div>
      </div>
    </div>
  );
}

export default function TuTiendaPage() {
  return (
    <main className="min-h-screen scroll-smooth bg-white text-gray-900">
      <section className="relative overflow-hidden bg-gradient-to-br from-pink-600 via-fuchsia-600 to-rose-600 text-white">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/10" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 md:grid-cols-2 md:py-14">
          <div className="space-y-5 text-center md:text-left">
            <p className="inline-block rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em]">Nadin Lencería · Revendedoras</p>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">Tu propia tienda online, <span className="text-pink-100 underline decoration-white/40 underline-offset-8">gratis</span></h1>
            <p className="text-lg text-pink-50">Vendé los productos de Nadin con tu marca. Vos ponés tu ganancia, tus clientas compran solas y nosotros armamos tus pedidos.</p>
            <div className="flex flex-col items-center gap-3 sm:flex-row md:justify-start">
              <Link href="/registro" className="w-full rounded-full bg-white px-8 py-3.5 text-center text-sm font-bold text-pink-700 shadow-lg hover:bg-pink-50 sm:w-auto">Crear mi tienda gratis</Link>
              <Link href="/login" className="text-sm font-semibold text-white underline underline-offset-4">Ya tengo cuenta · Ingresar</Link>
            </div>
            <div className="flex justify-center md:justify-start"><InstalarApp /></div>
          </div>
          <Celular />
        </div>
        {/* Invita a bajar: hay más información abajo */}
        <a href="#beneficios" className="relative mx-auto -mt-4 flex w-max flex-col items-center gap-1 pb-6 text-sm font-semibold text-white/90 hover:text-white md:-mt-8">
          Conocé cómo funciona
          <svg className="animate-bounce" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
        </a>
      </section>

      <section id="beneficios" className="mx-auto max-w-6xl scroll-mt-4 px-5 py-14">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">Todo lo que necesitás para vender online</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFICIOS.map((b) => (
            <div key={b.t} className="rounded-2xl bg-pink-50/60 p-5 ring-1 ring-pink-100">
              <p className="text-2xl">{b.i}</p>
              <p className="mt-2 font-semibold">{b.t}</p>
              <p className="mt-1 text-sm text-gray-600">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="mx-auto max-w-4xl px-5 py-14">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Empezá en 3 pasos</h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {PASOS.map((p, k) => (
              <li key={p.t} className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-black/5">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-pink-600 font-bold text-white">{k + 1}</span>
                <p className="mt-3 font-semibold">{p.t}</p>
                <p className="mt-1 text-sm text-gray-600">{p.d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 text-center">
            <Link href="/registro" className="inline-block rounded-full bg-pink-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-pink-700">Crear mi tienda gratis</Link>
            <p className="mt-4 text-sm text-gray-600">¿Dudas? <a href={WA} target="_blank" rel="noopener" className="font-semibold text-pink-700 underline">Escribinos por WhatsApp</a></p>
          </div>
        </div>
      </section>

      <footer className="py-8 text-center text-xs text-gray-500">
        Nadin Lencería · San Luis 1873, Rosario · <a href="https://nadinlenceria.com" className="underline">nadinlenceria.com</a>
      </footer>
    </main>
  );
}
