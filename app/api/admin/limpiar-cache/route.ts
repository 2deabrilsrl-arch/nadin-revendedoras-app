import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    console.log('🗑️ Limpiando cache...');
    
    const result = await prisma.catalogoCache.deleteMany({});
    
    console.log(`✅ ${result.count} productos eliminados`);
    
    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `✅ Cache limpio: ${result.count} productos eliminados`
    });
  } catch (error) {
    console.error('❌ Error limpiando cache:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error' 
    }, { status: 500 });
  }
}