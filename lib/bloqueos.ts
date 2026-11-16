// Usuarias bloqueadas por Nadin: no pueden iniciar sesión, recuperar la contraseña ni registrarse de nuevo,
// y su tienda deja de verse. Los datos se conservan. Se bloquea/desbloquea desde la base (campo "bloqueado").
import { prisma } from '@/lib/prisma';

export const MSJ_BLOQUEADA = 'Tu cuenta está suspendida. Si creés que es un error, comunicate con Nadin Lencería.';

/** ¿Hay una usuaria bloqueada con ese email, DNI o teléfono? (para no dejarla registrarse otra vez) */
export async function datosBloqueados(d: { email?: string | null; dni?: string | null; telefono?: string | null }) {
  const soloDig = (x?: string | null) => String(x || '').replace(/\D/g, '');
  const or: any[] = [];
  if (d.email) or.push({ email: { equals: String(d.email).trim(), mode: 'insensitive' } });
  if (soloDig(d.dni).length >= 6) or.push({ dni: soloDig(d.dni) });
  if (soloDig(d.telefono).length >= 8) or.push({ telefono: { contains: soloDig(d.telefono).slice(-8) } });
  if (!or.length) return false;
  const u = await prisma.user.findFirst({ where: { bloqueado: true, OR: or }, select: { id: true } });
  return !!u;
}
