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
export async function getAllProducts(): Promise<Product[]> {
  let allProducts: Product[] = [];
  let page = 1;
  const perPage = 200; // Máximo permitido por Tiendanube
  let hasMore = true;

  console.log('🔄 Sincronizando productos desde Tiendanube...');

  while (hasMore) {
    try {
      const products = await fetchTN('/products', {
        page: page.toString(),
        per_page: perPage.toString(),
        published: 'true' // Solo productos publicados
      });

      if (products && products.length > 0) {
        allProducts = allProducts.concat(products);
        console.log(`✓ Página ${page}: ${products.length} productos (Total: ${allProducts.length})`);
        
        // Si trajo menos de perPage, ya no hay más páginas
        if (products.length < perPage) {
          hasMore = false;
        } else {
          page++;
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
 * Obtiene un producto específico por ID
 */
export async function getProduct(id: string): Promise<Product> {
  const product = await fetchTN(`/products/${id}`);
  return product;
}

/**
 * Obtiene productos desde el caché o sincroniza si es necesario
 * Esta función se usará en la API del catálogo
 */
export async function getProducts() {
  // Por ahora retornamos todos los productos directamente
  // En el siguiente paso implementaremos el cache
  return getAllProducts();
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
