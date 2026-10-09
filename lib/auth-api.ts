// lib/auth-api.ts
// Quién hace el pedido a la API. El middleware valida la cookie de sesión y deja
// el resultado en estos encabezados (y borra los que vengan del navegador).
import { NextResponse } from 'next/server';

export const H_UID = 'x-nadin-uid';
export const H_ROL = 'x-nadin-rol';

export interface SesionApi { uid: string; rol: string; admin: boolean }

export function sesionApi(req: Request): SesionApi | null {
  const uid = req.headers.get(H_UID);
  if (!uid) return null;
  const rol = req.headers.get(H_ROL) || 'revendedora';
  return { uid, rol, admin: rol === 'vendedora' };
}

export const sinSesion = () => NextResponse.json({ error: 'Tenés que iniciar sesión de nuevo.', code: 'NO_SESSION' }, { status: 401 });
export const prohibido = () => NextResponse.json({ error: 'No tenés permiso para esto.' }, { status: 403 });

/** ¿Puede esta sesión tocar datos de `userId`? (la dueña o Nadin) */
export function puedeVer(s: SesionApi | null, userId: string | null | undefined): boolean {
  return !!s && (s.admin || (!!userId && s.uid === userId));
}

/**
 * El userId con el que debe trabajar la ruta: el de la sesión.
 * Solo Nadin (vendedora) puede actuar sobre otra usuaria pasando su id.
 */
export function usuarioEfectivo(req: Request, pedido?: string | null): string | null {
  const s = sesionApi(req);
  if (!s) return null;
  return s.admin && pedido ? String(pedido) : s.uid;
}
