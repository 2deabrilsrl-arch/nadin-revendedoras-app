import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script para inicializar el sistema de Embajadoras de Marcas CON LOGOS REALES
 * Ejecutar: npx ts-node prisma/seed-brand-ambassadors.ts
 */

// 🏷️ Marcas con logos reales
const INITIAL_BRANDS = [
  {
    brandSlug: 'acrobata',
    brandName: 'Acrobata',
    logoUrl: '/logos/ACROBATA.jpg',  // ⬅️ Ruta de la imagen real
    logoEmoji: '🤸',                   // Fallback emoji si falla la imagen
    isActive: true
  },
  {
    brandSlug: 'besame',
    brandName: 'Bésame',
    logoUrl: '/logos/besame.jpg',    // ⬅️ Agregá esta imagen
    logoEmoji: '💋',
    isActive: false
  },
  {
    brandSlug: 'cocot',
    brandName: 'Cocot',
    logoUrl: '/logos/cocot.jpg',
    logoEmoji: '🌸',
    isActive: false
  },
  {
    brandSlug: 'promise',
    brandName: 'Promise',
    logoUrl: '/logos/promise.jpg',
    logoEmoji: '💖',
    isActive: false
  }
  // Agregar más marcas aquí a medida que confirmen
];

async function main() {
  console.log('\n🎖️  ========================================');
  console.log('🎖️  INICIALIZANDO EMBAJADORAS CON LOGOS');
  console.log('🎖️  ========================================\n');

  let brandsCreated = 0;
  let brandsUpdated = 0;

  // Crear o actualizar marcas
  for (const brand of INITIAL_BRANDS) {
    const existing = await prisma.brandAmbassador.findUnique({
      where: { brandSlug: brand.brandSlug }
    });

    if (existing) {
      await prisma.brandAmbassador.update({
        where: { brandSlug: brand.brandSlug },
        data: {
          brandName: brand.brandName,
          logoUrl: brand.logoUrl,      // ⬅️ Actualiza logoUrl
          logoEmoji: brand.logoEmoji,  // ⬅️ Mantiene emoji como fallback
          isActive: brand.isActive
        }
      });
      console.log(`✏️  ${brand.brandName} - Actualizada (${brand.isActive ? 'ACTIVA' : 'INACTIVA'})`);
      brandsUpdated++;
    } else {
      await prisma.brandAmbassador.create({
        data: brand
      });
      console.log(`✅ ${brand.brandName} - Creada (${brand.isActive ? 'ACTIVA' : 'INACTIVA'})`);
      brandsCreated++;
    }
  }

  console.log('\n🎉 ========================================');
  console.log('🎉 INICIALIZACIÓN COMPLETA');
  console.log('🎉 ========================================');
  console.log(`🆕 Marcas creadas: ${brandsCreated}`);
  console.log(`✏️  Marcas actualizadas: ${brandsUpdated}`);
  console.log('🎉 ========================================\n');

  console.log('💡 PRÓXIMOS PASOS:');
  console.log('   1. Asegurate que las imágenes estén en public/logos/');
  console.log('   2. Cuando una marca confirme, cambiar isActive: true');
  console.log('   3. Los badges usarán el logo real + emoji de nivel');
  console.log('   4. Ejemplo: Logo Acrobata + 🥉 para nivel bronce\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
