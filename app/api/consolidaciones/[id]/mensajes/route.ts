// API: Mensajes de Consolidación - COMPLETO
// Ubicación: app/api/consolidaciones/[id]/mensajes/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET - Obtener mensajes de una consolidación
 */
export async function GET(
  request: NextRequest,
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
      { error: 'Error al obtener mensajes' },
      { status: 500 }
    );
  }
}

/**
 * POST - Enviar mensaje a consolidación
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const { autorId, autorNombre, autorTipo, mensaje } = body;

    if (!autorNombre || !autorTipo || !mensaje) {
      return NextResponse.json(
        { error: 'autorNombre, autorTipo y mensaje son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que la consolidación existe
    const consolidacion = await prisma.consolidacion.findUnique({
      where: { id }
    });

    if (!consolidacion) {
      return NextResponse.json(
        { error: 'Consolidación no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si el chat está cerrado
    const chatCerrado = consolidacion.armadoEn && consolidacion.pagadoEn && consolidacion.completadoEn;

    if (chatCerrado) {
      return NextResponse.json(
        { error: 'El chat está cerrado. El pedido ya fue completado.' },
        { status: 403 }
      );
    }

    // Crear mensaje
    const nuevoMensaje = await prisma.consolidacionMensaje.create({
      data: {
        consolidacionId: id,
        autorId: autorId || null,
        autorNombre,
        autorTipo,
        mensaje,
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
      { error: 'Error al enviar mensaje' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Marcar mensajes como leídos
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const { autorTipo } = body;

    if (!autorTipo) {
      return NextResponse.json(
        { error: 'autorTipo es requerido' },
        { status: 400 }
      );
    }

    // Marcar como leídos los mensajes del otro tipo
    // Si autorTipo es 'revendedora', marcamos leídos los de 'vendedora'
    const autorTipoOpuesto = autorTipo === 'revendedora' ? 'vendedora' : 'revendedora';

    await prisma.consolidacionMensaje.updateMany({
      where: {
        consolidacionId: id,
        autorTipo: autorTipoOpuesto,
        leido: false
      },
      data: {
        leido: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Mensajes marcados como leídos'
    });

  } catch (error) {
    console.error('Error marcando mensajes como leídos:', error);
    return NextResponse.json(
      { error: 'Error al marcar mensajes' },
      { status: 500 }
    );
  }
}
