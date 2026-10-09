import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { esSituacionValida, normalizarCuit } from '@/lib/fiscal';
import { usuarioEfectivo, sesionApi, prohibido } from '@/lib/auth-api';

interface UpdateProfileBody {
  userId: string;
  name?: string;
  telefono?: string;
  handle?: string;
  margen?: string | number;
  cbu?: string;
  alias?: string;
  cvu?: string;
  profilePhoto?: string;
  bio?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  whatsappBusiness?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
  website?: string;
  situacionFiscal?: string;
  cuit?: string;
  razonSocial?: string;
}

// GET - Obtener perfil del usuario
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = usuarioEfectivo(req, searchParams.get('userId'));

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        dni: true,
        telefono: true,
        handle: true,
        margen: true,
        cbu: true,
        alias: true,
        cvu: true,
        profilePhoto: true,
        bio: true,
        instagram: true,
        facebook: true,
        tiktok: true,
        whatsappBusiness: true,
        linkedin: true,
        twitter: true,
        youtube: true,
        website: true,
        situacionFiscal: true,
        cuit: true,
        razonSocial: true,
        createdAt: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);

  } catch (error) {
    console.error('❌ Error obteniendo perfil:', error);
    return NextResponse.json(
      { error: 'Error al obtener perfil' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar perfil del usuario
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as UpdateProfileBody;
    const { userId: userIdBody, ...updateData } = body;
    const userId = usuarioEfectivo(req, userIdBody);

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    // Validar que el handle sea único si se está cambiando
    if (updateData.handle) {
      const existing = await prisma.user.findFirst({
        where: {
          handle: updateData.handle,
          NOT: { id: userId }
        }
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Este handle ya está en uso' },
          { status: 400 }
        );
      }
    }

    // Datos fiscales: solo la propia usuaria logueada y con CUIT válido si no es Consumidor Final
    let fiscal: { situacionFiscal?: string; cuit?: string | null; razonSocial?: string | null } = {};
    const actual = updateData.situacionFiscal !== undefined
      ? await prisma.user.findUnique({ where: { id: userId }, select: { situacionFiscal: true, cuit: true, razonSocial: true } })
      : null;
    const cambioFiscal = !!actual && (
      String(updateData.situacionFiscal || 'CF') !== actual.situacionFiscal ||
      (updateData.situacionFiscal !== 'CF' && (
        String(updateData.cuit || '').replace(/\D/g, '') !== (actual.cuit || '') ||
        String(updateData.razonSocial || '').trim() !== (actual.razonSocial || '')
      ))
    );
    if (cambioFiscal) {
      const session = await getSession();
      if (!session || session.uid !== userId) {
        return NextResponse.json({ error: 'Volvé a iniciar sesión para cambiar tus datos fiscales' }, { status: 401 });
      }
      const sf = String(updateData.situacionFiscal || 'CF');
      if (!esSituacionValida(sf)) {
        return NextResponse.json({ error: 'Situación fiscal inválida' }, { status: 400 });
      }
      if (sf === 'CF') {
        fiscal = { situacionFiscal: 'CF', cuit: null, razonSocial: null };
      } else {
        const cuit = normalizarCuit(updateData.cuit);
        if (!cuit) return NextResponse.json({ error: 'El CUIT no es válido (son 11 números)' }, { status: 400 });
        const razon = String(updateData.razonSocial || '').trim();
        if (!razon) return NextResponse.json({ error: 'Completá la razón social' }, { status: 400 });
        fiscal = { situacionFiscal: sf, cuit, razonSocial: razon.slice(0, 120) };
      }
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: updateData.name,
        telefono: updateData.telefono,
        handle: updateData.handle,
        margen: updateData.margen ? parseFloat(updateData.margen.toString()) : undefined,
        cbu: updateData.cbu || null,
        alias: updateData.alias || null,
        cvu: updateData.cvu || null,
        profilePhoto: updateData.profilePhoto || null,
        bio: updateData.bio || null,
        instagram: updateData.instagram || null,
        facebook: updateData.facebook || null,
        tiktok: updateData.tiktok || null,
        whatsappBusiness: updateData.whatsappBusiness || null,
        linkedin: updateData.linkedin || null,
        twitter: updateData.twitter || null,
        youtube: updateData.youtube || null,
        website: updateData.website || null,
        ...fiscal,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        dni: true,
        telefono: true,
        handle: true,
        margen: true,
        cbu: true,
        alias: true,
        cvu: true,
        profilePhoto: true,
        bio: true,
        instagram: true,
        facebook: true,
        tiktok: true,
        whatsappBusiness: true,
        linkedin: true,
        twitter: true,
        youtube: true,
        website: true,
        situacionFiscal: true,
        cuit: true,
        razonSocial: true
      }
    });

    console.log('✅ Perfil actualizado:', userId);

    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error('❌ Error actualizando perfil:', error);
    return NextResponse.json(
      { error: 'Error al actualizar perfil' },
      { status: 500 }
    );
  }
}
