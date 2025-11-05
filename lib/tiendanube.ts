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
  
  const data = await response.json();
  console.log(`✅ TN Response: ${Array.isArray(data) ? data.length : 'object'} items`);
  
  return data;
}

/**
 * Obtiene TODOS los productos de Tiendanube con paginación automática
 */
export async function getAllProducts(sortBy?: string): Promise<Product[]> {
  let allProducts: Product[] = [];
  let page = 1;
  const perPage = 200; // Máximo permitido por Tiendanube
  let hasMore = true;

  console.log('🔄 Sincronizando productos desde Tiendanube...');

  while (hasMore) {
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        per_page: perPage.toString(),
        published: 'true' // Solo productos publicados
      };

      if (sortBy) {
        params.sort_by = sortBy;
      }

      const products = await fetchTN('/products', params);

      if (products && products.length > 0) {
        allProducts = allProducts.concat(products);
        console.log(`✓ Página ${page}: ${products.length} productos (Total: ${allProducts.length})`);
        
        // Si trajo menos de perPage, ya no hay más páginas
        if (products.length < perPage) {
          hasMore = false;
        } else {
          page++;
          
          // Agregar delay entre páginas para no saturar la API
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.error(`❌ Error en página ${page}:`, error);
      hasMore = false;
    }
  }

  console.log(`✅ Sincronización completa: ${allProducts.length} productos obtenidos`);
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
          console.log(`✓ Página ${page}: ${moreProducts.length} productos (Total: ${allProducts.length})`);
          
          if (moreProducts.length < 200) break;
          page++;
          
          await new Promise(resolve => setTimeout(resolve, 100));
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
 */
export async function getCategories() {
  try {
    let allCategories: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const categories = await fetchTN('/categories', {
        page: page.toString(),
        per_page: '200'
      });

      if (categories && categories.length > 0) {
        allCategories = allCategories.concat(categories);
        
        if (categories.length < 200) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }

    console.log(`✅ ${allCategories.length} categorías obtenidas`);
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
