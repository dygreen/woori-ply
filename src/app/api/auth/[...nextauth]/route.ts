import NextAuth from 'next-auth'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import { Db, WithId, Document, MongoClient } from 'mongodb'
import { db } from '@/lib/server/db'
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
            // 이메일 비공개 대비: 유저 이메일 받으려면 권장
            authorization: { params: { scope: 'read:user user:email' } },
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
    callbacks: {
        // Github 로그인 유저 정보 DB 저장
        async signIn({ user, account, profile }) {
            if (account?.provider !== 'github') return true

            const database: Db = await db()
            const users = database.collection<UserCred>('user_cred')
            const githubId = account.providerAccountId
            const name = user.name ?? profile?.name ?? null
            const email = user.email ?? profile?.email ?? undefined

            // 이메일이 없을 수도 있으니 email OR githubId로 식별
            const filter = email
                ? { $or: [{ email }, { githubId }] }
                : { githubId }
            const now = new Date()

            await users.updateOne(
                filter,
                {
                    $setOnInsert: { createdAt: now },
                    $set: {
                        githubId,
                        name,
                        email,
                        updatedAt: now,
                    },
                },
                { upsert: true },
            )

            return true
        },
        async jwt({ token, user }) {
            if (user) {
                token.user = {
                    name: user.name,
                    email: user.email,
                }
            }
            return token
        },
        async session({ session, token }) {
            if (token.user) {
                session.user = token.user
            }
            return session
        },
        async redirect({ url, baseUrl }) {
            // 상대경로면 baseUrl에 붙여 허용
            if (url.startsWith('/')) return `${baseUrl}${url}`
            // 같은 오리진이면 허용
            const u = new URL(url)
            if (u.origin === baseUrl) return url
            // 그 외에는 홈으로
            return baseUrl
        },
    },
})

export { handler as GET, handler as POST }
