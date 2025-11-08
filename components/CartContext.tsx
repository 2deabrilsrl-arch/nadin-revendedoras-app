'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  productId: number;
  variantId: number;
  sku: string;
  brand: string;
  name: string;
  talle: string;
  color: string;
  qty: number;
  mayorista: number;
  venta: number;
  image: string;
  descuento?: number; // DEPRECATED: usar descuentoPesos
  descuentoPesos?: number; // Descuento individual en pesos
  descuentoPorcentaje?: number; // Descuento individual en porcentaje
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (variantId: number) => void;
  updateQuantity: (variantId: number, qty: number) => void;
  updateDiscount: (variantId: number, descuento: number) => void; // DEPRECATED pero mantenido para compatibilidad
  updateDescuentoPesos: (variantId: number, descuento: number) => void;
  updateDescuentoPorcentaje: (variantId: number, porcentaje: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalMayorista: () => number;
  getTotalVenta: () => number;
  getTotalDescuentos: () => number;
  getTotalFinal: () => number;
  getGananciaEstimada: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'nadin_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar carrito desde localStorage al montar
  useEffect(() => {
    try {
      const savedCart = (globalThis as any).localStorage?.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error cargando carrito:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Guardar carrito en localStorage cada vez que cambie
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      } catch (error) {
        console.error('Error guardando carrito:', error);
      }
    }
  }, [cart, isLoaded]);

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      // Buscar si ya existe el mismo producto con mismo talle y color
      const existingIndex = prev.findIndex(i => i.variantId === item.variantId);
      
      if (existingIndex !== -1) {
        // Si existe, sumar cantidad
        const newCart = [...prev];
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          qty: newCart[existingIndex].qty + item.qty
        };
        return newCart;
      } else {
        // Si no existe, agregar nuevo
        return [...prev, item];
      }
    });
  };

  const removeFromCart = (variantId: number) => {
    setCart(prev => prev.filter(item => item.variantId !== variantId));
  };

  const updateQuantity = (variantId: number, qty: number) => {
    if (qty <= 0) {
      removeFromCart(variantId);
      return;
    }
    
    setCart(prev => 
      prev.map(item => 
        item.variantId === variantId 
          ? { ...item, qty: Math.max(1, qty) }
          : item
      )
    );
  };

  // DEPRECATED: Mantenido para compatibilidad con código viejo
  const updateDiscount = (variantId: number, descuento: number) => {
    setCart(prev =>
      prev.map(item =>
        item.variantId === variantId
          ? { 
              ...item, 
              descuento: Math.max(0, descuento),
              descuentoPesos: Math.max(0, descuento),
              descuentoPorcentaje: undefined
            }
          : item
      )
    );
  };

  const updateDescuentoPesos = (variantId: number, descuento: number) => {
    setCart(prev =>
      prev.map(item =>
        item.variantId === variantId
          ? { 
              ...item, 
              descuento: Math.max(0, descuento), // Mantener para compatibilidad
              descuentoPesos: Math.max(0, descuento),
              descuentoPorcentaje: undefined // Limpiar descuento por %
            }
          : item
      )
    );
  };

  const updateDescuentoPorcentaje = (variantId: number, porcentaje: number) => {
    setCart(prev =>
      prev.map(item =>
        item.variantId === variantId
          ? { 
              ...item, 
              descuento: undefined, // Limpiar descuento viejo
              descuentoPorcentaje: Math.max(0, Math.min(100, porcentaje)),
              descuentoPesos: undefined // Limpiar descuento en pesos
            }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  };

  const getTotalMayorista = () => {
    return cart.reduce((sum, item) => sum + (item.mayorista * item.qty), 0);
  };

  const getTotalVenta = () => {
    return cart.reduce((sum, item) => sum + (item.venta * item.qty), 0);
  };

  const getTotalDescuentos = () => {
    return cart.reduce((sum, item) => {
      const subtotal = item.venta * item.qty;
      
      // Descuento por porcentaje tiene prioridad
      if (item.descuentoPorcentaje && item.descuentoPorcentaje > 0) {
        return sum + (subtotal * item.descuentoPorcentaje / 100);
      }
      
      // Descuento en pesos (nuevo y viejo)
      const descuentoPesos = item.descuentoPesos || item.descuento || 0;
      if (descuentoPesos > 0) {
        return sum + (descuentoPesos * item.qty);
      }
      
      return sum;
    }, 0);
  };

  const getTotalFinal = () => {
    return getTotalVenta() - getTotalDescuentos();
  };

  const getGananciaEstimada = () => {
    return getTotalFinal() - getTotalMayorista();
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateDiscount, // Mantenido para compatibilidad
        updateDescuentoPesos,
        updateDescuentoPorcentaje,
        clearCart,
        getTotalItems,
        getTotalMayorista,
        getTotalVenta,
        getTotalDescuentos,
        getTotalFinal,
        getGananciaEstimada,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
}
