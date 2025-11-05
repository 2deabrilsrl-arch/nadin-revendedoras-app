'use client';
import { useState } from 'react';
import BackToHomeButton from '@/components/BackToHomeButton';

export default function DiagnosticoCategorias() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  const verificarCategorias = async () => {
    setLoading(true);
    try {
      // 1. Verificar estadísticas del cache
      const statsRes = await fetch('/api/catalogo?stats=true');
      const stats = await statsRes.json();

      // 2. Obtener algunos productos para ver formato de categorías
      const productsRes = await fetch('/api/catalogo');
      const products = await productsRes.json();

      // Analizar categorías
      const categoriasEjemplo = products.slice(0, 10).map((p: any) => ({
        nombre: p.name,
        categoria: p.category,
        niveles: p.category ? p.category.split(' > ').length : 0
      }));

      // Extraer todas las categorías únicas
      const todasCategorias = new Set<string>();
      const categoriasPorNivel = {
        nivel1: new Set<string>(),
        nivel2: new Set<string>(),
        nivel3: new Set<string>()
      };

      products.forEach((p: any) => {
        if (p.category) {
          todasCategorias.add(p.category);
          const parts = p.category.split(' > ').map((s: string) => s.trim());
          if (parts[0]) categoriasPorNivel.nivel1.add(parts[0]);
          if (parts[1]) categoriasPorNivel.nivel2.add(parts[1]);
          if (parts[2]) categoriasPorNivel.nivel3.add(parts[2]);
        }
      });

      setResultado({
        stats,
        totalProductos: products.length,
        categoriasEjemplo,
        categoriasUnicas: todasCategorias.size,
        nivel1Count: categoriasPorNivel.nivel1.size,
        nivel2Count: categoriasPorNivel.nivel2.size,
        nivel3Count: categoriasPorNivel.nivel3.size,
        nivel1List: Array.from(categoriasPorNivel.nivel1).sort(),
        nivel2List: Array.from(categoriasPorNivel.nivel2).sort(),
        productosConCategoria: products.filter((p: any) => p.category).length,
        productosSinCategoria: products.filter((p: any) => !p.category).length
      });
    } catch (error) {
      console.error('Error:', error);
      setResultado({ error: error instanceof Error ? error.message : 'Error desconocido' });
    } finally {
      setLoading(false);
    }
  };

  const forzarSincronizacion = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/catalogo?sync=true');
      const data = await res.json();
      alert('✅ Sincronización completada. Esperá 2-3 minutos y verificá de nuevo.');
      setResultado(null);
    } catch (error) {
      alert('❌ Error en sincronización: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <BackToHomeButton />
      
      <h1 className="text-2xl font-bold mb-6">🔍 Diagnóstico de Categorías</h1>

      <div className="space-y-4">
        {/* Botones */}
        <div className="bg-white p-4 rounded-lg shadow space-y-3">
          <button
            onClick={verificarCategorias}
            disabled={loading}
            className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '🔄 Analizando...' : '🔍 Verificar Estado de Categorías'}
          </button>

          <button
            onClick={forzarSincronizacion}
            disabled={loading}
            className="w-full bg-nadin-pink text-white px-6 py-3 rounded-lg font-semibold hover:bg-nadin-pink-dark disabled:opacity-50"
          >
            🔄 Forzar Sincronización (Esperar 2-3 min)
          </button>
        </div>

        {/* Resultados */}
        {resultado && (
          <div className="space-y-4">
            {resultado.error ? (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="text-red-800 font-bold">❌ Error:</p>
                <pre className="text-sm text-red-700 mt-2">{resultado.error}</pre>
              </div>
            ) : (
              <>
                {/* Resumen */}
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h3 className="font-bold text-green-800 mb-3">📊 Resumen</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Productos en cache:</p>
                      <p className="text-2xl font-bold text-green-600">{resultado.totalProductos}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Con categoría:</p>
                      <p className="text-2xl font-bold text-blue-600">{resultado.productosConCategoria}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Sin categoría:</p>
                      <p className="text-2xl font-bold text-orange-600">{resultado.productosSinCategoria}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Categorías únicas:</p>
                      <p className="text-2xl font-bold text-purple-600">{resultado.categoriasUnicas}</p>
                    </div>
                  </div>
                </div>

                {/* Jerarquía */}
                <div className="bg-white border border-gray-200 p-4 rounded-lg">
                  <h3 className="font-bold mb-3">🌳 Jerarquía de Categorías</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-blue-50 rounded">
                      <p className="font-semibold text-blue-800">Nivel 1 (Principal)</p>
                      <p className="text-3xl font-bold text-blue-600">{resultado.nivel1Count}</p>
                      <p className="text-xs text-gray-600 mt-2">Categorías principales</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded">
                      <p className="font-semibold text-green-800">Nivel 2 (Subcategoría)</p>
                      <p className="text-3xl font-bold text-green-600">{resultado.nivel2Count}</p>
                      <p className="text-xs text-gray-600 mt-2">Subcategorías</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded">
                      <p className="font-semibold text-purple-800">Nivel 3 (Tipo)</p>
                      <p className="text-3xl font-bold text-purple-600">{resultado.nivel3Count}</p>
                      <p className="text-xs text-gray-600 mt-2">Tipos de producto</p>
                    </div>
                  </div>
                </div>

                {/* Categorías Nivel 1 */}
                <div className="bg-white border border-gray-200 p-4 rounded-lg">
                  <h3 className="font-bold mb-3">📋 Categorías Principales (Nivel 1)</h3>
                  <div className="flex flex-wrap gap-2">
                    {resultado.nivel1List.map((cat: string) => (
                      <span key={cat} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Ejemplos */}
                <div className="bg-white border border-gray-200 p-4 rounded-lg">
                  <h3 className="font-bold mb-3">📝 Ejemplos de Productos</h3>
                  <div className="space-y-2">
                    {resultado.categoriasEjemplo.map((item: any, idx: number) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded text-sm">
                        <p className="font-semibold text-gray-800">{item.nombre}</p>
                        <p className="text-gray-600 mt-1">
                          <span className="font-medium">Categoría:</span> {item.categoria || '❌ Sin categoría'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Niveles: {item.niveles} {item.niveles >= 3 ? '✅' : item.niveles >= 2 ? '⚠️' : '❌'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Diagnóstico */}
                <div className={`p-4 rounded-lg ${
                  resultado.nivel2Count > 0 && resultado.nivel3Count > 0
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <h3 className="font-bold mb-2">
                    {resultado.nivel2Count > 0 && resultado.nivel3Count > 0 ? '✅ Todo OK' : '❌ Problema Detectado'}
                  </h3>
                  {resultado.nivel2Count === 0 || resultado.nivel3Count === 0 ? (
                    <div className="text-red-800 space-y-2">
                      <p>Las categorías NO tienen jerarquía completa.</p>
                      <p className="font-semibold">Solución:</p>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li>Hacer clic en "Forzar Sincronización"</li>
                        <li>Esperar 2-3 minutos (no refrescar la página)</li>
                        <li>Hacer clic en "Verificar Estado" de nuevo</li>
                      </ol>
                    </div>
                  ) : (
                    <p className="text-green-800">
                      Las categorías tienen la jerarquía completa. Los filtros deberían funcionar correctamente.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Instrucciones */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h3 className="font-bold text-yellow-800 mb-2">💡 ¿Qué hacer?</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-900">
            <li>Hacer clic en "Verificar Estado de Categorías"</li>
            <li>Ver si hay Subcategorías (Nivel 2) y Tipos (Nivel 3)</li>
            <li>Si Nivel 2 o Nivel 3 = 0, hacer clic en "Forzar Sincronización"</li>
            <li>Esperar 2-3 minutos sin refrescar</li>
            <li>Verificar de nuevo</li>
            <li>Si ahora Nivel 2 y 3 tienen números, ¡está arreglado!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
