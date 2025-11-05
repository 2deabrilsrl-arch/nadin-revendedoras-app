// Script para inicializar la base de datos
// Ejecutar con: node scripts/init-db.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando configuración de base de datos...\n');

  // 1. Crear usuario de prueba
  console.log('👤 Creando usuario de prueba...');
  
  const hashedPassword = await bcrypt.hash('nadin123', 10);
  
  try {
    const user = await prisma.user.upsert({
      where: { email: 'nadinlenceria@gmail.com' },
      update: {},
      create: {
        email: 'nadinlenceria@gmail.com',
        name: 'Nadin Lencería',
        handle: 'nadin',
        password: hashedPassword,
        telefono: '341-1234567',
        margen: 60,
        role: 'admin'
      }
    });
    console.log('✅ Usuario creado:', user.email);
  } catch (error) {
    console.log('⚠️  Usuario ya existe o error:', error.message);
  }

  // 2. Verificar conexión con Tiendanube
  console.log('\n🔗 Verificando conexión con Tiendanube...');
  console.log('Store ID:', process.env.TN_STORE_ID);
  console.log('API Base:', process.env.TN_API_BASE);
  console.log('Token configurado:', process.env.TN_ACCESS_TOKEN ? 'Sí' : 'No');

  // 3. Sincronizar productos (llamar a la API)
  console.log('\n📦 Para sincronizar productos, ejecutá:');
  console.log('   http://localhost:3000/api/catalogo?sync=true');
  console.log('   (Abrí esta URL en tu navegador con el servidor corriendo)\n');

  console.log('✅ Configuración completada!\n');
  console.log('📝 Credenciales de acceso:');
  console.log('   Email: nadinlenceria@gmail.com');
  console.log('   Contraseña: nadin123\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
