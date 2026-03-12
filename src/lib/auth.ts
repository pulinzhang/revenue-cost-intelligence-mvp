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
  trustHost: true,
  providers: [
    ...(env.azureAdClientId && env.azureAdClientSecret && env.azureAdTenantId
      ? [
          (() => {
            console.log("Registering Azure AD provider with:", {
              clientId: env.azureAdClientId,
              tenantId: env.azureAdTenantId,
            });
            return AzureADProvider({
              clientId: env.azureAdClientId,
              clientSecret: env.azureAdClientSecret,
              tenantId: env.azureAdTenantId,
              authorization: {
                params: { scope: "openid profile email User.Read" },
              },
            });
          })(),
        ]
      : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        debugger;
        const parsed = registerSchema.safeParse(credentials);
        debugger;
        if (!parsed.success) return null;

        const user = await findUserByEmail(parsed.data.email);
        debugger;
        if (!user) return null;
        if (user.provider !== "local") return null;
        if (!user.password_hash) return null;

        const ok = await compare(parsed.data.password, user.password_hash);
        debugger;
        if (!ok) return null;

        const appUser: AppUser = { id: user.id, email: user.email, role: user.role };
        debugger;
        return appUser;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      debugger;
      console.log("signIn callback:", { provider: account?.provider, email: user?.email });
      // Azure sign-in: auto-provision user on first login only
      if (account?.provider === "azure-ad" && user.email) {
        await ensureAzureUser(user.email);
      }
      debugger;
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      debugger;
      console.log("jwt callback:", { provider: account?.provider, hasEmail: !!token.email, trigger, hasAccount: !!account });
      // Credentials sign-in
      if (user) {
        debugger;
        const u = user as Partial<AppUser>;
        if (u.id) token.userId = u.id;
        if (u.role) token.role = u.role;
      }

      // Azure: get user info from DB using token email
      if (token.email) {
        debugger;
        const dbUser = await findUserByEmail(String(token.email));
        if (dbUser) {
          token.userId = dbUser.id;
          token.role = dbUser.role;
          console.log("jwt: found DB user:", { id: dbUser.id, role: dbUser.role });
        }
      }

      debugger;
      return token;
    },
    async session({ session, token }) {
      debugger;
      console.log("session callback START:", { hasTokenUserId: !!token.userId, hasSessionUserId: !!session.user?.id, tokenKeys: Object.keys(token) });
      try {
        if (session.user) {
          debugger;
          session.user.id = token.userId;
          session.user.role = token.role;
        }
        debugger;
        console.log("session callback SUCCESS:", { userId: session.user?.id, role: session.user?.role });
        return session;
      } catch (err) {
        console.error("session callback ERROR:", err);
        debugger;
        throw err;
      }
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
