// Importar productos propios desde una planilla (Excel / Google Sheets / CSV).
// Una fila = un talle/color. Las filas con el mismo nombre forman un producto.
// Si el producto ya existe (mismo nombre) se actualiza; si no, se crea.
// Celda vacía en un producto existente = no se cambia (sirve para actualizar solo precios o stock).
// Sin imports del servidor: este archivo también se usa en el navegador.
// Misma clave que claveVariante() de lib/tienda.ts (talle|color normalizados).
const nk = (x: string) => String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const claveVariante = (talle: string, color: string) => `${nk(talle)}|${nk(color)}`;

export const MAX_FILAS_IMPORT = 3000;
export const MAX_PRODUCTOS_PROPIOS = 300;
export const MAX_VARIANTES = 60;

/** Columnas de la planilla, en el orden de la plantilla. */
export const COLUMNAS = [
  { k: 'nombre', titulo: 'Nombre', alias: ['nombre', 'producto', 'nombre del producto', 'articulo', 'descripcion corta'] },
  { k: 'talle', titulo: 'Talle', alias: ['talle', 'talla', 'tamano', 'medida', 'modelo', 'opcion 1'] },
  { k: 'color', titulo: 'Color', alias: ['color', 'opcion 2', 'variante'] },
  { k: 'precio', titulo: 'Precio', alias: ['precio', 'precio de venta', 'precio venta', 'precio final', 'valor'] },
  { k: 'precioAntes', titulo: 'Precio antes (tachado)', alias: ['precio antes', 'precio antes (tachado)', 'precio tachado', 'precio anterior', 'precio sin descuento', 'precio de lista'] },
  { k: 'stock', titulo: 'Stock', alias: ['stock', 'cantidad', 'unidades', 'disponible'] },
  { k: 'sku', titulo: 'Código', alias: ['codigo', 'sku', 'cod', 'codigo de barras', 'ean', 'referencia'] },
  { k: 'categoria', titulo: 'Categoría', alias: ['categoria', 'rubro', 'seccion'] },
  { k: 'descripcion', titulo: 'Descripción', alias: ['descripcion', 'detalle', 'descripcion larga'] },
  { k: 'fotos', titulo: 'Fotos (links)', alias: ['fotos', 'fotos (links)', 'foto', 'imagen', 'imagenes', 'link foto', 'url imagen', 'imagen url'] },
] as const;
export type Campo = (typeof COLUMNAS)[number]['k'];

const norm = (x: unknown) => String(x ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[*:]/g, '').replace(/\s+/g, ' ').trim();

/** Busca la fila de títulos (la primera que tenga "nombre" y "precio") y arma {fila, campos}. */
export function filasDesdeHoja(hoja: unknown[][]): { filas: FilaImport[]; error?: string } {
  const limite = Math.min(hoja.length, 15);
  for (let h = 0; h < limite; h++) {
    const titulos = (hoja[h] || []).map(norm);
    const indice: Partial<Record<Campo, number>> = {};
    titulos.forEach((t, i) => {
      const col = COLUMNAS.find((c) => (c.alias as readonly string[]).includes(t));
      if (col && indice[col.k] === undefined) indice[col.k] = i;
    });
    if (indice.nombre === undefined || indice.precio === undefined) continue;
    const filas: FilaImport[] = [];
    for (let r = h + 1; r < hoja.length && filas.length < MAX_FILAS_IMPORT; r++) {
      const row = hoja[r] || [];
      const f: FilaImport = { fila: r + 1 };
      let algo = false;
      for (const c of COLUMNAS) {
        const i = indice[c.k];
        if (i === undefined) continue;
        const v = row[i];
        if (v === null || v === undefined || String(v).trim() === '') continue;
        (f as any)[c.k] = typeof v === 'number' ? v : String(v).trim();
        algo = true;
      }
      if (algo) filas.push(f);
    }
    return { filas };
  }
  return { filas: [], error: 'No encontramos la fila de títulos. La planilla tiene que tener al menos las columnas "Nombre" y "Precio".' };
}

/** CSV simple (separado por ; o ,) para quien guarde la planilla como .csv */
export function hojaDesdeCsv(texto: string): string[][] {
  const lineas = texto.replace(/^﻿/, '').split(/\r?\n/);
  const sep = (lineas[0] || '').split(';').length > (lineas[0] || '').split(',').length ? ';' : ',';
  return lineas.map((l) => {
    const out: string[] = [];
    let cur = '';
    let q = false;
    for (let i = 0; i < l.length; i++) {
      const ch = l[i];
      if (q) {
        if (ch === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch;
      } else if (ch === '"') q = true;
      else if (ch === sep) { out.push(cur); cur = ''; } else cur += ch;
    }
    out.push(cur);
    return out;
  });
}

export type FilaImport = { fila: number } & Partial<Record<Campo, string | number>>;

/** Números escritos a la argentina: "$ 12.500", "12.500,50", "12500". */
export function numeroAr(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  let s = String(v).replace(/[$\s]|ars/gi, '');
  if (!s) return null;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const txt = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);
const fotos = (v: unknown) =>
  String(v ?? '')
    .split(/[\s,;|]+/)
    .filter((u) => /^https:\/\/[^\s"'<>]+$/i.test(u))
    .map((u) => u.slice(0, 500))
    .slice(0, 8);

type VarianteExistente = { id: string; talle: string; color: string };
export type ProductoExistente = { id: string; nombre: string; variantes: VarianteExistente[] };

export type VariantePlan = { id?: string; talle: string; color: string; precio?: number; precioAntes?: number | null; stock?: number; sku?: string | null };
export type ProductoPlan = {
  id?: string; // si existe
  nombre: string;
  categoria?: string;
  descripcion?: string;
  imagenes?: string[];
  variantes: VariantePlan[];
};
export type Plan = {
  productos: ProductoPlan[];
  errores: { fila: number; motivo: string }[];
  resumen: { nuevos: number; actualizados: number; variantesNuevas: number; variantesActualizadas: number; filas: number };
};

/** Arma el plan de importación sin tocar la base. */
export function planificar(filas: FilaImport[], existentes: ProductoExistente[]): Plan {
  const errores: Plan['errores'] = [];
  const porNombre = new Map<string, ProductoExistente>();
  for (const p of existentes) if (!porNombre.has(norm(p.nombre))) porNombre.set(norm(p.nombre), p);

  const grupos = new Map<string, ProductoPlan & { claves: Map<string, VariantePlan> }>();
  let filasOk = 0;
  for (const f of filas.slice(0, MAX_FILAS_IMPORT)) {
    const nombre = txt(f.nombre, 120);
    if (!nombre) { errores.push({ fila: f.fila, motivo: 'Falta el nombre.' }); continue; }
    const precio = numeroAr(f.precio);
    const precioAntes = numeroAr(f.precioAntes);
    const stock = numeroAr(f.stock);
    if (f.precio !== undefined && (precio === null || precio <= 0)) { errores.push({ fila: f.fila, motivo: `Precio inválido: "${f.precio}".` }); continue; }
    if (f.stock !== undefined && (stock === null || stock < 0)) { errores.push({ fila: f.fila, motivo: `Stock inválido: "${f.stock}".` }); continue; }

    const k = norm(nombre);
    const existente = porNombre.get(k);
    let g = grupos.get(k);
    if (!g) {
      const nuevos = Array.from(grupos.values()).filter((x) => !x.id).length;
      if (!existente && existentes.length + nuevos >= MAX_PRODUCTOS_PROPIOS) {
        errores.push({ fila: f.fila, motivo: `Llegaste al máximo de ${MAX_PRODUCTOS_PROPIOS} productos propios.` });
        continue;
      }
      g = { id: existente?.id, nombre: existente?.nombre || nombre, variantes: [], claves: new Map() };
      grupos.set(k, g);
    }
    if (!g.categoria && f.categoria) g.categoria = txt(f.categoria, 120).replace(/\s*>\s*/g, ' > ');
    if (!g.descripcion && f.descripcion) g.descripcion = txt(f.descripcion, 4000);
    if (f.fotos) {
      const nuevas = fotos(f.fotos);
      if (nuevas.length) g.imagenes = Array.from(new Set([...(g.imagenes || []), ...nuevas])).slice(0, 8);
    }

    const talle = txt(f.talle, 40);
    const color = txt(f.color, 40);
    const clave = claveVariante(talle, color);
    const previa = existente?.variantes.find((v) => claveVariante(v.talle, v.color) === clave);
    let v = g.claves.get(clave);
    if (!v) {
      if (!previa && (precio === null || precio <= 0)) { errores.push({ fila: f.fila, motivo: 'Falta el precio.' }); continue; }
      if (!previa && g.variantes.filter((x) => !x.id).length + (existente?.variantes.length || 0) >= MAX_VARIANTES) {
        errores.push({ fila: f.fila, motivo: `Máximo ${MAX_VARIANTES} talles/colores por producto.` });
        continue;
      }
      v = { id: previa?.id, talle: previa ? previa.talle : talle, color: previa ? previa.color : color };
      g.claves.set(clave, v);
      g.variantes.push(v);
    }
    if (precio !== null) v.precio = Math.round(precio);
    if (precioAntes !== null) v.precioAntes = precioAntes > (v.precio ?? 0) ? Math.round(precioAntes) : null;
    if (stock !== null) v.stock = Math.min(99999, Math.floor(stock));
    if (f.sku !== undefined) v.sku = txt(f.sku, 60) || null;
    filasOk++;
  }

  // Un producto sin ninguna fila válida no se toca
  const productos = Array.from(grupos.values()).filter((g) => g.variantes.length).map(({ claves: _c, ...p }) => p);
  return {
    productos,
    errores,
    resumen: {
      nuevos: productos.filter((p) => !p.id).length,
      actualizados: productos.filter((p) => p.id).length,
      variantesNuevas: productos.reduce((a, p) => a + p.variantes.filter((v) => !v.id).length, 0),
      variantesActualizadas: productos.reduce((a, p) => a + p.variantes.filter((v) => v.id).length, 0),
      filas: filasOk,
    },
  };
}
