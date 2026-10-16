// Pasos para dejar lista y publicar la tienda web, con el paso a paso de cada uno.
// Sin imports del servidor: se usa en el panel y en el inicio de la app.

export type ClavePaso = 'marca' | 'diseno' | 'productos' | 'cobros' | 'entregas' | 'publicada';
export type Progreso = Partial<Record<ClavePaso, boolean>>;

export type PasoTienda = {
  k: ClavePaso;
  titulo: string;
  texto: string;
  /** Pestaña de Mi Tienda donde se hace */
  tab: string;
  /** Texto del botón que lleva a esa pantalla */
  boton: string;
  /** Paso a paso, en el orden en que se ve en pantalla */
  pasos: string[];
  /** Obligatorio para poder publicar */
  obligatorio?: boolean;
};

export const PASOS_TIENDA: PasoTienda[] = [
  {
    k: 'marca',
    titulo: 'Poné tu nombre, logo y WhatsApp',
    texto: 'Así tus clientas reconocen tu tienda y te pueden escribir.',
    tab: 'diseno',
    boton: 'Ir a Marca, datos y dominio',
    pasos: [
      'Abrí “Marca, datos y dominio”.',
      'En “Nombre de tu tienda” escribí cómo querés que te conozcan.',
      'En “Logo” tocá “Elegir archivo” y subí tu logo o una foto tuya.',
      'Más abajo, en “WhatsApp”, poné tu número con código de área (ej: 5493415551234).',
      'Tocá “Guardar cambios” (abajo de todo).',
    ],
  },
  {
    k: 'diseno',
    titulo: 'Elegí el diseño',
    texto: 'Plantilla, colores, fotos del carrusel y secciones.',
    tab: 'portada',
    boton: 'Ir a Diseño',
    pasos: [
      'Abrí “Diseño” y tocá “Editar diseño”.',
      'Tocá “Plantillas prearmadas” y elegí la que más te guste.',
      'Si querés, cambiá colores, letra y fotos del carrusel: lo ves en la vista previa.',
      'Cuando te guste, tocá “Publicar cambios” (arriba a la derecha).',
    ],
  },
  {
    k: 'productos',
    titulo: 'Destacá productos o cargá los tuyos',
    texto: 'Los de Nadin ya están cargados. Elegí cuáles mostrar primero.',
    tab: 'productos',
    boton: 'Ir a Productos',
    pasos: [
      'Abrí “Productos”. Los de Nadin ya están en tu tienda, con tu % de ganancia.',
      'Buscá un producto que te guste vender y tocá “☆ Destacar”: aparece primero en tu tienda.',
      'Destacá por lo menos 4 o 5.',
      'Si vendés cosas tuyas, andá a “Mis productos” → “+ Nuevo producto” (o “📊 Cargar con Excel” para subir muchos juntos).',
    ],
  },
  {
    k: 'cobros',
    titulo: 'Activá cómo te pagan',
    texto: 'Transferencia, Mercado Pago, link de pago o efectivo.',
    tab: 'pagos',
    boton: 'Ir a Cobros',
    obligatorio: true,
    pasos: [
      'Abrí “Cobros”.',
      'Lo más fácil: en “Transferencia bancaria” completá Alias, CBU/CVU, Titular y Banco.',
      'Tildá “Activo” y tocá “Guardar”.',
      'Si tenés Mercado Pago, tocá “+ Mercado Pago” → “Conectar mi Mercado Pago” y aceptá: los pagos se marcan solos.',
    ],
  },
  {
    k: 'entregas',
    titulo: 'Activá cómo entregás',
    texto: 'Envío a domicilio, correo o retiro.',
    tab: 'envios',
    boton: 'Ir a Entregas',
    pasos: [
      'Abrí “Entregas”. Ya tenés “Retiro / entrega a coordinar”: dejalo tildado en “Activo”.',
      'Si hacés envíos, en “Agregar forma de entrega” elegí el tipo, poné nombre y precio y tocá “Agregar”.',
    ],
  },
  {
    k: 'publicada',
    titulo: 'Publicá tu tienda',
    texto: 'Mientras esté en borrador, solo la ves vos.',
    tab: 'diseno',
    boton: 'Ir a publicar',
    pasos: [
      'Tocá “Publicar ahora” acá abajo (o en “Marca, datos y dominio” → “Publicar tienda”).',
      'Copiá tu link desde Inicio y compartilo por WhatsApp e Instagram.',
    ],
  },
];

export function estadoPasos(prog: Progreso | null | undefined) {
  const p = prog || {};
  const hechos = PASOS_TIENDA.filter((x) => p[x.k]).length;
  const faltan = PASOS_TIENDA.filter((x) => !p[x.k]);
  // El próximo paso: primero lo obligatorio, después en orden
  const siguiente = faltan.find((x) => x.obligatorio) || faltan[0] || null;
  return {
    hechos,
    total: PASOS_TIENDA.length,
    faltan,
    siguiente,
    /** Ya puede publicar (tiene un cobro activo) aunque falten pasos recomendados */
    puedePublicar: !!p.cobros && !p.publicada,
    publicada: !!p.publicada,
  };
}
