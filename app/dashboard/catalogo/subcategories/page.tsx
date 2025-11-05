'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package } from 'lucide-react';
import BackToHomeButton from '@/components/BackToHomeButton';

interface CategoryLevel {
  name: string;
  count: number;
}

function CategorySubcategoriesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const category = searchParams.get('category') || '';
  
  const [subcategories, setSubcategories] = useState<CategoryLevel[]>([]);
  const [productTypes, setProductTypes] = useState<Map<string, CategoryLevel[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    if (category) {
      loadCategoryStructure();
    }
  }, [category]);

  const loadCategoryStructure = async () => {
    try {
      setLoading(true);
      
      // Obtener todos los productos de esta categoría
      const res = await fetch(`/api/catalogo?category=${encodeURIComponent(category)}`);
      const products = await res.json();
      
      setTotalProducts(products.length);

      // Extraer subcategorías únicas
      const subcatMap = new Map<string, number>();
      const typeMap = new Map<string, Map<string, number>>();

      products.forEach((product: any) => {
        if (product.category) {
          const parts = product.category.split(' > ').map((p: string) => p.trim());
          
          // Nivel 2: Subcategoría
          if (parts[1]) {
            const subcat = parts[1];
            subcatMap.set(subcat, (subcatMap.get(subcat) || 0) + 1);
            
            // Nivel 3: Tipo de producto (asociado a subcategoría)
            if (parts[2]) {
              if (!typeMap.has(subcat)) {
                typeMap.set(subcat, new Map());
              }
              const types = typeMap.get(subcat)!;
              types.set(parts[2], (types.get(parts[2]) || 0) + 1);
            }
          }
        }
      });

      // Convertir a arrays ordenados
      const subcatsArray = Array.from(subcatMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name));
      
      setSubcategories(subcatsArray);

      // Convertir tipos a mapa
      const typesMap = new Map<string, CategoryLevel[]>();
      typeMap.forEach((types, subcat) => {
        const typesArray = Array.from(types.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => a.name.localeCompare(b.name));
        typesMap.set(subcat, typesArray);
      });
      
      setProductTypes(typesMap);

    } catch (error) {
      console.error('Error cargando estructura de categorías:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToProducts = (subcategory?: string, productType?: string) => {
    const params = new URLSearchParams();
    params.set('category', category);
    if (subcategory) params.set('subcategory', subcategory);
    if (productType) params.set('productType', productType);
    
    router.push(`/dashboard/catalogo/productos?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <BackToHomeButton />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-nadin-pink"></div>
            <p className="mt-4 text-gray-600">Cargando categorías...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <BackToHomeButton />
      
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-nadin-pink mb-4"
        >
          <ArrowLeft size={20} />
          Volver a categorías
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900">{category}</h1>
        <p className="text-gray-600 mt-2">{totalProducts} productos en total</p>
      </div>

      {/* Botón Ver Todo */}
      <div className="mb-8">
        <button
          onClick={() => goToProducts()}
          className="w-full bg-nadin-pink text-white py-4 rounded-lg font-semibold hover:bg-nadin-pink-dark transition-colors flex items-center justify-center gap-2"
        >
          <Package size={24} />
          Ver Todos los productos de {category}
        </button>
      </div>

      {/* Subcategorías */}
      {subcategories.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Seleccioná una subcategoría
          </h2>
          
          <div className="space-y-4">
            {subcategories.map((subcat) => (
              <div key={subcat.name} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Subcategoría */}
                <button
                  onClick={() => goToProducts(subcat.name)}
                  className="w-full p-4 flex justify-between items-center hover:bg-gray-50 transition-colors border-b border-gray-200"
                >
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">{subcat.name}</h3>
                    <p className="text-sm text-gray-600">{subcat.count} productos</p>
                  </div>
                  <div className="text-nadin-pink">→</div>
                </button>

                {/* Tipos de producto dentro de la subcategoría */}
                {productTypes.has(subcat.name) && productTypes.get(subcat.name)!.length > 0 && (
                  <div className="bg-gray-50 p-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      Tipos en {subcat.name}:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {productTypes.get(subcat.name)!.map((type) => (
                        <button
                          key={type.name}
                          onClick={() => goToProducts(subcat.name, type.name)}
                          className="text-left px-3 py-2 bg-white rounded hover:bg-nadin-pink hover:text-white transition-colors text-sm"
                        >
                          <span className="font-medium">{type.name}</span>
                          <span className="text-gray-500 ml-2">({type.count})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {subcategories.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Package size={48} className="mx-auto mb-3 opacity-50" />
          <p className="text-lg">No hay subcategorías en esta categoría</p>
          <button
            onClick={() => goToProducts()}
            className="mt-4 text-nadin-pink hover:underline"
          >
            Ver todos los productos de {category}
          </button>
        </div>
      )}
    </div>
  );
}

export default function CategorySubcategoriesPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto p-4">
        <BackToHomeButton />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-nadin-pink"></div>
            <p className="mt-4 text-gray-600">Cargando categorías...</p>
          </div>
        </div>
      </div>
    }>
      <CategorySubcategoriesContent />
    </Suspense>
  );
}
