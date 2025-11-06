'use client';
import { useState } from 'react';
import { Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { calcularPrecioVenta, formatCurrency } from '@/lib/precios';
import ShareWhatsAppButton from './ShareWhatsAppButton';

interface Variant {
  id: number;
  sku: string;
  price: number;
  stock: number;
  talle: string;
  color: string;
}

interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  image: string;
  images?: string[];
  variants: Variant[];
}

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  userMargen: number;
  showCosts: boolean;
}

export default function ProductCard({ product, onClick, userMargen, showCosts }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Obtener todas las imágenes (priorizar images array, fallback a image)
  const allImages = product.images && product.images.length > 0
    ? product.images.filter(img => img && img !== '/placeholder.png')
    : (product.image && product.image !== '/placeholder.png' ? [product.image] : []);

  const hasMultipleImages = allImages.length > 1;
  const currentImage = allImages[currentImageIndex] || '/placeholder.png';

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const precioVenta = product.variants && product.variants.length > 0
    ? calcularPrecioVenta(product.variants[0].price, userMargen)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
      {/* Imagen con slider */}
      <div
        className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden relative group cursor-pointer"
        onClick={onClick}
      >
        {currentImage !== '/placeholder.png' ? (
          <>
            <img
              src={currentImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {/* Indicadores de múltiples fotos */}
            {hasMultipleImages && (
              <>
                {/* Botones de navegación */}
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-70"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-70"
                >
                  <ChevronRight size={20} />
                </button>

                {/* Puntos indicadores */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {allImages.map((_, index) => (
                    <div
                      key={index}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        index === currentImageIndex
                          ? 'bg-white w-4'
                          : 'bg-white bg-opacity-50'
                      }`}
                    />
                  ))}
                </div>

                {/* Badge contador de fotos */}
                <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
                  {currentImageIndex + 1}/{allImages.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Package size={48} />
          </div>
        )}
      </div>

      {/* Info del producto */}
      <div className="p-3">
        <p className="text-xs text-nadin-pink font-medium mb-1">{product.brand}</p>
        <h3
          className="font-semibold text-sm mb-2 line-clamp-2 min-h-[40px] cursor-pointer hover:text-nadin-pink"
          onClick={onClick}
        >
          {product.name}
        </h3>

        {product.variants && product.variants.length > 0 && (
          <>
            <p className="text-xs text-gray-600 mb-2">
              Stock: {product.variants.reduce((sum: number, v: any) => sum + v.stock, 0)} unidades
            </p>

            <div className="border-t pt-2 space-y-1 mb-3">
              <p className="text-lg font-bold text-nadin-pink">
                {formatCurrency(precioVenta)}
              </p>

              {showCosts && (
                <>
                  <p className="text-xs text-gray-600">
                    Costo: <span className="font-semibold">{formatCurrency(product.variants[0].price)}</span>
                  </p>
                  <p className="text-xs text-green-600">
                    Ganancia: <span className="font-semibold">
                      {formatCurrency(precioVenta - product.variants[0].price)}
                    </span>
                  </p>
                </>
              )}
            </div>

            {/* Botón WhatsApp */}
            <ShareWhatsAppButton
              product={product}
              precioVenta={precioVenta}
              className="w-full py-2"
            />
          </>
        )}
      </div>
    </div>
  );
}
