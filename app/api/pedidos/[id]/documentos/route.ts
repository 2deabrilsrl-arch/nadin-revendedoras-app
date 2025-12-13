// API: Obtener documentos de un pedido
// Ubicación: app/api/pedidos/[id]/documentos/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    console.log('📄 Buscando documentos para pedido:', id);

    // Buscar el pedido
    const pedido = await prisma.pedido.findUnique({
      where: { id },
      select: {
        id: true,
        consolidacionId: true,
        estado: true,
        orderStatus: true
      }
    });

    console.log('📦 Pedido encontrado:', pedido);

    if (!pedido) {
      console.log('❌ Pedido no encontrado:', id);
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    if (!pedido.consolidacionId) {
      console.log('ℹ️ Pedido sin consolidación');
      return NextResponse.json({
        success: true,
        documentos: [],
        message: 'Pedido no tiene consolidación aún'
      });
    }

    console.log('🔍 Buscando documentos en consolidación:', pedido.consolidacionId);

    // Obtener documentos de la consolidación
    const documentos = await prisma.consolidacionDocumento.findMany({
      where: {
        consolidacionId: pedido.consolidacionId
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    });

    console.log('📋 Documentos encontrados:', documentos.length);
    if (documentos.length > 0) {
      console.log('📄 Documentos:');
      documentos.forEach((doc, i) => {
        console.log(`   ${i + 1}. ${doc.originalName} - ${doc.publicUrl}`);
      });
    } else {
      console.log('⚠️ No hay documentos para esta consolidación');
      console.log('   ConsolidacionId:', pedido.consolidacionId);
      console.log('   Verificá que la vendedora haya subido archivos al armar el pedido');
    }

    return NextResponse.json({
      success: true,
      documentos,
      debug: {
        pedidoId: id,
        consolidacionId: pedido.consolidacionId,
        cantidadDocumentos: documentos.length
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo documentos del pedido:', error);
    return NextResponse.json(
      { error: 'Error al obtener documentos', details: (error as Error).message },
      { status: 500 }
    );
  }
}
