import NextAuth from 'next-auth'
import GitHubProvider from 'next-auth/providers/github'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import { MongoClient } from 'mongodb'

const client = new MongoClient(process.env.MONGODB_URI!)
const clientPromise = client.connect()

const handler = NextAuth({
    providers: [
        GitHubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
        }),
    ],
    adapter: MongoDBAdapter(clientPromise),
    session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
})

export { handler as GET, handler as POST }
