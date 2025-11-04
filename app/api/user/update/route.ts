import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest) {
  try {
    const { userId, margen, cbu, alias } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        margen: margen !== undefined ? margen : undefined,
        cbu: cbu !== undefined ? cbu : undefined,
        alias: alias !== undefined ? alias : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        handle: updatedUser.handle,
        margen: updatedUser.margen,
        cbu: updatedUser.cbu,
        alias: updatedUser.alias,
      }
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    );
  }
}
