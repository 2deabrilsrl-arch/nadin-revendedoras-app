// types/gamification.ts
// 🎮 Tipos para el sistema de gamificación

export type BadgeCategory = 'ventas' | 'constancia' | 'especial' | 'tiempo' | 'logros';
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type UserLevel = 
  | 'bronce'    // 0-10 ventas
  | 'plata'     // 11-25 ventas
  | 'oro'       // 26-50 ventas
  | 'platino'   // 51-100 ventas
  | 'diamante'  // 101-200 ventas
  | 'leyenda';  // 201+ ventas

export interface LevelConfig {
  name: UserLevel;
  displayName: string;
  minSales: number;
  maxSales: number;
  color: string;
  icon: string;
  benefits: string[];
}

export interface BadgeDefinition {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  condition: BadgeCondition;
  points: number;
  rarity: BadgeRarity;
}

export interface BadgeCondition {
  type: 
    | 'sales_count'        // Cantidad de ventas
    | 'sales_amount'       // Monto total vendido
    | 'consecutive_days'   // Días consecutivos con ventas
    | 'time_sale'          // Venta en horario específico
    | 'weekend_sale'       // Venta en fin de semana
    | 'client_vip'         // Venta a cliente VIP
    | 'unique_products'    // Productos únicos vendidos
    | 'shares'             // Compartidos en WhatsApp
    | 'bestseller'         // Vendió producto top 3
    | 'marathon'           // Múltiples pedidos en un día
    | 'monthly_top'        // Top del mes
    | 'yearly_top';        // Top del año
  
  value: number; // Valor objetivo
  comparator?: 'gte' | 'lte' | 'eq'; // Mayor/menor/igual
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
}

export interface UserBadgeWithDetails {
  id: string;
  userId: string;
  badgeId: string;
  unlockedAt: Date;
  badge: {
    slug: string;
    name: string;
    description: string;
    icon: string;
    category: BadgeCategory;
    points: number;
    rarity: BadgeRarity;
  };
}

export interface UserStats {
  totalSales: number;
  totalAmount: number;
  totalPoints: number;
  currentLevel: UserLevel;
  currentXP: number;
  nextLevelXP: number;
  progressPercent: number;
  badgesCount: number;
  rankingPosition: number;
}

export interface RankingEntry {
  position: number;
  userId: string;
  userName: string;
  userHandle: string;
  value: number;
  change: number; // Cambio de posición respecto al mes anterior
}

export interface PointTransaction {
  id: string;
  amount: number;
  reason: string;
  description?: string;
  createdAt: Date;
}

// Constantes de configuración
export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    name: 'bronce',
    displayName: 'Bronce',
    minSales: 0,
    maxSales: 10,
    color: '#CD7F32',
    icon: '🥉',
    benefits: ['Acceso básico al catálogo']
  },
  {
    name: 'plata',
    displayName: 'Plata',
    minSales: 11,
    maxSales: 25,
    color: '#C0C0C0',
    icon: '🥈',
    benefits: ['5% descuento en consolidaciones', 'Badge exclusiva']
  },
  {
    name: 'oro',
    displayName: 'Oro',
    minSales: 26,
    maxSales: 50,
    color: '#FFD700',
    icon: '🥇',
    benefits: ['10% descuento en consolidaciones', 'Soporte prioritario']
  },
  {
    name: 'platino',
    displayName: 'Platino',
    minSales: 51,
    maxSales: 100,
    color: '#E5E4E2',
    icon: '💿',
    benefits: ['15% descuento en consolidaciones', 'Acceso anticipado a productos']
  },
  {
    name: 'diamante',
    displayName: 'Diamante',
    minSales: 101,
    maxSales: 200,
    color: '#B9F2FF',
    icon: '💎',
    benefits: ['20% descuento en consolidaciones', 'Envíos prioritarios']
  },
  {
    name: 'leyenda',
    displayName: 'Leyenda',
    minSales: 201,
    maxSales: 999999,
    color: '#FF00FF',
    icon: '👑',
    benefits: ['25% descuento en consolidaciones', 'Todos los beneficios']
  }
];

export const POINT_REASONS = {
  SALE: { amount: 10, description: 'Venta realizada' },
  FIRST_SALE: { amount: 50, description: 'Primera venta' },
  SHARE: { amount: 5, description: 'Producto compartido' },
  PROFILE_COMPLETE: { amount: 25, description: 'Perfil completado' },
  BADGE_UNLOCK: { amount: 0, description: 'Medalla desbloqueada' }, // Variable según medalla
  LEVEL_UP: { amount: 100, description: 'Subiste de nivel' },
  DAILY_LOGIN: { amount: 2, description: 'Inicio de sesión diario' },
  CANJE_DESCUENTO: { amount: -100, description: 'Canje: 10% descuento' },
} as const;
