// lib/session-edge.ts
// Verificación de la cookie de sesión apta para el middleware (Edge): sin Prisma ni next/headers.
import { jwtVerify } from 'jose';

export const SESSION_COOKIE = 'nadin_session';

export interface SesionEdge { uid: string; rol: string }

export async function verificarSesionEdge(token: string | undefined | null): Promise<SesionEdge | null> {
  const secret = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET;
  if (!token || !secret || secret.length < 32) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ['HS256'] });
    if (!payload.sub) return null;
    return { uid: payload.sub, rol: String(payload.rol || 'revendedora') };
  } catch {
    return null;
  }
}
