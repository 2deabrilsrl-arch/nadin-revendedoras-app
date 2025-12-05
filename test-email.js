// TEST DE EMAIL - Verificar configuración SMTP
// Ubicacion: test-email.js (raíz del proyecto)
// Ejecutar: node test-email.js

const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function testEmail() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 TEST DE EMAIL - VERIFICACIÓN SMTP');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📋 Configuración actual:');
  console.log('  Host:', process.env.SMTP_HOST || '❌ NO CONFIGURADO');
  console.log('  Port:', process.env.SMTP_PORT || '❌ NO CONFIGURADO');
  console.log('  Secure:', process.env.SMTP_SECURE || 'false');
  console.log('  User:', process.env.SMTP_USER || '❌ NO CONFIGURADO');
  console.log('  Pass:', process.env.SMTP_PASS ? '✅ ***' + process.env.SMTP_PASS.slice(-4) : '❌ NO CONFIGURADO');
  console.log('  From:', process.env.FROM_EMAIL || '❌ NO CONFIGURADO');
  console.log('');

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ ERROR: Variables de entorno faltantes');
    console.error('');
    console.error('Agregá en .env:');
    console.error('  SMTP_HOST=smtp.gmail.com');
    console.error('  SMTP_PORT=587');
    console.error('  SMTP_SECURE=false');
    console.error('  SMTP_USER=nadinlenceria@gmail.com');
    console.error('  SMTP_PASS=xxxx');
    console.error('  FROM_EMAIL=nadinlenceria@gmail.com');
    console.error('');
    process.exit(1);
  }

  try {
    console.log('📤 Enviando email de prueba...\n');

    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: 'nadinlenceria@gmail.com',
      subject: '🧪 Test de Email - Nadin Revendedoras',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="margin: 0;">✅ Email de Prueba</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Nadin Revendedoras App</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <h2 style="color: #ec4899; margin-top: 0;">🎉 ¡Configuración Correcta!</h2>
            <p>Si estás leyendo este email, significa que tu configuración SMTP está funcionando perfectamente.</p>
            
            <div style="background: white; padding: 15px; border-left: 4px solid #ec4899; margin: 20px 0;">
              <strong>Configuración verificada:</strong>
              <ul style="margin: 10px 0;">
                <li>Host: ${process.env.SMTP_HOST}</li>
                <li>Port: ${process.env.SMTP_PORT}</li>
                <li>User: ${process.env.SMTP_USER}</li>
                <li>From: ${process.env.FROM_EMAIL}</li>
              </ul>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              ✅ Los emails de notificaciones deberían funcionar correctamente ahora.<br>
              ✅ Las revendedoras pueden enviar mensajes y recibirás notificaciones por email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e9ecef; color: #6c757d; font-size: 12px;">
            <p><strong>Nadin Lencería</strong></p>
            <p>Sistema de Revendedoras - Test Automático</p>
          </div>
        </body>
        </html>
      `
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ¡EMAIL ENVIADO EXITOSAMENTE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📬 Message ID:', info.messageId);
    console.log('📧 Destinatario: nadinlenceria@gmail.com');
    console.log('');
    console.log('🔍 REVISÁ TU INBOX:');
    console.log('   1. Abrí Gmail: https://mail.google.com');
    console.log('   2. Buscá email con asunto: "🧪 Test de Email"');
    console.log('   3. Si NO aparece, revisá SPAM');
    console.log('');
    console.log('✅ Si recibiste el email, el SMTP funciona correctamente.');
    console.log('✅ Las notificaciones de la app deberían funcionar ahora.');
    console.log('');

  } catch (error) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ ERROR AL ENVIAR EMAIL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.error('Error:', error.message);
    console.log('');

    if (error.message.includes('Invalid login')) {
      console.log('🔧 SOLUCIÓN:');
      console.log('   1. El problema es con la contraseña');
      console.log('   2. NO uses tu contraseña normal de Gmail');
      console.log('   3. Necesitás una "Contraseña de Aplicación"');
      console.log('');
      console.log('📋 CÓMO OBTENER CONTRASEÑA DE APLICACIÓN:');
      console.log('   1. Ir a: https://myaccount.google.com/apppasswords');
      console.log('   2. Seleccionar: App "Correo" + Dispositivo "Windows"');
      console.log('   3. Click "Generar"');
      console.log('   4. Copiar la contraseña (16 caracteres)');
      console.log('   5. Pegar en .env → SMTP_PASS=xxxx');
      console.log('   6. Reintentar: node test-email.js');
      console.log('');
    } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      console.log('🔧 SOLUCIÓN:');
      console.log('   1. Verificá que SMTP_HOST=smtp.gmail.com');
      console.log('   2. Verificá que SMTP_PORT=587');
      console.log('   3. Verificá que SMTP_SECURE=false');
      console.log('   4. Verificá tu conexión a internet');
      console.log('');
    } else {
      console.log('🔧 VERIFICÁ TU .env:');
      console.log('   SMTP_HOST=smtp.gmail.com');
      console.log('   SMTP_PORT=587');
      console.log('   SMTP_SECURE=false');
      console.log('   SMTP_USER=nadinlenceria@gmail.com');
      console.log('   SMTP_PASS=xxxx (contraseña de aplicación)');
      console.log('   FROM_EMAIL=nadinlenceria@gmail.com');
      console.log('');
    }

    console.log('Stack trace completo:');
    console.error(error);
    console.log('');
    process.exit(1);
  }
}

testEmail();
