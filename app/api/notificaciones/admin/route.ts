// API: NOTIFICACIONES ADMIN
// Ubicacion: app/api/notificaciones/admin/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Obtener consolidaciones activas
    const consolidacionesActivas = await prisma.consolidacion.findMany({
      where: {
        estado: {
          in: ['enviado', 'armando', 'armado'] // Estados donde el chat está abierto
        }
      },
      include: {
        user: true
      }
    });

    // Obtener mensajes no leídos para cada consolidación
    const notificaciones = [];
    
    for (const cons of consolidacionesActivas) {
      const mensajes = await prisma.consolidacionMensaje.findMany({
        where: {
          consolidacionId: cons.id,
          leido: false,
          autorTipo: 'revendedora'
        },
        orderBy: { createdAt: 'desc' }
      });

      // Crear notificaciones virtuales
      for (const msg of mensajes) {
        notificaciones.push({
          id: msg.id,
          tipo: 'mensaje_consolidacion',
          titulo: `Mensaje de ${cons.user.name}`,
          mensaje: msg.mensaje.substring(0, 100),
          leida: false,
          consolidacionId: cons.id,
          createdAt: msg.createdAt
        });
      }
    }

    return NextResponse.json({ notificaciones });

  } catch (error) {
    console.error('Error obteniendo notificaciones admin:', error);
    return NextResponse.json(
      { error: 'Error al obtener notificaciones' },
      { status: 500 }
    );
  }
}
