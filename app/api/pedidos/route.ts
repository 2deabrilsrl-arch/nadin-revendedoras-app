import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { userId, cliente, telefono, nota, lineas } = await req.json();

    const pedido = await prisma.pedido.create({
      data: {
        userId,
        cliente,
        telefono,
        nota,
        lineas: {
          create: lineas.map((l: any) => ({
            productId: l.productId,
            variantId: l.variantId,
            sku: l.sku,
            brand: l.brand,
            name: l.name,
            talle: l.talle,
            color: l.color,
            qty: l.qty,
            mayorista: l.mayorista,
            venta: l.venta,
          })),
        },
      },
      include: { lineas: true },
    });

    return NextResponse.json(pedido);
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear pedido' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const pedidos = await prisma.pedido.findMany({
      where: { userId: userId || undefined },
      include: { lineas: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(pedidos);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener pedidos' }, { status: 500 });
  }
}
