import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script para inicializar el sistema de Embajadoras de Marcas
 * Ejecutar: npx ts-node prisma/seed-brand-ambassadors.ts
 */

// 🏷️ Marcas iniciales (agregar más a medida que confirmen)
const INITIAL_BRANDS = [
  {
    brandSlug: 'besame',
    brandName: 'Bésame',
    logoEmoji: '💋',
    isActive: true // Cambiar a false si aún no confirmó
  },
  {
    brandSlug: 'cocot',
    brandName: 'Cocot',
    logoEmoji: '🌸',
    isActive: false // Ejemplo: aún no confirmó
  },
  {
    brandSlug: 'promise',
    brandName: 'Promise',
    logoEmoji: '💖',
    isActive: false
  }
  // Agregar más marcas aquí a medida que confirmen
];

async function main() {
  console.log('\n🎖️  ========================================');
  console.log('🎖️  INICIALIZANDO EMBAJADORAS DE MARCAS');
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
          logoEmoji: brand.logoEmoji,
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
  console.log('   1. Ejecutar: npx prisma migrate dev --name add-brand-ambassadors');
  console.log('   2. Cuando una marca confirme, cambiar isActive: true');
  console.log('   3. Los badges se crearán AUTOMÁTICAMENTE cuando una revendedora alcance el nivel');
  console.log('   4. Usar POST /api/admin/brands para agregar marcas nuevas fácilmente\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
