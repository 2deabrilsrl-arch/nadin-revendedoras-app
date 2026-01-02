// SCRIPT DE RECÁLCULO MASIVO - CORRIGE GAMIFICACIÓN DE TODOS LOS USUARIOS
// Ubicación: app/api/admin/recalcular-gamificacion-completa/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Función auxiliar para calcular nivel
function calculateUserLevel(salesCount: number): string {
  if (salesCount >= 500) return 'leyenda';
  if (salesCount >= 200) return 'diamante';
  if (salesCount >= 100) return 'oro';
  if (salesCount >= 50) return 'plata';
  if (salesCount >= 10) return 'bronce';
  return 'principiante';
}

// Función auxiliar para calcular puntos
function calculateSalePoints(amount: number, isFirstSale: boolean): number {
  const basePoints = Math.floor(amount / 1000) * 10;
  const firstSaleBonus = isFirstSale ? 50 : 0;
  return basePoints + firstSaleBonus;
}

export async function POST() {
  try {
    console.log('\n🔄 ========================================');
    console.log('🔄 RECÁLCULO MASIVO DE GAMIFICACIÓN');
    console.log('🔄 ========================================\n');

    // 1. Obtener todos los usuarios
    const usuarios = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    console.log(`📊 Total usuarios a procesar: ${usuarios.length}\n`);

    const resultados: any[] = [];
    let usuariosProcesados = 0;
    let usuariosConCambios = 0;
    let puntosOtorgadosTotal = 0;

    // 2. Procesar cada usuario
    for (const usuario of usuarios) {
      console.log(`\n👤 Procesando: ${usuario.name} (${usuario.email})`);
      
      try {
        // ✅ Buscar pedidos PAGADOS A NADIN (no cancelados)
        const pedidosPagados = await prisma.pedido.findMany({
          where: {
            userId: usuario.id,
            paidToNadin: true,  // ← CRITERIO CORRECTO
            NOT: {
              estado: 'cancelado'
            }
          },
          include: {
            lineas: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        });

        console.log(`   📦 Pedidos pagados a Nadin: ${pedidosPagados.length}`);

        if (pedidosPagados.length === 0) {
          console.log(`   ⚠️ Sin pedidos pagados, saltando...`);
          resultados.push({
            userId: usuario.id,
            nombre: usuario.name,
            pedidosPagados: 0,
            puntosAnteriores: 0,
            puntosNuevos: 0,
            cambios: false
          });
          continue;
        }

        // 3. Obtener puntos anteriores
        const puntosAnteriores = await prisma.point.findMany({
          where: { userId: usuario.id }
        });

        const totalPuntosAnteriores = puntosAnteriores.reduce((sum, p) => sum + p.amount, 0);

        // 4. LIMPIAR puntos antiguos de ventas, badges y niveles
        await prisma.point.deleteMany({
          where: {
            userId: usuario.id,
            reason: {
              in: ['sale', 'badge', 'level_up', 'init']
            }
          }
        });

        console.log(`   🗑️ Puntos antiguos eliminados`);

        // 5. RECALCULAR puntos por cada venta
        let puntosNuevos = 0;

        for (let i = 0; i < pedidosPagados.length; i++) {
          const pedido = pedidosPagados[i];
          const isFirstSale = (i === 0);

          // Calcular monto de venta
          const montoVenta = pedido.lineas.reduce((sum, linea) => {
            return sum + (linea.venta * linea.qty);
          }, 0);

          const puntos = calculateSalePoints(montoVenta, isFirstSale);

          await prisma.point.create({
            data: {
              userId: usuario.id,
              amount: puntos,
              reason: 'sale',
              description: `Venta de $${montoVenta.toFixed(0)}${isFirstSale ? ' (Primera venta +50 bonus)' : ''}`
            }
          });

          puntosNuevos += puntos;
        }

        console.log(`   💎 Puntos por ventas: ${puntosNuevos}`);

        // 6. RECALCULAR nivel
        const nuevoNivel = calculateUserLevel(pedidosPagados.length);

        await prisma.userLevel.upsert({
          where: { userId: usuario.id },
          create: {
            userId: usuario.id,
            currentLevel: nuevoNivel,
            currentXP: pedidosPagados.length,
            totalSales: pedidosPagados.length
          },
          update: {
            currentLevel: nuevoNivel,
            currentXP: pedidosPagados.length,
            totalSales: pedidosPagados.length
          }
        });

        console.log(`   🎯 Nivel: ${nuevoNivel} (${pedidosPagados.length} ventas)`);

        // 7. ASIGNAR badges según ventas
        const badgesToCheck = [
          { slug: 'primera-venta', minSales: 1 },
          { slug: '10-ventas', minSales: 10 },
          { slug: '50-ventas', minSales: 50 },
          { slug: '100-ventas', minSales: 100 },
          { slug: '200-ventas', minSales: 200 },
          { slug: '500-ventas', minSales: 500 }
        ];

        let badgesAsignados = 0;

        for (const { slug, minSales } of badgesToCheck) {
          if (pedidosPagados.length >= minSales) {
            const badge = await prisma.badge.findUnique({
              where: { slug }
            });

            if (badge) {
              // Verificar si ya tiene el badge
              const existing = await prisma.userBadge.findUnique({
                where: {
                  userId_badgeId: {
                    userId: usuario.id,
                    badgeId: badge.id
                  }
                }
              });

              if (!existing) {
                // Asignar badge
                await prisma.userBadge.create({
                  data: {
                    userId: usuario.id,
                    badgeId: badge.id
                  }
                });

                // Otorgar puntos por badge
                await prisma.point.create({
                  data: {
                    userId: usuario.id,
                    amount: badge.points,
                    reason: 'badge',
                    description: `Badge desbloqueado: ${badge.name}`
                  }
                });

                puntosNuevos += badge.points;
                badgesAsignados++;
                console.log(`   🏅 Badge: ${badge.name} (+${badge.points} pts)`);
              }
            }
          }
        }

        // 8. Guardar resultado
        resultados.push({
          userId: usuario.id,
          nombre: usuario.name,
          pedidosPagados: pedidosPagados.length,
          puntosAnteriores: totalPuntosAnteriores,
          puntosNuevos,
          nivel: nuevoNivel,
          badgesAsignados,
          cambios: true
        });

        usuariosProcesados++;
        if (puntosNuevos !== totalPuntosAnteriores) {
          usuariosConCambios++;
        }
        puntosOtorgadosTotal += puntosNuevos;

        console.log(`   ✅ Usuario procesado correctamente`);

      } catch (error) {
        console.error(`   ❌ Error procesando usuario ${usuario.name}:`, error);
        resultados.push({
          userId: usuario.id,
          nombre: usuario.name,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }

    console.log('\n========================================');
    console.log('🎉 RECÁLCULO COMPLETADO');
    console.log('========================================');
    console.log(`✅ Usuarios procesados: ${usuariosProcesados}/${usuarios.length}`);
    console.log(`📊 Usuarios con cambios: ${usuariosConCambios}`);
    console.log(`💎 Puntos otorgados en total: ${puntosOtorgadosTotal}`);
    console.log('========================================\n');

    return NextResponse.json({
      success: true,
      mensaje: 'Recálculo masivo completado',
      resumen: {
        totalUsuarios: usuarios.length,
        usuariosProcesados,
        usuariosConCambios,
        puntosOtorgadosTotal
      },
      detalles: resultados
    });

  } catch (error) {
    console.error('❌ Error en recálculo masivo:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
