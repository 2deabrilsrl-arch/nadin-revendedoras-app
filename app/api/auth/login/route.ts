import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

interface LoginBody {
  email: string;
  password: string;
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json() as LoginBody;

    const user = await prisma.user.findUnique({ 
      where: { email } 
    });

    if (!user || !await bcrypt.compare(password, user.password)) {
      return NextResponse.json(
        { error: 'Email o contraseña incorrectos' }, 
        { status: 401 }
      );
    }

    // ✅ IMPORTANTE: Devolver objeto "user" completo
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        handle: user.handle,
        margen: user.margen,
        dni: user.dni,
        telefono: user.telefono,
        cbu: user.cbu,
        alias: user.alias,
        cvu: user.cvu
      }
    });

  } catch (error: any) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { error: 'Error al iniciar sesión' }, 
      { status: 500 }
    );
  }
}
