import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener perfil del usuario
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        dni: true,
        telefono: true,
        handle: true,
        margen: true,
        cbu: true,
        alias: true,
        cvu: true,
        profilePhoto: true,
        bio: true,
        instagram: true,
        facebook: true,
        tiktok: true,
        whatsappBusiness: true,
        linkedin: true,
        twitter: true,
        youtube: true,
        website: true,
        createdAt: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);

  } catch (error) {
    console.error('❌ Error obteniendo perfil:', error);
    return NextResponse.json(
      { error: 'Error al obtener perfil' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar perfil del usuario
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, ...updateData } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    // Validar que el handle sea único si se está cambiando
    if (updateData.handle) {
      const existing = await prisma.user.findFirst({
        where: {
          handle: updateData.handle,
          NOT: { id: userId }
        }
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Este handle ya está en uso' },
          { status: 400 }
        );
      }
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: updateData.name,
        telefono: updateData.telefono,
        handle: updateData.handle,
        margen: parseFloat(updateData.margen),
        cbu: updateData.cbu || null,
        alias: updateData.alias || null,
        cvu: updateData.cvu || null,
        profilePhoto: updateData.profilePhoto || null,
        bio: updateData.bio || null,
        instagram: updateData.instagram || null,
        facebook: updateData.facebook || null,
        tiktok: updateData.tiktok || null,
        whatsappBusiness: updateData.whatsappBusiness || null,
        linkedin: updateData.linkedin || null,
        twitter: updateData.twitter || null,
        youtube: updateData.youtube || null,
        website: updateData.website || null,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        dni: true,
        telefono: true,
        handle: true,
        margen: true,
        cbu: true,
        alias: true,
        cvu: true,
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

    console.log('✅ Perfil actualizado:', userId);

    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error('❌ Error actualizando perfil:', error);
    return NextResponse.json(
      { error: 'Error al actualizar perfil' },
      { status: 500 }
    );
  }
}
