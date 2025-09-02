import { getServerSession, Session } from 'next-auth'
import { GET as authOptions } from '@/app/api/auth/[...nextauth]/route'
import { NextResponse } from 'next/server'
import * as Ably from 'ably'

export async function GET() {
    const session: Session | null = await getServerSession(authOptions)
    if (!session?.user?.email)
        return NextResponse.json(
            { message: '로그인이 필요한 서비스입니다.' },
            { status: 401 },
        )

    const rest = new Ably.Rest(process.env.ABLY_API_KEY!)
    const tokenRequest = await rest.auth.createTokenRequest({
        clientId: session.user.email,
        capability: {
            'room:*': ['subscribe', 'publish', 'presence', 'history'],
        },
        ttl: 60 * 60 * 1000,
    })

    return NextResponse.json(tokenRequest)
}
