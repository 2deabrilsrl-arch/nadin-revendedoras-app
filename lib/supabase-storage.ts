// lib/supabase-storage.ts
// Servicio para manejar archivos en Supabase Storage

import { createClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'consolidaciones-remitos';

/**
 * Crear cliente de Supabase (lazy initialization para evitar errores en build)
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // ✅ VALIDACIÓN: Verificar que las variables existen
  if (!supabaseUrl || !supabaseServiceKey) {
    const missing = [];
    if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    
    throw new Error(
      `❌ Faltan variables de entorno de Supabase: ${missing.join(', ')}\n` +
      `Configurarlas en Vercel → Settings → Environment Variables`
    );
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Subir un archivo a Supabase Storage
 */
export async function uploadDocumento(
  consolidacionId: string,
  file: File,
  userId: string
): Promise<{
  success: boolean;
  filename?: string;
  storageUrl?: string;
  publicUrl?: string;
  error?: string;
}> {
  try {
    const supabase = getSupabaseClient();
    
    // Generar nombre único
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `remito_${consolidacionId}_${timestamp}.${extension}`;
    const filepath = `${consolidacionId}/${filename}`;

    console.log('📤 Subiendo archivo a Supabase Storage...');
    console.log('   Bucket:', BUCKET_NAME);
    console.log('   Path:', filepath);
    console.log('   Size:', file.size, 'bytes');

    // Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir archivo
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filepath, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('❌ Error subiendo archivo:', error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log('✅ Archivo subido:', data.path);

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filepath);

    return {
      success: true,
      filename,
      storageUrl: data.path,
      publicUrl: publicUrlData.publicUrl
    };

  } catch (error) {
    console.error('❌ Error en uploadDocumento:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Eliminar un archivo de Supabase Storage
 */
export async function deleteDocumento(
  storageUrl: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = getSupabaseClient();
    
    console.log('🗑️ Eliminando archivo de Supabase Storage...');
    console.log('   Path:', storageUrl);

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([storageUrl]);

    if (error) {
      console.error('❌ Error eliminando archivo:', error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log('✅ Archivo eliminado');

    return {
      success: true
    };

  } catch (error) {
    console.error('❌ Error en deleteDocumento:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Listar documentos de una consolidación
 */
export async function listDocumentos(
  consolidacionId: string
): Promise<{
  success: boolean;
  files?: any[];
  error?: string;
}> {
  try {
    const supabase = getSupabaseClient();
    
    console.log('📋 Listando archivos de consolidación:', consolidacionId);

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(consolidacionId);

    if (error) {
      console.error('❌ Error listando archivos:', error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log('✅ Archivos encontrados:', data.length);

    return {
      success: true,
      files: data
    };

  } catch (error) {
    console.error('❌ Error en listDocumentos:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Verificar si el bucket existe, si no crearlo
 */
export async function ensureBucketExists(): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    
    // Verificar si existe
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some(b => b.name === BUCKET_NAME);

    if (exists) {
      console.log('✅ Bucket ya existe:', BUCKET_NAME);
      return true;
    }

    // Crear bucket
    console.log('📦 Creando bucket:', BUCKET_NAME);
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true, // Archivos públicos para que la revendedora pueda descargar
      fileSizeLimit: 10485760 // 10MB
    });

    if (error) {
      console.error('❌ Error creando bucket:', error);
      return false;
    }

    console.log('✅ Bucket creado exitosamente');
    return true;

  } catch (error) {
    console.error('❌ Error en ensureBucketExists:', error);
    return false;
  }
}
