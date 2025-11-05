'use client';
import { MessageCircle } from 'lucide-react';

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
  variants: Variant[];
}

interface ShareWhatsAppButtonProps {
  product: Product;
  precioVenta: number;
  className?: string;
}

export default function ShareWhatsAppButton({ product, precioVenta, className = '' }: ShareWhatsAppButtonProps) {
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que abra el modal del producto

    // Extraer talles y colores únicos
    const tallesUnicos = [...new Set(product.variants.map(v => v.talle).filter(Boolean))].sort();
    const coloresUnicos = [...new Set(product.variants.map(v => v.color).filter(Boolean))].sort();

    // Formatear precio
    const precioFormateado = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(precioVenta);

    // Construir mensaje de WhatsApp
    let mensaje = `✨ *${product.name}*\n\n`;
    mensaje += `🏷️ ${product.brand}\n\n`;
    mensaje += `💰 Precio: *${precioFormateado}*\n\n`;
    
    if (tallesUnicos.length > 0) {
      mensaje += `📏 Talles disponibles: ${tallesUnicos.join(', ')}\n`;
    }
    
    if (coloresUnicos.length > 0) {
      mensaje += `🎨 Colores: ${coloresUnicos.join(', ')}\n`;
    }
    
    mensaje += `\n📸 Ver foto: ${product.image}\n\n`;
    mensaje += `¿Te interesa? ¡Consultame! 💕`;

    // Codificar mensaje para URL
    const mensajeCodificado = encodeURIComponent(mensaje);
    
    // Abrir WhatsApp
    const urlWhatsApp = `https://wa.me/?text=${mensajeCodificado}`;
    window.open(urlWhatsApp, '_blank');
  };

  return (
    <button
      onClick={handleShare}
      className={`flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors ${className}`}
      title="Compartir por WhatsApp"
    >
      <MessageCircle size={18} />
      <span className="text-sm font-medium">Compartir</span>
    </button>
  );
}
