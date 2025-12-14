// PÁGINA: Armar Consolidación - CON DESCUENTOS Y AGREGAR PRODUCTOS
// Ubicación: app/armar-consolidacion/[token]/page.tsx
// VERSIÓN: Con descuentos por línea, descuento total, y agregar productos CON VARIANTES
// ✅ INTEGRACIÓN: ProductSearchWithVariants para búsqueda avanzada

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Package, CheckCircle, Send, ArrowLeft, MessageCircle, AlertTriangle,
  X, AlertCircle, Minus, Plus, FileText, Upload, Download, Trash2,
  DollarSign, Percent, ShoppingCart, Tag
} from 'lucide-react';
import ProductSearchWithVariants from '@/components/ProductSearchWithVariants';

interface ProductoArmado {
  lineaId: string;
  cantidadPedida: number;
  cantidadDisponible: number;
  estado: 'completo' | 'parcial' | 'sin-stock';
  precioMayorista: number;
  precioVenta: number;
  descuento?: number; // ✅ NUEVO: Descuento aplicado (en $)
  tipoDescuento?: 'pesos' | 'porcentaje'; // ✅ NUEVO
}

// ✅ NUEVO: Producto agregado durante armado
interface ProductoAgregado {
  id: string;
  sku: string;
  nombre: string;
  marca: string;
  talle: string;
  color: string;
  cantidad: number;
  precioMayorista: number;
  precioVenta: number;
}

// Componente de Documentos (mantener igual)
interface Documento {
  id: string;
  filename: string;
  originalName: string;
  publicUrl: string;
  fileSize: number;
  uploadedAt: string;
}

interface DocumentosConsolidacionProps {
  token: string;
  consolidacionId: string;
  userId: string;
}

function DocumentosConsolidacion({ token, consolidacionId, userId }: DocumentosConsolidacionProps) {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    cargarDocumentos();
  }, [token]);

  const cargarDocumentos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/armar-consolidacion/${token}/documentos`);
      const data = await res.json() as any;
      if (data.success) {
        setDocumentos(data.documentos || []);
      }
    } catch (error) {
      console.error('Error cargando documentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Solo se permiten archivos PDF');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo excede el tamaño máximo de 10MB');
      setTimeout(() => setError(null), 3000);
      return;
    }

    await subirDocumento(file);
    e.target.value = '';
  };

  const subirDocumento = async (file: File) => {
    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('token', token);
      formData.append('consolidacionId', consolidacionId);
      formData.append('userId', userId);

      const res = await fetch(`/api/armar-consolidacion/${token}/documentos`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json() as any;

      if (!data.success) {
        throw new Error(data.error || 'Error al subir documento');
      }

      setSuccess(`✅ ${file.name} subido correctamente`);
      setTimeout(() => setSuccess(null), 3000);
      await cargarDocumentos();
    } catch (error: any) {
      setError(error.message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setUploading(false);
    }
  };

  const eliminarDocumento = async (docId: string, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return;

    try {
      const res = await fetch(`/api/armar-consolidacion/${token}/documentos/${docId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Error al eliminar');

      setSuccess(`✅ Documento eliminado`);
      setTimeout(() => setSuccess(null), 3000);
      await cargarDocumentos();
    } catch (error) {
      setError('Error al eliminar documento');
      setTimeout(() => setError(null), 3000);
    }
  };

  const formatearTamaño = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-blue-500" size={24} />
            Remitos Adjuntados
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Adjuntá los remitos del armado (PDF)
          </p>
        </div>

        <label className="cursor-pointer">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
          <div className={`
            flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all
            ${uploading 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg text-white'
            }
          `}>
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Subiendo...
              </>
            ) : (
              <>
                <Upload size={20} />
                Adjuntar PDF
              </>
            )}
          </div>
        </label>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="text-red-500" size={24} />
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle className="text-green-500" size={24} />
          <p className="text-green-700 font-medium">{success}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando documentos...</p>
        </div>
      ) : documentos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <FileText className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            No hay documentos adjuntados
          </h3>
          <p className="text-gray-600">
            Adjuntá los remitos del armado usando el botón de arriba
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documentos.map((doc) => (
            <div
              key={doc.id}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <FileText className="text-white" size={24} />
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 mb-1">
                    {doc.originalName}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>📊 {formatearTamaño(doc.fileSize)}</span>
                    <span>📅 {formatearFecha(doc.uploadedAt)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={doc.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                  title="Descargar / Ver"
                >
                  <Download size={20} />
                </a>

                <button
                  onClick={() => eliminarDocumento(doc.id, doc.originalName)}
                  className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {documentos.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-xl">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Podés adjuntar múltiples remitos. 
            Si armás el pedido en varias veces, adjuntá cada remito cuando lo generes.
          </p>
        </div>
      )}
    </div>
  );
}

export default function ArmarConsolidacionPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [consolidacion, setConsolidacion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [marcandoArmado, setMarcandoArmado] = useState(false);
  const [margenUsuario, setMargenUsuario] = useState<number>(50); // Margen por defecto 50%
  
  const [productosArmados, setProductosArmados] = useState<Record<string, ProductoArmado>>({});
  
  // ✅ NUEVO: Descuento total (en pesos o porcentaje)
  const [descuentoTotal, setDescuentoTotal] = useState<number>(0);
  const [tipoDescuentoTotal, setTipoDescuentoTotal] = useState<'pesos' | 'porcentaje'>('pesos');
  
  // ✅ NUEVO: Productos agregados
  const [productosAgregados, setProductosAgregados] = useState<ProductoAgregado[]>([]);
  const [mostrarAgregar, setMostrarAgregar] = useState(false);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [productosDisponibles, setProductosDisponibles] = useState<any[]>([]);
  const [buscandoProductos, setBuscandoProductos] = useState(false);
  
  // Chat
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [enviandoMensaje, setEnviandoMensaje] = useState(false);
  const [mensajesSinLeer, setMensajesSinLeer] = useState(0);

  // Modal resumen
  const [showResumen, setShowResumen] = useState(false);

  useEffect(() => {
    cargarConsolidacion();
    cargarMensajes();

    const interval = setInterval(cargarMensajes, 15000);
    return () => clearInterval(interval);
  }, [token]);

  const cargarConsolidacion = async () => {
    try {
      const res = await fetch(`/api/armar-consolidacion/${token}`);
      const data = await res.json() as any;


      if (data.consolidacion) {
        console.log('✅ Consolidación cargada:', data.consolidacion);
        setConsolidacion(data.consolidacion);
        
        // Obtener margen del usuario (la revendedora)
        if (data.consolidacion.user?.margen) {
          setMargenUsuario(data.consolidacion.user.margen);
          console.log('💰 Margen de la revendedora:', data.consolidacion.user.margen, '%');
          console.log('👤 Usuario:', data.consolidacion.user.name);
        } else {
          console.warn('⚠️  No se encontró margen del usuario, usando default 50%');
          setMargenUsuario(50);
        }
        
        // Inicializar productos
        const productosInicial: Record<string, ProductoArmado> = {};
        
        data.consolidacion.pedidos?.forEach((pedido: any) => {
          console.log('📦 Procesando pedido:', pedido.id);
          pedido.items?.forEach((item: any) => {
            console.log('   🔍 Item:', {
              id: item.id,
              mayorista: item.mayorista,
              venta: item.venta,
              productoMayorista: item.producto?.mayorista,
              productoVenta: item.producto?.venta
            });
            
            const precioMayorista = item.mayorista || item.producto?.mayorista || 0;
            const precioVenta = item.venta || item.producto?.venta || 0;
            
            console.log('   💰 Precios asignados:', { precioMayorista, precioVenta });
            
            productosInicial[item.id] = {
              lineaId: item.id,
              cantidadPedida: item.cantidad,
              cantidadDisponible: item.cantidad,
              estado: 'completo',
              precioMayorista,
              precioVenta,
              descuento: 0,
              tipoDescuento: 'pesos'
            };
          });
        });
        
        console.log('✅ Productos inicializados:', productosInicial);
        setProductosArmados(productosInicial);
      }
    } catch (error) {
      console.error('Error cargando consolidación:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarMensajes = async () => {
    try {
      const res = await fetch(`/api/armar-consolidacion/${token}/mensajes`);
      const data = await res.json() as any;

      if (data.mensajes) {
        setMensajes(data.mensajes);
        
        const sinLeer = data.mensajes.filter(
          (m: any) => !m.leido && m.autorTipo === 'revendedora'
        ).length;
        setMensajesSinLeer(sinLeer);
      }
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    }
  };

  const marcarMensajesComoLeidos = async () => {
    try {
      await fetch(`/api/armar-consolidacion/${token}/mensajes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autorTipo: 'vendedora' })
      });
      await cargarMensajes();
    } catch (error) {
      console.error('Error marcando mensajes como leídos:', error);
    }
  };

  // ✅ Actualizar cantidad disponible
  const actualizarCantidad = (lineaId: string, cantidad: number) => {
    setProductosArmados(prev => {
      const producto = prev[lineaId];
      if (!producto) return prev;

      const cantidadFinal = Math.max(0, Math.min(cantidad, producto.cantidadPedida));

      let nuevoEstado: ProductoArmado['estado'];
      if (cantidadFinal === 0) {
        nuevoEstado = 'sin-stock';
      } else if (cantidadFinal < producto.cantidadPedida) {
        nuevoEstado = 'parcial';
      } else {
        nuevoEstado = 'completo';
      }

      return {
        ...prev,
        [lineaId]: {
          ...producto,
          cantidadDisponible: cantidadFinal,
          estado: nuevoEstado
        }
      };
    });
  };

  const marcarSinStock = (lineaId: string) => {
    actualizarCantidad(lineaId, 0);
  };

  // ✅ NUEVO: Aplicar descuento a una línea
  const aplicarDescuentoLinea = (lineaId: string, descuento: number, tipo: 'pesos' | 'porcentaje') => {
    setProductosArmados(prev => ({
      ...prev,
      [lineaId]: {
        ...prev[lineaId],
        descuento,
        tipoDescuento: tipo
      }
    }));
  };

  // ✅ NUEVO: Buscar productos para agregar
  const buscarProductos = async (query: string) => {
    if (query.length < 2) {
      setProductosDisponibles([]);
      return;
    }

    setBuscandoProductos(true);
    try {
      const res = await fetch(`/api/productos/buscar?q=${encodeURIComponent(query)}&limit=10`);
      const data = await res.json() as any;
      setProductosDisponibles(data.productos || []);
    } catch (error) {
      console.error('Error buscando productos:', error);
    } finally {
      setBuscandoProductos(false);
    }
  };

  // ✅ NUEVO: Agregar producto nuevo
  const agregarProducto = (producto: any) => {
    const nuevoProducto: ProductoAgregado = {
      id: `agregado-${Date.now()}`,
      sku: producto.sku,
      nombre: producto.name,
      marca: producto.brand,
      talle: producto.talle,
      color: producto.color,
      cantidad: 1,
      precioMayorista: producto.mayorista || 0,
      precioVenta: producto.venta || 0
    };

    setProductosAgregados(prev => [...prev, nuevoProducto]);
    setBusquedaProducto('');
    setProductosDisponibles([]);
    setMostrarAgregar(false);
  };

  // ✅ NUEVO: Actualizar cantidad de producto agregado
  const actualizarCantidadAgregado = (id: string, cantidad: number) => {
    setProductosAgregados(prev =>
      prev.map(p => p.id === id ? { ...p, cantidad: Math.max(1, cantidad) } : p)
    );
  };

  // ✅ NUEVO: Eliminar producto agregado
  const eliminarProductoAgregado = (id: string) => {
    setProductosAgregados(prev => prev.filter(p => p.id !== id));
  };

  // ✅ NUEVO: Calcular totales con descuentos
  const calcularTotales = () => {
    let totalMayoristaOriginal = 0;
    let totalMayoristaConDescuentos = 0;
    let totalVenta = 0;

    // Productos originales
    Object.values(productosArmados).forEach(producto => {
      const subtotalMayorista = producto.precioMayorista * producto.cantidadDisponible;
      const subtotalVenta = producto.precioVenta * producto.cantidadDisponible;

      totalMayoristaOriginal += subtotalMayorista;
      totalVenta += subtotalVenta;

      // Aplicar descuento por línea
      let descuentoLinea = 0;
      if (producto.descuento && producto.descuento > 0) {
        if (producto.tipoDescuento === 'pesos') {
          descuentoLinea = producto.descuento * producto.cantidadDisponible;
        } else {
          descuentoLinea = (subtotalMayorista * producto.descuento) / 100;
        }
      }

      totalMayoristaConDescuentos += subtotalMayorista - descuentoLinea;
    });

    // Productos agregados
    productosAgregados.forEach(producto => {
      const subtotalMayorista = producto.precioMayorista * producto.cantidad;
      const subtotalVenta = producto.precioVenta * producto.cantidad;

      totalMayoristaOriginal += subtotalMayorista;
      totalMayoristaConDescuentos += subtotalMayorista;
      totalVenta += subtotalVenta;
    });

    // Aplicar descuento total
    let descuentoTotalAplicado = 0;
    if (descuentoTotal > 0) {
      if (tipoDescuentoTotal === 'pesos') {
        descuentoTotalAplicado = descuentoTotal;
      } else {
        descuentoTotalAplicado = (totalMayoristaConDescuentos * descuentoTotal) / 100;
      }
    }

    const totalFinal = Math.max(0, totalMayoristaConDescuentos - descuentoTotalAplicado);
    const gananciaEstimada = totalVenta - totalFinal;

    return {
      totalMayoristaOriginal,
      totalMayoristaConDescuentos,
      descuentoTotalAplicado,
      totalFinal,
      totalVenta,
      gananciaEstimada
    };
  };

  const calcularResumen = () => {
    const completos: any[] = [];
    const parciales: any[] = [];
    const sinStock: any[] = [];

    consolidacion?.pedidos?.forEach((pedido: any) => {
      pedido.items?.forEach((item: any) => {
        const producto = productosArmados[item.id];
        if (!producto) return;

        const info = {
          nombre: item.producto.name,
          marca: item.producto.brand,
          talle: item.producto.talle,
          color: item.producto.color,
          cantidadPedida: producto.cantidadPedida,
          cantidadDisponible: producto.cantidadDisponible
        };

        if (producto.estado === 'completo') {
          completos.push(info);
        } else if (producto.estado === 'parcial') {
          parciales.push(info);
        } else {
          sinStock.push(info);
        }
      });
    });

    return { completos, parciales, sinStock };
  };

  const handleFinalizarArmado = async () => {
    const resumen = calcularResumen();
    setShowResumen(true);
  };

  const confirmarFinalizarArmado = async () => {
    setMarcandoArmado(true);

    try {
      const resumen = calcularResumen();
      const totales = calcularTotales();

      // Enviar datos de armado CON descuentos y productos agregados
      const res = await fetch(`/api/armar-consolidacion/${token}/marcar-armado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productosArmados: Object.values(productosArmados),
          productosAgregados,
          descuentoTotal,
          tipoDescuentoTotal,
          totales: {
            totalMayoristaOriginal: totales.totalMayoristaOriginal,
            totalFinal: totales.totalFinal,
            totalVenta: totales.totalVenta,
            gananciaEstimada: totales.gananciaEstimada
          },
          resumen,
          armadoCompleto: true
        })
      });

      if (!res.ok) throw new Error('Error al marcar armado');

      // ✅ CORRECCIÓN: Cerrar modal primero, luego recargar
      setShowResumen(false);
      
      // Recargar consolidación
      await cargarConsolidacion();
      
      // Redirigir a pendientes de armado después de 500ms
      setTimeout(() => {
        window.location.href = '/admin/pendientes-armado';
      }, 500);

    } catch (error) {
      console.error('Error finalizando armado:', error);
      // Solo mostrar alert en caso de error
      alert('Error al finalizar el armado. Intentá de nuevo.');
      // No cerrar modal en caso de error para que el usuario pueda reintentar
    } finally {
      setMarcandoArmado(false);
    }
  };

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim()) return;

    setEnviandoMensaje(true);
    try {
      const res = await fetch(`/api/armar-consolidacion/${token}/mensajes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje: nuevoMensaje,
          autorNombre: 'Nadin',
          autorTipo: 'vendedora'
        })
      });

      if (!res.ok) throw new Error('Error enviando mensaje');

      setNuevoMensaje('');
      await cargarMensajes();
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      alert('Error al enviar el mensaje');
    } finally {
      setEnviandoMensaje(false);
    }
  };

  const handleVolver = () => {
    router.push('/admin/pendientes-armado');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando consolidación...</p>
        </div>
      </div>
    );
  }

  if (!consolidacion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Consolidación no encontrada</h1>
          <p className="text-gray-600 mt-2">El enlace puede estar vencido o ser inválido</p>
          <button
            onClick={handleVolver}
            className="mt-6 bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  const resumenActual = calcularResumen();
  const totales = calcularTotales();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleVolver}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            Volver a Pendientes de Armado
          </button>

          {consolidacion.armadoEn && (
            <div className="mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-600" size={24} />
                <div>
                  <p className="font-semibold text-green-900">Armado Completado</p>
                  <p className="text-green-700 text-sm">
                    {new Date(consolidacion.armadoEn).toLocaleString('es-AR')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Productos */}
          <div className="lg:col-span-2 space-y-6">
            {/* Productos Originales */}
            <div className="bg-white rounded-lg shadow-lg">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Productos del Pedido</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Ajustá cantidades y aplicá descuentos
                </p>
              </div>

              {consolidacion.pedidos?.map((pedido: any) => (
                <div key={pedido.id} className="border-b border-gray-200 last:border-0">
                  <div className="p-4 bg-gray-50">
                    <h3 className="font-semibold text-gray-900">
                      Cliente: {pedido.cliente}
                    </h3>
                  </div>

                  <div className="p-4 space-y-4">
                    {pedido.items?.map((item: any) => {
                      const producto = productosArmados[item.id];
                      if (!producto) return null;

                      return (
                        <div
                          key={item.id}
                          className={`border-2 rounded-lg p-4 ${
                            producto.estado === 'completo'
                              ? 'border-green-200 bg-green-50'
                              : producto.estado === 'parcial'
                              ? 'border-yellow-200 bg-yellow-50'
                              : 'border-red-200 bg-red-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">
                                {item.producto.name}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {item.producto.brand} • {item.producto.talle} • {item.producto.color}
                              </p>
                              <p className="text-sm text-gray-700 mt-1">
                                Mayorista: ${producto.precioMayorista} • Venta: ${producto.precioVenta}
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              {/* Cantidad */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => actualizarCantidad(item.id, producto.cantidadDisponible - 1)}
                                  disabled={!!consolidacion.armadoEn || producto.cantidadDisponible === 0}
                                  className="p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50"
                                >
                                  <Minus size={16} />
                                </button>

                                <div className="text-center">
                                  <input
                                    type="number"
                                    value={producto.cantidadDisponible}
                                    onChange={(e) => actualizarCantidad(item.id, parseInt((e.target as any).value) || 0)}
                                    disabled={!!consolidacion.armadoEn}
                                    className="w-20 text-center text-2xl font-bold border-2 rounded-lg py-1"
                                    min="0"
                                    max={producto.cantidadPedida}
                                  />
                                  <p className="text-xs text-gray-600">
                                    de {producto.cantidadPedida}
                                  </p>
                                </div>

                                <button
                                  onClick={() => actualizarCantidad(item.id, producto.cantidadDisponible + 1)}
                                  disabled={!!consolidacion.armadoEn || producto.cantidadDisponible >= producto.cantidadPedida}
                                  className="p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50"
                                >
                                  <Plus size={16} />
                                </button>
                              </div>

                              {/* ✅ NUEVO: Descuento por línea */}
                              {!consolidacion.armadoEn && (
                                <div className="flex items-center gap-2 mt-2">
                                  <select
                                    value={producto.tipoDescuento}
                                    onChange={(e) => aplicarDescuentoLinea(
                                      item.id,
                                      producto.descuento || 0,
                                      (e.target as any).value as 'pesos' | 'porcentaje'
                                    )}
                                    className="border rounded px-2 py-1 text-sm"
                                  >
                                    <option value="pesos">$</option>
                                    <option value="porcentaje">%</option>
                                  </select>
                                  <input
                                    type="number"
                                    value={producto.descuento || 0}
                                    onChange={(e) => aplicarDescuentoLinea(
                                      item.id,
                                      parseFloat((e.target as any).value) || 0,
                                      producto.tipoDescuento || 'pesos'
                                    )}
                                    placeholder="Descuento"
                                    className="w-24 border rounded px-2 py-1 text-sm"
                                    min="0"
                                  />
                                  <Tag size={16} className="text-orange-500" />
                                </div>
                              )}

                              {!consolidacion.armadoEn && producto.estado !== 'sin-stock' && (
                                <button
                                  onClick={() => marcarSinStock(item.id)}
                                  className="text-xs bg-red-500 text-white px-3 py-1 rounded"
                                >
                                  Sin Stock
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* ✅ NUEVO: Productos Agregados */}
            {!consolidacion.armadoEn && (
              <div className="bg-white rounded-lg shadow-lg">
                {mostrarAgregar ? (
                  // ✅ NUEVO: Componente integrado con búsqueda y modal
                  <div className="p-6">
                    <ProductSearchWithVariants
                      margen={margenUsuario}
                      onAgregar={(variante) => {
                        // Crear producto agregado desde variante seleccionada
                        const nuevoProducto: ProductoAgregado = {
                          id: `agregado-${Date.now()}`,
                          sku: variante.varianteSku,
                          nombre: variante.productoNombre,
                          marca: variante.productoBrand,
                          talle: variante.talle,
                          color: variante.color,
                          cantidad: variante.cantidad,
                          precioMayorista: variante.precioMayorista,
                          precioVenta: variante.precioVenta
                        };

                        setProductosAgregados(prev => [...prev, nuevoProducto]);
                        setMostrarAgregar(false);
                      }}
                      onCancelar={() => setMostrarAgregar(false)}
                    />
                  </div>
                ) : (
                  <>
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <ShoppingCart size={20} className="text-purple-500" />
                            Agregar Productos
                          </h2>
                          <p className="text-sm text-gray-600 mt-1">
                            Agregá productos que la revendedora pidió después
                          </p>
                        </div>
                        <button
                          onClick={() => setMostrarAgregar(true)}
                          className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 flex items-center gap-2"
                        >
                          <Plus size={20} />
                          Agregar
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {productosAgregados.length > 0 && (
                  <div className="p-4 space-y-3">
                    {productosAgregados.map((prod) => (
                      <div
                        key={prod.id}
                        className="border-2 border-purple-200 bg-purple-50 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{prod.nombre}</h4>
                            <p className="text-sm text-gray-600">
                              {prod.marca} • {prod.talle} • {prod.color}
                            </p>
                            <p className="text-sm text-gray-700 mt-1">
                              Mayorista: ${prod.precioMayorista} • Venta: ${prod.precioVenta}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => actualizarCantidadAgregado(prod.id, prod.cantidad - 1)}
                                className="p-2 border rounded-lg hover:bg-gray-100"
                              >
                                <Minus size={16} />
                              </button>

                              <input
                                type="number"
                                value={prod.cantidad}
                                onChange={(e) => actualizarCantidadAgregado(prod.id, parseInt((e.target as any).value) || 1)}
                                className="w-20 text-center text-2xl font-bold border-2 rounded-lg py-1"
                                min="1"
                              />

                              <button
                                onClick={() => actualizarCantidadAgregado(prod.id, prod.cantidad + 1)}
                                className="p-2 border rounded-lg hover:bg-gray-100"
                              >
                                <Plus size={16} />
                              </button>
                            </div>

                            <button
                              onClick={() => eliminarProductoAgregado(prod.id)}
                              className="text-xs bg-red-500 text-white px-3 py-1 rounded"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ✅ NUEVO: Descuento Total */}
            {!consolidacion.armadoEn && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="text-orange-500" size={20} />
                  Descuento Total
                </h3>
                <div className="flex items-center gap-4">
                  <select
                    value={tipoDescuentoTotal}
                    onChange={(e) => setTipoDescuentoTotal((e.target as any).value)}
                    className="border-2 rounded-lg px-4 py-3"
                  >
                    <option value="pesos">Pesos ($)</option>
                    <option value="porcentaje">Porcentaje (%)</option>
                  </select>
                  <input
                    type="number"
                    value={descuentoTotal}
                    onChange={(e) => setDescuentoTotal(parseFloat((e.target as any).value) || 0)}
                    placeholder="0"
                    className="flex-1 border-2 rounded-lg px-4 py-3 text-lg font-semibold"
                    min="0"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Este descuento se aplica sobre el total después de los descuentos por línea
                </p>
              </div>
            )}

            {/* Botón finalizar */}
            {!consolidacion.armadoEn && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <button
                  onClick={handleFinalizarArmado}
                  disabled={marcandoArmado}
                  className="w-full bg-pink-500 text-white py-4 rounded-lg font-semibold hover:bg-pink-600 disabled:bg-gray-300 text-lg flex items-center justify-center gap-2"
                >
                  <Send size={24} />
                  Finalizar Armado y Notificar
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Resumen */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Resumen</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Completos:</span>
                  <span className="font-semibold text-green-600">{resumenActual.completos.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Parciales:</span>
                  <span className="font-semibold text-yellow-600">{resumenActual.parciales.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sin stock:</span>
                  <span className="font-semibold text-red-600">{resumenActual.sinStock.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Agregados:</span>
                  <span className="font-semibold text-purple-600">{productosAgregados.length}</span>
                </div>
              </div>

              <div className="border-t-2 mt-4 pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">Total Original:</span>
                  <span className="font-bold">${totales.totalMayoristaOriginal.toFixed(2)}</span>
                </div>
                
                {(totales.totalMayoristaOriginal !== totales.totalMayoristaConDescuentos || descuentoTotal > 0) && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Con descuentos línea:</span>
                      <span className="text-orange-600">
                        ${totales.totalMayoristaConDescuentos.toFixed(2)}
                      </span>
                    </div>
                    {descuentoTotal > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Descuento total:</span>
                        <span className="text-orange-600">
                          -${totales.descuentoTotalAplicado.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-between text-lg border-t-2 pt-2">
                  <span className="font-bold text-gray-900">Total a cobrar:</span>
                  <span className="font-bold text-green-600 text-xl">
                    ${totales.totalFinal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-gray-600">Ganancia estimada:</span>
                  <span className="font-semibold text-purple-600">
                    ${totales.gananciaEstimada.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Chat */}
            <div className="bg-white rounded-lg shadow-lg">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle size={20} className="text-pink-500" />
                  <h3 className="font-semibold">Chat</h3>
                  {mensajesSinLeer > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {mensajesSinLeer}
                    </span>
                  )}
                </div>
              </div>

              <div className="h-96 overflow-y-auto p-4 space-y-3">
                {mensajes.map((mensaje: any) => (
                  <div
                    key={mensaje.id}
                    className={`p-3 rounded-lg ${
                      mensaje.autorTipo === 'vendedora'
                        ? 'bg-pink-100 ml-8'
                        : 'bg-gray-100 mr-8'
                    }`}
                  >
                    <p className="text-xs text-gray-600 mb-1">
                      {mensaje.autorNombre} - {new Date(mensaje.createdAt).toLocaleTimeString('es-AR')}
                    </p>
                    <p className="text-sm">{mensaje.mensaje}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje((e.target as any).value)}
                    onKeyPress={(e) => e.key === 'Enter' && enviarMensaje()}
                    placeholder="Escribí un mensaje..."
                    className="flex-1 border rounded-lg px-4 py-2"
                    disabled={enviandoMensaje}
                  />
                  <button
                    onClick={enviarMensaje}
                    disabled={enviandoMensaje || !nuevoMensaje.trim()}
                    className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 disabled:bg-gray-300"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Documentos */}
        {consolidacion.armadoEn && (
          <div className="mt-6">
            <DocumentosConsolidacion
              token={token}
              consolidacionId={consolidacion.id}
              userId={consolidacion.userId}
            />
          </div>
        )}
      </div>

      {/* Modal Resumen */}
      {showResumen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-4">Confirmar Armado</h2>
            
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Resumen del Stock:</h3>
                <ul className="space-y-1 text-sm">
                  <li className="text-green-600">✓ {resumenActual.completos.length} productos completos</li>
                  <li className="text-yellow-600">⚠ {resumenActual.parciales.length} productos parciales</li>
                  <li className="text-red-600">✗ {resumenActual.sinStock.length} sin stock</li>
                  <li className="text-purple-600">+ {productosAgregados.length} productos agregados</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Totales:</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total original:</span>
                    <span className="font-semibold">${totales.totalMayoristaOriginal.toFixed(2)}</span>
                  </div>
                  {totales.totalMayoristaOriginal !== totales.totalFinal && (
                    <>
                      <div className="flex justify-between text-orange-600">
                        <span>Descuentos aplicados:</span>
                        <span className="font-semibold">
                          -${(totales.totalMayoristaOriginal - totales.totalFinal).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total a cobrar:</span>
                        <span className="text-green-600">${totales.totalFinal.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowResumen(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarFinalizarArmado}
                disabled={marcandoArmado}
                className="flex-1 px-4 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:bg-gray-300 font-semibold"
              >
                {marcandoArmado ? 'Finalizando...' : 'Confirmar Armado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
