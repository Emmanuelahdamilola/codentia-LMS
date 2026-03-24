// PATH: src/auth.ts
import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error:  '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.password) return null

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!passwordMatch) return null

        return {
          id:            user.id,
          name:          user.name,
          email:         user.email,
          role:          user.role,
          image:         user.image,
          // Store as boolean — Date objects don't survive JWT serialization reliably
          emailVerified: user.emailVerified !== null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role          = (user as any).role
        token.id            = user.id
        // emailVerified is now a boolean: true = verified, false = not verified
        token.emailVerified = (user as any).emailVerified as boolean
      }

      // Re-fetch from DB on token refresh so verification is picked up immediately
      if (trigger === 'update' || (!user && token.id)) {
        const dbUser = await prisma.user.findUnique({
          where:  { id: token.id as string },
          select: { emailVerified: true, role: true },
        })
        if (dbUser) {
          token.emailVerified = dbUser.emailVerified !== null
          token.role          = dbUser.role
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id            = token.id            as string
        session.user.role          = token.role          as Role
        // Pass through as boolean for session consumers
        session.user.emailVerified = token.emailVerified as any
      }
      return session
    },
  },
})