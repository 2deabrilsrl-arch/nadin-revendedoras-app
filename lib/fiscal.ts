// Datos fiscales de la revendedora (se usan para darla de alta como cliente en Dragonfish)

export const SITUACIONES_FISCALES = [
  { id: 'CF', label: 'Consumidor Final (con DNI)' },
  { id: 'MONO', label: 'Responsable Monotributo' },
  { id: 'RI', label: 'Responsable Inscripto' },
  { id: 'EXENTO', label: 'Exento' },
] as const;

export function esSituacionValida(v: string) {
  return SITUACIONES_FISCALES.some((s) => s.id === v);
}

/** CUIT de 11 dígitos con dígito verificador correcto (devuelve solo números o null) */
export function normalizarCuit(v: string | null | undefined): string | null {
  const d = String(v || '').replace(/\D/g, '');
  if (d.length !== 11) return null;
  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const suma = pesos.reduce((acc, p, i) => acc + p * Number(d[i]), 0);
  let dv = 11 - (suma % 11);
  if (dv === 11) dv = 0;
  if (dv === 10) dv = 9;
  return dv === Number(d[10]) ? d : null;
}

export function formatearCuit(d: string) {
  return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`;
}
