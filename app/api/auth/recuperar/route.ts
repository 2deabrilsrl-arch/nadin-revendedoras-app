import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email requerido' },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return NextResponse.json(
        { message: 'Si el email existe, recibirás instrucciones' },
        { status: 200 }
      );
    }

    // Generar token de recuperación (válido por 1 hora)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    // Aquí deberías guardar el token en la base de datos
    // Por ahora lo enviamos directamente en el email
    // TODO: Agregar campos resetToken y resetTokenExpiry al modelo User

    // Configurar transporter de nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || 'nadinlenceria@gmail.com',
        pass: process.env.EMAIL_PASS,
      },
    });

    // URL de reseteo
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://nadin-revendedoras-app.vercel.app'}/recuperar/nueva-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Enviar email
    await transporter.sendMail({
      from: `"Nadin Lencería" <${process.env.EMAIL_USER || 'nadinlenceria@gmail.com'}>`,
      to: email,
      subject: 'Recuperar Contraseña - Nadin Lencería',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #EC4899 0%, #DB2777 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #EC4899; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Recuperar Contraseña</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${user.name}</strong>,</p>
              
              <p>Recibimos una solicitud para recuperar tu contraseña de Nadin Lencería.</p>
              
              <p>Hacé click en el siguiente botón para crear una nueva contraseña:</p>
              
              <center>
                <a href="${resetUrl}" class="button">Crear Nueva Contraseña</a>
              </center>
              
              <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul>
                  <li>Este link es válido por 1 hora</li>
                  <li>Si no solicitaste este cambio, ignorá este email</li>
                  <li>Tu contraseña actual seguirá siendo válida hasta que la cambies</li>
                </ul>
              </div>
              
              <p>Si el botón no funciona, copiá y pegá este link en tu navegador:</p>
              <p style="word-break: break-all; color: #666; font-size: 12px;">${resetUrl}</p>
              
              <p>Saludos,<br><strong>Equipo Nadin Lencería</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Nadin Lencería. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return NextResponse.json(
      { message: 'Email de recuperación enviado' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error en recuperar contraseña:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
