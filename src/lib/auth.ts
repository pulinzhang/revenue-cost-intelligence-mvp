import type { DefaultSession, NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { env } from "@/lib/env";
import { query } from "@/lib/db";
import type { AppUser, DbUser, UserRole } from "@/types/user";
import { registerSchema } from "@/lib/validators/user.schema";

async function findUserByEmail(email: string): Promise<DbUser | null> {
  const res = await query<DbUser>(
    `select id, email, password_hash, provider, role
     from users
     where lower(email) = lower($1)
     limit 1`,
    [email],
  );
  return res.rows[0] ?? null;
}

async function ensureAzureUser(email: string): Promise<DbUser> {
  const existing = await findUserByEmail(email);
  if (existing) return existing;

  const res = await query<DbUser>(
    `insert into users (email, password_hash, provider, role)
     values ($1, null, 'azure', 'user')
     returning id, email, password_hash, provider, role`,
    [email],
  );
  return res.rows[0]!;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    ...(env.azureAdClientId && env.azureAdClientSecret && env.azureAdTenantId
      ? [
          AzureADProvider({
            clientId: env.azureAdClientId,
            clientSecret: env.azureAdClientSecret,
            tenantId: env.azureAdTenantId,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = registerSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await findUserByEmail(parsed.data.email);
        if (!user) return null;
        if (user.provider !== "local") return null;
        if (!user.password_hash) return null;

        const ok = await compare(parsed.data.password, user.password_hash);
        if (!ok) return null;

        const appUser: AppUser = { id: user.id, email: user.email, role: user.role };
        return appUser;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Azure sign-in: auto-provision user on first login only
      if (account?.provider === "azure-ad" && user.email) {
        await ensureAzureUser(user.email);
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Credentials sign-in
      if (user) {
        const u = user as Partial<AppUser>;
        if (u.id) token.userId = u.id;
        if (u.role) token.role = u.role;
      }

      // Azure: get user info from DB on each token refresh
      if (account?.provider === "azure-ad" && token.email) {
        const dbUser = await findUserByEmail(String(token.email));
        if (dbUser) {
          token.userId = dbUser.id;
          token.role = dbUser.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId;
        session.user.role = token.role;
      }
      return session;
    },
  },
};

declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id?: string;
      role?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: string;
  }
}
