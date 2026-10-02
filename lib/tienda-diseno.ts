// lib/tienda-diseno.ts
// Configuración visual de la portada de cada tienda (guardada en Tienda.diseno).
// Se valida siempre al leer y al guardar: nunca confiamos en el JSON tal cual.

export type Estilo = 'minimal' | 'boutique' | 'audaz';
export type IconoBeneficio = 'envio' | 'pago' | 'cambio' | 'whatsapp' | 'seguro' | 'regalo';

export interface Slide {
  imagen: string;
  imagenMobile?: string;
  titulo?: string;
  texto?: string;
  boton?: string;
  link?: string;
}

export interface Beneficio {
  icono: IconoBeneficio;
  titulo: string;
  texto: string;
}

export interface Diseno {
  estilo: Estilo;
  anuncio: { activo: boolean; texto: string; link: string };
  slides: Slide[];
  beneficios: { activo: boolean; items: Beneficio[] };
  categoriasDestacadas: boolean;
  masVendidos: boolean;
}

export const ESTILOS: { id: Estilo; nombre: string; detalle: string }[] = [
  { id: 'minimal', nombre: 'Minimal', detalle: 'Blanco, líneas finas, títulos en mayúscula. Sutil y prolijo.' },
  { id: 'boutique', nombre: 'Boutique', detalle: 'Fondo suave con tu color, títulos con serif, bordes redondeados.' },
  { id: 'audaz', nombre: 'Audaz', detalle: 'Bloques de color, títulos grandes, esquinas rectas.' },
];

export const ICONOS: IconoBeneficio[] = ['envio', 'pago', 'cambio', 'whatsapp', 'seguro', 'regalo'];

export const DISENO_DEFAULT: Diseno = {
  estilo: 'minimal',
  anuncio: { activo: false, texto: '', link: '' },
  slides: [],
  beneficios: {
    activo: true,
    items: [
      { icono: 'envio', titulo: 'Envíos', texto: 'Te lo llevamos a tu casa' },
      { icono: 'pago', titulo: 'Pagá como quieras', texto: 'Transferencia o Mercado Pago' },
      { icono: 'cambio', titulo: 'Cambios fáciles', texto: 'Escribinos y lo resolvemos' },
    ],
  },
  categoriasDestacadas: true,
  masVendidos: true,
};

const txt = (v: any, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const httpsUrl = (v: any) => {
  const s = txt(v, 500);
  return /^https:\/\//i.test(s) ? s : '';
};
/** Links: rutas internas (/categoria/..., /producto/...) o https:// */
const link = (v: any) => {
  const s = txt(v, 300);
  if (!s) return '';
  if (s.startsWith('/') && !s.startsWith('//')) return s.replace(/[^\w\-/.?=&%]/g, '');
  return /^https:\/\//i.test(s) ? s : '';
};

export function normalizarDiseno(raw: any): Diseno {
  const d = raw && typeof raw === 'object' ? raw : {};
  const estilo: Estilo = ['minimal', 'boutique', 'audaz'].includes(d.estilo) ? d.estilo : DISENO_DEFAULT.estilo;

  const slides: Slide[] = (Array.isArray(d.slides) ? d.slides : [])
    .map((s: any) => ({
      imagen: httpsUrl(s?.imagen),
      imagenMobile: httpsUrl(s?.imagenMobile) || undefined,
      titulo: txt(s?.titulo, 80) || undefined,
      texto: txt(s?.texto, 160) || undefined,
      boton: txt(s?.boton, 30) || undefined,
      link: link(s?.link) || undefined,
    }))
    .filter((s: Slide) => !!s.imagen)
    .slice(0, 5);

  const benRaw = d.beneficios && typeof d.beneficios === 'object' ? d.beneficios : DISENO_DEFAULT.beneficios;
  const items: Beneficio[] = (Array.isArray(benRaw.items) ? benRaw.items : [])
    .map((b: any) => ({
      icono: ICONOS.includes(b?.icono) ? b.icono : 'envio',
      titulo: txt(b?.titulo, 40),
      texto: txt(b?.texto, 80),
    }))
    .filter((b: Beneficio) => b.titulo)
    .slice(0, 4);

  return {
    estilo,
    anuncio: {
      activo: !!d.anuncio?.activo && !!txt(d.anuncio?.texto, 120),
      texto: txt(d.anuncio?.texto, 120),
      link: link(d.anuncio?.link),
    },
    slides,
    beneficios: { activo: benRaw.activo !== false, items: raw?.beneficios ? items : DISENO_DEFAULT.beneficios.items },
    categoriasDestacadas: d.categoriasDestacadas !== false,
    masVendidos: d.masVendidos !== false,
  };
}
