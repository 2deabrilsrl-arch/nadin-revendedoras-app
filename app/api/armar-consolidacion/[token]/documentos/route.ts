// API: Subir documentos a consolidación - CORREGIDO
// Ubicación: app/api/armar-consolidacion/[token]/documentos/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadDocumento, deleteDocumento } from '@/lib/supabase-storage';

/**
 * GET - Listar documentos de la consolidación
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // ✅ CORREGIDO: Buscar consolidación con relación one-to-one
    const consolidacion = await prisma.consolidacion.findFirst({
      where: {
        accessTokens: {
          token: token,
          expiresAt: {
            gt: new Date()
          }
        }
      },
      include: {
        documentos: {
          orderBy: {
            uploadedAt: 'desc'
          }
        }
      }
    });

    if (!consolidacion) {
      return NextResponse.json(
        { error: 'Consolidación no encontrada o token expirado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      documentos: consolidacion.documentos
    });

  } catch (error) {
    console.error('❌ Error obteniendo documentos:', error);
    return NextResponse.json(
      { error: 'Error al obtener documentos' },
      { status: 500 }
    );
  }
}

/**
 * POST - Subir nuevo documento
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // ✅ CORREGIDO: Buscar consolidación con relación one-to-one
    const consolidacion = await prisma.consolidacion.findFirst({
      where: {
        accessTokens: {
          token: token,
          expiresAt: {
            gt: new Date()
          }
        }
      }
    });

    if (!consolidacion) {
      return NextResponse.json(
        { error: 'Consolidación no encontrada o token expirado' },
        { status: 404 }
      );
    }

    // Obtener archivo del FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'Archivo no proporcionado' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo (solo PDF)
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Solo se permiten archivos PDF' },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo de 10MB' },
        { status: 400 }
      );
    }

    console.log('📄 Subiendo documento...');
    console.log('   Consolidación:', consolidacion.id);
    console.log('   Archivo:', file.name);
    console.log('   Tamaño:', file.size, 'bytes');

    // Subir a Supabase Storage
    const uploadResult = await uploadDocumento(
      consolidacion.id,
      file,
      userId || 'unknown'
    );

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error || 'Error al subir archivo' },
        { status: 500 }
      );
    }

    // Guardar referencia en BD
    const documento = await prisma.consolidacionDocumento.create({
      data: {
        consolidacionId: consolidacion.id,
        filename: uploadResult.filename!,
        originalName: file.name,
        storageUrl: uploadResult.storageUrl!,
        publicUrl: uploadResult.publicUrl!,
        fileSize: file.size,
        mimeType: file.type,
        uploadedBy: userId || 'unknown'
      }
    });

    console.log('✅ Documento guardado en BD:', documento.id);

    return NextResponse.json({
      success: true,
      documento: {
        id: documento.id,
        filename: documento.filename,
        originalName: documento.originalName,
        publicUrl: documento.publicUrl,
        fileSize: documento.fileSize,
        uploadedAt: documento.uploadedAt
      }
    });

  } catch (error) {
    console.error('❌ Error subiendo documento:', error);
    return NextResponse.json(
      { error: 'Error al subir documento' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Eliminar documento
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const { searchParams } = new URL(request.url);
    const documentoId = searchParams.get('documentoId');

    if (!documentoId) {
      return NextResponse.json(
        { error: 'documentoId requerido' },
        { status: 400 }
      );
    }

    // ✅ CORREGIDO: Buscar consolidación con relación one-to-one
    const consolidacion = await prisma.consolidacion.findFirst({
      where: {
        accessTokens: {
          token: token,
          expiresAt: {
            gt: new Date()
          }
        }
      }
    });

    if (!consolidacion) {
      return NextResponse.json(
        { error: 'Consolidación no encontrada o token expirado' },
        { status: 404 }
      );
    }

    // Buscar documento
    const documento = await prisma.consolidacionDocumento.findFirst({
      where: {
        id: documentoId,
        consolidacionId: consolidacion.id
      }
    });

    if (!documento) {
      return NextResponse.json(
        { error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    console.log('🗑️ Eliminando documento...');
    console.log('   ID:', documento.id);
    console.log('   Archivo:', documento.filename);

    // Eliminar de Supabase Storage
    const deleteResult = await deleteDocumento(documento.storageUrl);

    if (!deleteResult.success) {
      console.error('⚠️ Error eliminando archivo de storage, continuando...');
    }

    // Eliminar de BD
    await prisma.consolidacionDocumento.delete({
      where: { id: documentoId }
    });

    console.log('✅ Documento eliminado');

    return NextResponse.json({
      success: true,
      message: 'Documento eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando documento:', error);
    return NextResponse.json(
      { error: 'Error al eliminar documento' },
      { status: 500 }
    );
  }
}
