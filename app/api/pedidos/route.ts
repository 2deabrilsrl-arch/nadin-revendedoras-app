import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Listar pedidos del usuario
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    // Obtener pedidos del usuario con sus líneas
    const pedidos = await prisma.pedido.findMany({
      where: {
        userId: userId
      },
      include: {
        lineas: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(pedidos);

  } catch (error) {
    console.error('❌ Error obteniendo pedidos:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener pedidos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo pedido
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cliente, telefono, nota, items } = body;

    // Validaciones
    if (!cliente || !cliente.trim()) {
      return NextResponse.json(
        { error: 'El nombre del cliente es requerido' },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'El pedido debe tener al menos un producto' },
        { status: 400 }
      );
    }

    // Obtener userId del localStorage o sesión
    // Por ahora asumimos que viene en el body o en headers
    const userData = req.headers.get('x-user-data');
    let userId: string;

    if (userData) {
      const user = JSON.parse(userData);
      userId = user.id;
    } else {
      // Si no viene en headers, intentar obtener de alguna forma
      // Por ahora usamos un método alternativo
      // El frontend debería enviar userId en el body
      userId = (body as any).userId;
      
      if (!userId) {
        return NextResponse.json(
          { error: 'Usuario no autenticado' },
          { status: 401 }
        );
      }
    }

    console.log('📦 Creando pedido para usuario:', userId);
    console.log('📦 Cliente:', cliente);
    console.log('📦 Items:', items.length);

    // Calcular totales
    let totalMayorista = 0;
    let totalVenta = 0;

    items.forEach((item: any) => {
      totalMayorista += item.mayorista * item.qty;
      totalVenta += item.venta * item.qty;
    });

    // Crear pedido
    const pedido = await prisma.pedido.create({
      data: {
        userId: userId,
        cliente: cliente.trim(),
        telefono: telefono?.trim() || null,
        nota: nota?.trim() || null,
        estado: 'pendiente',
        orderStatus: 'pending',
        lineas: {
          create: items.map((item: any) => ({
            productId: item.productId.toString(),
            variantId: item.variantId.toString(),
            sku: item.sku,
            brand: item.brand || '',
            name: item.name,
            talle: item.talle || '',
            color: item.color || '',
            qty: item.qty,
            mayorista: item.mayorista,
            venta: item.venta,
            cantidadOriginal: item.qty,
            cliente: cliente.trim(),
            telefono: telefono?.trim() || null,
            nota: nota?.trim() || null
          }))
        }
      },
      include: {
        lineas: true
      }
    });

    console.log('✅ Pedido creado exitosamente:', pedido.id);

    return NextResponse.json(
      { 
        success: true,
        pedido: {
          id: pedido.id,
          cliente: pedido.cliente,
          telefono: pedido.telefono,
          nota: pedido.nota,
          totalMayorista,
          totalVenta,
          items: pedido.lineas.length,
          createdAt: pedido.createdAt
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('❌ Error creando pedido:', error);
    return NextResponse.json(
      { 
        error: 'Error al crear el pedido',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
