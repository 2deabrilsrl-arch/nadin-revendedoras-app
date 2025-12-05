import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface PedidoItem {
  productId: string | number;
  variantId: string | number;
  sku?: string;
  brand?: string;
  name: string;
  talle?: string;
  color?: string;
  qty: number;
  mayorista: number;
  venta: number;
}

interface CreatePedidoBody {
  userId: string;
  cliente: string;
  telefono: string;
  nota?: string;
  items: PedidoItem[];
  descuentoTotal?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as CreatePedidoBody;
    console.log('📦 Creando pedido:', body);

    const { userId, cliente, telefono, nota, items, descuentoTotal = 0 } = body;

    // Validaciones
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    if (!cliente || !telefono) {
      return NextResponse.json(
        { error: 'Faltan datos del cliente' },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'El pedido debe tener al menos un producto' },
        { status: 400 }
      );
    }

    // Crear pedido con líneas
    const pedido = await prisma.pedido.create({
      data: {
        userId,
        cliente,
        telefono,
        nota: nota || '',
        estado: 'pendiente', // Siempre empieza como pendiente
        lineas: {
          create: items.map((item: PedidoItem) => ({
            productId: item.productId.toString(),
            variantId: item.variantId.toString(),
            sku: item.sku || '',
            brand: item.brand || '',
            name: item.name,
            talle: item.talle || '',
            color: item.color || '',
            qty: item.qty,
            mayorista: item.mayorista,
            venta: item.venta,
          }))
        }
      },
      include: {
        lineas: true
      }
    });

    console.log('✅ Pedido creado:', pedido.id);
    console.log('ℹ️ Estado: pendiente (gamificación se activará al completar)');

    return NextResponse.json({
      success: true,
      pedido
    });

  } catch (error) {
    console.error('❌ Error creando pedido:', error);
    return NextResponse.json(
      { 
        error: 'Error al crear pedido',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
