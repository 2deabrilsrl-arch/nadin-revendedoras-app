// prisma/seed-badges.ts
// 🎮 Script para inicializar las medallas en la base de datos

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Definición de badges basada en la lógica de gamification
const BADGE_DEFINITIONS = [
  {
    slug: 'primera-venta',
    name: 'Primera Venta',
    description: '¡Tu primera venta exitosa!',
    icon: '🎉',
    category: 'ventas',
    condition: { minSales: 1 },
    points: 50,
    rarity: 'common'
  },
  {
    slug: '10-ventas',
    name: '10 Ventas',
    description: 'Alcanzaste 10 ventas',
    icon: '⭐',
    category: 'ventas',
    condition: { minSales: 10 },
    points: 100,
    rarity: 'common'
  },
  {
    slug: '50-ventas',
    name: '50 Ventas',
    description: 'Alcanzaste 50 ventas',
    icon: '🌟',
    category: 'ventas',
    condition: { minSales: 50 },
    points: 200,
    rarity: 'rare'
  },
  {
    slug: '100-ventas',
    name: '100 Ventas',
    description: 'Alcanzaste 100 ventas',
    icon: '💫',
    category: 'ventas',
    condition: { minSales: 100 },
    points: 300,
    rarity: 'rare'
  },
  {
    slug: '200-ventas',
    name: '200 Ventas',
    description: 'Alcanzaste 200 ventas',
    icon: '✨',
    category: 'ventas',
    condition: { minSales: 200 },
    points: 500,
    rarity: 'epic'
  },
  {
    slug: '500-ventas',
    name: '500 Ventas',
    description: 'Alcanzaste 500 ventas - ¡Eres una leyenda!',
    icon: '👑',
    category: 'ventas',
    condition: { minSales: 500 },
    points: 1000,
    rarity: 'legendary'
  }
];

async function main() {
  console.log('🎮 Inicializando sistema de gamificación...\n');

  // Crear todas las medallas
  for (const badge of BADGE_DEFINITIONS) {
    const created = await prisma.badge.upsert({
      where: { slug: badge.slug },
      update: {
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        category: badge.category,
        condition: JSON.stringify(badge.condition),
        points: badge.points,
        rarity: badge.rarity,
      },
      create: {
        slug: badge.slug,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        category: badge.category,
        condition: JSON.stringify(badge.condition),
        points: badge.points,
        rarity: badge.rarity,
      },
    });
    
    console.log(`✅ ${created.icon} ${created.name} - ${created.rarity}`);
  }

  console.log(`\n✨ ${BADGE_DEFINITIONS.length} medallas creadas exitosamente!`);
  
  // Inicializar niveles para usuarios existentes
  const users = await prisma.user.findMany({
    select: { id: true }
  });
  
  for (const user of users) {
    // Contar pedidos del usuario
    const pedidosCount = await prisma.pedido.count({
      where: { userId: user.id }
    });
    
    // Crear o actualizar nivel
    await prisma.userLevel.upsert({
      where: { userId: user.id },
      update: {
        totalSales: pedidosCount,
      },
      create: {
        userId: user.id,
        currentLevel: 'bronce',
        currentXP: 0,
        totalSales: pedidosCount,
      },
    });
  }
  
  console.log(`\n👥 Niveles inicializados para ${users.length} usuarios`);
  console.log('\n🎉 ¡Sistema de gamificación listo!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
