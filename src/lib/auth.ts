import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const DEMO_USER = { id: "demo-1", name: "데모 전문가", email: "demo@mindflow.kr", password: "password123" };

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET ?? "mindflow-dev-secret-key-local",
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (credentials?.email === DEMO_USER.email && credentials?.password === DEMO_USER.password) {
          return { id: DEMO_USER.id, name: DEMO_USER.name, email: DEMO_USER.email };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) session.user.id = token.id as string;
      return session;
    },
  },
};
