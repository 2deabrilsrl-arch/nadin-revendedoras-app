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
  const queryString = new URLSearchParams(params).toString();
  const url = `${TN_API_BASE}/${TN_STORE_ID}${endpoint}${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    headers: {
      'Authentication': `bearer ${TN_ACCESS_TOKEN}`,
      'User-Agent': TN_USER_AGENT || '',
      'Content-Type': 'application/json',
    },
    next: { revalidate: 0 } // No cachear en Next.js, lo manejamos nosotros
  });
  
  if (!response.ok) {
    console.error(`TN API Error: ${response.status} - ${url}`);
    throw new Error(`TN API Error: ${response.status}`);
  }
  
  return response.json();
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
      console.error(`Error en página ${page}:`, error);
      hasMore = false;
    }
  }

  console.log(`✅ Sincronización completa: ${allProducts.length} productos obtenidos`);
  return allProducts;
}

/**
 * Obtiene los productos más vendidos de Tiendanube
 */
export async function getBestSellingProducts(limit: number = 50): Promise<Product[]> {
  try {
    const products = await fetchTN('/products', {
      per_page: limit.toString(),
      published: 'true',
      sort_by: 'best-selling'
    });
    
    console.log(`✅ ${products.length} productos más vendidos obtenidos`);
    return products;
  } catch (error) {
    console.error('Error obteniendo productos más vendidos:', error);
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
    console.error('Error obteniendo categorías:', error);
    return [];
  }
}

/**
 * Formatea los productos para el frontend
 */
export function formatProductsForFrontend(products: Product[]) {
  return products.map(product => ({
    id: product.id,
    name: product.name.es,
    brand: product.brand || 'Sin marca',
    category: product.categories?.[0]?.name?.es || 'Sin categoría',
    image: product.images?.[0]?.src || '/placeholder.png',
    variants: product.variants.map(variant => ({
      id: variant.id,
      sku: variant.sku || '',
      price: parseFloat(variant.price),
      stock: variant.stock,
      talle: variant.values?.[0]?.es || '',
      color: variant.values?.[1]?.es || ''
    })),
    published: product.published
  }));
}
