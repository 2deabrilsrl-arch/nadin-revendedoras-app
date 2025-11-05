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
  let depth = 0;
  
  while (currentId && currentId > 0 && !visited.has(currentId) && depth < 10) {
    visited.add(currentId);
    const category = categoriesMap.get(currentId);
    
    if (!category) {
      console.warn(`⚠️ Categoría ID ${currentId} no encontrada en el mapa`);
      break;
    }
    
    path.unshift(category.name.es);
    // En TN, parent=0 significa "sin parent"
    currentId = (category.parent && category.parent > 0) ? category.parent : null;
    depth++;
  }
  
  return path.join(' > ');
}

/**
 * Obtiene todas las categorías y crea un mapa para búsqueda rápida
 */
async function getCategoriesMap(): Promise<Map<number, TiendanubeCategory>> {
  console.log('📂 Obteniendo categorías de TN...');
  const categories = await getCategories();
  console.log(`✅ ${categories.length} categorías obtenidas de TN`);
  
  const map = new Map<number, TiendanubeCategory>();
  
  let conParent = 0;
  let sinParent = 0;
  
  categories.forEach((cat: any) => {
    // En TN, parent=0 significa "sin parent" (categoría raíz)
    const hasParent = cat.parent && cat.parent > 0;
    if (hasParent) conParent++;
    else sinParent++;
    
    map.set(cat.id, {
      id: cat.id,
      name: cat.name || { es: 'Sin nombre' },
      parent: (cat.parent && cat.parent > 0) ? cat.parent : null,
      subcategories: cat.subcategories || []
    });
  });
  
  console.log(`📊 Categorías CON parent: ${conParent}`);
  console.log(`📊 Categorías SIN parent (nivel raíz): ${sinParent}`);
  
  // Mostrar ejemplos de categorías con parent
  if (conParent > 0) {
    console.log('📝 Ejemplos de categorías con parent:');
    const ejemplosConParent = Array.from(map.values())
      .filter(c => c.parent)
      .slice(0, 3);
    ejemplosConParent.forEach(cat => {
      const parentCat = map.get(cat.parent!);
      console.log(`  - "${cat.name.es}" (ID: ${cat.id}) → parent: "${parentCat?.name.es || 'desconocido'}" (ID: ${cat.parent})`);
    });
  }
  
  // Mostrar ejemplos de categorías raíz
  if (sinParent > 0) {
    console.log('📝 Ejemplos de categorías raíz (sin parent):');
    const ejemplosSinParent = Array.from(map.values())
      .filter(c => !c.parent)
      .slice(0, 3);
    ejemplosSinParent.forEach(cat => {
      console.log(`  - "${cat.name.es}" (ID: ${cat.id})`);
    });
  }
  
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
  
  // Contadores para diagnóstico
  let sinCategoria = 0;
  let nivel1 = 0;
  let nivel2 = 0;
  let nivel3 = 0;
  let nivel4Plus = 0;
  
  const formatted = products.map(product => {
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
      
      // Contar niveles para diagnóstico
      if (fullCategoryPath === 'Sin categoría') {
        sinCategoria++;
      } else {
        const niveles = fullCategoryPath.split(' > ').length;
        if (niveles === 1) nivel1++;
        else if (niveles === 2) nivel2++;
        else if (niveles === 3) nivel3++;
        else nivel4Plus++;
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
  
  // Mostrar diagnóstico
  console.log('\n📊 DIAGNÓSTICO DE CATEGORÍAS CONSTRUIDAS:');
  console.log(`  Sin categoría: ${sinCategoria}`);
  console.log(`  Nivel 1 solo: ${nivel1}`);
  console.log(`  Nivel 2: ${nivel2}`);
  console.log(`  Nivel 3: ${nivel3}`);
  console.log(`  Nivel 4+: ${nivel4Plus}`);
  
  // Mostrar ejemplos
  console.log('\n📝 Ejemplos de categorías construidas:');
  formatted.slice(0, 5).forEach(p => {
    console.log(`  - "${p.name}": "${p.category}"`);
  });
  
  // ALERTA si todos están en nivel 1
  if (nivel1 > 0 && nivel2 === 0 && nivel3 === 0) {
    console.warn('\n⚠️  ¡ALERTA! Todos los productos tienen solo 1 nivel de categoría.');
    console.warn('⚠️  Esto significa que las categorías en Tiendanube NO tienen parent configurado.');
    console.warn('⚠️  O los productos solo están asignados a categorías raíz sin subcategorías.');
  }
  
  return formatted;
}

/**
 * Sincroniza el catálogo con jerarquía completa de categorías
 */
export async function syncCatalogWithFullCategories() {
  try {
    console.log('🔄 Iniciando sincronización con jerarquía completa...');
    console.log('⏰ Timestamp:', new Date().toISOString());
    
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
    console.log('⏰ Finalizado:', new Date().toISOString());
    
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
