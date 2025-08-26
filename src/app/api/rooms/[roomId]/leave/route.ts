import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { GET as authOptions } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/server/db'
import { RoomMember } from '@/types'
import * as Ably from 'ably'
import { closeRoomInDBAndNotify } from '@/lib/server/room'

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ roomId: string }> },
) {
    const session: any = await getServerSession(authOptions)
    const email = session?.user?.email
    if (!email)
        return NextResponse.json(
            { message: '로그인이 필요한 서비스입니다.' },
            { status: 401 },
        )

    const { roomId } = await params
    const database = await db()
    const members = database.collection<RoomMember>('room_members')

    await members.updateOne(
        { roomId, userId: email },
        { $set: { active: false, leftAt: new Date() } },
    )

    // Ably REST로 현재 presence 확인
    const ably = new Ably.Rest(process.env.ABLY_API_KEY!)
    const channel = ably.channels.get(`room:${roomId}`)
    const page = await channel.presence.get({ limit: 1 })
    const noOneLeft = page.items.length === 0

    if (noOneLeft) {
        await closeRoomInDBAndNotify(roomId)
    }

    return NextResponse.json({ ok: true })
}
