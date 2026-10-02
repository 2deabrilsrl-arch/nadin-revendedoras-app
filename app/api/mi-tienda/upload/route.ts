// Subida de logo / banner de la tienda a Supabase Storage (bucket público "tiendas")
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserAndTienda, noAuth, bad } from '@/lib/mi-tienda';

export const dynamic = 'force-dynamic';
const BUCKET = 'tiendas';
const TIPOS: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };

export async function POST(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const form = await req.formData().catch(() => null);
  const file = form?.get('file') as any;
  const kind = String(form?.get('kind') || 'logo') === 'banner' ? 'banner' : 'logo';
  if (!file || typeof file.arrayBuffer !== 'function') return bad('No llegó la imagen.');
  const ext = TIPOS[file.type];
  if (!ext) return bad('La imagen tiene que ser PNG, JPG o WEBP.');
  if (file.size > 3 * 1024 * 1024) return bad('La imagen pesa más de 3 MB.');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return bad('Falta configurar el almacenamiento de imágenes.', 500);
  const supabase = createClient(url, key);

  const path = `${ctx.tienda.id}/${kind}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  let up = await supabase.storage.from(BUCKET).upload(path, buffer, { contentType: file.type, upsert: true });
  if (up.error && /not found/i.test(up.error.message)) {
    await supabase.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 3 * 1024 * 1024 });
    up = await supabase.storage.from(BUCKET).upload(path, buffer, { contentType: file.type, upsert: true });
  }
  if (up.error) return bad('No se pudo subir la imagen.', 500);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
