// Achica las fotos en el navegador antes de subirlas (una foto de celular de 4 MB queda en ~200 KB).
// Así la tienda carga y scrollea rápido aunque la revendedora suba fotos enormes.
export async function reducirImagen(file: any, maxLado = 1920, calidad = 0.82): Promise<any> {
  try {
    const g: any = globalThis as any;
    if (!file || !g.createImageBitmap || !g.document) return file;
    const bmp = await g.createImageBitmap(file);
    const escala = Math.min(1, maxLado / Math.max(bmp.width, bmp.height));
    // Si ya es chica y liviana, se sube como está
    if (escala === 1 && file.size < 400 * 1024) return file;
    const canvas = g.document.createElement('canvas');
    canvas.width = Math.round(bmp.width * escala);
    canvas.height = Math.round(bmp.height * escala);
    canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob: any = await new Promise((ok) => canvas.toBlob(ok, 'image/webp', calidad));
    if (!blob || blob.size >= file.size || blob.type !== 'image/webp') return file;
    const nombre = String(file.name || 'imagen').replace(/\.[^.]+$/, '') + '.webp';
    return new g.File([blob], nombre, { type: 'image/webp' });
  } catch {
    return file;
  }
}
