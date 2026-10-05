// Páginas propias de cada tienda: modelos listos para usar y render simple del contenido.
// Formato del contenido (fácil para la revendedora):
//   "## Título"  → subtítulo
//   "- texto"    → punto de una lista
//   línea vacía  → nuevo párrafo

export const MODELOS_PAGINAS = [
  {
    slug: 'como-comprar', titulo: 'Cómo comprar',
    contenido: `## 1. Elegí tus productos
Buscá lo que te gusta, elegí talle y color y agregalo al carrito.

## 2. Completá tus datos
En el carrito tocá "Finalizar compra", completá tu nombre, teléfono y la forma de entrega.

## 3. Pagá
Elegí cómo pagar: transferencia, Mercado Pago u otro medio disponible. Si pagás por transferencia, mandanos el comprobante por WhatsApp.

## 4. ¡Listo!
Te avisamos cuando tu pedido esté preparado para retirar o enviar.`,
  },
  {
    slug: 'cambios-y-devoluciones', titulo: 'Cambios y devoluciones',
    contenido: `Por higiene, la ropa interior y la lencería se cambian solo sin uso, con etiquetas y en su empaque original.

## Cómo hacer un cambio
- Escribinos por WhatsApp dentro de los 30 días de recibido tu pedido.
- Contanos qué querés cambiar y por qué talle o modelo.
- Coordinamos la entrega del cambio.

## Arrepentimiento
Tenés 10 días corridos desde que recibiste tu compra para arrepentirte, usando el botón de arrepentimiento que está al pie de la página.`,
  },
  {
    slug: 'envios', titulo: 'Envíos',
    contenido: `## Formas de entrega
- Retiro: coordinamos día y horario por WhatsApp.
- Envío: te lo llevamos o lo despachamos por correo.

## Plazos
Los pedidos se preparan en 48 a 72 horas hábiles desde que se acredita el pago.`,
  },
  {
    slug: 'preguntas-frecuentes', titulo: 'Preguntas frecuentes',
    contenido: `## ¿Cómo sé cuál es mi talle?
En cada producto vas a encontrar la guía de talles. Si tenés dudas, escribinos y te asesoramos.

## ¿Puedo pagar en cuotas?
Depende del medio de pago elegido. Lo ves al finalizar la compra.

## ¿Hacen envíos a todo el país?
Sí, consultanos el costo para tu localidad.`,
  },
];

export type BloquePagina = { tipo: 'h2'; texto: string } | { tipo: 'p'; texto: string } | { tipo: 'ul'; items: string[] };

export function parsearContenido(contenido: string): BloquePagina[] {
  const out: BloquePagina[] = [];
  let parrafo: string[] = [];
  let lista: string[] = [];
  const cerrar = () => {
    if (parrafo.length) { out.push({ tipo: 'p', texto: parrafo.join('\n') }); parrafo = []; }
    if (lista.length) { out.push({ tipo: 'ul', items: lista }); lista = []; }
  };
  for (const raw of String(contenido || '').split('\n')) {
    const l = raw.trimEnd();
    if (!l.trim()) { cerrar(); continue; }
    if (l.startsWith('## ')) { cerrar(); out.push({ tipo: 'h2', texto: l.slice(3).trim() }); continue; }
    if (/^[-•]\s+/.test(l)) { if (parrafo.length) { out.push({ tipo: 'p', texto: parrafo.join('\n') }); parrafo = []; } lista.push(l.replace(/^[-•]\s+/, '')); continue; }
    if (lista.length) { out.push({ tipo: 'ul', items: lista }); lista = []; }
    parrafo.push(l);
  }
  cerrar();
  return out;
}
