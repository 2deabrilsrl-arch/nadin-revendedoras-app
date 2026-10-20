'use client';
// Paso a paso para apuntar el dominio a la tienda, según dónde lo compró la revendedora.
import { useState } from 'react';

type Registro = { tipo: string; nombre: string; valor: string; ok?: boolean };

export const PROVEEDORES = [
  { id: 'vercel', nombre: 'Vercel', nota: 'Recomendado' },
  { id: 'nic', nombre: 'NIC.ar (.com.ar)' },
  { id: 'hostinger', nombre: 'Hostinger' },
  { id: 'godaddy', nombre: 'GoDaddy' },
  { id: 'donweb', nombre: 'DonWeb' },
  { id: 'cloudflare', nombre: 'Cloudflare' },
  { id: 'otro', nombre: 'Otro' },
] as const;
export type Proveedor = (typeof PROVEEDORES)[number]['id'];

const mono = 'font-mono text-[11px] bg-white px-1 rounded ring-1 ring-gray-200';

function Copiable({ v }: { v: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className={`${mono} break-all text-left underline decoration-dotted`}
      title="Copiar"
      onClick={() => {
        (globalThis as any).navigator?.clipboard?.writeText(v);
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
    >
      {v}
      {ok && <span className="ml-1 text-green-700 no-underline">copiado</span>}
    </button>
  );
}

/** Lista de registros a cargar, con el nombre de los campos como los llama cada panel. */
function Registros({ registros, campos }: { registros: Registro[]; campos: { tipo: string; nombre: string; valor: string } }) {
  return (
    <ul className="mt-1 space-y-2">
      {registros.map((r, i) => (
        <li key={i} className="rounded-lg bg-white p-2 ring-1 ring-gray-200">
          <p className="font-semibold">Registro {i + 1} {r.ok && '✅'}</p>
          <p>{campos.tipo}: <strong>{r.tipo}</strong></p>
          <p>{campos.nombre}: <Copiable v={r.nombre} />{r.nombre === '@' && <span className="text-gray-500"> (si no te deja poner @, dejalo vacío)</span>}</p>
          <p>{campos.valor}: <Copiable v={r.valor} /></p>
        </li>
      ))}
    </ul>
  );
}

function Pasos({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="mt-2 list-decimal space-y-2 pl-4">
      {items.map((x, i) => <li key={i}>{x}</li>)}
    </ol>
  );
}

const FINAL = <>Volvé acá y tocá <strong>Revisar ahora</strong>. Puede tardar de unos minutos a 24 horas; cuando quede funcionando te llega una notificación.</>;

export default function GuiaDns({ dominio, registros }: { dominio: string; registros: Registro[] }) {
  const [prov, setProv] = useState<Proveedor | ''>('');
  const raiz = dominio.replace(/^www\./, '');
  const pend = registros.filter((r) => !r.ok);
  const lista = pend.length ? pend : registros;
  const hayTxt = lista.some((r) => r.tipo === 'TXT');

  let pasos: React.ReactNode[] = [];
  if (prov === 'vercel') {
    pasos = [
      <>Entrá a <strong>vercel.com</strong> con la cuenta con la que compraste el dominio.</>,
      <>Arriba tocá <strong>Domains</strong> (Dominios) y hacé clic en <strong>{raiz}</strong>.</>,
      <>Buscá la sección <strong>DNS Records</strong> (Registros DNS).</>,
      <>Por cada registro de abajo, completá <strong>Name</strong>, elegí el <strong>Type</strong>, pegá el <strong>Value</strong> y tocá <strong>Add</strong>. Si ya hay uno con el mismo Name y Type, borralo antes (los tres puntitos → Delete).<Registros registros={lista} campos={{ tipo: 'Type', nombre: 'Name', valor: 'Value' }} /></>,
      FINAL,
    ];
  } else if (prov === 'nic') {
    pasos = [
      <>Entrá a <strong>nic.ar</strong> → <strong>Ingresar</strong> con tu CUIT/CUIL y clave fiscal.</>,
      <>Andá a <strong>Mis dominios</strong> y elegí <strong>{raiz}</strong>.</>,
      <>Al lado de tu dominio tocá <strong>Delegar</strong>.</>,
      <>Si ya hay delegaciones cargadas (de otro hosting o de Tiendanube), borralas.</>,
      <>Tocá <strong>Añadir una nueva delegación</strong>, en <strong>Host</strong> pegá <Copiable v="ns1.vercel-dns.com" /> y tocá el ícono de guardar.</>,
      <>Otra vez <strong>Añadir una nueva delegación</strong>, pegá <Copiable v="ns2.vercel-dns.com" /> y guardá. <strong>Ojo:</strong> es <strong>ns1</strong> y <strong>ns2</strong>, con números (el celular a veces los cambia por letras). Mejor tocá el dato para copiarlo y pegalo.</>,
      <>Dejá vacíos los campos de IP y tocá <strong>Ejecutar cambios</strong>.</>,
      <>Listo: <strong>no hace falta cargar la tabla de arriba</strong>, Vercel se encarga. La delegación de NIC tarda unas horas.</>,
      FINAL,
    ];
  } else if (prov === 'hostinger') {
    pasos = [
      <>Entrá a <strong>hpanel.hostinger.com</strong> → <strong>Dominios</strong> → elegí <strong>{raiz}</strong>.</>,
      <>En el menú de la izquierda tocá <strong>DNS / Nameservers</strong>. Si dice que usa otros nameservers, tocá <strong>Cambiar nameservers → Usar nameservers de Hostinger</strong> primero.</>,
      <>En <strong>Administrar registros DNS</strong>, borrá (ícono de tacho) los que ya existan de tipo <strong>A</strong> con nombre <strong>@</strong> y de tipo <strong>CNAME</strong> con nombre <strong>www</strong>.</>,
      <>Agregá cada registro de abajo: elegí el <strong>Tipo</strong>, completá <strong>Nombre</strong> y <strong>Apunta a</strong> (o <strong>Valor</strong>), dejá el TTL como está y tocá <strong>Agregar registro</strong>.<Registros registros={lista} campos={{ tipo: 'Tipo', nombre: 'Nombre', valor: 'Apunta a / Valor' }} /></>,
      FINAL,
    ];
  } else if (prov === 'godaddy') {
    pasos = [
      <>Entrá a <strong>godaddy.com</strong> → tu cuenta → <strong>Mis productos</strong>.</>,
      <>Al lado de <strong>{raiz}</strong> tocá <strong>DNS</strong> (o <strong>Administrar DNS</strong>).</>,
      <>En <strong>Registros DNS</strong>: el registro <strong>A</strong> con nombre <strong>@</strong> (suele decir "Parked") editalo con el lápiz y cambiá el valor. El <strong>CNAME www</strong> también editalo. El resto, agregalo con <strong>Agregar nuevo registro</strong>.</>,
      <>Los datos son:<Registros registros={lista} campos={{ tipo: 'Tipo', nombre: 'Nombre', valor: 'Valor' }} /></>,
      <>Tocá <strong>Guardar</strong> en cada uno.</>,
      FINAL,
    ];
  } else if (prov === 'donweb') {
    pasos = [
      <>Entrá a <strong>donweb.com</strong> → <strong>Mi cuenta</strong> → <strong>Dominios</strong> → elegí <strong>{raiz}</strong>.</>,
      <>Tocá <strong>Administrar DNS</strong> (o <strong>Zona DNS</strong>). Si el dominio usa nameservers de otro lado, primero elegí <strong>Usar DNS de DonWeb</strong>.</>,
      <>Borrá los registros que ya existan de tipo <strong>A</strong> para el dominio principal y <strong>CNAME</strong> para <strong>www</strong>.</>,
      <>Agregá cada registro de abajo. En el nombre, si el panel completa solo el dominio al final, poné únicamente lo que figura acá (ej. <strong>www</strong>).<Registros registros={lista} campos={{ tipo: 'Tipo', nombre: 'Nombre / Host', valor: 'Valor / Contenido' }} /></>,
      <>Guardá los cambios.</>,
      FINAL,
    ];
  } else if (prov === 'cloudflare') {
    pasos = [
      <>Entrá a <strong>dash.cloudflare.com</strong> y elegí <strong>{raiz}</strong>.</>,
      <>Andá a <strong>DNS → Records</strong>. Borrá los <strong>A</strong> de <strong>{raiz}</strong> y el <strong>CNAME www</strong> que ya existan.</>,
      <>Tocá <strong>Add record</strong> por cada uno de abajo. <strong>Importante:</strong> en <strong>Proxy status</strong> dejá la nube <strong>gris (DNS only)</strong>, no naranja.<Registros registros={lista} campos={{ tipo: 'Type', nombre: 'Name', valor: 'IPv4 address / Target / Content' }} /></>,
      <>Tocá <strong>Save</strong> en cada uno.</>,
      FINAL,
    ];
  } else if (prov === 'otro') {
    pasos = [
      <>Entrá al panel de donde compraste el dominio.</>,
      <>Buscá la sección <strong>DNS</strong>, <strong>Zona DNS</strong> o <strong>Registros DNS</strong>.</>,
      <>Si ya hay registros con el mismo nombre y tipo (por ejemplo, los que apuntaban a Tiendanube), borralos o editalos.</>,
      <>Agregá cada registro:<Registros registros={lista} campos={{ tipo: 'Tipo', nombre: 'Nombre / Host', valor: 'Valor / Destino' }} /></>,
      FINAL,
    ];
  }

  return (
    <div className="space-y-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
      <p className="text-sm font-semibold">¿Dónde compraste tu dominio?</p>
      <div className="flex flex-wrap gap-2">
        {PROVEEDORES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setProv(p.id)}
            className={`rounded-full border px-3 py-1 text-xs ${prov === p.id ? 'border-pink-600 bg-pink-600 text-white' : 'border-gray-300 bg-white'}`}
          >
            {p.nombre}{'nota' in p && p.nota ? <span className={prov === p.id ? '' : 'text-pink-700'}> · {p.nota}</span> : null}
          </button>
        ))}
      </div>
      {!prov && <p>Elegí una opción y te mostramos el paso a paso exacto.</p>}
      {prov && <Pasos items={pasos} />}
      {prov && prov !== 'nic' && hayTxt && (
        <p className="text-gray-500">El registro <strong>TXT</strong> (nombre <span className="font-mono">_vercel</span>) sirve para confirmar que el dominio es tuyo. Cargalo igual que los otros.</p>
      )}
    </div>
  );
}
