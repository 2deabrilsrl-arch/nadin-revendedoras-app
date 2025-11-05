import { prisma } from './prisma';
import { getAllProducts, getCategories } from './tiendanube';

interface TiendanubeCategory {
  id: number;
  name: { es: string };
  parent?: number | null;
  subcategories?: number[];
}

/**
 * Construye la ruta completa de una categoría (ej: "MUJER > MEDIAS > SOQUETES")
 */
function buildCategoryPath(
  categoryId: number, 
  categoriesMap: Map<number, TiendanubeCategory>
): string {
  const path: string[] = [];
  let currentId: number | null | undefined = categoryId;
  
  // Evitar loops infinitos
  const visited = new Set<number>();
  
  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const category = categoriesMap.get(currentId);
    
    if (!category) break;
    
    path.unshift(category.name.es);
    currentId = category.parent;
  }
  
  return path.join(' > ');
}

/**
 * Obtiene todas las categorías y crea un mapa para búsqueda rápida
 */
async function getCategoriesMap(): Promise<Map<number, TiendanubeCategory>> {
  const categories = await getCategories();
  const map = new Map<number, TiendanubeCategory>();
  
  categories.forEach((cat: any) => {
    map.set(cat.id, {
      id: cat.id,
      name: cat.name || { es: 'Sin nombre' },
      parent: cat.parent || null,
      subcategories: cat.subcategories || []
    });
  });
  
  return map;
}

/**
 * Formatea productos con jerarquía de categorías completa
 */
export async function formatProductsWithFullCategories(products: any[]) {
  console.log('📂 Construyendo jerarquía de categorías...');
  
  // Obtener todas las categorías
  const categoriesMap = await getCategoriesMap();
  console.log(`✅ ${categoriesMap.size} categorías en memoria`);
  
  return products.map(product => {
    try {
      let fullCategoryPath = 'Sin categoría';
      
      // Si el producto tiene categorías
      if (product.categories && product.categories.length > 0) {
        // Tomar la primera categoría (la más específica)
        const categoryId = product.categories[0].id;
        
        if (categoryId) {
          fullCategoryPath = buildCategoryPath(categoryId, categoriesMap);
        }
      }
      
      return {
        id: product.id,
        name: product.name?.es || 'Sin nombre',
        brand: product.brand || 'Sin marca',
        category: fullCategoryPath, // AHORA CON JERARQUÍA COMPLETA
        image: product.images?.[0]?.src || '/placeholder.png',
        variants: (product.variants || []).map((variant: any) => ({
          id: variant.id,
          sku: variant.sku || '',
          price: parseFloat(variant.price) || 0,
          stock: variant.stock || 0,
          talle: variant.values?.[0]?.es || '',
          color: variant.values?.[1]?.es || ''
        })),
        published: product.published
      };
    } catch (error) {
      console.error('❌ Error formateando producto:', product.id, error);
      return null;
    }
  }).filter(p => p !== null);
}

/**
 * Sincroniza el catálogo con jerarquía completa de categorías
 */
export async function syncCatalogWithFullCategories() {
  try {
    console.log('🔄 Iniciando sincronización con jerarquía completa...');
    
    // Obtener productos
    const products = await getAllProducts();
    console.log(`📦 ${products.length} productos obtenidos de TN`);
    
    // Formatear con jerarquía completa
    const formatted = await formatProductsWithFullCategories(products);
    console.log(`✅ ${formatted.length} productos formateados`);
    
    // Limpiar cache anterior
    await prisma.catalogoCache.deleteMany({});
    console.log('🗑️  Cache antiguo eliminado');
    
    // Guardar con nuevas categorías
    const createPromises = formatted.map(product => 
      prisma.catalogoCache.create({
        data: {
          productId: product.id.toString(),
          data: JSON.stringify(product),
          brand: product.brand,
          category: product.category, // Ahora con jerarquía completa
          sex: inferSex(product.category, product.name),
          salesCount: 0,
          updatedAt: new Date()
        }
      })
    );
    
    await Promise.all(createPromises);
    console.log(`✅ ${formatted.length} productos guardados con jerarquía completa`);
    
    return { success: true, count: formatted.length };
  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    throw error;
  }
}

/**
 * Obtiene productos desde el cache con filtros opcionales
 */
export async function getCachedProducts(filters?: {
  brand?: string;
  category?: string;
  sex?: string;
  search?: string;
}) {
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
  return await syncCatalogWithFullCategories();
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
    cacheActive: count > 0
  };
}

/**
 * Infiere el sexo del producto
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
