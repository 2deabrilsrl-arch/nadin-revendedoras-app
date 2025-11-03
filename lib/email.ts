import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendConsolidacionEmail(data: any) {
  const { revendedora, pedidos, totales, formaPago, tipoEnvio, transporteNombre, csvContent } = data;

  const fecha = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const subject = `Pedidos revendedora – ${revendedora.email} – ${fecha}`;

  const html = `
    <h2>Consolidación de Pedidos</h2>
    <p><strong>Revendedora:</strong> ${revendedora.name} (@${revendedora.handle})</p>
    <p><strong>Email:</strong> ${revendedora.email}</p>
    <p><strong>Teléfono:</strong> ${revendedora.telefono}</p>
    <hr>
    <p><strong>Pedidos incluidos:</strong> ${pedidos.length}</p>
    <p><strong>Total mayorista:</strong> $${totales.mayorista.toLocaleString('es-AR')}</p>
    <p><strong>Total venta:</strong> $${totales.venta.toLocaleString('es-AR')}</p>
    <p><strong>Ganancia estimada:</strong> $${totales.ganancia.toLocaleString('es-AR')}</p>
    <hr>
    <p><strong>Forma de pago:</strong> ${formaPago}</p>
    <p><strong>Tipo de envío:</strong> ${tipoEnvio}</p>
    ${transporteNombre ? `<p><strong>Transporte:</strong> ${transporteNombre}</p>` : ''}
  `;

  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: 'nadinlenceria@gmail.com',
    subject,
    html,
    attachments: [
      {
        filename: `pedidos_${revendedora.handle}_${Date.now()}.csv`,
        content: csvContent,
      },
    ],
  });
}
