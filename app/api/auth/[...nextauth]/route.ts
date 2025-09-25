import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      if (isNewUser && user.id) {
        // Store session in Upstash Redis for new users
        await redis.set(`user:session:${user.id}`, JSON.stringify({
          userId: user.id,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        }));
      }
    },
    async signOut({ session, token }) {
      if (session?.user?.id) {
        // Remove session from Upstash Redis on sign out
        await redis.del(`user:session:${session.user.id}`);
      }
    },
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
