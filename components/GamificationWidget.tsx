'use client';

import { useEffect, useState } from 'react';
import { Trophy, TrendingUp, Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface UserLevel {
  currentLevel: string;
  currentXP: number;
  totalSales: number;
}

interface GamificationStats {
  totalPoints: number;
  badgesUnlocked: number;
  level: UserLevel;
}

const LEVEL_CONFIG = {
  principiante: { name: 'Principiante', color: 'from-gray-400 to-gray-500', next: 'bronce', required: 10, icon: '🌱' },
  bronce: { name: 'Bronce', color: 'from-orange-500 to-orange-600', next: 'plata', required: 50, icon: '🥉' },
  plata: { name: 'Plata', color: 'from-gray-300 to-gray-400', next: 'oro', required: 100, icon: '🥈' },
  oro: { name: 'Oro', color: 'from-yellow-400 to-yellow-500', next: 'diamante', required: 200, icon: '🥇' },
  diamante: { name: 'Diamante', color: 'from-blue-400 to-blue-500', next: 'leyenda', required: 500, icon: '💎' },
  leyenda: { name: 'Leyenda', color: 'from-purple-500 to-purple-600', next: null, required: null, icon: '👑' }
};

export default function GamificationWidget() {
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;

      const user = JSON.parse(userStr);
      const response = await fetch(`/api/gamification/stats?userId=${user.id}`);
      
      if (!response.ok) throw new Error('Error al cargar estadísticas');

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const levelConfig = LEVEL_CONFIG[stats.level.currentLevel as keyof typeof LEVEL_CONFIG];
  const progress = levelConfig.required 
    ? Math.min((stats.level.totalSales / levelConfig.required) * 100, 100)
    : 100;
  
  const remaining = levelConfig.required 
    ? levelConfig.required - stats.level.totalSales 
    : 0;

  return (
    <div className={`bg-gradient-to-br ${levelConfig.color} rounded-lg shadow-lg p-6 text-white relative overflow-hidden`}>
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 opacity-10 text-9xl">
        {levelConfig.icon}
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Tu Nivel</h3>
            <p className="text-2xl font-bold flex items-center gap-2">
              {levelConfig.icon} {levelConfig.name}
            </p>
          </div>
          <Link 
            href="/dashboard/logros"
            className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm rounded-full p-2 transition-all"
          >
            <Trophy className="w-6 h-6" />
          </Link>
        </div>

        {/* Progress */}
        {levelConfig.next && (
          <>
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="opacity-90">Progreso</span>
                <span className="font-semibold">
                  {stats.level.totalSales} / {levelConfig.required}
                </span>
              </div>
              <div className="w-full bg-white bg-opacity-20 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
            <p className="text-sm opacity-90">
              ✨ Faltan <strong>{remaining} ventas</strong> para subir a{' '}
              {LEVEL_CONFIG[levelConfig.next as keyof typeof LEVEL_CONFIG].icon}{' '}
              {LEVEL_CONFIG[levelConfig.next as keyof typeof LEVEL_CONFIG].name}
            </p>
          </>
        )}

        {!levelConfig.next && (
          <p className="text-sm opacity-90">
            👑 <strong>¡Nivel máximo alcanzado!</strong> Sos una leyenda
          </p>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white border-opacity-20">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4" />
              <span className="text-xs opacity-75">Puntos</span>
            </div>
            <p className="text-xl font-bold">{stats.totalPoints}</p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4" />
              <span className="text-xs opacity-75">Badges</span>
            </div>
            <p className="text-xl font-bold">{stats.badgesUnlocked}</p>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/dashboard/logros"
          className="mt-4 w-full bg-white text-gray-800 hover:bg-opacity-90 rounded-lg py-3 px-4 font-semibold text-center flex items-center justify-center gap-2 transition-all"
        >
          Ver todos mis logros
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
