'use client';
import { useEffect, useState } from 'react';
import BackToHomeButton from '@/components/BackToHomeButton';

export default function DiagnosticoPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const testAPI = async (endpoint: string) => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log(`🧪 Probando: ${endpoint}`);
      const response = await fetch(endpoint);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as any;
      console.log('Response data:', data);
      
      setResult({
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data,
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 'N/A',
      });
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <BackToHomeButton />
      <h1 className="text-2xl font-bold mb-6">🔍 Diagnóstico de API</h1>

      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-bold mb-4">Probar Endpoints</h2>
          
          <div className="space-y-2">
            <button
              onClick={() => testAPI('/api/best-sellers?limit=10')}
              disabled={loading}
              className="w-full bg-nadin-pink text-white px-4 py-2 rounded hover:bg-nadin-pink-dark disabled:opacity-50"
            >
              🔥 Test: /api/best-sellers?limit=10
            </button>

            <button
              onClick={() => testAPI('/api/best-sellers?limit=50')}
              disabled={loading}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              🔥 Test: /api/best-sellers?limit=50
            </button>

            <button
              onClick={() => testAPI('/api/catalogo?stats=true')}
              disabled={loading}
              className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              📊 Test: /api/catalogo (stats)
            </button>
          </div>
        </div>

        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-blue-800">Cargando...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-bold text-red-800 mb-2">❌ Error</h3>
            <pre className="text-sm text-red-700 overflow-auto">{error}</pre>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-bold text-green-800 mb-4">✅ Resultado</h3>
            
            <div className="space-y-3">
              <div>
                <span className="font-semibold">Status:</span> {result.status}
              </div>
              
              <div>
                <span className="font-semibold">Es Array:</span> {result.isArray ? '✅ Sí' : '❌ No'}
              </div>
              
              <div>
                <span className="font-semibold">Cantidad:</span> {result.length}
              </div>

              <div>
                <span className="font-semibold">Datos:</span>
                <pre className="mt-2 bg-white p-3 rounded text-xs overflow-auto max-h-96 border">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-bold text-yellow-800 mb-2">💡 Instrucciones</h3>
          <ol className="text-sm text-yellow-900 space-y-1 list-decimal list-inside">
            <li>Presiona los botones arriba para probar los endpoints</li>
            <li>Revisa la consola del navegador (F12) para ver logs detallados</li>
            <li>Si hay errores, copia el mensaje de error completo</li>
            <li>Verifica que las variables de entorno estén configuradas en Vercel</li>
          </ol>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-bold mb-2">📝 Checklist de Variables de Entorno</h3>
          <ul className="text-sm space-y-1">
            <li>✅ TN_STORE_ID = 6566743</li>
            <li>✅ TN_ACCESS_TOKEN = (tu token)</li>
            <li>✅ TN_API_BASE = https://api.tiendanube.com/v1</li>
            <li>✅ TN_USER_AGENT = Nadin Revendedoras App</li>
          </ul>
          <p className="text-xs text-gray-600 mt-2">
            Verifica en: Vercel Dashboard → Settings → Environment Variables
          </p>
        </div>
      </div>
    </div>
  );
}
