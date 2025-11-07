import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, dni, telefono, handle } = await req.json();

    // Validar que no exista el email
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    // Validar que no exista el handle
    const existingHandle = await prisma.user.findUnique({
      where: { handle: handle.toLowerCase() }
    });

    if (existingHandle) {
      return NextResponse.json(
        { error: 'El handle ya está en uso' },
        { status: 400 }
      );
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario con margen por defecto (60%)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        dni,
        telefono,
        handle: handle.toLowerCase(),
        margen: 60 // Margen por defecto 60%
      }
    });

    // Crear gamificación inicial
    await prisma.userGamification.create({
      data: {
        userId: user.id,
        level: 'principiante',
        totalPoints: 0,
        totalSales: 0,
        totalRevenue: 0,
        currentStreak: 0,
        longestStreak: 0
      }
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        handle: user.handle,
        margen: user.margen
      }
    });

  } catch (error: any) {
    console.error('Error en registro:', error);
    return NextResponse.json(
      { error: 'Error al crear la cuenta' },
      { status: 500 }
    );
  }
}
