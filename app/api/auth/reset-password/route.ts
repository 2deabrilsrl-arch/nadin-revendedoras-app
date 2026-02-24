import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

interface ResetPasswordBody {
  email: string;
  token: string;
  newPassword: string;
}

export async function POST(request: Request) {
  try {
    const { email, token, newPassword } = await request.json() as ResetPasswordBody;

    if (!email || !token || !newPassword) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // ✅ Buscar usuario y validar token + expiración
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Link inválido o expirado' },
        { status: 400 }
      );
    }

    // ✅ Validar que el token coincida y no haya expirado
    if (
      !user.resetToken ||
      !user.resetTokenExpiry ||
      user.resetToken !== token ||
      user.resetTokenExpiry < new Date()
    ) {
      return NextResponse.json(
        { error: 'El link de recuperación es inválido o ya expiró. Solicitá uno nuevo.' },
        { status: 400 }
      );
    }

    // ✅ Hashear la nueva contraseña y limpiar el token usado
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetToken: null,       // Invalidar token después de usarlo
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json(
      { message: 'Contraseña actualizada exitosamente' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error al resetear contraseña:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
