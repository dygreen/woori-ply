import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { GET as authOptions } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/server/db'
import { ObjectId } from 'mongodb'
import { Room, RoomMember, RoomRole } from '@/types'

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
    const rooms = database.collection<Room>('rooms')
    const members = database.collection<RoomMember>('room_members')
    const room = await rooms.findOne({ roomId: roomId })

    if (!room)
        return NextResponse.json({ message: 'Room not found' }, { status: 404 })

    const role: RoomRole = room.ownerId === email ? 'HOST' : 'GUEST'
    const now = new Date()

    // upsert: 있으면 갱신, 없으면 추가
    await members.updateOne(
        { roomId: roomId, userId: email },
        {
            $set: {
                role,
                lastSeenAt: now,
                active: true,
                userName: session?.user?.name,
            },
            $setOnInsert: { _id: new ObjectId(), joinedAt: now },
        },
        { upsert: true },
    )

    await rooms.updateOne(
        { roomId },
        {
            $addToSet: { memberOrder: session?.user?.name }, // 중복 방지
        },
    )

    return NextResponse.json({ ok: true, role, state: room.state })
}
