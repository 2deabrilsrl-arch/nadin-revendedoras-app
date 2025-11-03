import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, dni, telefono, handle } = await req.json();
    
    // Validar que no exista el email
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 });
    }

    // Validar que no exista el handle
    const existingHandle = await prisma.user.findUnique({ where: { handle } });
    if (existingHandle) {
      return NextResponse.json({ error: 'El handle ya está en uso' }, { status: 400 });
    }

    // Validar que no exista el DNI
    const existingDNI = await prisma.user.findUnique({ where: { dni } });
    if (existingDNI) {
      return NextResponse.json({ error: 'El DNI ya está registrado' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { 
        email, 
        password: hashedPassword, 
        name, 
        dni, 
        telefono, 
        handle 
      },
    });

    return NextResponse.json({ 
      success: true,
      id: user.id, 
      email: user.email 
    });
  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json({ error: 'Error en el registro' }, { status: 500 });
  }
}