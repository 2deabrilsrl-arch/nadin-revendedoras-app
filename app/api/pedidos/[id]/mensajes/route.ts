// ENDPOINT: MENSAJES DEL PEDIDO
// Ubicacion: app/api/pedidos/[id]/mensajes/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener mensajes de un pedido
export async function GET(
  request: Request,
  { params }: any
) {
  try {
    const pedidoId = params.id;

    const mensajes = await prisma.pedidoMensaje.findMany({
      where: { pedidoId },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(mensajes);

  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al obtener mensajes'
    }, { status: 500 });
  }
}

// POST - Enviar nuevo mensaje
export async function POST(
  request: Request,
  { params }: any
) {
  try {
    const pedidoId = params.id;
    const body = await request.json();
    
    const {
      autorId,
      autorNombre,
      autorTipo,
      mensaje
    } = body as any;

    console.log('Nuevo mensaje en pedido', pedidoId, 'de', autorNombre);

    // Crear mensaje
    const nuevoMensaje = await prisma.pedidoMensaje.create({
      data: {
        pedidoId,
        autorId,
        autorNombre,
        autorTipo,
        mensaje
      } as any
    });

    // TODO: Enviar notificacion push/email al otro participante
    // Si es vendedora -> notificar revendedora
    // Si es revendedora -> notificar vendedora

    return NextResponse.json({
      success: true,
      mensaje: nuevoMensaje
    });

  } catch (error) {
    console.error('Error enviando mensaje:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al enviar mensaje'
    }, { status: 500 });
  }
}

// PATCH - Marcar mensajes como leidos
export async function PATCH(
  request: Request,
  { params }: any
) {
  try {
    const pedidoId = params.id;
    const body = await request.json();
    const { autorTipo } = body as any;

    // Marcar como leidos todos los mensajes que NO son del autor
    await prisma.pedidoMensaje.updateMany({
      where: {
        pedidoId,
        autorTipo: { not: autorTipo },
        leido: false
      } as any,
      data: {
        leido: true
      }
    });

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('Error marcando mensajes:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al marcar mensajes'
    }, { status: 500 });
  }
}
