// 🔐 ENDPOINT: VALIDAR TOKEN Y OBTENER PEDIDO
// Ubicación: app/api/armar/[token]/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: any
) {
  try {
    const token = params.token;

    console.log('🔍 Validando token:', token);

    // Buscar token en DB
    const accessToken = await prisma.pedidoAccessToken.findUnique({
      where: { token },
      include: {
        Pedido: {
          include: {
            lineas: true,
            user: true
          }
        }
      }
    });

    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: 'Token inválido'
      }, { status: 404 });
    }

    // Verificar si expiró
    if (new Date() > accessToken.expiresAt) {
      return NextResponse.json({
        success: false,
        error: 'Token expirado'
      }, { status: 401 });
    }

    // Marcar como usado (primera vez)
    if (!accessToken.usedAt) {
      await prisma.pedidoAccessToken.update({
        where: { token },
        data: { usedAt: new Date() }
      });
    }

    console.log('✅ Token válido, pedido:', accessToken.Pedido.id);

    return NextResponse.json({
      success: true,
      pedido: accessToken.Pedido,
      revendedora: accessToken.Pedido.user
    });

  } catch (error) {
    console.error('❌ Error validando token:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al validar token'
    }, { status: 500 });
  }
}
