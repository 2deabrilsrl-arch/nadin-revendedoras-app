export function tnImgClient(src: string, size = 240): string {
  if (!src) return '';
  // Tiendanube no tiene versión -1024-0: para tamaños grandes se usa la original (-1024-1024)
  if (size >= 1024) return src;
  return src.replace(/-(\d+)-(\d+)\.(jpg|jpeg|png|webp)(\?.*)?$/i, `-${size}-0.$3`);
}
