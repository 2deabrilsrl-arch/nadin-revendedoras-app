// lib/brand-tracking.ts
// 🎖️ Sistema de tracking de ventas por marca para Brand Ambassadors
// VERSIÓN CORREGIDA: Case-insensitive

import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

// Usar el mismo transporter que ya existe
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface BrandSalesUpdate {
  userId: string;
  lineas: Array<{
    brand?: string | null;
    qty: number;
  }>;
}

/**
 * Normaliza el nombre de marca para búsqueda case-insensitive
 * "MELIFERA" o "melifera" → "Melifera"
 */
function normalizarMarca(marca: string): string {
  if (!marca) return '';
  
  // Convertir a lowercase y capitalizar primera letra
  const lower = marca.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * Trackea ventas por marca cuando se crea un pedido
 * Actualiza UserBrandSales y asigna badges automáticamente
 */
export async function trackBrandSales(params: BrandSalesUpdate) {
  const { userId, lineas } = params;

  try {
    console.log('\n🎖️  ========================================');
    console.log('🎖️  TRACKING VENTAS POR MARCA');
    console.log('🎖️  ========================================');

    // 1. Agrupar cantidades por marca (normalizadas)
    const brandQuantities = new Map<string, number>();

    for (const linea of lineas) {
      if (linea.brand) {
        const brandNormalizada = normalizarMarca(linea.brand);
        const currentQty = brandQuantities.get(brandNormalizada) || 0;
        brandQuantities.set(brandNormalizada, currentQty + linea.qty);
      }
    }

    if (brandQuantities.size === 0) {
      console.log('ℹ️  No hay marcas para trackear en este pedido');
      console.log('========================================\n');
      return;
    }

    console.log(`📦 Marcas encontradas: ${Array.from(brandQuantities.keys()).join(', ')}`);

    // 2. Actualizar ventas por marca
    for (const [brand, quantity] of brandQuantities) {
      // Verificar si la marca está activa en el programa
      const brandAmbassador = await prisma.brandAmbassador.findUnique({
        where: { brandSlug: brand }
      });

      if (!brandAmbassador || !brandAmbassador.isActive) {
        console.log(`⏭️  ${brand}: No está en programa de embajadoras (saltando)`);
        continue;
      }

      console.log(`\n🏷️  Procesando: ${brand}`);
      console.log(`   Cantidad en este pedido: ${quantity}`);

      // Obtener registro actual
      const currentSales = await prisma.userBrandSales.findUnique({
        where: {
          userId_brandSlug: {
            userId,
            brandSlug: brand
          }
        }
      });

      const oldCount = currentSales?.salesCount || 0;
      const newCount = oldCount + quantity;

      console.log(`   Acumulado anterior: ${oldCount}`);
      console.log(`   Acumulado nuevo: ${newCount}`);

      // Actualizar o crear registro
      await prisma.userBrandSales.upsert({
        where: {
          userId_brandSlug: {
            userId,
            brandSlug: brand
          }
        },
        update: {
          salesCount: newCount
        },
        create: {
          userId,
          brandSlug: brand,
          salesCount: quantity
        }
      });

      // 3. Verificar badges desbloqueados
      await checkAndAssignBadges(userId, brand, newCount, oldCount);
    }

    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error en trackBrandSales:', error);
  }
}

/**
 * Verifica si el usuario alcanzó objetivos y asigna badges
 * 📧 Envía email a Nadin cuando desbloquea badge de embajadora
 */
async function checkAndAssignBadges(
  userId: string,
  brand: string,
  newCount: number,
  oldCount: number
) {
  try {
    // Obtener todos los badges de esta marca (case-insensitive)
    const brandBadges = await prisma.badge.findMany({
      where: {
        category: 'embajadora',
        slug: {
          startsWith: brand.toLowerCase()
        }
      }
    });

    if (brandBadges.length === 0) {
      console.log(`   ℹ️  No hay badges definidos para ${brand}`);
      return;
    }

    console.log(`   🎯 Verificando ${brandBadges.length} badges...`);

    for (const badge of brandBadges) {
      // Parsear condición
      let condition: any = {};
      try {
        condition = JSON.parse(badge.condition);
      } catch (e) {
        console.log(`   ⚠️  Error parseando condición del badge ${badge.slug}`);
        continue;
      }

      const requiredQty = condition.minQuantity || 0;

      // Verificar si ya tiene el badge
      const existingBadge = await prisma.userBadge.findUnique({
        where: {
          userId_badgeId: {
            userId,
            badgeId: badge.id
          }
        }
      });

      if (existingBadge) {
        continue; // Ya tiene este badge
      }

      // Verificar si alcanzó el objetivo
      if (newCount >= requiredQty && oldCount < requiredQty) {
        console.log(`   🎉 ¡BADGE DESBLOQUEADO! ${badge.name}`);

        // Obtener datos del usuario para el email
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            name: true,
            email: true,
            telefono: true
          }
        });

        if (!user) {
          console.log('   ⚠️  Usuario no encontrado');
          continue;
        }

        // Asignar badge
        await prisma.userBadge.create({
          data: {
            userId,
            badgeId: badge.id
          }
        });

        // Sumar puntos
        await prisma.point.create({
          data: {
            userId,
            amount: badge.points,
            reason: 'badge_unlock',
            description: `Badge desbloqueado: ${badge.name}`
          }
        });

        // Enviar notificación a revendedora
        await prisma.notificacion.create({
          data: {
            userId,
            tipo: 'badge_unlock',
            titulo: `🎖️ ¡Nuevo Badge: ${badge.name}!`,
            mensaje: `¡Felicitaciones! Desbloqueaste el badge ${badge.name} por vender ${requiredQty} prendas de ${brand}. Ganaste ${badge.points} puntos.`,
            leida: false
          }
        });

        console.log(`   ✅ Badge asignado + ${badge.points} puntos`);

        // 📧 Enviar email a Nadin
        try {
          await enviarEmailNuevoEmbajadora(
            user.name,
            user.email,
            user.telefono,
            brand,
            badge.name,
            requiredQty
          );
          console.log(`   📧 Email enviado a nadinlenceria@gmail.com`);
        } catch (emailError) {
          console.error('   ⚠️  Error enviando email a Nadin (no crítico):', emailError);
          // No fallar si falla el email
        }
      }
    }

  } catch (error) {
    console.error('   ❌ Error verificando badges:', error);
  }
}

/**
 * 📧 Envía email a Nadin cuando una revendedora desbloquea badge de embajadora
 */
async function enviarEmailNuevoEmbajadora(
  nombreRevendedora: string,
  emailRevendedora: string,
  telefonoRevendedora: string,
  marca: string,
  badge: string,
  cantidadVendida: number
) {
  const subject = `🎖️ Nueva Embajadora de ${marca} - Badge Desbloqueado`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .badge-info {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #667eea;
        }
        .info-row {
          display: flex;
          margin: 10px 0;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        .info-label {
          font-weight: bold;
          min-width: 120px;
          color: #667eea;
        }
        .info-value {
          color: #333;
        }
        .highlight {
          background: #fef3c7;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          color: #92400e;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #eee;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">🎖️ ¡Nueva Embajadora!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
            Una revendedora alcanzó un nuevo badge de ${marca}
          </p>
        </div>
        
        <div class="content">
          <div class="highlight">
            ${badge}
          </div>
          
          <p style="font-size: 16px; color: #666;">
            Una revendedora ha alcanzado un objetivo importante en el programa de embajadoras.
            Aquí están los detalles para coordinar la entrega del premio:
          </p>
          
          <div class="badge-info">
            <h3 style="margin-top: 0; color: #667eea;">📋 Datos de la Revendedora</h3>
            
            <div class="info-row">
              <div class="info-label">Nombre:</div>
              <div class="info-value">${nombreRevendedora}</div>
            </div>
            
            <div class="info-row">
              <div class="info-label">Teléfono:</div>
              <div class="info-value">${telefonoRevendedora}</div>
            </div>
            
            <div class="info-row">
              <div class="info-label">Email:</div>
              <div class="info-value">${emailRevendedora}</div>
            </div>
            
            <div class="info-row">
              <div class="info-label">Marca:</div>
              <div class="info-value">${marca}</div>
            </div>
            
            <div class="info-row">
              <div class="info-label">Badge:</div>
              <div class="info-value">${badge}</div>
            </div>
            
            <div class="info-row">
              <div class="info-label">Prendas vendidas:</div>
              <div class="info-value">${cantidadVendida} prendas de ${marca}</div>
            </div>
            
            <div class="info-row">
              <div class="info-label">Fecha:</div>
              <div class="info-value">${new Date().toLocaleDateString('es-AR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</div>
            </div>
          </div>
          
          <p style="background: #e0e7ff; padding: 15px; border-radius: 8px; margin-top: 20px;">
            💡 <strong>Próximo paso:</strong> Coordiná con la revendedora para la entrega del premio correspondiente a este badge.
          </p>
        </div>
        
        <div class="footer">
          <p>Este email fue generado automáticamente por el sistema de Nadin Revendedoras</p>
          <p style="font-size: 12px; color: #999; margin-top: 10px;">
            🎖️ Sistema de Brand Ambassadors
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
🎖️ NUEVA EMBAJADORA DE ${marca.toUpperCase()}

Badge Desbloqueado: ${badge}

DATOS DE LA REVENDEDORA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nombre: ${nombreRevendedora}
Teléfono: ${telefonoRevendedora}
Email: ${emailRevendedora}

LOGRO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Marca: ${marca}
Badge: ${badge}
Prendas vendidas: ${cantidadVendida} prendas de ${marca}
Fecha: ${new Date().toLocaleString('es-AR')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Coordiná con la revendedora para la entrega del premio.

Sistema de Nadin Revendedoras
  `;

  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: 'nadinlenceria@gmail.com',
    subject,
    text,
    html
  });
}

/**
 * Obtiene el progreso de un usuario en todas las marcas activas
 */
export async function getUserBrandProgress(userId: string) {
  try {
    // Marcas activas
    const activeBrands = await prisma.brandAmbassador.findMany({
      where: { isActive: true }
    });

    // Ventas del usuario por marca
    const userSales = await prisma.userBrandSales.findMany({
      where: { userId }
    });

    const salesMap = new Map(
      userSales.map(s => [s.brandSlug, s.salesCount])
    );

    // Badges del usuario
    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true }
    });

    const progress = [];

    for (const brand of activeBrands) {
      const currentSales = salesMap.get(brand.brandSlug) || 0;

      // Obtener badges de esta marca
      const brandBadges = await prisma.badge.findMany({
        where: {
          category: 'embajadora',
          slug: { startsWith: brand.brandSlug.toLowerCase() }
        },
        orderBy: { points: 'asc' }
      });

      // Encontrar siguiente objetivo
      let nextBadge = null;
      for (const badge of brandBadges) {
        const condition = JSON.parse(badge.condition);
        const hasIt = userBadges.some(ub => ub.badgeId === badge.id);
        
        if (!hasIt && currentSales < condition.minQuantity) {
          nextBadge = {
            name: badge.name,
            icon: badge.icon,
            required: condition.minQuantity,
            remaining: condition.minQuantity - currentSales,
            progress: Math.min((currentSales / condition.minQuantity) * 100, 100)
          };
          break;
        }
      }

      progress.push({
        brandSlug: brand.brandSlug,
        brandName: brand.brandName,
        logoUrl: brand.logoUrl,
        logoEmoji: brand.logoEmoji,
        currentSales,
        totalBadges: brandBadges.length,
        unlockedBadges: userBadges.filter(ub => 
          ub.badge.slug.startsWith(brand.brandSlug.toLowerCase())
        ).length,
        nextBadge
      });
    }

    return progress;

  } catch (error) {
    console.error('Error obteniendo progreso de marcas:', error);
    return [];
  }
}

/**
 * Recalcula ventas por marca para un usuario (útil para correcciones)
 */
export async function recalcularBrandSales(userId: string) {
  try {
    console.log(`\n🔄 Recalculando ventas por marca para usuario: ${userId}`);

    // Obtener todos los pedidos completados
    const pedidos = await prisma.pedido.findMany({
      where: {
        userId,
        estado: { in: ['enviado', 'armado', 'completado'] }
      },
      include: { lineas: true }
    });

    // Agrupar por marca (normalizadas)
    const brandTotals = new Map<string, number>();

    for (const pedido of pedidos) {
      for (const linea of pedido.lineas) {
        if (linea.brand) {
          const brandNormalizada = normalizarMarca(linea.brand);
          const current = brandTotals.get(brandNormalizada) || 0;
          brandTotals.set(brandNormalizada, current + linea.qty);
        }
      }
    }

    // Actualizar en BD
    for (const [brand, total] of brandTotals) {
      await prisma.userBrandSales.upsert({
        where: {
          userId_brandSlug: {
            userId,
            brandSlug: brand
          }
        },
        update: { salesCount: total },
        create: {
          userId,
          brandSlug: brand,
          salesCount: total
        }
      });

      console.log(`✅ ${brand}: ${total} prendas`);
    }

    console.log('✅ Recálculo completado\n');

    return { success: true, brands: brandTotals.size };

  } catch (error) {
    console.error('Error recalculando brand sales:', error);
    throw error;
  }
}
