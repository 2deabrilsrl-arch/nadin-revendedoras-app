// API: Mensajes CORREGIDO con autorNombre
// Ubicacion: app/api/armar-consolidacion/[token]/mensajes/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMensajeNotificacion } from '@/lib/email';

// GET - Obtener mensajes
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    const accessToken = await prisma.consolidacionAccessToken.findUnique({
      where: { token },
      include: {
        consolidacion: {
          include: {
            user: true
          }
        }
      }
    });

    if (!accessToken || new Date() > accessToken.expiresAt) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
    }

    const mensajes = await prisma.consolidacionMensaje.findMany({
      where: {
        consolidacionId: accessToken.consolidacionId
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json({ success: true, mensajes });

  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear mensaje con autorNombre
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const { mensaje, autorTipo, autorNombre } = await req.json() as any;

    if (!mensaje || !autorTipo || !autorNombre) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    const accessToken = await prisma.consolidacionAccessToken.findUnique({
      where: { token },
      include: {
        consolidacion: {
          include: {
            user: true
          }
        }
      }
    });

    if (!accessToken || new Date() > accessToken.expiresAt) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
    }

    const consolidacion = accessToken.consolidacion;

    // Verificar si consolidación está en estado donde NO se puede escribir
    if (consolidacion.estado === 'entregado' || consolidacion.estado === 'completado') {
      return NextResponse.json({
        error: 'pedido_finalizado',
        message: 'Este pedido ya fue enviado. Para consultas contactá a nadinlenceria@gmail.com'
      }, { status: 400 });
    }

    // Crear mensaje
    const nuevoMensaje = await prisma.consolidacionMensaje.create({
      data: {
        consolidacionId: consolidacion.id,
        mensaje,
        autorTipo,
        autorNombre,
        leido: false
      }
    });

    // Notificaciones bidireccionales
    try {
      if (autorTipo === 'revendedora') {
        console.log('✉️ Revendedora escribió, notificando a vendedora...');
        
        const vendedora = await prisma.user.findFirst({
          where: { rol: 'vendedora' }
        });

        if (vendedora) {
          await prisma.notificacion.create({
            data: {
              userId: vendedora.id,
              tipo: 'mensaje_revendedora',
              titulo: `${consolidacion.user.name} te envió un mensaje`,
              mensaje: `Nueva consulta sobre consolidación #${consolidacion.id.slice(-8)}`,
              leida: false,
              metadata: JSON.stringify({
                consolidacionId: consolidacion.id,
                revendedoraId: consolidacion.userId,
                revendedoraNombre: consolidacion.user.name
              })
            }
          });

          console.log('✅ Notificación in-app creada para vendedora');

          const linkChat = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/armar-consolidacion/${token}`;
          
          await sendMensajeNotificacion({
            destinatarioEmail: 'nadinlenceria@gmail.com',
            destinatarioNombre: 'Nadin',
            remitenteNombre: consolidacion.user.name,
            remitenteTipo: 'revendedora',
            mensaje: mensaje,
            consolidacionId: consolidacion.id,
            linkChat: linkChat
          });
          console.log('✅ Email enviado a vendedora');
        }

      } else if (autorTipo === 'vendedora') {
        console.log('✉️ Vendedora escribió, notificando a revendedora...');

        await prisma.notificacion.create({
          data: {
            userId: consolidacion.userId,
            tipo: 'mensaje_vendedora',
            titulo: 'Nadin te envió un mensaje',
            mensaje: 'Tenés un nuevo mensaje sobre tu consolidación',
            leida: false,
            metadata: JSON.stringify({
              consolidacionId: consolidacion.id,
              consolidacionToken: token
            })
          }
        });

        console.log('✅ Notificación in-app creada para revendedora');

        const linkChat = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/armar-consolidacion/${token}`;
        
        await sendMensajeNotificacion({
          destinatarioEmail: consolidacion.user.email,
          destinatarioNombre: consolidacion.user.name,
          remitenteNombre: 'Nadin',
          remitenteTipo: 'vendedora',
          mensaje: mensaje,
          consolidacionId: consolidacion.id,
          linkChat: linkChat
        });
        console.log('✅ Email enviado a revendedora:', consolidacion.user.email);
      }
    } catch (notifError) {
      console.error('❌ Error enviando notificación:', notifError);
    }

    return NextResponse.json({ success: true, mensaje: nuevoMensaje });

  } catch (error) {
    console.error('Error creando mensaje:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PATCH - Marcar mensajes como leídos
export async function PATCH(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    const accessToken = await prisma.consolidacionAccessToken.findUnique({
      where: { token }
    });

    if (!accessToken || new Date() > accessToken.expiresAt) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
    }

    await prisma.consolidacionMensaje.updateMany({
      where: {
        consolidacionId: accessToken.consolidacionId,
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
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
