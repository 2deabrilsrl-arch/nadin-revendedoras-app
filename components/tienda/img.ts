export function tnImgClient(src: string, size = 240): string {
  if (!src) return '';
  return src.replace(/-(\d+)-(\d+)\.(jpg|jpeg|png|webp)(\?.*)?$/i, `-${size}-0.$3`);
}
