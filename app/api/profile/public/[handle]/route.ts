import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener perfil público por handle
export async function GET(
  req: NextRequest,
  { params }: { params: { handle: string } }
) {
  try {
    const handle = params.handle;

    if (!handle) {
      return NextResponse.json(
        { error: 'Handle es requerido' },
        { status: 400 }
      );
    }

    // Buscar usuario por handle
    const user = await prisma.user.findUnique({
      where: { handle },
      select: {
        name: true,
        handle: true,
        telefono: true,
        profilePhoto: true,
        bio: true,
        instagram: true,
        facebook: true,
        tiktok: true,
        whatsappBusiness: true,
        linkedin: true,
        twitter: true,
        youtube: true,
        website: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
      );
    }

    // Construir respuesta pública
    const publicProfile = {
      name: user.name,
      handle: user.handle,
      telefono: user.telefono,
      profilePhoto: user.profilePhoto,
      bio: user.bio,
      instagram: user.instagram,
      facebook: user.facebook,
      tiktok: user.tiktok,
      whatsappBusiness: user.whatsappBusiness,
      linkedin: user.linkedin,
      twitter: user.twitter,
      youtube: user.youtube,
      website: user.website
    };

    return NextResponse.json(publicProfile);

  } catch (error) {
    console.error('❌ Error obteniendo perfil público:', error);
    return NextResponse.json(
      { error: 'Error al obtener perfil público' },
      { status: 500 }
    );
  }
}
