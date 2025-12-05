// SISTEMA DE EMAILS PARA VENDEDORA
// Ubicacion: lib/emails.ts

/**
 * Función para enviar email a la vendedora cuando recibe un mensaje
 * 
 * CONFIGURACIÓN NECESARIA:
 * 1. Instalar Resend: npm install resend
 * 2. Agregar RESEND_API_KEY en .env
 * 3. Verificar dominio en Resend
 */

// Descomentar cuando tengas Resend configurado:
// import { Resend } from 'resend';
// const resend = new Resend(process.env.RESEND_API_KEY);

export async function enviarEmailVendedora(params: {
  email: string;
  revendedoraNombre: string;
  mensaje: string;
  consolidacionId: string;
}) {
  try {
    console.log('📧 Enviando email a vendedora:', params.email);

    // TODO: Descomentar cuando tengas Resend configurado
    /*
    const { data, error } = await resend.emails.send({
      from: 'Nadin Lencería <notificaciones@tudominio.com>',
      to: [params.email],
      subject: `${params.revendedoraNombre} te envió un mensaje`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #ef88b7; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Nuevo Mensaje</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <p style="font-size: 16px; color: #333;">
              <strong>${params.revendedoraNombre}</strong> te envió un mensaje sobre su consolidación:
            </p>
            
            <div style="background-color: white; padding: 20px; border-left: 4px solid #ef88b7; margin: 20px 0;">
              <p style="color: #666; font-style: italic;">
                "${params.mensaje}"
              </p>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              Consolidación: <strong>#${params.consolidacionId.slice(-8)}</strong>
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a 
                href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin"
                style="background-color: #ef88b7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;"
              >
                Ver en Dashboard
              </a>
            </div>
          </div>
          
          <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
            <p>Nadin Lencería - Sistema de Revendedoras</p>
            <p>
              <a href="mailto:nadinlenceria@gmail.com" style="color: #ef88b7;">
                nadinlenceria@gmail.com
              </a>
            </p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('❌ Error enviando email:', error);
      return { success: false, error };
    }

    console.log('✅ Email enviado:', data);
    return { success: true, data };
    */

    // MIENTRAS TANTO: Solo log
    console.log('📧 Email que se enviaría:');
    console.log('  Para:', params.email);
    console.log('  De:', params.revendedoraNombre);
    console.log('  Mensaje:', params.mensaje.substring(0, 50) + '...');
    console.log('  Consolidación:', params.consolidacionId.slice(-8));
    
    return { 
      success: true, 
      message: 'Email simulado (configurar Resend para envío real)' 
    };

  } catch (error) {
    console.error('❌ Error en enviarEmailVendedora:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

/**
 * CONFIGURACIÓN DE RESEND:
 * 
 * 1. Crear cuenta en https://resend.com
 * 2. Verificar tu dominio
 * 3. Obtener API key
 * 4. Agregar en .env:
 *    RESEND_API_KEY=re_xxxxxxxxxxxxx
 *    NEXT_PUBLIC_APP_URL=https://tuapp.com
 * 
 * 5. Instalar:
 *    npm install resend
 * 
 * 6. Descomentar el código arriba
 * 7. Importar en las APIs de mensajes:
 *    import { enviarEmailVendedora } from '@/lib/emails';
 */
