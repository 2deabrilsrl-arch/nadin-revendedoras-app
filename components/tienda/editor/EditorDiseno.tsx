'use client';
// Editor de diseño a pantalla completa, al estilo Tiendanube:
// panel de opciones a la izquierda y la tienda en vivo a la derecha (celular / computadora).
// Los cambios se guardan como BORRADOR (solo los ve la dueña) y se publican con "Publicar cambios".

import { useCallback, useEffect, useRef, useState } from 'react';
import { PLANTILLAS, PREARMADAS, ICONOS, SECCIONES_INFO, seccionNueva, type Prearmada } from '@/lib/tienda-diseno';
import { reducirImagen } from '@/components/tienda/reducirImagen';
import { tnImgClient } from '@/components/tienda/img';

const val = (e: any) => (e.target as any).value;
const chk = (e: any) => !!(e.target as any).checked;
const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-pink-500';
const btn = 'rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';
const btnSec = 'rounded-lg border border-gray-300 px-3 py-1.5 text-sm';

async function api(path: string, method = 'GET', body?: any) {
  const r = await fetch(`/api/mi-tienda${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  const data: any = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data.error || 'Error'), { code: data.code });
  return data;
}

const FUENTES = [
  { id: 'moderna', nombre: 'Moderna', muestra: 'font-sans', detalle: 'Limpia y actual' },
  { id: 'elegante', nombre: 'Elegante', muestra: 'font-serif italic', detalle: 'Serif con estilo boutique' },
  { id: 'clasica', nombre: 'Clásica', muestra: 'font-serif', detalle: 'Serif suave y legible' },
];

const PALETAS = [
  ['#e11d74', '#3b0a24'], ['#111111', '#111111'], ['#a47551', '#3f3a36'], ['#db2777', '#0f172a'],
  ['#8b5cf6', '#2e1065'], ['#0d9488', '#134e4a'], ['#f97316', '#431407'], ['#2563eb', '#0f172a'],
];

type Panel = 'menu' | 'plantillas' | 'colores' | 'letra' | 'encabezado' | 'inicio' | 'listado';

export function MiniPlantilla({ id }: { id: string }) {
  // Vista en miniatura de cada plantilla
  const header = id === 'urbana' || id === 'aurora' ? 'justify-start' : 'justify-center';
  const bg = id === 'atelier' ? 'bg-pink-50' : id === 'aurora' ? 'bg-orange-50/60' : 'bg-white';
  const hero = id === 'urbana' ? 'bg-gray-900' : 'bg-gray-200';
  const r = id === 'atelier' ? 'rounded-lg' : id === 'aurora' ? 'rounded' : 'rounded-none';
  const titulo = id === 'urbana' ? 'font-black uppercase' : id === 'atelier' || id === 'aurora' ? 'font-serif italic' : 'uppercase tracking-[0.2em]';
  return (
    <span className={`block overflow-hidden rounded-lg ring-1 ring-black/5 ${bg}`} aria-hidden="true">
      <span className={`flex ${header} border-b border-black/5 px-2 py-1.5`}><span className="h-1.5 w-10 rounded bg-gray-700" /></span>
      <span className={`m-1.5 flex h-10 items-center justify-center ${r} ${hero}`}><span className={`text-[7px] ${titulo} ${id === 'urbana' ? 'text-white' : 'text-gray-600'}`}>Colección</span></span>
      <span className="grid grid-cols-4 gap-1 px-1.5 pb-2">
        {[0, 1, 2, 3].map((k) => (
          <span key={k} className={`${id === 'atelier' || id === 'aurora' ? 'bg-white p-0.5 ring-1 ring-black/5' : ''} ${r}`}>
            <span className={`block h-6 ${r} ${id === 'urbana' ? 'bg-pink-100' : 'bg-gray-200'}`} />
          </span>
        ))}
      </span>
    </span>
  );
}


export function SelectorProductos({ ids, onChange, max = 48 }: { ids: string[]; onChange: (ids: string[]) => void; max?: number }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<any[]>([]);
  const [info, setInfo] = useState<Record<string, any>>({});
  const [buscando, setBuscando] = useState(false);

  // Datos (foto y nombre) de los ya elegidos
  useEffect(() => {
    const faltan = ids.filter((id) => !info[id]);
    if (!faltan.length) return;
    fetch(`/api/mi-tienda/productos?ids=${faltan.join(',')}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d: any) => setInfo((x) => ({ ...x, ...Object.fromEntries((d.productos || []).map((p: any) => [p.id, p])) })))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(',')]);

  async function buscar() {
    if (q.trim().length < 2) return;
    setBuscando(true);
    const d: any = await fetch(`/api/mi-tienda/productos?q=${encodeURIComponent(q.trim())}`, { credentials: 'include' }).then((r) => r.json()).catch(() => ({}));
    setRes(d.productos || []);
    setInfo((x) => ({ ...x, ...Object.fromEntries((d.productos || []).map((p: any) => [p.id, p])) }));
    setBuscando(false);
  }
  const mover = (k: number, dir: number) => {
    const j = k + dir;
    if (j < 0 || j >= ids.length) return;
    const n = [...ids];
    [n[k], n[j]] = [n[j], n[k]];
    onChange(n);
  };

  return (
    <div className="space-y-3 rounded-xl bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{max === 1 ? 'Buscá el producto que querés destacar.' : 'Buscá y agregá los productos que querés mostrar, en el orden que quieras (hasta 48). Los que se queden sin stock se ocultan solos.'}</p>
      {ids.length > 0 && (
        <ul className="space-y-1">
          {ids.map((id, k) => {
            const p = info[id];
            return (
              <li key={id} className="flex items-center gap-2 rounded-lg bg-white p-2 text-sm ring-1 ring-black/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p?.image ? <img src={tnImgClient(p.image, 120)} alt="" className="h-10 w-8 rounded object-cover" /> : <div className="h-10 w-8 rounded bg-gray-100" />}
                <span className="min-w-0 flex-1 truncate">{p?.nombre || 'Producto no disponible'}</span>
                <button type="button" className="px-1 text-gray-500" onClick={() => mover(k, -1)} aria-label="Subir">↑</button>
                <button type="button" className="px-1 text-gray-500" onClick={() => mover(k, 1)} aria-label="Bajar">↓</button>
                <button type="button" className="px-1 text-xs text-red-600" onClick={() => onChange(ids.filter((x) => x !== id))}>Quitar</button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          placeholder="Buscar producto (ej: boxer, corpiño, 5051)"
          value={q}
          onChange={(e) => setQ((e.target as any).value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); buscar(); } }}
        />
        <button type="button" className="rounded-xl bg-gray-900 px-4 py-2 text-sm text-white" onClick={buscar}>{buscando ? '…' : 'Buscar'}</button>
      </div>
      {res.length > 0 && (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {res.map((p) => {
            const ya = ids.includes(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={ya || (max > 1 && ids.length >= max)}
                  onClick={() => onChange(max === 1 ? [p.id] : [...ids, p.id])}
                  className={`w-full rounded-lg bg-white p-2 text-left text-xs ring-1 ${ya ? 'opacity-50 ring-green-500' : 'ring-black/5 hover:ring-gray-400'}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.image && <img src={tnImgClient(p.image, 240)} alt="" loading="lazy" className="mb-1 aspect-[3/4] w-full rounded object-cover" />}
                  <span className="line-clamp-2">{p.nombre}</span>
                  <span className="mt-1 block font-semibold">{ya ? '✓ Agregado' : '+ Agregar'}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}


export default function EditorDiseno({ info, onSalir }: { info: any; onSalir: () => void }) {
  const t = info.tienda;
  const inicial = t.disenoBorrador || { diseno: t.diseno, colorPrimario: t.colorPrimario, colorSecundario: t.colorSecundario, fuente: t.fuente };
  const [d, setD] = useState<any>(() => JSON.parse(JSON.stringify(inicial.diseno || t.diseno)));
  const [marca, setMarca] = useState<any>({
    colorPrimario: inicial.colorPrimario || t.colorPrimario,
    colorSecundario: inicial.colorSecundario || t.colorSecundario,
    fuente: inicial.fuente || t.fuente,
  });
  const [panel, setPanel] = useState<Panel>('menu');
  const [dispositivo, setDispositivo] = useState<'celular' | 'compu'>('compu');
  const [estado, setEstado] = useState<'publicado' | 'cambios' | 'guardando' | 'borrador' | 'error'>(t.disenoBorrador ? 'borrador' : 'publicado');
  const [verPreview, setVerPreview] = useState(false); // en celular: alternar panel / vista previa
  const [recarga, setRecarga] = useState(0);
  const [toast, setToast] = useState('');
  const [abierta, setAbierta] = useState<string | null>(null);
  const [agregando, setAgregando] = useState(false);
  const [subiendo, setSubiendo] = useState('');
  const [publicando, setPublicando] = useState(false);
  const [cats, setCats] = useState<{ nombre: string; path: string }[]>([]);
  const iframeRef = useRef<any>(null);
  const scrollRef = useRef(0);
  const primera = useRef(true);

  useEffect(() => {
    fetch(`/api/tienda/${t.slug}/categorias`).then((r) => r.json()).then((x: any) => setCats(x.categorias || [])).catch(() => {});
  }, [t.slug]);

  useEffect(() => {
    if (!toast) return;
    const k = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(k);
  }, [toast]);

  // Cada cambio se guarda como borrador (1 seg después) y se recarga la vista previa
  const guardarBorrador = useCallback(async (diseno: any, m: any) => {
    setEstado('guardando');
    try {
      await api('', 'PUT', { accion: 'borrador', borrador: { diseno, ...m } });
      setEstado('borrador');
      try { scrollRef.current = iframeRef.current?.contentWindow?.scrollY || 0; } catch { /* nada */ }
      setRecarga((n) => n + 1);
    } catch (e: any) {
      setEstado('error');
      setToast(e.message);
    }
  }, []);

  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      // Al abrir: activamos la vista previa del borrador (cookie) aunque no haya cambios
      api('', 'PUT', { accion: 'borrador', borrador: { diseno: d, ...marca } }).then(() => setRecarga((n) => n + 1)).catch(() => {});
      return;
    }
    setEstado('cambios');
    const k = setTimeout(() => guardarBorrador(d, marca), 900);
    return () => clearTimeout(k);
  }, [d, marca, guardarBorrador]);

  async function publicar() {
    setPublicando(true);
    try {
      await api('', 'PUT', { accion: 'publicar', borrador: { diseno: d, ...marca } });
      setEstado('publicado');
      setToast('¡Cambios publicados!');
      setRecarga((n) => n + 1);
    } catch (e: any) { setToast(e.message); }
    setPublicando(false);
  }

  async function descartar() {
    if (!(globalThis as any).confirm('¿Descartar todos los cambios sin publicar?')) return;
    try {
      await api('', 'PUT', { accion: 'descartar' });
      (globalThis as any).location.reload();
    } catch (e: any) { setToast(e.message); }
  }

  async function salir() {
    if (estado === 'borrador' || estado === 'cambios') {
      if (!(globalThis as any).confirm('Tenés cambios sin publicar. Quedan guardados como borrador para la próxima. ¿Salir igual?')) return;
    }
    onSalir();
  }

  const upd = (id: string, cambios: any) => setD((x: any) => ({ ...x, secciones: x.secciones.map((s: any) => (s.id === id ? { ...s, ...cambios } : s)) }));
  const mover = (i: number, dir: number) => setD((x: any) => {
    const arr = [...x.secciones]; const j = i + dir;
    if (j < 0 || j >= arr.length) return x;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    return { ...x, secciones: arr };
  });
  const quitar = (id: string) => { if ((globalThis as any).confirm('¿Quitar esta sección?')) setD((x: any) => ({ ...x, secciones: x.secciones.filter((s: any) => s.id !== id) })); };
  const agregar = (tipo: any) => {
    const s = seccionNueva(tipo);
    setD((x: any) => ({ ...x, secciones: [...x.secciones, s] }));
    setAbierta(s.id);
    setAgregando(false);
  };

  function aplicarPrearmada(p: Prearmada) {
    if (!(globalThis as any).confirm(`¿Usar la plantilla “${p.nombre}”? Cambia colores, letra, encabezado y secciones. Tus fotos del carrusel se mantienen.`)) return;
    const slides = (d.secciones.find((s: any) => s.tipo === 'carrusel')?.slides) || [];
    const secciones = p.secciones().map((s: any) => (s.tipo === 'carrusel' ? { ...s, slides } : s));
    setD((x: any) => ({
      ...x,
      plantilla: p.plantilla,
      header: p.header,
      anuncio: { ...x.anuncio, activo: true, mensajes: p.anuncio, texto: p.anuncio[0] || '', desliza: p.anuncio.length > 1 },
      secciones,
    }));
    setMarca({ colorPrimario: p.colorPrimario, colorSecundario: p.colorSecundario, fuente: p.fuente });
    setToast(`Plantilla “${p.nombre}” aplicada (en borrador)`);
  }

  async function subir(file: any, onUrl: (u: string) => void, key: string) {
    if (!file) return;
    setSubiendo(key);
    const fd = new FormData();
    fd.append('file', await reducirImagen(file, 1920));
    fd.append('kind', 'slide');
    const r = await fetch('/api/mi-tienda/upload', { method: 'POST', body: fd, credentials: 'include' });
    const res: any = await r.json().catch(() => ({}));
    setSubiendo('');
    if (!r.ok) return setToast(res.error || 'No se pudo subir la imagen');
    onUrl(res.url);
  }

  const ImgInput = ({ label, onUrl, k }: { label: string; onUrl: (u: string) => void; k: string }) => (
    <label className={`${btnSec} inline-flex cursor-pointer items-center gap-2 bg-white`}>
      {subiendo === k ? 'Subiendo…' : label}
      <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => subir((e.target as any).files?.[0], onUrl, k)} />
    </label>
  );

  const info2 = (tipo: string) => SECCIONES_INFO.find((x) => x.tipo === tipo);
  function resumen(s: any): string {
    switch (s.tipo) {
      case 'carrusel': return `${s.slides.length} imagen${s.slides.length === 1 ? '' : 'es'}`;
      case 'beneficios': return s.items.map((b: any) => b.titulo).join(' · ');
      case 'productos': return `${s.titulo || 'Sin título'} · ${({ destacados: 'mis destacados', mas_vendidos: 'más vendidos', nuevos: 'nuevos ingresos', categoria: 'de una categoría', todos: 'todos', elegidos: `${(s.productos || []).length} elegidos` } as any)[s.fuente]}`;
      case 'banners': return `${s.items.length} banner${s.items.length === 1 ? '' : 's'}`;
      case 'contador': return s.hasta ? `Termina ${new Date(s.hasta).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}` : 'Sin fecha';
      default: return s.titulo || '';
    }
  }

  function editor(s: any) {
    switch (s.tipo) {
      case 'carrusel':
        return (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">Ideal: 1920×730 px (compu) y 1080×1350 px (celular). Hasta 6 imágenes.</p>
            {s.slides.map((sl: any, k: number) => (
              <div key={k} className="space-y-2 rounded-xl bg-gray-50 p-3">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sl.imagen} alt="" className="h-14 w-28 rounded object-cover" />
                  <ImgInput label="Cambiar" k={`${s.id}-${k}`} onUrl={(u) => upd(s.id, { slides: s.slides.map((x: any, j: number) => (j === k ? { ...x, imagen: u } : x)) })} />
                  <ImgInput label={sl.imagenMobile ? 'Cambiar versión celular' : '+ Versión celular'} k={`${s.id}-m${k}`} onUrl={(u) => upd(s.id, { slides: s.slides.map((x: any, j: number) => (j === k ? { ...x, imagenMobile: u } : x)) })} />
                  <button type="button" className="ml-auto text-xs text-red-600" onClick={() => upd(s.id, { slides: s.slides.filter((_: any, j: number) => j !== k) })}>Quitar</button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(['titulo', 'boton', 'texto', 'link'] as const).map((f) => (
                    <input key={f} className={input} placeholder={({ titulo: 'Título (opcional)', boton: 'Texto del botón', texto: 'Bajada', link: 'Link: /categoria/... o https://' } as any)[f]}
                      value={sl[f] || ''} onChange={(e) => upd(s.id, { slides: s.slides.map((x: any, j: number) => (j === k ? { ...x, [f]: val(e) } : x)) })} />
                  ))}
                </div>
              </div>
            ))}
            {s.slides.length < 6 && <ImgInput label="+ Agregar imagen" k={`${s.id}-new`} onUrl={(u) => upd(s.id, { slides: [...s.slides, { imagen: u }] })} />}
          </div>
        );
      case 'beneficios':
        return (
          <div className="space-y-2">
            {s.items.map((b: any, k: number) => (
              <div key={k} className="grid gap-2 sm:grid-cols-[130px_1fr_1.4fr_auto]">
                <select className={input} value={b.icono} onChange={(e) => upd(s.id, { items: s.items.map((x: any, j: number) => (j === k ? { ...x, icono: val(e) } : x)) })}>
                  {ICONOS.map((ic) => <option key={ic} value={ic}>{({ envio: '🚚 Envío', pago: '💳 Pago', cambio: '🔁 Cambios', whatsapp: '💬 WhatsApp', seguro: '🛡️ Seguro', regalo: '🎁 Regalo' } as any)[ic]}</option>)}
                </select>
                <input className={input} placeholder="Título" value={b.titulo} onChange={(e) => upd(s.id, { items: s.items.map((x: any, j: number) => (j === k ? { ...x, titulo: val(e) } : x)) })} />
                <input className={input} placeholder="Detalle" value={b.texto} onChange={(e) => upd(s.id, { items: s.items.map((x: any, j: number) => (j === k ? { ...x, texto: val(e) } : x)) })} />
                <button type="button" className="text-xs text-red-600" onClick={() => upd(s.id, { items: s.items.filter((_: any, j: number) => j !== k) })}>Quitar</button>
              </div>
            ))}
            {s.items.length < 4 && <button type="button" className={btnSec} onClick={() => upd(s.id, { items: [...s.items, { icono: 'regalo', titulo: '', texto: '' }] })}>+ Beneficio</button>}
          </div>
        );
      case 'categorias':
        return (
          <div className="grid gap-2 sm:grid-cols-3">
            <input className={input} placeholder="Título" value={s.titulo} onChange={(e) => upd(s.id, { titulo: val(e) })} />
            <select className={input} value={s.formato} onChange={(e) => upd(s.id, { formato: val(e) })}>
              <option value="tarjetas">Tarjetas con foto</option>
              <option value="circulos">Círculos</option>
            </select>
            <select className={input} value={s.cantidad} onChange={(e) => upd(s.id, { cantidad: Number(val(e)) })}>
              {[3, 4, 6, 8].map((n) => <option key={n} value={n}>Mostrar {n}</option>)}
            </select>
          </div>
        );
      case 'productos':
        return (
          <div className="grid gap-2 sm:grid-cols-2">
            <input className={input} placeholder="Título" value={s.titulo} onChange={(e) => upd(s.id, { titulo: val(e) })} />
            <select className={input} value={s.fuente} onChange={(e) => upd(s.id, { fuente: val(e) })}>
              <option value="destacados">Mis destacados</option>
              <option value="mas_vendidos">Más vendidos</option>
              <option value="nuevos">Nuevos ingresos</option>
              <option value="categoria">De una categoría</option>
              <option value="todos">Todos (con páginas)</option>
              <option value="elegidos">Elegidos por mí (a mano)</option>
            </select>
            {s.fuente === 'elegidos' && (
              <div className="sm:col-span-2">
                <SelectorProductos ids={s.productos || []} onChange={(ids) => upd(s.id, { productos: ids })} />
              </div>
            )}
            {s.fuente === 'categoria' && (
              <select className={`${input} sm:col-span-2`} value={s.categoria} onChange={(e) => upd(s.id, { categoria: val(e) })}>
                <option value="">Elegí la categoría…</option>
                {cats.map((c) => <option key={c.path} value={c.path}>{c.nombre}</option>)}
              </select>
            )}
            {s.fuente !== 'todos' && (
              <>
                <select className={input} value={s.formato} onChange={(e) => upd(s.id, { formato: val(e) })}>
                  <option value="grilla">Grilla</option>
                  <option value="slider">Carrusel deslizable</option>
                </select>
                {s.fuente !== 'elegidos' && (
                  <select className={input} value={s.cantidad} onChange={(e) => upd(s.id, { cantidad: Number(val(e)) })}>
                    {[4, 8, 12, 16].map((n) => <option key={n} value={n}>{n} productos</option>)}
                  </select>
                )}
              </>
            )}
            {s.fuente === 'destacados' && <p className="text-xs text-gray-500 sm:col-span-2">Los destacados se eligen en la pestaña “Productos”. Si no marcaste ninguno, esta sección no se muestra.</p>}
          </div>
        );
      case 'banners':
        return (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">1 banner = ancho completo · 2 o 3 = lado a lado.</p>
            {s.items.map((b: any, k: number) => (
              <div key={k} className="flex flex-wrap items-center gap-2 rounded-xl bg-gray-50 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.imagen} alt="" className="h-12 w-16 rounded object-cover" />
                <input className={`${input} w-40 flex-1`} placeholder="Título" value={b.titulo || ''} onChange={(e) => upd(s.id, { items: s.items.map((x: any, j: number) => (j === k ? { ...x, titulo: val(e) } : x)) })} />
                <input className={`${input} w-40 flex-1`} placeholder="Link" value={b.link || ''} onChange={(e) => upd(s.id, { items: s.items.map((x: any, j: number) => (j === k ? { ...x, link: val(e) } : x)) })} />
                <button type="button" className="text-xs text-red-600" onClick={() => upd(s.id, { items: s.items.filter((_: any, j: number) => j !== k) })}>Quitar</button>
              </div>
            ))}
            {s.items.length < 3 && <ImgInput label="+ Agregar banner" k={`${s.id}-new`} onUrl={(u) => upd(s.id, { items: [...s.items, { imagen: u }] })} />}
          </div>
        );
      case 'imagen_texto':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {s.imagen && <img src={s.imagen} alt="" className="h-14 w-14 rounded object-cover" />}
              <ImgInput label={s.imagen ? 'Cambiar imagen' : '+ Imagen'} k={`${s.id}-img`} onUrl={(u) => upd(s.id, { imagen: u })} />
              <select className={`${input} w-auto`} value={s.lado} onChange={(e) => upd(s.id, { lado: val(e) })}>
                <option value="izq">Imagen a la izquierda</option>
                <option value="der">Imagen a la derecha</option>
              </select>
            </div>
            <input className={input} placeholder="Título" value={s.titulo} onChange={(e) => upd(s.id, { titulo: val(e) })} />
            <textarea className={input} rows={3} placeholder="Texto" value={s.texto} onChange={(e) => upd(s.id, { texto: val(e) })} />
            <div className="grid gap-2 sm:grid-cols-2">
              <input className={input} placeholder="Botón" value={s.boton} onChange={(e) => upd(s.id, { boton: val(e) })} />
              <input className={input} placeholder="Link del botón" value={s.link} onChange={(e) => upd(s.id, { link: val(e) })} />
            </div>
          </div>
        );
      case 'texto':
        return (
          <div className="space-y-2">
            <input className={input} placeholder="Título (vacío = “Sobre tu tienda”)" value={s.titulo} onChange={(e) => upd(s.id, { titulo: val(e) })} />
            <textarea className={input} rows={4} placeholder="Texto (vacío = usa “Sobre tu tienda” de Marca y datos)" value={s.texto} onChange={(e) => upd(s.id, { texto: val(e) })} />
          </div>
        );
      case 'video':
        return (
          <div className="grid gap-2 sm:grid-cols-2">
            <input className={input} placeholder="Título" value={s.titulo} onChange={(e) => upd(s.id, { titulo: val(e) })} />
            <input className={input} placeholder="Link de YouTube" value={s.url} onChange={(e) => upd(s.id, { url: val(e) })} />
          </div>
        );
      case 'redes':
        return (
          <div className="space-y-2">
            <input className={input} placeholder="Título" value={s.titulo} onChange={(e) => upd(s.id, { titulo: val(e) })} />
            <input className={input} placeholder="Texto" value={s.texto} onChange={(e) => upd(s.id, { texto: val(e) })} />
            <p className="text-xs text-gray-500">Usa tu Instagram y WhatsApp de “Marca y datos”.</p>
          </div>
        );
      case 'contador':
        return (
          <div className="space-y-2">
            <input className={input} placeholder="Título" value={s.titulo} onChange={(e) => upd(s.id, { titulo: val(e) })} />
            <input className={input} placeholder="Texto (opcional)" value={s.texto} onChange={(e) => upd(s.id, { texto: val(e) })} />
            <label className="block text-xs text-gray-600">Termina el
              <input type="datetime-local" className={`${input} mt-1`} value={s.hasta} onChange={(e) => upd(s.id, { hasta: val(e) })} />
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <input className={input} placeholder="Botón" value={s.boton} onChange={(e) => upd(s.id, { boton: val(e) })} />
              <input className={input} placeholder="Link del botón" value={s.link} onChange={(e) => upd(s.id, { link: val(e) })} />
            </div>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {s.imagen && <img src={s.imagen} alt="" className="h-12 w-16 rounded object-cover" />}
              <ImgInput label={s.imagen ? 'Cambiar fondo' : '+ Imagen de fondo (opcional)'} k={`${s.id}-img`} onUrl={(u) => upd(s.id, { imagen: u })} />
              {s.imagen && <button type="button" className="text-xs text-red-600" onClick={() => upd(s.id, { imagen: '' })}>Quitar</button>}
            </div>
            <p className="text-xs text-gray-500">Cuando llega la fecha, la sección se oculta sola.</p>
          </div>
        );
      case 'producto_principal':
        return (
          <div className="space-y-2">
            <input className={input} placeholder="Título (opcional)" value={s.titulo} onChange={(e) => upd(s.id, { titulo: val(e) })} />
            <SelectorProductos ids={s.productoId ? [s.productoId] : []} max={1} onChange={(ids) => upd(s.id, { productoId: ids[ids.length - 1] || '' })} />
          </div>
        );
    }
    return null;
  }

  // ------------------------------------------------------------------
  // Paneles
  // ------------------------------------------------------------------
  const Volver = ({ titulo }: { titulo: string }) => (
    <button type="button" onClick={() => setPanel('menu')} className="flex w-full items-center gap-2 border-b border-gray-100 px-5 py-4 text-left text-sm font-semibold">
      <span aria-hidden="true">‹</span> {titulo}
    </button>
  );
  const Item = ({ id, icono, titulo, detalle }: { id: Panel; icono: string; titulo: string; detalle?: string }) => (
    <button type="button" onClick={() => setPanel(id)} className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-gray-50">
      <span className="w-6 text-center text-lg" aria-hidden="true">{icono}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{titulo}</span>
        {detalle && <span className="block truncate text-xs text-gray-500">{detalle}</span>}
      </span>
      <span className="text-gray-400" aria-hidden="true">›</span>
    </button>
  );

  function contenidoPanel() {
    switch (panel) {
      case 'menu':
        return (
          <div className="py-2">
            <p className="px-5 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Plantilla</p>
            <Item id="plantillas" icono="🎨" titulo="Plantillas prearmadas" detalle="Elegí un diseño listo y cambialo a tu gusto" />
            <p className="px-5 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Imagen de tu marca</p>
            <Item id="colores" icono="🖌️" titulo="Colores de tu marca" />
            <Item id="letra" icono="🔤" titulo="Tipo de letra" detalle={FUENTES.find((f) => f.id === marca.fuente)?.nombre} />
            <p className="px-5 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Configuraciones</p>
            <Item id="encabezado" icono="⬆️" titulo="Encabezado" detalle="Barra de anuncios y logo" />
            <Item id="inicio" icono="🏠" titulo="Página de inicio" detalle={`${d.secciones.filter((s: any) => s.visible).length} secciones visibles`} />
            <Item id="listado" icono="▦" titulo="Listado de productos" detalle="Productos por fila y fotos" />
            <div className="mt-4 border-t border-gray-100 px-5 pt-4 text-xs text-gray-500">
              <p>El logo, el nombre y tus redes se cambian en <strong>Mi Tienda → Marca y datos</strong>.</p>
              {estado !== 'publicado' && <button type="button" className="mt-3 text-red-600 underline" onClick={descartar}>Descartar cambios sin publicar</button>}
            </div>
          </div>
        );

      case 'plantillas':
        return (
          <div>
            <Volver titulo="Plantillas prearmadas" />
            <div className="space-y-3 p-5">
              <p className="text-xs text-gray-500">Tocá una para probarla en la vista previa. No se publica hasta que toques “Publicar cambios”.</p>
              {PREARMADAS.map((p) => (
                <button key={p.id} type="button" onClick={() => aplicarPrearmada(p)} className="block w-full rounded-xl border border-gray-200 p-3 text-left hover:border-pink-400">
                  <div className="relative">
                    <MiniPlantilla id={p.plantilla} />
                    <span className="absolute right-2 top-2 flex gap-1">
                      <span className="h-4 w-4 rounded-full ring-2 ring-white" style={{ background: p.colorPrimario }} />
                      <span className="h-4 w-4 rounded-full ring-2 ring-white" style={{ background: p.colorSecundario }} />
                    </span>
                  </div>
                  <span className="mt-2 block text-sm font-semibold">{p.nombre}</span>
                  <span className="block text-xs text-gray-500">{p.detalle}</span>
                </button>
              ))}
              <div className="border-t border-gray-100 pt-4">
                <p className="mb-2 text-sm font-semibold">Solo cambiar el estilo</p>
                <p className="mb-3 text-xs text-gray-500">Cambia letra de títulos, tarjetas y botones. Mantiene tus colores y secciones.</p>
                <div className="grid grid-cols-2 gap-2">
                  {PLANTILLAS.map((p) => (
                    <button key={p.id} type="button" onClick={() => setD({ ...d, plantilla: p.id })}
                      className={`rounded-lg border p-2 text-left ${d.plantilla === p.id ? 'border-pink-500 ring-2 ring-pink-200' : 'border-gray-200'}`}>
                      <MiniPlantilla id={p.id} />
                      <span className="mt-1 block text-xs font-medium">{p.nombre}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'colores':
        return (
          <div>
            <Volver titulo="Colores de tu marca" />
            <div className="space-y-5 p-5">
              <label className="flex items-center justify-between gap-3 text-sm">
                <span><span className="block font-medium">Color principal</span><span className="text-xs text-gray-500">Botones, precios y detalles</span></span>
                <input type="color" className="h-10 w-14 cursor-pointer rounded" value={marca.colorPrimario} onChange={(e) => setMarca({ ...marca, colorPrimario: val(e) })} />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span><span className="block font-medium">Color secundario</span><span className="text-xs text-gray-500">Títulos y barra de anuncios</span></span>
                <input type="color" className="h-10 w-14 cursor-pointer rounded" value={marca.colorSecundario} onChange={(e) => setMarca({ ...marca, colorSecundario: val(e) })} />
              </label>
              <div>
                <p className="mb-2 text-sm font-medium">Combinaciones sugeridas</p>
                <div className="grid grid-cols-4 gap-2">
                  {PALETAS.map(([a, b]) => (
                    <button key={a + b} type="button" onClick={() => setMarca({ ...marca, colorPrimario: a, colorSecundario: b })}
                      className={`flex h-10 overflow-hidden rounded-lg ring-1 ${marca.colorPrimario === a && marca.colorSecundario === b ? 'ring-2 ring-pink-500' : 'ring-black/10'}`} aria-label={`${a} y ${b}`}>
                      <span className="flex-1" style={{ background: a }} /><span className="flex-1" style={{ background: b }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'letra':
        return (
          <div>
            <Volver titulo="Tipo de letra" />
            <div className="space-y-2 p-5">
              {FUENTES.map((f) => (
                <button key={f.id} type="button" onClick={() => setMarca({ ...marca, fuente: f.id })}
                  className={`block w-full rounded-xl border p-4 text-left ${marca.fuente === f.id ? 'border-pink-500 ring-2 ring-pink-200' : 'border-gray-200'}`}>
                  <span className={`block text-2xl ${f.muestra}`}>Aa · {t.nombre}</span>
                  <span className="mt-1 block text-sm font-medium">{f.nombre}</span>
                  <span className="block text-xs text-gray-500">{f.detalle}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 'encabezado': {
        const a = d.anuncio;
        const setA = (c: any) => setD({ ...d, anuncio: { ...a, ...c } });
        const msgs = [...(a.mensajes || []), '', '', ''].slice(0, 3);
        return (
          <div>
            <Volver titulo="Encabezado" />
            <div className="space-y-6 p-5">
              <div>
                <p className="mb-2 text-sm font-medium">Posición del logo</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {([['auto', 'Según plantilla'], ['centrado', 'Al centro'], ['izquierda', 'A la izquierda']] as const).map(([id, l]) => (
                    <button key={id} type="button" onClick={() => setD({ ...d, header: id })}
                      className={`rounded-lg border px-2 py-2 ${d.header === id ? 'border-pink-500 bg-pink-50' : 'border-gray-200'}`}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Barra de anuncios</p>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!a.activo} onChange={(e) => setA({ activo: chk(e) })} /> Mostrar</label>
                </div>
                {msgs.map((m: string, k: number) => (
                  <input key={k} className={input} maxLength={120} placeholder={`Mensaje ${k + 1}${k === 0 ? ' (ej: Envíos a todo el país)' : ' (opcional)'}`} value={m}
                    onChange={(e) => {
                      const n = [...msgs]; n[k] = val(e);
                      setA({ mensajes: n.filter((x, i) => x || i < k + 1).slice(0, 3), texto: n[0] });
                    }} />
                ))}
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!a.desliza} onChange={(e) => setA({ desliza: chk(e) })} /> Que los mensajes se deslicen</label>
                <input className={input} placeholder="Link al tocar la barra (opcional)" value={a.link} onChange={(e) => setA({ link: val(e) })} />
              </div>
            </div>
          </div>
        );
      }

      case 'listado': {
        const l = d.listado;
        const setL = (c: any) => setD({ ...d, listado: { ...l, ...c } });
        return (
          <div>
            <Volver titulo="Listado de productos" />
            <div className="space-y-6 p-5">
              <div>
                <p className="mb-2 text-sm font-medium">Productos por fila en celulares</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[1, 2].map((n) => <button key={n} type="button" onClick={() => setL({ colMobile: n })} className={`rounded-lg border py-2 ${l.colMobile === n ? 'border-pink-500 bg-pink-50' : 'border-gray-200'}`}>{n}</button>)}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Productos por fila en computadoras</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {[3, 4, 5].map((n) => <button key={n} type="button" onClick={() => setL({ colDesktop: n })} className={`rounded-lg border py-2 ${l.colDesktop === n ? 'border-pink-500 bg-pink-50' : 'border-gray-200'}`}>{n}</button>)}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!l.segundaFoto} onChange={(e) => setL({ segundaFoto: chk(e) })} /> Mostrar la segunda foto al pasar el mouse</label>
            </div>
          </div>
        );
      }

      case 'inicio':
        return (
          <div>
            <Volver titulo="Página de inicio" />
            <div className="space-y-2 p-4">
              <p className="px-1 text-xs text-gray-500">Ordená con las flechas, mostrá u ocultá con el ojo y tocá una sección para editarla.</p>
              <ul className="space-y-2">
                {d.secciones.map((s: any, i: number) => {
                  const meta = info2(s.tipo);
                  return (
                    <li key={s.id} className={`rounded-xl border bg-white ${abierta === s.id ? 'border-pink-300' : 'border-gray-200'}`}>
                      <div className="flex items-center gap-1.5 p-2.5">
                        <button type="button" className={`min-w-0 flex-1 text-left ${s.visible ? '' : 'opacity-50'}`} onClick={() => setAbierta(abierta === s.id ? null : s.id)}>
                          <span className="block text-sm font-medium">{meta?.nombre}</span>
                          <span className="block truncate text-xs text-gray-500">{resumen(s) || meta?.detalle}</span>
                        </button>
                        <button type="button" className="rounded p-1 text-gray-500 disabled:opacity-25" disabled={i === 0} onClick={() => mover(i, -1)} aria-label="Subir">↑</button>
                        <button type="button" className="rounded p-1 text-gray-500 disabled:opacity-25" disabled={i === d.secciones.length - 1} onClick={() => mover(i, 1)} aria-label="Bajar">↓</button>
                        <button type="button" className={`rounded p-1 ${s.visible ? 'text-blue-600' : 'text-gray-400'}`} onClick={() => upd(s.id, { visible: !s.visible })} aria-label={s.visible ? 'Ocultar' : 'Mostrar'} title={s.visible ? 'Ocultar' : 'Mostrar'}>
                          {s.visible ? '👁' : '🚫'}
                        </button>
                      </div>
                      {abierta === s.id && (
                        <div className="space-y-3 border-t border-gray-100 p-3">
                          {editor(s)}
                          <button type="button" className="text-xs text-red-600" onClick={() => quitar(s.id)}>Quitar sección</button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
              {agregando ? (
                <div className="grid gap-2">
                  {SECCIONES_INFO.map((x) => (
                    <button key={x.tipo} type="button" onClick={() => agregar(x.tipo)} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left hover:border-pink-300">
                      <span className="text-lg">{x.emoji}</span>
                      <span><span className="block text-sm font-medium">{x.nombre}</span><span className="block text-xs text-gray-500">{x.detalle}</span></span>
                    </button>
                  ))}
                  <button type="button" className="py-2 text-sm text-gray-500" onClick={() => setAgregando(false)}>Cancelar</button>
                </div>
              ) : (
                <button type="button" className={`${btnSec} w-full bg-white py-2`} onClick={() => setAgregando(true)}>+ Agregar sección</button>
              )}
            </div>
          </div>
        );
    }
  }

  const etiqueta = { publicado: 'Publicado', cambios: 'Cambios sin guardar…', guardando: 'Guardando borrador…', borrador: 'Borrador guardado · sin publicar', error: 'No se pudo guardar' }[estado];

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-gray-100">
      {/* Barra superior */}
      <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-3 py-2.5 sm:px-4">
        <button type="button" onClick={salir} className="rounded-full p-2 text-xl leading-none text-gray-600 hover:bg-gray-100" aria-label="Salir del editor">×</button>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Editar diseño</p>
          <p className={`truncate text-xs ${estado === 'publicado' ? 'text-green-700' : estado === 'error' ? 'text-red-600' : 'text-amber-700'}`}>● {etiqueta}</p>
        </div>
        <div className="mx-auto hidden items-center gap-1 rounded-full bg-gray-100 p-1 lg:flex">
          {([['celular', '📱 Celulares'], ['compu', '🖥️ Computadoras']] as const).map(([id, l]) => (
            <button key={id} type="button" onClick={() => setDispositivo(id)} className={`rounded-full px-3 py-1 text-xs font-medium ${dispositivo === id ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600'}`}>{l}</button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={() => setVerPreview(!verPreview)} className={`${btnSec} lg:hidden`}>{verPreview ? 'Editar' : 'Vista previa'}</button>
          <a href={`/t/${t.slug}`} target="_blank" rel="noopener" className={`${btnSec} hidden sm:inline-block`}>Ver tienda</a>
          <button type="button" className={btn} disabled={publicando || estado === 'publicado' || estado === 'guardando' || !!subiendo} onClick={publicar}>
            {publicando ? 'Publicando…' : 'Publicar cambios'}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Panel de opciones */}
        <aside className={`${verPreview ? 'hidden' : 'flex'} w-full flex-col overflow-y-auto bg-white lg:flex lg:w-[380px] lg:shrink-0 lg:border-r lg:border-gray-200`}>
          {contenidoPanel()}
        </aside>

        {/* Vista previa en vivo */}
        <main className={`${verPreview ? 'flex' : 'hidden'} min-w-0 flex-1 items-start justify-center overflow-auto p-0 lg:flex lg:p-4`}>
          <div className={`h-full w-full overflow-hidden bg-white shadow-sm transition-all ${dispositivo === 'celular' ? 'lg:max-w-[400px] lg:rounded-[28px] lg:ring-8 lg:ring-gray-800' : 'lg:rounded-lg'}`}>
            <iframe
              key={recarga}
              ref={iframeRef}
              src={`/t/${t.slug}?vista=${recarga}`}
              title="Vista previa de la tienda"
              className="h-full w-full border-0"
              onLoad={() => { try { iframeRef.current?.contentWindow?.scrollTo(0, scrollRef.current); } catch { /* nada */ } }}
            />
          </div>
        </main>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-gray-900 px-4 py-2 text-sm text-white shadow-lg" role="status">{toast}</div>
      )}
    </div>
  );
}
