const TN_STORE_ID = process.env.TN_STORE_ID;
const TN_ACCESS_TOKEN = process.env.TN_ACCESS_TOKEN;
const TN_API_BASE = process.env.TN_API_BASE;
const TN_USER_AGENT = process.env.TN_USER_AGENT;

interface Product {
  id: number;
  name: { es: string };
  variants: Variant[];
  images: { src: string }[];
  brand?: string;
  categories?: { name: { es: string } }[];
  published: boolean;
}

interface Variant {
  id: number;
  product_id: number;
  price: string;
  stock: number;
  sku?: string;
  values?: { es: string }[];
}

async function fetchTN(endpoint: string, params: Record<string, string> = {}) {
  // Validar variables de entorno
  if (!TN_STORE_ID || !TN_ACCESS_TOKEN || !TN_API_BASE) {
    console.error('❌ Variables de entorno faltantes:', {
      TN_STORE_ID: !!TN_STORE_ID,
      TN_ACCESS_TOKEN: !!TN_ACCESS_TOKEN,
      TN_API_BASE: !!TN_API_BASE,
    });
    throw new Error('Configuración de Tiendanube incompleta');
  }

  const queryString = new URLSearchParams(params).toString();
  const url = `${TN_API_BASE}/${TN_STORE_ID}${endpoint}${queryString ? `?${queryString}` : ''}`;
  
  console.log('🌐 TN Request:', url);
  
  const response = await fetch(url, {
    headers: {
      'Authentication': `bearer ${TN_ACCESS_TOKEN}`,
      'User-Agent': TN_USER_AGENT || 'Nadin App',
      'Content-Type': 'application/json',
    },
    next: { revalidate: 0 } // No cachear en Next.js, lo manejamos nosotros
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ TN API Error: ${response.status} - ${url}`);
    console.error('Error details:', errorText);
    throw new Error(`TN API Error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json() as any;
  console.log(`✅ TN Response: ${Array.isArray(data) ? data.length : 'object'} items`);
  
  return data;
}

/**
 * Función auxiliar para reintentar una operación
 */
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  operationName: string = 'operación'
): Promise<T | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`❌ Error en ${operationName} (intento ${attempt}/${maxRetries}):`, error);
      
      if (attempt === maxRetries) {
        console.error(`❌ ${operationName} falló después de ${maxRetries} intentos`);
        return null;
      }
      
      // Esperar antes de reintentar (backoff exponencial)
      const waitTime = delayMs * attempt;
      console.log(`⏳ Reintentando en ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  return null;
}

/**
 * Obtiene TODOS los productos de Tiendanube con paginación automática
 * MEJORADO: Con retry logic, mejor logging y manejo de errores
 */
export async function getAllProducts(
  options: {
    sortBy?: string;
    onlyPublished?: boolean;
    maxPages?: number;
  } = {}
): Promise<Product[]> {
  const { sortBy, onlyPublished = true, maxPages = 100 } = options;
  
  let allProducts: Product[] = [];
  let page = 1;
  const perPage = 200; // Máximo permitido por Tiendanube
  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 3;

  console.log('\n🔄 ========================================');
  console.log('🔄 INICIANDO SINCRONIZACIÓN DE PRODUCTOS');
  console.log('🔄 ========================================');
  console.log(`📋 Configuración:`);
  console.log(`   - Solo publicados: ${onlyPublished}`);
  console.log(`   - Productos por página: ${perPage}`);
  console.log(`   - Máximo de páginas: ${maxPages}`);
  console.log(`   - Sort by: ${sortBy || 'default'}`);
  console.log('🔄 ========================================\n');

  while (page <= maxPages) {
    console.log(`\n📄 ========== PÁGINA ${page} ==========`);
    
    const params: Record<string, string> = {
      page: page.toString(),
      per_page: perPage.toString(),
    };

    if (onlyPublished) {
      params.published = 'true';
    }

    if (sortBy) {
      params.sort_by = sortBy;
    }

    // Intentar obtener productos de esta página con retry
    const products = await retryOperation(
      () => fetchTN('/products', params),
      3, // 3 intentos
      1000, // 1 segundo entre intentos
      `página ${page}`
    ) as any;

    if (!products) {
      consecutiveErrors++;
      console.error(`❌ Página ${page} falló después de reintentos`);
      
      if (consecutiveErrors >= maxConsecutiveErrors) {
        console.error(`\n❌ ========================================`);
        console.error(`❌ DETENIENDO: ${maxConsecutiveErrors} errores consecutivos`);
        console.error(`❌ ========================================\n`);
        break;
      }
      
      // Continuar con la siguiente página
      page++;
      continue;
    }

    // Reset contador de errores consecutivos
    consecutiveErrors = 0;

    if (products && products.length > 0) {
      allProducts = allProducts.concat(products);
      
      console.log(`✅ Página ${page} exitosa:`);
      console.log(`   - Productos en esta página: ${products.length}`);
      console.log(`   - Total acumulado: ${allProducts.length}`);
      
      // Mostrar algunos ejemplos de productos de esta página
      if (products.length > 0) {
        console.log(`   - Ejemplos de esta página:`);
        products.slice(0, 3).forEach((p: Product) => {
          console.log(`     • ID ${p.id}: "${p.name?.es || p.name}"`);
        });
      }
      
      // Si trajo menos de perPage, ya no hay más páginas
      if (products.length < perPage) {
        console.log(`\n✅ ========================================`);
        console.log(`✅ ÚLTIMA PÁGINA ALCANZADA (${products.length} < ${perPage})`);
        console.log(`✅ ========================================\n`);
        break;
      }
      
      page++;
      
      // Agregar delay entre páginas para no saturar la API
      // Delay más largo para ser más conservadores
      const delayMs = 500;
      console.log(`⏳ Esperando ${delayMs}ms antes de siguiente página...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
    } else {
      console.log(`⚠️ Página ${page} devolvió array vacío`);
      break;
    }
  }

  console.log(`\n🎉 ========================================`);
  console.log(`🎉 SINCRONIZACIÓN COMPLETA`);
  console.log(`🎉 ========================================`);
  console.log(`📊 Total de productos obtenidos: ${allProducts.length}`);
  console.log(`📄 Páginas procesadas: ${page - 1}`);
  console.log(`🎉 ========================================\n`);

  return allProducts;
}

/**
 * Obtiene los productos más vendidos de Tiendanube
 * MEJORADO: Con mejor manejo de errores y logging
 */
export async function getBestSellingProducts(limit: number = 50): Promise<Product[]> {
  try {
    console.log(`🔥 Solicitando ${limit} productos más vendidos...`);
    
    const limitCapped = Math.min(limit, 200); // Tiendanube máximo 200 por request
    
    const products = await fetchTN('/products', {
      per_page: limitCapped.toString(),
      published: 'true',
      sort_by: 'best-selling'
    });
    
    if (!products) {
      console.error('❌ La respuesta de TN está vacía');
      return [];
    }

    if (!Array.isArray(products)) {
      console.error('❌ La respuesta de TN no es un array:', typeof products);
      return [];
    }
    
    console.log(`✅ ${products.length} productos más vendidos obtenidos de Tiendanube`);
    
    // Si se pidieron más de 200, hacer múltiples requests
    if (limit > 200 && products.length === 200) {
      console.log(`🔄 Obteniendo más páginas (limit=${limit})...`);
      
      let page = 2;
      let allProducts = [...products];
      
      while (allProducts.length < limit && page <= 5) { // Máximo 5 páginas (1000 productos)
        const moreProducts = await fetchTN('/products', {
          per_page: '200',
          published: 'true',
          sort_by: 'best-selling',
          page: page.toString()
        });
        
        if (moreProducts && moreProducts.length > 0) {
          allProducts = allProducts.concat(moreProducts);
          console.log(`✔ Página ${page}: ${moreProducts.length} productos (Total: ${allProducts.length})`);
          
          if (moreProducts.length < 200) break;
          page++;
          
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          break;
        }
      }
      
      return allProducts.slice(0, limit);
    }
    
    return products;
  } catch (error) {
    console.error('❌ Error obteniendo productos más vendidos:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return [];
  }
}

/**
 * Obtiene un producto específico por ID
 */
export async function getProduct(id: string): Promise<Product> {
  const product = await fetchTN(`/products/${id}`);
  return product;
}

/**
 * Obtiene todas las categorías de Tiendanube
 * MEJORADO: Con retry logic y mejor manejo de errores
 */
export async function getCategories() {
  try {
    console.log('\n📂 ========================================');
    console.log('📂 OBTENIENDO CATEGORÍAS');
    console.log('📂 ========================================\n');
    
    let allCategories: any[] = [];
    let page = 1;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 3;

    while (page <= 20) { // Límite razonable de páginas
      console.log(`📄 Página ${page} de categorías...`);
      
      const categories = await retryOperation(
        () => fetchTN('/categories', {
          page: page.toString(),
          per_page: '200'
        }),
        3,
        1000,
        `categorías página ${page}`
      ) as any;

      if (!categories) {
        consecutiveErrors++;
        if (consecutiveErrors >= maxConsecutiveErrors) {
          console.error(`❌ Deteniendo obtención de categorías: ${maxConsecutiveErrors} errores consecutivos`);
          break;
        }
        page++;
        continue;
      }

      consecutiveErrors = 0;

      if (categories && categories.length > 0) {
        allCategories = allCategories.concat(categories);
        console.log(`✅ Página ${page}: ${categories.length} categorías (Total: ${allCategories.length})`);
        
        if (categories.length < 200) {
          console.log(`✅ Última página de categorías alcanzada`);
          break;
        }
        
        page++;
        await new Promise(resolve => setTimeout(resolve, 300));
      } else {
        break;
      }
    }

    console.log(`\n✅ ${allCategories.length} categorías obtenidas en total`);
    console.log('📂 ========================================\n');
    
    return allCategories;
  } catch (error) {
    console.error('❌ Error obteniendo categorías:', error);
    return [];
  }
}

/**
 * Formatea los productos para el frontend
 */
export function formatProductsForFrontend(products: Product[]) {
  if (!Array.isArray(products)) {
    console.error('❌ formatProductsForFrontend recibió algo que no es array:', typeof products);
    return [];
  }

  return products.map(product => {
    try {
      return {
        id: product.id,
        name: product.name?.es || 'Sin nombre',
        brand: product.brand || 'Sin marca',
        category: product.categories?.[0]?.name?.es || 'Sin categoría',
        image: product.images?.[0]?.src || '/placeholder.png',
        variants: (product.variants || []).map(variant => ({
          id: variant.id,
          sku: variant.sku || '',
          price: parseFloat(variant.price) || 0,
          stock: variant.stock || 0,
          talle: variant.values?.[1]?.es || '',  // ✅ CORREGIDO: [1] es talle
          color: variant.values?.[0]?.es || ''   // ✅ CORREGIDO: [0] es color
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
 * Verifica la configuración de Tiendanube
 */
export function checkTNConfig() {
  const config = {
    TN_STORE_ID: !!TN_STORE_ID,
    TN_ACCESS_TOKEN: !!TN_ACCESS_TOKEN,
    TN_API_BASE: !!TN_API_BASE,
    TN_USER_AGENT: !!TN_USER_AGENT,
  };
  
  console.log('🔧 Configuración de Tiendanube:', config);
  
  const allConfigured = Object.values(config).every(v => v === true);
  
  if (!allConfigured) {
    console.error('❌ Configuración incompleta de Tiendanube');
    console.error('Variables faltantes:', Object.entries(config).filter(([k, v]) => !v).map(([k]) => k));
  }
  
  return allConfigured;
}
