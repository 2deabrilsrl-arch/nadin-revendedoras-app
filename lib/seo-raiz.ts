// lib/seo-raiz.ts
// Dominio de las tiendas (mitiendanadin.com): qué se indexa en la raíz.
export function dominioTiendas(): string {
  return (process.env.TIENDAS_ROOT_DOMAIN || '').toLowerCase();
}
export function urlPortadaTiendas(): string | null {
  const root = dominioTiendas();
  return root ? `https://www.${root}` : null;
}
export function esHostRaiz(host: string | null): boolean {
  const root = dominioTiendas();
  const h = (host || '').split(':')[0].toLowerCase();
  return !!root && (h === root || h === `www.${root}`);
}
