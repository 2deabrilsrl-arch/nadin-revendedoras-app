import { prisma } from './prisma';
import { getAllProducts, getCategories, getBestSellingProducts } from './tiendanube';

interface TiendanubeCategory {
  id: number;
  name: { es: string };
  parent: number | null;
}

/**
 * Construye el path completo de una categoría subiendo por parent
 */
function buildCategoryPath(
  categoryId: number,
  categoriesMap: Map<number, TiendanubeCategory>
): string {
  const path: string[] = [];
  let currentId: number | null = categoryId;
  const visited = new Set<number>();

  console.log(`  🔍 Construyendo path para categoría ID ${categoryId}:`);

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const category = categoriesMap.get(currentId);
    
    if (!category) {
      console.warn(`    ⚠️ Categoría ID ${currentId} no encontrada`);
      break;
    }

    console.log(`    → ID ${currentId}: "${category.name.es}" (parent: ${category.parent || 'null'})`);
    
    // Agregar al inicio del path
    path.unshift(category.name.es);
    
    // Subir al parent
    // En TN: parent=0 o parent=null significa raíz
    currentId = (category.parent && category.parent > 0) ? category.parent : null;
  }

  const result = path.join(' > ');
  console.log(`    ✅ Path final: "${result}"`);
  
  return result;
}

/**
 * Obtiene TODAS las categorías de TN y crea el mapa
 */
async function getCategoriesMap(): Promise<Map<number, TiendanubeCategory>> {
  console.log('\n📂 ========================================');
  console.log('📂 OBTENIENDO CATEGORÍAS DE TIENDANUBE');
  console.log('📂 ========================================\n');
  
  const categories = await getCategories();
  console.log(`✅ ${categories.length} categorías obtenidas de TN\n`);

  const map = new Map<number, TiendanubeCategory>();

  let nivel1 = 0; // parent = 0 o null
  let nivel2 = 0; // parent apunta a nivel1
  let nivel3 = 0; // parent apunta a nivel2

  categories.forEach((cat: any) => {
    // En TN: parent=0 o parent=null = categoría raíz
    const parentId = (cat.parent && cat.parent > 0) ? cat.parent : null;
    
    map.set(cat.id, {
      id: cat.id,
      name: cat.name || { es: 'Sin nombre' },
      parent: parentId
    });

    if (!parentId) {
      nivel1++;
    } else {
      // Verificar si el parent es nivel 1 o nivel 2
      const parentCat = categories.find((c: any) => c.id === parentId);
      if (parentCat) {
        if (!parentCat.parent || parentCat.parent === 0) {
          nivel2++;
        } else {
          nivel3++;
        }
      }
    }
  });

  console.log('📊 DISTRIBUCIÓN DE CATEGORÍAS:');
  console.log(`   Nivel 1 (raíz): ${nivel1}`);
  console.log(`   Nivel 2: ${nivel2}`);
  console.log(`   Nivel 3: ${nivel3}`);

  // Mostrar ejemplos de cada nivel
  console.log('\n🔍 EJEMPLOS DE CATEGORÍAS:\n');
  
  const ejemplosNivel1 = Array.from(map.values()).filter(c => !c.parent).slice(0, 3);
  console.log('Nivel 1 (raíz):');
  ejemplosNivel1.forEach(cat => {
    console.log(`  - ID ${cat.id}: "${cat.name.es}"`);
  });

  const ejemplosNivel2 = Array.from(map.values()).filter(c => c.parent && map.get(c.parent)?.parent === null).slice(0, 3);
  console.log('\nNivel 2:');
  ejemplosNivel2.forEach(cat => {
    const parentName = map.get(cat.parent!)?.name.es;
    console.log(`  - ID ${cat.id}: "${cat.name.es}" (parent: "${parentName}")`);
  });

  const ejemplosNivel3 = Array.from(map.values()).filter(c => {
    if (!c.parent) return false;
    const parent = map.get(c.parent);
    return parent && parent.parent && parent.parent > 0;
  }).slice(0, 3);
  console.log('\nNivel 3:');
  ejemplosNivel3.forEach(cat => {
    const parent = map.get(cat.parent!);
    const grandparent = parent ? map.get(parent.parent!) : null;
    console.log(`  - ID ${cat.id}: "${cat.name.es}" (parent: "${parent?.name.es}", grandparent: "${grandparent?.name.es}")`);
  });

  console.log('\n📂 ========================================\n');

  return map;
}

/**
 * Encuentra la categoría MÁS ESPECÍFICA (más profunda) de un producto
 */
function findDeepestCategory(
  productCategories: any[],
  categoriesMap: Map<number, TiendanubeCategory>
): number | null {
  let deepestId: number | null = null;
  let maxDepth = -1;

  for (const cat of productCategories) {
    if (!cat.id) continue;

    let depth = 0;
    let currentId: number | null = cat.id;
    const visited = new Set<number>();

    // Contar cuántos parents tiene
    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const category = categoriesMap.get(currentId);
      if (!category) break;
      
      depth++;
      currentId = (category.parent && category.parent > 0) ? category.parent : null;
    }

    if (depth > maxDepth) {
      maxDepth = depth;
      deepestId = cat.id;
    }
  }

  return deepestId;
}

/**
 * Formatea productos con jerarquía completa construida por parent
 */
export async function formatProductsWithFullCategories(products: any[]) {
  console.log('\n📄 ========================================');
  console.log('📄 FORMATEANDO PRODUCTOS');
  console.log('📄 ========================================');
  console.log(`📦 Total productos: ${products.length}\n`);

  // Obtener mapa de categorías
  const categoriesMap = await getCategoriesMap();

  const formatted = products.map((product, index) => {
    try {
      let categoryPath = 'Sin categoría';

      if (product.categories && product.categories.length > 0) {
        // Log detallado para los primeros 3 productos
        if (index < 3) {
          console.log(`\n📦 Producto ${index + 1}: "${product.name?.es || product.name}"`);
          console.log(`   ID: ${product.id}`);
          console.log(`   Categorías asignadas en TN: ${product.categories.length}`);
          product.categories.forEach((cat: any) => {
            console.log(`   - ID ${cat.id}: "${cat.name?.es}"`);
          });
        }

        // Encontrar la categoría más específica
        const deepestCategoryId = findDeepestCategory(product.categories, categoriesMap);

        if (deepestCategoryId) {
          if (index < 3) {
            console.log(`   🎯 Categoría más específica: ID ${deepestCategoryId}`);
          }

          // Construir path completo subiendo por parent
          categoryPath = buildCategoryPath(deepestCategoryId, categoriesMap);

          if (index < 3) {
            console.log(`   ✅ Path construido: "${categoryPath}"\n`);
          }
        }
      }

      return {
        id: product.id,
        name: product.name?.es || 'Sin nombre',
        brand: product.brand || 'Sin marca',
        category: categoryPath,
        image: product.images?.[0]?.src || '/placeholder.png',
        images: (product.images || [])
          .map((img: any) => img.src)
          .filter((src: string) => src && src !== '/placeholder.png'),
        variants: (product.variants || []).map((variant: any) => ({
          id: variant.id,
          sku: variant.sku || '',
          // Precio mayorista que paga la revendedora: si Nadin lo tiene en oferta en Tiendanube,
          // se usa el promocional (en toda la app y en las tiendas). listPrice = precio sin oferta.
          price: (() => {
            const lista = parseFloat(variant.price) || 0;
            const promo = parseFloat(variant.promotional_price) || 0;
            return promo > 0 && promo < lista ? promo : lista;
          })(),
          listPrice: parseFloat(variant.price) || 0,
          stock: variant.stock || 0,
          talle: variant.values?.[1]?.es || '',
          color: variant.values?.[0]?.es || ''
        })),
        published: product.published,
        // Tiendas Nadin: se guardan en columnas propias (no dentro de "data")
        _slug: product.handle?.es || null,
        _descripcion: product.description?.es || null
      };
    } catch (error) {
      console.error('❌ Error formateando producto:', product.id, error);
      return null;
    }
  }).filter(p => p !== null);

  // Diagnóstico de niveles
  const stats = {
    sinCategoria: 0,
    nivel1: 0,
    nivel2: 0,
    nivel3: 0,
    nivel4Plus: 0
  };

  formatted.forEach(p => {
    if (p.category === 'Sin categoría') {
      stats.sinCategoria++;
    } else {
      const niveles = p.category.split(' > ').length;
      if (niveles === 1) stats.nivel1++;
      else if (niveles === 2) stats.nivel2++;
      else if (niveles === 3) stats.nivel3++;
      else stats.nivel4Plus++;
    }
  });

  console.log('\n📊 ========================================');
  console.log('📊 DIAGNÓSTICO FINAL DE CATEGORÍAS');
  console.log('📊 ========================================');
  console.log(`   Sin categoría: ${stats.sinCategoria}`);
  console.log(`   Nivel 1: ${stats.nivel1}`);
  console.log(`   Nivel 2: ${stats.nivel2}`);
  console.log(`   Nivel 3: ${stats.nivel3}`);
  console.log(`   Nivel 4+: ${stats.nivel4Plus}`);

  // Mostrar ejemplos finales
  console.log('\n🔍 EJEMPLOS DE PRODUCTOS CATEGORIZADOS:\n');
  formatted.slice(0, 10).forEach(p => {
    console.log(`   - "${p.name}": "${p.category}"`);
  });

  console.log('\n📄 ========================================\n');

  return formatted;
}

/**
 * 🆕 NUEVO: Sincroniza los productos más vendidos de TN
 */
async function syncBestSellers() {
  try {
    console.log('\n🔥 ========================================');
    console.log('🔥 SINCRONIZANDO BEST SELLERS DE TN');
    console.log('🔥 ========================================\n');

    // Obtener los 200 productos más vendidos de TN
    const bestSellers = await getBestSellingProducts(200);
    
    if (!bestSellers || bestSellers.length === 0) {
      console.log('⚠️ No se obtuvieron best sellers de TN');
      return { success: false, count: 0 };
    }

    console.log(`📦 ${bestSellers.length} productos más vendidos obtenidos de TN\n`);

    // Primero, limpiar todos los rankings previos
    await prisma.catalogoCache.updateMany({
      data: {
        bestSellerRank: null
      }
    });
    console.log('✅ Rankings previos limpiados\n');

    // Actualizar el ranking de cada producto
    let updatedCount = 0;
    
    for (let i = 0; i < bestSellers.length; i++) {
      const product = bestSellers[i];
      const rank = i + 1; // Posición en el ranking (1 = más vendido)

      try {
        await prisma.catalogoCache.updateMany({
          where: {
            productId: product.id.toString()
          },
          data: {
            bestSellerRank: rank,
            salesCount: 200 - i // Mayor salesCount = más vendido (para backwards compatibility)
          }
        });
        
        updatedCount++;
        
        if (i < 10) {
          console.log(`  ${rank}° - ID ${product.id}: "${product.name?.es || product.name}"`);
        }
      } catch (error) {
        console.error(`❌ Error actualizando ranking de producto ${product.id}:`, error);
      }
    }

    console.log(`\n✅ ${updatedCount} productos actualizados con ranking`);
    console.log('🔥 ========================================\n');

    return { success: true, count: updatedCount };
  } catch (error) {
    console.error('❌ Error sincronizando best sellers:', error);
    return { success: false, count: 0 };
  }
}

/**
 * Sync rápido: solo los productos que cambiaron en Tiendanube en los últimos minutos
 * (stock, precio, fotos, publicado/oculto). Corre cada 2 minutos; el sync completo sigue cada 15.
 */
export async function syncCatalogIncremental(minutos = 10) {
  const desde = new Date(Date.now() - minutos * 60 * 1000).toISOString();
  const products = await getAllProducts({ onlyPublished: false, maxPages: 10, updatedSince: desde });
  if (!products.length) return { success: true, actualizados: 0, borrados: 0 };

  const publicados = products.filter((p: any) => p.published);
  const ocultos = products.filter((p: any) => !p.published).map((p: any) => String(p.id));

  const formatted = publicados.length ? await formatProductsWithFullCategories(publicados) : [];
  for (const { _slug, _descripcion, ...product } of formatted as any[]) {
    const datos = {
      data: JSON.stringify(product),
      slug: _slug,
      descripcion: _descripcion,
      brand: product.brand,
      category: product.category,
      sex: inferSex(product.category),
      updatedAt: new Date(),
    };
    // No se tocan salesCount ni bestSellerRank (los recalcula el sync completo)
    await prisma.catalogoCache.upsert({
      where: { productId: String(product.id) },
      update: datos,
      create: { productId: String(product.id), salesCount: 0, ...datos },
    });
  }
  const borrados = ocultos.length
    ? (await prisma.catalogoCache.deleteMany({ where: { productId: { in: ocultos } } })).count
    : 0;
  return { success: true, actualizados: formatted.length, borrados };
}

/**
 * Sincroniza el catálogo completo + best sellers
 */
export async function syncCatalogWithFullCategories() {
  try {
    console.log('\n📄 ========================================');
    console.log('📄 SINCRONIZACIÓN INICIADA');
    console.log('📄 ========================================');
    console.log(`⏰ Timestamp: ${new Date().toISOString()}\n`);

    // 1. Obtener productos de TN
    const products = await getAllProducts({
      onlyPublished: true,
      maxPages: 100
    });
    console.log(`\n📦 ${products.length} productos obtenidos de TN`);

    // 2. Formatear con jerarquía construida por parent
    const formatted = await formatProductsWithFullCategories(products);
    console.log(`✅ ${formatted.length} productos formateados`);

    // 3. El borrado va en la misma transacción que la carga (paso 5): el catálogo nunca queda vacío

    // 4. Preparar datos
    const dataToInsert = formatted.map(({ _slug, _descripcion, ...product }: any) => ({
      productId: product.id.toString(),
      data: JSON.stringify(product),
      slug: _slug,
      descripcion: _descripcion,
      brand: product.brand,
      category: product.category,
      sex: inferSex(product.category),
      salesCount: 0,
      bestSellerRank: null, // Se actualizará después
      updatedAt: new Date()
    }));

    // 5. Borrar y cargar en una sola transacción
    console.log(`\n💾 Guardando ${dataToInsert.length} productos...`);
    const batchSize = 100;
    const ops: any[] = [prisma.catalogoCache.deleteMany({})];
    for (let i = 0; i < dataToInsert.length; i += batchSize) {
      ops.push(prisma.catalogoCache.createMany({ data: dataToInsert.slice(i, i + batchSize), skipDuplicates: true }));
    }
    await prisma.$transaction(ops);
    const insertedCount = dataToInsert.length;

    // 6. 🆕 Sincronizar best sellers
    console.log('\n🔥 Sincronizando rankings de best sellers...');
    const bestSellersResult = await syncBestSellers();
    
    console.log('\n🎉 ========================================');
    console.log('🎉 SINCRONIZACIÓN COMPLETADA');
    console.log('🎉 ========================================');
    console.log(`📊 Total guardado: ${insertedCount} productos`);
    console.log(`🔥 Best sellers actualizados: ${bestSellersResult.count}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log('🎉 ========================================\n');

    return { success: true, count: insertedCount };
  } catch (error) {
    console.error('\n❌ Error en sincronización:', error);
    throw error;
  }
}

/**
 * Obtiene productos con filtros
 */
export async function getCachedProducts(filters?: {
  brand?: string;
  category?: string;
  sex?: string;
  search?: string;
}) {
  const where: any = {};
  
  if (filters?.brand) {
    where.brand = filters.brand;
  }
  
  if (filters?.sex) {
    where.sex = filters.sex;
  }

  // Filtro de categoría: usa OR al nivel where (no dentro del campo)
  if (filters?.category) {
    // Crear un array de condiciones
    const conditions: any[] = [];
    
    // Condición base (otros filtros)
    const baseCondition: any = {};
    if (filters.brand) baseCondition.brand = filters.brand;
    if (filters.sex) baseCondition.sex = filters.sex;
    
    // Agregar condiciones de categoría con OR
    conditions.push({
      ...baseCondition,
      category: { equals: filters.category }
    });
    
    conditions.push({
      ...baseCondition,
      category: { startsWith: `${filters.category} > ` }
    });
    
    // Usar OR al nivel where
    const cached = await prisma.catalogoCache.findMany({
      where: {
        OR: conditions
      },
      orderBy: [
        { salesCount: 'desc' },
        { updatedAt: 'desc' }
      ]
    });
    
    let products = cached.map(item => JSON.parse(item.data));

    // Búsqueda por texto
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

  // Si no hay filtro de categoría, usar where normal
  const cached = await prisma.catalogoCache.findMany({
    where,
    orderBy: [
      { salesCount: 'desc' },
      { updatedAt: 'desc' }
    ]
  });

  let products = cached.map(item => JSON.parse(item.data));

  // Búsqueda por texto
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
 * 🆕 NUEVO: Obtiene los productos más vendidos desde el cache
 */
export async function getCachedBestSellers(limit: number = 50) {
  const cached = await prisma.catalogoCache.findMany({
    where: {
      bestSellerRank: {
        not: null
      }
    },
    orderBy: {
      bestSellerRank: 'asc' // Menor número = mejor ranking
    },
    take: limit
  });

  return cached.map(item => JSON.parse(item.data));
}

/**
 * Fuerza sincronización manual
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

  const bestSellersCount = await prisma.catalogoCache.count({
    where: {
      bestSellerRank: {
        not: null
      }
    }
  });

  return {
    totalProducts: count,
    bestSellersCount,
    lastUpdate: lastUpdate?.updatedAt,
    cacheActive: count > 0
  };
}

/**
 * Infiere el sexo del producto solo por categoría
 */
function inferSex(category: string): string {
  const text = category.toLowerCase();

  if (text.includes('mujer') || text.includes('dama')) {
    return 'Mujer';
  }
  if (text.includes('hombre') || text.includes('masculin')) {
    return 'Hombre';
  }
  if (text.includes('niño') || text.includes('niña') || text.includes('kid')) {
    return 'Niños';
  }

  return 'Unisex';
}
