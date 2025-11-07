// prisma/seed-badges.ts
// 🎮 Script para inicializar las medallas en la base de datos

import { PrismaClient } from '@prisma/client';
import { BADGE_DEFINITIONS } from '../src/lib/gamification';

const prisma = new PrismaClient();

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
