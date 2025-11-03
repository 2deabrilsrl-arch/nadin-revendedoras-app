const TN_STORE_ID = process.env.TN_STORE_ID;
const TN_ACCESS_TOKEN = process.env.TN_ACCESS_TOKEN;
const TN_API_BASE = process.env.TN_API_BASE;
const TN_USER_AGENT = process.env.TN_USER_AGENT;

interface Product {
  id: string;
  name: { es: string };
  variants: Variant[];
  images: { src: string }[];
  brand?: string;
  categories?: { name: { es: string } }[];
}

interface Variant {
  id: string;
  product_id: string;
  price: string;
  stock: number;
  sku?: string;
  values?: { es: string }[];
}

async function fetchTN(endpoint: string) {
  const response = await fetch(`${TN_API_BASE}/${TN_STORE_ID}${endpoint}`, {
    headers: {
      'Authentication': `bearer ${TN_ACCESS_TOKEN}`,
      'User-Agent': TN_USER_AGENT || '',
      'Content-Type': 'application/json',
    },
    next: { revalidate: 900 }
  });
  if (!response.ok) throw new Error(`TN API Error: ${response.status}`);
  return response.json();
}

export async function getProducts() {
  const products = await fetchTN('/products');
  return products;
}

export async function getProduct(id: string) {
  const product = await fetchTN(`/products/${id}`);
  return product;
}
