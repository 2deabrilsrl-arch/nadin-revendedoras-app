import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface ProductoAgrupado {
  sku: string;
  brand: string;
  name: string;
  talle: string;
  color: string;
  cantidadTotal: number;
  precioMayorista: number;
  precioVenta: number;
  subtotalMayorista: number;
  subtotalVenta: number;
  clientes: Array<{
    nombre: string;
    telefono: string;
    cantidad: number;
  }>;
}

/**
 * Agrupa productos idénticos de múltiples pedidos
 */
function agruparProductos(pedidos: any[]): ProductoAgrupado[] {
  const productosMap = new Map<string, ProductoAgrupado>();
  
  pedidos.forEach(pedido => {
    pedido.lineas.forEach((linea: any) => {
      // Clave única: SKU + Talle + Color
      const key = `${linea.sku}-${linea.talle}-${linea.color}`;
      
      if (productosMap.has(key)) {
        // Ya existe, agregar cantidad y cliente
        const existing = productosMap.get(key)!;
        existing.cantidadTotal += linea.qty;
        existing.subtotalMayorista += linea.mayorista * linea.qty;
        existing.subtotalVenta += linea.venta * linea.qty;
        existing.clientes.push({
          nombre: pedido.cliente,
          telefono: pedido.telefono || '',
          cantidad: linea.qty
        });
      } else {
        // Nuevo producto
        productosMap.set(key, {
          sku: linea.sku || 'S/SKU',
          brand: linea.brand || 'Sin marca',
          name: linea.name,
          talle: linea.talle || '',
          color: linea.color || '',
          cantidadTotal: linea.qty,
          precioMayorista: linea.mayorista,
          precioVenta: linea.venta,
          subtotalMayorista: linea.mayorista * linea.qty,
          subtotalVenta: linea.venta * linea.qty,
          clientes: [{
            nombre: pedido.cliente,
            telefono: pedido.telefono || '',
            cantidad: linea.qty
          }]
        });
      }
    });
  });
  
  // Convertir a array y ordenar por SKU
  return Array.from(productosMap.values()).sort((a, b) => 
    a.sku.localeCompare(b.sku)
  );
}

/**
 * Genera CSV mejorado con productos agrupados
 */
function generarCSVAgrupado(productosAgrupados: ProductoAgrupado[]): string {
  const headers = [
    'SKU',
    'Marca',
    'Producto',
    'Talle',
    'Color',
    'Cantidad Total',
    'Precio Mayorista',
    'Precio Venta',
    'Subtotal Mayorista',
    'Subtotal Venta',
    'Clientes (Nombre - Cantidad)'
  ];
  
  const rows = productosAgrupados.map(p => [
    p.sku,
    p.brand,
    p.name,
    p.talle,
    p.color,
    p.cantidadTotal,
    p.precioMayorista.toFixed(2),
    p.precioVenta.toFixed(2),
    p.subtotalMayorista.toFixed(2),
    p.subtotalVenta.toFixed(2),
    p.clientes.map(c => `${c.nombre} (${c.cantidad})`).join(' | ')
  ]);
  
  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
}

/**
 * Genera HTML mejorado del email
 */
function generarHTMLEmail(data: any, productosAgrupados: ProductoAgrupado[]) {
  const { revendedora, pedidos, totales, formaPago, tipoEnvio, transporteNombre } = data;
  
  const fecha = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);
      color: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .info-box {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e9ecef;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .label {
      font-weight: bold;
      color: #6c757d;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    th {
      background: #ec4899;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e9ecef;
    }
    tr:hover {
      background: #f8f9fa;
    }
    .clientes-list {
      font-size: 12px;
      color: #6c757d;
      line-height: 1.4;
    }
    .totales {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-top: 30px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 16px;
    }
    .total-row.final {
      border-top: 2px solid #ec4899;
      margin-top: 10px;
      padding-top: 15px;
      font-size: 20px;
      font-weight: bold;
      color: #ec4899;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e9ecef;
      text-align: center;
      color: #6c757d;
      font-size: 14px;
    }
    .highlight {
      background: #fff3cd;
      padding: 15px;
      border-left: 4px solid #ffc107;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>💗 Pedido Consolidado - Nadin Lencería</h1>
    <p style="margin: 0; opacity: 0.9;">${fecha}</p>
  </div>

  <div class="info-box">
    <h2 style="margin-top: 0; color: #ec4899;">📋 Información de la Revendedora</h2>
    <div class="info-row">
      <span class="label">Nombre:</span>
      <span>${revendedora.name}</span>
    </div>
    <div class="info-row">
      <span class="label">Handle:</span>
      <span>@${revendedora.handle}</span>
    </div>
    <div class="info-row">
      <span class="label">Email:</span>
      <span>${revendedora.email}</span>
    </div>
    <div class="info-row">
      <span class="label">Teléfono:</span>
      <span>${revendedora.telefono}</span>
    </div>
    <div class="info-row">
      <span class="label">Pedidos incluidos:</span>
      <span><strong>${pedidos.length}</strong></span>
    </div>
  </div>

  <div class="highlight">
    <div class="info-row">
      <span class="label">💳 Forma de pago:</span>
      <span><strong>${formaPago}</strong></span>
    </div>
    <div class="info-row">
      <span class="label">🚚 Tipo de envío:</span>
      <span><strong>${tipoEnvio}</strong></span>
    </div>
    ${transporteNombre ? `
    <div class="info-row">
      <span class="label">Transporte:</span>
      <span><strong>${transporteNombre}</strong></span>
    </div>
    ` : ''}
  </div>

  <h2 style="color: #ec4899;">📦 Productos (Agrupados)</h2>
  <p style="color: #6c757d; font-size: 14px;">
    Productos idénticos de múltiples pedidos han sido agrupados. 
    Ver columna "Clientes" para saber quién pidió cada cantidad.
  </p>

  <table>
    <thead>
      <tr>
        <th>SKU</th>
        <th>Producto</th>
        <th>Talle</th>
        <th>Color</th>
        <th>Cantidad</th>
        <th>P. Mayorista</th>
        <th>Subtotal</th>
        <th>Clientes</th>
      </tr>
    </thead>
    <tbody>
      ${productosAgrupados.map(p => `
        <tr>
          <td><strong>${p.sku}</strong></td>
          <td>
            <strong>${p.name}</strong><br>
            <small style="color: #6c757d;">${p.brand}</small>
          </td>
          <td>${p.talle}</td>
          <td>${p.color}</td>
          <td style="text-align: center;"><strong>${p.cantidadTotal}</strong></td>
          <td>$${p.precioMayorista.toLocaleString('es-AR')}</td>
          <td><strong>$${p.subtotalMayorista.toLocaleString('es-AR')}</strong></td>
          <td>
            <div class="clientes-list">
              ${p.clientes.map(c => `
                • ${c.nombre} ${c.telefono ? `(${c.telefono})` : ''}: <strong>${c.cantidad} un.</strong>
              `).join('<br>')}
            </div>
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totales">
    <h3 style="margin-top: 0; color: #ec4899;">💰 Resumen Financiero</h3>
    <div class="total-row">
      <span>Subtotal Mayorista:</span>
      <span><strong>$${totales.mayorista.toLocaleString('es-AR')}</strong></span>
    </div>
    <div class="total-row">
      <span>Subtotal Venta:</span>
      <span><strong>$${totales.venta.toLocaleString('es-AR')}</strong></span>
    </div>
    <div class="total-row final">
      <span>Ganancia Estimada:</span>
      <span>$${totales.ganancia.toLocaleString('es-AR')}</span>
    </div>
  </div>

  <div class="footer">
    <p><strong>Nadin Lencería</strong></p>
    <p>Este pedido fue generado automáticamente desde la app de revendedoras</p>
    <p style="font-size: 12px; margin-top: 10px;">
      Los productos están agrupados por SKU/Talle/Color para facilitar el armado.<br>
      Ver CSV adjunto para detalles completos.
    </p>
  </div>
</body>
</html>
  `;
}

/**
 * Envía email de consolidación MEJORADO
 */
export async function sendConsolidacionEmailMejorado(data: any) {
  const { revendedora, pedidos, totales, formaPago, tipoEnvio, transporteNombre } = data;

  // Agrupar productos idénticos
  const productosAgrupados = agruparProductos(pedidos);
  
  // Generar CSV
  const csvContent = generarCSVAgrupado(productosAgrupados);
  
  // Generar HTML
  const html = generarHTMLEmail(data, productosAgrupados);
  
  const fecha = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const subject = `💗 Pedido Consolidado – ${revendedora.name} (@${revendedora.handle}) – ${fecha}`;

  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: 'nadinlenceria@gmail.com',
    subject,
    html,
    attachments: [
      {
        filename: `pedido_consolidado_${revendedora.handle}_${Date.now()}.csv`,
        content: csvContent,
      },
    ],
  });
  
  console.log(`✅ Email enviado con ${productosAgrupados.length} productos agrupados`);
}

/**
 * Alias para compatibilidad con código existente
 */
export async function sendConsolidacionEmail(data: any) {
  return await sendConsolidacionEmailMejorado(data);
}
