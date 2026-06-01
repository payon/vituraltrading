/**
 * NextAuth 설정
 * - 이메일/비밀번호 인증
 * - JWT 세션 사용 (Prisma Adapter 없이)
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      language: string;
      theme: string;
      investmentStyle?: string | null;
      initialBalance: number;
      currentBalance: number;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    language: string;
    theme: string;
    investmentStyle?: string | null;
    initialBalance: number;
    currentBalance: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name?: string | null;
    language: string;
    theme: string;
    investmentStyle?: string | null;
    initialBalance: number;
    currentBalance: number;
  }
}

export const authOptions: NextAuthOptions = {
  // JWT 세션 사용 - Prisma Adapter 불필요
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: '이메일', type: 'email' },
        password: { label: '비밀번호', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          language: user.language,
          theme: user.theme,
          investmentStyle: user.investmentStyle,
          initialBalance: user.initialBalance,
          currentBalance: user.currentBalance,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.language = user.language;
        token.theme = user.theme;
        token.investmentStyle = user.investmentStyle;
        token.initialBalance = user.initialBalance;
        token.currentBalance = user.currentBalance;
      }

      // 세션 업데이트 시
      if (trigger === 'update' && session) {
        if (session.name) token.name = session.name;
        if (session.language) token.language = session.language;
        if (session.theme) token.theme = session.theme;
        if (session.investmentStyle) token.investmentStyle = session.investmentStyle;
        if (session.initialBalance !== undefined) token.initialBalance = session.initialBalance;
        if (session.currentBalance !== undefined) token.currentBalance = session.currentBalance;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.language = token.language;
        session.user.theme = token.theme;
        session.user.investmentStyle = token.investmentStyle;
        session.user.initialBalance = token.initialBalance;
        session.user.currentBalance = token.currentBalance;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email}`);
    },
    async signOut({ token }) {
      console.log(`User signed out: ${token?.email}`);
    },
  },
  debug: process.env.NODE_ENV === 'development',
};
