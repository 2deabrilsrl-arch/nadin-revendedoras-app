// API: NOTIFICACIONES ADMIN
// Ubicacion: app/api/notificaciones/admin/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Obtener notificaciones de mensajes no leídos en consolidaciones activas
    const consolidacionesActivas = await prisma.consolidacion.findMany({
      where: {
        estado: {
          in: ['enviado', 'armando', 'armado'] // Estados donde el chat está abierto
        }
      },
      include: {
        user: true,
        mensajes: {
          where: {
            leido: false,
            autorTipo: 'revendedora' // Mensajes de revendedoras no leídos
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    // Crear notificaciones virtuales para cada mensaje no leído
    const notificaciones = consolidacionesActivas.flatMap(cons =>
      cons.mensajes.map(msg => ({
        id: msg.id,
        tipo: 'mensaje_consolidacion',
        titulo: `Mensaje de ${cons.user.name}`,
        mensaje: msg.mensaje.substring(0, 100),
        leida: false,
        consolidacionId: cons.id,
        createdAt: msg.createdAt
      }))
    );

    return NextResponse.json({ notificaciones });

  } catch (error) {
    console.error('Error obteniendo notificaciones admin:', error);
    return NextResponse.json(
      { error: 'Error al obtener notificaciones' },
      { status: 500 }
    );
  }
}
