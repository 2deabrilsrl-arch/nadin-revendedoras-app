export default function DashboardHome() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Bienvenida al Dashboard</h2>
      <div className="grid grid-cols-2 gap-4">
        <a href="/dashboard/catalogo" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="font-bold text-lg mb-2">📦 Productos</h3>
          <p className="text-gray-600 text-sm">Ver catálogo completo</p>
        </a>
        <a href="/dashboard/best%20sellers" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="font-bold text-lg mb-2">🔥 Más Vendidos</h3>
          <p className="text-gray-600 text-sm">Los productos top</p>
        </a>
        <a href="/dashboard/pedidos" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="font-bold text-lg mb-2">🛍️ Mis Pedidos</h3>
          <p className="text-gray-600 text-sm">Gestionar pedidos</p>
        </a>
        <a href="/dashboard/consolidar" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="font-bold text-lg mb-2">📤 Consolidar</h3>
          <p className="text-gray-600 text-sm">Enviar a Nadin</p>
        </a>
        <a href="/dashboard/catalogos-digitales" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="font-bold text-lg mb-2">📚 Catálogos Digitales</h3>
          <p className="text-gray-600 text-sm">Descargar catálogos</p>
        </a>
        <a href="/dashboard/perfil" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="font-bold text-lg mb-2">👤 Mi Perfil</h3>
          <p className="text-gray-600 text-sm">Configuración</p>
        </a>
      </div>
    </div>
  );
}
