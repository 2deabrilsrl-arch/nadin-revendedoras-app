import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * API para gestionar Embajadoras de Marcas
 * 
 * GET    /api/admin/brands          - Listar todas las marcas
 * POST   /api/admin/brands          - Agregar nueva marca
 * PATCH  /api/admin/brands/:slug    - Activar/desactivar marca
 */

// GET - Listar todas las marcas
export async function GET() {
  try {
    const brands = await prisma.brandAmbassador.findMany({
      orderBy: [
        { isActive: 'desc' }, // Activas primero
        { brandName: 'asc' }
      ]
    });

    // Para cada marca, obtener estadísticas de embajadoras
    const brandsWithStats = await Promise.all(
      brands.map(async (brand) => {
        // Contar usuarios con al menos 1 badge de esta marca
        const ambassadorCount = await prisma.userBadge.count({
          where: {
            badge: {
              slug: {
                startsWith: `embajadora-${brand.brandSlug}-`
              }
            }
          },
          distinct: ['userId']
        });

        // Contar total de ventas de esta marca
        const totalSales = await prisma.linea.count({
          where: {
            brand: brand.brandName,
            pedido: {
              estado: 'entregado',
              paidByClient: true,
              NOT: {
                estado: 'cancelado'
              }
            }
          }
        });

        return {
          ...brand,
          stats: {
            ambassadorCount,
            totalSales
          }
        };
      })
    );

    return NextResponse.json({
      success: true,
      brands: brandsWithStats
    });

  } catch (error) {
    console.error('❌ Error listando marcas:', error);
    return NextResponse.json(
      { error: 'Error al listar marcas' },
      { status: 500 }
    );
  }
}

// POST - Agregar nueva marca
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandSlug, brandName, logoEmoji, logoUrl, isActive } = body;

    // Validaciones
    if (!brandSlug || !brandName) {
      return NextResponse.json(
        { error: 'brandSlug y brandName son requeridos' },
        { status: 400 }
      );
    }

    // Normalizar slug (lowercase, sin espacios)
    const normalizedSlug = brandSlug.toLowerCase().trim().replace(/\s+/g, '-');

    // Verificar que no exista
    const existing = await prisma.brandAmbassador.findUnique({
      where: { brandSlug: normalizedSlug }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una marca con ese slug' },
        { status: 400 }
      );
    }

    // Crear marca
    const newBrand = await prisma.brandAmbassador.create({
      data: {
        brandSlug: normalizedSlug,
        brandName: brandName.trim(),
        logoEmoji: logoEmoji || '🏷️',
        logoUrl: logoUrl || null,
        isActive: isActive !== undefined ? isActive : false
      }
    });

    console.log(`✅ Nueva marca creada: ${newBrand.brandName} (${newBrand.isActive ? 'ACTIVA' : 'INACTIVA'})`);

    return NextResponse.json({
      success: true,
      brand: newBrand,
      message: `Marca ${newBrand.brandName} creada exitosamente. Los badges se crearán automáticamente cuando las revendedoras alcancen los niveles.`
    });

  } catch (error) {
    console.error('❌ Error creando marca:', error);
    return NextResponse.json(
      { error: 'Error al crear marca' },
      { status: 500 }
    );
  }
}

// PATCH - Activar/desactivar marca
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandSlug, isActive } = body;

    if (!brandSlug) {
      return NextResponse.json(
        { error: 'brandSlug es requerido' },
        { status: 400 }
      );
    }

    const brand = await prisma.brandAmbassador.findUnique({
      where: { brandSlug }
    });

    if (!brand) {
      return NextResponse.json(
        { error: 'Marca no encontrada' },
        { status: 404 }
      );
    }

    // Actualizar estado
    const updatedBrand = await prisma.brandAmbassador.update({
      where: { brandSlug },
      data: {
        isActive: isActive !== undefined ? isActive : !brand.isActive
      }
    });

    console.log(`✅ Marca ${updatedBrand.brandName} ${updatedBrand.isActive ? 'ACTIVADA' : 'DESACTIVADA'}`);

    return NextResponse.json({
      success: true,
      brand: updatedBrand,
      message: `Marca ${updatedBrand.brandName} ${updatedBrand.isActive ? 'activada' : 'desactivada'} exitosamente`
    });

  } catch (error) {
    console.error('❌ Error actualizando marca:', error);
    return NextResponse.json(
      { error: 'Error al actualizar marca' },
      { status: 500 }
    );
  }
}
