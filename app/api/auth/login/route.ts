import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !await bcrypt.compare(password, user.password)) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // ✅ CORRECCIÓN: Envolver el usuario en la propiedad "user"
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        handle: user.handle,
        margen: user.margen
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json({ error: 'Error en login' }, { status: 500 });
  }
}
