// app/admin/brand-ambassadors/page.tsx
// 🎖️ Panel Admin para gestionar Brand Ambassadors

'use client';

import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Award, Users, Home, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BrandOverview {
  slug: string;
  name: string;
  logoUrl: string;
  logoEmoji: string;
  isActive: boolean;
  stats: {
    participants: number;
    totalSales: number;
    totalBadges: number;
    badgesUnlocked: number;
  };
  top3: Array<{
    position: number;
    userName: string;
    userHandle: string;
    salesCount: number;
  }>;
}

interface RankingEntry {
  position: number;
  userId: string;
  userName: string;
  userHandle: string;
  userTelefono: string;
  userEmail: string;
  salesCount: number;
  badgesUnlocked: number;
  totalBadges: number;
  highestBadge: any;
  nextBadge: {
    name: string;
    icon: string;
    required: number;
    remaining: number;
    progress: number;
  } | null;
}

export default function BrandAmbassadorsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'overview' | 'ranking'>('overview');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [overview, setOverview] = useState<{ brands: BrandOverview[] } | null>(null);
  const [ranking, setRanking] = useState<{ brand: any; ranking: RankingEntry[] } | null>(null);

  useEffect(() => {
    const userData = (globalThis as any).localStorage?.getItem('user');
    if (userData) {
      const u = JSON.parse(userData);
      if (u.rol !== 'vendedora') {
        (globalThis as any).alert?.('❌ No tenés permisos para acceder a esta página');
        (globalThis as any).window?.location?.assign('/dashboard');
        return;
      }
    } else {
      (globalThis as any).window?.location?.assign('/login');
      return;
    }

    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/brand-ambassadors');
      const data = await res.json();
      setOverview(data as any);
    } catch (error) {
      console.error('Error cargando overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRanking = async (brandSlug: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/brand-ambassadors?brand=${brandSlug}&limit=100`);
      const data = await res.json();
      setRanking(data);
      setSelectedBrand(brandSlug);
      setView('ranking');
    } catch (error) {
      console.error('Error cargando ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBrandStatus = async (brandSlug: string, currentStatus: boolean) => {
    if (!(globalThis as any).confirm?.(`¿${currentStatus ? 'Desactivar' : 'Activar'} esta marca?`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/brand-ambassadors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandSlug,
          action: currentStatus ? 'deactivate' : 'activate'
        })
      });

      if (res.ok) {
        (globalThis as any).alert?.('✅ Estado actualizado');
        await loadOverview();
      }
    } catch (error) {
      console.error('Error actualizando marca:', error);
      (globalThis as any).alert?.('❌ Error al actualizar');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (view === 'ranking') {
              setView('overview');
              setSelectedBrand(null);
            } else {
              router.push('/admin/dashboard');
            }
          }}
          className="flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium"
        >
          <Home size={20} />
          <span>{view === 'ranking' ? 'Volver a Marcas' : 'Volver al Inicio'}</span>
        </button>

        {view === 'overview' && (
          <button
            onClick={loadOverview}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <RefreshCw size={18} />
            <span>Actualizar</span>
          </button>
        )}
      </div>

      {/* Overview de Marcas */}
      {view === 'overview' && overview && (
        <>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <Trophy size={32} className="text-yellow-500" />
              <h1 className="text-2xl font-bold">Brand Ambassadors</h1>
            </div>
            <p className="text-gray-600">
              Programa de embajadoras de marca - Rankings y estadísticas
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-lg p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-6 h-6" />
                <span className="text-2xl font-bold">{overview.brands.length}</span>
              </div>
              <p className="text-sm opacity-90">Marcas Totales</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-700 text-white rounded-lg p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="w-6 h-6" />
                <span className="text-2xl font-bold">
                  {overview.brands.filter(b => b.isActive).length}
                </span>
              </div>
              <p className="text-sm opacity-90">Marcas Activas</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-lg p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-6 h-6" />
                <span className="text-2xl font-bold">
                  {overview.brands.reduce((sum, b) => sum + b.stats.participants, 0)}
                </span>
              </div>
              <p className="text-sm opacity-90">Participantes</p>
            </div>

            <div className="bg-gradient-to-br from-pink-500 to-pink-700 text-white rounded-lg p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-6 h-6" />
                <span className="text-2xl font-bold">
                  {overview.brands.reduce((sum, b) => sum + b.stats.totalSales, 0)}
                </span>
              </div>
              <p className="text-sm opacity-90">Prendas Vendidas</p>
            </div>
          </div>

          {/* Lista de Marcas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {overview.brands.map(brand => (
              <div
                key={brand.slug}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Header con logo */}
                <div className={`p-6 ${brand.isActive ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-400'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {brand.logoUrl ? (
                        <img
                          src={brand.logoUrl}
                          alt={brand.name}
                          className="w-16 h-16 rounded-lg bg-white p-2 object-contain"
                        />
                      ) : (
                        <div className="text-4xl">{brand.logoEmoji}</div>
                      )}
                      <div className="text-white">
                        <h3 className="text-xl font-bold">{brand.name}</h3>
                        <p className="text-sm opacity-90">
                          {brand.isActive ? '✅ Activa' : '⏸️ Pausada'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-2xl font-bold text-gray-800">
                        {brand.stats.participants}
                      </div>
                      <div className="text-sm text-gray-600">Participantes</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-pink-600">
                        {brand.stats.totalSales}
                      </div>
                      <div className="text-sm text-gray-600">Prendas</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {brand.stats.badgesUnlocked}
                      </div>
                      <div className="text-sm text-gray-600">Badges</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">
                        {brand.stats.totalBadges}
                      </div>
                      <div className="text-sm text-gray-600">Niveles</div>
                    </div>
                  </div>

                  {/* Top 3 */}
                  {brand.top3.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm font-semibold text-gray-700 mb-2">🏆 Top 3</div>
                      <div className="space-y-1">
                        {brand.top3.map(entry => (
                          <div key={entry.position} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              {entry.position === 1 ? '🥇' : entry.position === 2 ? '🥈' : '🥉'} {entry.userName}
                            </span>
                            <span className="font-semibold">{entry.salesCount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botones */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadRanking(brand.slug)}
                      className="flex-1 bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 font-semibold"
                    >
                      Ver Ranking
                    </button>
                    <button
                      onClick={() => toggleBrandStatus(brand.slug, brand.isActive)}
                      className={`px-4 py-2 rounded-lg font-semibold ${
                        brand.isActive
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {brand.isActive ? 'Pausar' : 'Activar'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Ranking Detallado */}
      {view === 'ranking' && ranking && (
        <>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              {ranking.brand.logoUrl ? (
                <img
                  src={ranking.brand.logoUrl}
                  alt={ranking.brand.name}
                  className="w-12 h-12 rounded-lg object-contain"
                />
              ) : (
                <div className="text-3xl">{ranking.brand.logoEmoji}</div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{ranking.brand.name}</h1>
                <p className="text-gray-600">
                  {ranking.ranking.length} revendedoras participando
                </p>
              </div>
            </div>
          </div>

          {/* Tabla de Ranking */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Pos</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Revendedora</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Prendas</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Badges</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Próximo</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Contacto</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ranking.ranking.map(entry => (
                    <tr key={entry.userId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-2xl">
                          {entry.position === 1 ? '🥇' : entry.position === 2 ? '🥈' : entry.position === 3 ? '🥉' : `#${entry.position}`}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{entry.userName}</div>
                        <div className="text-sm text-gray-600">@{entry.userHandle}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-2xl font-bold text-pink-600">{entry.salesCount}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Award size={16} className="text-purple-600" />
                          <span className="font-semibold">{entry.badgesUnlocked}/{entry.totalBadges}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {entry.nextBadge ? (
                          <div>
                            <div className="text-xs font-semibold text-gray-700 mb-1">
                              {entry.nextBadge.name}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                              <div
                                className="bg-pink-500 h-2 rounded-full"
                                style={{ width: `${entry.nextBadge.progress}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-600">
                              Faltan {entry.nextBadge.remaining}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-green-600 font-semibold">
                            🎉 ¡Todos desbloqueados!
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-600">
                          <div>{entry.userTelefono}</div>
                          <div className="truncate max-w-[150px]">{entry.userEmail}</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
