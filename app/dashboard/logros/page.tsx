'use client';

import { useEffect, useState } from 'react';
import { Trophy, Award, Star, TrendingUp, Gift, Zap } from 'lucide-react';
import BackToHomeButton from '@/components/BackToHomeButton';

interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  rarity: string;
  unlocked?: boolean;
  unlockedAt?: string;
}

interface UserLevel {
  currentLevel: string;
  currentXP: number;
  totalSales: number;
}

interface UserStats {
  totalPoints: number;
  badgesUnlocked: number;
  totalBadges: number;
  level: UserLevel;
  badges: Badge[];
}

const LEVEL_CONFIG = {
  principiante: { name: 'Principiante', color: 'bg-gray-400', next: 'bronce', required: 10, icon: '🌱' },
  bronce: { name: 'Bronce', color: 'bg-orange-600', next: 'plata', required: 50, icon: '🥉' },
  plata: { name: 'Plata', color: 'bg-gray-400', next: 'oro', required: 100, icon: '🥈' },
  oro: { name: 'Oro', color: 'bg-yellow-500', next: 'diamante', required: 200, icon: '🥇' },
  diamante: { name: 'Diamante', color: 'bg-blue-400', next: 'leyenda', required: 500, icon: '💎' },
  leyenda: { name: 'Leyenda', color: 'bg-purple-600', next: null, required: null, icon: '👑' }
};

const RARITY_CONFIG = {
  common: { color: 'bg-gray-200 text-gray-700 border-gray-300', label: 'Común' },
  rare: { color: 'bg-blue-100 text-blue-700 border-blue-300', label: 'Raro' },
  epic: { color: 'bg-purple-100 text-purple-700 border-purple-300', label: 'Épico' },
  legendary: { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', label: 'Legendario' }
};

export default function LogrosPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('Usuario no encontrado');
      }

      const user = JSON.parse(userStr);
      const response = await fetch(`/api/gamification/stats?userId=${user.id}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar estadísticas');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = () => {
    if (!stats) return 0;
    
    const levelConfig = LEVEL_CONFIG[stats.level.currentLevel as keyof typeof LEVEL_CONFIG];
    if (!levelConfig.required) return 100; // Nivel máximo
    
    return Math.min((stats.level.totalSales / levelConfig.required) * 100, 100);
  };

  const getNextLevelInfo = () => {
    if (!stats) return null;
    
    const levelConfig = LEVEL_CONFIG[stats.level.currentLevel as keyof typeof LEVEL_CONFIG];
    if (!levelConfig.next) return null; // Nivel máximo
    
    const remaining = levelConfig.required! - stats.level.totalSales;
    return {
      nextLevel: LEVEL_CONFIG[levelConfig.next as keyof typeof LEVEL_CONFIG],
      remaining,
      required: levelConfig.required
    };
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ventas': return '💰';
      case 'constancia': return '🔥';
      case 'tiempo': return '⏰';
      case 'especial': return '⭐';
      default: return '🏅';
    }
  };

  const filteredBadges = stats?.badges.filter(badge => 
    selectedCategory === 'todos' || badge.category === selectedCategory
  ) || [];

  const categories = [
    { id: 'todos', name: 'Todos', icon: '🎯' },
    { id: 'ventas', name: 'Ventas', icon: '💰' },
    { id: 'constancia', name: 'Constancia', icon: '🔥' },
    { id: 'tiempo', name: 'Tiempo', icon: '⏰' },
    { id: 'especial', name: 'Especial', icon: '⭐' }
  ];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-nadin-pink"></div>
            <p className="mt-4 text-gray-600">Cargando logros...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-800">Error al cargar estadísticas</p>
          <button
            onClick={loadStats}
            className="mt-4 bg-nadin-pink text-white px-6 py-2 rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const progress = calculateProgress();
  const nextLevelInfo = getNextLevelInfo();
  const currentLevelConfig = LEVEL_CONFIG[stats.level.currentLevel as keyof typeof LEVEL_CONFIG];

  return (
    <div className="max-w-6xl mx-auto p-4 pb-24">
      <BackToHomeButton />
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🏆 Mis Logros</h1>
        <p className="text-gray-600">Tu progreso y logros desbloqueados</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-nadin-pink to-pink-600 text-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Star className="w-6 h-6" />
            <span className="text-2xl font-bold">{stats.totalPoints}</span>
          </div>
          <p className="text-sm opacity-90">Puntos Totales</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Trophy className="w-6 h-6" />
            <span className="text-2xl font-bold">{stats.badgesUnlocked}</span>
          </div>
          <p className="text-sm opacity-90">Badges Desbloqueados</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-6 h-6" />
            <span className="text-2xl font-bold">{stats.level.totalSales}</span>
          </div>
          <p className="text-sm opacity-90">Ventas Realizadas</p>
        </div>

        <div className={`bg-gradient-to-br ${currentLevelConfig.color} text-white rounded-lg p-4 shadow-lg`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{currentLevelConfig.icon}</span>
            <Award className="w-6 h-6" />
          </div>
          <p className="text-sm opacity-90 font-semibold">{currentLevelConfig.name}</p>
        </div>
      </div>

      {/* Level Progress */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold mb-1">
              {currentLevelConfig.icon} Nivel {currentLevelConfig.name}
            </h3>
            {nextLevelInfo ? (
              <p className="text-sm text-gray-600">
                Faltan <strong className="text-nadin-pink">{nextLevelInfo.remaining} ventas</strong> para{' '}
                {nextLevelInfo.nextLevel.icon} {nextLevelInfo.nextLevel.name}
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                <strong className="text-purple-600">¡Nivel máximo alcanzado!</strong>
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-nadin-pink">{stats.level.totalSales}</p>
            <p className="text-xs text-gray-500">
              {nextLevelInfo ? `/ ${nextLevelInfo.required}` : 'ventas'}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full ${currentLevelConfig.color} transition-all duration-500 rounded-full`}
              style={{ width: `${progress}%` }}
            >
              <div className="h-full w-full bg-white opacity-20 animate-pulse"></div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            {progress.toFixed(0)}% completado
          </p>
        </div>

        {/* Level Timeline */}
        <div className="mt-6 flex items-center justify-between">
          {Object.entries(LEVEL_CONFIG).map(([key, config]) => {
            const isActive = key === stats.level.currentLevel;
            const isPast = Object.keys(LEVEL_CONFIG).indexOf(key) < 
                          Object.keys(LEVEL_CONFIG).indexOf(stats.level.currentLevel);
            
            return (
              <div key={key} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl mb-1 transition-all ${
                  isActive ? `${config.color} text-white ring-4 ring-offset-2 ring-nadin-pink scale-110` :
                  isPast ? `${config.color} text-white` :
                  'bg-gray-200 text-gray-400'
                }`}>
                  {config.icon}
                </div>
                <p className={`text-xs font-medium ${
                  isActive ? 'text-nadin-pink' : isPast ? 'text-gray-700' : 'text-gray-400'
                }`}>
                  {config.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">
            🏅 Badges ({stats.badgesUnlocked}/{stats.totalBadges})
          </h3>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-nadin-pink text-white shadow-md scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBadges.map(badge => (
            <div
              key={badge.id}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                badge.unlocked
                  ? `${RARITY_CONFIG[badge.rarity as keyof typeof RARITY_CONFIG].color} hover:scale-105 shadow-md`
                  : 'bg-gray-50 border-gray-200 opacity-40'
              }`}
            >
              {badge.unlocked && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 shadow-lg">
                  <Zap size={16} />
                </div>
              )}
              
              <div className="text-center">
                <div className="text-4xl mb-2">{badge.icon}</div>
                <h4 className="font-bold text-sm mb-1">{badge.name}</h4>
                <p className="text-xs text-gray-600 mb-2">{badge.description}</p>
                
                <div className="flex items-center justify-center gap-2 text-xs">
                  <span className="font-semibold text-nadin-pink">
                    +{badge.points} pts
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className={`px-2 py-0.5 rounded ${
                    badge.unlocked ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {badge.unlocked ? '✓ Desbloqueado' : 'Bloqueado'}
                  </span>
                </div>

                {badge.unlocked && badge.unlockedAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(badge.unlockedAt).toLocaleDateString('es-AR')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredBadges.length === 0 && (
          <div className="text-center py-12">
            <Gift size={48} className="mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600">No hay badges en esta categoría</p>
          </div>
        )}
      </div>
    </div>
  );
}
