import { prisma } from './prisma';
import { getAllProducts, formatProductsForFrontend } from './tiendanube';

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos en milisegundos

/**
 * Verifica si el caché necesita actualizarse
 */
async function needsUpdate(): Promise<boolean> {
  const lastUpdate = await prisma.catalogoCache.findFirst({
    orderBy: { updatedAt: 'desc' }
  });

  if (!lastUpdate) return true;

  const now = new Date().getTime();
  const lastUpdateTime = new Date(lastUpdate.updatedAt).getTime();
  const timeDiff = now - lastUpdateTime;

  return timeDiff > CACHE_DURATION;
}

/**
 * Sincroniza el catálogo desde Tiendanube y lo guarda en cache
 */
export async function syncCatalog() {
  try {
    console.log('🔄 Iniciando sincronización del catálogo...');
    
    // Obtener todos los productos de Tiendanube
    const products = await getAllProducts();
    const formatted = formatProductsForFrontend(products);

    // Eliminar cache antiguo
    await prisma.catalogoCache.deleteMany({});
    console.log('🗑️  Cache antiguo eliminado');

    // Guardar nuevos productos
    const createPromises = formatted.map(product => 
      prisma.catalogoCache.create({
        data: {
          productId: product.id.toString(),
          data: JSON.stringify(product),
          brand: product.brand,
          category: product.category,
          sex: inferSex(product.category, product.name),
          salesCount: 0,
          updatedAt: new Date()
        }
      })
    );

    await Promise.all(createPromises);
    
    console.log(`✅ Catálogo sincronizado: ${formatted.length} productos guardados en cache`);
    return { success: true, count: formatted.length };
  } catch (error) {
    console.error('❌ Error sincronizando catálogo:', error);
    throw error;
  }
}

/**
 * Obtiene productos desde el cache (con actualización automática si es necesario)
 */
export async function getCachedProducts(filters?: {
  brand?: string;
  category?: string;
  sex?: string;
  search?: string;
}) {
  // Verificar si necesita actualización
  const shouldUpdate = await needsUpdate();
  
  if (shouldUpdate) {
    console.log('⏰ Cache expirado, sincronizando...');
    await syncCatalog();
  }

  // Construir filtros
  const where: any = {};
  if (filters?.brand) where.brand = filters.brand;
  if (filters?.category) where.category = { contains: filters.category };
  if (filters?.sex) where.sex = filters.sex;

  // Obtener productos del cache
  const cached = await prisma.catalogoCache.findMany({
    where,
    orderBy: [
      { salesCount: 'desc' }, // Primero los más vendidos
      { updatedAt: 'desc' }
    ]
  });

  // Parsear JSON y aplicar búsqueda si existe
  let products = cached.map(item => JSON.parse(item.data));

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    products = products.filter(p => 
      p.name.toLowerCase().includes(searchLower) ||
      p.brand.toLowerCase().includes(searchLower) ||
      p.variants.some((v: any) => v.sku?.toLowerCase().includes(searchLower))
    );
  }

  return products;
}

/**
 * Fuerza una sincronización manual del catálogo
 */
export async function forceSyncCatalog() {
  return await syncCatalog();
}

/**
 * Obtiene estadísticas del cache
 */
export async function getCacheStats() {
  const count = await prisma.catalogoCache.count();
  const lastUpdate = await prisma.catalogoCache.findFirst({
    orderBy: { updatedAt: 'desc' },
    select: { updatedAt: true }
  });

  return {
    totalProducts: count,
    lastUpdate: lastUpdate?.updatedAt,
    nextUpdate: lastUpdate 
      ? new Date(new Date(lastUpdate.updatedAt).getTime() + CACHE_DURATION)
      : null
  };
}

/**
 * Infiere el sexo/género del producto basado en categoría y nombre
 */
function inferSex(category: string, name: string): string {
  const text = `${category} ${name}`.toLowerCase();
  
  if (text.includes('mujer') || text.includes('dama') || text.includes('femenin')) {
    return 'Mujer';
  }
  if (text.includes('hombre') || text.includes('masculin') || text.includes('caballero')) {
    return 'Hombre';
  }
  if (text.includes('niñ') || text.includes('kid') || text.includes('infant')) {
    return 'Niños';
  }
  
  return 'Unisex';
}
