// API: MENSAJES POR ID CON NOTIFICACIONES PARA VENDEDORA
// Ubicacion: app/api/consolidaciones/[id]/mensajes/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMensajeNotificacion } from '@/lib/email';

// GET - Obtener mensajes
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const mensajes = await prisma.consolidacionMensaje.findMany({
      where: {
        consolidacionId: id
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      mensajes
    });

  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Enviar mensaje
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { mensaje, autorId, autorNombre, autorTipo } = body;

    if (!mensaje || !autorNombre || !autorTipo) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    const consolidacion = await prisma.consolidacion.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!consolidacion) {
      return NextResponse.json(
        { success: false, error: 'Consolidación no encontrada' },
        { status: 404 }
      );
    }

    // Crear mensaje
    const nuevoMensaje = await prisma.consolidacionMensaje.create({
      data: {
        consolidacionId: id,
        mensaje,
        autorId,
        autorNombre,
        autorTipo,
        leido: false
      }
    });



    return NextResponse.json({
      success: true,
      mensaje: nuevoMensaje
    });

  } catch (error) {
    console.error('Error enviando mensaje:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PATCH - Marcar mensajes como leídos
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { autorTipo } = body;

    const tipoAMarcar = autorTipo === 'vendedora' ? 'revendedora' : 'vendedora';

    await prisma.consolidacionMensaje.updateMany({
      where: {
        consolidacionId: id,
        autorTipo: tipoAMarcar,
        leido: false
      },
      data: {
        leido: true
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error marcando mensajes como leídos:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
