export const redondeo50 = (x: number): number => {
  return Math.round(x / 50) * 50;
};

export const calcularPrecioVenta = (precioMayorista: number, margen: number): number => {
  return redondeo50(precioMayorista * (1 + margen / 100));
};

export const formatCurrency = (amount: number): string => {
  return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};