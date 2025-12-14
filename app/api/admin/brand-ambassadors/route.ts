// app/api/admin/brand-ambassadors/route.ts
// 🎖️ API Admin para gestionar programa de Brand Ambassadors

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET: Obtener ranking de revendedoras por marca
 * Query params:
 *   - brand: slug de la marca (ej: "Melifera")
 *   - limit: cantidad de resultados (default: 50)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brand = searchParams.get('brand');
    const limit = parseInt(searchParams.get('limit') || '50');

    console.log('\n🎖️  Admin Brand Ambassadors - GET');
    console.log(`   Marca: ${brand || 'todas'}`);
    console.log(`   Límite: ${limit}`);

    // Si piden una marca específica
    if (brand) {
      const ranking = await getBrandRanking(brand, limit);
      return NextResponse.json(ranking);
    }

    // Si no, devolver overview de todas las marcas
    const overview = await getBrandsOverview();
    return NextResponse.json(overview);

  } catch (error) {
    console.error('❌ Error en brand ambassadors API:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos' },
      { status: 500 }
    );
  }
}

/**
 * POST: Activar/desactivar marca en el programa
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as any;
    const { brandSlug, action } = body;

    if (!brandSlug || !action) {
      return NextResponse.json(
        { error: 'brandSlug y action son requeridos' },
        { status: 400 }
      );
    }

    console.log(`\n🎖️  ${action === 'activate' ? 'Activando' : 'Desactivando'} marca: ${brandSlug}`);

    const updated = await prisma.brandAmbassador.update({
      where: { brandSlug },
      data: { isActive: action === 'activate' }
    });

    return NextResponse.json({
      success: true,
      brand: updated
    });

  } catch (error) {
    console.error('❌ Error actualizando marca:', error);
    return NextResponse.json(
      { error: 'Error al actualizar marca' },
      { status: 500 }
    );
  }
}

/**
 * Obtiene ranking de una marca específica
 */
async function getBrandRanking(brandSlug: string, limit: number) {
  // Verificar que la marca existe
  const brand = await prisma.brandAmbassador.findUnique({
    where: { brandSlug }
  });

  if (!brand) {
    throw new Error(`Marca ${brandSlug} no encontrada`);
  }

  // Obtener ventas de todos los usuarios para esta marca
  const sales = await prisma.userBrandSales.findMany({
    where: { brandSlug },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          handle: true,
          telefono: true,
          email: true
        }
      }
    },
    orderBy: { salesCount: 'desc' },
    take: limit
  });

  // Obtener badges de esta marca
  const brandBadges = await prisma.badge.findMany({
    where: {
      category: 'embajadora',
      slug: { startsWith: brandSlug.toLowerCase() }
    },
    orderBy: { points: 'asc' }
  });

  // Mapear con posición y badges
  const ranking = sales.map((sale, index) => {
    // Encontrar qué badges tiene
    const badges = brandBadges.filter(badge => {
      const condition = JSON.parse(badge.condition);
      return sale.salesCount >= condition.minQuantity;
    });

    // Encontrar siguiente badge
    const nextBadge = brandBadges.find(badge => {
      const condition = JSON.parse(badge.condition);
      return sale.salesCount < condition.minQuantity;
    });

    let nextBadgeInfo = null;
    if (nextBadge) {
      const condition = JSON.parse(nextBadge.condition);
      nextBadgeInfo = {
        name: nextBadge.name,
        icon: nextBadge.icon,
        required: condition.minQuantity,
        remaining: condition.minQuantity - sale.salesCount,
        progress: Math.min((sale.salesCount / condition.minQuantity) * 100, 100)
      };
    }

    return {
      position: index + 1,
      userId: sale.user.id,
      userName: sale.user.name,
      userHandle: sale.user.handle,
      userTelefono: sale.user.telefono,
      userEmail: sale.user.email,
      salesCount: sale.salesCount,
      badgesUnlocked: badges.length,
      totalBadges: brandBadges.length,
      highestBadge: badges.length > 0 ? badges[badges.length - 1] : null,
      nextBadge: nextBadgeInfo,
      lastUpdate: sale.updatedAt
    };
  });

  return {
    brand: {
      slug: brand.brandSlug,
      name: brand.brandName,
      logoUrl: brand.logoUrl,
      logoEmoji: brand.logoEmoji,
      isActive: brand.isActive
    },
    totalParticipants: ranking.length,
    totalBadges: brandBadges.length,
    ranking
  };
}

/**
 * Obtiene overview de todas las marcas activas
 */
async function getBrandsOverview() {
  const brands = await prisma.brandAmbassador.findMany({
    orderBy: { brandName: 'asc' }
  });

  const overview = [];

  for (const brand of brands) {
    // Contar participantes
    const participants = await prisma.userBrandSales.count({
      where: { brandSlug: brand.brandSlug }
    });

    // Total de prendas vendidas
    const totalSales = await prisma.userBrandSales.aggregate({
      where: { brandSlug: brand.brandSlug },
      _sum: { salesCount: true }
    });

    // Badges desbloqueados
    const brandBadges = await prisma.badge.findMany({
      where: {
        category: 'embajadora',
        slug: { startsWith: brand.brandSlug.toLowerCase() }
      }
    });

    const badgesUnlocked = await prisma.userBadge.count({
      where: {
        badge: {
          slug: { startsWith: brand.brandSlug.toLowerCase() }
        }
      }
    });

    // Top 3
    const top3 = await prisma.userBrandSales.findMany({
      where: { brandSlug: brand.brandSlug },
      include: {
        user: {
          select: { name: true, handle: true }
        }
      },
      orderBy: { salesCount: 'desc' },
      take: 3
    });

    overview.push({
      slug: brand.brandSlug,
      name: brand.brandName,
      logoUrl: brand.logoUrl,
      logoEmoji: brand.logoEmoji,
      isActive: brand.isActive,
      stats: {
        participants,
        totalSales: totalSales._sum.salesCount || 0,
        totalBadges: brandBadges.length,
        badgesUnlocked
      },
      top3: top3.map((s, i) => ({
        position: i + 1,
        userName: s.user.name,
        userHandle: s.user.handle,
        salesCount: s.salesCount
      }))
    });
  }

  return {
    totalBrands: brands.length,
    activeBrands: brands.filter(b => b.isActive).length,
    brands: overview
  };
}
