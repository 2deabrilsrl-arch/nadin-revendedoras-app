import { NextRequest, NextResponse } from 'next/server';

interface UploadPhotoBody {
  userId: string;
  photo: string;
}

// POST - Subir foto de perfil
// Nota: Esta implementación usa base64 directamente
// Para producción se recomienda usar un servicio como Cloudinary, S3, etc.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as UploadPhotoBody;
    const { userId, photo } = body;

    if (!userId || !photo) {
      return NextResponse.json(
        { error: 'userId y photo son requeridos' },
        { status: 400 }
      );
    }

    // Validar que sea una imagen base64
    if (!photo.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Formato de imagen inválido' },
        { status: 400 }
      );
    }

    // Por ahora, guardamos el base64 directamente
    // En producción, deberías subirlo a un servicio de storage
    const photoUrl = photo;

    return NextResponse.json({ 
      success: true,
      url: photoUrl 
    });

  } catch (error) {
    console.error('❌ Error subiendo foto:', error);
    return NextResponse.json(
      { error: 'Error al subir foto' },
      { status: 500 }
    );
  }
}

/*
 * NOTA PARA PRODUCCIÓN:
 * 
 * Para usar un servicio de storage real (recomendado):
 * 
 * 1. Cloudinary:
 *    - npm install cloudinary
 *    - Configurar credenciales en .env
 *    - Subir imagen y obtener URL pública
 * 
 * 2. AWS S3:
 *    - npm install @aws-sdk/client-s3
 *    - Configurar bucket y credenciales
 *    - Subir imagen y obtener URL pública
 * 
 * 3. Vercel Blob:
 *    - npm install @vercel/blob
 *    - Usar put() para subir
 *    - Obtener URL pública
 * 
 * Ejemplo con Vercel Blob:
 * 
 * import { put } from '@vercel/blob';
 * 
 * const blob = await put(`profile-${userId}.jpg`, photo, {
 *   access: 'public',
 *   contentType: 'image/jpeg'
 * });
 * 
 * return NextResponse.json({ url: blob.url });
 */
