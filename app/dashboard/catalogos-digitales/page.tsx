'use client';
import { BookOpen, Download, ExternalLink } from 'lucide-react';
import BackToHomeButton from '@/components/BackToHomeButton';

export default function CatalogosDigitalesPage() {
  const driveUrl = 'https://drive.google.com/drive/u/0/folders/19jdKf8yOZTJWKc2FHy3f7VKtP3IWYlEI';

  const handleOpenDrive = () => {
    window.open(driveUrl, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <BackToHomeButton />
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <BookOpen className="text-nadin-pink" size={28} />
          Catálogos Digitales
        </h2>
        <p className="text-gray-600">
          Accede a todos los catálogos de nuestras marcas
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-nadin-pink to-nadin-pink-dark text-white p-6">
          <h3 className="text-xl font-bold mb-2">📚 Biblioteca de Catálogos</h3>
          <p className="text-white/90">
            Encuentra todos los catálogos organizados por marca en Google Drive
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Beneficios */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <Download className="text-blue-600 flex-shrink-0 mt-1" size={20} />
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">Descarga directa</h4>
                <p className="text-sm text-gray-600">
                  Accede y descarga los catálogos en PDF
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
              <BookOpen className="text-green-600 flex-shrink-0 mt-1" size={20} />
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">Todas las marcas</h4>
                <p className="text-sm text-gray-600">
                  Catálogos organizados por marca
                </p>
              </div>
            </div>
          </div>

          {/* Instrucciones */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="font-semibold text-gray-800 mb-3">📝 Cómo usar:</h4>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="font-bold text-nadin-pink">1.</span>
                <span>Haz clic en el botón "Abrir Google Drive"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-nadin-pink">2.</span>
                <span>Navega por las carpetas organizadas por marca</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-nadin-pink">3.</span>
                <span>Descarga los catálogos que necesites</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-nadin-pink">4.</span>
                <span>Comparte con tus clientas para mostrar los productos</span>
              </li>
            </ol>
          </div>

          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleOpenDrive}
              className="flex-1 bg-nadin-pink text-white py-4 px-6 rounded-lg font-bold hover:bg-nadin-pink-dark transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <ExternalLink size={20} />
              Abrir Google Drive
            </button>
          </div>

          {/* Tip */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <p className="text-sm text-yellow-800">
              💡 <strong>Tip:</strong> Guarda el enlace de Drive en tus favoritos para acceder rápidamente desde cualquier dispositivo.
            </p>
          </div>
        </div>
      </div>

      {/* Info adicional */}
      <div className="mt-6 grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-3xl mb-2">📱</div>
          <h4 className="font-semibold text-gray-800 mb-1">Acceso móvil</h4>
          <p className="text-sm text-gray-600">
            Funciona desde tu celular o tablet
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-3xl mb-2">🔄</div>
          <h4 className="font-semibold text-gray-800 mb-1">Siempre actualizado</h4>
          <p className="text-sm text-gray-600">
            Los catálogos se actualizan automáticamente
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-3xl mb-2">💾</div>
          <h4 className="font-semibold text-gray-800 mb-1">Sin límites</h4>
          <p className="text-sm text-gray-600">
            Descarga todos los que necesites
          </p>
        </div>
      </div>
    </div>
  );
}
