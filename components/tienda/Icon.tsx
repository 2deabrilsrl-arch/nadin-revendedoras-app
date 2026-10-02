// Íconos lineales simples para la tienda (sin dependencias)
const paths: Record<string, string> = {
  envio: 'M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  pago: 'M3 6h18v12H3zM3 10h18M7 15h3',
  cambio: 'M4 9h13l-3-3M20 15H7l3 3',
  whatsapp: 'M20 12a8 8 0 0 1-11.8 7L4 20l1.1-4A8 8 0 1 1 20 12Z',
  seguro: 'M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3ZM9 12l2 2 4-4',
  regalo: 'M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-2-3-5-3-5-1s3 1 5 1c2 0 5 1 5-1s-3-2-5 1',
  menu: 'M4 7h16M4 12h16M4 17h16',
  cerrar: 'M6 6l12 12M18 6 6 18',
  buscar: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-3.5-3.5',
  bolsa: 'M6 8h12l-1 12H7L6 8ZM9 8a3 3 0 0 1 6 0',
  flechaIzq: 'M15 5l-7 7 7 7',
  flechaDer: 'M9 5l7 7-7 7',
  instagram: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4ZM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM17.5 6.5h.01',
  facebook: 'M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8Z',
  tiktok: 'M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5M14 4c.5 2.5 2.5 4 5 4',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
};

export default function Icon({ name, size = 22, className = '', strokeWidth = 1.6 }: { name: string; size?: number; className?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={paths[name] || ''} />
    </svg>
  );
}
