// PÁGINA: Detalle del Pedido con Documentos - PARA REVENDEDORA
// Ubicación: app/dashboard/pedidos/[id]/page.tsx
// CORREGIDO: Usa /api/pedidos en vez de /api/admin/pedidos

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Package, 
  FileText, 
  Download, 
  Trash2, 
  MessageCircle,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export default function DetallePedidoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [pedido, setPedido] = useState<any>(null);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelando, setCancelando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [params.id]);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // ✅ CORREGIDO: Usar endpoint correcto para revendedora
      const resPedido = await fetch(`/api/pedidos/${params.id}`);
      const dataPedido = await resPedido.json();
      
      if (!resPedido.ok) {
        console.error('Error cargando pedido:', dataPedido);
        alert('Error al cargar el pedido');
        router.push('/dashboard/pedidos');
        return;
      }
      
      setPedido(dataPedido);

      // ✅ MEJORADO: Cargar documentos con mejor logging
      if (dataPedido.consolidacionId) {
        console.log('📄 Cargando documentos para consolidación:', dataPedido.consolidacionId);
        
        try {
          const resDocumentos = await fetch(`/api/pedidos/${params.id}/documentos`);
          const dataDocumentos = await resDocumentos.json();
          
          console.log('📄 Respuesta documentos:', dataDocumentos);
          
          if (dataDocumentos.success && dataDocumentos.documentos) {
            setDocumentos(dataDocumentos.documentos);
            console.log('✅ Documentos cargados:', dataDocumentos.documentos.length);
          } else {
            console.log('⚠️ No hay documentos o error:', dataDocumentos);
            setDocumentos([]);
          }
        } catch (errorDoc) {
          console.error('❌ Error cargando documentos:', errorDoc);
          setDocumentos([]);
        }
      } else {
        console.log('ℹ️ Pedido sin consolidación, no hay documentos');
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar los datos');
      router.push('/dashboard/pedidos');
    } finally {
      setLoading(false);
    }
  };

  const cancelarPedido = async () => {
    const confirmar = confirm(
      '¿Estás segura de que querés cancelar este pedido?\n\n' +
      'Esta acción NO se puede deshacer y el pedido se eliminará completamente.'
    );

    if (!confirmar) return;

    setCancelando(true);
    try {
      const res = await fetch(`/api/pedidos/${params.id}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert('✅ Pedido cancelado exitosamente');
        router.push('/dashboard/pedidos');
      } else {
        throw new Error(data.error || 'Error al cancelar pedido');
      }
    } catch (error) {
      console.error('Error cancelando pedido:', error);
      alert('❌ Error al cancelar el pedido. Intentá de nuevo.');
    } finally {
      setCancelando(false);
    }
  };

  const formatearTamaño = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatearFecha = (fecha: string): string => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoBadge = (estado: string) => {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      'pendiente': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '⏳ Pendiente' },
      'enviado': { bg: 'bg-blue-100', text: 'text-blue-800', label: '📤 Enviado a Nadin' },
      'armado': { bg: 'bg-green-100', text: 'text-green-800', label: '✅ Armado' },
      'pagado': { bg: 'bg-purple-100', text: 'text-purple-800', label: '💰 Pagado' },
      'completado': { bg: 'bg-green-100', text: 'text-green-800', label: '🎉 Completado' },
      'despachado': { bg: 'bg-indigo-100', text: 'text-indigo-800', label: '🚚 Despachado' },
      'cancelado': { bg: 'bg-red-100', text: 'text-red-800', label: '❌ Cancelado' }
    };

    const config = configs[estado] || configs['pendiente'];
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle size={64} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pedido no encontrado</h2>
          <button
            onClick={() => router.push('/dashboard/pedidos')}
            className="text-pink-600 hover:underline"
          >
            Volver a Mis Pedidos
          </button>
        </div>
      </div>
    );
  }

  const puedeCancelar = pedido.estado === 'pendiente' || pedido.estado === 'enviado';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard/pedidos')}
            className="flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Volver a Mis Pedidos</span>
          </button>

          {puedeCancelar && (
            <button
              onClick={cancelarPedido}
              disabled={cancelando}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 size={18} />
              <span>{cancelando ? 'Cancelando...' : 'Cancelar Pedido'}</span>
            </button>
          )}
        </div>

        {/* Información del Pedido */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Pedido #{pedido.id.substring(0, 8)}
              </h1>
              <p className="text-gray-600 mt-1">
                Cliente: <strong>{pedido.cliente}</strong>
              </p>
              {pedido.telefono && (
                <p className="text-gray-600">
                  📞 {pedido.telefono}
                </p>
              )}
            </div>
            <div>
              {getEstadoBadge(pedido.estado)}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-600">Fecha de Creación</p>
              <p className="font-semibold">
                {new Date(pedido.createdAt).toLocaleDateString('es-AR')}
              </p>
            </div>

            {pedido.armadoEn && (
              <div>
                <p className="text-sm text-gray-600">Fecha de Armado</p>
                <p className="font-semibold">
                  {new Date(pedido.armadoEn).toLocaleDateString('es-AR')}
                </p>
              </div>
            )}

            {pedido.consolidacionId && (
              <div>
                <p className="text-sm text-gray-600">Consolidación</p>
                <p className="font-semibold text-pink-600">
                  #{pedido.consolidacionId.substring(0, 8)}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PRODUCTOS */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package size={24} className="text-pink-500" />
              Productos del Pedido
            </h2>

            <div className="space-y-3">
              {pedido.lineas?.map((producto: any) => (
                <div
                  key={producto.id}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-pink-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {producto.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {producto.brand && `${producto.brand} • `}
                        {[producto.talle, producto.color].filter(Boolean).join(' - ')}
                      </p>

                      {producto.nota && (
                        <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded px-3 py-1 inline-block">
                          <p className="text-xs text-yellow-800">
                            💬 {producto.nota}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-pink-600">
                        {producto.qty}
                      </p>
                      <p className="text-xs text-gray-600">unidades</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Precio unitario: <strong>${producto.mayorista.toFixed(2)}</strong>
                    </span>
                    <span className="text-gray-900 font-semibold">
                      Total: ${(producto.mayorista * producto.qty).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">
            {/* DOCUMENTOS ADJUNTADOS */}
            {pedido.consolidacionId && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-blue-500" />
                  Remitos Adjuntados
                </h2>

                {documentos.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <FileText className="mx-auto text-gray-300 mb-2" size={48} />
                    <p className="text-sm text-gray-600">
                      No hay remitos adjuntados todavía
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Nadin adjuntará los remitos cuando arme tu pedido
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documentos.map((doc) => (
                      <div
                        key={doc.id}
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <FileText className="text-blue-500 flex-shrink-0 mt-1" size={20} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {doc.originalName}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-600">
                              <span>📊 {formatearTamaño(doc.fileSize)}</span>
                              <span>•</span>
                              <span>📅 {formatearFecha(doc.uploadedAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* ✅ MEJORADO: Botones de descarga */}
                        <div className="flex gap-2">
                          {/* Botón principal: Descargar */}
                          <a
                            href={doc.publicUrl}
                            download={doc.originalName}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium text-sm"
                            onClick={(e) => {
                              console.log('📥 Descargando:', doc.originalName);
                              console.log('🔗 URL:', doc.publicUrl);
                            }}
                          >
                            <Download size={16} />
                            Descargar
                          </a>

                          {/* Botón secundario: Ver en nueva pestaña */}
                          <a
                            href={doc.publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium text-sm"
                            title="Ver en nueva pestaña"
                          >
                            👁️
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ✅ NUEVO: Info adicional */}
                {documentos.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700">
                      💡 <strong>Tip:</strong> Si el archivo no se descarga, probá hacer click en "👁️" para verlo en una nueva pestaña.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* CHAT */}
            {pedido.consolidacionId && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageCircle size={20} className="text-pink-500" />
                  Chat con Nadin
                </h2>

                <button
                  onClick={() => router.push(`/dashboard/chat?id=${pedido.consolidacionId}`)}
                  className="w-full bg-gradient-to-r from-pink-500 to-pink-400 text-white py-3 rounded-lg hover:shadow-lg transition-all font-semibold"
                >
                  Abrir Chat
                </button>

                <p className="text-xs text-gray-600 mt-3 text-center">
                  Hablá con Nadin sobre este pedido
                </p>
              </div>
            )}

            {/* ADVERTENCIA CANCELACIÓN */}
            {puedeCancelar && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-red-900 text-sm mb-1">
                      Cancelar Pedido
                    </h3>
                    <p className="text-xs text-red-700">
                      Si cancelás este pedido, se eliminará completamente y desaparecerá del armado de Nadin.
                      Esta acción no se puede deshacer.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
