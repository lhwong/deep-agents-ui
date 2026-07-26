import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";

export const authConfig = {
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // PKCE requires storing a verifier in an encrypted cookie; on Cloud Run
      // the cookie can't be decrypted if AUTH_SECRET is absent or mismatched.
      // Server-side confidential clients (with client_secret) don't need PKCE —
      // state-only is sufficient CSRF protection.
      checks: ["state"],
    }),
    // GitHub Provider
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      checks: ["state"],
    }),
    // Simple Credentials Provider for local testing
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "admin" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Replace this with your own logic/database check
        if (
          credentials?.username === "admin" &&
          credentials?.password === "password"
        ) {
          return { id: "1", name: "Admin User", email: "admin@example.com" };
        }
        return null;
      },
    }),
  ],

  pages: {
    signIn: "/login", // Optional: Link to a custom login page
  },
  callbacks: {
    async signIn(_params) {
      return true;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.id_token || account.access_token;
        token.provider = account.provider;
        token.sub = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.provider = token.provider as string;
      if (session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
