// prisma/seed-melifera-badges.ts
// 🎖️ Script para crear badges de Melifera (Brand Ambassador)
// Ejecutar: npx ts-node prisma/seed-melifera-badges.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MELIFERA_BADGES = [
  {
    slug: 'melifera-bronce',
    name: 'Melifera Bronce',
    description: 'Vendiste 10 prendas de Melifera',
    icon: '/logos/MELIFERA.jpg|🥉',
    category: 'embajadora',
    condition: JSON.stringify({
      type: 'brand_sales',
      brand: 'Melifera',
      minQuantity: 10
    }),
    points: 150,
    rarity: 'epic'
  },
  {
    slug: 'melifera-plata',
    name: 'Melifera Plata',
    description: 'Vendiste 25 prendas de Melifera',
    icon: '/logos/MELIFERA.jpg|🥈',
    category: 'embajadora',
    condition: JSON.stringify({
      type: 'brand_sales',
      brand: 'Melifera',
      minQuantity: 25
    }),
    points: 300,
    rarity: 'epic'
  },
  {
    slug: 'melifera-oro',
    name: 'Melifera Oro',
    description: 'Vendiste 50 prendas de Melifera',
    icon: '/logos/MELIFERA.jpg|🥇',
    category: 'embajadora',
    condition: JSON.stringify({
      type: 'brand_sales',
      brand: 'Melifera',
      minQuantity: 50
    }),
    points: 500,
    rarity: 'epic'
  },
  {
    slug: 'melifera-platino',
    name: 'Melifera Platino',
    description: 'Vendiste 100 prendas de Melifera - ¡Sos embajadora oficial!',
    icon: '/logos/MELIFERA.jpg|💎',
    category: 'embajadora',
    condition: JSON.stringify({
      type: 'brand_sales',
      brand: 'Melifera',
      minQuantity: 100
    }),
    points: 1000,
    rarity: 'legendary'
  }
];

async function main() {
  console.log('\n🎖️  ========================================');
  console.log('🎖️  CREANDO BADGES DE MELIFERA');
  console.log('🎖️  ========================================\n');

  for (const badge of MELIFERA_BADGES) {
    const created = await prisma.badge.upsert({
      where: { slug: badge.slug },
      update: {
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        category: badge.category,
        condition: badge.condition,
        points: badge.points,
        rarity: badge.rarity
      },
      create: badge
    });

    console.log(`✅ ${badge.name} - ${badge.points} pts (${badge.rarity})`);
  }

  console.log('\n🎉 ========================================');
  console.log('🎉 BADGES DE MELIFERA CREADOS');
  console.log('🎉 ========================================');
  console.log(`\n✨ Total: ${MELIFERA_BADGES.length} badges`);
  console.log('\n💡 PRÓXIMOS PASOS:');
  console.log('   1. Verificar que Melifera esté activa en BrandAmbassador');
  console.log('   2. Ejecutar: npm run seed-brand-ambassadors');
  console.log('   3. Las revendedoras empezarán a acumular automáticamente\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
