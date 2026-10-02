// lib/session.ts
// Sesión segura del lado del servidor: cookie httpOnly firmada (JWT HS256).
// Las APIs de Tiendas Nadin usan SOLO esto para saber quién es la usuaria.
// No confiar nunca en userId / rol que lleguen del navegador.

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const SESSION_COOKIE = 'nadin_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 días

export interface SessionPayload {
  uid: string;
  rol: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET no configurado (mínimo 32 caracteres)');
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ rol: payload.rol })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.uid)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] });
    if (!payload.sub) return null;
    return { uid: payload.sub, rol: String(payload.rol || 'revendedora') };
  } catch {
    return null;
  }
}

/** Setea la cookie de sesión en una respuesta (usar en login). */
export async function attachSessionCookie(res: NextResponse, payload: SessionPayload) {
  const token = await createSessionToken(payload);
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

/** Lee la sesión desde la cookie (route handlers / server components). */
export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

/**
 * Devuelve la usuaria logueada (rol tomado de la BASE, no del token)
 * o null si no hay sesión válida.
 */
export async function getSessionUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { id: true, email: true, name: true, handle: true, margen: true, rol: true, telefono: true },
  });
  return user;
}
