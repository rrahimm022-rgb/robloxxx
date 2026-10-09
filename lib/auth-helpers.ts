import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
export async function getCurrentUser() {
  const session = await auth();
  const discordId = (session?.user as { discordId?: string } | undefined)?.discordId;
  if (!session?.user?.id || !discordId) return null;
  return prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, discordId: true, name: true, image: true, tokens: true } });
}
export function jsonError(message: string, status = 400) { return NextResponse.json({ error: message }, { status }); }
export function isAdmin(discordId: string) { return (process.env.ADMIN_DISCORD_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean).includes(discordId); }
