'use client';

import { useEffect, useState } from 'react';
import { Trophy, TrendingUp, Award, Star, Medal } from 'lucide-react';
import BackToHomeButton from '@/components/BackToHomeButton';

interface RankingEntry {
  position: number;
  userId: string;
  userName: string;
  userHandle: string;
  level: string;
  totalSales: number;
  totalPoints: number;
  badgesCount: number;
  isCurrentUser: boolean;
}

const LEVEL_CONFIG = {
  principiante: { name: 'Principiante', color: 'text-gray-600', icon: '🌱' },
  bronce: { name: 'Bronce', color: 'text-orange-600', icon: '🥉' },
  plata: { name: 'Plata', color: 'text-gray-500', icon: '🥈' },
  oro: { name: 'Oro', color: 'text-yellow-600', icon: '🥇' },
  diamante: { name: 'Diamante', color: 'text-blue-600', icon: '💎' },
  leyenda: { name: 'Leyenda', color: 'text-purple-600', icon: '👑' }
};

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'month' | 'all'>('month');

  useEffect(() => {
    loadRanking();
  }, [period]);

  const loadRanking = async () => {
    try {
      setLoading(true);
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('Usuario no encontrado');
      }

      const user = JSON.parse(userStr);
      const response = await fetch(`/api/gamification/ranking?userId=${user.id}&period=${period}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar ranking');
      }

      const data = await response.json();
      setRanking(data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1: return 'from-yellow-400 to-yellow-600 text-white';
      case 2: return 'from-gray-300 to-gray-400 text-white';
      case 3: return 'from-orange-400 to-orange-600 text-white';
      default: return 'from-gray-100 to-gray-200 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-nadin-pink"></div>
            <p className="mt-4 text-gray-600">Cargando ranking...</p>
          </div>
        </div>
      </div>
    );
  }

  const currentUser = ranking.find(r => r.isCurrentUser);

  return (
    <div className="max-w-6xl mx-auto p-4 pb-24">
      <BackToHomeButton />
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🏆 Ranking de Revendedoras</h1>
        <p className="text-gray-600">Tabla de posiciones y mejores vendedoras</p>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex gap-3">
          <button
            onClick={() => setPeriod('month')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              period === 'month'
                ? 'bg-nadin-pink text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            📅 Este Mes
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              period === 'all'
                ? 'bg-nadin-pink text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🌟 Histórico
          </button>
        </div>
      </div>

      {/* User Position Card (if not in top 10) */}
      {currentUser && currentUser.position > 10 && (
        <div className="bg-gradient-to-br from-nadin-pink to-pink-600 text-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-3">Tu Posición</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold">#{currentUser.position}</p>
              <p className="text-sm opacity-90 mt-1">{currentUser.totalSales} ventas realizadas</p>
            </div>
            <div className="text-right">
              <p className="text-2xl">{LEVEL_CONFIG[currentUser.level as keyof typeof LEVEL_CONFIG].icon}</p>
              <p className="text-sm opacity-90">{LEVEL_CONFIG[currentUser.level as keyof typeof LEVEL_CONFIG].name}</p>
            </div>
          </div>
          <p className="text-sm opacity-90 mt-4 text-center">
            💪 ¡Seguí así! Cada venta te acerca al top 10
          </p>
        </div>
      )}

      {/* Top 3 Podium */}
      {ranking.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* 2nd Place */}
          <div className="order-1 flex flex-col items-center">
            <div className={`bg-gradient-to-br ${getPositionColor(2)} w-full rounded-lg shadow-lg p-4 text-center`}>
              <p className="text-3xl mb-2">🥈</p>
              <p className="font-bold text-lg truncate">{ranking[1].userName}</p>
              <p className="text-sm opacity-75 mb-2">@{ranking[1].userHandle}</p>
              <div className="bg-white bg-opacity-20 rounded-lg py-2 px-3 mt-2">
                <p className="text-2xl font-bold">{ranking[1].totalSales}</p>
                <p className="text-xs opacity-75">ventas</p>
              </div>
            </div>
            <div className="h-24 bg-gradient-to-b from-gray-300 to-gray-400 w-full rounded-b-lg"></div>
          </div>

          {/* 1st Place */}
          <div className="order-2 flex flex-col items-center">
            <div className={`bg-gradient-to-br ${getPositionColor(1)} w-full rounded-lg shadow-2xl p-6 text-center transform scale-110 relative`}>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-yellow-900 rounded-full px-3 py-1 text-xs font-bold shadow-lg">
                CAMPEONA
              </div>
              <p className="text-4xl mb-2">👑</p>
              <p className="font-bold text-xl truncate">{ranking[0].userName}</p>
              <p className="text-sm opacity-75 mb-3">@{ranking[0].userHandle}</p>
              <div className="bg-white bg-opacity-20 rounded-lg py-3 px-4 mt-2">
                <p className="text-3xl font-bold">{ranking[0].totalSales}</p>
                <p className="text-xs opacity-75">ventas</p>
              </div>
            </div>
            <div className="h-32 bg-gradient-to-b from-yellow-400 to-yellow-600 w-full rounded-b-lg"></div>
          </div>

          {/* 3rd Place */}
          <div className="order-3 flex flex-col items-center">
            <div className={`bg-gradient-to-br ${getPositionColor(3)} w-full rounded-lg shadow-lg p-4 text-center`}>
              <p className="text-3xl mb-2">🥉</p>
              <p className="font-bold text-lg truncate">{ranking[2].userName}</p>
              <p className="text-sm opacity-75 mb-2">@{ranking[2].userHandle}</p>
              <div className="bg-white bg-opacity-20 rounded-lg py-2 px-3 mt-2">
                <p className="text-2xl font-bold">{ranking[2].totalSales}</p>
                <p className="text-xs opacity-75">ventas</p>
              </div>
            </div>
            <div className="h-16 bg-gradient-to-b from-orange-400 to-orange-600 w-full rounded-b-lg"></div>
          </div>
        </div>
      )}

      {/* Ranking Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-nadin-pink to-pink-600 text-white">
          <h3 className="text-lg font-bold">📊 Tabla de Posiciones</h3>
        </div>
        
        <div className="divide-y">
          {ranking.map((entry) => (
            <div
              key={entry.userId}
              className={`p-4 flex items-center gap-4 transition-all ${
                entry.isCurrentUser 
                  ? 'bg-pink-50 border-l-4 border-nadin-pink' 
                  : 'hover:bg-gray-50'
              }`}
            >
              {/* Position */}
              <div className="w-16 text-center">
                {entry.position <= 3 ? (
                  <span className="text-3xl">{getMedalIcon(entry.position)}</span>
                ) : (
                  <span className="text-2xl font-bold text-gray-400">#{entry.position}</span>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-lg">
                    {entry.userName}
                    {entry.isCurrentUser && (
                      <span className="ml-2 text-xs bg-nadin-pink text-white px-2 py-1 rounded-full">
                        Vos
                      </span>
                    )}
                  </p>
                </div>
                <p className="text-sm text-gray-500">@{entry.userHandle}</p>
              </div>

              {/* Level */}
              <div className="text-center">
                <p className="text-2xl">{LEVEL_CONFIG[entry.level as keyof typeof LEVEL_CONFIG].icon}</p>
                <p className={`text-xs font-semibold ${LEVEL_CONFIG[entry.level as keyof typeof LEVEL_CONFIG].color}`}>
                  {LEVEL_CONFIG[entry.level as keyof typeof LEVEL_CONFIG].name}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-nadin-pink">{entry.totalSales}</p>
                  <p className="text-xs text-gray-500">Ventas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{entry.totalPoints}</p>
                  <p className="text-xs text-gray-500">Puntos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{entry.badgesCount}</p>
                  <p className="text-xs text-gray-500">Badges</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {ranking.length === 0 && (
          <div className="p-12 text-center">
            <Trophy size={48} className="mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600">No hay datos para mostrar</p>
          </div>
        )}
      </div>
    </div>
  );
}
