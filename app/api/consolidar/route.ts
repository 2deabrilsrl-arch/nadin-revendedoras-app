import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendConsolidacionEmail } from '@/lib/email';

interface ConsolidarBody {
  userId: string;
  pedidoIds: string[];
  formaPago: string;
  tipoEnvio: string;
  transporteNombre?: string;
  descuentoTotal?: number;
}

interface PagoBody {
  consolidacionId: string;
  costoReal: number;
}

export async function POST(req: NextRequest) {
  try {
    const { 
      userId, 
      pedidoIds, 
      formaPago, 
      tipoEnvio, 
      transporteNombre,
      descuentoTotal = 0 
    } = await req.json() as ConsolidarBody;

    const pedidos = await prisma.pedido.findMany({
      where: { id: { in: pedidoIds } },
      include: { lineas: true, user: true },
    });

    let totalMayorista = 0;
    let totalVenta = 0;

    const csvRows = ['cliente,telefono,product_id,variant_id,sku,marca,producto,talle,color,cantidad,precio_mayorista_unit,precio_mayorista_total,precio_revendedora_unit,precio_revendedora_total,nota'];

    pedidos.forEach(pedido => {
      pedido.lineas.forEach(linea => {
        totalMayorista += linea.mayorista * linea.qty;
        totalVenta += linea.venta * linea.qty;
        csvRows.push(
          `${pedido.cliente},${pedido.telefono},${linea.productId},${linea.variantId},${linea.sku},${linea.brand},${linea.name},${linea.talle},${linea.color},${linea.qty},${linea.mayorista},${linea.mayorista * linea.qty},${linea.venta},${linea.venta * linea.qty},${pedido.nota || ''}`
        );
      });
    });

    const csvContent = csvRows.join('\n');
    const totalVentaConDescuento = totalVenta - descuentoTotal;
    const ganancia = totalVentaConDescuento - totalMayorista;

    await sendConsolidacionEmail({
      revendedora: pedidos[0].user,
      pedidos,
      totales: { 
        mayorista: totalMayorista, 
        venta: totalVenta,
        descuento: descuentoTotal,
        ventaFinal: totalVentaConDescuento,
        ganancia 
      },
      formaPago,
      tipoEnvio,
      transporteNombre,
      csvContent,
    });

    const consolidacion = await prisma.consolidacion.create({
      data: {
        userId,
        pedidoIds: JSON.stringify(pedidoIds),
        formaPago,
        tipoEnvio,
        transporteNombre,
        totalMayorista,
        totalVenta,
        descuentoTotal,
        ganancia,
      },
    });

    await prisma.pedido.updateMany({
      where: { id: { in: pedidoIds } },
      data: { estado: 'enviado' },
    });

    return NextResponse.json(consolidacion);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al consolidar' }, { status: 500 });
  }
}

// Nueva función para registrar el pago
export async function PATCH(req: NextRequest) {
  try {
    const { consolidacionId, costoReal } = await req.json() as PagoBody;

    const consolidacion = await prisma.consolidacion.findUnique({
      where: { id: consolidacionId }
    });

    if (!consolidacion) {
      return NextResponse.json({ error: 'Consolidación no encontrada' }, { status: 404 });
    }

    const gananciaNeta = (consolidacion.totalVenta - consolidacion.descuentoTotal) - costoReal;

    const updated = await prisma.consolidacion.update({
      where: { id: consolidacionId },
      data: {
        costoReal,
        gananciaNeta
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al actualizar pago' }, { status: 500 });
  }
}
