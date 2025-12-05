// API: Actualizar estado de pedido (cancelar) - CORREGIDO
// Ubicacion: app/api/pedidos/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: params.id },
      include: {
        lineas: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!pedido) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(pedido);
  } catch (error) {
    console.error('Error obteniendo pedido:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { estado, orderStatus } = body;

    // Verificar que el pedido existe
    const pedidoExistente = await prisma.pedido.findUnique({
      where: { id: params.id }
    });

    if (!pedidoExistente) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    // ✅ CORREGIDO: Verificar si está consolidado usando orderStatus
    // No se puede cancelar si ya fue enviado a Nadin
    if (
      estado === 'cancelado' && 
      pedidoExistente.orderStatus !== 'pending'
    ) {
      return NextResponse.json(
        { error: 'No se puede cancelar un pedido que ya fue enviado a Nadin' },
        { status: 400 }
      );
    }

    // Actualizar pedido
    const pedidoActualizado = await prisma.pedido.update({
      where: { id: params.id },
      data: {
        ...(estado && { estado }),
        ...(orderStatus && { orderStatus })
      },
      include: {
        lineas: true
      }
    });

    return NextResponse.json({
      success: true,
      pedido: pedidoActualizado,
      message: 'Pedido actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando pedido:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar que el pedido existe
    const pedidoExistente = await prisma.pedido.findUnique({
      where: { id: params.id },
      include: { lineas: true }
    });

    if (!pedidoExistente) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    // ✅ CORREGIDO: Verificar usando orderStatus
    // No se puede eliminar si ya fue enviado a Nadin
    if (pedidoExistente.orderStatus !== 'pending') {
      return NextResponse.json(
        { error: 'No se puede eliminar un pedido que ya fue enviado a Nadin' },
        { status: 400 }
      );
    }

    // Eliminar lineas primero (Prisma debería hacerlo automáticamente con onDelete: Cascade)
    // Pero por seguridad lo hacemos manual
    await prisma.linea.deleteMany({
      where: { pedidoId: params.id }
    });

    // Eliminar pedido
    await prisma.pedido.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Pedido eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando pedido:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
