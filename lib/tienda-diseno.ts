// lib/tienda-diseno.ts
// Diseño modular de cada tienda (guardado en Tienda.diseno), al estilo Tiendanube:
//  - una PLANTILLA define la "personalidad" (tipografías, header, tarjetas, botones)
//  - la home se arma con SECCIONES reordenables que la revendedora agrega/quita
// Se valida siempre al leer y al guardar: nunca confiamos en el JSON tal cual.

export type Plantilla = 'esencial' | 'atelier' | 'urbana' | 'aurora';
export type IconoBeneficio = 'envio' | 'pago' | 'cambio' | 'whatsapp' | 'seguro' | 'regalo';

export interface Slide { imagen: string; imagenMobile?: string; titulo?: string; texto?: string; boton?: string; link?: string }
export interface Beneficio { icono: IconoBeneficio; titulo: string; texto: string }
export interface BannerItem { imagen: string; titulo?: string; link?: string }

export type Seccion =
  | { id: string; tipo: 'carrusel'; visible: boolean; slides: Slide[] }
  | { id: string; tipo: 'beneficios'; visible: boolean; items: Beneficio[] }
  | { id: string; tipo: 'categorias'; visible: boolean; titulo: string; formato: 'tarjetas' | 'circulos'; cantidad: number }
  | { id: string; tipo: 'productos'; visible: boolean; titulo: string; fuente: FuenteProductos; categoria: string; formato: 'grilla' | 'slider'; cantidad: number; productos?: string[] }
  | { id: string; tipo: 'contador'; visible: boolean; titulo: string; texto: string; hasta: string; boton: string; link: string; imagen: string }
  | { id: string; tipo: 'producto_principal'; visible: boolean; titulo: string; productoId: string }
  | { id: string; tipo: 'banners'; visible: boolean; items: BannerItem[] }
  | { id: string; tipo: 'imagen_texto'; visible: boolean; imagen: string; titulo: string; texto: string; boton: string; link: string; lado: 'izq' | 'der' }
  | { id: string; tipo: 'texto'; visible: boolean; titulo: string; texto: string }
  | { id: string; tipo: 'video'; visible: boolean; titulo: string; url: string }
  | { id: string; tipo: 'redes'; visible: boolean; titulo: string; texto: string };

export type FuenteProductos = 'destacados' | 'mas_vendidos' | 'nuevos' | 'ofertas' | 'categoria' | 'todos' | 'elegidos';
export const FUENTES_PRODUCTOS: FuenteProductos[] = ['destacados', 'mas_vendidos', 'nuevos', 'ofertas', 'categoria', 'todos', 'elegidos'];
export type TipoSeccion = Seccion['tipo'];

export interface Anuncio {
  activo: boolean;
  texto: string;        // primer mensaje (compatibilidad)
  mensajes: string[];   // hasta 3, como Tiendanube
  link: string;
  desliza: boolean;     // los mensajes se mueven de derecha a izquierda
}

export interface Listado {
  colMobile: 1 | 2;
  colDesktop: 3 | 4 | 5;
  segundaFoto: boolean; // al pasar el mouse muestra la 2da foto
}

export interface Detalle {
  cuotas: { activo: boolean; cantidad: number; sinInteres: boolean };
  guiaTalles: { activo: boolean; imagen: string; texto: string };
}

export interface Menu {
  categorias: boolean;                         // mostrar las categorías en el menú
  extras: { titulo: string; link: string }[];  // links propios (páginas, categorías, externos)
}

export interface Popup {
  activo: boolean;
  titulo: string;
  texto: string;
  imagen: string;
  pide: 'email' | 'whatsapp' | 'ninguno';
  boton: string;
  cupon: string;     // código que se muestra al dejar los datos
  segundos: number;  // cuánto esperar antes de mostrarlo
}

export interface Diseno {
  plantilla: Plantilla;
  header: 'auto' | 'centrado' | 'izquierda';
  anuncio: Anuncio;
  listado: Listado;
  detalle: Detalle;
  menu: Menu;
  popup: Popup;
  secciones: Seccion[];
}

// ---------------------------------------------------------------------
// Plantillas
// ---------------------------------------------------------------------

export interface PlantillaDef {
  id: Plantilla;
  nombre: string;
  detalle: string;
  header: 'centrado' | 'izquierda';
  tarjeta: 'limpia' | 'enmarcada' | 'fondo';
  fuenteTitulos: 'moderna' | 'elegante' | 'clasica';
}

export const PLANTILLAS: PlantillaDef[] = [
  { id: 'esencial', nombre: 'Esencial', detalle: 'Minimalista y luminosa. Logo al centro, títulos en mayúscula, mucho aire.', header: 'centrado', tarjeta: 'limpia', fuenteTitulos: 'moderna' },
  { id: 'atelier', nombre: 'Atelier', detalle: 'Boutique y romántica. Tipografía con serif, fondo suave y bordes redondeados.', header: 'centrado', tarjeta: 'enmarcada', fuenteTitulos: 'elegante' },
  { id: 'urbana', nombre: 'Urbana', detalle: 'Audaz y moderna. Logo a la izquierda, títulos grandes, bloques de color.', header: 'izquierda', tarjeta: 'fondo', fuenteTitulos: 'moderna' },
  { id: 'aurora', nombre: 'Aurora', detalle: 'Cálida y clásica. Serif suave, tarjetas con marco fino, ideal para lencería fina.', header: 'izquierda', tarjeta: 'enmarcada', fuenteTitulos: 'clasica' },
];

export function getPlantilla(id: string | undefined | null): PlantillaDef {
  return PLANTILLAS.find((p) => p.id === id) || PLANTILLAS[0];
}

// ---------------------------------------------------------------------
// Plantillas prearmadas: estilo + colores + letra + secciones listas para usar
// (como elegir un diseño en Tiendanube; después se cambia todo lo que se quiera)
// ---------------------------------------------------------------------

export interface Prearmada {
  id: string;
  nombre: string;
  detalle: string;
  plantilla: Plantilla;
  colorPrimario: string;
  colorSecundario: string;
  fuente: 'moderna' | 'elegante' | 'clasica';
  header: 'centrado' | 'izquierda';
  anuncio: string[];
  secciones: () => Seccion[];
}

const sec = {
  carrusel: (): Seccion => ({ id: nuevoId(), tipo: 'carrusel', visible: true, slides: [] }),
  beneficios: (): Seccion => ({ id: nuevoId(), tipo: 'beneficios', visible: true, items: BENEFICIOS_DEFAULT.map((b) => ({ ...b })) }),
  categorias: (formato: 'tarjetas' | 'circulos', cantidad = 4): Seccion => ({ id: nuevoId(), tipo: 'categorias', visible: true, titulo: 'Categorías', formato, cantidad }),
  productos: (titulo: string, fuente: FuenteProductos, formato: 'grilla' | 'slider', cantidad = 8): Seccion =>
    ({ id: nuevoId(), tipo: 'productos', visible: true, titulo, fuente, categoria: '', formato, cantidad }),
  todos: (): Seccion => ({ id: nuevoId(), tipo: 'productos', visible: true, titulo: 'Todos los productos', fuente: 'todos', categoria: '', formato: 'grilla', cantidad: 24 }),
  texto: (titulo = ''): Seccion => ({ id: nuevoId(), tipo: 'texto', visible: true, titulo, texto: '' }),
  redes: (): Seccion => ({ id: nuevoId(), tipo: 'redes', visible: true, titulo: 'Seguinos', texto: 'Novedades, ingresos y promos todas las semanas.' }),
  contador: (): Seccion => seccionNueva('contador'),
  banners: (): Seccion => ({ id: nuevoId(), tipo: 'banners', visible: true, items: [] }),
};

export const PREARMADAS: Prearmada[] = [
  {
    id: 'rosa', nombre: 'Rosa boutique', detalle: 'Romántica, fondo rosado suave y letra elegante.',
    plantilla: 'atelier', colorPrimario: '#e11d74', colorSecundario: '#3b0a24', fuente: 'elegante', header: 'centrado',
    anuncio: ['Envíos a todo el país', '3 y 6 cuotas', 'Cambios fáciles'],
    secciones: () => [sec.carrusel(), sec.beneficios(), sec.categorias('circulos', 6), sec.productos('Destacados', 'destacados', 'grilla'), sec.productos('Los más elegidos', 'mas_vendidos', 'slider', 10), sec.todos(), sec.redes()],
  },
  {
    id: 'blanco', nombre: 'Blanco minimal', detalle: 'Limpia y luminosa: que lo importante sean las fotos.',
    plantilla: 'esencial', colorPrimario: '#111111', colorSecundario: '#111111', fuente: 'moderna', header: 'centrado',
    anuncio: ['Envío gratis desde $50.000'],
    secciones: () => [sec.carrusel(), sec.categorias('tarjetas', 4), sec.productos('Nuevos ingresos', 'nuevos', 'grilla', 8), sec.productos('Más vendidos', 'mas_vendidos', 'slider', 10), sec.todos()],
  },
  {
    id: 'nude', nombre: 'Nude clásica', detalle: 'Tonos tierra y letra clásica, ideal para lencería fina.',
    plantilla: 'aurora', colorPrimario: '#a47551', colorSecundario: '#3f3a36', fuente: 'clasica', header: 'izquierda',
    anuncio: ['Atención personalizada por WhatsApp'],
    secciones: () => [sec.carrusel(), sec.texto('Bienvenida'), sec.categorias('tarjetas', 4), sec.productos('Favoritos', 'destacados', 'slider', 10), sec.banners(), sec.todos(), sec.beneficios()],
  },
  {
    id: 'fucsia', nombre: 'Fucsia urbana', detalle: 'Audaz, con bloques de color y ofertas con reloj.',
    plantilla: 'urbana', colorPrimario: '#db2777', colorSecundario: '#0f172a', fuente: 'moderna', header: 'izquierda',
    anuncio: ['¡OFERTAS DE LA SEMANA!', 'Envíos a todo el país', 'Pagá con transferencia y ahorrá'],
    secciones: () => [sec.carrusel(), sec.contador(), sec.productos('Ofertas', 'ofertas', 'slider', 10), sec.productos('Lo más vendido', 'mas_vendidos', 'slider', 10), sec.categorias('tarjetas', 4), sec.todos(), sec.redes()],
  },
  {
    id: 'lila', nombre: 'Lila suave', detalle: 'Delicada y moderna, con categorías en círculos.',
    plantilla: 'atelier', colorPrimario: '#8b5cf6', colorSecundario: '#2e1065', fuente: 'elegante', header: 'centrado',
    anuncio: ['Nuevos ingresos todas las semanas'],
    secciones: () => [sec.carrusel(), sec.categorias('circulos', 6), sec.productos('Nuevos ingresos', 'nuevos', 'slider', 10), sec.productos('Destacados', 'destacados', 'grilla'), sec.todos(), sec.beneficios()],
  },
  {
    id: 'menta', nombre: 'Menta fresca', detalle: 'Fresca y alegre, verde agua con letra moderna.',
    plantilla: 'esencial', colorPrimario: '#0d9488', colorSecundario: '#134e4a', fuente: 'moderna', header: 'centrado',
    anuncio: ['3 cuotas sin interés', 'Envíos a todo el país'],
    secciones: () => [sec.carrusel(), sec.beneficios(), sec.productos('Más vendidos', 'mas_vendidos', 'grilla', 8), sec.categorias('tarjetas', 4), sec.todos()],
  },
];

// ---------------------------------------------------------------------
// Catálogo de secciones (para el editor)
// ---------------------------------------------------------------------

export const SECCIONES_INFO: { tipo: TipoSeccion; nombre: string; detalle: string; emoji: string }[] = [
  { tipo: 'carrusel', nombre: 'Carrusel de imágenes', detalle: 'Banners grandes que pasan solos', emoji: '🖼️' },
  { tipo: 'beneficios', nombre: 'Beneficios', detalle: 'Franja con íconos: envíos, pagos, cambios', emoji: '✨' },
  { tipo: 'categorias', nombre: 'Categorías', detalle: 'Tus categorías con foto', emoji: '🗂️' },
  { tipo: 'productos', nombre: 'Productos', detalle: 'Destacados, más vendidos o de una categoría', emoji: '🛍️' },
  { tipo: 'banners', nombre: 'Banners', detalle: '2 o 3 imágenes lado a lado con link', emoji: '🧩' },
  { tipo: 'contador', nombre: 'Oferta con temporizador', detalle: 'Cuenta regresiva hasta que termina la promo', emoji: '⏱️' },
  { tipo: 'producto_principal', nombre: 'Producto principal', detalle: 'Un producto grande para destacar', emoji: '⭐' },
  { tipo: 'imagen_texto', nombre: 'Imagen + texto', detalle: 'Contá una colección o promo', emoji: '📰' },
  { tipo: 'texto', nombre: 'Texto', detalle: 'Sobre vos, tu historia, tu local', emoji: '✍️' },
  { tipo: 'video', nombre: 'Video', detalle: 'Un video de YouTube', emoji: '🎬' },
  { tipo: 'redes', nombre: 'Redes y WhatsApp', detalle: 'Invitá a seguirte o escribirte', emoji: '💬' },
];

export const ICONOS: IconoBeneficio[] = ['envio', 'pago', 'cambio', 'whatsapp', 'seguro', 'regalo'];

let _n = 0;
export const nuevoId = () => `s${Date.now().toString(36)}${(_n++).toString(36)}`;

export function seccionNueva(tipo: TipoSeccion): Seccion {
  const id = nuevoId();
  switch (tipo) {
    case 'carrusel': return { id, tipo, visible: true, slides: [] };
    case 'beneficios': return { id, tipo, visible: true, items: BENEFICIOS_DEFAULT.map((b) => ({ ...b })) };
    case 'categorias': return { id, tipo, visible: true, titulo: 'Categorías', formato: 'tarjetas', cantidad: 4 };
    case 'productos': return { id, tipo, visible: true, titulo: 'Destacados', fuente: 'destacados', categoria: '', formato: 'grilla', cantidad: 8 };
    case 'banners': return { id, tipo, visible: true, items: [] };
    case 'imagen_texto': return { id, tipo, visible: true, imagen: '', titulo: 'Nueva colección', texto: '', boton: 'Ver más', link: '', lado: 'izq' };
    case 'texto': return { id, tipo, visible: true, titulo: 'Sobre nosotras', texto: '' };
    case 'video': return { id, tipo, visible: true, titulo: '', url: '' };
    case 'redes': return { id, tipo, visible: true, titulo: 'Seguinos', texto: 'Novedades, ingresos y promos todas las semanas.' };
    case 'contador': return { id, tipo, visible: true, titulo: 'Ofertas por tiempo limitado', texto: '', hasta: new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 16), boton: 'Ver ofertas', link: '', imagen: '' };
    case 'producto_principal': return { id, tipo, visible: true, titulo: '', productoId: '' };
  }
}

const BENEFICIOS_DEFAULT: Beneficio[] = [
  { icono: 'envio', titulo: 'Envíos', texto: 'Te lo llevamos a tu casa' },
  { icono: 'pago', titulo: 'Pagá como quieras', texto: 'Transferencia o Mercado Pago' },
  { icono: 'cambio', titulo: 'Cambios fáciles', texto: 'Escribinos y lo resolvemos' },
];

export const ANUNCIO_VACIO: Anuncio = { activo: false, texto: '', mensajes: [], link: '', desliza: false };
export const LISTADO_DEFAULT: Listado = { colMobile: 2, colDesktop: 4, segundaFoto: true };
export const MENU_DEFAULT: Menu = { categorias: true, extras: [] };
export const POPUP_DEFAULT: Popup = { activo: false, titulo: '¡Bienvenida!', texto: 'Dejanos tu WhatsApp y enterate primero de las novedades y ofertas.', imagen: '', pide: 'whatsapp', boton: 'Quiero enterarme', cupon: '', segundos: 6 };
export const DETALLE_DEFAULT: Detalle = { cuotas: { activo: false, cantidad: 3, sinInteres: true }, guiaTalles: { activo: false, imagen: '', texto: '' } };

export const DISENO_DEFAULT: Diseno = {
  plantilla: 'esencial',
  header: 'auto',
  anuncio: ANUNCIO_VACIO,
  listado: LISTADO_DEFAULT,
  detalle: DETALLE_DEFAULT,
  menu: MENU_DEFAULT,
  popup: POPUP_DEFAULT,
  secciones: [
    { id: 'carrusel', tipo: 'carrusel', visible: true, slides: [] },
    { id: 'beneficios', tipo: 'beneficios', visible: true, items: BENEFICIOS_DEFAULT },
    { id: 'categorias', tipo: 'categorias', visible: true, titulo: 'Categorías', formato: 'tarjetas', cantidad: 4 },
    { id: 'destacados', tipo: 'productos', visible: true, titulo: 'Destacados', fuente: 'destacados', categoria: '', formato: 'grilla', cantidad: 8 },
    { id: 'masvendidos', tipo: 'productos', visible: true, titulo: 'Los más elegidos', fuente: 'mas_vendidos', categoria: '', formato: 'slider', cantidad: 10 },
    { id: 'todos', tipo: 'productos', visible: true, titulo: 'Todos los productos', fuente: 'todos', categoria: '', formato: 'grilla', cantidad: 24 },
    { id: 'sobre', tipo: 'texto', visible: true, titulo: '', texto: '' },
  ],
};

// ---------------------------------------------------------------------
// Validación
// ---------------------------------------------------------------------

const txt = (v: any, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const httpsUrl = (v: any) => {
  const s = txt(v, 500);
  return /^https:\/\//i.test(s) ? s : '';
};
/** Links: rutas internas (/categoria/..., /producto/...), anclas (#...) o https:// */
const link = (v: any) => {
  const s = txt(v, 300);
  if (!s) return '';
  if (s.startsWith('#')) return s.replace(/[^\w\-#]/g, '');
  if (s.startsWith('/') && !s.startsWith('//')) return s.replace(/[^\w\-/.?=&%]/g, '');
  return /^https:\/\//i.test(s) ? s : '';
};
const int = (v: any, min: number, max: number, def: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : def;
};
const id = (v: any) => (typeof v === 'string' && /^[\w-]{1,40}$/.test(v) ? v : nuevoId());
const oneOf = <T extends string>(v: any, ops: readonly T[], def: T): T => (ops.includes(v) ? v : def);

function normSlides(arr: any): Slide[] {
  return (Array.isArray(arr) ? arr : [])
    .map((s: any) => ({
      imagen: httpsUrl(s?.imagen),
      imagenMobile: httpsUrl(s?.imagenMobile) || undefined,
      titulo: txt(s?.titulo, 80) || undefined,
      texto: txt(s?.texto, 160) || undefined,
      boton: txt(s?.boton, 30) || undefined,
      link: link(s?.link) || undefined,
    }))
    .filter((s: Slide) => !!s.imagen)
    .slice(0, 6);
}

function normSeccion(raw: any): Seccion | null {
  if (!raw || typeof raw !== 'object') return null;
  const base = { id: id(raw.id), visible: raw.visible !== false };
  switch (raw.tipo) {
    case 'carrusel':
      return { ...base, tipo: 'carrusel', slides: normSlides(raw.slides) };
    case 'beneficios':
      return {
        ...base, tipo: 'beneficios',
        items: (Array.isArray(raw.items) ? raw.items : [])
          .map((b: any) => ({ icono: oneOf(b?.icono, ICONOS, 'envio'), titulo: txt(b?.titulo, 40), texto: txt(b?.texto, 80) }))
          .filter((b: Beneficio) => b.titulo)
          .slice(0, 4),
      };
    case 'categorias':
      return { ...base, tipo: 'categorias', titulo: txt(raw.titulo, 60), formato: oneOf(raw.formato, ['tarjetas', 'circulos'] as const, 'tarjetas'), cantidad: int(raw.cantidad, 2, 12, 4) };
    case 'productos':
      return {
        ...base, tipo: 'productos', titulo: txt(raw.titulo, 60),
        fuente: oneOf(raw.fuente, FUENTES_PRODUCTOS, 'destacados'),
        // Productos elegidos a mano, en el orden que los puso la revendedora
        productos: (Array.isArray(raw.productos) ? raw.productos : [])
          .map((x: any) => String(x).replace(/[^\w-]/g, '').slice(0, 40))
          .filter(Boolean)
          .filter((x: string, i: number, a: string[]) => a.indexOf(x) === i)
          .slice(0, 48),
        categoria: txt(raw.categoria, 200).replace(/[^\w\-/]/g, ''),
        formato: oneOf(raw.formato, ['grilla', 'slider'] as const, 'grilla'),
        cantidad: int(raw.cantidad, 2, 48, 8),
      };
    case 'banners':
      return {
        ...base, tipo: 'banners',
        items: (Array.isArray(raw.items) ? raw.items : [])
          .map((b: any) => ({ imagen: httpsUrl(b?.imagen), titulo: txt(b?.titulo, 60) || undefined, link: link(b?.link) || undefined }))
          .filter((b: BannerItem) => b.imagen)
          .slice(0, 3),
      };
    case 'imagen_texto':
      return {
        ...base, tipo: 'imagen_texto', imagen: httpsUrl(raw.imagen), titulo: txt(raw.titulo, 80), texto: txt(raw.texto, 600),
        boton: txt(raw.boton, 30), link: link(raw.link), lado: oneOf(raw.lado, ['izq', 'der'] as const, 'izq'),
      };
    case 'texto':
      return { ...base, tipo: 'texto', titulo: txt(raw.titulo, 80), texto: txt(raw.texto, 2000) };
    case 'video': {
      const url = httpsUrl(raw.url);
      return { ...base, tipo: 'video', titulo: txt(raw.titulo, 80), url: youtubeId(url) ? url : '' };
    }
    case 'redes':
      return { ...base, tipo: 'redes', titulo: txt(raw.titulo, 60), texto: txt(raw.texto, 160) };
    case 'contador': {
      const hasta = txt(raw.hasta, 30);
      return {
        ...base, tipo: 'contador', titulo: txt(raw.titulo, 80), texto: txt(raw.texto, 200),
        hasta: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(hasta) ? hasta.slice(0, 16) : '',
        boton: txt(raw.boton, 30), link: link(raw.link), imagen: httpsUrl(raw.imagen),
      };
    }
    case 'producto_principal':
      return { ...base, tipo: 'producto_principal', titulo: txt(raw.titulo, 80), productoId: String(raw.productoId || '').replace(/[^\w-]/g, '').slice(0, 40) };
    default:
      return null;
  }
}

export function youtubeId(url: string): string | null {
  const m = (url || '').match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

/** Convierte el formato viejo (v2: estilo + slides + beneficios) al modular. */
function desdeV2(d: any): Diseno {
  const mapa: Record<string, Plantilla> = { minimal: 'esencial', boutique: 'atelier', audaz: 'urbana' };
  const secciones: Seccion[] = JSON.parse(JSON.stringify(DISENO_DEFAULT.secciones));
  const car = secciones.find((s) => s.tipo === 'carrusel') as any;
  car.slides = normSlides(d.slides);
  const ben = secciones.find((s) => s.tipo === 'beneficios') as any;
  if (d.beneficios) {
    ben.visible = d.beneficios.activo !== false;
    const n = normSeccion({ tipo: 'beneficios', items: d.beneficios.items });
    if (n && n.tipo === 'beneficios') ben.items = n.items;
  }
  if (d.categoriasDestacadas === false) (secciones.find((s) => s.tipo === 'categorias') as any).visible = false;
  if (d.masVendidos === false) (secciones.find((s) => s.id === 'masvendidos') as any).visible = false;
  return { plantilla: mapa[d.estilo] || 'esencial', header: 'auto', anuncio: ANUNCIO_VACIO, listado: LISTADO_DEFAULT, detalle: DETALLE_DEFAULT, menu: MENU_DEFAULT, popup: POPUP_DEFAULT, secciones };
}

export function normalizarDiseno(raw: any): Diseno {
  const d = raw && typeof raw === 'object' ? raw : {};
  const base: Diseno = Array.isArray(d.secciones) ? { plantilla: d.plantilla, anuncio: d.anuncio, secciones: d.secciones } as any : desdeV2(d);

  const secciones = (Array.isArray(base.secciones) ? base.secciones : [])
    .map(normSeccion)
    .filter(Boolean)
    .slice(0, 20) as Seccion[];
  // ids únicos
  const vistos = new Set<string>();
  secciones.forEach((s) => { if (vistos.has(s.id)) s.id = nuevoId(); vistos.add(s.id); });

  const anuncioRaw = (d.anuncio && typeof d.anuncio === 'object') ? d.anuncio : {};
  const mensajes = (Array.isArray(anuncioRaw.mensajes) ? anuncioRaw.mensajes : [anuncioRaw.texto])
    .map((m: any) => txt(m, 120)).filter(Boolean).slice(0, 3);
  const listadoRaw = (d.listado && typeof d.listado === 'object') ? d.listado : {};
  const det = (d.detalle && typeof d.detalle === 'object') ? d.detalle : {};
  const cuo = (det.cuotas && typeof det.cuotas === 'object') ? det.cuotas : {};
  const gt = (det.guiaTalles && typeof det.guiaTalles === 'object') ? det.guiaTalles : {};
  const mn = (d.menu && typeof d.menu === 'object') ? d.menu : {};
  const pp = (d.popup && typeof d.popup === 'object') ? d.popup : {};
  return {
    plantilla: oneOf(base.plantilla, PLANTILLAS.map((p) => p.id), 'esencial'),
    header: oneOf(d.header, ['auto', 'centrado', 'izquierda'] as const, 'auto'),
    anuncio: {
      activo: !!anuncioRaw.activo && mensajes.length > 0,
      texto: mensajes[0] || '',
      mensajes,
      link: link(anuncioRaw.link),
      desliza: !!anuncioRaw.desliza,
    },
    listado: {
      colMobile: Number(listadoRaw.colMobile) === 1 ? 1 : 2,
      colDesktop: ([3, 4, 5].includes(Number(listadoRaw.colDesktop)) ? Number(listadoRaw.colDesktop) : 4) as 3 | 4 | 5,
      segundaFoto: listadoRaw.segundaFoto !== false,
    },
    detalle: {
      cuotas: { activo: !!cuo.activo, cantidad: int(cuo.cantidad, 2, 18, 3), sinInteres: cuo.sinInteres !== false },
      guiaTalles: { activo: !!gt.activo && !!(httpsUrl(gt.imagen) || txt(gt.texto, 2000)), imagen: httpsUrl(gt.imagen), texto: txt(gt.texto, 2000) },
    },
    menu: {
      categorias: mn.categorias !== false,
      extras: (Array.isArray(mn.extras) ? mn.extras : [])
        .map((x: any) => ({ titulo: txt(x?.titulo, 30), link: link(x?.link) }))
        .filter((x: any) => x.titulo && x.link)
        .slice(0, 8),
    },
    popup: {
      activo: !!pp.activo,
      titulo: txt(pp.titulo, 60) || POPUP_DEFAULT.titulo,
      texto: txt(pp.texto, 200),
      imagen: httpsUrl(pp.imagen),
      pide: oneOf(pp.pide, ['email', 'whatsapp', 'ninguno'] as const, 'whatsapp'),
      boton: txt(pp.boton, 30) || 'Enviar',
      cupon: txt(pp.cupon, 30).toUpperCase().replace(/[^A-Z0-9_-]/g, ''),
      segundos: int(pp.segundos, 0, 60, 6),
    },
    secciones: Array.isArray(d.secciones) ? secciones : secciones.length ? secciones : JSON.parse(JSON.stringify(DISENO_DEFAULT.secciones)),
  };
}
