'use client';
// Cargar o actualizar muchos productos propios de una vez con una planilla (Excel, Google Sheets o CSV).
import { useState } from 'react';
import { COLUMNAS, filasDesdeHoja, hojaDesdeCsv, type FilaImport } from '@/lib/importar-propios';

const btn = 'rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';
const btnSec = 'rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50';

async function enviar(body: any) {
  const r = await fetch('/api/mi-tienda/propios/importar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });
  const data: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'No se pudo procesar la planilla.');
  return data;
}

export default function ImportarProductos({ productos, onToast, onCerrar }: { productos: any[]; onToast: (s: string) => void; onCerrar: (cambio: boolean) => void }) {
  const [archivo, setArchivo] = useState('');
  const [filas, setFilas] = useState<FilaImport[] | null>(null);
  const [plan, setPlan] = useState<any>(null);
  const [ocupado, setOcupado] = useState(false);
  const [err, setErr] = useState('');

  // Planilla con los productos que ya tiene (o de ejemplo si no tiene ninguno)
  const descargar = async () => {
    setOcupado(true);
    try {
      const { default: writeExcelFile } = await import('write-excel-file/browser');
      const titulos = COLUMNAS.map((c) => ({ value: c.titulo, fontWeight: 'bold' as const, backgroundColor: '#fce7f3' }));
      const filasXls: any[][] = [];
      for (const p of productos) {
        p.variantes.forEach((v: any, i: number) => {
          filasXls.push([
            p.nombre, v.talle || '', v.color || '', Number(v.precio) || '', v.precioAntes ? Number(v.precioAntes) : '', Number(v.stock) || 0, v.sku || '',
            i === 0 ? p.categoria || '' : '', i === 0 ? p.descripcion || '' : '', i === 0 ? (p.imagenes || []).join(' ') : '',
          ]);
        });
      }
      if (!filasXls.length) {
        filasXls.push(
          ['Cartera Milán', '', 'Negro', 25000, '', 3, 'CAR-01', 'Accesorios > Carteras', 'Cartera de cuero ecológico con cierre.', ''],
          ['Cartera Milán', '', 'Suela', 25000, '', 2, 'CAR-02', '', '', ''],
          ['Medias soquete pack x3', 'Único', 'Surtido', 4500, 5500, 10, '', 'Accesorios > Medias', '', ''],
        );
      }
      await writeExcelFile([titulos, ...filasXls.map((r) => r.map((value) => ({ value })))], {
        columns: [30, 10, 12, 12, 14, 8, 12, 24, 40, 30].map((width) => ({ width })),
        stickyRowsCount: 1,
      } as any).toFile(productos.length ? 'mis-productos.xlsx' : 'planilla-productos.xlsx');
    } catch (e: any) {
      onToast(e?.message || 'No se pudo armar la planilla.');
    }
    setOcupado(false);
  };

  const leer = async (f: File | undefined) => {
    setErr('');
    setPlan(null);
    setFilas(null);
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setErr('El archivo es muy grande (máximo 5 MB).'); return; }
    setArchivo(f.name);
    setOcupado(true);
    try {
      let hoja: unknown[][];
      if (/\.csv$/i.test(f.name) || f.type === 'text/csv') {
        hoja = hojaDesdeCsv(await f.text());
      } else if (/\.xlsx$/i.test(f.name)) {
        const { readSheet } = await import('read-excel-file/browser');
        hoja = (await readSheet(f)) as unknown[][];
      } else {
        throw new Error('Subí un archivo .xlsx (Excel o Google Sheets) o .csv. Si tenés un .xls viejo, abrilo y guardalo como .xlsx.');
      }
      const r = filasDesdeHoja(hoja);
      if (r.error) throw new Error(r.error);
      if (!r.filas.length) throw new Error('La planilla no tiene productos debajo de los títulos.');
      setFilas(r.filas);
      setPlan(await enviar({ filas: r.filas, soloRevisar: true }));
    } catch (e: any) {
      setErr(e?.message || 'No pudimos leer el archivo.');
    }
    setOcupado(false);
  };

  const importar = async () => {
    if (!filas) return;
    setOcupado(true);
    try {
      const r = await enviar({ filas });
      onToast(r.fallidos?.length ? `Listo, con ${r.fallidos.length} producto(s) que no se pudieron guardar: ${r.fallidos.slice(0, 3).join(', ')}` : `Listo: ${r.hechos} producto(s) guardados.`);
      onCerrar(true);
    } catch (e: any) {
      setErr(e?.message || 'No se pudo importar.');
      setOcupado(false);
    }
  };

  const res = plan?.resumen;
  const sinFoto = (plan?.productos || []).filter((p: any) => !p.id && !(p.imagenes || []).length).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Cargar productos con Excel</h2>
        <button type="button" className={btnSec} onClick={() => onCerrar(false)}>Volver</button>
      </div>

      <section className="space-y-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <p className="font-semibold">1. Descargá la planilla</p>
        <p className="text-sm text-gray-600">
          {productos.length
            ? 'Viene con tus productos cargados: cambiá precios o stock, agregá filas nuevas y volvé a subirla.'
            : 'Viene con 3 filas de ejemplo: borralas y escribí tus productos.'}
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
          <li><b>Una fila por cada talle o color.</b> Las filas con el mismo nombre forman un solo producto.</li>
          <li>Obligatorios: <b>Nombre</b> y <b>Precio</b>. Lo demás es opcional.</li>
          <li>Si el producto ya existe (mismo nombre), se actualiza. Una celda vacía no borra lo que ya tenías.</li>
          <li>Las fotos podés agregarlas después desde “Editar” (o pegar links https en la columna Fotos).</li>
        </ul>
        <button type="button" className={btnSec} disabled={ocupado} onClick={descargar}>⬇️ Descargar planilla</button>
      </section>

      <section className="space-y-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <p className="font-semibold">2. Subila completa</p>
        <p className="text-sm text-gray-600">Excel o Google Sheets (Archivo → Descargar → .xlsx). También sirve .csv.</p>
        <label className={`${btnSec} inline-block cursor-pointer`}>
          📂 Elegir archivo
          <input type="file" className="hidden" accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" disabled={ocupado} onChange={(e) => { const el = e.target as any; leer(el.files?.[0]); el.value = ''; }} />
        </label>
        {archivo && <p className="text-xs text-gray-500">{archivo}</p>}
        {ocupado && !plan && <p className="text-sm text-gray-500">Leyendo…</p>}
        {err && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{err}</p>}
      </section>

      {res && (
        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="font-semibold">3. Revisá y confirmá</p>
          <ul className="space-y-1 text-sm">
            <li>🆕 <b>{res.nuevos}</b> productos nuevos ({res.variantesNuevas} talles/colores nuevos en total)</li>
            <li>✏️ <b>{res.actualizados}</b> productos que ya tenías se actualizan ({res.variantesActualizadas} talles/colores)</li>
            {sinFoto > 0 && <li className="text-amber-700">📷 {sinFoto} productos nuevos sin foto: agregáselas después para que se vendan mejor.</li>}
          </ul>
          {plan.errores?.length > 0 && (
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-medium">{plan.errores.length} fila(s) con problemas (no se importan):</p>
              <ul className="mt-1 max-h-48 list-disc overflow-auto pl-5">
                {plan.errores.slice(0, 100).map((e: any, i: number) => <li key={i}>Fila {e.fila}: {e.motivo}</li>)}
              </ul>
            </div>
          )}
          <button type="button" className={btn} disabled={ocupado || !plan.productos?.length} onClick={importar}>
            {ocupado ? 'Guardando…' : `Importar ${plan.productos?.length || 0} producto(s)`}
          </button>
        </section>
      )}
    </div>
  );
}
