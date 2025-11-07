import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BADGE_DEFINITIONS } from '@/lib/gamification';

export async function POST() {
  try {
    console.log('🌱 Seeding badges...');

    let created = 0;
    let existing = 0;

    for (const badgeDef of BADGE_DEFINITIONS) {
      const exists = await prisma.badge.findUnique({
        where: { slug: badgeDef.slug }
      });

      if (!exists) {
        await prisma.badge.create({
          data: {
            slug: badgeDef.slug,
            name: badgeDef.name,
            description: badgeDef.description,
            icon: badgeDef.icon,
            category: badgeDef.category,
            condition: JSON.stringify(badgeDef.condition),
            points: badgeDef.points,
            rarity: badgeDef.rarity
          }
        });
        created++;
        console.log(`  ✅ Created: ${badgeDef.name}`);
      } else {
        existing++;
        console.log(`  ℹ️ Exists: ${badgeDef.name}`);
      }
    }

    console.log(`\n✅ Badges created: ${created}`);
    console.log(`ℹ️ Badges already existed: ${existing}`);

    return NextResponse.json({
      success: true,
      created,
      existing,
      total: BADGE_DEFINITIONS.length
    });
  } catch (error) {
    console.error('❌ Error seeding badges:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error'
    }, { status: 500 });
  }
}