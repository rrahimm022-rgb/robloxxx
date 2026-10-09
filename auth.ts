import NextAuth from 'next-auth';
import Discord from 'next-auth/providers/discord';
import { prisma } from '@/lib/prisma';

// Discord OAuth authorization-code flow. Only basic identity scopes are requested.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Discord({ clientId: process.env.AUTH_DISCORD_ID!, clientSecret: process.env.AUTH_DISCORD_SECRET!, authorization: { params: { scope: 'identify email' } } })],
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ profile, account, user }) {
      const discordId = profile?.id ? String(profile.id) : account?.providerAccountId;
      if (!discordId) return false;
      await prisma.user.upsert({
        where: { discordId },
        create: { discordId, name: user.name || (profile as { username?: string } | undefined)?.username || 'Discord creator', email: user.email, image: user.image, tokens: 25 },
        update: { name: user.name || (profile as { username?: string } | undefined)?.username || 'Discord creator', email: user.email, image: user.image }
      });
      return true;
    },
    async jwt({ token, profile, account }) {
      if (profile?.id) token.discordId = String(profile.id);
      else if (account?.provider === 'discord') token.discordId = account.providerAccountId;
      if (token.discordId) {
        const dbUser = await prisma.user.findUnique({ where: { discordId: String(token.discordId) }, select: { id: true, discordId: true } });
        if (dbUser) { token.dbUserId = dbUser.id; token.discordId = dbUser.discordId; }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.dbUserId) {
        (session.user as typeof session.user & { id: string; discordId: string }).id = String(token.dbUserId);
        (session.user as typeof session.user & { discordId: string }).discordId = String(token.discordId ?? '');
      }
      return session;
    }
  },
  pages: { signIn: '/' },
  trustHost: true
});
