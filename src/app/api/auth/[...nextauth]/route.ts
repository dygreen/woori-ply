import NextAuth from 'next-auth'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import { Db, WithId, Document, MongoClient } from 'mongodb'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

interface UserCred extends Document {
    _id: string
    email: string
    password: string
}

const client = new MongoClient(process.env.MONGODB_URI!)
const clientPromise = client.connect()

const handler = NextAuth({
    providers: [
        GitHubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
        }),
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: {
                    label: '이메일',
                    type: 'text',
                    placeholder: 'john12@domain.com',
                },
                password: { label: '비밀번호', type: 'password' },
            },
            authorize: async (
                credentials: Record<'email' | 'password', string> | undefined,
                _req,
            ) => {
                if (!credentials) return null
                const { email, password } = credentials

                const database: Db = await db()
                const user: WithId<UserCred> | null = await database
                    .collection<UserCred>('user_cred')
                    .findOne({ email })

                if (!user) return null

                const ok = await bcrypt.compare(password, user.password)
                if (!ok) return null

                return {
                    ...user,
                    id: String(user._id),
                }
            },
        }),
    ],
    adapter: MongoDBAdapter(clientPromise),
    session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
})

export { handler as GET, handler as POST }
