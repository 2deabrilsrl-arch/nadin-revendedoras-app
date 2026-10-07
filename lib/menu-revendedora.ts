// lib/menu-revendedora.ts
// Menú único de la app de revendedoras: todo gira alrededor de "Mi Tienda".
// Cada ítem tiene su guía de ayuda (ver lib/ayuda.json).

import {
  Home, ShoppingBag, Users, BarChart3, Palette, Package, FileText, Tag, CreditCard, Truck, Store,
  ShoppingCart, ClipboardList, PackageCheck, MessageCircle, User, Bell, HelpCircle,
} from 'lucide-react';

export interface ItemMenu {
  id: string;        // id de la guía de ayuda
  label: string;
  href: string;
  icon: any;
  tab?: string;      // si es una sección de Mi Tienda
}

export interface GrupoMenu {
  titulo: string;
  items: ItemMenu[];
}

const mt = (tab: string) => `/dashboard/mi-tienda?tab=${tab}`;

export const MENU: GrupoMenu[] = [
  { titulo: '', items: [
    { id: 'inicio', label: 'Inicio', href: mt('inicio'), icon: Home, tab: 'inicio' },
  ] },
  { titulo: 'Ventas', items: [
    { id: 'pedidos', label: 'Pedidos web', href: mt('pedidos'), icon: ShoppingBag, tab: 'pedidos' },
    { id: 'clientes', label: 'Clientes', href: mt('clientes'), icon: Users, tab: 'clientes' },
    { id: 'estadisticas', label: 'Estadísticas', href: mt('estadisticas'), icon: BarChart3, tab: 'estadisticas' },
  ] },
  { titulo: 'Mi tienda', items: [
    { id: 'diseno', label: 'Diseño', href: mt('portada'), icon: Palette, tab: 'portada' },
    { id: 'productos', label: 'Productos', href: mt('productos'), icon: Package, tab: 'productos' },
    { id: 'paginas', label: 'Páginas', href: mt('paginas'), icon: FileText, tab: 'paginas' },
    { id: 'promos', label: 'Promos y cupones', href: mt('cupones'), icon: Tag, tab: 'cupones' },
  ] },
  { titulo: 'Comprar a Nadin', items: [
    { id: 'catalogo', label: 'Catálogo Nadin', href: '/dashboard/catalogo', icon: ShoppingCart },
    { id: 'mis-pedidos', label: 'Mis pedidos a Nadin', href: '/dashboard/pedidos', icon: ClipboardList },
    { id: 'consolidar', label: 'Consolidar envío', href: '/dashboard/consolidar', icon: PackageCheck },
    { id: 'chat', label: 'Chat con Nadin', href: '/dashboard/chat', icon: MessageCircle },
  ] },
  { titulo: 'Configuración', items: [
    { id: 'cobros', label: 'Cobros', href: mt('pagos'), icon: CreditCard, tab: 'pagos' },
    { id: 'entregas', label: 'Entregas', href: mt('envios'), icon: Truck, tab: 'envios' },
    { id: 'marca', label: 'Marca, datos y dominio', href: mt('diseno'), icon: Store, tab: 'diseno' },
    { id: 'perfil', label: 'Mi perfil', href: '/dashboard/perfil', icon: User },
    { id: 'notificaciones', label: 'Notificaciones', href: '/dashboard/notificaciones', icon: Bell },
  ] },
  { titulo: 'Ayuda', items: [
    { id: 'ayuda', label: 'Guías y tutoriales', href: '/dashboard/ayuda', icon: HelpCircle },
  ] },
];

export const ITEMS_MENU: ItemMenu[] = MENU.flatMap((g) => g.items);

/** Ítem del menú que corresponde a la pantalla actual. */
export function itemActual(pathname: string, tab: string | null): ItemMenu | null {
  if (pathname.startsWith('/dashboard/mi-tienda/')) return ITEMS_MENU.find((i) => i.tab === 'portada') || null; // editor
  if (pathname === '/dashboard/mi-tienda') {
    const t = tab || 'inicio';
    return ITEMS_MENU.find((i) => i.tab === t) || ITEMS_MENU[0];
  }
  // Rutas internas del flujo de compra a Nadin
  if (pathname.startsWith('/dashboard/nuevo-pedido') || pathname.startsWith('/dashboard/catalogo')) return ITEMS_MENU.find((i) => i.id === 'catalogo') || null;
  if (pathname.startsWith('/dashboard/chat-consolidacion')) return ITEMS_MENU.find((i) => i.id === 'consolidar') || null;
  return ITEMS_MENU.filter((i) => !i.tab).find((i) => pathname.startsWith(i.href)) || null;
}
