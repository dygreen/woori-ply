import { getServerSession, Session } from 'next-auth'
import { GET as GET_SESSION } from '@/app/api/auth/[...nextauth]/route'
import { NextResponse } from 'next/server'
import * as Ably from 'ably'

export async function GET() {
    const session: Session | null = await getServerSession(GET_SESSION)
    if (!session?.user?.name)
        return NextResponse.json(
            { message: '로그인이 필요한 서비스입니다.' },
            { status: 401 },
        )

    const rest = new Ably.Rest(process.env.ABLY_API_KEY!)
    const tokenRequest = await rest.auth.createTokenRequest({
        clientId: session.user.name,
        capability: { 'room:*': ['subscribe', 'publish', 'presence'] },
    })

    return NextResponse.json(tokenRequest)
}
