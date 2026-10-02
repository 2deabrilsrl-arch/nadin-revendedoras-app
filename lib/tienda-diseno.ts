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
  | { id: string; tipo: 'productos'; visible: boolean; titulo: string; fuente: 'destacados' | 'mas_vendidos' | 'categoria' | 'todos'; categoria: string; formato: 'grilla' | 'slider'; cantidad: number }
  | { id: string; tipo: 'banners'; visible: boolean; items: BannerItem[] }
  | { id: string; tipo: 'imagen_texto'; visible: boolean; imagen: string; titulo: string; texto: string; boton: string; link: string; lado: 'izq' | 'der' }
  | { id: string; tipo: 'texto'; visible: boolean; titulo: string; texto: string }
  | { id: string; tipo: 'video'; visible: boolean; titulo: string; url: string }
  | { id: string; tipo: 'redes'; visible: boolean; titulo: string; texto: string };

export type TipoSeccion = Seccion['tipo'];

export interface Diseno {
  plantilla: Plantilla;
  anuncio: { activo: boolean; texto: string; link: string };
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
// Catálogo de secciones (para el editor)
// ---------------------------------------------------------------------

export const SECCIONES_INFO: { tipo: TipoSeccion; nombre: string; detalle: string; emoji: string }[] = [
  { tipo: 'carrusel', nombre: 'Carrusel de imágenes', detalle: 'Banners grandes que pasan solos', emoji: '🖼️' },
  { tipo: 'beneficios', nombre: 'Beneficios', detalle: 'Franja con íconos: envíos, pagos, cambios', emoji: '✨' },
  { tipo: 'categorias', nombre: 'Categorías', detalle: 'Tus categorías con foto', emoji: '🗂️' },
  { tipo: 'productos', nombre: 'Productos', detalle: 'Destacados, más vendidos o de una categoría', emoji: '🛍️' },
  { tipo: 'banners', nombre: 'Banners', detalle: '2 o 3 imágenes lado a lado con link', emoji: '🧩' },
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
  }
}

const BENEFICIOS_DEFAULT: Beneficio[] = [
  { icono: 'envio', titulo: 'Envíos', texto: 'Te lo llevamos a tu casa' },
  { icono: 'pago', titulo: 'Pagá como quieras', texto: 'Transferencia o Mercado Pago' },
  { icono: 'cambio', titulo: 'Cambios fáciles', texto: 'Escribinos y lo resolvemos' },
];

export const DISENO_DEFAULT: Diseno = {
  plantilla: 'esencial',
  anuncio: { activo: false, texto: '', link: '' },
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
        fuente: oneOf(raw.fuente, ['destacados', 'mas_vendidos', 'categoria', 'todos'] as const, 'destacados'),
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
  return { plantilla: mapa[d.estilo] || 'esencial', anuncio: { activo: false, texto: '', link: '' }, secciones };
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
  return {
    plantilla: oneOf(base.plantilla, ['esencial', 'atelier', 'urbana', 'aurora'] as const, 'esencial'),
    anuncio: {
      activo: !!anuncioRaw.activo && !!txt(anuncioRaw.texto, 120),
      texto: txt(anuncioRaw.texto, 120),
      link: link(anuncioRaw.link),
    },
    secciones: Array.isArray(d.secciones) ? secciones : secciones.length ? secciones : JSON.parse(JSON.stringify(DISENO_DEFAULT.secciones)),
  };
}
