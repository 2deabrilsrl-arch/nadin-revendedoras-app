// Script para crear usuario de prueba en la base de datos
// Ejecutar: node scripts/crear-usuario-prueba.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔧 Creando usuario de prueba...');

    // Crear contraseña hasheada
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email: 'prueba@nadin.com',
        password: hashedPassword,
        name: 'Usuario Prueba',
        dni: '12345678',
        telefono: '341-1234567',
        handle: 'prueba',
        margen: 60,
      },
    });

    console.log('✅ Usuario creado exitosamente:');
    console.log('📧 Email: prueba@nadin.com');
    console.log('🔑 Contraseña: 123456');
    console.log('👤 Handle: prueba');
    console.log('💰 Margen: 60%');
    console.log('\n🎉 Ya podés iniciar sesión con estas credenciales');
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  El usuario ya existe en la base de datos');
      console.log('📧 Email: prueba@nadin.com');
      console.log('🔑 Contraseña: 123456');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
